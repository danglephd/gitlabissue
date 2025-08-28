import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { WalletConfirmDialogComponent } from '../confirm-dialog/wallet-confirm-dialog.component';
import { WalletAddDialogComponent } from '../wallet-add-dialog/wallet-add-dialog.component';

@Component({
  selector: 'app-bill-detail',
  templateUrl: './bill-detail.component.html',
  styleUrls: ['./bill-detail.component.css']
})
export class BillDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<BillDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog
  ) {}

  close() {
    this.dialogRef.close();
  }

  delete() {
    // Mở dialog xác nhận
    const confirmRef = this.dialog.open(WalletConfirmDialogComponent, {
      width: '320px',
      panelClass: 'confirm-dialog-panel'
    });

    confirmRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Xác nhận xóa
        this.dialogRef.close({ action: 'delete', id: this.data.id });
      }
      // Nếu không, không làm gì, dialog BillDetail vẫn mở
    });
  }

  edit() {
    // Mở dialog WalletAddDialog với dữ liệu transaction hiện tại
    const dialogRef = this.dialog.open(WalletAddDialogComponent, {
      width: '360px',
      data: { ...this.data, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {

      if (result && result.action === 'save') {
        // Đóng Bill Detail và trả về transaction đã cập nhật cho component cha
        this.dialogRef.close({ action: 'edit' });
      }
      // Nếu không, Bill Detail vẫn mở
    });
  }
  getIcon(category: string) {
    return 'assets/icons/' + category + '.png';
  }
}
