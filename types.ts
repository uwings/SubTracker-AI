
export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  ONE_TIME = 'ONE_TIME', // 单次付费（当月有效）
  LIFETIME = 'LIFETIME', // 终身买断（一次付费，永远可用）
  PHASED = 'PHASED'
}

export type SubIntent = 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL';

export enum PaymentPlatform {
  ALIPAY = 'ALIPAY',
  WECHAT = 'WECHAT',
  APPLE = 'APPLE',
  GOOGLE = 'GOOGLE',
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  OTHER = 'OTHER'
}

export interface Subscription {
  id?: number;
  uid: string;
  name: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  startDate: string; 
  endDate?: string; 
  durationMonths?: number; 
  autoRenew?: boolean; 
  category: string;
  platform: PaymentPlatform;
  status: 'active' | 'canceled';
  notes?: string;
  updatedAt: number;
  logoUrl?: string;
  websiteUrl?: string;
  billingUrl?: string;
}

export interface DashboardBlock {
  id: string;
  type: 'SUMMARY' | 'MONTH_CHART' | 'UPCOMING' | 'CATEGORY_PIE' | 'MONTH_BREAKDOWN' | 'NEXT_MONTH_PROJECTION';
  title: string;
  size: 'small' | 'medium' | 'large';
}

export const BASE_CURRENCY = 'CNY';

export const EXCHANGE_RATES: Record<string, number> = {
  'USD': 7.24,
  'EUR': 7.85,
  'JPY': 0.048,
  'HKD': 0.93,
  'GBP': 9.18,
  'CNY': 1.0
};
