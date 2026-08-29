import { prisma } from './prisma';

const CURRENCY_SYMBOLS: Record<string, string> = {
  'NGN': '₦',
  'KES': 'KSh ',
  'GHS': '₵',
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
};

export function getCurrencySymbolForCode(code?: string): string {
  if (!code) return '₦';
  return CURRENCY_SYMBOLS[code.toUpperCase()] || `${code.toUpperCase()} `;
}

export async function getCurrencySymbol(): Promise<string> {
  try {
    const settings = await prisma.programSettings.findFirst();
    const currency = settings?.currency || 'NGN';
    return getCurrencySymbolForCode(currency);
  } catch (error) {
    console.error('Failed to fetch currency symbol:', error);
    return '₦';
  }
}

export function formatCurrency(cents: number, symbol: string): string {
    const amount = cents / 100;
    return `${symbol}${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export async function formatAmount(cents: number): Promise<string> {
    const symbol = await getCurrencySymbol();
    return formatCurrency(cents, symbol);
}
