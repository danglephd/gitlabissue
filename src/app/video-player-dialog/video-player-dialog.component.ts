import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface VideoPlayerDialogData {
  videoId: string;
  title: string;
  channel: string;
}

@Component({
  selector: 'app-video-player-dialog',
  templateUrl: './video-player-dialog.component.html',
  styleUrls: ['./video-player-dialog.component.css']
})
export class VideoPlayerDialogComponent implements OnDestroy {
  videoUrl: SafeResourceUrl | null = null;

  constructor(
    public dialogRef: MatDialogRef<VideoPlayerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VideoPlayerDialogData,
    private sanitizer: DomSanitizer
  ) {
    this.loadVideo();
  }

  /**
   * Load YouTube video with autoplay enabled
   */
  private loadVideo(): void {
    if (!this.data?.videoId) {
      console.warn('Invalid video ID');
      return;
    }
    const url = `https://www.youtube.com/embed/${this.data.videoId}?autoplay=1`;
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Close dialog
   */
  closeDialog(): void {
    this.dialogRef.close();
  }

  /**
   * Stop video playback on component destroy
   */
  ngOnDestroy(): void {
    // Clear video URL to stop playback
    this.videoUrl = null;
  }
}
