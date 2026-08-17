import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Song, SongFilterType } from '../shared/models/song.model';
import { SongRealtimedbService } from '../services/song.realtimedb.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AddYouTubeSongDialogComponent } from '../add-youtube-song-dialog/add-youtube-song-dialog.component';
import { VideoPlayerDialogComponent } from '../video-player-dialog/video-player-dialog.component';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';
import { TagSource, YouTubeVideoInfo } from '../models/youtube.model';
import { YoutubeTagService } from '../services/youtube-tag.service';

@Component({
  selector: 'app-my-songs',
  templateUrl: './my-songs.component.html',
  styleUrls: ['./my-songs.component.css']
})
export class MySongsComponent implements OnInit, AfterViewInit, OnDestroy {
  songs: Song[] = [];
  filteredSongs: Song[] = [];
  itemsToDisplay: Song[] = [];
  filterType: SongFilterType = SongFilterType.ALL;
  isLoading = false;
  searchQuery = '';
  selectedWords: { [key: string]: 'include' | 'exclude' | 'require'} = {};

  // Lazy loading properties
  pageSize = 20;
  displayedCount = 20;

  // Scroll to top properties
  showScrollToTopButton = false;

  // Mobile detection
  isMobileView = false;

  // Performance optimizations
  private isScrolling = false;
  private intersectionObserver: IntersectionObserver | null = null;
  private filterCache: Map<string, Song[]> = new Map();
  private lastSearchQuery = '';

  public SongFilterType = SongFilterType;

  private loadMoreTrigger!: ElementRef;

  @ViewChild('songsListContainer') songsListContainer!: ElementRef;
  @ViewChild('loadMoreTrigger')
  set loadMoreTriggerSetter(el: ElementRef) {
    if (el) {
      this.loadMoreTrigger = el;
      this.initializeIntersectionObserver();
    }
  }

  constructor(
    private songService: SongRealtimedbService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private youtubeTagService: YoutubeTagService
  ) { }

  ngOnInit(): void {
    this.loadSongs();
    this.detectMobileView();
  }

  ngAfterViewInit(): void {
    // Initialize IntersectionObserver for lazy loading moved to setter
  }

  ngOnDestroy(): void {
    // Clean up IntersectionObserver
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.filterCache.clear();
  }

  /**
   * Detect if device is in mobile view
   */
  @HostListener('window:resize', ['$event'])
  detectMobileView(): void {
    this.isMobileView = window.innerWidth < 768;
  }

  /**
   * Load songs from database
   */
  loadSongs(): void {
    this.isLoading = true;

    this.songService.getActiveSongs().subscribe(
      (songs: Song[]) => {
        // songs.forEach(song => {
        //   if (!song.tags || song.tags.length === 0) {
        //     this.ensureTagsForSong(song);
        //   }
        // });
        this.songs = songs || [];
        this.filterCache.clear(); // Clear cache when loading new data
        this.applyFilter();
        this.isLoading = false;
      },
      (error) => {
        this.showMessage('Error loading song list', 'error');
        this.isLoading = false;
      }
    );
  }

  /**
   * Apply filters based on current settings with caching
   */
  applyFilter(): void {
    // Check if filter params changed - if not, use cached result
    const cacheKey = this.getCacheKey();

    if (this.filterCache.has(cacheKey) &&
      this.lastSearchQuery === this.searchQuery) {
      this.filteredSongs = this.filterCache.get(cacheKey) || [];
      this.displayedCount = this.pageSize;
      this.itemsToDisplay = this.filteredSongs.slice(0, this.displayedCount);
      return;
    }

    // Perform filtering
    this.filteredSongs = this.filterBySearch(this.songs);
    //ghi log searchableText của tất cả các bài hát để debug
    // console.log('Filtered Songs:', this.filteredSongs.map(song => ({
    //   title: song.title,
    //   searchableText: song.searchableText
    // })));

    // Cache the result
    this.filterCache.set(cacheKey, [...this.filteredSongs]);
    this.lastSearchQuery = this.searchQuery;

    // Reset pagination
    this.displayedCount = this.pageSize;
    this.itemsToDisplay = this.filteredSongs.slice(0, this.displayedCount);
  }

  /**
   * Generate cache key from current filter params
   */
  private getCacheKey(): string {
    const wordState = Object.entries(this.selectedWords)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([word, status]) => `${word}:${status}`)
      .join('|');

    return `${this.searchQuery}|${wordState}`;
  }

  /**
   * Parse search query into words for filter chips
   */
  private getSearchWords(): string[] {
    const query = this.youtubeTagService.normalizeTag(this.searchQuery);

    if (!query) {
      return [];
    }

    return query
      .split(/\s+/)
      .map(word => word.trim())
      .filter(Boolean);
  }

  /**
   * Keep selected word filters synced with the current search query
   */
  private syncSelectedWordsFromQuery(): void {
    const words = this.getSearchWords();
    const nextSelectedWords: { [key: string]: 'include' | 'exclude' | 'require'} = {};

    words.forEach(word => {
      nextSelectedWords[word] = this.selectedWords[word] || 'include' || 'require';
    });

    this.selectedWords = nextSelectedWords;
  }

  /**
   * Toggle word filter status between include and exclude
   */
  toggleWordFilterStatus(word: string): void {
    if (this.selectedWords[word]) {
      if(this.selectedWords[word] === 'include') {
        this.selectedWords[word] = 'require';
      } else if(this.selectedWords[word] === 'require') {
        this.selectedWords[word] = 'exclude';
      } else {
        this.selectedWords[word] = 'include';
      }
    } else {
      this.selectedWords[word] = 'include';
    }

    this.filterCache.clear();
    this.applyFilter();
  }

  /**
   * Filter songs by search query
   */
  filterBySearch(songs: Song[]): Song[] {
    const words = this.getSearchWords();

    if (words.length === 0) {
      return songs;
    }

    const includeWords = Object.keys(this.selectedWords).filter(word => this.selectedWords[word] === 'include');
    const excludeWords = Object.keys(this.selectedWords).filter(word => this.selectedWords[word] === 'exclude');
    const requireWords = Object.keys(this.selectedWords).filter(word => this.selectedWords[word] === 'require');

    return songs.filter(song => {
      const searchableText = (song.searchableText || '').toLowerCase();

      if (excludeWords.some(word => searchableText.includes(word.toLowerCase()))) {
        return false;
      }

      if (requireWords.length > 0) {
        //searchableText must contain all requireWords
        return requireWords.every(word => searchableText.includes(word.toLowerCase()));
      }

      if (includeWords.length === 0) {
        return true;
      }

      return includeWords.some(word => searchableText.includes(word.toLowerCase()));
    });
  }

  /**
   * Search songs with cache invalidation
   */
  searchSongs(): void {
    this.syncSelectedWordsFromQuery();
    this.filterCache.clear(); // Invalidate cache on new search
    this.applyFilter();
  }

  /**
   * Clear search query and reapply filters
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.selectedWords = {};
    this.filterCache.clear(); // Invalidate cache
    this.applyFilter();
  }

  /**
   * Change filter type with cache invalidation
   */
  changeFilter(filterType: SongFilterType): void {
    this.filterType = filterType;
    this.filterCache.clear(); // Invalidate cache
    this.applyFilter();
  }

  /**
   * Get total count of songs
   */
  getTotalCount(): number {
    return this.songs.length;
  }

  /**
   * Delete a song
   */
  deleteSong(id: string): void {
    if (confirm('Are you sure you want to delete this song?')) {
      this.songService.deleteSong(id).then(() => {
        this.showMessage('Song deleted', 'success');
        // this.loadSongs(); // Reload songs to update the UI
      }).catch(() => {
        this.showMessage('Error deleting song', 'error');
      });
    }
  }

  /**
   * Initialize IntersectionObserver for efficient lazy loading
   * Replaces scroll event listener - more performant
   */
  private initializeIntersectionObserver(): void {
    if (!this.loadMoreTrigger) return;

    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '200px', // Start loading 200px before reaching the trigger
      threshold: 0.1
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isScrolling) {
          this.loadMoreItems();
        }
      });
    }, options);

    this.intersectionObserver.observe(this.loadMoreTrigger.nativeElement);
  }

  /**
   * Handle scroll to top button visibility
   */
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    this.showScrollToTopButton = window.scrollY > 300;
  }

  /**
   * Load more items for lazy loading with throttling
   * Prevents multiple simultaneous load calls
   */
  loadMoreItems(): void {
    // Prevent multiple simultaneous loads
    if (this.isScrolling || this.displayedCount >= this.filteredSongs.length) {
      return;
    }

    this.isScrolling = true;

    // Simulate small delay for smooth animation
    setTimeout(() => {
      const nextCount = Math.min(
        this.displayedCount + this.pageSize,
        this.filteredSongs.length
      );

      this.itemsToDisplay = this.filteredSongs.slice(0, nextCount);
      this.displayedCount = nextCount;

      this.isScrolling = false;
    }, 50);
  }

  /**
   * Scroll to top
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }



  /**
   * Show snack bar message
   */
  showMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [type]
    });
  }

  /**
   * Open Add YouTube Song Dialog
   */
  openAddYouTubeSongDialog(): void {
    const dialogRef = this.dialog.open(AddYouTubeSongDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'add-song-dialog-no-padding'
    });

    dialogRef.afterClosed().subscribe(async (result: any) => {
      if (!result) return;

      // Handle single song from Tab A: { videoInfo, youtubeUrl }
      if (result.videoInfo && !Array.isArray(result)) {
        await this.addSongToDatabase(result.videoInfo, result.youtubeUrl);
        return;
      }

      // Handle multiple songs from Tab B: [{ videoInfo, youtubeUrl }, ...]
      if (Array.isArray(result)) {
        let successCount = 0;
        let duplicateCount = 0;

        for (const item of result) {
          const isSuccess = await this.addSongToDatabase(item.videoInfo, item.youtubeUrl, true);
          if (isSuccess) {
            successCount++;
          } else {
            duplicateCount++;
          }
        }

        // Load songs once after all additions
        if (successCount > 0) {
          this.loadSongs();
        }

        // Show detailed message
        if (successCount > 0 && duplicateCount > 0) {
          this.showMessage(
            `Added ${successCount} songs. ${duplicateCount} songs already exist in the list.`,
            'info'
          );
        } else if (successCount > 0) {
          this.showMessage(`Successfully added ${successCount} songs`, 'success');
        } else if (duplicateCount > 0) {
          this.showMessage(`All ${duplicateCount} songs already exist in the list`, 'info');
        }
        return;
      }
    });
  }

  /**
   * Add song to database
   * @param videoInfo - YouTube video information
   * @param youtubeUrl - YouTube URL
   * @param isBatch - If true, suppresses individual success messages (parent handles messaging)
   * @returns boolean - true if song added successfully, false if duplicate
   */
  private async addSongToDatabase(videoInfo: YouTubeVideoInfo, youtubeUrl: string, isBatch: boolean = false): Promise<boolean> {
    // Check if song already exists (prevent duplicates)
    const existingSong = this.songs.find(s => s.videoId === videoInfo.videoId);
    if (existingSong) {
      if (!isBatch) {
        this.showMessage('This song already exists in the list', 'info');
      }
      return false;
    }

    // Generate tags for the video
    const tagResult = await this.generateTagsForVideo(videoInfo);

    const newSong: Song = {
      id: '', // Will be generated by the service
      videoId: videoInfo.videoId,
      title: videoInfo.title,
      youtubeLink: youtubeUrl,
      description: videoInfo.description,
      channel: videoInfo.channel,
      largestThumbnail: this.getHighestResolutionThumbnail(videoInfo.thumbnails),
      durationSeconds: videoInfo.durationSeconds,
      viewCount: videoInfo.viewCount,
      createdAt: Date.now(),
      localized: {
        title: videoInfo.localized?.title || videoInfo.title,
        description: videoInfo.localized?.description || videoInfo.description
      },
      // Store tags in multiple formats for different use cases
      tags: Object.keys(tagResult.approvedTags), // For backward compatibility and filtering
      approvedTags: tagResult.approvedTags,
      generatedTags: tagResult.generatedTags,
      searchableText: tagResult.searchableText
    };

    this.songService.addSong(newSong).then(() => {
      if (!isBatch) {
        this.showMessage('Song added successfully', 'success');
        this.loadSongs();
      }
    }).catch(() => {
      this.showMessage('Error adding song', 'error');
    });

    return true;
  }

  /**
   * Generate tags for a YouTube video based on its information
   * @param videoSourceTag - Object containing video information needed for tag generation 
   * @returns Promise with tag result containing approvedTags, generatedTags, and searchableText
   */
  private async generateTagsForVideo(videoSourceTag: TagSource) {
    return await this.youtubeTagService.generateVideoTags(videoSourceTag);
  }

  /**
   * Get the highest resolution thumbnail URL from YouTube thumbnails object
   * Prefers maxres > standard > high > medium > default
   */
  private getHighestResolutionThumbnail(thumbnails: any): string {
    if (!thumbnails) {
      return '';
    }
    return thumbnails.maxres?.url
      || thumbnails.standard?.url
      || thumbnails.high?.url
      || thumbnails.medium?.url
      || thumbnails.default?.url
      || '';
  }

  /**
   * Track by function for ngFor performance optimization
   */
  trackBySongId(index: number, song: Song): string {
    return song.id;
  }

  /**
   * Request notification permission from user
   * Handle all permission states: granted, denied, default
   */
  private requestNotificationPermission(): void {
    // Check if Notification API is supported
    if (!('Notification' in window)) {
      return; // Silent fail - browser doesn't support notifications
    }

    // Only request if permission not yet determined
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        /* Silently handle permission request rejection */
      });
    }
  }

  /**
   * Show browser notification when a video finishes
   * Handles permission states and provides fallback messaging
   * @param song - Song data to display in notification
   */
  private showEndNotification(song: Song): void {
    // Check if Notification API is supported
    if (!('Notification' in window)) {
      return; // Fallback: browser doesn't support notifications
    }

    // Check if notifications are permitted
    if (Notification.permission !== 'granted') {
      return; // Fallback: user hasn't granted permission
    }

    // Prevent duplicate notifications - create unique tag for this song
    const notificationTag = `song-ended-${song.id}`;

    // Create notification object
    const notificationOptions: NotificationOptions = {
      body: song.channel || 'YouTube',
      icon: song.largestThumbnail || '/assets/icons/default-icon.png',
      badge: '/assets/icons/notification-badge.png',
      tag: notificationTag, // Prevents duplicate notifications
      requireInteraction: true, // Keep notification visible until clicked
      data: {
        songId: song.id,
        videoId: song.videoId
      }
    };

    try {
      const notification = new Notification(
        `🎵 ${song.title || 'Video finished'}`,
        notificationOptions
      );

      // Handle notification click - focus the tab
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close notification after 10 seconds if user doesn't interact
      const autoCloseTimer = setTimeout(() => {
        notification.close();
      }, 30000);

      // Clear timer if user closes notification manually
      notification.onclose = () => {
        clearTimeout(autoCloseTimer);
      };
    } catch (error) {
      // Silent fail if notification creation fails
      console.debug('Notification creation failed:', error);
    }
  }

  /**
   * 
   * Generate tags if not already generated for a song 
   */
  async ensureTagsForSong(song: Song): Promise<void> {
    if (!song.tags || song.tags.length === 0) {
      let tagResult = await this.generateTagsForVideo({
        title: song.title,
        channel: song.channel,
        description: song.description,
        durationSeconds: song.durationSeconds
      });

      // Update song with generated tags for future use
      this.songService.updateSong(song.id, {
        tags: Object.keys(tagResult.approvedTags),
        approvedTags: tagResult.approvedTags,
        generatedTags: tagResult.generatedTags,
        searchableText: tagResult.searchableText
      }).catch(() => {
        // Silent fail - tagging is an enhancement, not critical
      });
    }
  }

  /**
   * Open video player dialog with YouTube Iframe API
   * Dialog will auto-close and reopen for next song when current finishes
   * Shows browser notification as fallback for inactive tabs
   * @param song - Song data to play
   */
  async openVideoPlayerDialog(song: Song): Promise<void> {
    if (!song.videoId) {
      this.showMessage('Video ID not available', 'error');
      return;
    }

    // // Ensure tags are generated for the song before opening the player
    // await this.ensureTagsForSong(song);

    // Request notification permission on first dialog open
    this.requestNotificationPermission();

    // Find current song index in displayed songs
    let currentIndex = this.filteredSongs.findIndex(s => s.id === song.id);

    // Open dialog with song, full list, and current index
    const dialogRef = this.dialog.open(VideoPlayerDialogComponent, {
      data: {
        song: song,
        songList: this.filteredSongs,
        currentIndex: currentIndex >= 0 ? currentIndex : 0,
        autoPlayNext: true
      },
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: '800px',
      panelClass: 'video-player-dialog-panel',
      disableClose: true,
      backdropClass: 'video-player-backdrop'
    });

    // Handle dialog close and auto-open next song
    dialogRef.afterClosed().subscribe((unavailableSong: Song | null) => {
      if (unavailableSong && unavailableSong.videoId) {
        // update tag: unavailable to song in database to prevent future attempts to play it
        unavailableSong.tags = unavailableSong.tags || [];
        if (!unavailableSong.tags.includes('unavailable')) {
          unavailableSong.tags.push('unavailable');
        }
        this.songService.updateSong(unavailableSong.id, {
          tags: unavailableSong.tags
        }).catch(() => {
          // Silent fail - tagging is an enhancement, not critical
        });
      }
    });
  }

  /**
   * Check if a song is marked as unavailable
   */
  isUnavailable(song: Song): boolean {
    return song.tags?.includes('unavailable') ?? false;
  }

  /**
   * Open YouTube video in a new tab
   */
  openYouTubeInNewTab(song: Song, event: Event): void {
    event.stopPropagation();
    if (song.youtubeLink) {
      window.open(song.youtubeLink, '_blank');
    }
  }

  /**
   * Open Settings Dialog to manage user preferences
   * Allows users to configure: shuffle, loop, and max playlist size
   */
  openSettingsDialog(): void {
    const dialogRef = this.dialog.open(SettingsDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.showMessage('Settings saved successfully', 'success');
      }
    });
  }
}
