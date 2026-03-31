import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { YouTubeService } from '../services/youtube.service';
import { YouTubeVideoInfo } from '../models/youtube.model';
import { Song } from '../shared/models/song.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-add-youtube-song-dialog',
  templateUrl: './add-youtube-song-dialog.component.html',
  styleUrls: ['./add-youtube-song-dialog.component.css']
})
export class AddYouTubeSongDialogComponent implements OnInit, OnDestroy {
  // Tab A - Single Song
  youtubeUrl: string = '';
  isLoading: boolean = false;
  videoInfo: YouTubeVideoInfo | null = null;
  errorMessage: string = '';
  isUrlValid: boolean = false;
  isAdding: boolean = false;
  isDescriptionExpanded: boolean = false;

  // Tab B - Multiple Songs
  videoIdsTextarea: string = '';
  multipleVideos: YouTubeVideoInfo[] = [];
  selectedVideoIds: Set<string> = new Set();
  isLoadingMultiple: boolean = false;
  errorMessageMultiple: string = '';
  isAddingMultiple: boolean = false;
  selectAllChecked: boolean = false;

  private destroy$ = new Subject<void>();
  private urlSubject = new Subject<string>();
  private readonly MAX_VIDEO_IDS = 50;

  constructor(
    private youTubeService: YouTubeService,
    public dialogRef: MatDialogRef<AddYouTubeSongDialogComponent>,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Setup URL validation with debounce
    this.urlSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((url: string) => {
      if (url) {
        this.validateAndFetchVideo(url);
      } else {
        this.clearVideoInfo();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle URL paste event
   */
  onUrlPaste(event: any): void {
    const pastedText = event.target.value;
    if (pastedText) {
      this.urlSubject.next(pastedText);
    }
  }

  /**
   * Validate YouTube URL and fetch video information
   */
  private validateAndFetchVideo(url: string): void {
    // Basic YouTube URL validation
    if (!this.isValidYouTubeUrl(url)) {
      this.errorMessage = 'Invalid YouTube URL';
      this.isUrlValid = false;
      this.videoInfo = null;
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.isUrlValid = false;

    this.youTubeService.getVideoInfo(url)
      .then((videoInfo: YouTubeVideoInfo) => {
        this.videoInfo = videoInfo;
        this.isUrlValid = true;
        this.errorMessage = '';
        this.isLoading = false;
      })
      .catch((error: any) => {
        console.error('Error fetching video info:', error);
        this.errorMessage = 'Failed to fetch video information';
        this.videoInfo = null;
        this.isUrlValid = false;
        this.isLoading = false;
      });
  }

  /**
   * Validate if URL is a valid YouTube URL (desktop, mobile, youtu.be)
   */
  private isValidYouTubeUrl(url: string): boolean {
    if (!url) return false;
    
    // Matches: youtube.com, www.youtube.com, m.youtube.com, youtu.be, youtube-nocookie.com
    const youtubeRegex = /^(https?:\/\/)?(www\.|m\.)?(?:youtube|youtu|youtube-nocookie)\.(?:com|be)\//;
    const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/;

    // Check if it's a full URL
    if (youtubeRegex.test(url)) {
      return true;
    }

    // Check if it's a direct video ID
    if (videoIdRegex.test(url)) {
      return true;
    }

    return false;
  }

  /**
   * Clear video information
   */
  private clearVideoInfo(): void {
    this.videoInfo = null;
    this.errorMessage = '';
    this.isUrlValid = false;
    this.isDescriptionExpanded = false;
  }

  /**
   * Get the highest resolution thumbnail
   */
  getThumbnailUrl(): string {
    if (!this.videoInfo) return '';

    // Try to get the highest resolution thumbnail available
    if (this.videoInfo.thumbnails.maxres) {
      return this.videoInfo.thumbnails.maxres.url;
    }
    if (this.videoInfo.thumbnails.standard) {
      return this.videoInfo.thumbnails.standard.url;
    }
    if (this.videoInfo.thumbnails.high) {
      return this.videoInfo.thumbnails.high.url;
    }
    if (this.videoInfo.thumbnails.medium) {
      return this.videoInfo.thumbnails.medium.url;
    }
    if (this.videoInfo.thumbnails.default) {
      return this.videoInfo.thumbnails.default.url;
    }

    return '';
  }

  /**
   * Format publish date
   */
  getFormattedDate(): string {
    if (!this.videoInfo?.publishedAt) return '';
    return new Date(this.videoInfo.publishedAt).toLocaleDateString('vi-VN');
  }

  /**
   * Format view count to readable format
   */
  getReadableViewCount(): string {
    if (!this.videoInfo?.viewCount) return '0';
    const viewCount = this.videoInfo.viewCount;
    if (viewCount >= 1000000) {
      return (viewCount / 1000000).toFixed(1) + 'M';
    }
    if (viewCount >= 1000) {
      return (viewCount / 1000).toFixed(1) + 'K';
    }
    return viewCount.toString();
  }

  /**
   * Get description preview (first 200 chars)
   */
  getDescriptionPreview(): string {
    if (!this.videoInfo?.description) return '';
    return this.videoInfo.description.substring(0, 200);
  }

  /**
   * Get full description
   */
  getFullDescription(): string {
    return this.videoInfo?.description || '';
  }

  /**
   * Toggle description expansion
   */
  toggleDescriptionExpansion(): void {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  /**
   * Check if description needs expand button
   */
  shouldShowExpandButton(): boolean {
    if (!this.videoInfo?.description) {
      return false;
    }
    return this.videoInfo.description.length > 200;
  }

  /**
   * Add the video to database (to be implemented in parent component)
   */
  onAddButtonClick(): void {
    if (!this.isUrlValid || !this.videoInfo) {
      this.snackBar.open('Vui lòng nhập URL YouTube hợp lệ', 'Đóng', { duration: 3000 });
      return;
    }

    this.isAdding = true;
    
    // Emit result to parent component with video info
    this.dialogRef.close({
      videoInfo: this.videoInfo,
      youtubeUrl: this.youtubeUrl
    });
  }

  // ======================== TAB B - MULTIPLE SONGS ========================

  /**
   * Parse video IDs from textarea
   * Removes empty lines, trims spaces, deduplicates
   */
  private parseVideoIds(): string[] {
    return this.videoIdsTextarea
      .split('\n')
      .map(id => id.trim())
      .filter(id => id.length > 0 && id.length === 11) // YouTube IDs are 11 characters
      .filter((id, index, self) => self.indexOf(id) === index); // Deduplicate
  }

  /**
   * Validate video IDs
   */
  private validateVideoIds(videoIds: string[]): boolean {
    if (videoIds.length === 0) {
      this.errorMessageMultiple = 'Vui lòng nhập ít nhất một ID video';
      return false;
    }

    if (videoIds.length > this.MAX_VIDEO_IDS) {
      this.errorMessageMultiple = `Tối đa ${this.MAX_VIDEO_IDS} video trên một lần`;
      return false;
    }

    return true;
  }

  /**
   * Fetch multiple videos from YouTube API
   */
  onFetchMultipleVideos(): void {
    this.errorMessageMultiple = '';
    const videoIds = this.parseVideoIds();

    if (!this.validateVideoIds(videoIds)) {
      return;
    }

    this.isLoadingMultiple = true;
    this.multipleVideos = [];
    this.selectedVideoIds.clear();
    this.selectAllChecked = false;

    this.youTubeService.getMultipleVideos(videoIds)
      .then((videos: YouTubeVideoInfo[]) => {
        this.multipleVideos = videos;
        this.isLoadingMultiple = false;

        if (this.multipleVideos.length === 0) {
          this.errorMessageMultiple = 'Không tìm thấy video nào';
        }
      })
      .catch((error: any) => {
        console.error('Error fetching multiple videos:', error);
        this.errorMessageMultiple = 'Lỗi khi tải video. Vui lòng kiểm tra IDs và thử lại.';
        this.multipleVideos = [];
        this.isLoadingMultiple = false;
      });
  }

  /**
   * Toggle selection for a single video
   */
  toggleSelectVideo(videoId: string): void {
    if (this.selectedVideoIds.has(videoId)) {
      this.selectedVideoIds.delete(videoId);
    } else {
      this.selectedVideoIds.add(videoId);
    }

    // Update selectAll checkbox state
    this.updateSelectAllState();
  }

  /**
   * Check if a video is selected
   */
  isVideoSelected(videoId: string): boolean {
    return this.selectedVideoIds.has(videoId);
  }

  /**
   * Toggle select all videos
   */
  toggleSelectAll(): void {
    if (this.selectAllChecked) {
      this.multipleVideos.forEach(video => {
        this.selectedVideoIds.add(video.videoId);
      });
    } else {
      this.selectedVideoIds.clear();
    }
  }

  /**
   * Update selectAll checkbox state based on selected items
   */
  private updateSelectAllState(): void {
    this.selectAllChecked = this.multipleVideos.length > 0 &&
      this.selectedVideoIds.size === this.multipleVideos.length;
  }

  /**
   * Remove a video from the list
   */
  removeVideoFromList(videoId: string): void {
    this.multipleVideos = this.multipleVideos.filter(v => v.videoId !== videoId);
    this.selectedVideoIds.delete(videoId);
    this.updateSelectAllState();
  }

  /**
   * Get selected videos
   */
  getSelectedMultipleVideos(): YouTubeVideoInfo[] {
    return this.multipleVideos.filter(v => this.selectedVideoIds.has(v.videoId));
  }

  /**
   * Convert YouTubeVideoInfo to Song model
   */
  private convertVideoToSong(videoInfo: YouTubeVideoInfo): Song {
    const youtubeLink = `https://www.youtube.com/watch?v=${videoInfo.videoId}`;

    return {
      id: this.generateUUID(),
      createdAt: Date.now(),
      videoId: videoInfo.videoId,
      title: videoInfo.title,
      youtubeLink: youtubeLink,
      channel: videoInfo.channel,
      largestThumbnail: this.getThumbnailUrlForVideo(videoInfo),
      durationSeconds: videoInfo.durationSeconds,
      viewCount: videoInfo.viewCount
    };
  }

  /**
   * Get highest resolution thumbnail for a video
   */
  getThumbnailUrlForVideo(videoInfo: YouTubeVideoInfo): string {
    if (videoInfo.thumbnails.maxres) return videoInfo.thumbnails.maxres.url;
    if (videoInfo.thumbnails.standard) return videoInfo.thumbnails.standard.url;
    if (videoInfo.thumbnails.high) return videoInfo.thumbnails.high.url;
    if (videoInfo.thumbnails.medium) return videoInfo.thumbnails.medium.url;
    if (videoInfo.thumbnails.default) return videoInfo.thumbnails.default.url;
    return '';
  }

  /**
   * Generate UUID for new songs
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Add selected multiple videos
   * Returns array of { videoInfo, youtubeUrl } objects, matching Tab A format
   */
  onAddMultipleButtonClick(): void {
    const selectedVideos = this.getSelectedMultipleVideos();

    if (selectedVideos.length === 0) {
      this.snackBar.open('Vui lòng chọn ít nhất một video', 'Đóng', { duration: 3000 });
      return;
    }

    this.isAddingMultiple = true;

    // Convert videos to same format as onAddButtonClick
    const result = selectedVideos.map(videoInfo => ({
      videoInfo: videoInfo,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoInfo.videoId}`
    }));

    // Emit result to parent component
    this.dialogRef.close(result);
  }

  /**
   * Close dialog without adding
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}


