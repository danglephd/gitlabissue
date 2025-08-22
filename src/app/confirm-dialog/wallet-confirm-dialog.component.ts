import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'wallet-confirm-dialog',
  template: `
    <div class="confirm-dialog">
      <button mat-icon-button class="close-btn" (click)="onNo()">
        <mat-icon>close</mat-icon>
      </button>
      <div class="confirm-message">
        Are you sure you want to delete?
      </div>
      <div class="confirm-actions">
        <button mat-stroked-button color="primary" (click)="onNo()">No</button>
        <button mat-flat-button color="accent" (click)="onYes()">Yes</button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      position: relative;
      padding: 24px 16px 16px 16px;
      min-width: 260px;
      text-align: center;
    }
    .close-btn {
      position: absolute;
      right: 8px;
      top: 8px;
    }
    .confirm-message {
      font-size: 1.1rem;
      margin: 24px 0 20px 0;
      font-weight: 500;
    }
    .confirm-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
    }
    button[mat-flat-button] {
      background: #ffd600;
      color: #222;
      font-weight: bold;
    }
    button[mat-stroked-button] {
      border: 2px solid #888;
      color: #222;
      font-weight: bold;
      background: #fff;
    }
  `]
})
export class WalletConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<WalletConfirmDialogComponent>
  ) {}

  onYes() {
    this.dialogRef.close(true);
  }
  onNo() {
    this.dialogRef.close(false);
  }
}