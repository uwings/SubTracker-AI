
import React from 'react';
import { Subscription, BillingCycle, BASE_CURRENCY, PaymentPlatform } from '../types';
import { convertToBase, formatCurrency } from '../utils/currency';

interface ListProps {
  subscriptions: Subscription[];
  onDelete: (id: number) => void;
  onToggleStatus: (sub: Subscription) => void;
}

const PlatformBadge: React.FC<{ platform: PaymentPlatform }> = ({ platform }) => {
  const styles: Record<string, string> = {
    [PaymentPlatform.ALIPAY]: 'bg-blue-50 text-blue-600 border-blue-100',
    [PaymentPlatform.WECHAT]: 'bg-green-50 text-green-600 border-green-100',
    [PaymentPlatform.APPLE]: 'bg-slate-900 text-white border-slate-900',
    [PaymentPlatform.GOOGLE]: 'bg-red-50 text-red-600 border-red-100',
    [PaymentPlatform.PAYPAL]: 'bg-blue-100 text-blue-800 border-blue-200',
    [PaymentPlatform.CREDIT_CARD]: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    [PaymentPlatform.OTHER]: 'bg-slate-50 text-slate-400 border-slate-100',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${styles[platform] || styles[PaymentPlatform.OTHER]}`}>
      {platform}
    </span>
  );
};

export const SubscriptionList: React.FC<ListProps> = ({ subscriptions, onDelete, onToggleStatus }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Platform</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cycle</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cost</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Auto-Renew</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {subscriptions.sort((a,b) => b.updatedAt - a.updatedAt).map((sub) => (
              <tr key={sub.uid} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    {sub.logoUrl ? (
                      <img src={sub.logoUrl} className="w-10 h-10 rounded-xl bg-white border border-slate-100 p-1 object-contain" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                        {sub.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">{sub.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{sub.category}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <PlatformBadge platform={sub.platform} />
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                    sub.billingCycle === BillingCycle.YEARLY ? 'bg-amber-100 text-amber-700' : 
                    sub.billingCycle === BillingCycle.MONTHLY ? 'bg-blue-100 text-blue-700' : 
                    sub.billingCycle === BillingCycle.LIFETIME ? 'bg-indigo-100 text-indigo-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {sub.billingCycle}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                  {formatCurrency(sub.cost, sub.currency)}
                  {sub.currency !== BASE_CURRENCY && (
                    <div className="text-[10px] text-slate-400 font-medium">
                      ≈ {formatCurrency(convertToBase(sub.cost, sub.currency), BASE_CURRENCY)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${sub.autoRenew ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    {sub.autoRenew ? 'ON' : 'OFF'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => onToggleStatus(sub)}
                    className={`text-[10px] font-black uppercase tracking-wider ${sub.status === 'active' ? 'text-emerald-500' : 'text-slate-300'}`}
                  >
                    {sub.status === 'active' ? '● Active' : '○ Canceled'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => sub.id && onDelete(sub.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-slate-300 italic font-medium">No records yet. Ask AI to "Add 1Password $35/year via Credit Card".</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
