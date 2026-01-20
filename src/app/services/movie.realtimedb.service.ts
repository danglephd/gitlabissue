import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Movie } from '../shared/models/movie.model';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MovieRealtimedbService {
    private moviesSubject = new BehaviorSubject<Movie[]>([]);
    public movies$ = this.moviesSubject.asObservable();

    private readonly DB_PATH = 'movies';

    constructor(private db: AngularFireDatabase) {
        this.loadMovies();
    }

    /**
     * Load all movies from database
     */
    loadMovies(): void {
        this.db.list<Movie>(this.DB_PATH).valueChanges().subscribe(
            (movies: Movie[]) => {
                this.moviesSubject.next(movies || []);
            },
            (error) => {
                console.error('Error loading movies:', error);
                this.moviesSubject.next([]);
            }
        );
    }

    /**
     * Get all movies
     */
    getMovies(): Observable<Movie[]> {
        return this.movies$;
    }

    /**
     * Get current movies value
     */
    getCurrentMovies(): Movie[] {
        return this.moviesSubject.value;
    }

    /**
     * Add a single movie
     */
    addMovie(movie: Movie): Promise<void> {
        const key = movie.id;
        return this.db.object(`${this.DB_PATH}/${key}`).set(movie);
    }

    /**
     * Add multiple movies (batch import)
     */
    addMovies(movies: Movie[]): Promise<any> {
        const updates: any = {};
        movies.forEach(movie => {
            updates[`${this.DB_PATH}/${movie.id}`] = movie;
        });

        //ghi log
        console.log('Adding movies to database:', movies);
        
        return this.db.database.ref().update(updates);
    }

    /**
     * Update a movie
     */
    updateMovie(movie: Movie): Promise<void> {
        return this.db.object(`${this.DB_PATH}/${movie.id}`).update(movie);
    }

    /**
     * Delete a movie (soft delete - set deleted flag to true)
     */
    deleteMovie(movieId: string): Promise<void> {
        return this.db.object(`${this.DB_PATH}/${movieId}`).update({ deleted: true });
    }

    /**
     * Delete multiple movies (soft delete - set deleted flag to true)
     */
    deleteMovies(movieIds: string[]): Promise<any> {
        const updates: any = {};
        movieIds.forEach(id => {
            updates[`${this.DB_PATH}/${id}/deleted`] = true;
        });
        return this.db.database.ref().update(updates);
    }

    /**
     * Get duplicate movies based on path
     */
    findDuplicatesInDb(): Movie[] {
        const movies = this.getCurrentMovies();
        const seen = new Map<string, Movie>();
        const duplicates: Movie[] = [];

        for (const movie of movies) {
            const key = movie.path.toLowerCase();
            if (seen.has(key)) {
                duplicates.push(movie);
            } else {
                seen.set(key, movie);
            }
        }

        return duplicates;
    }

    /**
     * Get movies by year
     */
    getMoviesByYear(year: number): Movie[] {
        return this.getCurrentMovies().filter(m => m.year === year);
    }

    /**
     * Search movies by filename
     */
    searchMovies(query: string): Movie[] {
        const lowerQuery = query.toLowerCase();
        return this.getCurrentMovies().filter(m =>
            m.fileName.toLowerCase().includes(lowerQuery) ||
            m.path.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Count total movies
     */
    getMovieCount(): number {
        return this.getCurrentMovies().length;
    }
}
