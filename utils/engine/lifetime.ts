
import { Subscription } from '../../types';
import { CalculationStrategy } from './types';
import { convertToBase } from '../currency';
import { isSameMonth, isAfterMonth } from '../dateUtils';

export const LifetimeStrategy: CalculationStrategy = {
  isOccurringInMonth(sub, year, month) {
    const start = new Date(sub.startDate);
    return isSameMonth(start, new Date(year, month));
  },

  isUsableInMonth(sub, year, month) {
    const start = new Date(sub.startDate);
    const target = new Date(year, month);
    if (sub.status === 'canceled' && sub.endDate) {
      const end = new Date(sub.endDate);
      return isAfterMonth(target, start) && !isAfterMonth(target, end);
    }
    return isAfterMonth(target, start);
  },

  getAnnualBudget(sub, year) {
    const start = new Date(sub.startDate);
    // 只在付费那一年的预算中体现
    return start.getFullYear() === year ? convertToBase(sub.cost, sub.currency) : 0;
  },

  getRealizedTotal(sub, today) {
    const start = new Date(sub.startDate);
    // 只要开始时间早于或等于今天，就产生了一次费用
    return start <= today ? convertToBase(sub.cost, sub.currency) : 0;
  }
};
