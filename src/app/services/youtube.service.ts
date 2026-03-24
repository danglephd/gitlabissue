import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { YouTubeVideoInfo, YouTubeApiResponse } from '../models/youtube.model';

/**
 * Service for fetching YouTube video information
 */
@Injectable({
  providedIn: 'root'
})
export class YouTubeService {
  private readonly API_KEY = environment.youtube.apiKey;
  private readonly API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    if (!this.API_KEY) {
      console.warn('YouTube API key not configured in environment');
    }
  }

  /**
   * Parse ISO 8601 duration to seconds
   * e.g., "PT4M11S" -> 251
   */
  private parseDuration(duration: string): number {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);

    if (!matches) return 0;

    const hours = parseInt(matches[1] || '0', 10);
    const minutes = parseInt(matches[2] || '0', 10);
    const seconds = parseInt(matches[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Extract video ID from YouTube URL
   * Supports:
   * - https://www.youtube.com/watch?v=VIDEO_ID
   * - https://youtu.be/VIDEO_ID
   * - Direct video ID
   */
  private extractVideoId(url: string): string {
    try {
      // If it's already a video ID (no URL characters)
      if (!url.includes('/') && !url.includes('?')) {
        return url;
      }

      const urlObj = new URL(url);
      
      // Handle youtube.com
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v') || '';
      }

      // Handle youtu.be
      if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1);
      }

      return '';
    } catch (error) {
      console.error('Invalid URL:', url);
      return '';
    }
  }

  /**
   * Fetch YouTube video information
   * @param urlOrVideoId - Full YouTube URL or video ID
   * @returns Promise with complete video information
   */
  async getVideoInfo(urlOrVideoId: string): Promise<YouTubeVideoInfo> {
    try {
      // Validate input
      if (!urlOrVideoId || typeof urlOrVideoId !== 'string') {
        throw new Error('Invalid URL or video ID parameter');
      }

      if (!this.API_KEY) {
        throw new Error('YouTube API key not configured');
      }

      // Extract video ID
      const videoId = this.extractVideoId(urlOrVideoId);

      if (!videoId) {
        throw new Error('Could not extract valid video ID from URL');
      }

      // Construct API URL
      const apiUrl = `${this.API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${this.API_KEY}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`);
      }

      const data: YouTubeApiResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found on YouTube');
      }

      const item = data.items[0];
      const snippet = item.snippet;
      const contentDetails = item.contentDetails;
      const statistics = item.statistics;

      // Parse duration to seconds
      const durationSeconds = contentDetails?.duration
        ? this.parseDuration(contentDetails.duration)
        : 0;

      const videoInfo: YouTubeVideoInfo = {
        videoId: item.id,
        title: snippet.title,
        description: snippet.description,
        channel: snippet.channelTitle,
        channelId: snippet.channelId,
        publishedAt: snippet.publishedAt,
        categoryId: snippet.categoryId,
        defaultLanguage: snippet.defaultLanguage,
        defaultAudioLanguage: snippet.defaultAudioLanguage,
        thumbnails: snippet.thumbnails,
        duration: contentDetails?.duration || '',
        durationSeconds: durationSeconds,
        viewCount: parseInt(statistics?.viewCount || '0', 10),
        likeCount: statistics?.likeCount ? parseInt(statistics.likeCount, 10) : undefined,
        commentCount: statistics?.commentCount ? parseInt(statistics.commentCount, 10) : undefined,
        liveBroadcastContent: snippet.liveBroadcastContent
      };

      return videoInfo;
    } catch (error) {
      console.error('Error fetching YouTube video info:', error);
      throw error;
    }
  }

  /**
   * Get the highest resolution thumbnail URL
   */
  getThumbnailUrl(videoId: string): string {
    return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  }

  /**
   * Get multiple videos information
   * @param videoIds - Array of YouTube video IDs
   * @returns Promise array with video information
   */
  async getMultipleVideos(videoIds: string[]): Promise<YouTubeVideoInfo[]> {
    if (videoIds.length > 50) {
      throw new Error('Maximum 50 videos per request');
    }

    try {
      if (!this.API_KEY) {
        throw new Error('YouTube API key not configured');
      }

      const apiUrl = `${this.API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${this.API_KEY}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`YouTube API Error: ${response.status}`);
      }

      const data: YouTubeApiResponse = await response.json();

      return data.items.map(item => {
        const snippet = item.snippet;
        const contentDetails = item.contentDetails;
        const statistics = item.statistics;
        const durationSeconds = contentDetails?.duration
          ? this.parseDuration(contentDetails.duration)
          : 0;

        return {
          videoId: item.id,
          title: snippet.title,
          description: snippet.description,
          channel: snippet.channelTitle,
          channelId: snippet.channelId,
          publishedAt: snippet.publishedAt,
          categoryId: snippet.categoryId,
          defaultLanguage: snippet.defaultLanguage,
          defaultAudioLanguage: snippet.defaultAudioLanguage,
          thumbnails: snippet.thumbnails,
          duration: contentDetails?.duration || '',
          durationSeconds: durationSeconds,
          viewCount: parseInt(statistics?.viewCount || '0', 10),
          likeCount: statistics?.likeCount ? parseInt(statistics.likeCount, 10) : undefined,
          commentCount: statistics?.commentCount ? parseInt(statistics.commentCount, 10) : undefined,
          liveBroadcastContent: snippet.liveBroadcastContent
        };
      });
    } catch (error) {
      console.error('Error fetching multiple YouTube videos:', error);
      throw error;
    }
  }
}
