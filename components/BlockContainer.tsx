
import React from 'react';
import { DashboardBlock, Subscription, BASE_CURRENCY } from '../types';
import { calculateMonthlyCost, getAnnualBudgetProjection, getUpcomingBills, getMonthlyBreakdown, getTotalRealizedSpending, getNextMonthBreakdown, calculateNextMonthCost } from '../utils/calculations';
import { convertToBase, formatCurrency } from '../utils/currency';
import { getCurrentDate } from '../utils/dateUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';

interface BlockProps {
  block: DashboardBlock;
  subscriptions: Subscription[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

const Logo: React.FC<{ sub: Subscription, size?: string, className?: string }> = ({ sub, size = "w-8 h-8", className = "" }) => {
  if (sub.logoUrl) {
    return (
      <img 
        src={sub.logoUrl} 
        alt={sub.name} 
        className={`${size} rounded-lg bg-slate-50 object-contain p-1 border border-slate-100 shadow-sm ${className}`} 
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const next = e.currentTarget.nextElementSibling as HTMLElement;
          if (next) next.style.display = 'flex';
        }}
      />
    );
  }
  return (
    <div className={`${size} rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs ${className}`}>
      {sub.name.charAt(0).toUpperCase()}
    </div>
  );
};

export const SummaryBlock: React.FC<BlockProps> = ({ subscriptions }) => {
  const now = getCurrentDate();
  const year = now.getFullYear();
  const monthly = calculateMonthlyCost(subscriptions, year, now.getMonth());
  const totalRealized = getTotalRealizedSpending(subscriptions);
  const annualBudget = getAnnualBudgetProjection(subscriptions, year);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col justify-between space-y-6">
      <div>
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">本月消费总额</h3>
        <p className="text-4xl font-black text-slate-900 leading-tight">
          {formatCurrency(monthly, BASE_CURRENCY)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
        <div className="border-r border-slate-50 pr-2">
          <h3 className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">累计总支出</h3>
          <p className="text-lg font-bold text-slate-800">{formatCurrency(totalRealized, BASE_CURRENCY)}</p>
        </div>
        <div className="pl-2">
          <h3 className="text-indigo-500 text-[9px] font-black uppercase tracking-widest mb-1">年度预算预测</h3>
          <p className="text-lg font-bold text-indigo-600">{formatCurrency(annualBudget, BASE_CURRENCY)}</p>
        </div>
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
  const total = Object.values(cats).reduce((a, b) => a + b, 0);
  const data = Object.entries(cats)
    .map(([name, value]) => ({ 
      name, 
      value, 
      percent: total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%' 
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col min-h-[350px]">
      <h3 className="text-slate-900 font-bold mb-4 flex justify-between items-center text-sm uppercase tracking-widest">分类占比</h3>
      <div className="flex-1 flex flex-col items-center justify-center">
        {data.length > 0 ? (
          <>
            <div className="w-full h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value, BASE_CURRENCY)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2 mt-4 max-h-32 overflow-y-auto custom-scrollbar pr-1">
              {data.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] font-bold">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-slate-600 truncate">{item.name}</span>
                  </div>
                  <span className="text-slate-900 flex-shrink-0 ml-2">{item.percent}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-300 text-xs italic">暂无分类数据</div>
        )}
      </div>
    </div>
  );
};

const CustomTick = (props: any) => {
  const { x, y, payload, items } = props;
  const item = items?.find((i: any) => i.name === payload.value);
  if (!item) return null;
  
  return (
    <g transform={`translate(${x - 110},${y - 12})`}>
      <foreignObject width="110" height="24">
        <div className="flex items-center gap-2 pr-2 justify-end w-full h-full">
          <span className="text-[10px] font-bold text-slate-500 truncate text-right flex-1">{item.name}</span>
          <Logo sub={item.sub} size="w-5 h-5" />
        </div>
      </foreignObject>
    </g>
  );
};

export const ProductBarBlock: React.FC<BlockProps> = ({ subscriptions }) => {
  const now = getCurrentDate();
  const rawItems = getMonthlyBreakdown(subscriptions, now.getFullYear(), now.getMonth());
  const data = rawItems
    .sort((a, b) => b.costInBase - a.costInBase)
    .slice(0, 10) 
    .map(item => ({
      name: item.sub.name,
      amount: item.costInBase,
      sub: item.sub
    }));

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-slate-900 font-bold text-sm uppercase tracking-widest">支出排行</h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top 10 This Month</span>
      </div>
      <div className="flex-1 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 100, right: 60, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={<CustomTick items={data} />}
                width={1} 
              />
              <Tooltip 
                cursor={{fill: '#f8fafc', radius: 8}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                formatter={(value: number) => [formatCurrency(value, BASE_CURRENCY), '费用']} 
              />
              <Bar dataKey="amount" radius={[0, 8, 8, 0]} barSize={20}>
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                <LabelList 
                  dataKey="amount" 
                  position="right" 
                  formatter={(val: number) => formatCurrency(val, BASE_CURRENCY)} 
                  style={{fontSize: '9px', fontWeight: '800', fill: '#64748b'}} 
                  offset={10} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-300 text-xs italic">
            暂无排行数据
          </div>
        )}
      </div>
    </div>
  );
};

export const MonthBreakdownBlock: React.FC<BlockProps> = ({ subscriptions }) => {
  const now = getCurrentDate();
  const items = getMonthlyBreakdown(subscriptions, now.getFullYear(), now.getMonth());

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col min-h-[350px]">
      <h3 className="text-slate-900 font-black text-sm uppercase tracking-widest mb-6">扣费清单</h3>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {items.sort((a,b) => b.costInBase - a.costInBase).map((item, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Logo sub={item.sub} size="w-7 h-7" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{item.sub.name}</p>
                <p className="text-[9px] text-slate-400 font-black uppercase">{item.sub.platform}</p>
              </div>
            </div>
            <p className="text-xs font-black text-slate-700">{formatCurrency(item.costInBase, BASE_CURRENCY)}</p>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-slate-300 italic text-center py-10">本月无记录</p>}
      </div>
    </div>
  );
};

export const NextMonthProjectionBlock: React.FC<BlockProps> = ({ subscriptions }) => {
  const total = calculateNextMonthCost(subscriptions);
  const items = getNextMonthBreakdown(subscriptions);

  return (
    <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-200 h-full flex flex-col min-h-[160px] text-white">
      <div className="mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Projection</h3>
        <p className="text-3xl font-black">{formatCurrency(total, BASE_CURRENCY)}</p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {items.slice(0, 3).map((item, idx) => (
          <div key={idx} className="flex justify-between items-center bg-white/10 p-2 rounded-xl">
             <span className="text-[10px] font-bold truncate">{item.sub.name}</span>
             <span className="text-[10px] font-black">{formatCurrency(item.costInBase, BASE_CURRENCY)}</span>
          </div>
        ))}
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
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-full flex flex-col min-h-[400px]">
      <h3 className="text-slate-900 font-black mb-8 text-sm uppercase tracking-widest">年度趋势</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
               {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.isPast ? '#6366f1' : '#c7d2fe'} />)}
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
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col min-h-[160px]">
      <h3 className="text-slate-900 font-black mb-6 text-sm uppercase tracking-widest">近期待付</h3>
      <div className="space-y-4">
        {upcoming.map((sub, idx) => (
          <div key={idx} className="flex justify-between items-center border-l-4 border-indigo-500 pl-4 py-1">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{sub.name}</p>
              <p className="text-[10px] text-indigo-500 font-black uppercase">{(sub as any).nextPaymentDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</p>
            </div>
            <p className="text-xs font-black text-slate-700 ml-2 whitespace-nowrap">{formatCurrency(sub.cost, sub.currency)}</p>
          </div>
        ))}
        {upcoming.length === 0 && <p className="text-xs text-slate-300 italic py-4 text-center">无待付项目</p>}
      </div>
    </div>
  );
};

export const BlockContainer: React.FC<BlockProps> = ({ block, subscriptions }) => {
  return (
    <div className="h-full">
      {(() => {
        switch (block.type) {
          case 'SUMMARY': return <SummaryBlock block={block} subscriptions={subscriptions} />;
          case 'MONTH_BREAKDOWN': return <MonthBreakdownBlock block={block} subscriptions={subscriptions} />;
          case 'NEXT_MONTH_PROJECTION': return <NextMonthProjectionBlock block={block} subscriptions={subscriptions} />;
          case 'MONTH_CHART': return <ChartBlock block={block} subscriptions={subscriptions} />;
          case 'UPCOMING': return <UpcomingBlock block={block} subscriptions={subscriptions} />;
          case 'CATEGORY_PIE': return <CategoryBlock block={block} subscriptions={subscriptions} />;
          case 'PRODUCT_BAR': return <ProductBarBlock block={block} subscriptions={subscriptions} />;
          default: return null;
        }
      })()}
    </div>
  );
};
