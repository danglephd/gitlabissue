import { log } from 'console';
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
    includedInBudget: string;
    id: string;
    image: string;

    constructor(data: any) {
        this.date = new Date(data.date.replace(' ', 'T'));
        if (data.billType?.toLowerCase() === BillType.TRANSFER && data.category) {
            const accounts = data.category.split('\n');
            if (accounts.length === 2) {
                this.category = `${accounts[0]} -> ${accounts[1]}`;
            } else {
                this.category = data.category;
            }
        } else {
            this.category = data.category;
        }
        this.billType = data.billType;
        this.amount = parseFloat(data.amount);
        this.currency = data.currency;
        this.notes = data.notes || '';
        this.account = data.account;
        this.ledger = data.ledger;
        this.tags = data.tags || '';
        this.includedInBudget = data.includedInBudget;
        this.id = data.id;
        this.image = data.image || '';
    }

    isExpense(): boolean {
        return this.billType?.toLowerCase() === BillType.EXPENSES;
    }

    isIncome(): boolean {
        return this.billType?.toLowerCase() === BillType.INCOME;
    }

    isTransfer(): boolean {
        return this.billType?.toLowerCase() === BillType.TRANSFER;
    }

    getFormattedAmount(): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(this.amount);
    }
}