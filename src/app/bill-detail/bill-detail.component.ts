import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-bill-detail',
  templateUrl: './bill-detail.component.html',
  styleUrls: ['./bill-detail.component.css']
})
export class BillDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<BillDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close() {
    this.dialogRef.close();
  }
  delete() {
    // Xử lý xóa
    this.dialogRef.close('delete');
  }
  edit() {
    // Xử lý sửa
    this.dialogRef.close('edit');
  }
  getIcon(category: string) {
    // Trả về đường dẫn icon phù hợp
    return 'assets/icons/' + category + '.png';
  }
}
