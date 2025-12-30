
import { EXCHANGE_RATES, BASE_CURRENCY } from '../types';

export const convertToBase = (amount: number, fromCurrency: string): number => {
  const currency = fromCurrency.toUpperCase();
  const rate = EXCHANGE_RATES[currency] || 1.0;
  return amount * rate;
};

export const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const getSymbol = (currency: string) => {
  switch (currency.toUpperCase()) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'HKD': return 'HK$';
    case 'CNY': return '¥';
    default: return currency;
  }
};
