import { Component, OnInit, HostListener } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { moneyTransactionCsvService } from '../services/wallet.realtimedb.service';
import { MoneyTransactionClass } from '../shared/models/money-transaction';
import { WalletAddDialogComponent } from '../wallet-add-dialog/wallet-add-dialog.component';
import { BillDetailComponent } from '../bill-detail/bill-detail.component';
import { SelectMonthDialogComponent } from '../select-month-dialog/select-month-dialog.component';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
  isSidebarCollapsed = false;
  isMobile = false;
  isLoading = false;
  walletGroups: WalletDayGroup[] = [];
  totalExpense = 0;
  totalIncome = 0;
  selectedMonthYear = '';

  constructor(
    private moneyService: moneyTransactionCsvService,
    private _snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isSidebarCollapsed = false;
    }
  }

  ngOnInit(): void {
    this.isLoading = true;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    this.selectedMonthYear = `${year}-${month.toString().padStart(2, '0')}`;
    this.loadTransactions();
  }

  getIcon(category: string): string {
    return 'assets/icons/gitlab.svg';
  }

  loadTransactions() {
    if (!this.selectedMonthYear) return;
    const [year, month] = this.selectedMonthYear.split('-');
    this.moneyService.filterByMonthYear(+month, +year).subscribe(
      transactions => {
        transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

        this.totalExpense = transactions
          .filter(t => t.isExpense())
          .reduce((sum, t) => sum + t.amount, 0);
        this.totalIncome = transactions
          .filter(t => t.isIncome())
          .reduce((sum, t) => sum + t.amount, 0);

        const grouped = transactions.reduce((acc: { [key: string]: MoneyTransactionClass[] }, t: MoneyTransactionClass) => {
          const key = t.date.toISOString().slice(0, 10);
          if (!acc[key]) acc[key] = [];
          acc[key].push(t);
          return acc;
        }, {});

        this.walletGroups = [];
        const sortedDates = Object.keys(grouped).sort().reverse();
        for (const date of sortedDates) {
          const txs = grouped[date];
          const totalIncome = txs.filter((t: MoneyTransactionClass) => t.isIncome())
            .reduce((s: number, t: MoneyTransactionClass) => s + t.amount, 0);
          const totalExpense = txs.filter((t: MoneyTransactionClass) => t.isExpense())
            .reduce((s: number, t: MoneyTransactionClass) => s + t.amount, 0);

          this.walletGroups.push({
            date,
            dayLabel: this.formatDayLabel(date),
            totalIncome,
            totalExpense,
            transactions: txs
          });
        }
      },
      error => {
        console.error('Error loading transactions:', error);
      }
    );
  }

  formatDayLabel(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = todayOnly.getTime() - dateOnly.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    let label = '';
    if (diffDays === 0) {
      label = 'Today';
    } else if (diffDays === 1) {
      label = 'Yesterday';
    } else {
      label = date.toLocaleString('default', { month: 'short', day: 'numeric' });
    }
    label += ` ${date.toLocaleString('default', { weekday: 'short' })}`;
    return label;
  }

  onMonthYearChange() {
    this.loadTransactions();
  }

  filterTransactionsByMonthYear(selectedMonthYear: string) {
    this.selectedMonthYear = selectedMonthYear;
    this.loadTransactions();
  }

  openCalendarDialog() {
    const [year, month] = this.selectedMonthYear.split('-').map(Number);
    this.dialog.open(SelectMonthDialogComponent, {
      data: { year, month }
    }).afterClosed().subscribe(result => {
      if (result && result.year && result.month) {
        this.selectedMonthYear = `${result.year}-${result.month.toString().padStart(2, '0')}`;
        this.loadTransactions();
      }
    });
  }

  openAddDialog() {
    this.dialog.open(WalletAddDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
      panelClass: 'wallet-add-dialog-panel'
    }).afterClosed().subscribe(reload => {
      if (reload) {
        this.loadTransactions();
      }
    });
  }

  openBillDetail(tx: any) {
    const dialogRef = this.dialog.open(BillDetailComponent, {
      data: tx,
      width: '350px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'delete' && result.id) {
        this.deleteTransactionById(result.id);
        this.loadTransactions();
      } else if (result && result.action === 'edit') {
        this.loadTransactions();
      }
    });
  }

  deleteTransactionById(id: string) {
    this.moneyService.deleteTransactionFromLocalStorage(id);
    this._snackBar.open('Transaction deleted successfully', 'Close', {
      duration: 2000,
      panelClass: ['snackbar-success']
    });
    this.loadTransactions();
  }

  getMonthLabel(val: string) {
    if (!val) return '';
    const [year, month] = val.split('-');
    const date = new Date(Number(year), Number(month)-1, 1);
    return date.toLocaleString('default', { month: 'short' }) + ' ' + year;
  }
}

interface WalletDayGroup {
  date: string;
  dayLabel: string;
  totalIncome: number;
  totalExpense: number;
  transactions: MoneyTransactionClass[];
}
