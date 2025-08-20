import { Component, HostListener } from '@angular/core';

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
    ['÷', 'Today', 'OK']
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

  onKeypadClick(key: string) {
    if (key === 'OK') {
      console.log('Lưu dữ liệu mới:', this.amount);
      return;
    }
    if (key === 'Today') {
      // Xử lý chọn ngày hôm nay nếu cần
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

  onClose() {
    // Đóng dialog
  }
}