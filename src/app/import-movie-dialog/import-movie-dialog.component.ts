import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CsvParserService } from '../services/csv-parser.service';
import { MovieRealtimedbService } from '../services/movie.realtimedb.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Movie } from '../shared/models/movie.model';

@Component({
  selector: 'app-import-movie-dialog',
  templateUrl: './import-movie-dialog.component.html',
  styleUrls: ['./import-movie-dialog.component.css']
})
export class ImportMovieDialogComponent implements OnInit {
  selectedFile: File | null = null;
  isLoading = false;
  importProgress = '';
  duplicateMovies: Movie[] = [];
  showDuplicateWarning = false;

  constructor(
    public dialogRef: MatDialogRef<ImportMovieDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { existingMovies: Movie[] },
    private csvParser: CsvParserService,
    private movieService: MovieRealtimedbService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
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
        const existingPaths = new Set(this.data.existingMovies.map(m => m.path.toLowerCase()));
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
          this.dialogRef.close({ imported: true, count: newMovies.length });
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
   * Close dialog
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
