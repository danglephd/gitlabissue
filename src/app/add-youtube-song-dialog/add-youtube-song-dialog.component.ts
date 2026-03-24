import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { YouTubeService } from '../services/youtube.service';
import { YouTubeVideoInfo } from '../models/youtube.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-add-youtube-song-dialog',
  templateUrl: './add-youtube-song-dialog.component.html',
  styleUrls: ['./add-youtube-song-dialog.component.css']
})
export class AddYouTubeSongDialogComponent implements OnInit, OnDestroy {
  youtubeUrl: string = '';
  isLoading: boolean = false;
  videoInfo: YouTubeVideoInfo | null = null;
  errorMessage: string = '';
  isUrlValid: boolean = false;
  isAdding: boolean = false;

  private destroy$ = new Subject<void>();
  private urlSubject = new Subject<string>();

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
   * Validate if URL is a valid YouTube URL
   */
  private isValidYouTubeUrl(url: string): boolean {
    if (!url) return false;
    
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//;
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

  /**
   * Close dialog without adding
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
