import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Movie, MovieFilterType } from '../shared/models/movie.model';
import { MovieRealtimedbService } from '../services/movie.realtimedb.service';
import { CsvParserService } from '../services/csv-parser.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MovieEditDialogComponent } from '../movie-edit-dialog/movie-edit-dialog.component';
import { ImportMovieDialogComponent } from '../import-movie-dialog/import-movie-dialog.component';

@Component({
  selector: 'app-movie-manage',
  templateUrl: './movie-manage.component.html',
  styleUrls: ['./movie-manage.component.css']
})
export class MovieManageComponent implements OnInit {
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  itemsToDisplay: Movie[] = [];
  filterType: MovieFilterType = MovieFilterType.ALL;
  isLoading = false;
  searchQuery = '';
  selectedFile: File | null = null;
  importProgress = '';
  duplicateMovies: Movie[] = [];
  showDuplicateWarning = false;
  public MovieFilterType = MovieFilterType;
  displayedColumns: string[] = ['fileName', 'year', 'size', 'modified', 'isProcessed', 'actions'];
  // Tag filter with status: 'include' or 'exclude'
  selectedTags: { [key: string]: 'include' | 'exclude' } = {};
  
  // Lazy loading properties
  pageSize = 10;
  displayedCount = 10;
  
  // Scroll to top properties
  showScrollToTopButton = false;
  
  @ViewChild('moviesListContainer') moviesListContainer!: ElementRef;

  constructor(
    private movieService: MovieRealtimedbService,
    private csvParser: CsvParserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadMovies();
    this.loadTagsFromLocalStorage();
  }

  /**
   * Load movies from database
   */
  loadMovies(): void {
    this.movieService.getMovies().subscribe(
      (movies: Movie[]) => {
        this.movies = movies || [];
        this.syncTagsToLocalStorage();
        this.applyFilter();
      },
      (error) => {
        console.error('Error loading movies:', error);
        this.showMessage('Lỗi khi tải danh sách phim', 'error');
      }
    );
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      if (this.selectedFile && this.selectedFile.name.endsWith('.csv')) {
        this.showMessage(`Đã chọn file: ${this.selectedFile.name}`, 'success');
      } else {
        this.showMessage('Vui lòng chọn file CSV', 'error');
        this.selectedFile = null;
      }
    }
  }

  /**
   * Import movies from CSV file
   */
  importFromCsv(): void {
    if (!this.selectedFile) {
      this.showMessage('Vui lòng chọn file CSV trước', 'error');
      return;
    }

    this.isLoading = true;
    this.importProgress = 'Đang đọc file...';

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const csvContent = e.target.result;
        this.importProgress = 'Đang phân tích dữ liệu...';

        // Parse CSV
        let movies = this.csvParser.parseMovieCsv(csvContent);
        this.importProgress = `Tìm được ${movies.length} phim từ file`;

        if (movies.length === 0) {
          this.showMessage('Không tìm thấy dữ liệu phim trong file', 'warning');
          this.isLoading = false;
          return;
        }

        // Remove duplicates within the import
        const { duplicates, unique } = this.csvParser.findDuplicates(movies);
        if (duplicates.length > 0) {
          this.importProgress += ` (${duplicates.length} bản sao trong file đã bị loại bỏ)`;
          movies = unique;
        }

        // Check for duplicates with existing data
        const existingPaths = new Set(this.movies.map(m => m.path.toLowerCase()));
        const { duplicates: dbDuplicates, unique: newMovies } = this.filterNewMovies(movies, existingPaths);
        
        if (dbDuplicates.length > 0) {
          this.duplicateMovies = dbDuplicates;
          this.showDuplicateWarning = true;
          this.importProgress += ` (${dbDuplicates.length} phim đã tồn tại)`;
        }

        if (newMovies.length === 0) {
          this.showMessage('Tất cả phim đều đã tồn tại trong cơ sở dữ liệu', 'info');
          this.isLoading = false;
          return;
        }

        // Save to database
        this.importProgress = `Đang lưu ${newMovies.length} phim vào cơ sở dữ liệu...`;
        this.movieService.addMovies(newMovies).then(() => {
          this.showMessage(
            `Thêm thành công ${newMovies.length} phim vào cơ sở dữ liệu`,
            'success'
          );
          this.resetImport();
          this.loadMovies();
          this.syncTagsToLocalStorage();
        }).catch(error => {
          console.error('Error saving movies:', error);
          this.showMessage('Lỗi khi lưu phim vào cơ sở dữ liệu', 'error');
          this.isLoading = false;
        });
      } catch (error) {
        console.error('Error parsing CSV:', error);
        this.showMessage('Lỗi khi phân tích file CSV', 'error');
        this.isLoading = false;
      }
    };

    reader.onerror = () => {
      this.showMessage('Lỗi khi đọc file', 'error');
      this.isLoading = false;
    };

    reader.readAsText(this.selectedFile);
  }

  /**
   * Filter new movies that don't exist in database
   */
  private filterNewMovies(movies: Movie[], existingPaths: Set<string>): { duplicates: Movie[], unique: Movie[] } {
    const duplicates: Movie[] = [];
    const unique: Movie[] = [];

    for (const movie of movies) {
      if (existingPaths.has(movie.path.toLowerCase())) {
        duplicates.push(movie);
      } else {
        unique.push(movie);
      }
    }

    return { duplicates, unique };
  }

  /**
   * Apply filter to movies
   */
  applyFilter(): void {
    let filtered = [...this.movies];

    // Filter out deleted movies (soft delete)
    filtered = filtered.filter(m => !m.deleted);

    // Apply filter type
    switch (this.filterType) {
      case MovieFilterType.PROCESSED:
        filtered = filtered.filter(m => m.isProcessed);
        break;
      case MovieFilterType.NOT_PROCESSED:
        filtered = filtered.filter(m => !m.isProcessed);
        break;
      case MovieFilterType.ALL:
      default:
        break;
    }

    // Apply search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.fileName.toLowerCase().includes(query) ||
        (m.path && m.path.toLowerCase().includes(query)) ||
        (m.year && m.year.toString().includes(query))
      );
    }

    // Apply tag filter - Include/Exclude logic
    // Movie must match all Include tags AND must NOT match any Exclude tags
    const selectedTagKeys = Object.keys(this.selectedTags);
    if (selectedTagKeys.length > 0) {
      filtered = filtered.filter(m => {
        if (!m.tags || !Array.isArray(m.tags)) {
          return false; // Movie must have tags
        }
        
        // Check Include tags - movie must have ALL include tags
        for (const tag of selectedTagKeys) {
          if (this.selectedTags[tag] === 'include') {
            if (!m.tags.includes(tag)) {
              return false;
            }
          }
        }
        
        // Check Exclude tags - movie must NOT have any exclude tags
        for (const tag of selectedTagKeys) {
          if (this.selectedTags[tag] === 'exclude') {
            if (m.tags.includes(tag)) {
              return false;
            }
          }
        }
        
        return true;
      });
    }

    // Sort by clickCount in ascending order
    filtered.sort((a, b) => (a.clickCount || 0) - (b.clickCount || 0));

    this.filteredMovies = filtered;
    
    // Reset lazy loading and initialize items to display
    this.initializeItemsToDisplay();
  }

  /**
   * Change filter
   */
  changeFilter(filter: MovieFilterType): void {
    this.filterType = filter;
    this.applyFilter();
  }

  /**
   * Search movies
   */
  searchMovies(): void {
    this.applyFilter();
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilter();
  }

  /**
   * Filter movies by tag from movie card - toggle between include and remove
   * Click 1: Include tag
   * Click 2: Remove tag
   */
  filterByTag(tag: string): void {
    if (this.selectedTags[tag]) {
      // If tag exists in filter, remove it
      delete this.selectedTags[tag];
    } else {
      // Add tag with include status
      this.selectedTags[tag] = 'include';
    }
    this.applyFilter();
  }

  /**
   * Toggle tag filter status - toggle between include, exclude
   */
  toggleTagFilterStatus(tag: string): void {
    if (this.selectedTags[tag]) {
      // If tag exists, toggle between include and exclude
      if (this.selectedTags[tag] === 'include') {
        this.selectedTags[tag] = 'exclude';
      } else {
        this.selectedTags[tag] = 'include';
      }
    }
    this.applyFilter();
  }

  /**
   * Remove a specific tag from filter
   */
  removeTagFilter(tag: string): void {
    delete this.selectedTags[tag];
    this.applyFilter();
  }

  /**
   * Clear all tag filters
   */
  clearAllTagFilters(): void {
    this.selectedTags = {};
    this.applyFilter();
  }

  /**
   * Filter movies by year
   */
  filterByYear(year: number | undefined): void {
    if (year) {
      this.searchQuery = year.toString();
      this.applyFilter();
    }
  }

  /**
   * Initialize itemsToDisplay with first 10 items
   */
  initializeItemsToDisplay(): void {
    this.displayedCount = Math.min(this.pageSize, this.filteredMovies.length);
    this.itemsToDisplay = this.filteredMovies.slice(0, this.displayedCount);
  }

  /**
   * Load more items (lazy loading)
   */
  loadMore(): void {
    //ghi log 
    console.log('Loading more movies...');
    const nextCount = Math.min(this.displayedCount + this.pageSize, this.filteredMovies.length);
    this.displayedCount = nextCount;
    this.itemsToDisplay = this.filteredMovies.slice(0, nextCount);
  }

  /**
   * Check if need to load more items
   */
  onScroll(event: any): void {
    const element = event.target;
    // Check if scrolled to bottom (within 200px)
    console.log('Scroll event detected. ScrollTop:', element.scrollTop, 'ScrollHeight:', element.scrollHeight, 'ClientHeight:', element.clientHeight);
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 200) {
      if (this.displayedCount < this.filteredMovies.length) {
        this.loadMore();
      }
    }
  }

  /**
   * HostListener for window scroll event
   */
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    // Get document height and current scroll position
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Check if scrolled to bottom (within 500px)
    if (scrollPosition >= documentHeight - 500) {
      if (this.displayedCount < this.filteredMovies.length) {
        this.loadMore();
      }
    }
    
    // Check if should show scroll to top button
    this.showScrollToTopButton = window.scrollY > 300;
  }

  /**
   * Scroll to top of page
   */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Mark movie as processed
   */
  markAsProcessed(movie: Movie): void {
    movie.isProcessed = true;
    this.movieService.updateMovie(movie).then(() => {
      this.showMessage('Đã cập nhật trạng thái', 'success');
      this.syncTagsToLocalStorage();
    }).catch(error => {
      console.error('Error updating movie:', error);
      this.showMessage('Lỗi khi cập nhật phim', 'error');
    });
  }

  /**
   * Delete movie
   */
  deleteMovie(movieId: string): void {
    if (confirm('Bạn có chắc muốn xóa phim này?')) {
      this.movieService.deleteMovie(movieId).then(() => {
        this.showMessage('Đã xóa phim', 'success');
        this.loadMovies();
      }).catch(error => {
        console.error('Error deleting movie:', error);
        this.showMessage('Lỗi khi xóa phim', 'error');
      });
    }
  }

  /**
   * Edit movie
   */
  editMovie(movie: Movie): void {
    const dialogRef = this.dialog.open(MovieEditDialogComponent, {
      width: '500px',
      data: { movie: { ...movie } } // Pass a copy to avoid direct modification
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // result contains the updated movie data
        // Increment clickCount by 1
        const updatedMovie: Movie = {
          ...movie,
          ...result,
          clickCount: (movie.clickCount || 0) + 1
        };

        this.movieService.updateMovie(updatedMovie).then(() => {
          this.showMessage('Đã cập nhật thông tin phim', 'success');
          this.syncTagsToLocalStorage();
          this.loadMovies();
        }).catch(error => {
          console.error('Error updating movie:', error);
          this.showMessage('Lỗi khi cập nhật phim', 'error');
        });
      }
    });
  }

  /**
   * Get file size in readable format
   */
  getReadableSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Reset import state
   */
  resetImport(): void {
    this.isLoading = false;
    this.selectedFile = null;
    this.importProgress = '';
    this.showDuplicateWarning = false;
    this.duplicateMovies = [];
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Ignore duplicates and complete import
   */
  ignoreDuplicates(): void {
    this.showDuplicateWarning = false;
  }

  /**
   * Show snackbar message
   */
  private showMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Đóng', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Get total movie count
   */
  getTotalCount(): number {
    return this.movies.length;
  }

  /**
   * Get processed movie count
   */
  getProcessedCount(): number {
    return this.movies.filter(m => m.isProcessed).length;
  }

  /**
   * Get not processed movie count
   */
  getNotProcessedCount(): number {
    return this.movies.filter(m => !m.isProcessed).length;
  }

  /**
   * Copy path to clipboard
   */
  copyPathToClipboard(path: string): void {
    this.copyToClipboard(path)
      .then(() => {
        this.showMessage(`Đã copy đường dẫn: "${path}"`, 'success');
      })
      .catch(() => {
        this.showMessage('Lỗi khi copy đường dẫn', 'error');
      });
  }

  /**
   * Copy text to clipboard
   */
  private copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        textArea.remove();

        if (success) {
          resolve();
        } else {
          reject(new Error('Failed to copy text'));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Get all tags from movies
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    this.movies.forEach(movie => {
      if (movie.tags && Array.isArray(movie.tags)) {
        movie.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }

  /**
   * Save tags to localStorage
   */
  saveTagsToLocalStorage(): void {
    const tags = this.getAllTags();
    try {
      localStorage.setItem('movieTags', JSON.stringify(tags));
      // console.log('Tags saved to localStorage:', tags);
    } catch (error) {
      console.error('Error saving tags to localStorage:', error);
    }
  }
                                    
  /**
   * Load tags from localStorage
   */
  loadTagsFromLocalStorage(): string[] {
    try {
      const tagsJson = localStorage.getItem('movieTags');
      if (tagsJson) {
        return JSON.parse(tagsJson);
      }
    } catch (error) {
      console.error('Error loading tags from localStorage:', error);
    }
    return [];
  }

  /**
   * Sync tags when movies are loaded
   */
  syncTagsToLocalStorage(): void {
    this.saveTagsToLocalStorage();
  }

  /**
   * Open import dialog
   */
  openImportDialog(): void {
    const dialogRef = this.dialog.open(ImportMovieDialogComponent, {
      width: '600px',
      data: { existingMovies: this.movies }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.imported) {
        this.showMessage(`Đã nhập ${result.count} phim`, 'success');
        this.loadMovies();
      }
    });
  }
}
