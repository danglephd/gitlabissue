import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MoneyTransactionClass } from '../shared/models/money-transaction';

@Injectable({
  providedIn: 'root'
})
export class moneyTransactionCsvService {
  // Danh sách các accounts hiện có
  accounts: any[] = [];

  constructor(private http: HttpClient) {
    this.initializeAccounts();
  }

  // Khởi tạo danh sách accounts từ localStorage hoặc tạo mới
  private initializeAccounts(): void {
    const savedAccounts = localStorage.getItem('accounts');
    if (savedAccounts) {
      this.accounts = JSON.parse(savedAccounts);
    } else {
      // Tạo danh sách accounts mặc định
      this.accounts = [
        { name: 'Cash', balance: 0, icon: 'assets/icons/cash.svg' },
        { name: 'momo', balance: 0, icon: 'assets/icons/momo.svg' },
        { name: 'vcb', balance: 0, icon: 'assets/icons/bank.svg' },
        { name: 'Vợ', balance: 0, icon: 'assets/icons/wallet.svg' },
        { name: 'Tiết kiệm', balance: 0, icon: 'assets/icons/wallet.svg' },
        { name: 'hưởng thụ', balance: 0, icon: 'assets/icons/wallet.svg' },
        { name: 'giáo dục', balance: 0, icon: 'assets/icons/wallet.svg' },
        { name: 'đầu tư', balance: 0, icon: 'assets/icons/wallet.svg' },
        { name: 'biếu cho', balance: 0, icon: 'assets/icons/wallet.svg' },
        { name: 'Giáo dục account', balance: 0, icon: 'assets/icons/wallet.svg' },
        { name: 'Con', balance: 0, icon: 'assets/icons/wallet.svg' },
        { name: 'Gold', balance: 0, icon: 'assets/icons/gold.svg' }
      ];
      this.saveAccountsToLocalStorage();
    }
  }

  // Lưu accounts vào localStorage
  private saveAccountsToLocalStorage(): void {
    localStorage.setItem('accounts', JSON.stringify(this.accounts));
  }

  // Lấy danh sách accounts
  getAccounts(): any[] {
    return this.accounts;
  }

  // Cập nhật balance của account
  private updateAccountBalance(accountName: string, amount: number): void {
    const account = this.accounts.find(a => a.name === accountName);
    if (account) {
      account.balance += amount;
      this.saveAccountsToLocalStorage();
    }
  }

  // Cập nhật balance cho tất cả transactions
  private calculateAccountBalances(transactions: MoneyTransactionClass[]): void {
    // Reset tất cả balances về 0
    this.accounts.forEach(acc => acc.balance = 0);

    // Tính toán balance dựa trên transactions
    transactions.forEach(tx => {
      if (tx.billType?.toLowerCase() === 'income') {
        // Thu nhập: cộng vào account
        this.updateAccountBalance(tx.account, tx.amount);
      } else if (tx.billType?.toLowerCase() === 'expenses') {
        // Chi tiêu: trừ từ account
        this.updateAccountBalance(tx.account, -tx.amount);
      } else if (tx.billType?.toLowerCase() === 'transfer') {
        // Chuyển nhượng: trừ từ account từ, cộng vào account đến
        // Category format: "from => to" hoặc "from\nto"
        const parts = tx.category.includes('=>')
          ? tx.category.split('=>').map(p => p.trim())
          : tx.category.split('\n').map(p => p.trim());
        
        if (parts.length === 2) {
          const [fromAccount, toAccount] = parts;
          this.updateAccountBalance(fromAccount, -tx.amount);
          this.updateAccountBalance(toAccount, tx.amount);
        }
      }
    });
  }

  // Đọc dữ liệu từ file CSV và lưu vào localStorage
  getTransactions(): Observable<MoneyTransactionClass[]> {
    const localData = localStorage.getItem('transactions');
    if (localData) {
      // Nếu đã có trong localStorage thì trả về dữ liệu đó
      const transactions: MoneyTransactionClass[] = JSON.parse(localData).map((obj: any) => new MoneyTransactionClass(obj));
      // Cập nhật account balances
      this.calculateAccountBalances(transactions);
      return new Observable(observer => {
        observer.next(transactions);
        observer.complete();
      });
    } else {
      // Nếu chưa có thì lấy từ CSV và lưu vào localStorage
      return this.getTransactionsFromCSV().pipe(
        map(transactions => {
          localStorage.setItem('transactions', JSON.stringify(transactions));
          // Cập nhật account balances
          this.calculateAccountBalances(transactions);
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

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let cell = '';
    let withinQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (withinQuotes && line[i + 1] === '"') {
          // Đây là dấu nháy kép được escape (""), giữ lại một dấu
          cell += '"';
          i++; // Bỏ qua dấu nháy tiếp theo
        } else {
          // Chuyển đổi trạng thái trong/ngoài vùng được quote
          withinQuotes = !withinQuotes;
        }
      } else if (char === ',' && !withinQuotes) {
        // Kết thúc một cell khi gặp dấu phẩy (ngoài vùng được quote)
        result.push(cell);
        cell = '';
      } else {
        cell += char;
      }
      i++;
    }
    
    result.push(cell); // Thêm cell cuối cùng
    return result.map(cell => {
      // Loại bỏ dấu nháy kép ở đầu và cuối nếu có
      if (cell.startsWith('"') && cell.endsWith('"')) {
        cell = cell.slice(1, -1);
      }
      return cell.trim();
    });
  }

  getTransactionsFromCSV(): Observable<MoneyTransactionClass[]> {
    return this.http.get('assets/data/Money Manager_20260225.csv', { responseType: 'text' })
      .pipe(
        map(text => { 
          // Thay thế category format từ "<From>\n<To>" thành "From => To"
          text = text.replace(/(?:"[^"]*")|(?:[^,]+)/g, (match) => {
            if (match.startsWith('"') && match.endsWith('"')) {
              // Chỉ xử lý nội dung trong dấu nháy kép
              const content = match.slice(1, -1);
              if (content.includes('\n')) {
                const [from, to] = content.split('\n').map(part => part.trim());
                return `${from} => ${to}`;
              }
            }
            return match;
          });

          // Tách từng dòng và lọc dòng trống
          const rows = text.split(/\r?\n/).filter(row => row.trim());
          
          // Parse header
          const headers = this.parseCSVLine(rows[0]);
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
              const values = this.parseCSVLine(row);

              const obj: any = {};
              headers.forEach((header, index) => {
                const key = headerMap[header] || header;
                if (key === 'amount') {
                  obj['amount'] = parseFloat(values[index]) || 0;
                } else if (key === 'category') {
                  // Xử lý đặc biệt cho category
                  const categoryValue = values[index];
                  if (categoryValue.includes('\n')) {
                    // Nếu có ký tự xuống dòng, đây là giao dịch Transfer
                    const [from, to] = categoryValue.split('\n').map(part => part.trim());
                    obj[key] = `${from}\n${to}`; // Giữ nguyên format gốc cho MoneyTransactionClass xử lý
                  } else {
                    // Trường hợp category đơn giản
                    obj[key] = categoryValue.trim();
                  }
                } else {
                  obj[key] = values[index] ? values[index].trim() : '';
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
    // Cập nhật account balance
    this.calculateAccountBalances(transactions);
  }

  // Sửa transaction theo id
  updateTransactionInLocalStorage(updatedTx: MoneyTransactionClass, id: any): void {
    const data = localStorage.getItem('transactions');
    let transactions: MoneyTransactionClass[] = data ? JSON.parse(data) : [];
    transactions = transactions.map(tx =>
      tx.id === id ? updatedTx : tx
    );
    localStorage.setItem('transactions', JSON.stringify(transactions));
    // Cập nhật account balance
    this.calculateAccountBalances(transactions);
  }

  // Xóa transaction theo id
  deleteTransactionFromLocalStorage(id: string): void {
    const data = localStorage.getItem('transactions');
    let transactions: MoneyTransactionClass[] = data ? JSON.parse(data) : [];
    transactions = transactions.filter(tx => tx.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    // Cập nhật account balance
    this.calculateAccountBalances(transactions);
  }

  getMonthYearOptions(): { value: string, label: string }[] {
    // Lấy từ dữ liệu thực tế, ví dụ:
    const data = localStorage.getItem('transactions');
    const transactions: MoneyTransactionClass[] = data ? JSON.parse(data) : [];
    const set = new Set<string>();
    transactions.forEach(tx => {
      const d = new Date(tx.date);
      const value = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`;
      set.add(value);
    });
    // Sắp xếp giảm dần
    const arr = Array.from(set).sort((a, b) => b.localeCompare(a));
    return arr.map(v => ({
      value: v,
      label: `${new Date(v + '-01').toLocaleString('default', { month: 'short' })} ${v.slice(0,4)}`
    }));
  }

  // Thêm hàm này vào moneyTransactionCsvService
  getDayDataByMonthYear(month: number, year: number): { [key: string]: { expense?: number, income?: number } } {
    const data = localStorage.getItem('transactions');
    if (!data) return {};
    const transactions: MoneyTransactionClass[] = JSON.parse(data).map((obj: any) => new MoneyTransactionClass(obj));
    const result: { [key: string]: { expense?: number, income?: number } } = {};

    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (txDate.getMonth() + 1 === month && txDate.getFullYear() === year) {
        const key = `${txDate.getFullYear()}-${(txDate.getMonth() + 1).toString().padStart(2, '0')}-${txDate.getDate().toString().padStart(2, '0')}`;
        if (!result[key]) result[key] = {};
        if (tx.billType.toLowerCase() === 'expenses') {
          result[key].expense = (result[key].expense || 0) + Math.abs(tx.amount);
        } else if (tx.billType.toLowerCase() === 'income') {
          result[key].income = (result[key].income || 0) + tx.amount;
        }
      }
    });

    return result;
  }

  getTransactionsByDate(date: Date): MoneyTransactionClass[] {
    const data = localStorage.getItem('transactions');
    if (!data) return [];
    const transactions: MoneyTransactionClass[] = JSON.parse(data).map((obj: any) => new MoneyTransactionClass(obj));
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === date.getFullYear()
        && txDate.getMonth() === date.getMonth()
        && txDate.getDate() === date.getDate();
    });
  }

  getTransactionsByDates(startDate: Date, endDate: Date): MoneyTransactionClass[] {
    const data = localStorage.getItem('transactions');
    if (!data) return [];
    const transactions: MoneyTransactionClass[] = JSON.parse(data).map((obj: any) => new MoneyTransactionClass(obj));
    
    // Normalize dates để loại bỏ giờ/phút/giây
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= start && txDate <= end;
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}