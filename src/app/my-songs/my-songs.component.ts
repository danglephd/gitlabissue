import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Song, SongFilterType } from '../shared/models/song.model';
import { SongRealtimedbService } from '../services/song.realtimedb.service';
import { YouTubeService } from '../services/youtube.service';
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
    private youtubeService: YouTubeService,
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
      largestThumbnail: this.getHighestResolutionThumbnail(videoInfo.thumbnails),
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
   * Get sanitized YouTube embed URL for iframe
   * Uses videoId directly from Song object - no extraction needed since Song already has videoId
   */
  getYouTubeEmbedUrl(videoId: string): SafeResourceUrl | null {
    //ghi log để debug videoId
    console.log('Embedding video with ID:', videoId);
    if (!videoId) return null;
    const url = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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
    if (currentIndex === -1) {
      console.warn('Song not found in displayed list');
    }

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
        console.log('Dialog closed, opening next song:', nextSong.title);
        // Small delay for smooth transition (300-500ms)
        setTimeout(() => {
          this.openVideoPlayerDialog(nextSong);
        }, 400);
      }
    });
  }
}
