import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { Issue } from './issue';

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
    return this.db.list<Issue>(this.dbPath).valueChanges();
  }

  /**
   * Lấy issue theo số issue.
   * @param issueNumber Số issue cần tìm.
   * @returns Observable<Issue[]>
   */
  getIssuesByNumber(issueNumber: string): Observable<Issue[]> {
    return this.db
      .list<Issue>(this.dbPath, ref => ref.orderByChild('issue_number').equalTo(issueNumber))
      .valueChanges();
  }

  /**
   * Lấy issue theo trạng thái.
   * @param status Trạng thái của issue.
   * @returns Observable<Issue[]>
   */
  getIssuesByStatus(status: string): Observable<Issue[]> {
    return this.db
      .list<Issue>(this.dbPath, ref => ref.orderByChild('test_state').equalTo(status))
      .valueChanges();
  }

  /**
   * Xóa issue theo ID.
   * @param id ID của issue cần xóa.
   * @returns Promise<void>
   */
  deleteIssue(id: string): Promise<void> {
    return this.db.object(`${this.dbPath}/${id}`).remove();
  }

  /**
   * Cập nhật trạng thái của issue.
   * @param id ID của issue cần cập nhật.
   * @param status Trạng thái mới.
   * @returns Promise<void>
   */
  updateIssue(id: string, status: string): Promise<void> {
    return this.db.object(`${this.dbPath}/${id}`).update({ test_state: status });
  }
}