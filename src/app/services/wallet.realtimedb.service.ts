import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MoneyTransactionClass } from '../shared/models/money-transaction';

@Injectable({
  providedIn: 'root'
})
export class moneyTransactionCsvService {
  constructor(private http: HttpClient) { }

  // Đọc dữ liệu từ file CSV và lưu vào localStorage
  getTransactions(): Observable<MoneyTransactionClass[]> {
    const localData = localStorage.getItem('transactions');
    if (localData) {
      // Nếu đã có trong localStorage thì trả về dữ liệu đó
      const transactions: MoneyTransactionClass[] = JSON.parse(localData).map((obj: any) => new MoneyTransactionClass(obj));
      return new Observable(observer => {
        observer.next(transactions);
        observer.complete();
      });
    } else {
      // Nếu chưa có thì lấy từ CSV và lưu vào localStorage
      return this.getTransactionsFromCSV().pipe(
        map(transactions => {
          localStorage.setItem('transactions', JSON.stringify(transactions));
          return transactions;
        })
      );
    }
  }

  // Xuất dữ liệu từ localStorage ra file CSV
  exportLocalStorageToCsv(filename: string = 'export.csv') {
    const data = localStorage.getItem('transactions');
    if (!data) return;

    const transactions: MoneyTransactionClass[] = JSON.parse(data);

    // Lấy header từ thuộc tính của MoneyTransactionClass
    const headers = [
      'Date', 'Category', 'Bill type', 'Amount', 'Currency', 'Notes',
      'Account', 'Ledger', 'Tags', 'Included in budget', 'Id', 'Image'
    ];

    const csvRows = [
      headers.join(','),
      ...transactions.map(tx => [
        tx.date instanceof Date ? tx.date.toISOString().split('T')[0] : tx.date,
        tx.category,
        tx.billType,
        tx.amount,
        tx.currency,
        tx.notes,
        tx.account,
        tx.ledger,
        tx.tags,
        tx.includedInBudget,
        tx.id,
        tx.image
      ].map(val => `"${(val ?? '').toString().replace(/"/g, '""')}"`).join(','))
    ];

    const csvContent = csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getTransactionsFromCSV(): Observable<MoneyTransactionClass[]> {
    return this.http.get('assets/data/Money_Manager_5years_with_income.csv', { responseType: 'text' })
      .pipe(
        map(text => {
          const rows = text.split(/\r?\n/).filter(row => row.trim());
          const headers = rows[0].split(',').map(h => h.trim());
          const headerMap: Record<string, string> = {
            'Date': 'date',
            'Category': 'category',
            'Bill type': 'billType',
            'Amount': 'amount',
            'Currency': 'currency',
            'Notes': 'notes',
            'Account': 'account',
            'Ledger': 'ledger',
            'Tags': 'tags',
            'Included in budget': 'includedInBudget',
            'Id': 'id',
            'Image': 'image'
          };
          const result = rows.slice(1)
            .map(row => {
              const values = row.split(',').map(v => v.trim().replace('\r', ''));
              const obj: any = {};
              headers.forEach((header, index) => {
                const key = headerMap[header] || header;
                if (key === 'amount') {
                  obj['amount'] = parseFloat(values[index]) || 0;
                } else {
                  obj[key] = values[index] || '';
                }
              });

              return new MoneyTransactionClass(obj);
            });
          return result;
        })
      );
  }

  // 1. Lọc theo tháng/năm, xếp thứ tự thời gian cũ dần
  filterByMonthYear(month: number, year: number): Observable<MoneyTransactionClass[]> {
    return this.getTransactions().pipe(
      map(transactions =>
        transactions
          .filter(tx => tx.date.getMonth() + 1 === month && tx.date.getFullYear() === year)
          .sort((a, b) => a.date.getTime() - b.date.getTime())
      )
    );
  }

  // 2. Lọc theo năm, gom nhóm theo tháng, xếp thứ tự thời gian cũ dần
  filterByYearGroupByMonth(year: number): Observable<{ month: number, transactions: MoneyTransactionClass[] }[]> {
    return this.getTransactions().pipe(
      map(transactions => {
        const filtered = transactions.filter(tx => tx.date.getFullYear() === year);
        const grouped: { [key: number]: MoneyTransactionClass[] } = {};
        filtered.forEach(tx => {
          const m = tx.date.getMonth() + 1;
          if (!grouped[m]) grouped[m] = [];
          grouped[m].push(tx);
        });
        return Object.keys(grouped)
          .map((m: string) => ({
            month: Number(m),
            transactions: grouped[Number(m)].sort((a: MoneyTransactionClass, b: MoneyTransactionClass) => a.date.getTime() - b.date.getTime())
          }))
          .sort((a, b) => a.month - b.month);
      })
    );
  }

  addTransactionToLocalStorage(newTx: MoneyTransactionClass): void {
    const data = localStorage.getItem('transactions');
    let transactions: MoneyTransactionClass[] = data ? JSON.parse(data) : [];
    transactions.push(newTx);
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }

  // Sửa transaction theo id
  updateTransactionInLocalStorage(updatedTx: MoneyTransactionClass): void {
    const data = localStorage.getItem('transactions');
    let transactions: MoneyTransactionClass[] = data ? JSON.parse(data) : [];
    transactions = transactions.map(tx =>
      tx.id === updatedTx.id ? updatedTx : tx
    );
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }

  // Xóa transaction theo id
  deleteTransactionFromLocalStorage(id: string): void {
    const data = localStorage.getItem('transactions');
    let transactions: MoneyTransactionClass[] = data ? JSON.parse(data) : [];
    transactions = transactions.filter(tx => tx.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }
}