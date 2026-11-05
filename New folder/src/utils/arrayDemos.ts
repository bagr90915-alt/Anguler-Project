import { Expense, Group, Member, Settlement } from '../types';

export interface ArrayOperationDoc {
  name: string;
  syntax: string;
  description: string;
  useCaseInApp: string;
  liveSnippet: string;
  resultSummary: (group: Group) => string;
}

/**
 * Array Operations catalog showcasing how functional JavaScript array methods
 * power dynamic rendering and data transformation in SplitCraft.
 */
export const ARRAY_OPERATIONS_CATALOG: ArrayOperationDoc[] = [
  {
    name: 'Array.prototype.reduce()',
    syntax: 'expenses.reduce((sum, exp) => sum + exp.amount, 0)',
    description: 'Accumulates array elements into a single aggregate metric or grouped dictionary.',
    useCaseInApp: 'Calculates the total group spending, category expenditure totals, and per-member debit/credit balances.',
    liveSnippet: `const totalSpend = expenses.reduce((acc, curr) => acc + curr.amount, 0);`,
    resultSummary: (group) => {
      const total = group.expenses.reduce((acc, exp) => acc + exp.amount, 0);
      return `Total Spent: ${group.currency} ${total.toFixed(2)} across ${group.expenses.length} expenses.`;
    },
  },
  {
    name: 'Array.prototype.map()',
    syntax: 'members.map(member => calculateMemberBalance(member, expenses))',
    description: 'Transforms every element of an array into a new structure without mutating the original source.',
    useCaseInApp: 'Dynamically generates UI cards, attaches calculated balances to members, and formats transaction rows.',
    liveSnippet: `const memberNames = members.map(m => m.name).join(', ');`,
    resultSummary: (group) => {
      const names = group.members.map((m) => m.name).join(', ');
      return `Mapped ${group.members.length} members: ${names}`;
    },
  },
  {
    name: 'Array.prototype.filter()',
    syntax: 'expenses.filter(exp => exp.categoryId === activeCategory)',
    description: 'Returns a subset array matching a predicate condition for search, categories, and date ranges.',
    useCaseInApp: 'Filters expenses by category, date range, or involvement of a specific member in the ledger view.',
    liveSnippet: `const foodExpenses = expenses.filter(e => e.categoryId === 'food');`,
    resultSummary: (group) => {
      const foodCount = group.expenses.filter((e) => e.categoryId === 'food').length;
      return `Found ${foodCount} dining expense(s) matching filter predicate.`;
    },
  },
  {
    name: 'Array.prototype.sort()',
    syntax: 'debtors.sort((a, b) => b.amount - a.amount)',
    description: 'Sorts elements according to a comparator function.',
    useCaseInApp: 'Used in the Min-Cash-Flow algorithm to match the largest debtor with the largest creditor, and in ledger sorting.',
    liveSnippet: `const recent = [...expenses].sort((a, b) => b.createdAt - a.createdAt);`,
    resultSummary: (group) => {
      const sorted = [...group.expenses].sort((a, b) => b.amount - a.amount);
      const top = sorted[0];
      return top ? `Top expense sorted: "${top.title}" (${group.currency} ${top.amount.toFixed(2)})` : 'No expenses yet.';
    },
  },
  {
    name: 'Array.prototype.find()',
    syntax: 'members.find(m => m.id === expense.payerId)',
    description: 'Locates the first element satisfying a condition or returns undefined.',
    useCaseInApp: 'Resolves member IDs into rich Member objects (names, avatar colors, contact info) when rendering cards.',
    liveSnippet: `const payer = members.find(m => m.id === expense.payerId);`,
    resultSummary: (group) => {
      const firstPayer = group.expenses[0] ? group.members.find((m) => m.id === group.expenses[0].payerId) : null;
      return firstPayer ? `Found primary payer: ${firstPayer.name} (${firstPayer.email || 'No email'})` : 'No records yet.';
    },
  },
  {
    name: 'Array.prototype.some() & every()',
    syntax: 'splits.every(s => s.amount >= 0) && splits.some(s => s.amount > 0)',
    description: 'Tests whether at least one (some) or all (every) elements satisfy the given predicate.',
    useCaseInApp: 'Validates expense forms: ensures total percentage equals 100%, and at least one person is included in split.',
    liveSnippet: `const allPositive = splits.every(s => s.amount >= 0);`,
    resultSummary: (group) => {
      const hasLargeExpense = group.expenses.some((e) => e.amount > 100);
      const allHaveReceipts = group.expenses.every((e) => e.receiptItems && e.receiptItems.length > 0);
      return `some(amount > 100): ${hasLargeExpense ? 'Yes' : 'No'} · every(has itemized receipt): ${allHaveReceipts ? 'Yes' : 'No'}`;
    },
  },
];
