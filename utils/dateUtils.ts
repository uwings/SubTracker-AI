
/**
 * 集中管理系统时间逻辑。
 * 未来如果需要模拟特定时间的账单，只需修改此处的基准值。
 */
export const getCurrentDate = (): Date => {
  return new Date();
};

export const formatToISODate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getMonthDifference = (d1: Date, d2: Date): number => {
  let months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
};

export const isSameMonth = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
};

export const isAfterMonth = (target: Date, base: Date): boolean => {
  if (target.getFullYear() > base.getFullYear()) return true;
  if (target.getFullYear() === base.getFullYear() && target.getMonth() >= base.getMonth()) return true;
  return false;
};
