/**
 * Song Model - MINIMAL Configuration (Option 1)
 * Essential YouTube song information only
 */
export interface Song {
  // System Fields
  id: string;                    // Unique identifier (generated)
  createdAt: Date;              // When added to database
  deleted?: boolean;            // Soft delete flag (true = deleted, false/undefined = active)

  // Basic YouTube Info
  videoId: string;              // YouTube video ID (required)
  title: string;                // Song/Video title (required)
  youtubeLink: string;          // Full YouTube URL (required)
  channel: string;              // Channel name (required)

  // Media Elements
  largestThumbnail?: string;    // URL of largest thumbnail (video cover)
  durationSeconds?: number;     // Duration in seconds (e.g., 251)

  // Statistics
  viewCount?: number;           // Total views

  // Categorization
  tags?: string[];              // Custom tags for categorization (e.g., 'favorite', 'relaxing')
}

export enum SongFilterType {
  ALL = 'all'
}

/**
 * DTO for displaying song card - only essential fields for display
 */
export interface SongDisplayInfo {
  videoId: string;
  title: string;
  channel: string;
  youtubeLink: string;
  largestThumbnail?: string;
  viewCount?: number;
  durationSeconds?: number;
  tags?: string[];
}
