import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Issue } from './issue';
import { Observable, Subject, map, pipe, tap, toArray, catchError, throwError } from 'rxjs';

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

  private refreshIssues() {
    this.httpClient.get<Issue[]>(`${this.url}/issues`)
      .pipe(
        map(data => {
          if (!data || data.length === 0) {
            throw new Error('No data found');
          }
          return data.filter(value => value.test_state !== "Old" && value.test_state !== "Done");
        }),
        map(data => this.updateGDriveValue(data)),
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
        map(data => this.updateGDriveValue(data)),
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
        map(data => this.updateGDriveValue(data)),
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
          return this.updateGDriveValue(data);
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
