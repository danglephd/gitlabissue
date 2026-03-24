/**
 * YouTube Video DTO Models
 */

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeThumbnails {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

export interface YouTubeSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  categoryId: string;
  liveBroadcastContent: string;
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
  localized?: {
    title: string;
    description: string;
  };
}

export interface YouTubeContentDetails {
  duration: string; // ISO 8601 format, e.g., "PT4M11S"
  dimension: string;
  definition: string;
}

export interface YouTubeStatistics {
  viewCount: string;
  likeCount?: string;
  dislikeCount?: string;
  favoriteCount: string;
  commentCount: string;
}

export interface YouTubeVideo {
  kind: string;
  etag: string;
  id: string;
  snippet: YouTubeSnippet;
  contentDetails?: YouTubeContentDetails;
  statistics?: YouTubeStatistics;
}

export interface YouTubeApiResponse {
  kind: string;
  etag: string;
  items: YouTubeVideo[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

/**
 * Formatted YouTube Video Info DTO
 * Used for display in the application
 */
export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  description: string;
  channel: string;
  channelId: string;
  publishedAt: string;
  categoryId: string;
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
  thumbnails: YouTubeThumbnails;
  duration: string; // ISO 8601 format
  durationSeconds?: number; // Parsed seconds
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  liveBroadcastContent: string;
}
