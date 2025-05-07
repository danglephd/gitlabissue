import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { Issue } from './issue';
import { tap, catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IssueRealtimeDbService {
  private dbPath = '/issues';

  constructor(private db: AngularFireDatabase) {}

  /**
   * Lấy danh sách tất cả các issues từ Firebase Realtime Database.
   * @returns Observable<Issue[]>
   */
  getIssues(): Observable<Issue[]> {
    return this.db.list<Issue>(this.dbPath).snapshotChanges().pipe(
      map((snapshots) => {
        return snapshots.map(snapshot => ({
          ...snapshot.payload.val() as Issue,
          id: snapshot.key ?? '' // Assign an empty string if snapshot.key is null
        }));
      }),
      catchError((error) => {
        throw error; // Ném lỗi để xử lý ở nơi gọi hàm
      })
    );
  }

  /**
   * Lấy issue theo số issue.
   * @param issueNumber Số issue cần tìm.
   * @returns Observable<Issue[]>
   */
  getIssuesByNumber(issueNumber: string): Observable<Issue[]> {
    return this.db
      .list<Issue>(this.dbPath, ref => ref.orderByChild('issue_number').equalTo(issueNumber))
      .snapshotChanges()
      .pipe(
        map((snapshots) => {
          return snapshots.map(snapshot => ({
            ...snapshot.payload.val() as Issue,
            id: snapshot.key ?? '' // Gán key từ Firebase vào trường id
          }));
        }),
        catchError((error) => {
          throw error; // Ném lỗi để xử lý ở nơi gọi hàm
        })
      );
  }

  /**
   * Lấy issue theo trạng thái.
   * @param status Trạng thái của issue.
   * @returns Observable<Issue[]>
   */
  getIssuesByStatus(status: string): Observable<Issue[]> {
    return this.db
      .list<Issue>(this.dbPath, ref => ref.orderByChild('test_state').equalTo(status))
      .snapshotChanges()
      .pipe(
        map((snapshots) => {
          return snapshots.map(snapshot => ({
            ...snapshot.payload.val() as Issue,
            id: snapshot.key ?? '' // Gán key từ Firebase vào trường id
          }));
        }),
        catchError((error) => {
          throw error; // Ném lỗi để xử lý ở nơi gọi hàm
        })
      );
  }

  /**
   * Lấy danh sách issues theo số issue và trạng thái.
   * @param issueNumber Số issue cần tìm.
   * @param status Trạng thái của issue.
   * @returns Observable<Issue[]>
   */
  getIssuesByNumberAndStatus(issueNumber: string, status: string): Observable<Issue[]> {
    return this.db
      .list<Issue>(this.dbPath, ref =>
        ref
          .orderByChild('issue_number')
          .equalTo(issueNumber)
      )
      .snapshotChanges()
      .pipe(
        map((snapshots) => {
          return snapshots
            .map(snapshot => ({
              ...snapshot.payload.val() as Issue,
              id: snapshot.key ?? '' // Gán key từ Firebase vào trường id
            }))
            .filter(issue => issue.test_state === status); // Lọc theo trạng thái
        }),
        catchError((error) => {
          throw error; // Ném lỗi để xử lý ở nơi gọi hàm
        })
      );
  }

  /**
   * Xóa issue theo ID.
   * @param id ID của issue cần xóa.
   * @returns Promise<void>
   */
  deleteIssue(issueKey: string): Promise<void> {
    return this.db.object(`/issues/${issueKey}`).remove();
  }

  /**
   * Cập nhật trạng thái của issue.
   * @param issueKey Key của issue cần cập nhật.
   * @param status Trạng thái mới.
   * @returns Promise<void>
   */
  updateIssue(issueKey: string, status: string): Promise<void> {
    return this.db.object(`${this.dbPath}/${issueKey}`).update({ test_state: status });
  }
}