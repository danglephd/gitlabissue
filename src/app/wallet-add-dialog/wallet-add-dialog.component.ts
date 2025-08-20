import { Component } from '@angular/core';

@Component({
  selector: 'app-wallet-add-dialog',
  templateUrl: './wallet-add-dialog.component.html',
  styleUrls: ['./wallet-add-dialog.component.css']
})
export class WalletAddDialogComponent {
  categories = [
    { name: 'Meat', icon: 'assets/icons/meat.png' },
    { name: 'Gas', icon: 'assets/icons/gas.png' },
    { name: 'Trans', icon: 'assets/icons/trans.png' },
    // ... các category khác
    { name: 'Edit', icon: 'assets/icons/edit.png' }
  ];
  keypad = [
    ['1', '2', '3', '⌫'],
    ['4', '5', '6', '+'],
    ['7', '8', '9', '-'],
    ['.', '0', 'Today', '✔']
  ];
  onClose() {
    // Đóng dialog
  }
}