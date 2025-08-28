import { Component, OnInit } from '@angular/core';
import { moneyTransactionCsvService } from '../services/wallet.realtimedb.service';

interface CalendarDay {
  date: Date | null;
  day: number | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  expense?: number;
  income?: number;
}

@Component({
  selector: 'app-wallet-calendar',
  templateUrl: './wallet-calendar.component.html',
  styleUrls: ['./wallet-calendar.component.css']
})
export class WalletCalendarComponent implements OnInit {
  month = 0;
  year = 0;
  weeks: CalendarDay[][] = [];
  selectedDay: CalendarDay | null = null;
  dayData: { [key: string]: { expense?: number, income?: number } } = {};
  totalExpense = 0;
  totalIncome = 0;
  totalBalance = 0;

  constructor(private moneyService: moneyTransactionCsvService) {}

  ngOnInit() {
    const today = new Date();
    this.month = today.getMonth();
    this.year = today.getFullYear();
    this.updateDayDataAndCalendar();
    this.selectToday();
  }

  updateDayDataAndCalendar() {
    // Lấy dữ liệu ngày theo tháng/năm
    this.dayData = this.moneyService.getDayDataByMonthYear(this.month + 1, this.year);
    this.generateCalendar();
    // Tính tổng expense, income, balance
    this.totalExpense = 0;
    this.totalIncome = 0;
    Object.values(this.dayData).forEach(d => {
      if (d.expense) this.totalExpense += d.expense;
      if (d.income) this.totalIncome += d.income;
    });
    this.totalBalance = this.totalIncome - this.totalExpense;
  }

  get monthLabel() {
    return new Date(this.year, this.month).toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  prevMonth() {
    if (this.month === 0) {
      this.month = 11;
      this.year--;
    } else {
      this.month--;
    }
    this.updateDayDataAndCalendar();
    this.selectedDay = null;
  }

  nextMonth() {
    if (this.month === 11) {
      this.month = 0;
      this.year++;
    } else {
      this.month++;
    }
    this.updateDayDataAndCalendar();
    this.selectedDay = null;
  }

  generateCalendar() {
    const firstDay = new Date(this.year, this.month, 1);
    const lastDay = new Date(this.year, this.month + 1, 0);
    const weeks: CalendarDay[][] = [];
    let week: CalendarDay[] = [];

    // Fill empty days before first day
    for (let i = 0; i < firstDay.getDay(); i++) {
      week.push({ date: null, day: null, isCurrentMonth: false, isToday: false });
    }

    // Fill days of month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(this.year, this.month, d);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const dayInfo = this.dayData[key];
      // Chỉ add expense/income nếu có dữ liệu
      week.push({
        date,
        day: d,
        isCurrentMonth: true,
        isToday: this.isToday(date),
        ...(dayInfo ? { expense: dayInfo.expense, income: dayInfo.income } : {})
      });
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    // Fill empty days after last day
    while (week.length < 7 && week.length > 0) {
      week.push({ date: null, day: null, isCurrentMonth: false, isToday: false });
    }
    if (week.length) weeks.push(week);

    this.weeks = weeks;
  }

  isToday(date: Date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  selectDay(day: CalendarDay) {
    if (!day.isCurrentMonth || !day.day) return;
    this.selectedDay = day;
  }

  selectToday() {
    const today = new Date();
    if (today.getMonth() === this.month && today.getFullYear() === this.year) {
      for (const week of this.weeks) {
        for (const day of week) {
          if (day.isToday) {
            this.selectedDay = day;
            return;
          }
        }
      }
    }
    this.selectedDay = null;
  }
}
