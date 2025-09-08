import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { Issue } from '../issue';
import { Observable, map } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { IssueRealtimeDbService } from '../services/issue.realtimedb.service';

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
  displayedColumns: string[] = ['issue_number', 'actions', 'project', 'links', 'path', 'test_state', 'duedate'];
  dataSource = new MatTableDataSource<Issue>();
  lastQuickFilter: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private issueService: IssueRealtimeDbService, private _snackBar: MatSnackBar, private dialog: MatDialog) {
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
    this.issueService.getIssues().subscribe((issues: Issue[]) => {
      this.isLoading = false;
      this.noData = issues.length === 0;
      this.dataSource.data = issues;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  private compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  sortData(sort: Sort) {
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
  }

  onChange(event: any, issue: Issue) {
    this.issueService.updateIssue(issue.id, event.value);
  }

  changeBackground(value: Issue): string {
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
        color = "#EDCB6B";
      }
    } else {
      if (diffDays >= -7) {
        color = "#EDCB6B";
      } else {
        color = "#BEED6B";
      }
    }

    return color;
  }

  private copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        textArea.remove();

        if (success) {
          resolve();
        } else {
          reject(new Error('Failed to copy text'));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target) return;

    const path = target.textContent;
    if (!path) {
      this._snackBar.open('No path to copy', '', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
      return;
    }

    const folderPath = path.substring(0, path.lastIndexOf("Testcase") - 1);
    if (!folderPath) {
      this._snackBar.open('Invalid path format', '', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.copyToClipboard(folderPath.trim())
      .then(() => {
        this._snackBar.open(`Copied "${folderPath}"`, '', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
      })
      .catch(() => {
        this._snackBar.open('Failed to copy path', '', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      });
  }

  onSearch(issue_number: string, test_status: any) {
    this.lastQuickFilter = null; // Reset lại trạng thái quick filter khi search
    this.isLoading = true;
    this.noData = false;

    if (test_status === undefined || test_status === "None" || test_status === "") {
      if (issue_number === undefined || issue_number === '') {
        this.issues$ = this.issueService.getIssues();
      } else {
        this.issues$ = this.issueService.getIssuesByNumber(issue_number);
      }
    } else if (issue_number === undefined || issue_number === '') {
      this.issues$ = this.issueService.getIssuesByStatus(test_status.value);
    } else {
      this.issues$ = this.issueService.getIssuesByNumberAndStatus(issue_number, test_status.value);
    }

    this.issues$.subscribe({
      next: (issues) => {
        this.isLoading = false;
        this.noData = issues.length === 0;
        this.dataSource.data = issues;
      },
      error: () => {
        this.isLoading = false;
      }
    });

    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

  onQuickFilter(type: string, event: Event) {
    event.preventDefault();
    this.lastQuickFilter = type; // Lưu lại filter cuối cùng
    this.isLoading = true;
    this.noData = false;

    let issuesObservable: Observable<Issue[]>;

    switch (type) {
      case 'duplicate':
        issuesObservable = this.issueService.getIssuesWithDuplicatePath();
        break;
      case 'working':
        issuesObservable = this.issueService.getIssuesByStatus('Working');
        break;
      case 'finished':
        issuesObservable = this.issueService.getIssuesByStatus('Finish');
        break;
      case 'newfirst':
        issuesObservable = this.issueService.getIssuesSortedByNewest();
        break;
      case 'all':
      default:
        issuesObservable = this.issueService.getIssues();
        break;
    }

    issuesObservable.subscribe({
      next: (issues) => {
        this.isLoading = false;
        this.noData = issues.length === 0;
        this.dataSource.data = issues;
      },
      error: () => {
        this.isLoading = false;
        this.noData = true;
        this.dataSource.data = [];
      }
    });

    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

  onDeleteDuplicate(event: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Are you sure you want to delete Duplicated issues?` }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.issueService.deleteDuplicateIssuesKeepOne()
          .then(() => {
            this._snackBar.open(`Duplicate issues deleted successfully`, '', {
              duration: 2000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['success-snackbar']
            });
            // Nếu đã dùng quickFilter thì reload theo quickFilter, nếu không thì search như cũ
            if (this.lastQuickFilter) {
              this.onQuickFilter(this.lastQuickFilter, new Event('click'));
            } else {
              this.onSearch(this.inp_issueno, this.sel_status);
            }
          })
          .catch(() => {
            this._snackBar.open(`Failed to delete duplicate issues`, '', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['error-snackbar']
            });
          });
      }
    });
  }

  onDelete(event: any, issue: Issue) {
    const issuePath = issue.path;
    const match = issuePath.match(/Testcase-(\d+)-(\d+)/);
    const issue_string = match ? `${match[1]}-${match[2]}` : issue.issue_number.toString();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Are you sure you want to delete issue ${issue_string}?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.issueService.deleteIssue(issue.id)
          .then(() => {
            this._snackBar.open(`Issue ${issue.issue_number} deleted successfully`, '', {
              duration: 2000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['success-snackbar']
            });
            // Nếu đã dùng quickFilter thì reload theo quickFilter, nếu không thì search như cũ
            if (this.lastQuickFilter) {
              this.onQuickFilter(this.lastQuickFilter, new Event('click'));
            } else {
              this.onSearch(this.inp_issueno, this.sel_status);
            }
          })
          .catch(() => {
            this._snackBar.open(`Failed to delete issue ${issue.issue_number}`, '', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['error-snackbar']
            });
          });
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
