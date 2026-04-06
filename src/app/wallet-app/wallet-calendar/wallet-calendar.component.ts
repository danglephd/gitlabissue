import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { moneyTransactionCsvService } from '../../services/wallet.realtimedb.service';
import { MoneyTransactionClass } from '../../shared/models/money-transaction';

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
  selectedDateRange: { start: Date | null, end: Date | null, expense?: number, income?: number } = { start: null, end: null };
  dayData: { [key: string]: { expense?: number, income?: number } } = {};
  totalExpense = 0;
  totalIncome = 0;
  totalBalance = 0;
  transactionsOfSelectedDay: MoneyTransactionClass[] = [];
  isDragging = false;
  dragStartDay: CalendarDay | null = null;

  @Output() back = new EventEmitter<void>();

  constructor(private moneyService: moneyTransactionCsvService) {}

  ngOnInit() {
    const today = new Date();
    this.month = today.getMonth();
    this.year = today.getFullYear();
    this.updateDayDataAndCalendar();
    this.selectToday();
    // Hiển thị transactions của ngày hiện tại (nếu có)
    if (this.selectedDay && this.selectedDay.date) {
      try {
        this.transactionsOfSelectedDay = this.moneyService.getTransactionsByDate(this.selectedDay.date);
      } catch (error) {
        console.error('Error loading transactions on init:', error);
        this.transactionsOfSelectedDay = [];
      }
    }
  }

  updateDayDataAndCalendar() {
    try {
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
    } catch (error) {
      console.error('Error updating calendar data:', error);
      this.dayData = {};
      this.totalExpense = 0;
      this.totalIncome = 0;
      this.totalBalance = 0;
    }
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
    this.isDragging = false;
    this.selectedDateRange = { start: null, end: null };
    this.transactionsOfSelectedDay = [];
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
    this.isDragging = false;
    this.selectedDateRange = { start: null, end: null };
    this.transactionsOfSelectedDay = [];
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
    
    // Nếu không phải drag, reset range và select single day
    if (!this.isDragging && (!this.selectedDateRange.start || 
        this.selectedDateRange.start.getTime() === this.selectedDateRange.end?.getTime())) {
      this.selectedDay = day;
      this.selectedDateRange = { start: null, end: null };
      
      try {
        this.transactionsOfSelectedDay = this.moneyService.getTransactionsByDate(this.selectedDay.date!);
      } catch (error) {
        console.error('Error loading transactions for selected day:', error);
        this.transactionsOfSelectedDay = [];
      }
    }
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

  // Drag & Drop Methods
  onDayMouseDown(day: CalendarDay) {
    if (!day.isCurrentMonth || !day.day) return;
    this.isDragging = true;
    this.dragStartDay = day;
    this.selectedDateRange = { start: day.date, end: day.date };
    this.selectedDay = day;
    this.loadTransactionsForRange();
  }

  onDayMouseEnter(day: CalendarDay) {
    if (!this.isDragging || !this.dragStartDay || !day.isCurrentMonth || !day.day) return;
    
    // Xác định start và end của range
    const start = this.dragStartDay.date!.getTime();
    const current = day.date!.getTime();
    
    if (start <= current) {
      this.selectedDateRange = { start: this.dragStartDay.date, end: day.date };
    } else {
      this.selectedDateRange = { start: day.date, end: this.dragStartDay.date };
    }
  }

  onDayMouseUp(day: CalendarDay) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.loadTransactionsForRange();
  }

  isDateInRange(date: Date | null): boolean {
    if (!date || !this.selectedDateRange.start || !this.selectedDateRange.end) return false;
    const time = date.getTime();
    const startTime = new Date(this.selectedDateRange.start).setHours(0, 0, 0, 0);
    const endTime = new Date(this.selectedDateRange.end).setHours(23, 59, 59, 999);
    return time >= startTime && time <= endTime;
  }

  loadTransactionsForRange() {
    if (!this.selectedDateRange.start || !this.selectedDateRange.end) {
      this.transactionsOfSelectedDay = [];
      return;
    }
    try {
      this.transactionsOfSelectedDay = this.moneyService.getTransactionsByDates(
        this.selectedDateRange.start,
        this.selectedDateRange.end
      );
      
      // Tính toán expense và income từ transactions
      let totalExpense = 0;
      let totalIncome = 0;
      this.transactionsOfSelectedDay.forEach(tx => {
        if (tx.billType?.toLowerCase() === 'expenses') {
          totalExpense += Math.abs(tx.amount);
        } else if (tx.billType?.toLowerCase() === 'income') {
          totalIncome += tx.amount;
        }
      });
      
      // Cập nhật selectedDateRange với expense và income
      this.selectedDateRange.expense = totalExpense;
      this.selectedDateRange.income = totalIncome;
    } catch (error) {
      console.error('Error loading transactions for date range:', error);
      this.transactionsOfSelectedDay = [];
      this.selectedDateRange.expense = 0;
      this.selectedDateRange.income = 0;
    }
  }
}
