
import { Subscription, BillingCycle } from '../types';
import { convertToBase } from './currency';
import { MonthlyStrategy } from './engine/monthly';
import { YearlyStrategy } from './engine/yearly';
import { OneTimeStrategy } from './engine/oneTime';
import { PhasedStrategy } from './engine/phased';
import { LifetimeStrategy } from './engine/lifetime';
import { CalculationStrategy } from './engine/types';
import { getCurrentDate } from './dateUtils';

export interface MonthlyBreakdownItem {
  sub: Subscription;
  costInBase: number;
}

export interface TimelineMonth {
  year: number;
  month: number;
  label: string;
  total: number;
  items: MonthlyBreakdownItem[];
}

const getStrategy = (cycle: BillingCycle): CalculationStrategy => {
  switch (cycle) {
    case BillingCycle.MONTHLY: return MonthlyStrategy;
    case BillingCycle.YEARLY: return YearlyStrategy;
    case BillingCycle.ONE_TIME: return OneTimeStrategy;
    case BillingCycle.LIFETIME: return LifetimeStrategy;
    case BillingCycle.PHASED: return PhasedStrategy;
    default: return OneTimeStrategy;
  }
};

export const calculateMonthlyCost = (subscriptions: Subscription[], year: number, month: number): number => {
  return subscriptions
    .filter(sub => getStrategy(sub.billingCycle).isOccurringInMonth(sub, year, month))
    .reduce((sum, sub) => sum + convertToBase(sub.cost, sub.currency), 0);
};

export const getTotalRealizedSpending = (subscriptions: Subscription[]): number => {
  const today = getCurrentDate();
  return subscriptions.reduce((sum, sub) => {
    return sum + getStrategy(sub.billingCycle).getRealizedTotal(sub, today);
  }, 0);
};

export const getAnnualBudgetProjection = (subscriptions: Subscription[], year: number): number => {
  return subscriptions.reduce((sum, sub) => {
    return sum + getStrategy(sub.billingCycle).getAnnualBudget(sub, year);
  }, 0);
};

export const getMonthlyBreakdown = (subscriptions: Subscription[], year: number, month: number): MonthlyBreakdownItem[] => {
  return subscriptions
    .filter(sub => getStrategy(sub.billingCycle).isOccurringInMonth(sub, year, month))
    .map(sub => ({
      sub,
      costInBase: convertToBase(sub.cost, sub.currency)
    }));
};

export const getNextMonthBreakdown = (subscriptions: Subscription[]): MonthlyBreakdownItem[] => {
  const now = getCurrentDate();
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return getMonthlyBreakdown(subscriptions, d.getFullYear(), d.getMonth());
};

export const calculateNextMonthCost = (subscriptions: Subscription[]): number => {
  const now = getCurrentDate();
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return calculateMonthlyCost(subscriptions, d.getFullYear(), d.getMonth());
};

export const getTimelineData = (subscriptions: Subscription[], monthsCount: number): TimelineMonth[] => {
  const now = getCurrentDate();
  const timeline: TimelineMonth[] = [];

  for (let i = 0; i < monthsCount; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const items = getMonthlyBreakdown(subscriptions, year, month);
    const total = items.reduce((sum, item) => sum + item.costInBase, 0);

    timeline.push({
      year,
      month,
      label: d.toLocaleString('zh-CN', { year: 'numeric', month: 'long' }),
      total,
      items: items.sort((a, b) => b.costInBase - a.costInBase)
    });
  }

  return timeline;
};

export const getUpcomingBills = (subscriptions: Subscription[], days: number = 30) => {
  const now = getCurrentDate();
  const future = new Date();
  future.setDate(now.getDate() + days);

  return subscriptions
    .filter(s => s.status === 'active')
    .map(sub => {
      const start = new Date(sub.startDate);
      let next = new Date(start);
      if (sub.billingCycle === BillingCycle.MONTHLY) {
        while (next < now) next.setMonth(next.getMonth() + 1);
      } else if (sub.billingCycle === BillingCycle.YEARLY) {
        while (next < now) next.setFullYear(next.getFullYear() + 1);
      }
      return { ...sub, nextPaymentDate: next };
    })
    .filter(item => {
      if (item.billingCycle === BillingCycle.ONE_TIME || item.billingCycle === BillingCycle.LIFETIME) {
        return false; 
      }
      return (item as any).nextPaymentDate <= future && (item as any).nextPaymentDate >= now;
    })
    .sort((a, b) => (a as any).nextPaymentDate.getTime() - (b as any).nextPaymentDate.getTime());
};
