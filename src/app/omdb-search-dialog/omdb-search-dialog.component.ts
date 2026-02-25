import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MovieRealtimedbService } from '../services/movie.realtimedb.service';

interface OMDbMovie {
  Title?: string;
  Year?: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Plot?: string;
  Language?: string;
  Country?: string;
  Awards?: string;
  Poster?: string;
  Ratings?: Array<{ Source: string; Value: string }>;
  Metascore?: string;
  imdbRating?: string;
  imdbVotes?: string;
  imdbID?: string;
  Type?: string;
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  Response?: string;
}

@Component({
  selector: 'app-omdb-search-dialog',
  templateUrl: './omdb-search-dialog.component.html',
  styleUrls: ['./omdb-search-dialog.component.css']
})
export class OmdbSearchDialogComponent implements OnInit {
  movieTitle = '';
  releaseYear = '';
  isSearching = false;
  searchResult: OMDbMovie | null = null;
  errorMessage = '';
  showFullscreenPoster = false;
  fullscreenPosterUrl = '';

  constructor(
    public dialogRef: MatDialogRef<OmdbSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { searchQuery?: string },
    private movieService: MovieRealtimedbService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Parse search query to extract movie title and year
    if (this.data && this.data.searchQuery) {
      this.parseSearchQuery(this.data.searchQuery);
    }
  }

  /**
   * Parse search query to extract movie title and year
   */
  parseSearchQuery(query: string): void {
    const yearMatch = query.match(/\d{4}/);
    
    if (yearMatch) {
      this.releaseYear = yearMatch[0];
      // Remove year from title
      this.movieTitle = query.replace(/\d{4}/, '').trim();
    } else {
      this.movieTitle = query.trim();
    }
  }

  /**
   * Search movie from OMDb API
   */
  searchOMDb(): void {
    if (!this.movieTitle.trim()) {
      this.showMessage('Vui lòng nhập tên phim', 'error');
      return;
    }

    this.isSearching = true;
    this.errorMessage = '';
    this.searchResult = null;

    // Call the API through the service
    this.movieService.getOMDbMovieInfo(this.movieTitle, this.releaseYear)
      .then((result: OMDbMovie) => {
        if (result && result.Response === 'True') {
          this.searchResult = result;
        } else {
          this.errorMessage = 'Không tìm thấy thông tin phim trên OMDb';
          this.showMessage(this.errorMessage, 'warning');
        }
        this.isSearching = false;
      })
      .catch((error) => {
        console.error('Error searching OMDb:', error);
        this.errorMessage = 'Lỗi khi tìm kiếm trên OMDb';
        this.showMessage(this.errorMessage, 'error');
        this.isSearching = false;
      });
  }

  /**
   * Get IMDb link from IMDb ID
   */
  getIMDbLink(): string {
    if (this.searchResult && this.searchResult.imdbID) {
      return `https://www.imdb.com/title/${this.searchResult.imdbID}/`;
    }
    return '';
  }

  /**
   * Get rating by source
   */
  getRatingBySource(source: string): string {
    if (this.searchResult && this.searchResult.Ratings) {
      const rating = this.searchResult.Ratings.find(r => r.Source === source);
      return rating ? rating.Value : 'N/A';
    }
    return 'N/A';
  }

  /**
   * Show snackbar message
   */
  private showMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Đóng', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Close dialog
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Close and use the found movie info
   */
  useMovieInfo(): void {
    this.dialogRef.close({ movieInfo: this.searchResult });
  }

  /**
   * Open poster in fullscreen
   */
  openFullscreenPoster(posterUrl?: string): void {
    if (posterUrl || this.searchResult?.Poster) {
      this.fullscreenPosterUrl = posterUrl || this.searchResult?.Poster || '';
      this.showFullscreenPoster = true;
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Close fullscreen poster
   */
  closeFullscreenPoster(): void {
    this.showFullscreenPoster = false;
    this.fullscreenPosterUrl = '';
    document.body.style.overflow = '';
  }
}
