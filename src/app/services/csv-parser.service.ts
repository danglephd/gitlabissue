import { Injectable } from '@angular/core';
import { Movie } from '../shared/models/movie.model';

@Injectable({
  providedIn: 'root'
})
export class CsvParserService {

  constructor() { }

  /**
   * Parse CSV file and extract movie data
   * Supports WizTree CSV format
   */
  parseMovieCsv(csvContent: string): Movie[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const movies: Movie[] = [];

    if (lines.length < 2) {
      console.warn('CSV file is empty or invalid');
      return [];
    }

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVRow(lines[i]);
      if (row.length >= 6) {
        try {
          const movie = this.rowToMovie(row);
          if (movie) {
            movies.push(movie);
          }
        } catch (error) {
          console.error(`Error parsing row ${i}:`, error);
        }
      }
    }

    return movies;
  }

  /**
   * Parse a single CSV row handling quoted fields
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
      } else if (char === '\t' && !insideQuotes) {
        // Tab-separated values
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current.trim());
    return result;
  }

  /**
   * Convert CSV row to Movie object
   */
  private rowToMovie(row: string[]): Movie | null {
    // WizTree CSV format: File Name, Size, Allocated, Modified, Attributes, Files, Folders
    if (row.length < 7) return null;

    const fileName = row[0];
    if (!fileName) return null;

    // Only process rows that contain file information (not directory summary rows)
    if (fileName.startsWith('D:\\') || fileName.includes('\\')) {
      const size = parseInt(row[1]) || 0;
      const allocated = parseInt(row[2]) || 0;
      const modifiedStr = row[3];
      const attributes = parseInt(row[4]) || 0;
      const files = parseInt(row[5]) || 0;
      const folders = parseInt(row[6]) || 0;

      // Try to extract year from filename
      const year = this.extractYear(fileName);

      // Parse modified date
      const modified = this.parseDate(modifiedStr);

      const movie: Movie = {
        id: this.generateId(),
        fileName: this.cleanFileName(fileName),
        path: fileName,
        size: size,
        allocated: allocated,
        modified: modified,
        attributes: attributes,
        files: files,
        folders: folders,
        year: year,
        createdAt: new Date(),
        isProcessed: false
      };

      return movie;
    }

    return null;
  }

  /**
   * Extract year from filename using regex
   */
  private extractYear(fileName: string): number | undefined {
    const yearMatch = fileName.match(/\((\d{4})\)/);
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
   */
  private cleanFileName(path: string): string {
    // Remove trailing backslash if present
    let cleaned = path.replace(/\\$/, '');
    // Get just the filename or last folder
    const parts = cleaned.split('\\');
    let fileName = parts[parts.length - 1];

    // If it ends with .mkv or similar video extension, keep it
    // Otherwise, it's a directory name
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
