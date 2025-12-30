
import React from 'react';
import { ParsedResponse } from '../services/geminiService';
import { BillingCycle, PaymentPlatform, BASE_CURRENCY } from '../types';

interface DraftPreviewProps {
  draft: ParsedResponse;
  onUpdate: (updates: Partial<ParsedResponse>) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const CYCLE_OPTIONS = [
  { value: BillingCycle.MONTHLY, label: '按月订阅' },
  { value: BillingCycle.YEARLY, label: '按年订阅' },
  { value: BillingCycle.ONE_TIME, label: '单次付费' },
  { value: BillingCycle.LIFETIME, label: '终身买断' },
  { value: BillingCycle.PHASED, label: '阶段性订阅' },
];

export const DraftPreview: React.FC<DraftPreviewProps> = ({ draft, onUpdate, onConfirm, onCancel }) => {
  const isRecurring = draft.billingCycle === BillingCycle.MONTHLY || draft.billingCycle === BillingCycle.YEARLY || draft.billingCycle === BillingCycle.PHASED;

  const handleCycleChange = (cycle: BillingCycle) => {
    const isNowRecurring = cycle === BillingCycle.MONTHLY || cycle === BillingCycle.YEARLY || cycle === BillingCycle.PHASED;
    onUpdate({ 
      billingCycle: cycle,
      // 核心联动：如果是买断或单次，自动取消续费标识
      autoRenew: isNowRecurring ? (draft.autoRenew ?? true) : false
    });
  };

  return (
    <div className="mt-4 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-indigo-900 flex items-center gap-2">
          <span className="flex w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          AI 识别结果校正
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xs font-black uppercase tracking-tighter">放弃修改</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-indigo-300 uppercase">服务名称</label>
          <input 
            value={draft.name || ''} 
            onChange={e => onUpdate({ name: e.target.value })} 
            className="w-full px-3 py-2 bg-white rounded-lg text-sm border-none shadow-sm focus:ring-2 focus:ring-indigo-200 outline-none" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-indigo-300 uppercase">费用与币种</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              value={draft.cost || 0} 
              onChange={e => onUpdate({ cost: parseFloat(e.target.value) || 0 })} 
              className="w-full px-3 py-2 bg-white rounded-lg text-sm border-none shadow-sm outline-none" 
            />
            <input 
              value={draft.currency || BASE_CURRENCY} 
              onChange={e => onUpdate({ currency: e.target.value.toUpperCase() })} 
              className="w-20 px-3 py-2 bg-white rounded-lg text-sm border-none shadow-sm outline-none uppercase" 
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-indigo-300 uppercase">订阅周期</label>
          <select 
            value={draft.billingCycle || BillingCycle.MONTHLY} 
            onChange={e => handleCycleChange(e.target.value as BillingCycle)} 
            className="w-full px-3 py-2 bg-white rounded-lg text-sm border-none shadow-sm outline-none"
          >
            {CYCLE_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-indigo-300 uppercase">支付平台</label>
          <select 
            value={draft.platform || PaymentPlatform.OTHER} 
            onChange={e => onUpdate({ platform: e.target.value as PaymentPlatform })} 
            className="w-full px-3 py-2 bg-white rounded-lg text-sm border-none shadow-sm outline-none"
          >
            {Object.values(PaymentPlatform).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
           {isRecurring && (
             <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={!!draft.autoRenew} 
                onChange={e => onUpdate({ autoRenew: e.target.checked })} 
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-none shadow-inner" 
              />
              <span className="text-xs font-bold text-indigo-700 group-hover:text-indigo-900 transition-colors">开启自动续费</span>
            </label>
           )}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
            <label className="text-[10px] font-black text-indigo-300 uppercase">分类</label>
            <input 
              value={draft.category || '生活'} 
              onChange={e => onUpdate({ category: e.target.value })} 
              className="w-24 bg-transparent text-xs border-none outline-none font-bold text-slate-700" 
              placeholder="e.g. 娱乐" 
            />
          </div>
        </div>
        <button 
          onClick={onConfirm} 
          className="w-full md:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm shadow-xl shadow-indigo-200 transition-all transform active:scale-95"
        >
          确认并保存
        </button>
      </div>
    </div>
  );
};
