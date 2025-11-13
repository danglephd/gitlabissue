import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-select-month-dialog',
  templateUrl: './select-month-dialog.component.html',
  styleUrls: ['./select-month-dialog.component.css']
})
export class SelectMonthDialogComponent {
  year: number;
  month: number;
  months = [1,2,3,4,5,6,7,8,9,10,11,12];

  constructor(
    public dialogRef: MatDialogRef<SelectMonthDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { year: number, month: number }
  ) {
    this.year = data.year;
    this.month = data.month;
  }

  prevYear() { this.year--; }
  nextYear() { this.year++; }
  resetToCurrent() {
    const now = new Date();
    this.year = now.getFullYear();
    this.month = now.getMonth() + 1;
  }
  selectMonth(m: number) { this.month = m; }
  close(ok: boolean) {
    if (ok) this.dialogRef.close({ year: this.year, month: this.month });
    else this.dialogRef.close();
  }
}
