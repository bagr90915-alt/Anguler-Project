export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'INR';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateAgainstUSD: number; // For multi-currency conversion preview
}

export type CategoryId = 
  | 'food' 
  | 'transport' 
  | 'housing' 
  | 'entertainment' 
  | 'utilities' 
  | 'groceries' 
  | 'shopping' 
  | 'health' 
  | 'general';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  color: string;
}

export interface Member {
  id: string;
  name: string;
  email?: string;
  color: string; // Hex color for avatar & visual charts
  avatarUrl?: string;
  defaultShare?: number; // Weight for shares split
}

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares' | 'itemized';

export interface ItemizedReceiptItem {
  id: string;
  title: string;
  price: number;
  assignedMemberIds: string[];
}

export interface SplitDetail {
  memberId: string;
  amount: number;
  percentage?: number;
  shares?: number;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  currency: CurrencyCode;
  categoryId: CategoryId;
  date: string; // ISO date string YYYY-MM-DD
  payerId: string; // Primary payer (or ID of payer)
  splitType: SplitType;
  splits: SplitDetail[]; // Breakdown of how much each member owes
  notes?: string;
  receiptItems?: ItemizedReceiptItem[];
  receiptTax?: number;
  receiptTip?: number;
  createdAt: number;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromMemberId: string; // Debtor
  toMemberId: string;   // Creditor
  amount: number;
  currency: CurrencyCode;
  date: string;
  paymentMethod: 'cash' | 'venmo' | 'paypal' | 'zelle' | 'bank_transfer' | 'revolut' | 'other';
  note?: string;
  createdAt: number;
}

export interface SimplifiedDebt {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  currency: CurrencyCode;
  createdAt: number;
  updatedAt: number;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  category?: 'trip' | 'home' | 'event' | 'project' | 'other';
  color: string;
}

export interface ActivityLog {
  id: string;
  groupId: string;
  groupName: string;
  type: 'expense_added' | 'expense_deleted' | 'settlement_recorded' | 'member_added' | 'group_created';
  description: string;
  timestamp: number;
  amount?: number;
  currency?: CurrencyCode;
}

export interface MemberBalance {
  memberId: string;
  member: Member;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = should receive money, negative = owes money
}
