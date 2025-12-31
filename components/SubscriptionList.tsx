
import React from 'react';
import { Subscription, BillingCycle, BASE_CURRENCY, PaymentPlatform } from '../types';
import { convertToBase, formatCurrency } from '../utils/currency';

interface ListProps {
  subscriptions: Subscription[];
  onDelete: (id: number) => void;
  onUpdateSub: (sub: Subscription) => void;
}

const PLATFORM_MAP: Record<PaymentPlatform, string> = {
  [PaymentPlatform.ALIPAY]: '支付宝',
  [PaymentPlatform.WECHAT]: '微信支付',
  [PaymentPlatform.APPLE]: 'Apple/iOS',
  [PaymentPlatform.GOOGLE]: 'Google Play',
  [PaymentPlatform.PAYPAL]: 'PayPal',
  [PaymentPlatform.CREDIT_CARD]: '信用卡',
  [PaymentPlatform.OTHER]: '其他',
};

const CYCLE_MAP: Record<BillingCycle, string> = {
  [BillingCycle.MONTHLY]: '按月订阅',
  [BillingCycle.YEARLY]: '按年订阅',
  [BillingCycle.ONE_TIME]: '单次付费',
  [BillingCycle.LIFETIME]: '终身买断',
  [BillingCycle.PHASED]: '阶段性订阅',
};

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
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[platform] || styles[PaymentPlatform.OTHER]}`}>
      {PLATFORM_MAP[platform] || platform}
    </span>
  );
};

export const SubscriptionList: React.FC<ListProps> = ({ subscriptions, onDelete, onUpdateSub }) => {
  
  const handleCycleChange = (sub: Subscription, newCycle: BillingCycle) => {
    // 逻辑：只有按月、按年或分阶段可以开启自动续费
    const isRecurring = newCycle === BillingCycle.MONTHLY || newCycle === BillingCycle.YEARLY || newCycle === BillingCycle.PHASED;
    
    onUpdateSub({ 
      ...sub, 
      billingCycle: newCycle,
      autoRenew: isRecurring ? sub.autoRenew : false,
      status: (isRecurring && sub.autoRenew) ? 'active' : sub.status,
      updatedAt: Date.now() 
    });
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">服务项目</th>
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">支付方式</th>
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">计划方案</th>
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">费用支出</th>
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">自动续费</th>
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {subscriptions.sort((a,b) => b.updatedAt - a.updatedAt).map((sub) => {
              const canAutoRenew = sub.billingCycle === BillingCycle.MONTHLY || sub.billingCycle === BillingCycle.YEARLY || sub.billingCycle === BillingCycle.PHASED;
              
              return (
                <tr key={sub.uid} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      {sub.logoUrl ? (
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 p-2 shadow-sm flex items-center justify-center">
                           <img src={sub.logoUrl} className="max-w-full max-h-full object-contain" alt="" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
                          {sub.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 leading-tight truncate">{sub.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{sub.category}</span>
                          <span className={`text-[10px] font-black ${sub.status === 'active' ? 'text-emerald-500' : 'text-slate-300'}`}>
                             {sub.status === 'active' ? '● 活跃' : '○ 已停止'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <PlatformBadge platform={sub.platform} />
                  </td>
                  <td className="px-6 py-5">
                    <div className="relative inline-block group">
                      <select 
                        value={sub.billingCycle}
                        onChange={(e) => handleCycleChange(sub, e.target.value as BillingCycle)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black border-2 border-slate-50 bg-slate-50 hover:border-indigo-100 cursor-pointer focus:ring-0 appearance-none pr-8 transition-all ${
                          sub.billingCycle === BillingCycle.YEARLY ? 'text-amber-700' : 
                          sub.billingCycle === BillingCycle.MONTHLY ? 'text-blue-700' : 
                          sub.billingCycle === BillingCycle.LIFETIME ? 'text-indigo-700' :
                          'text-slate-700'
                        }`}
                      >
                        {Object.values(BillingCycle).map(cycle => (
                          <option key={cycle} value={cycle}>{CYCLE_MAP[cycle]}</option>
                        ))}
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="font-black text-slate-900">{formatCurrency(sub.cost, sub.currency)}</div>
                    {sub.currency !== BASE_CURRENCY && (
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                        ≈ {formatCurrency(convertToBase(sub.cost, sub.currency), BASE_CURRENCY)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    {canAutoRenew ? (
                      <button 
                        onClick={() => {
                          const newAutoRenew = !sub.autoRenew;
                          onUpdateSub({ 
                            ...sub, 
                            autoRenew: newAutoRenew, 
                            status: newAutoRenew ? 'active' : 'canceled',
                            endDate: newAutoRenew ? undefined : new Date().toISOString(),
                            updatedAt: Date.now() 
                          });
                        }}
                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${
                          sub.autoRenew 
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-sm border border-emerald-100' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {sub.autoRenew ? '自动续费中' : '已关闭'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest opacity-50">
                        N/A
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button onClick={() => sub.id && onDelete(sub.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all" title="删除记录">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              );
            })}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-32 text-center text-slate-300 italic font-medium">
                  <div className="flex flex-col items-center gap-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                     <span className="text-sm font-black uppercase tracking-widest">暂无活跃的订阅账单</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
