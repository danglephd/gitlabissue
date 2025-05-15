import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Issue } from '../issue';
import { Observable, Subject, map, pipe, tap, toArray, catchError, throwError } from 'rxjs';
import { updateGDriveValue } from '../shared/utils'; // Import hàm dùng chung


@Injectable({
  providedIn: 'root'
})
export class IssueService {
  // private url = 'http://localhost:3000';
  private url = 'http://www.nodeserver9.com';

  private issues$: Subject<Issue[]> = new Subject();

  constructor(private httpClient: HttpClient) { }

  private sortByNumber = (a:Issue, b:Issue) => {
    const valueA = parseInt(a.issue_number);
    const valueB = parseInt(b.issue_number);
    return (valueA < valueB) ? -1 : (valueA > valueB) ? 1 : 0;
  }

  private sortByTime = (a:Issue, b:Issue) => {
    if(a.duedate === " " || a.duedate === ""){
      return 1;
    }
    
    if(b.duedate === " " || b.duedate === ""){
      return -1;
    }
  
    let valueA = Date.parse(a.duedate);
    let valueB = Date.parse(b.duedate);
    return (valueA < valueB) ? -1 : (valueA > valueB) ? 1 : 0;
  }

  private refreshIssues() {
    this.httpClient.get<Issue[]>(`${this.url}/issues`)
      .pipe(
        map(data => {
          if (!data || data.length === 0) {
            throw new Error('No data found');
          }
          return data.filter(value => value.test_state !== "Old" && value.test_state !== "Done");
        }),
        map(data => updateGDriveValue(data)),
        catchError(error => {
          // console.error('Error refreshing issues:', error);
          this.issues$.next([]); // Emit empty array on error
          return throwError(() => error);
        })
      )
      .subscribe(issues => {
        this.issues$.next(issues);
      });
  }

  getIssues(): Subject<Issue[]> {
    this.refreshIssues();
    return this.issues$;
  }

  getIssuesByNumber(issue_number: string): Subject<Issue[]> {
    this.httpClient.get<Issue[]>(`${this.url}/issues/${issue_number}`)
      .pipe(
        map(data => {
          if (!data || data.length === 0) {
            throw new Error('No data found');
          }
          return data.sort(this.sortByTime);
        }),
        map(data => updateGDriveValue(data)),
        catchError(error => {
          // console.error('Error fetching issues by number:', error);
          this.issues$.next([]); // Emit empty array on error
          return throwError(() => error);
        })
      )
      .subscribe(issues => {
        this.issues$.next(issues);
      });
    return this.issues$;
  }

  getIssuesByStatus(test_status: string): Subject<Issue[]> {
    let body = {
      status: test_status
    };
    this.httpClient.post<Issue[]>(`${this.url}/issues/status`, body)
      .pipe(
        map(data => {
          if (!data || data.length === 0) {
            throw new Error('No data found');
          }
          return data.sort(this.sortByTime);
        }),
        map(data => updateGDriveValue(data)),
        catchError(error => {
          // console.error('Error fetching issues by status:', error);
          this.issues$.next([]); // Emit empty array on error
          return throwError(() => error);
        })
      )
      .subscribe(issues => {
        this.issues$.next(issues);
      });
      
    return this.issues$;
  }

  getIssuesByNumberAndStatus(issue_number: string, test_status: string): Subject<Issue[]> {
    let body = {
      status: test_status,
      issue_number: issue_number
    };
    this.httpClient.post<Issue[]>(`${this.url}/issues`, body)
      .pipe(
        map(data => {
          if (!data || data.length === 0) {
            throw new Error('No data found');
          }
          return updateGDriveValue(data);
        }),
        catchError(error => {
          // console.error('Error fetching issues by number and status:', error);
          this.issues$.next([]); // Emit empty array on error
          return throwError(() => error);
        })
      )
      .subscribe(issues => {
        this.issues$.next(issues);
      });
    return this.issues$;
  }

  updateIssue(_id: string, _value: string) {
    let body = {
      status: _value
    };

    return this.httpClient.put(`${this.url}/issues/${_id}`, body, { responseType: 'text' }).subscribe(x => console.log(x));
  }

  deleteIssue(id: string): Observable<any> {
    return this.httpClient.delete(`${this.url}/issues/${id}`);
  }
}
