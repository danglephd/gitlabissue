import { Component, HostListener } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CalendarDialogComponent } from '../calendar-dialog/calendar-dialog.component';

@Component({
  selector: 'app-wallet-add-dialog',
  templateUrl: './wallet-add-dialog.component.html',
  styleUrls: ['./wallet-add-dialog.component.css']
})
export class WalletAddDialogComponent {
  activeTab: 'expenses' | 'income' | 'transfer' = 'expenses';

  keypad = [
    ['1', '2', '3', '⌫'],
    ['4', '5', '6', '+'],
    ['7', '8', '9', '-'],
    ['.', '0', '000', '×'],
    ['÷', '', 'OK', ''] // vị trí thứ 2 sẽ là Today
  ];

  expensesCategories = [
    { name: 'Meat', icon: 'assets/icons/gitlab.svg' },
    { name: 'Gas', icon: 'assets/icons/gitlab.svg' },
    { name: 'Trans', icon: 'assets/icons/gitlab.svg' },
    { name: 'Elderly', icon: 'assets/icons/gitlab.svg' },
    { name: 'Beverages', icon: 'assets/icons/gitlab.svg' },
    { name: 'Travel', icon: 'assets/icons/gitlab.svg' },
    { name: 'Rent', icon: 'assets/icons/gitlab.svg' },
    { name: 'Drink', icon: 'assets/icons/gitlab.svg' },
    { name: 'Lottery', icon: 'assets/icons/gitlab.svg' },
    { name: 'Child', icon: 'assets/icons/gitlab.svg' },
    { name: 'Stationery', icon: 'assets/icons/gitlab.svg' },
    { name: 'Medical', icon: 'assets/icons/gitlab.svg' },
    { name: 'Gift', icon: 'assets/icons/gitlab.svg' },
    { name: 'Books', icon: 'assets/icons/gitlab.svg' },
    { name: 'Edit', icon: 'assets/icons/gitlab.svg' }
  ];

  incomeCategories = [
    { name: 'Salary', icon: 'assets/icons/gitlab.svg' },
    { name: 'Bonus', icon: 'assets/icons/gitlab.svg' },
    { name: 'Interest', icon: 'assets/icons/gitlab.svg' },
    { name: 'Gift', icon: 'assets/icons/gitlab.svg' },
    { name: 'Other', icon: 'assets/icons/gitlab.svg' }
  ];

  transferCategories = [
    { name: 'Bank', icon: 'assets/icons/gitlab.svg' },
    { name: 'Wallet', icon: 'assets/icons/gitlab.svg' },
    { name: 'Card', icon: 'assets/icons/gitlab.svg' }
  ];

  categories = this.expensesCategories;

  amount: string = '0';
  private lastOperator: string | null = null;
  private lastValue: string = '';
  private justCalculated: boolean = false;

  selectedDate: Date = new Date();
  todayLabel: string = 'Today';

  get displayAmount(): string {
    // Format số với dấu phẩy phân cách hàng nghìn
    const formatNumber = (numStr: string) => {
      if (numStr === '' || numStr === '0') return '0';
      const [intPart, decimalPart] = numStr.split('.');
      const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return decimalPart ? `${intFormatted}.${decimalPart}` : intFormatted;
    };

    if (this.lastOperator && !this.justCalculated) {
      // Nếu amount là '0', chỉ hiển thị phép toán, không hiện số 0
      return this.amount === '0'
        ? `${formatNumber(this.lastValue)} ${this.lastOperator}`
        : `${formatNumber(this.lastValue)} ${this.lastOperator} ${formatNumber(this.amount)}`;
    }
    return formatNumber(this.amount);
  }

  get isOperatorMode(): boolean {
    return !!this.lastOperator && !this.justCalculated;
  }

  get amountClass(): string {
    // Nếu độ dài lớn hơn 14 ký tự thì giảm font
    return this.displayAmount.length > 14 ? 'amount small' : 'amount';
  }

  onKeypadClick(key: string) {
    if (key === 'Today') {
      this.openCalendarDialog();
      return;
    }
    if (key === 'OK') {
      console.log('Lưu dữ liệu mới:', this.amount);
      return;
    }
    if (key === '⌫') {
      if (this.amount.length > 1) {
        this.amount = this.amount.slice(0, -1);
      } else {
        this.amount = '0';
      }
      return;
    }
    if (key === '000') {
      if (this.amount.length + 3 <= 10) {
        this.amount = this.amount === '0' ? '0' : this.amount + '000';
      }
      return;
    }
    if (['+', '-', '×', '÷'].includes(key)) {
      if (this.lastOperator && !this.justCalculated) {
        // Nếu đã có toán tử, thực hiện phép tính trước
        this.calculate();
        this.lastValue = this.amount;
        this.lastOperator = key;
        this.amount = '0';
        this.justCalculated = false;
      } else {
        this.lastValue = this.amount;
        this.lastOperator = key;
        this.amount = '0';
        this.justCalculated = false;
      }
      return;
    }
    if (key === '.') {
      if (!this.amount.includes('.')) {
        this.amount += '.';
      }
      return;
    }
    if (key === '=') {
      this.calculate();
      this.justCalculated = true;
      return;
    }
    if (!isNaN(Number(key))) {
      if (this.justCalculated) {
        // Sau khi tính xong, nhập số mới sẽ reset phép tính
        this.amount = key;
        this.lastOperator = null;
        this.lastValue = '';
        this.justCalculated = false;
      } else if (this.amount === '0') {
        this.amount = key;
      } else if (this.amount.length < 10) {
        this.amount += key;
      }
      return;
    }
  }

  openCalendarDialog() {
    const dialogRef = this.dialog.open(CalendarDialogComponent, {
      width: '360px',
      panelClass: 'calendar-dialog-panel',
      data: { selectedDate: this.selectedDate } // truyền ngày đã chọn
    });

    dialogRef.afterClosed().subscribe((result: Date) => {
      if (result) {
        this.selectedDate = result;
        this.todayLabel = this.getDateLabel(result);
      }
    });
  }

  getDateLabel(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    // Hiển thị dạng DD/MM
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}`;
  }

  calculate() {
    if (!this.lastOperator || !this.lastValue) return;
    const a = parseFloat(this.lastValue);
    const b = parseFloat(this.amount);
    let result = 0;
    switch (this.lastOperator) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '×': result = a * b; break;
      case '÷': result = b !== 0 ? a / b : 0; break;
    }
    this.amount = result.toString().slice(0, 10);
    this.lastOperator = null;
    this.lastValue = '';
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const key = event.key;
    if (key >= '0' && key <= '9') {
      this.onKeypadClick(key);
      event.preventDefault();
    }
    if (key === '.') {
      this.onKeypadClick('.');
      event.preventDefault();
    }
    if (key === 'Backspace') {
      this.onKeypadClick('⌫');
      event.preventDefault();
    }
    if (key === '+') {
      this.onKeypadClick('+');
      event.preventDefault();
    }
    if (key === '-') {
      this.onKeypadClick('-');
      event.preventDefault();
    }
    if (key === '*') {
      this.onKeypadClick('×');
      event.preventDefault();
    }
    if (key === '/') {
      this.onKeypadClick('÷');
      event.preventDefault();
    }
    if (key === 'Enter' || key === '=') {
      this.onKeypadClick('=');
      event.preventDefault();
    }
  }

  onTabClick(tab: 'expenses' | 'income' | 'transfer') {
    this.activeTab = tab;
    if (tab === 'expenses') {
      this.categories = this.expensesCategories;
    } else if (tab === 'income') {
      this.categories = this.incomeCategories;
    } else {
      this.categories = this.transferCategories;
    }
  }

  constructor(
    private dialogRef: MatDialogRef<WalletAddDialogComponent>,
    private dialog: MatDialog
  ) { }

  onClose() {
    this.dialogRef.close();
  }
}