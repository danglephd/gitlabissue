import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { Wallet } from '../wallet';
import { tap, catchError, map } from 'rxjs/operators';
import { updateGDriveValue } from '../shared/utils'; // Import hàm dùng chung


@Injectable({
  providedIn: 'root'
})
export class WalletRealtimeDbService {
  private dbPath = '/wallets';

  constructor(private db: AngularFireDatabase) {}


  /**
   * Xóa wallet theo ID.
   * @param id ID của wallet cần xóa.
   * @returns Promise<void>
   */
  deleteWallet(walletKey: string): Promise<void> {
    return this.db.object(`/wallets/${walletKey}`).remove();
  }

  /**
   * Cập nhật trạng thái của wallet.
   * @param walletKey Key của wallet cần cập nhật.
   * @param status Trạng thái mới.
   * @returns Promise<void>
   */
  updateWallet(walletKey: string, status: string): Promise<void> {
    return this.db.object(`${this.dbPath}/${walletKey}`).update({ test_state: status });
  }

}