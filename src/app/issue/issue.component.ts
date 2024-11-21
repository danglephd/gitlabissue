import { Component, OnInit } from '@angular/core';
import { Issue } from '../issue';
import { Observable } from 'rxjs';
import { IssueService } from '../issue.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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

  onChange(event: any) {
    this.issueService.updateIssue(event.target.id, event.target.value);
  }

  onClick(event: any) {
    let that = event.target
    let inp = document.createElement('input');
    document.body.appendChild(inp)
    inp.value = that.textContent
    inp.select();
    document.execCommand('copy', false);
    this._snackBar.open(inp.value, '', {
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
