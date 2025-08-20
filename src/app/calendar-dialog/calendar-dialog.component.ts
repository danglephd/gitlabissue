import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-calendar-dialog',
  templateUrl: './calendar-dialog.component.html',
  styleUrls: ['./calendar-dialog.component.css']
})
export class CalendarDialogComponent {
  today = new Date();
  selectedDate: Date;
  currentMonth: number;
  currentYear: number;
  selectedHour: number;
  selectedMinute: number;
  isPM: boolean;

  constructor(
    private dialogRef: MatDialogRef<CalendarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Nhận ngày được truyền vào, nếu không có thì lấy ngày hiện tại
    this.selectedDate = data?.selectedDate ? new Date(data.selectedDate) : new Date();
    this.currentMonth = this.selectedDate.getMonth();
    this.currentYear = this.selectedDate.getFullYear();
    this.selectedHour = this.selectedDate.getHours();
    this.selectedMinute = this.selectedDate.getMinutes();
    this.isPM = this.selectedHour >= 12;
  }

  get monthName(): string {
    return this.selectedDate.toLocaleString('default', { month: 'long' });
  }

  get daysInMonth(): number {
    return new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
  }

  get firstDayOfWeek(): number {
    return new Date(this.currentYear, this.currentMonth, 1).getDay();
  }

  get calendarDays(): (number | null)[] {
    const days: (number | null)[] = [];
    for (let i = 0; i < this.firstDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= this.daysInMonth; d++) {
      days.push(d);
    }
    // Đảm bảo luôn đủ 6 dòng (6*7=42 ô)
    while (days.length < 42) {
      days.push(null);
    }
    return days;
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.selectedDate = new Date(this.currentYear, this.currentMonth, 1);
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.selectedDate = new Date(this.currentYear, this.currentMonth, 1);
  }

  selectDate(day: number | null) {
    if (day) {
      this.selectedDate = new Date(this.currentYear, this.currentMonth, day, this.selectedHour, this.selectedMinute);
    }
  }

  setHour(hour: number) {
    this.selectedHour = hour;
    this.selectedDate.setHours(hour);
  }

  setMinute(minute: number) {
    this.selectedMinute = minute;
    this.selectedDate.setMinutes(minute);
  }

  setAMPM(isPM: boolean) {
    this.isPM = isPM;
    if (isPM && this.selectedHour < 12) {
      this.selectedHour += 12;
    }
    if (!isPM && this.selectedHour >= 12) {
      this.selectedHour -= 12;
    }
    this.selectedDate.setHours(this.selectedHour);
  }

  toggleAMPM() {
    this.isPM = !this.isPM;
    if (this.isPM && this.selectedHour < 12) {
      this.selectedHour += 12;
    }
    if (!this.isPM && this.selectedHour >= 12) {
      this.selectedHour -= 12;
    }
    this.selectedDate.setHours(this.selectedHour);
  }

  close() {
    this.dialogRef.close();
  }

  confirm() {
    this.dialogRef.close(this.selectedDate);
  }
}