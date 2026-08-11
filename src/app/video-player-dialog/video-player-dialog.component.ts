import { Component, Inject, OnDestroy, OnInit, ViewChild, ElementRef, NgZone, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Song } from '../shared/models/song.model';

export interface VideoPlayerDialogData {
  song: Song;
  songList: Song[];
  currentIndex: number;
  autoPlayNext?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

@Component({
  selector: 'app-video-player-dialog',
  templateUrl: './video-player-dialog.component.html',
  styleUrls: ['./video-player-dialog.component.css']
})
export class VideoPlayerDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('youtubePlayerContainer', { static: false }) playerContainer!: ElementRef;

  player: any = null;
  isLoadingVideo = true;
  autoPlayNext: boolean = true;
  isInitialized = false;

  constructor(
    public dialogRef: MatDialogRef<VideoPlayerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VideoPlayerDialogData,
    private ngZone: NgZone
  ) {
    this.autoPlayNext = data.autoPlayNext !== false;
    // this.loadYouTubeAPI();
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initializePlayer();
  }

  /**
   * Load YouTube Iframe API script
   */
  private loadYouTubeAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.YT?.Player) {
        resolve();
        return;
      }
      // Another component/dialog may already be loading the API. 
      if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const previousCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          previousCallback?.();
          resolve();
        };
        return;
      }
      // First component that loads the API. 
      window.onYouTubeIframeAPIReady = () => { resolve(); };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      // script.defer = true;
      script.onerror = () => { reject(new Error('Failed to load YouTube IFrame API')); };
      document.body.appendChild(script);
    });
  }

  /**
   * Initialize YouTube player with API
   */
  private async initializePlayer(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!this.playerContainer) {
      //ghi log error or handle the case where playerContainer is not available
      console.error('Player container is not available.');
      return;
    }

    try {
      // IMPORTANT: 
      // Wait until YT.Player is actually available.
      await this.loadYouTubeAPI();

      if (!window.YT?.Player) {
        throw new Error('YouTube IFrame API loaded, but YT.Player is not available.');
      }

      if (this.isInitialized) {
        return;
      }

      this.ngZone.runOutsideAngular(() => {
        this.player = new window.YT.Player(this.playerContainer.nativeElement, {
          height: '100%',
          width: '100%',
          events: {
            onReady: () => this.onPlayerReady(),
            onStateChange: (event: any) => this.onPlayerStateChange(event),
          },
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            fs: 1,
          }
        });
        this.isInitialized = true;
      });
    } catch (error) {
      console.error('Error initializing YouTube player:', error);
      setTimeout(() => this.initializePlayer(), 500);
    }
  }

  /**
   * Handle player ready
   */
  private onPlayerReady(): void {
    this.isLoadingVideo = false;
    const startIndex = this.data.currentIndex;
    const videoIds = this.data.songList
      .filter(song => !!song.videoId)
      .map(song => song.videoId);
    // giới hạn playlist chỉ còn 50 videos trước và 50 videos sau tính từ currentIndex
    const maxPlaylistSize = 10;
    const halfSize = Math.floor(maxPlaylistSize / 2);
    const start = Math.max(0, startIndex - halfSize);
    const end = Math.min(videoIds.length, startIndex + halfSize + 1);
    const limitedVideoIds = videoIds.slice(start, end);
    
    const index = Math.max(0, startIndex - start);
    //show log for debugging
    console.log('Player ready, playing video:', this.data.song.videoId, 'with playlist:', limitedVideoIds, 'starting at index:', index);

    this.player.loadPlaylist({
      playlist: limitedVideoIds,
      index: index , // Adjust index to match the limited playlist
      startSeconds: 0
    });
  }

  /**
   * Handle player state change - Detect when video ends
   */
  private onPlayerStateChange(event: any): void {
    this.ngZone.run(() => {
      if (event.data === window.YT.PlayerState.PLAYING) {
        this.data.currentIndex = this.player.getPlaylistIndex();
        //show log for debugging
        console.log('Video playing, current index:', this.data.currentIndex);
      }
    });
  }

  /**
   * Close dialog manually
   */
  closeDialog(): void {
    this.dialogRef.close(null);
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    if (this.player && this.isInitialized) {
      try {
        this.player.destroy();
      } catch (error) {
        console.error('Error destroying player:', error);
      }
    }
    this.player = null;
  }
}
