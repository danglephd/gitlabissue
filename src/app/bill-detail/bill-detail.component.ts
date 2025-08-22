import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { WalletConfirmDialogComponent } from '../confirm-dialog/wallet-confirm-dialog.component';

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
    this.dialogRef.close('edit');
  }
  getIcon(category: string) {
    return 'assets/icons/' + category + '.png';
  }
}
