import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { moneyTransactionCsvService } from '../../services/wallet.realtimedb.service';
import { CreateAccountDialogComponent } from '../create-account-dialog/create-account-dialog.component';

@Component({
  selector: 'app-select-account-dialog',
  templateUrl: './select-account-dialog.component.html',
  styleUrls: ['./select-account-dialog.component.css']
})
export class SelectAccountDialogComponent implements OnInit {
  accounts: any[] = [];
  selectedAccount: any;

  constructor(
    public dialogRef: MatDialogRef<SelectAccountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private walletService: moneyTransactionCsvService,
    private dialog: MatDialog
  ) {
    this.selectedAccount = data.selectedAccount;
  }

  ngOnInit(): void {
    // Lấy accounts từ localStorage
    const savedAccounts = localStorage.getItem('accounts');
    if (savedAccounts) {
      this.accounts = JSON.parse(savedAccounts);
    } else {
      // Nếu không có trong localStorage, lấy từ service
      this.accounts = this.walletService.getAccounts();
    }
  }

  selectAccount(account: any) {
    this.selectedAccount = account;
    this.dialogRef.close({ account: account });
  }

  selectNone() {
    this.dialogRef.close({ account: null });
  }

  close() {
    this.dialogRef.close();
  }

  getIcon(accountName: string): string {
    const account = this.accounts.find(a => a.name === accountName);
    return account ? account.icon : 'assets/icons/gitlab.svg';
  }

  openCreateAccountDialog() {
    const dialogRef = this.dialog.open(CreateAccountDialogComponent, {
      width: '430px',
      maxHeight: '90vh',
      disableClose: false,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.account) {
        // Reload accounts from localStorage
        const savedAccounts = localStorage.getItem('accounts');
        if (savedAccounts) {
          this.accounts = JSON.parse(savedAccounts);
        }
        // Auto-select the newly created account
        this.selectAccount(result.account);
      }
    });
  }
}
