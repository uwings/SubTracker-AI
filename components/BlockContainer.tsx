
import React from 'react';
import { DashboardBlock, Subscription, BASE_CURRENCY, BillingCycle } from '../types';
import { calculateMonthlyCost, getAnnualBudgetProjection, getUpcomingBills, getMonthlyBreakdown, getTotalRealizedSpending, getNextMonthBreakdown, calculateNextMonthCost } from '../utils/calculations';
import { convertToBase, formatCurrency } from '../utils/currency';
import { getCurrentDate } from '../utils/dateUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface BlockProps {
  block: DashboardBlock;
  subscriptions: Subscription[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Logo: React.FC<{ sub: Subscription, size?: string }> = ({ sub, size = "w-8 h-8" }) => {
  if (sub.logoUrl) {
    return (
      <img 
        src={sub.logoUrl} 
        alt={sub.name} 
        className={`${size} rounded-lg bg-slate-100 object-contain p-1 border border-slate-100 shadow-sm`} 
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />
    );
  }
  return (
    <div className={`${size} rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs`}>
      {sub.name.charAt(0).toUpperCase()}
    </div>
  );
};

export const SummaryBlock: React.FC<BlockProps> = ({ subscriptions }) => {
  const now = getCurrentDate();
  const year = now.getFullYear();
  
  // 1. 本月实际消费
  const monthly = calculateMonthlyCost(subscriptions, year, now.getMonth());
  // 2. 记账以来真实总额
  const totalRealized = getTotalRealizedSpending(subscriptions);
  // 3. 今年总消费预算
  const annualBudget = getAnnualBudgetProjection(subscriptions, year);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col justify-between space-y-6">
      <div>
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">本月消费总额</h3>
        <p className="text-4xl font-black text-slate-900 leading-tight">
          {formatCurrency(monthly, BASE_CURRENCY)}
        </p>
        <p className="text-[10px] text-slate-400 mt-1">{now.toLocaleString('zh-CN', { month: 'long', year: 'numeric' })} 实付/预测</p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
        <div className="border-r border-slate-50 pr-2">
          <h3 className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">历史真实总支出</h3>
          <p className="text-lg font-bold text-slate-800">
            {formatCurrency(totalRealized, BASE_CURRENCY)}
          </p>
          <p className="text-[8px] text-slate-400 font-medium">从记账首日至今</p>
        </div>
        <div className="pl-2">
          <h3 className="text-indigo-500 text-[9px] font-black uppercase tracking-widest mb-1">今年总消费预算</h3>
          <p className="text-lg font-bold text-indigo-600">
            {formatCurrency(annualBudget, BASE_CURRENCY)}
          </p>
          <p className="text-[8px] text-indigo-400 font-medium">{year}年 预测（含自动续费）</p>
        </div>
      </div>
    </div>
  );
};

export const MonthBreakdownBlock: React.FC<BlockProps> = ({ subscriptions }) => {
  const now = getCurrentDate();
  const items = getMonthlyBreakdown(subscriptions, now.getFullYear(), now.getMonth());

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-slate-900 font-bold">本月扣费项目</h3>
        <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded font-black tracking-tighter">
          {items.length} 笔支出
        </span>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {items.length > 0 ? items.sort((a, b) => b.costInBase - a.costInBase).map((item, idx) => (
          <div key={idx} className="flex justify-between items-center group">
            <div className="flex items-center gap-3">
              <Logo sub={item.sub} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{item.sub.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[9px] font-black uppercase px-1 rounded ${
                    item.sub.billingCycle === BillingCycle.MONTHLY ? 'text-blue-500 bg-blue-50' : 
                    item.sub.billingCycle === BillingCycle.YEARLY ? 'text-amber-600 bg-amber-50' : 'text-slate-400 bg-slate-50'
                  }`}>
                    {item.sub.billingCycle}
                  </span>
                  {item.sub.autoRenew && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="自动续费"></span>}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700">{formatCurrency(item.costInBase, BASE_CURRENCY)}</p>
            </div>
          </div>
        )) : (
          <div className="h-full flex items-center justify-center text-slate-300 text-xs italic py-10 font-medium uppercase tracking-widest">
            本月无支出
          </div>
        )}
      </div>
    </div>
  );
};

export const NextMonthProjectionBlock: React.FC<BlockProps> = ({ subscriptions }) => {
  const now = getCurrentDate();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const items = getNextMonthBreakdown(subscriptions);
  const total = calculateNextMonthCost(subscriptions);

  return (
    <div className="bg-indigo-50/30 p-6 rounded-2xl shadow-sm border border-indigo-100 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-indigo-900 font-bold flex items-center gap-2">
            下月预计支出
            <span className="text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">PREDICT</span>
          </h3>
          <p className="text-xs text-indigo-400 font-medium mt-0.5">
            {nextMonthDate.toLocaleString('zh-CN', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-indigo-600">{formatCurrency(total, BASE_CURRENCY)}</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {items.length > 0 ? items.sort((a, b) => b.costInBase - a.costInBase).map((item, idx) => (
          <div key={idx} className="flex justify-between items-center bg-white/60 p-2.5 rounded-xl border border-indigo-50 shadow-sm">
            <div className="flex items-center gap-3">
              <Logo sub={item.sub} size="w-7 h-7" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{item.sub.name}</p>
                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-tighter">{item.sub.platform}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-slate-700">{formatCurrency(item.costInBase, BASE_CURRENCY)}</p>
            </div>
          </div>
        )) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-[10px] italic font-black uppercase tracking-widest">下月无扣费计划</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const ChartBlock: React.FC<BlockProps> = ({ subscriptions }) => {
  const now = getCurrentDate();
  const data = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(now.getFullYear(), i, 1);
    return {
      name: d.toLocaleString('zh-CN', { month: 'short' }),
      amount: calculateMonthlyCost(subscriptions, d.getFullYear(), d.getMonth()),
      isPast: i <= now.getMonth()
    };
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
      <h3 className="text-slate-900 font-bold mb-4">年度消费趋势 ({now.getFullYear()})</h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
            <Tooltip 
              cursor={{fill: '#f8fafc'}}
              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
              formatter={(value: number) => formatCurrency(value, BASE_CURRENCY)}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
               {data.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={entry.isPast ? '#6366f1' : '#c7d2fe'} />
               ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const UpcomingBlock: React.FC<BlockProps> = ({ subscriptions }) => {
  const upcoming = getUpcomingBills(subscriptions, 30).slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full overflow-hidden flex flex-col">
      <h3 className="text-slate-900 font-bold mb-4 italic tracking-tight">近期账单</h3>
      <div className="space-y-4 flex-1">
        {upcoming.length > 0 ? upcoming.map((sub, idx) => (
          <div key={idx} className="flex justify-between items-center border-l-2 border-slate-100 pl-3 hover:border-indigo-400 transition-colors">
            <div className="flex items-center gap-3">
              <Logo sub={sub} size="w-7 h-7" />
              <div>
                <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{sub.name}</p>
                <p className="text-[9px] text-indigo-500 font-black uppercase mt-0.5">
                  {(sub as any).nextPaymentDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-700">{formatCurrency(sub.cost, sub.currency)}</p>
            </div>
          </div>
        )) : (
          <p className="text-xs text-slate-300 italic py-4 font-medium uppercase tracking-tighter">暂无待支付项</p>
        )}
      </div>
    </div>
  );
};

export const CategoryBlock: React.FC<BlockProps> = ({ subscriptions }) => {
  const cats: Record<string, number> = {};
  subscriptions.forEach(s => {
    const baseVal = convertToBase(s.cost, s.currency);
    cats[s.category] = (cats[s.category] || 0) + baseVal;
  });
  const data = Object.entries(cats).map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
      <h3 className="text-slate-900 font-bold mb-2 uppercase text-[10px] tracking-widest text-slate-400">支出分布</h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip 
              formatter={(value: number) => formatCurrency(value, BASE_CURRENCY)}
              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const BlockContainer: React.FC<BlockProps> = ({ block, subscriptions }) => {
  switch (block.type) {
    case 'SUMMARY': return <SummaryBlock block={block} subscriptions={subscriptions} />;
    case 'MONTH_BREAKDOWN': return <MonthBreakdownBlock block={block} subscriptions={subscriptions} />;
    case 'NEXT_MONTH_PROJECTION': return <NextMonthProjectionBlock block={block} subscriptions={subscriptions} />;
    case 'MONTH_CHART': return <ChartBlock block={block} subscriptions={subscriptions} />;
    case 'UPCOMING': return <UpcomingBlock block={block} subscriptions={subscriptions} />;
    case 'CATEGORY_PIE': return <CategoryBlock block={block} subscriptions={subscriptions} />;
    default: return null;
  }
};
