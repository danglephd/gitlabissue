import { MoneyTransaction, BillType, Currency } from './money-manager.model';

export class MoneyTransactionClass implements MoneyTransaction {
    date: Date;
    category: string;
    billType: string;
    amount: number;
    currency: string;
    notes: string;
    account: string;
    ledger: string;
    tags: string;
    includedInBudget: boolean;
    id: string;
    image: string;

    constructor(data: any) {
        this.date = new Date(data.date.replace(' ', 'T'));
        this.category = data.category;
        this.billType = data.billType;
        this.amount = parseFloat(data.amount);
        this.currency = data.currency;
        this.notes = data.notes || '';
        this.account = data.account;
        this.ledger = data.ledger;
        this.tags = data.tags || '';
        this.includedInBudget = data.includedinbudget === '1';
        this.id = data.id;
        this.image = data.image || '';
    }

    isExpense(): boolean {
        return this.billType?.toLowerCase() === BillType.EXPENSES;
    }

    isIncome(): boolean {
        return this.billType?.toLowerCase() === BillType.INCOME;
    }

    getFormattedAmount(): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(this.amount);
    }
}