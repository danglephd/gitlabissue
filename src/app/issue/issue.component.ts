import { Component, OnInit, HostListener } from '@angular/core';
import { Issue } from '../issue';
import { Observable, map } from 'rxjs';
import { IssueService } from '../issue.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';

interface status {
  value: string;
}

@Component({
  selector: 'app-issue',
  templateUrl: './issue.component.html',
  styleUrls: ['./issue.component.css']
})
export class IssueComponent implements OnInit {
  issues$: Observable<Issue[]> = new Observable();
  inp_issueno: string = '';
  sel_status: string = '';
  oneDay = 24 * 60 * 60 * 1000;
  isSidebarOpen = false;
  isSidebarCollapsed = false;
  isMobile = false;
  isLoading = false;
  noData = false;

  constructor(private issueService: IssueService, private _snackBar: MatSnackBar) {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isSidebarOpen = true;
      this.isSidebarCollapsed = false;
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  testStatus: status[] = [
    { value: 'Finish' },
    { value: 'Working' },
    { value: 'Created' },
    { value: 'Done' },
    { value: 'Old' },
  ];

  ngOnInit(): void {
    this.isLoading = true;
    this.fetchIssues();
  }

  private fetchIssues(): void {
    this.issues$ = this.issueService.getIssues().pipe(
      map((issues: Issue[]) => {
        this.isLoading = false;
        this.noData = issues.length === 0;
        return issues;
      })
    );
  }

  private compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  sortData(sort: Sort) {
    console.log('>>>>sortData', sort);
    if (!sort.active || sort.direction === '') {
      return;
    }
    this.issues$.pipe(map(data => data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'issue_number':
          return this.compare(a.issue_number, b.issue_number, isAsc);
        case 'project':
          return this.compare(a.project, b.project, isAsc);
        default:
          return 0;
      }
    }))).subscribe();
  }

  onReset() {
    this.inp_issueno = '';
    this.sel_status = 'None';
    // this.fetchIssues();
  }

  onChange(event: any, issue: Issue) {
    this.issueService.updateIssue(issue.id, event.value);
  }

  changeBackground(value: Issue): string {
    // Nếu không có due date hoặc due date rỗng, không thay đổi màu nền
    if (!value.duedate || value.duedate.trim() === "") {
      return "None";
    }

    let status = value.test_state;
    if (status == "Done" || status == "Old") {
      return "None";
    }

    let today = new Date();
    let duedate = Date.parse(value.duedate);
    const diffDays = Math.round(Math.abs((duedate - today.getTime()) / this.oneDay));
    let color = '#BEED6B';

    if (diffDays < -7) {
      color = "None";
    } else if (diffDays >= 0 && diffDays <= 7) {
      if (status == "Done" || status == "Old") {
        color = "None";
      } else {
        color = "#EDCB6B"; //Expired!!
      }
    } else { 
      if(diffDays >= -7 ){
        color = "#EDCB6B"; //Expired!!
      }else{
        color = "#BEED6B";
      }
    }

    return color;
  }

  onClick(event: any) {
    const path = event.target.textContent;
    const folderPath = path.substring(0, path.lastIndexOf("Testcase") - 1);
    
    // Use modern Clipboard API
    navigator.clipboard.writeText(folderPath)
      .then(() => {
        this._snackBar.open(`Copied "${folderPath}"`, '', {
          duration: 1000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
        this._snackBar.open('Failed to copy path', '', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      });
  }

  onSearch(issue_number: string, test_status: any) {
    this.isLoading = true;
    this.noData = false;

    if (test_status === undefined || test_status === "None" || test_status === "") {
      if (issue_number === undefined || issue_number === '') {
        this.issues$ = this.issueService.getIssues().pipe(
          map((issues: Issue[]) => {
            this.isLoading = false;
            this.noData = issues.length === 0;
            return issues;
          })
        );
      } else {
        this.issues$ = this.issueService.getIssuesByNumber(issue_number).pipe(
          map((issues: Issue[]) => {
            this.isLoading = false;
            this.noData = issues.length === 0;
            return issues;
          })
        );
      }
    } else if (issue_number === undefined || issue_number === '') {
      this.issues$ = this.issueService.getIssuesByStatus(test_status.value).pipe(
        map((issues: Issue[]) => {
          this.isLoading = false;
          this.noData = issues.length === 0;
          return issues;
        })
      );
    } else {
      this.issues$ = this.issueService.getIssuesByNumberAndStatus(issue_number, test_status.value).pipe(
        map((issues: Issue[]) => {
          this.isLoading = false;
          this.noData = issues.length === 0;
          return issues;
        })
      );
    }
    
    // Hide sidebar only on mobile after search
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

  onDelete(event: any, issue: Issue) {
    if (confirm(`Are you sure you want to delete issue ${issue.issue_number}?`)) {
      this.issueService.deleteIssue(issue.id)
        .subscribe({
          next: () => {
            this._snackBar.open(`Issue ${issue.issue_number} deleted successfully`, '', {
              duration: 2000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['success-snackbar']
            });
            // Refresh data based on current filters
            this.onSearch(this.inp_issueno, this.sel_status);
          },
          error: (error: Error) => {
            console.error('Failed to delete issue:', error);
            this._snackBar.open(`Failed to delete issue ${issue.issue_number}`, '', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }
}
