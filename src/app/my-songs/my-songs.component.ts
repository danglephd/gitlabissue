import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Song, SongFilterType } from '../shared/models/song.model';
import { SongRealtimedbService } from '../services/song.realtimedb.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AddYouTubeSongDialogComponent } from '../add-youtube-song-dialog/add-youtube-song-dialog.component';
import { YouTubeVideoInfo } from '../models/youtube.model';

@Component({
  selector: 'app-my-songs',
  templateUrl: './my-songs.component.html',
  styleUrls: ['./my-songs.component.css']
})
export class MySongsComponent implements OnInit {
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
  
  public SongFilterType = SongFilterType;

  @ViewChild('songsListContainer') songsListContainer!: ElementRef;

  constructor(
    private songService: SongRealtimedbService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loadSongs();
    this.loadTagsFromLocalStorage();
    this.detectMobileView();
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
        console.error('Error loading songs:', error);
        this.showMessage('Lỗi khi tải danh sách bài hát', 'error');
        this.isLoading = false;
      }
    );
  }

  /**
   * Apply filters based on current settings
   */
  applyFilter(): void {
    this.filteredSongs = this.filterBySearch(this.songs);
    this.filteredSongs = this.filterByTags(this.filteredSongs);
    this.displayedCount = this.pageSize;
    this.itemsToDisplay = this.filteredSongs.slice(0, this.displayedCount);
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
    if (activeTags.length === 0) return songs;

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
   * Search songs
   */
  searchSongs(): void {
    this.applyFilter();
  }

  /**
   * Clear search query
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilter();
  }

  /**
   * Change filter type
   */
  changeFilter(filterType: SongFilterType): void {
    this.filterType = filterType;
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
    if (confirm('Bạn có chắc chắn muốn xóa bài hát này?')) {
      this.songService.deleteSong(id).then(() => {
        this.showMessage('Bài hát đã được xóa', 'success');
      }).catch(err => {
        console.error('Error deleting song:', err);
        this.showMessage('Lỗi khi xóa bài hát', 'error');
      });
    }
  }

  /**
   * Open YouTube link in new window
   */
  openYoutubeLink(youtubeLink: string): void {
    if (youtubeLink) {
      window.open(youtubeLink, '_blank');
    }
  }

  /**
   * Filter by tag
   */
  filterByTag(tag: string): void {
    if (this.selectedTags[tag]) {
      delete this.selectedTags[tag];
    } else {
      this.selectedTags[tag] = 'include';
    }
    this.saveTagsToLocalStorage();
    this.applyFilter();
  }

  /**
   * Remove tag filter
   */
  removeTagFilter(tag: string): void {
    delete this.selectedTags[tag];
    this.saveTagsToLocalStorage();
    this.applyFilter();
  }

  /**
   * Toggle tag filter status (include/exclude)
   */
  toggleTagFilterStatus(tag: string): void {
    if (this.selectedTags[tag] === 'include') {
      this.selectedTags[tag] = 'exclude';
    } else {
      this.selectedTags[tag] = 'include';
    }
    this.saveTagsToLocalStorage();
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
      } catch (e) {
        console.error('Error parsing saved tags:', e);
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
   * Handle scroll event for lazy loading
   */
  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    // Show scroll to top button
    this.showScrollToTopButton = window.scrollY > 300;

    // Lazy load more items
    if (this.displayedCount < this.filteredSongs.length) {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight > docHeight - 500) {
        this.loadMoreItems();
      }
    }
  }

  /**
   * Load more items for lazy loading
   */
  loadMoreItems(): void {
    const nextCount = Math.min(
      this.displayedCount + this.pageSize,
      this.filteredSongs.length
    );
    this.itemsToDisplay = this.filteredSongs.slice(0, nextCount);
    this.displayedCount = nextCount;
  }

  /**
   * Scroll to top
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Format view count to readable format
   */
  getReadableViewCount(viewCount?: number): string {
    if (!viewCount) return '0';
    if (viewCount >= 1000000) {
      return (viewCount / 1000000).toFixed(1) + 'M';
    }
    if (viewCount >= 1000) {
      return (viewCount / 1000).toFixed(1) + 'K';
    }
    return viewCount.toString();
  }

  /**
   * Format duration seconds to readable format
   */
  getReadableDuration(seconds?: number): string {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.videoInfo) {
        this.addSongToDatabase(result.videoInfo, result.youtubeUrl);
      }
    });
  }

  /**
   * Add song to database
   */
  private addSongToDatabase(videoInfo: YouTubeVideoInfo, youtubeUrl: string): void {
    // Check if song already exists (prevent duplicates)
    const existingSong = this.songs.find(s => s.videoId === videoInfo.videoId);
    if (existingSong) {
      this.showMessage('Bài hát này đã tồn tại trong danh sách', 'info');
      return;
    }

    const newSong: Song = {
      id: '', // Will be generated by the service
      videoId: videoInfo.videoId,
      title: videoInfo.title,
      youtubeLink: youtubeUrl,
      channel: videoInfo.channel,
      largestThumbnail: this.getThumbnailUrl(videoInfo.thumbnails),
      durationSeconds: videoInfo.durationSeconds,
      viewCount: videoInfo.viewCount,
      createdAt: new Date(),
      tags: []
    };

    this.songService.addSong(newSong).then(() => {
      this.showMessage('Bài hát đã được thêm thành công', 'success');
      this.loadSongs(); // Reload songs to reflect new addition
    }).catch((error) => {
      console.error('Error adding song:', error);
      this.showMessage('Lỗi khi thêm bài hát', 'error');
    });
  }

  /**
   * Get the highest resolution thumbnail URL from YouTube thumbnails
   */
  private getThumbnailUrl(thumbnails: any): string {
    if (thumbnails.maxres) {
      return thumbnails.maxres.url;
    }
    if (thumbnails.standard) {
      return thumbnails.standard.url;
    }
    if (thumbnails.high) {
      return thumbnails.high.url;
    }
    if (thumbnails.medium) {
      return thumbnails.medium.url;
    }
    if (thumbnails.default) {
      return thumbnails.default.url;
    }
    return '';
  }

  /**
   * Extract video ID from YouTube URL
   * Handles formats: 
   * - https://www.youtube.com/watch?v=VIDEO_ID
   * - https://youtu.be/VIDEO_ID
   * - VIDEO_ID (direct ID)
   */
  extractVideoIdFromUrl(url: string): string {
    if (!url) return '';
    
    // If it's already just a video ID (11 characters of alphanumeric, hyphen, underscore)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }

    // Try to extract from youtube.com/watch?v=VIDEO_ID
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch && youtubeMatch[1]) {
      return youtubeMatch[1];
    }

    // Fallback: return empty string if no match
    return '';
  }

  /**
   * Get sanitized YouTube embed URL for iframe
   */
  getYouTubeEmbedUrl(youtubeLink: string): SafeResourceUrl | null {
    const videoId = this.extractVideoIdFromUrl(youtubeLink);
    if (!videoId) return null;
    const url = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
