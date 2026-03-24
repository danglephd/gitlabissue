import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/compat/database';
import { Observable, map } from 'rxjs';
import { Song } from '../shared/models/song.model';

@Injectable({
  providedIn: 'root'
})
export class SongRealtimedbService {
  private songsRef: AngularFireList<Song>;
  private songsPath = '/songs';

  constructor(private db: AngularFireDatabase) {
    this.songsRef = this.db.list<Song>(this.songsPath);
  }

  /**
   * Get all active songs (not deleted)
   */
  getActiveSongs(): Observable<Song[]> {
    return this.songsRef.snapshotChanges().pipe(
      map(changes =>
        changes
          .map(c => ({
            id: c.key,
            ...c.payload.val()
          } as Song))
          .filter(s => !s.deleted)
      )
    );
  }

  /**
   * Get a single song by ID
   */
  getSong(id: string): Observable<Song | null> {
    return this.db.object<Song>(`${this.songsPath}/${id}`).valueChanges().pipe(
      map(song => song ? { ...song, id } as Song : null)
    );
  }

  /**
   * Add a new song
   */
  addSong(song: Omit<Song, 'id'>): Promise<string> {
    const key = this.db.createPushId();
    const newSong: Song = {
      ...song,
      id: key,
      createdAt: new Date()
    };
    return new Promise((resolve, reject) => {
      this.db.database.ref(`${this.songsPath}/${key}`).set(newSong)
        .then(() => resolve(key))
        .catch(err => reject(err));
    });
  }

  /**
   * Update a song
   */
  updateSong(id: string, song: Partial<Song>): Promise<void> {
    return this.db.object(`${this.songsPath}/${id}`).update(song);
  }

  /**
   * Delete a song (soft delete)
   */
  deleteSong(id: string): Promise<void> {
    return this.updateSong(id, { deleted: true });
  }

  /**
   * Restore a deleted song
   */
  restoreSong(id: string): Promise<void> {
    return this.updateSong(id, { deleted: false });
  }

  /**
   * Permanently delete a song from database
   */
  permanentlyDeleteSong(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.database.ref(`${this.songsPath}/${id}`).remove()
        .then(() => resolve())
        .catch(err => reject(err));
    });
  }

  /**
   * Search songs by title or channel
   */
  searchSongs(query: string): Observable<Song[]> {
    return this.getActiveSongs().pipe(
      map(songs =>
        songs.filter(s =>
          (s.title?.toLowerCase().includes(query.toLowerCase()) || false) ||
          (s.channel?.toLowerCase().includes(query.toLowerCase()) || false)
        )
      )
    );
  }

  /**
   * Get songs by tag
   */
  getSongsByTag(tag: string): Observable<Song[]> {
    return this.getActiveSongs().pipe(
      map(songs =>
        songs.filter(s => s.tags?.includes(tag) || false)
      )
    );
  }

  /**
   * Get songs by channel
   */
  getSongsByChannel(channel: string): Observable<Song[]> {
    return this.getActiveSongs().pipe(
      map(songs =>
        songs.filter(s => s.channel === channel)
      )
    );
  }

  /**
   * Get all unique tags from all songs
   */
  getAllTags(): Observable<string[]> {
    return this.getActiveSongs().pipe(
      map(songs => {
        const tagsSet = new Set<string>();
        songs.forEach(s => {
          s.tags?.forEach(tag => tagsSet.add(tag));
        });
        return Array.from(tagsSet).sort();
      })
    );
  }

  /**
   * Get all unique channels
   */
  getAllChannels(): Observable<string[]> {
    return this.getActiveSongs().pipe(
      map(songs => {
        const channelsSet = new Set<string>();
        songs.forEach(s => {
          if (s.channel) channelsSet.add(s.channel);
        });
        return Array.from(channelsSet).sort();
      })
    );
  }

  /**
   * Batch update songs
   */
  batchUpdateSongs(updates: { id: string; data: Partial<Song> }[]): Promise<void[]> {
    return Promise.all(
      updates.map(update => this.updateSong(update.id, update.data))
    );
  }

  /**
   * Bulk add songs
   */
  bulkAddSongs(songs: Omit<Song, 'id'>[]): Promise<string[]> {
    return Promise.all(
      songs.map(song => this.addSong(song))
    );
  }
}
