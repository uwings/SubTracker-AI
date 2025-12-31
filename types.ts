
export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  ONE_TIME = 'ONE_TIME', 
  LIFETIME = 'LIFETIME', 
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
  type: 'SUMMARY' | 'MONTH_CHART' | 'UPCOMING' | 'CATEGORY_PIE' | 'MONTH_BREAKDOWN' | 'NEXT_MONTH_PROJECTION' | 'PRODUCT_BAR';
  title: string;
  size: 'small' | 'medium' | 'large';
}

export interface PresetPlan {
  label: string;
  cost: number;
  currency: string;
  cycle: BillingCycle;
  description?: string;
}

export interface PresetProduct {
  id: string;
  name: string;
  brandColor: string;
  category: string;
  plans: PresetPlan[];
}

export interface AIConfig {
  provider: 'gemini' | 'custom';
  geminiModel: 'gemini-3-flash-preview' | 'gemini-3-pro-preview';
  customConfig?: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
}

export const BASE_CURRENCY = 'CNY';

export const EXCHANGE_RATES: Record<string, number> = {
  'USD': 7.25,
  'EUR': 7.85,
  'JPY': 0.048,
  'HKD': 0.93,
  'GBP': 9.20,
  'CNY': 1.0
};
