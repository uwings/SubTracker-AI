
import { Subscription } from '../../types';
import { CalculationStrategy } from './types';
import { convertToBase } from '../currency';
import { isSameMonth } from '../dateUtils';

export const OneTimeStrategy: CalculationStrategy = {
  isOccurringInMonth(sub, year, month) {
    const start = new Date(sub.startDate);
    return isSameMonth(start, new Date(year, month));
  },

  isUsableInMonth(sub, year, month) {
    // 单次付费仅在付费那个月有效
    return this.isOccurringInMonth(sub, year, month);
  },

  // Fix: Rename to getAnnualBudget to match CalculationStrategy interface
  getAnnualBudget(sub, year) {
    const start = new Date(sub.startDate);
    return start.getFullYear() === year ? convertToBase(sub.cost, sub.currency) : 0;
  },

  // Fix: Implement missing getRealizedTotal for CalculationStrategy
  getRealizedTotal(sub, today) {
    const start = new Date(sub.startDate);
    // 只要开始日期早于或等于今天，该单次费用就已产生
    return start <= today ? convertToBase(sub.cost, sub.currency) : 0;
  }
};
