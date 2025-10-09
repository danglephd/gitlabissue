import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, firstValueFrom } from 'rxjs';
import { Issue } from '../issue';
import { tap, catchError, map } from 'rxjs/operators';
import { updateGDriveValue } from '../shared/utils'; // Import hàm dùng chung


@Injectable({
  providedIn: 'root'
})
export class IssueRealtimeDbService {
  private dbPath = '/issues';

  constructor(private db: AngularFireDatabase) { }

  private updateGDriveValue(data: Issue[]) {
    data.forEach(element => {
      switch (element.project) {
        case "xm-web":
          element.proj_url_company = "https://drive.google.com/drive/u/1/folders/1-4LxFb0nZ7TPGa4XO5db2xE7_fB2D_pQ";
          element.proj_url_mypc = "https://drive.google.com/drive/u/1/folders/1-3f4fI891vqfITEOP0seIKp0dZfzIfrM";
          break;
        case "xm-api":
          element.proj_url_company = "https://drive.google.com/drive/u/1/folders/1B84We-1nziArtSClXv79tPAxOGaCg_6y";
          element.proj_url_mypc = "https://drive.google.com/drive/u/1/folders/1-j4cjtVnCYhStgR_bcLu1CDi5fbewhEC";
          break;
        case "erp-web":
          element.proj_url_company = "https://drive.google.com/drive/u/1/folders/1-pCA_yrx3AMqe0uvazAOUBqX4mt_eGJa";
          element.proj_url_mypc = "https://drive.google.com/drive/u/1/folders/15aNUv7XJeuS755wE6t5lkJ0ZX4X-uTo8";
          break;
        case "erp-web-demo":
          element.proj_url_company = "https://drive.google.com/drive/u/1/folders/10xTCk6P5P36p47YiAQ6roLpvlbOyp6g8";
          element.proj_url_mypc = "https://drive.google.com/drive/u/1/folders/1ZGAIUvwLKKujLeetQXWvCTxwAxMaIm8y";
          break;
        case "erp-server":
          element.proj_url_company = "https://drive.google.com/drive/u/1/folders/1AohlxBRxuybnV3bVt5u4ycRFbYnQmzd7";
          element.proj_url_mypc = "https://drive.google.com/drive/u/1/folders/13gh2XVoqhKoXPFPnvaLLFRrzigdCYRBr";
          break;

        default:
          element.proj_url_company = "https://null";
          element.proj_url_mypc = "https://nan";
          break;
      }
    });
    return data;
  }

  /**
   * Lấy danh sách tất cả các issues từ Firebase Realtime Database.
   * @returns Observable<Issue[]>
   */
  getIssues(): Observable<Issue[]> {
    return this.db.list<Issue>(this.dbPath).snapshotChanges().pipe(
      map((snapshots) => {
        const issues = snapshots.map(snapshot => ({
          ...snapshot.payload.val() as Issue,
          id: snapshot.key ?? '' // Assign an empty string if snapshot.key is null
        }));
        return updateGDriveValue(issues); // Cập nhật giá trị Google Drive
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
          const issues = snapshots.map(snapshot => ({
            ...snapshot.payload.val() as Issue,
            id: snapshot.key ?? '' // Gán key từ Firebase vào trường id
          }));
          return updateGDriveValue(issues); // Cập nhật giá trị Google Drive
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
          const issues = snapshots.map(snapshot => ({
            ...snapshot.payload.val() as Issue,
            id: snapshot.key ?? '' // Gán key từ Firebase vào trường id
          }));
          return updateGDriveValue(issues); // Cập nhật giá trị Google Drive
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
          const issues = snapshots
            .map(snapshot => ({
              ...snapshot.payload.val() as Issue,
              id: snapshot.key ?? '' // Gán key từ Firebase vào trường id
            }))
            .filter(issue => issue.test_state === status); // Lọc theo trạng thái
          return updateGDriveValue(issues); // Cập nhật giá trị Google Drive
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
    return this.db.object(`/${this.dbPath}/${issueKey}`).remove();
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

  /**
   * Lấy danh sách issues chỉ có test_state === 'Created'.
   * @returns Observable<Issue[]>
   */
  getIssuesSortedByNewest(): Observable<Issue[]> {
    return this.db.list<Issue>(this.dbPath).snapshotChanges().pipe(
      map((snapshots) => {
        const issues = snapshots
          .map(snapshot => ({
            ...snapshot.payload.val() as Issue,
            id: snapshot.key ?? ''
          }))
          .filter(issue => issue.test_state === 'Created');
        return updateGDriveValue(issues);
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  getIssuesByProject(project: string): Observable<Issue[]> {
    return this.db
      .list<Issue>(this.dbPath, ref => ref.orderByChild('project').equalTo(project))
      .snapshotChanges()
      .pipe(
        map((snapshots) => {
          const issues = snapshots.map(snapshot => ({
            ...snapshot.payload.val() as Issue,
            id: snapshot.key ?? '' // Gán key từ Firebase vào trường id
          }));
          return updateGDriveValue(issues); // Cập nhật giá trị Google Drive
        }),
        catchError((error) => {
          throw error; // Ném lỗi để xử lý ở nơi gọi hàm
        })
      );
  }

  /**
   * Trả về danh sách các issues có trùng path, sắp xếp theo path.
   * @returns Observable<Issue[]>
   */
  getIssuesWithDuplicatePath(): Observable<Issue[]> {
    return this.db.list<Issue>(this.dbPath).snapshotChanges().pipe(
      map((snapshots) => {
        const issues = snapshots.map(snapshot => ({
          ...snapshot.payload.val() as Issue,
          id: snapshot.key ?? ''
        }));
        // Đếm số lần xuất hiện của từng path
        const pathCount: { [key: string]: number } = {};
        issues.forEach(issue => {
          if (issue.path) {
            pathCount[issue.path] = (pathCount[issue.path] || 0) + 1;
          }
        });
        // Lọc ra các issues có path xuất hiện nhiều hơn 1 lần
        const duplicates = issues.filter(issue => issue.path && pathCount[issue.path] > 1);
        // Sắp xếp theo path
        duplicates.sort((a, b) => (a.path || '').localeCompare(b.path || ''));
        return duplicates;
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  /**
   * Xóa các issue duplicate, chỉ giữ lại 1 issue cho mỗi path bị trùng.
   * Trả về Promise<void> khi hoàn thành.
   */
  async deleteDuplicateIssuesKeepOne(): Promise<void> {
    const issues = await firstValueFrom(this.getIssues());
    // Gom các issue theo path
    const pathGroups: { [key: string]: Issue[] } = {};
    (issues ?? []).forEach(issue => {
      if (issue.path) {
        if (!pathGroups[issue.path]) pathGroups[issue.path] = [];
        pathGroups[issue.path].push(issue);
      }
    });

    // Lọc ra các nhóm có nhiều hơn 1 issue (bị duplicate)
    const duplicateGroups = Object.values(pathGroups).filter(group => group.length > 1);

    // Xóa tất cả trừ issue đầu tiên của mỗi nhóm
    const deletePromises: Promise<void>[] = [];
    duplicateGroups.forEach(group => {
      // Giữ lại issue đầu tiên, xóa các issue còn lại
      const [, ...toDelete] = group;
      toDelete.forEach(issue => {
        if (issue.id) {
          deletePromises.push(this.deleteIssue(issue.id));
        }
      });
    });

    await Promise.all(deletePromises);
  }
}