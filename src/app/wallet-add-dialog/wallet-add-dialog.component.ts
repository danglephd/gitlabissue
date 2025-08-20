import { Component, HostListener } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CalendarDialogComponent } from '../calendar-dialog/calendar-dialog.component';
import { moneyTransactionCsvService } from '../services/wallet.realtimedb.service';
import { MoneyTransactionClass } from '../shared/models/money-transaction';

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

  selectedCategory: any = this.expensesCategories[0];
  selectedIncomeCategory: any = this.incomeCategories[0];
  selectedTransferCategory: any = this.transferCategories[0];

  note: string = ''; // Biến lưu trữ ghi chú

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
    if (key === 'OK') {  // Định dạng thời gian: yyyy-MM-dd HH:mm:ss
      const formatDate = (d: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };

      // Tạo transaction mới với đầy đủ trường
      const newTx = new MoneyTransactionClass({
        date: formatDate(this.selectedDate),
        category: this.currentSelectedCategory?.name,
        billType: this.activeTab,
        currency: 'VND',
        notes: this.note || '',
        account: 'Cash',
        ledger: '',
        tags: '',
        includedInBudget: true,
        id: this.generateId(false, '', this.activeTab, 'Cash'),
        image: '',
        amount: parseFloat(this.amount.replace(/,/g, ''))
      });
      this.walletService.addTransactionToLocalStorage(newTx);
      this.dialogRef.close(true);
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

  onCategorySelect(category: any) {
    if (this.activeTab === 'expenses') {
      this.selectedCategory = category;
    } else if (this.activeTab === 'income') {
      this.selectedIncomeCategory = category;
    } else if (this.activeTab === 'transfer') {
      this.selectedTransferCategory = category;
    }
  }

  onTabClick(tab: 'expenses' | 'income' | 'transfer') {
    this.activeTab = tab;
    if (tab === 'expenses') {
      this.categories = this.expensesCategories;
      // Nếu chưa chọn category ở tab này thì chọn mặc định
      if (!this.selectedCategory) {
        this.selectedCategory = this.expensesCategories[0];
      }
    } else if (tab === 'income') {
      this.categories = this.incomeCategories;
      if (!this.selectedIncomeCategory) {
        this.selectedIncomeCategory = this.incomeCategories[0];
      }
    } else {
      this.categories = this.transferCategories;
      if (!this.selectedTransferCategory) {
        this.selectedTransferCategory = this.transferCategories[0];
      }
    }
  }

  get currentSelectedCategory() {
    if (this.activeTab === 'expenses') return this.selectedCategory;
    if (this.activeTab === 'income') return this.selectedIncomeCategory;
    return this.selectedTransferCategory;
  }

  constructor(
    private dialogRef: MatDialogRef<WalletAddDialogComponent>,
    private dialog: MatDialog,
    private walletService: moneyTransactionCsvService
  ) { }

  onClose() {
    this.dialogRef.close();
  }

  // Thêm hàm sinh id duy nhất cho mỗi transaction:
  generateId(
    isUpdate = false,
    oldId = '',
    billType: string = 'expenses',
    account: string = 'Cash',
    account2: string = ''
  ): string {
    // 1. Thời điểm tạo transaction
    let createdTime: number;
    let updatedTime: number;

    if (isUpdate && oldId) {
      // Lấy phần đầu tiên và cuối cùng của id cũ
      const parts = oldId.split('_');
      createdTime = Number(parts[0]);
      updatedTime = Date.now();
    } else {
      createdTime = Date.now();
      updatedTime = createdTime; // Khi tạo mới, updatedTime = createdTime
    }

    // 2. id account (nếu Transfer thì account1/account2)
    let accountId = account;
    if (billType === 'transfer' && account2) {
      accountId = `${account}/${account2}`;
    }

    // 3. Luôn là 0
    const num3 = 0;

    // 4. Luôn là 'n'
    const char4 = 'n';

    // 5. Luôn là 1
    const num5 = 1;

    // 6. BillType: 0 (expenses), 1 (income), 2 (transfer)
    let billTypeNum = 0;
    if (billType === 'income') billTypeNum = 1;
    else if (billType === 'transfer') billTypeNum = 2;

    // 7. Thời điểm cập nhật transaction

    return `${createdTime}_${accountId}_${num3}_${char4}_${num5}_${billTypeNum}_${updatedTime}`;
  }
}