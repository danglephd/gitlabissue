import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { moneyTransactionCsvService } from '../../services/wallet.realtimedb.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-create-account-dialog',
  templateUrl: './create-account-dialog.component.html',
  styleUrls: ['./create-account-dialog.component.css']
})
export class CreateAccountDialogComponent implements OnInit {
  accountType: string = '';
  currentBalance: string = '';
  currency: string = 'đ (VND)';
  notes: string = '';
  includedInAssets: boolean = true;

  accountTypes = [
    'Cash',
    'Savings Account',
    'Checking Account',
    'Credit Card',
    'Investment',
    'Other'
  ];

  constructor(
    public dialogRef: MatDialogRef<CreateAccountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private walletService: moneyTransactionCsvService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
  }

  selectAccountType(type: string): void {
    this.accountType = type;
  }

  createAccount(): void {
    // Validate
    if (!this.accountType) {
      this.snackBar.open('Please select account type', 'Close', { duration: 2000 });
      return;
    }

    const balance = parseFloat(this.currentBalance) || 0;

    // Tạo account mới
    const newAccount = {
      name: this.accountType,
      balance: balance,
      icon: this.getIconByType(this.accountType),
      currency: this.currency,
      notes: this.notes,
      includedInAssets: this.includedInAssets
    };

    // Lấy accounts hiện tại
    const accounts = this.walletService.getAccounts();
    
    // Kiểm tra xem account đã tồn tại chưa
    const existingAccount = accounts.find(a => a.name === newAccount.name);
    if (existingAccount) {
      this.snackBar.open('Account already exists', 'Close', { duration: 2000 });
      return;
    }

    // Thêm account mới
    accounts.push(newAccount);
    localStorage.setItem('accounts', JSON.stringify(accounts));

    this.snackBar.open('Account created successfully', 'Close', { duration: 2000 });
    this.dialogRef.close({ account: newAccount });
  }

  getIconByType(type: string): string {
    const iconMap: { [key: string]: string } = {
      'Cash': 'assets/icons/cash.svg',
      'Savings Account': 'assets/icons/wallet.svg',
      'Checking Account': 'assets/icons/bank.svg',
      'Credit Card': 'assets/icons/card.svg',
      'Investment': 'assets/icons/investment.svg',
      'Other': 'assets/icons/wallet.svg'
    };
    return iconMap[type] || 'assets/icons/wallet.svg';
  }

  close(): void {
    this.dialogRef.close();
  }
}
