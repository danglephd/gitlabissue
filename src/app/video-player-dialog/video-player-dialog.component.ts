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
    this.loadYouTubeAPI();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializePlayer();
    }, 100);
  }

  /**
   * Load YouTube Iframe API script
   */
  private loadYouTubeAPI(): void {
    if (window.YT) {
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }

  /**
   * Initialize YouTube player with API
   */
  private initializePlayer(): void {
    if (!window.YT || !this.playerContainer) {
      setTimeout(() => this.initializePlayer(), 100);
      return;
    }

    if (this.isInitialized) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      try {
        this.player = new window.YT.Player(this.playerContainer.nativeElement, {
          height: '100%',
          width: '100%',
          videoId: this.data.song.videoId,
          events: {
            onReady: () => this.onPlayerReady(),
            onStateChange: (event: any) => this.onPlayerStateChange(event),
            onError: (event: any) => this.onPlayerError(event)
          },
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            fs: 1
          }
        });
        this.isInitialized = true;
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
        setTimeout(() => this.initializePlayer(), 500);
      }
    });
  }

  /**
   * Handle player ready
   */
  private onPlayerReady(): void {
    this.isLoadingVideo = false;
    // console.log('Player ready, playing video:', this.data.song.videoId);
  }

  /**
   * Handle player state change - Detect when video ends
   */
  private onPlayerStateChange(event: any): void {
    this.ngZone.run(() => {
      if (event.data === window.YT.PlayerState.ENDED) {
        // console.log('Video ended, finding next song');
        this.playNextSong();
      }
    });
  }

  /**
   * Handle player error
   */
  private onPlayerError(event: any): void {
    console.error('YouTube player error:', event.data);
    if (event.data === 150) {
      this.playNextSong();
    }
  }

  /**
   * Find next valid song and close dialog to reopen with new song
   */
  private playNextSong(): void {
    const nextSong = this.findNextValidSong();
    
    if (nextSong) {
    //   console.log('Closing dialog to reopen with next song:', nextSong.title);
      // Close dialog with next song data
      // Add small delay for smoother transition
      setTimeout(() => {
        this.dialogRef.close(nextSong);
      }, 300);
    } else {
    //   console.log('No more songs to play');
      // Option: stop playback
      this.dialogRef.close(null);
    }
  }

  /**
   * Find next valid song in the list
   */
  private findNextValidSong(): Song | null {
    const currentIndex = this.data.currentIndex;
    const songList = this.data.songList;

    // Look for next valid song after current index
    for (let i = currentIndex + 1; i < songList.length; i++) {
      if (songList[i]?.videoId) {
        return songList[i];
      }
    }

    // If autoPlayNext is enabled, loop back to start
    if (this.autoPlayNext) {
      for (let i = 0; i <= currentIndex; i++) {
        if (songList[i]?.videoId) {
          return songList[i];
        }
      }
    }

    return null;
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
