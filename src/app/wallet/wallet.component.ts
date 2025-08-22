import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { Observable, map } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { moneyTransactionCsvService } from '../services/wallet.realtimedb.service';
import { MoneyTransactionClass } from '../shared/models/money-transaction';
import { WalletAddDialogComponent } from '../wallet-add-dialog/wallet-add-dialog.component';
import { BillDetailComponent } from '../bill-detail/bill-detail.component';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
  isSidebarOpen = false;
  isSidebarCollapsed = false;
  isMobile = false;
  isLoading = false;
  noData = false;
  walletGroups: WalletDayGroup[] = [];
  displayedColumns: string[] = [
    'category',
    'amount',
    'currency',
    'date',
  ];
  dataSource: MatTableDataSource<MoneyTransactionClass>;

  totalExpense = 0;
  totalIncome = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private moneyService: moneyTransactionCsvService, private _snackBar: MatSnackBar, private dialog: MatDialog) {
    this.dataSource = new MatTableDataSource();
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

  ngOnInit(): void {
    this.isLoading = true;
    this.loadTransactions();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getIcon(category: string): string {
    switch (category.toLowerCase()) {
      case 'salary': return 'assets/icons/gitlab.svg';
      case 'gas': return 'assets/icons/gitlab.svg';
      case 'meat': return 'assets/icons/gitlab.svg';
      case 'vcb': return 'assets/icons/gitlab.svg';
      case 'momo': return 'assets/icons/gitlab.svg';
      default: return 'assets/icons/gitlab.svg';
    }
  }

  loadTransactions() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    this.moneyService.filterByMonthYear(month, year).subscribe(
      transactions => {
        transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
        this.dataSource.data = transactions;

        // Tính tổng thu chi của tháng
        this.totalExpense = transactions
          .filter(t => t.isExpense())
          .reduce((sum, t) => sum + t.amount, 0);
        this.totalIncome = transactions
          .filter(t => t.isIncome())
          .reduce((sum, t) => sum + t.amount, 0);

        // Group transactions by date
        const grouped = transactions.reduce((acc: { [key: string]: MoneyTransactionClass[] }, t: MoneyTransactionClass) => {
          const key = t.date.toISOString().slice(0, 10);
          if (!acc[key]) acc[key] = [];
          acc[key].push(t);
          return acc;
        }, {});

        this.walletGroups = [];
        const sortedDates = Object.keys(grouped).sort().reverse(); // giảm dần
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

    // Chỉ lấy phần ngày, bỏ giờ/phút/giây
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

  openAddDialog() {
    this.dialog.open(WalletAddDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
      panelClass: 'wallet-add-dialog-panel'
    }).afterClosed().subscribe(reload => {
      if (reload) {
        this.loadTransactions(); // gọi lại hàm lấy danh sách transaction từ service
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
        this.loadTransactions(); // gọi lại hàm lấy danh sách transaction từ service
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
}

interface WalletDayGroup {
  date: string;
  dayLabel: string;
  totalIncome: number;
  totalExpense: number;
  transactions: MoneyTransactionClass[];
}
