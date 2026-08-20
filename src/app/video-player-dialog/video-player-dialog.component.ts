import { Component, Inject, OnDestroy, OnInit, ViewChild, ElementRef, NgZone, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Song } from '../shared/models/song.model';
import { SongRealtimedbService } from '../services/song.realtimedb.service';

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
  playingList: Song[] = [];
  private readonly maxPlaylistSize: number = 30;
  private playTimeout: ReturnType<typeof setTimeout> | null = null;
  private navigationDirection: 'next' | 'previous' | null = null;

  constructor(
    public dialogRef: MatDialogRef<VideoPlayerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VideoPlayerDialogData,
    private ngZone: NgZone,
    private songService: SongRealtimedbService
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
            onError: (event: any) => this.onPlayerError(event),
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

  private initPlaylist(): { videoIds: string[], startIndex: number } {
    const startIndex = this.data.currentIndex;
    const videoIds = this.data.songList
      .filter(song => !!song.videoId)
      .map(song => song.videoId);
    const halfSize = Math.floor(this.maxPlaylistSize / 2);
    const start = Math.max(0, startIndex - halfSize);
    const end = Math.min(videoIds.length, this.maxPlaylistSize + start);
    const limitedVideoIds = videoIds.slice(start, end);
    this.playingList = this.data.songList.slice(start, end);
    let adjustedStartIndex = 0;

    const currentSongId = this.data.songList[startIndex].videoId;
    const currentIndex = limitedVideoIds.indexOf(currentSongId);
    if (this.shuffleEnabled) {
      //Nếu shuffleEnabled là true thì shuffle playlist trừ current song
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
    } else {
      // Nếu shuffleEnabled là false thì giữ nguyên thứ tự và điều chỉnh startIndex
      adjustedStartIndex = limitedVideoIds.indexOf(currentSongId);
    }

    //ghi log for debugging
    // console.log('Limited video IDs for playlist:', limitedVideoIds);
    return { videoIds: limitedVideoIds, startIndex: adjustedStartIndex };
  }

  /**
   * Handle player ready
   */
  private onPlayerReady(): void {
    //ghi log for debugging
    console.log('YouTube player is ready.');
    this.startPlayTimeout();

    this.isLoadingVideo = false;

    // Thêm function để load playlist với giới hạn số lượng video
    const { videoIds: limitedVideoIds, startIndex } = this.initPlaylist();

    this.player.loadPlaylist({
      playlist: limitedVideoIds,
      index: startIndex, // Adjust index to match the limited playlist
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
      this.navigationDirection = 'next';

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
    //ghi log for debugging
    // console.log('Player state changed:', event.data);
    this.ngZone.run(() => {
      if (event.data === window.YT.PlayerState.PLAYING) {
        this.clearPlayTimeout();
        const videoData = this.player.getVideoData();
        const videoId = videoData?.video_id;
        // console.log('Current video Data:', videoData);
        // console.log('Current video ID:', videoId);

        // Update currentSong based on the videoId for UI 
        this.currentSong = this.playingList.find(song => song.videoId === videoId) || null;
        this.updateNavigation();
      }
    });
  }

  private clearPlayTimeout(): void {
    if (this.playTimeout !== null) {
      clearTimeout(this.playTimeout);
      this.playTimeout = null;
    }
  }
  /**
   * Update the current index in the playlist and determine navigation direction
   * This is important for handling errors and moving to the next or previous video correctly
  **/
  private updateNavigation(): void {
    const currentIndex = this.player.getPlaylistIndex();
    // ghi log for debugging
    // console.log('Current index in playlist:', currentIndex, this.data.currentIndex);
    if (currentIndex >= this.data.currentIndex) {
      this.navigationDirection = 'next';
    } else if (currentIndex < this.data.currentIndex) {
      this.navigationDirection = 'previous';
    }
    this.data.currentIndex = currentIndex;
  }

  //update tags unvailable for current song
  private updateCurrentSongTags(unavailableSong: Song | null): void {
    if (unavailableSong && unavailableSong.videoId) {
      // update tag: unavailable to song in database to prevent future attempts to play it
      unavailableSong.tags = unavailableSong.tags || [];
      if (!unavailableSong.tags.includes('unavailable')) {
        unavailableSong.tags.push('unavailable');
      }
      this.songService.updateSong(unavailableSong.id, {
        tags: unavailableSong.tags
      }).catch(() => {
        //ghi log error
        console.error(`Failed to update tags for unavailable song with ID: ${unavailableSong.id}`);
      });
    }else{
      console.warn('No unavailable song to update tags for.');
    }
  }

  private onPlayerError(event: any): void {
    console.log('YouTube player error:', event.data);
    const currentIndex = this.player.getPlaylistIndex();
    const currentSong = this.playingList[currentIndex] || null;
    this.updateCurrentSongTags(currentSong);

    this.updateNavigation();

    if ([100, 101, 150].includes(event.data)) {
      if (this.navigationDirection === 'next') {
        this.player.nextVideo();
      } else if (this.navigationDirection === 'previous') {
        this.player.previousVideo();
      }
    }
  }

  private startPlayTimeout(): void {
    this.clearPlayTimeout();

    this.playTimeout = setTimeout(() => {
      console.log('Video did not start playing within 5000ms. Moving to next song.');

      // close the dialog if the video doesn't start playing within 5 seconds
      this.closeDialog(this.data.song);

      this.playTimeout = null;
    }, 5000);
  }

  /**
   * Close dialog manually
   */
  closeDialog(song: Song | null): void {
    this.dialogRef.close(song);
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.clearPlayTimeout();

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
