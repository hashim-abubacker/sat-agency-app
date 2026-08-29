import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind class names safely avoiding conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface CurrencyOption {
  code: string
  name: string
  symbol: string
  label: string
  locale: string
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', label: 'Indian Rupee (INR - ₹)', locale: 'en-IN' },
  { code: 'USD', name: 'US Dollar', symbol: '$', label: 'US Dollar (USD - $)', locale: 'en-US' },
  { code: 'GBP', name: 'British Pound', symbol: '£', label: 'British Pound (GBP - £)', locale: 'en-GB' },
  { code: 'EUR', name: 'Euro', symbol: '€', label: 'Euro (EUR - €)', locale: 'en-IE' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', label: 'UAE Dirham (AED - د.إ)', locale: 'en-AE' },
]

export const DEFAULT_CURRENCY_CODE = 'INR'

export function getCurrencyInfo(code?: string | null): CurrencyOption {
  if (!code) return SUPPORTED_CURRENCIES[0]
  return SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase()) || SUPPORTED_CURRENCIES[0]
}

/**
 * Formats currency values consistently with chosen global currency (INR default).
 */
export function formatCurrency(amount: number | null | undefined, currencyCode: string = DEFAULT_CURRENCY_CODE): string {
  if (amount == null) amount = 0
  const curr = getCurrencyInfo(currencyCode)
  try {
    return new Intl.NumberFormat(curr.locale, {
      style: 'currency',
      currency: curr.code,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${curr.symbol}${amount.toLocaleString()}`
  }
}

/**
 * Truncate long strings with ellipsis.
 */
export function truncate(text: string, length: number): string {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length)}...` : text
}

/**
 * Validates Google Drive URLs.
 */
export function isValidGoogleDriveUrl(url: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return (
      parsed.hostname.includes('drive.google.com') ||
      parsed.hostname.includes('docs.google.com')
    )
  } catch {
    return false
  }
}
