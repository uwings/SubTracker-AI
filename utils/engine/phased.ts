
import { Subscription } from '../../types';
import { CalculationStrategy } from './types';
import { convertToBase } from '../currency';

export const PhasedStrategy: CalculationStrategy = {
  isOccurringInMonth(sub, year, month) {
    const start = new Date(sub.startDate);
    const sY = start.getFullYear();
    const sM = start.getMonth();
    const duration = sub.durationMonths || 1;

    const currentAbs = year * 12 + month;
    const startAbs = sY * 12 + sM;
    const endAbs = startAbs + duration;

    // Must be within the specific phase range
    if (currentAbs < startAbs || currentAbs >= endAbs) return false;

    // Also check if manually canceled mid-phase
    if (sub.status === 'canceled' && sub.endDate) {
      const end = new Date(sub.endDate);
      const eY = end.getFullYear();
      const eM = end.getMonth();
      if (year > eY || (year === eY && month > eM)) return false;
    }

    return true;
  },

  // Implementation of isUsableInMonth for PhasedStrategy
  isUsableInMonth(sub, year, month) {
    return this.isOccurringInMonth(sub, year, month);
  },

  // Fix: Rename to getAnnualBudget to match CalculationStrategy interface
  getAnnualBudget(sub, year) {
    const cost = convertToBase(sub.cost, sub.currency);
    let count = 0;
    for (let m = 0; m < 12; m++) {
      if (this.isOccurringInMonth(sub, year, m)) count++;
    }
    return cost * count;
  },

  // Fix: Implement missing getRealizedTotal for CalculationStrategy
  getRealizedTotal(sub, today) {
    const cost = convertToBase(sub.cost, sub.currency);
    const start = new Date(sub.startDate);
    const startAbs = start.getFullYear() * 12 + start.getMonth();
    const todayAbs = today.getFullYear() * 12 + today.getMonth();
    const duration = sub.durationMonths || 1;
    
    // 计算从开始到今天（或该分期结束）经历了多少个扣费月
    const effectiveEndAbs = Math.min(startAbs + duration - 1, todayAbs);
    let count = Math.max(0, effectiveEndAbs - startAbs + 1);
    
    // 如果中途取消，需根据取消时间截断
    if (sub.status === 'canceled' && sub.endDate) {
      const end = new Date(sub.endDate);
      const endAbs = end.getFullYear() * 12 + end.getMonth();
      const canceledEffectiveEndAbs = Math.min(effectiveEndAbs, endAbs);
      count = Math.max(0, canceledEffectiveEndAbs - startAbs + 1);
    }
    
    return count * cost;
  }
};
