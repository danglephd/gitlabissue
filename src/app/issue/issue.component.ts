import { Component, OnInit } from '@angular/core';
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
  
  constructor(private issueService: IssueService, private _snackBar: MatSnackBar) { }

  testStatus: status[] = [
    { value: 'Finish' },
    { value: 'Working' },
    { value: 'Created' },
    { value: 'Done' },
    { value: 'Old' },
  ];

  ngOnInit(): void {
    this.fetchIssues();
  }

  private fetchIssues(): void {
    this.issues$ = this.issueService.getIssues();
  }

  private compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  sortData(sort: Sort) {
    console.log('>>>>sortData', sort);
    if (!sort.active || sort.direction === '') {
      // console.log('>>>>sortData', sort);
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
    console.log(">>>onReset");
  }

  onChange(event: any) {
    this.issueService.updateIssue(event.source._id, event.value);
  }

  onClick(event: any) {
    let that = event.target
    let inp = document.createElement('input');
    document.body.appendChild(inp)
    let value = that.textContent
    let folderPath = value.substring(0, value.lastIndexOf("Testcase") - 1);
    inp.value = folderPath;
    inp.select();
    document.execCommand('copy', false);
    this._snackBar.open(`Copied "${folderPath}"`, '', {
      duration: 1000
    });
    inp.remove();
  }

  onClick2(event: any) {
    let that = event.target
    let inp = document.createElement('input');
    document.body.appendChild(inp)
    let value = that.textContent
    let folderPath = value
    inp.value = folderPath;
    inp.select();
    document.execCommand('copy', false);
    this._snackBar.open(`Copied "${folderPath}"`, '', {
      duration: 1000
    });
    inp.remove();
  }

  onSearch(issue_number: string, test_status: any) {
    // console.log('>>>>onSearch', issue_number, test_status);
    if (test_status === undefined) {
      this.issues$ = this.issueService.getIssuesByNumber(issue_number);
    } else if (issue_number === undefined || issue_number === '') {
      this.issues$ = this.issueService.getIssuesByStatus(test_status.value);
    }
    else {
      this.issues$ = this.issueService.getIssuesByNumberAndStatus(issue_number, test_status.value);
    }
  }
}
