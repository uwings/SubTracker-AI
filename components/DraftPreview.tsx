
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
      autoRenew: isNowRecurring ? (draft.autoRenew ?? true) : false
    });
  };

  return (
    <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-2">
         <button onClick={onCancel} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
        <div className="lg:col-span-3 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">服务名称</label>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0">
               {draft.logoUrl ? <img src={draft.logoUrl} className="w-full h-full object-contain p-1.5" /> : <span className="text-sm font-black text-indigo-400">{draft.name?.charAt(0)}</span>}
             </div>
             <input 
              value={draft.name || ''} 
              onChange={e => onUpdate({ name: e.target.value })} 
              className="w-full bg-slate-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-xl py-2 px-3 text-sm font-bold outline-none" 
            />
          </div>
        </div>

        <div className="lg:col-span-3 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">费用支出</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              value={draft.cost || 0} 
              onChange={e => onUpdate({ cost: parseFloat(e.target.value) || 0 })} 
              className="w-full bg-slate-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-xl py-2 px-3 text-sm font-bold outline-none" 
            />
            <input 
              value={draft.currency || BASE_CURRENCY} 
              onChange={e => onUpdate({ currency: e.target.value.toUpperCase() })} 
              className="w-20 bg-slate-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-xl py-2 px-3 text-[10px] font-black outline-none uppercase text-center" 
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">订阅周期</label>
          <select 
            value={draft.billingCycle || BillingCycle.MONTHLY} 
            onChange={e => handleCycleChange(e.target.value as BillingCycle)} 
            className="w-full bg-slate-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-xl py-2 px-3 text-xs font-bold outline-none appearance-none"
          >
            {CYCLE_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="lg:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">分类标签</label>
          <input 
            value={draft.category || '其它'} 
            onChange={e => onUpdate({ category: e.target.value })} 
            className="w-full bg-slate-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-xl py-2 px-3 text-xs font-bold outline-none" 
          />
        </div>

        <div className="lg:col-span-2">
           <button 
            onClick={onConfirm} 
            className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-slate-100"
          >
            保存此项
          </button>
        </div>
      </div>

      {isRecurring && (
        <div className="mt-4 flex items-center gap-2 px-2">
          <input 
            type="checkbox" 
            id={`auto-renew-${draft.name}`}
            checked={!!draft.autoRenew} 
            onChange={e => onUpdate({ autoRenew: e.target.checked })} 
            className="w-3.5 h-3.5 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500" 
          />
          <label htmlFor={`auto-renew-${draft.name}`} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer select-none">
            开启自动续费提醒
          </label>
        </div>
      )}
    </div>
  );
};
