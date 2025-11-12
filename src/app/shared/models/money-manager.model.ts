export interface MoneyTransaction {
    date: Date;           // 2025-08-19 10:54:06
    category: string;     // Salary, Gas, Meat...
    billType: string;     // Income, Expenses
    amount: number;       // 1735000.0
    currency: string;     // VND
    notes: string;        // Empty or has value
    account: string;      // Cash
    ledger: string;      // General
    tags: string;         // Empty or has value
    includedInBudget: boolean; // 1 or 0
    id: string;          // 1755575646341_...
    image: string;       // /1755572575104 or empty
}

export enum BillType {
    INCOME = 'income',
    TRANSFER = 'transfer',
    EXPENSES = 'expenses'
}

export enum Currency {
    VND = 'VND'
}