import { Currency, CurrencyCode } from '../types';

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateAgainstUSD: 1.0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateAgainstUSD: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateAgainstUSD: 0.79 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateAgainstUSD: 154.5 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateAgainstUSD: 1.38 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateAgainstUSD: 1.52 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateAgainstUSD: 85.2 },
};

/**
 * Formats a numeric amount into a currency string with appropriate symbol and decimals.
 * Uses tabular-safe zero-padding.
 */
export function formatCurrency(
  amount: number, 
  currencyCode: CurrencyCode = 'USD',
  showSymbol: boolean = true
): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const isNoDecimal = currencyCode === 'JPY';
  
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: isNoDecimal ? 0 : 2,
    maximumFractionDigits: isNoDecimal ? 0 : 2,
  });

  const sign = amount < 0 ? '-' : '';
  return showSymbol ? `${sign}${currency.symbol}${formatted}` : `${sign}${formatted}`;
}

/**
 * Converts an amount from one currency to another using exchange rates.
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  const fromRate = CURRENCIES[from]?.rateAgainstUSD || 1.0;
  const toRate = CURRENCIES[to]?.rateAgainstUSD || 1.0;
  
  // Convert from source to USD, then from USD to target
  const inUSD = amount / fromRate;
  return inUSD * toRate;
}
