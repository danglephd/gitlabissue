import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Issue } from './issue';
import { Observable, Subject, map, tap, toArray } from 'rxjs';

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

  private refreshIssues() {
    this.httpClient.get<Issue[]>(`${this.url}/issues`)
      .pipe(map(data => data.sort(this.sortByNumber)))
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
      .pipe(map(data => data.sort(this.sortByNumber)))
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
      .pipe(map(data => data.sort(this.sortByNumber)))
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
}
