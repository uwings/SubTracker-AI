
import { EXCHANGE_RATES, BASE_CURRENCY } from '../types';

export const convertToBase = (amount: number, fromCurrency: string = BASE_CURRENCY): number => {
  if (typeof amount !== 'number') return 0;
  const currency = (fromCurrency || BASE_CURRENCY).toUpperCase();
  const rate = EXCHANGE_RATES[currency] || 1.0;
  return amount * rate;
};

export const formatCurrency = (amount: number, currency: string = BASE_CURRENCY) => {
  try {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: (currency || BASE_CURRENCY).toUpperCase(),
    }).format(amount || 0);
  } catch (e) {
    return `${currency} ${amount?.toFixed(2)}`;
  }
};

export const getSymbol = (currency: string = BASE_CURRENCY) => {
  switch (currency?.toUpperCase()) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'HKD': return 'HK$';
    case 'CNY': return '¥';
    default: return currency;
  }
};
