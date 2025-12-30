
import { Subscription } from '../../types';
import { CalculationStrategy } from './types';
import { convertToBase } from '../currency';

export const YearlyStrategy: CalculationStrategy = {
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

    return month === sM;
  },

  isUsableInMonth(sub, year, month) {
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

  getAnnualBudget(sub, year) {
    // 年度订阅，预算即为一次扣费金额（如果该年有扣费的话）
    const startMonth = new Date(sub.startDate).getMonth();
    return this.isOccurringInMonth(sub, year, startMonth) ? convertToBase(sub.cost, sub.currency) : 0;
  },

  getRealizedTotal(sub, today) {
    const cost = convertToBase(sub.cost, sub.currency);
    const start = new Date(sub.startDate);
    const end = (sub.status === 'canceled' && sub.endDate) ? new Date(sub.endDate) : today;
    
    // 计算经历了多少个年头（包含首年）
    const years = end.getFullYear() - start.getFullYear();
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    
    let occurrences = years;
    // 如果结束月的月份大于等于开始月，说明最后一年也付过费了
    if (endMonth >= startMonth) {
      occurrences += 1;
    }
    return Math.max(0, occurrences) * cost;
  }
};
