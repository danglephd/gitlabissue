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

  onChange(event: any) {
    this.issueService.updateIssue(event.source._id, event.value);
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
    console.log('>>>changeBackground ', diffDays);

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
    if (test_status === undefined || test_status === "None" || test_status === "") {
      if (issue_number === undefined || issue_number === '') {
        this.issues$ = this.issueService.getIssues();
      } else {
        this.issues$ = this.issueService.getIssuesByNumber(issue_number);
      }
    } else if (issue_number === undefined || issue_number === '') {
      this.issues$ = this.issueService.getIssuesByStatus(test_status.value);
    }
    else {
      this.issues$ = this.issueService.getIssuesByNumberAndStatus(issue_number, test_status.value);
    }
    
    // Hide sidebar only on mobile after search
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }
}
