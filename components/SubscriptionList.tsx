
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
    const isRecurring = newCycle === BillingCycle.MONTHLY || newCycle === BillingCycle.YEARLY || newCycle === BillingCycle.PHASED;
    
    onUpdateSub({ 
      ...sub, 
      billingCycle: newCycle,
      // 核心联动：非循环订阅强制关闭自动续费
      autoRenew: isRecurring ? sub.autoRenew : false,
      updatedAt: Date.now() 
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">服务项目</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">支付平台</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">订阅周期</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">费用金额</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">自动续费</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">当前状态</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">管理</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {subscriptions.sort((a,b) => b.updatedAt - a.updatedAt).map((sub) => {
              const canAutoRenew = sub.billingCycle === BillingCycle.MONTHLY || sub.billingCycle === BillingCycle.YEARLY || sub.billingCycle === BillingCycle.PHASED;
              
              return (
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
                    <select 
                      value={sub.billingCycle}
                      onChange={(e) => handleCycleChange(sub, e.target.value as BillingCycle)}
                      className={`px-2 py-1 rounded text-[10px] font-black border-none bg-transparent hover:bg-slate-100 cursor-pointer focus:ring-0 appearance-none ${
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
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(sub.cost, sub.currency)}
                    {sub.currency !== BASE_CURRENCY && (
                      <div className="text-[10px] text-slate-400 font-medium">
                        折合 {formatCurrency(convertToBase(sub.cost, sub.currency), BASE_CURRENCY)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
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
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                          sub.autoRenew 
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {sub.autoRenew ? '开启' : '关闭'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-black uppercase tracking-tighter cursor-default">
                        不适用
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black ${sub.status === 'active' ? 'text-emerald-500' : 'text-slate-300'}`}>
                      {sub.status === 'active' ? '● 使用中' : '○ 已终止'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => sub.id && onDelete(sub.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="删除记录">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              );
            })}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-slate-300 italic font-medium">
                  暂无订阅记录。请在上方输入如：“每月15元订阅网易云音乐，支付宝支付”
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
