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
  shuffleEnabled = false;
  loopEnabled = false;
  currentSong: Song | null = null;
  songList: Song[] = [];
  private readonly maxPlaylistSize: number = 30;


  constructor(
    public dialogRef: MatDialogRef<VideoPlayerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VideoPlayerDialogData,
    private ngZone: NgZone
  ) {
    this.autoPlayNext = data.autoPlayNext !== false;
    //load local storage settings
    const shuffleSetting = localStorage.getItem('shuffleEnabled');
    const loopSetting = localStorage.getItem('loopEnabled');
    const maxPlaylistSizeSetting = localStorage.getItem('maxPlaylistSize');
    if (!maxPlaylistSizeSetting) {
      localStorage.setItem('maxPlaylistSize', '30');
    }

    this.shuffleEnabled = shuffleSetting ? JSON.parse(shuffleSetting) : false;
    this.loopEnabled = loopSetting ? JSON.parse(loopSetting) : false;
    this.maxPlaylistSize = maxPlaylistSizeSetting ? parseInt(maxPlaylistSizeSetting, 10) : 30;
    this.currentSong = data.song;
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
  private initPlaylist(): string[] {
    
    const startIndex = this.data.currentIndex;

    const videoIds = this.data.songList
      .filter(song => !!song.videoId)
      .map(song => song.videoId);
    const halfSize = Math.floor(this.maxPlaylistSize / 2);
    const start = Math.max(0, startIndex - halfSize);
    const end = Math.min(videoIds.length, this.maxPlaylistSize + start);
    const limitedVideoIds = videoIds.slice(start, end);
    this.songList = this.data.songList.slice(start, end);

    // const index = Math.max(0, startIndex - start);
    //Nếu shuffleEnabled là true thì shuffle playlist trừ current song
    if (this.shuffleEnabled) {
      const currentSongId = this.data.songList[startIndex].videoId;
      const currentIndex = limitedVideoIds.indexOf(currentSongId);
      if (currentIndex !== -1) {
        // Remove the current song from the list
        limitedVideoIds.splice(currentIndex, 1);
        // Shuffle the remaining songs
        for (let i = limitedVideoIds.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [limitedVideoIds[i], limitedVideoIds[j]] = [limitedVideoIds[j], limitedVideoIds[i]];
        }
        // Add the current song back to the beginning
        limitedVideoIds.unshift(currentSongId);
      }
    }

    //ghi log for debugging
    console.log('Limited video IDs for playlist:', limitedVideoIds);
    return limitedVideoIds;
  } 

  /**
   * Handle player ready
   */
  private onPlayerReady(): void {
    this.isLoadingVideo = false;

    // Thêm function để load playlist với giới hạn số lượng video
    const limitedVideoIds = this.initPlaylist();

    this.player.loadPlaylist({
      playlist: limitedVideoIds,
      index: 0, // Adjust index to match the limited playlist
      startSeconds: 0
    });
    this.applyPlaybackSettings();
  }

  private applyPlaybackSettings(): void {
    if (!this.player) {
      return;
    }

    try {
      this.player.setLoop(this.loopEnabled);
    } catch (error) {
      console.warn('Unable to apply playback settings to YouTube player:', error);
    }
  }

  toggleShuffle(): void {
    this.shuffleEnabled = !this.shuffleEnabled;
    //save local storage
    localStorage.setItem('shuffleEnabled', JSON.stringify(this.shuffleEnabled));
    this.applyPlaybackSettings();
  }

  toggleLoop(): void {
    this.loopEnabled = !this.loopEnabled;
    //save local storage
    localStorage.setItem('loopEnabled', JSON.stringify(this.loopEnabled));
    this.applyPlaybackSettings();
  }

  /**
   * Handle player state change 
   */
  private onPlayerStateChange(event: any): void {
    this.ngZone.run(() => {
      //ghi log for debugging
      // console.log('Player state changed:', event.data);
      const shufflePlaylist = this.player.getPlaylist();
      this.data.currentIndex = this.player.getPlaylistIndex();
      const currentSongId = shufflePlaylist[this.data.currentIndex];
      this.currentSong = this.songList.find(song => song.videoId === currentSongId) || null;
      // if(this.shuffleEnabled) {
      //   //ghi log for debugging
      //   console.log('Current video ID after shuffle:', this.currentSong?.videoId);
      //   console.log('Current song title after shuffle:', this.currentSong?.title);
      //   console.log('Current index after shuffle:', this.data.currentIndex);
      //   console.log('Current playlist after shuffle:', shufflePlaylist);
      // }else{
      //   //ghi log for debugging
      //   console.log('Current video ID:', this.currentSong?.videoId);
      //   console.log('Current song title:', this.currentSong?.title);
      //   // console.log('Current index:', this.data.currentIndex);
      //   // console.log('Current playlist:', shufflePlaylist);
      // }
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
