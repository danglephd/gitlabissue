import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Song, SongFilterType } from '../shared/models/song.model';
import { SongRealtimedbService } from '../services/song.realtimedb.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AddYouTubeSongDialogComponent } from '../add-youtube-song-dialog/add-youtube-song-dialog.component';
import { VideoPlayerDialogComponent } from '../video-player-dialog/video-player-dialog.component';
import { YouTubeVideoInfo } from '../models/youtube.model';

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
  selectedTags: { [key: string]: 'include' | 'exclude' } = {};
  
  // Lazy loading properties
  pageSize = 12;
  displayedCount = 12;
  
  // Scroll to top properties
  showScrollToTopButton = false;
  
  // Mobile detection
  isMobileView = false;

  // Performance optimizations
  private isScrolling = false;
  private intersectionObserver: IntersectionObserver | null = null;
  private filterCache: Map<string, Song[]> = new Map();
  private lastSearchQuery = '';
  private lastSelectedTags: { [key: string]: 'include' | 'exclude' } = {};

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
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadSongs();
    this.loadTagsFromLocalStorage();
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
        this.songs = songs || [];
        this.syncTagsToLocalStorage();
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
        this.lastSearchQuery === this.searchQuery &&
        JSON.stringify(this.lastSelectedTags) === JSON.stringify(this.selectedTags)) {
      this.filteredSongs = this.filterCache.get(cacheKey) || [];
      this.displayedCount = this.pageSize;
      this.itemsToDisplay = this.filteredSongs.slice(0, this.displayedCount);
      return;
    }

    // Perform filtering
    this.filteredSongs = this.filterBySearch(this.songs);
    this.filteredSongs = this.filterByTags(this.filteredSongs);
    
    // Cache the result
    this.filterCache.set(cacheKey, [...this.filteredSongs]);
    this.lastSearchQuery = this.searchQuery;
    this.lastSelectedTags = { ...this.selectedTags };
    
    // Reset pagination
    this.displayedCount = this.pageSize;
    this.itemsToDisplay = this.filteredSongs.slice(0, this.displayedCount);
  }

  /**
   * Generate cache key from current filter params
   */
  private getCacheKey(): string {
    return `${this.searchQuery}|${JSON.stringify(this.selectedTags)}`;
  }

  /**
   * Filter songs by search query
   */
  filterBySearch(songs: Song[]): Song[] {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      return songs;
    }

    const query = this.searchQuery.toLowerCase();
    return songs.filter(s =>
      (s.title?.toLowerCase().includes(query) || false) ||
      (s.channel?.toLowerCase().includes(query) || false)
    );
  }

  /**
   * Filter songs by tags
   */
  filterByTags(songs: Song[]): Song[] {
    const activeTags = Object.entries(this.selectedTags);
    if (activeTags.length === 0) {
      return songs;
    }

    return songs.filter(song => {
      const songTags = song.tags || [];
      return activeTags.every(([tag, type]) => {
        if (type === 'include') {
          return songTags.includes(tag);
        } else {
          return !songTags.includes(tag);
        }
      });
    });
  }

  /**
   * Search songs with cache invalidation
   */
  searchSongs(): void {
    this.filterCache.clear(); // Invalidate cache on new search
    this.applyFilter();
  }

  /**
   * Clear search query and reapply filters
   */
  clearSearch(): void {
    this.searchQuery = '';
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
      }).catch(() => {
        this.showMessage('Error deleting song', 'error');
      });
    }
  }

  /**
   * Remove tag filter with cache invalidation
   */
  removeTagFilter(tag: string): void {
    delete this.selectedTags[tag];
    this.saveTagsToLocalStorage();
    this.filterCache.clear(); // Invalidate cache
    this.applyFilter();
  }

  /**
   * Toggle tag filter status (include/exclude) with cache invalidation
   */
  toggleTagFilterStatus(tag: string): void {
    if (this.selectedTags[tag] === 'include') {
      this.selectedTags[tag] = 'exclude';
    } else {
      this.selectedTags[tag] = 'include';
    }
    this.saveTagsToLocalStorage();
    this.filterCache.clear(); // Invalidate cache
    this.applyFilter();
  }

  /**
   * Save selected tags to local storage
   */
  saveTagsToLocalStorage(): void {
    localStorage.setItem('mySongsSelectedTags', JSON.stringify(this.selectedTags));
  }

  /**
   * Load selected tags from local storage
   */
  loadTagsFromLocalStorage(): void {
    const savedTags = localStorage.getItem('mySongsSelectedTags');
    if (savedTags) {
      try {
        this.selectedTags = JSON.parse(savedTags);
      } catch {
        /* Silently ignore parse errors */
      }
    }
  }

  /**
   * Sync tags to local storage (after loading songs)
   */
  syncTagsToLocalStorage(): void {
    this.saveTagsToLocalStorage();
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

    dialogRef.afterClosed().subscribe((result: any) => {
      if (!result) return;

      // Handle single song from Tab A: { videoInfo, youtubeUrl }
      if (result.videoInfo && !Array.isArray(result)) {
        this.addSongToDatabase(result.videoInfo, result.youtubeUrl);
        return;
      }

      // Handle multiple songs from Tab B: [{ videoInfo, youtubeUrl }, ...]
      if (Array.isArray(result)) {
        let successCount = 0;
        let duplicateCount = 0;

        result.forEach(item => {
          const isSuccess = this.addSongToDatabase(item.videoInfo, item.youtubeUrl, true);
          if (isSuccess) {
            successCount++;
          } else {
            duplicateCount++;
          }
        });

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
  private addSongToDatabase(videoInfo: YouTubeVideoInfo, youtubeUrl: string, isBatch: boolean = false): boolean {
    // Check if song already exists (prevent duplicates)
    const existingSong = this.songs.find(s => s.videoId === videoInfo.videoId);
    if (existingSong) {
      if (!isBatch) {
        this.showMessage('This song already exists in the list', 'info');
      }
      return false;
    }

    const newSong: Song = {
      id: '', // Will be generated by the service
      videoId: videoInfo.videoId,
      title: videoInfo.title,
      youtubeLink: youtubeUrl,
      channel: videoInfo.channel,
      largestThumbnail: this.getHighestResolutionThumbnail(videoInfo.thumbnails),
      durationSeconds: videoInfo.durationSeconds,
      viewCount: videoInfo.viewCount,
      createdAt: Date.now(),
      tags: []
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
   * Open video player dialog with YouTube Iframe API
   * Dialog will auto-close and reopen for next song when current finishes
   * @param song - Song data to play
   */
  openVideoPlayerDialog(song: Song): void {
    if (!song.videoId) {
      this.showMessage('Video ID not available', 'error');
      return;
    }

    // Find current song index in displayed songs
    const currentIndex = this.itemsToDisplay.findIndex(s => s.id === song.id);

    // Open dialog with song, full list, and current index
    const dialogRef = this.dialog.open(VideoPlayerDialogComponent, {
      data: {
        song: song,
        songList: this.itemsToDisplay,
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
    dialogRef.afterClosed().subscribe((nextSong: Song | null) => {
      if (nextSong && nextSong.videoId) {
        setTimeout(() => {
          this.openVideoPlayerDialog(nextSong);
        }, 400);
      }
    });
  }
}
