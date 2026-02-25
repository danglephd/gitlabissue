import { Injectable } from '@angular/core';
import { Movie } from '../shared/models/movie.model';

@Injectable({
  providedIn: 'root'
})
export class CsvParserService {

  constructor() { }

  /**
   * Parse CSV file and extract movie data
   * Supports WizTree CSV format (Comma or Tab separated)
   * Only extracts info from the largest video file in each folder
   */
  parseMovieCsv(csvContent: string): Movie[] {
    // Fix encoding issues - normalize UTF-8 characters
    const normalizedContent = this.normalizeUnicode(csvContent);
    const lines = normalizedContent.split('\n').filter(line => line.trim());
    const movies: Movie[] = [];

    if (lines.length < 2) {
      console.warn('CSV file is empty or invalid');
      return [];
    }

    // Parse all rows and group by folder
    const folderMap = new Map<string, any>();

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVRow(lines[i]);
      if (row.length >= 7) {
        try {
          const fileName = row[0];
          if (!fileName) continue;

          // Check if it's a video file
          if (this.isVideoFile(fileName)) {
            const size = parseInt(row[1]) || 0;
            const folderPath = this.getParentFolder(fileName);

            // Keep only the largest video file per folder
            if (!folderMap.has(folderPath) || folderMap.get(folderPath).size < size) {
              folderMap.set(folderPath, {
                fileName: fileName,
                size: size,
                allocated: parseInt(row[2]) || 0,
                modified: row[3],
                attributes: parseInt(row[4]) || 0,
                files: parseInt(row[5]) || 0,
                folders: parseInt(row[6]) || 0
              });
            }
          }
        } catch (error) {
          console.error(`Error parsing row ${i}:`, error);
        }
      }
    }

    // Convert folder map to movies
    folderMap.forEach((videoData) => {
      try {
        const movie = this.rowToMovie(videoData);
        if (movie) {
          movies.push(movie);
        }
      } catch (error) {
        console.error('Error converting to movie:', error);
      }
    });
    //ghi log
    console.log(`Parsed ${movies.length} movies from CSV`);
    return movies;
  }

  /**
   * Normalize Unicode characters to fix encoding issues with Vietnamese text
   */
  private normalizeUnicode(text: string): string {
    try {
      // Normalize Unicode - handle combining marks
      // NFD = Canonical Decomposition
      // NFC = Canonical Decomposition followed by Canonical Composition
      return text.normalize('NFC');
    } catch (error) {
      console.warn('Unicode normalization failed, returning original text');
      return text;
    }
  }

  /**
   * Parse a single CSV row handling quoted fields
   * Supports both Tab-separated (TSV) and Comma-separated (CSV) formats
   */
  private parseCSVRow(line: string): string[] {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if ((char === '\t' || char === ',') && !insideQuotes) {
        // Both Tab and Comma separated values
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    if (current.trim()) {
      result.push(current.trim());
    }
    return result;
  }

  /**
   * Convert video data to Movie object
   * Path is the parent folder of the video file
   */
  private rowToMovie(videoData: any): Movie | null {
    const filePath = videoData.fileName;
    if (!filePath) return null;

    const parentFolder = this.getParentFolder(filePath);
    const fileName = this.cleanFileName(filePath);
    const year = this.extractYear(filePath);

    const movie: Movie = {
      id: this.generateId(),
      fileName: fileName,
      path: parentFolder,
      size: videoData.size,
      allocated: videoData.allocated,
      modified: this.parseDate(videoData.modified),
      attributes: videoData.attributes,
      files: videoData.files,
      folders: videoData.folders,
      year: year || undefined, // Firebase không chấp nhận undefined, nên dùng optional
      createdAt: new Date(),
      isProcessed: false
    };

    // Loại bỏ year nếu undefined để Firebase không gây lỗi
    if (movie.year === undefined) {
      delete movie.year;
    }

    return movie;
  }

  /**
   * Check if file is a video file based on extension
   */
  private isVideoFile(filePath: string): boolean {
    const videoExtensions = ['.mkv', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.ts', '.m2ts', '.mts', '.mpg', '.mpeg', '.3gp', '.ogv', '.f4v'];
    const lowerPath = filePath.toLowerCase();
    return videoExtensions.some(ext => lowerPath.endsWith(ext));
  }

  /**
   * Get parent folder path from full file path
   */
  private getParentFolder(filePath: string): string {
    // Remove trailing backslash if present
    let cleaned = filePath.replace(/\\$/, '');
    // Get all parts except the last one (which is the file/folder name)
    const parts = cleaned.split('\\');
    parts.pop(); // Remove last part
    return parts.join('\\') + '\\';
  }

  /**
   * Extract year from filename using regex
   * Returns undefined if year not found
   * Handles Unicode and special characters
   */
  private extractYear(fileName: string): number | undefined {
    // Normalize first to ensure proper character handling
    const normalized = this.normalizeUnicode(fileName);
    
    // Match pattern: (YYYY) anywhere in the filename
    const yearMatch = normalized.match(/\((\d{4})\)/);
    if (yearMatch && yearMatch[1]) {
      const year = parseInt(yearMatch[1]);
      if (year >= 1900 && year <= new Date().getFullYear()) {
        return year;
      }
    }
    return undefined;
  }

  /**
   * Clean filename by removing path and extracting just the filename
   * Also normalizes Unicode encoding
   */
  private cleanFileName(path: string): string {
    // Normalize Unicode first
    let cleaned = this.normalizeUnicode(path).replace(/\\$/, '');
    
    // Get just the filename or last folder
    const parts = cleaned.split('\\');
    let fileName = parts[parts.length - 1];
    
    // Remove file extension if it's a video file
    if (this.isVideoFile(fileName)) {
      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        fileName = fileName.substring(0, lastDotIndex);
      }
    }
    
    // Clean up multiple spaces and special characters
    fileName = fileName
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s+_\s+/g, ' - ') // Replace " _ " with " - "
      .trim();
    
    return fileName;
  }

  /**
   * Parse date string in format "M/D/YYYY HH:mm"
   */
  private parseDate(dateStr: string): Date {
    try {
      return new Date(dateStr);
    } catch (error) {
      return new Date();
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check for duplicates based on path
   */
  findDuplicates(movies: Movie[]): { duplicates: Movie[], unique: Movie[] } {
    const seen = new Map<string, Movie>();
    const duplicates: Movie[] = [];
    const unique: Movie[] = [];

    for (const movie of movies) {
      const key = movie.path.toLowerCase();
      if (seen.has(key)) {
        duplicates.push(movie);
      } else {
        seen.set(key, movie);
        unique.push(movie);
      }
    }

    return { duplicates, unique };
  }

  /**
   * Remove duplicate movies from an array
   */
  removeDuplicates(movies: Movie[]): Movie[] {
    return this.findDuplicates(movies).unique;
  }
}
