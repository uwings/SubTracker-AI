
import { Subscription } from '../../types';
import { CalculationStrategy } from './types';
import { convertToBase } from '../currency';

export const MonthlyStrategy: CalculationStrategy = {
  isOccurringInMonth(sub, year, month) {
    const start = new Date(sub.startDate);
    const sY = start.getFullYear();
    const sM = start.getMonth();

    if (year < sY || (year === sY && month < sM)) return false;

    if (sub.status === 'canceled' && sub.endDate) {
      const end = new Date(sub.endDate);
      const eY = end.getFullYear();
      const eM = end.getMonth();
      if (year > eY || (year === eY && month > eM)) return false;
    }

    return true;
  },

  isUsableInMonth(sub, year, month) {
    return this.isOccurringInMonth(sub, year, month);
  },

  getAnnualBudget(sub, year) {
    const cost = convertToBase(sub.cost, sub.currency);
    // 如果是自动续费，按12个月计算预算
    if (sub.autoRenew) {
      return cost * 12;
    }
    // 非自动续费，计算该年在有效范围内的月份数
    let count = 0;
    for (let m = 0; m < 12; m++) {
      if (this.isOccurringInMonth(sub, year, m)) count++;
    }
    return cost * count;
  },

  getRealizedTotal(sub, today) {
    const cost = convertToBase(sub.cost, sub.currency);
    const start = new Date(sub.startDate);
    const end = (sub.status === 'canceled' && sub.endDate) ? new Date(sub.endDate) : today;
    
    // 计算从开始到结束（或今天）经历了多少个支付周期
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    return Math.max(0, months) * cost;
  }
};
