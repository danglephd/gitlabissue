import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-day-transactions',
  templateUrl: './day-transactions.component.html',
  styleUrls: ['./day-transactions.component.css']
})
export class DayTransactionsComponent {
  @Input() dayLabel?: string;
  @Input() totalExpense?: number;
  @Input() totalIncome?: number;
  @Input() transactions: any[] = [];
  @Input() showHeader: boolean = true;

  @Output() billDetail = new EventEmitter<any>();

  openBillDetail(tx: any) {
    this.billDetail.emit(tx);
  }
}
