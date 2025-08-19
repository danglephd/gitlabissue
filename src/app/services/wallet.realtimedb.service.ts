import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// Update the import path and filename as needed; for example, if the file is named 'money-transaction-class.model.ts':
import { MoneyTransactionClass } from '../shared/models/money-transaction';
import { log } from 'console';

@Injectable({
  providedIn: 'root'
})
export class moneyTransactionCsvService {
  constructor(private http: HttpClient) {}

  getTransactions(): Observable<MoneyTransactionClass[]> {
    return this.http.get('assets/data/Money Manager_20250819_1.csv', { responseType: 'text' })
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
            .map((row, rowIdx) => {
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
}