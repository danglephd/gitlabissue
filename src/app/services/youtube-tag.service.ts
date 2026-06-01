/**
 * =========================================================
 * AUTO GENERATE VIDEO TAGS WITH MASTER TAG MANAGEMENT
 * =========================================================
 *
 * FEATURES:
 * ✅ Generate tags từ:
 *    - title
 *    - channel
 *    - hashtags trong description
 *
 * ✅ Normalize tags
 *    - lowercase
 *    - remove vietnamese accents
 *    - remove special chars
 *
 * ✅ Master tag list
 *    - auto create/update tags in Firebase
 *    - track usage count
 *
 * ✅ Auto-approve tags
 *    - all generated tags are auto-approved
 *    - synchronized with master database
 *
 * ✅ Searchable text generation
 *    - space-separated normalized tags
 *
 * =========================================================
 */

import { Observable, firstValueFrom } from "rxjs";
import { TagSource, YouTubeVideoInfo } from "../models/youtube.model";
import { Injectable } from "@angular/core";
import { MasterTag } from "../shared/models/tag.model";
import { AngularFireDatabase } from "@angular/fire/compat/database";

/**
 * Result of tag generation process
 */
export interface GeneratedTagResult {
    // All unique normalized tags generated from video info
    generatedTags: Record<string, boolean>;
    
    // Tags that are active in master database (auto-approved)
    approvedTags: Record<string, boolean>;
    
    // Space-separated normalized tags for search
    searchableText: string;
}

@Injectable({
    providedIn: 'root'
})
export class YoutubeTagService {

    private MASTER_TAGS: Record<string, MasterTag> = {};
    private masterTagsPath = '/master_tags';
    private isLoadingMasterTags = false;
    private masterTagsLoadedPromise: Promise<void> = Promise.resolve();

    constructor(private db: AngularFireDatabase) {
        console.log('[YoutubeTagService] Initializing service...');
        this.loadMasterTagsFromDatabase();
    }

    /**
     * Load master tags from Firebase Realtime Database
     * Subscribe to real-time updates
     */
    private loadMasterTagsFromDatabase(): void {
        if (this.isLoadingMasterTags) {
            return;
        }

        this.isLoadingMasterTags = true;

        this.masterTagsLoadedPromise = firstValueFrom(
            this.db.object<Record<string, MasterTag>>(this.masterTagsPath).valueChanges()
        ).then(tags => {
            this.MASTER_TAGS = tags || {};
            console.log('[YoutubeTagService] Master tags loaded:', Object.keys(this.MASTER_TAGS).length, 'tags');
            this.isLoadingMasterTags = false;
        }).catch(error => {
            console.warn('[YoutubeTagService] Error loading master tags:', error);
            this.MASTER_TAGS = {};
            this.isLoadingMasterTags = false;
        });

        // Subscribe to real-time updates
        this.db.object<Record<string, MasterTag>>(this.masterTagsPath)
            .valueChanges().subscribe(
                tags => {
                    this.MASTER_TAGS = tags || {};
                    console.log('[YoutubeTagService] Master tags updated:', Object.keys(this.MASTER_TAGS).length, 'tags');
                },
                error => {
                    console.warn('[YoutubeTagService] Error subscribing to master tags:', error);
                }
            );
    }

    /**
     * Get all master tags
     */
    getMasterTags(): Observable<Record<string, MasterTag> | null> {
        return this.db.object<Record<string, MasterTag>>(this.masterTagsPath).valueChanges();
    }

    /**
     * =========================================================
     * REMOVE VIETNAMESE ACCENTS
     * =========================================================
     */
    removeVietnameseTones(str = ""): string {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D");
    }

    /**
     * =========================================================
     * NORMALIZE TAG
     * =========================================================
     * Converts:
     * - to lowercase
     * - removes Vietnamese accents
     * - removes duplicate spaces
     * - removes special characters
     * - trims whitespace
     */
    normalizeTag(tag = ""): string {
        return this.removeVietnameseTones(tag)
            .toLowerCase()
            .replace(/[^\w\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    /**
     * =========================================================
     * EXTRACT HASHTAGS
     * =========================================================
     */
    extractHashtags(description = ""): string[] {
        const matches = description.match(/#([\p{L}\p{N}_]+)/gu) || [];

        return matches.map(tag =>
            tag.replace("#", "")
        );
    }

    /**
     * =========================================================
     * EXTRACT TAGS FROM TITLE
     * =========================================================
     */
    extractTagsFromTitle(title = ""): string[] {

        const separators = [
            "-",
            "|",
            ",",
            "(",
            ")",
            "[",
            "]"
        ];

        let text = title;

        separators.forEach(sep => {
            text = text.split(sep).join(" ");
        });

        text = text
            .replace(/ft\.?/gi, " ")
            .replace(/feat\.?/gi, " ");

        return text
            .split(/\s+/)
            .map(v => v.trim())
            .filter(v => v.length > 1);
    }

    /**
     * =========================================================
     * EXTRACT TAGS FROM CHANNEL
     * =========================================================
     */
    extractTagsFromChannel(channel = ""): string[] {

        const ignoredWords = [
            "official",
            "channel",
            "music",
            "tv"
        ];

        return channel
            .split(/\s+/)
            .map(v => this.normalizeTag(v))
            .filter(v =>
                v &&
                !ignoredWords.includes(v)
            );
    }

    /**
     * =========================================================
     * APPLY CATEGORY RULES
     * =========================================================
     */
    applyCategoryRules(text = ""): string[] {

        const normalizedText = this.normalizeTag(text);

        const rules = [
            {
                keyword: "remix",
                tag: "remix"
            },
            {
                keyword: "karaoke",
                tag: "karaoke"
            },
            {
                keyword: "live",
                tag: "live"
            },
            {
                keyword: "mv",
                tag: "mv"
            },
            {
                keyword: "rap",
                tag: "rap viet"
            },
            {
                keyword: "cai luong",
                tag: "cai luong"
            }
        ];

        const tags: string[] = [];

        for (const rule of rules) {
            if (normalizedText.includes(rule.keyword)) {
                tags.push(rule.tag);
            }
        }

        return tags;
    }

    /**
     * =========================================================
     * SYNC TAGS TO MASTER DATABASE
     * =========================================================
     * Auto-create or update master tags in Firebase
     * Increases usageCount for existing tags
     * Creates new master tags for unknown tags
     */
    private async syncTagsToMasterDatabase(tags: string[]): Promise<void> {
        // Wait for master tags to be loaded
        await this.masterTagsLoadedPromise;

        const updates: Record<string, any> = {};
        const now = Date.now();

        for (const tag of tags) {
            const tagId = this.generateTagId(tag);
            const existingTag = this.MASTER_TAGS[tagId];

            if (existingTag) {
                // Update existing tag: increment usageCount and update timestamp
                updates[`${this.masterTagsPath}/${tagId}/usageCount`] = (existingTag.usageCount || 0) + 1;
                updates[`${this.masterTagsPath}/${tagId}/updatedAt`] = now;
            } else {
                // Create new master tag
                const newMasterTag: MasterTag = {
                    id: tagId,
                    name: tag,
                    displayName: this.getDisplayName(tag),
                    active: true,
                    usageCount: 1,
                    createdAt: now,
                    updatedAt: now
                };

                updates[`${this.masterTagsPath}/${tagId}`] = newMasterTag;
                
                // Update local cache immediately
                this.MASTER_TAGS[tagId] = newMasterTag;
            }
        }

        // Apply all updates to database in one operation
        if (Object.keys(updates).length > 0) {
            try {
                await this.db.object('/').update(updates);
                console.log('[YoutubeTagService] Master tags synced:', Object.keys(updates).length, 'updates');
            } catch (error) {
                console.error('[YoutubeTagService] Error syncing master tags:', error);
            }
        }
    }

    /**
     * Generate tag ID from normalized tag name
     * Example: "rap viet" -> "rap_viet"
     */
    private generateTagId(tagName: string): string {
        return tagName.replace(/\s+/g, '_');
    }

    /**
     * Get display name from tag
     * Example: "rap viet" -> "Rap Việt" (capitalize first letter of each word)
     */
    private getDisplayName(tag: string): string {
        return tag
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Build searchable text from tags
     * Returns space-separated normalized tags for search functionality
     */
    private buildSearchableText(tags: string[]): string {
        return tags.join(' ');
    }

    /**
     * =========================================================
     * MAIN FUNCTION - GENERATE VIDEO TAGS
     * =========================================================
     */
    async generateVideoTags(videoInfo: TagSource): Promise<GeneratedTagResult> {
        console.log('[YoutubeTagService] Generating tags for video:', videoInfo?.title);

        const {
            title = "",
            channel = "",
            description = "",
            durationSeconds = 0
        } = videoInfo || {};
        console.log('[YoutubeTagService] Video info - Title:', title, 'Channel:', channel);

        let rawTags: string[] = [];

        /**
         * -----------------------------------------------------
         * Generate raw tags
         * -----------------------------------------------------
         */
        console.log('[YoutubeTagService] Extracting tags...');

        const tagsFromTitle = this.extractTagsFromTitle(title);
        rawTags.push(...tagsFromTitle);
        console.log('[YoutubeTagService] Tags from title:', tagsFromTitle);

        const tagsFromChannel = this.extractTagsFromChannel(channel);
        rawTags.push(...tagsFromChannel);
        console.log('[YoutubeTagService] Tags from channel:', tagsFromChannel);

        const hashtags = this.extractHashtags(description);
        rawTags.push(...hashtags);
        console.log('[YoutubeTagService] Hashtags from description:', hashtags);

        const categoryTags = this.applyCategoryRules(
            `${title} ${description}`
        );
        rawTags.push(...categoryTags);
        console.log('[YoutubeTagService] Category tags applied:', categoryTags);
        
        console.log('[YoutubeTagService] Raw tags before normalization:', rawTags.length, 'tags');

        /**
         * -----------------------------------------------------
         * Normalize + unique
         * -----------------------------------------------------
         */

        const normalizedTags = [
            ...new Set(
                rawTags
                    .map(tag => this.normalizeTag(tag))
                    .filter(Boolean)
            )
        ];
        console.log('[YoutubeTagService] After normalization:', normalizedTags.length, 'unique tags', normalizedTags);

        // thêm tag playlist nếu video dài hơn 10 phút (600 giây)
        if (durationSeconds && durationSeconds > 600) {
            normalizedTags.push("playlist");
            console.log('[YoutubeTagService] Added "playlist" tag for long video');
        }

        /**
         * -----------------------------------------------------
         * Auto-sync to master database
         * All generated tags are auto-approved and synced
         * -----------------------------------------------------
         */
        await this.syncTagsToMasterDatabase(normalizedTags);

        /**
         * -----------------------------------------------------
         * Build result objects
         * generatedTags and approvedTags are identical
         * because all tags are auto-approved
         * -----------------------------------------------------
         */
        
        const generatedTagsObject: Record<string, boolean> = {};
        const approvedTagsObject: Record<string, boolean> = {};

        for (const tag of normalizedTags) {
            generatedTagsObject[tag] = true;
            // Only include tags that are active in master database
            const tagId = this.generateTagId(tag);
            const masterTag = this.MASTER_TAGS[tagId];
            if (masterTag && masterTag.active) {
                approvedTagsObject[tag] = true;
            } else {
                // For new tags or inactive tags, still approve them (auto-acceptance)
                approvedTagsObject[tag] = true;
            }
        }

        /**
         * -----------------------------------------------------
         * searchableText
         * -----------------------------------------------------
         */

        const searchableText = this.buildSearchableText(normalizedTags);

        /**
         * -----------------------------------------------------
         * RETURN
         * -----------------------------------------------------
         */
        console.log('[YoutubeTagService] Final result - Generated:', Object.keys(generatedTagsObject).length, 'Approved:', Object.keys(approvedTagsObject).length);
        console.log('[YoutubeTagService] Approved tags:', Object.keys(approvedTagsObject));

        return {
            generatedTags: generatedTagsObject,
            approvedTags: approvedTagsObject,
            searchableText
        };
    }
}
