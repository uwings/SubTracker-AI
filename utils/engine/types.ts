
import { Subscription } from '../../types';

export interface CalculationStrategy {
  /**
   * 判断在指定月份是否有【支付/扣费】行为产生
   */
  isOccurringInMonth(sub: Subscription, year: number, month: number): boolean;
  
  /**
   * 判断在指定月份该服务是否【仍处于可用状态】（例如已付费且未到期）
   */
  isUsableInMonth(sub: Subscription, year: number, month: number): boolean;

  /**
   * 计算该订阅在指定年份的【消费预算】
   * 规则：
   * 1. 自动续费项目：年化计算（月费 * 12）
   * 2. 非自动续费项目：按年内实际发生的扣费事件计入
   */
  getAnnualBudget(sub: Subscription, year: number): number;

  /**
   * 计算从订阅开始到指定日期为止【真实产生】的总费用
   */
  getRealizedTotal(sub: Subscription, today: Date): number;
}
