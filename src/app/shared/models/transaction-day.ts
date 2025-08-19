import { MoneyTransactionClass } from "./money-transaction";

interface WalletDayGroup {
  date: string; // YYYY-MM-DD
  dayLabel: string; // Today, Aug 19 Tue, ...
  totalIncome: number;
  totalExpense: number;
  transactions: MoneyTransactionClass[];
}