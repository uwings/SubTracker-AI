
import React, { useState, useMemo } from 'react';
import { Subscription, BillingCycle, BASE_CURRENCY } from '../types';
import { getTimelineData } from '../utils/calculations';
import { formatCurrency } from '../utils/currency';
import { getCurrentDate, isSameMonth } from '../utils/dateUtils';

interface TimelineViewProps {
  subscriptions: Subscription[];
}

const CycleBadge: React.FC<{ cycle: BillingCycle }> = ({ cycle }) => {
  const colors: Record<string, string> = {
    [BillingCycle.MONTHLY]: 'text-blue-500 bg-blue-50',
    [BillingCycle.YEARLY]: 'text-amber-600 bg-amber-50',
    [BillingCycle.ONE_TIME]: 'text-slate-500 bg-slate-100',
    [BillingCycle.LIFETIME]: 'text-indigo-600 bg-indigo-50',
    [BillingCycle.PHASED]: 'text-emerald-600 bg-emerald-50',
  };
  return (
    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-tighter ${colors[cycle]}`}>
      {cycle}
    </span>
  );
};

export const TimelineView: React.FC<TimelineViewProps> = ({ subscriptions }) => {
  // 默认从过去 12 个月中寻找有支出的月份（增加搜索范围以防最近几月无数据）
  const [monthsCount, setMonthsCount] = useState(12);
  const now = getCurrentDate();

  // 过滤掉 items 长度为 0 的月份
  const timelineData = useMemo(() => {
    return getTimelineData(subscriptions, monthsCount).filter(month => month.items.length > 0);
  }, [subscriptions, monthsCount]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          订阅支出历史回顾
        </h2>
        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
          Spending History
        </div>
      </div>

      {timelineData.length > 0 ? (
        <div className="relative border-l-2 border-slate-200 ml-4 pl-8 space-y-12 pb-8">
          {timelineData.map((month, idx) => {
            const isCurrentMonth = isSameMonth(new Date(month.year, month.month), now);
            
            return (
              <div key={`${month.year}-${month.month}`} className="relative">
                {/* 月份节点 */}
                <div className={`absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-white border-4 shadow-sm z-10 ${isCurrentMonth ? 'border-indigo-500 scale-125' : 'border-slate-300'}`}></div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-4">
                    {month.label}
                    {isCurrentMonth && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-black tracking-widest">本月</span>}
                    <span className="h-[1px] flex-1 bg-slate-100"></span>
                    <span className="text-slate-900 font-black">{formatCurrency(month.total, BASE_CURRENCY)}</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {month.items.map((item, iIdx) => (
                    <div key={`${month.year}-${month.month}-${iIdx}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {item.sub.logoUrl ? (
                            <img src={item.sub.logoUrl} className="w-8 h-8 rounded-lg bg-slate-50 p-1 object-contain border border-slate-100" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                              {item.sub.name.charAt(0)}
                            </div>
                          )}
                          <p className="font-bold text-slate-800 truncate">{item.sub.name}</p>
                        </div>
                        <CycleBadge cycle={item.sub.billingCycle} />
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          {item.sub.platform} • {item.sub.category}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">{formatCurrency(item.costInBase, BASE_CURRENCY)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-300 text-sm italic font-medium">暂无历史支出记录</p>
        </div>
      )}

      <div className="flex justify-center pb-10">
        <button 
          onClick={() => setMonthsCount(prev => prev + 12)}
          className="group flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all active:scale-95"
        >
          回溯更久的历史 (增加 12 个月)
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>
    </div>
  );
};
