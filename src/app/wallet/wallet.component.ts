import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { Observable, map } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Wallet } from '../wallet';
import { WalletRealtimeDbService } from '../services/wallet.realtimedb.service';

interface status {
  value: string;
}

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
  wallets$: Observable<Wallet[]> = new Observable();
  inp_walletno: string = '';
  sel_status: string = '';
  oneDay = 24 * 60 * 60 * 1000;
  isSidebarOpen = false;
  isSidebarCollapsed = false;
  isMobile = false;
  isLoading = false;
  noData = false;
  displayedColumns: string[] = ['wallet_number', 'actions', 'project', 'links', 'path', 'test_state', 'duedate'];
  dataSource = new MatTableDataSource<Wallet>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private walletService: WalletRealtimeDbService, private _snackBar: MatSnackBar, private dialog: MatDialog) {
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

  testStatus: status[] = [
    { value: 'Finish' },
    { value: 'Working' },
    { value: 'Created' },
    { value: 'Done' },
    { value: 'Old' },
  ];

  ngOnInit(): void {
    this.isLoading = true;
    // this.fetchWallets();
  }

  // private fetchWallets(): void {
  //   this.walletService.getWallets().subscribe((wallets: Wallet[]) => {
  //     this.isLoading = false;
  //     this.noData = wallets.length === 0;
  //     this.dataSource.data = wallets;
  //     this.dataSource.paginator = this.paginator;
  //     this.dataSource.sort = this.sort;
  //   });
  // }

  // private compare(a: number | string, b: number | string, isAsc: boolean) {
  //   return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  // }

  // sortData(sort: Sort) {
  //   if (!sort.active || sort.direction === '') {
  //     return;
  //   }
  //   this.wallets$.pipe(map(data => data.sort((a, b) => {
  //     const isAsc = sort.direction === 'asc';
  //     switch (sort.active) {
  //       case 'wallet_number':
  //         return this.compare(a.wallet_number, b.wallet_number, isAsc);
  //       case 'project':
  //         return this.compare(a.project, b.project, isAsc);
  //       default:
  //         return 0;
  //     }
  //   }))).subscribe();
  // }

  // onReset() {
  //   this.inp_walletno = '';
  //   this.sel_status = 'None';
  // }

  // onChange(event: any, wallet: Wallet) {
  //   this.walletService.updateWallet(wallet.id, event.value);
  // }

}
