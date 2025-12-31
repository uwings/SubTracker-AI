
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Subscription, DashboardBlock, BillingCycle, BASE_CURRENCY, PaymentPlatform } from './types';
import { getAllSubscriptions, saveSubscription, deleteSubscription } from './db';
import { parseSubscriptionText, ParsedResponse } from './services/geminiService';
import { BlockContainer } from './components/BlockContainer';
import { SubscriptionList } from './components/SubscriptionList';
import { DraftPreview } from './components/DraftPreview';
import { QuickEntryGrid } from './components/QuickEntryGrid';
import { ShareView } from './components/ShareView';
import { TimelineView } from './components/TimelineView';

const App: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [draftSub, setDraftSub] = useState<ParsedResponse | null>(null);
  const [view, setView] = useState<'dashboard' | 'list' | 'share'>('dashboard');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await getAllSubscriptions();
      setSubscriptions([...data]);
    } catch (err) {
      console.error("DB Load Error:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isParsing) return;

    setIsParsing(true);
    try {
      // Fix: Explicitly cast the unique categories array to string[] to prevent TypeScript from inferring 'unknown[]'.
      const existingCats = Array.from(new Set(subscriptions.map(s => s.category))) as string[];
      const parsed = await parseSubscriptionText(input, existingCats);
      
      if (parsed && parsed.name) {
        if (parsed.intent === 'DELETE' || parsed.intent === 'CANCEL') {
          const target = subscriptions.find(s => s.name.toLowerCase().includes(parsed.name!.toLowerCase()));
          if (target && target.id) {
            if (parsed.intent === 'DELETE') {
              await deleteSubscription(target.id);
              setNotification({ message: `已从记录中移除 ${target.name}`, type: 'success' });
            } else {
              await saveSubscription({ ...target, status: 'canceled', autoRenew: false, updatedAt: Date.now() });
              setNotification({ message: `已停用 ${target.name} 的自动续费`, type: 'success' });
            }
            setInput('');
            loadData();
          } else {
            setNotification({ message: "未能在清单中找到该服务", type: 'error' });
          }
        } else {
          setDraftSub(parsed);
        }
      } else {
        setNotification({ message: "AI 暂时无法理解，请换种描述方式", type: 'error' });
      }
    } catch (err) {
      setNotification({ message: "智能服务连接失败", type: 'error' });
    } finally {
      setIsParsing(false);
    }
  };

  const confirmDraft = async () => {
    if (!draftSub || !draftSub.name) return;
    try {
      const newSub: Subscription = {
        uid: crypto.randomUUID(),
        name: draftSub.name,
        cost: draftSub.cost || 0,
        currency: draftSub.currency || BASE_CURRENCY,
        billingCycle: draftSub.billingCycle || BillingCycle.MONTHLY,
        platform: draftSub.platform || PaymentPlatform.OTHER,
        startDate: new Date().toISOString(),
        autoRenew: draftSub.autoRenew ?? true,
        category: draftSub.category || '其它',
        status: 'active',
        updatedAt: Date.now(),
        logoUrl: draftSub.logoUrl
      };
      await saveSubscription(newSub);
      setDraftSub(null);
      setInput('');
      loadData();
      setNotification({ message: `已成功记录 "${newSub.name}"`, type: 'success' });
    } catch (err) {
      setNotification({ message: "保存记录失败", type: 'error' });
    }
  };

  const blocks: DashboardBlock[] = [
    { id: 'summary', type: 'SUMMARY', title: '概览', size: 'small' },
    { id: 'next_proj', type: 'NEXT_MONTH_PROJECTION', title: '下月预计', size: 'medium' },
    { id: 'upcoming', type: 'UPCOMING', title: '近期扣费', size: 'small' },
    { id: 'cat_pie', type: 'CATEGORY_PIE', title: '分类占比', size: 'medium' },
    { id: 'prod_bar', type: 'PRODUCT_BAR', title: '支出排行', size: 'large' },
    { id: 'chart', type: 'MONTH_CHART', title: '年度趋势', size: 'large' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {notification && (
        <div className="fixed top-24 right-8 z-[100] px-6 py-3 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md animate-in fade-in slide-in-from-right-8 duration-300 flex items-center gap-3 font-bold text-sm bg-white">
          <div className={`w-2 h-2 rounded-full ${notification.type === 'error' ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
          {notification.message}
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-11 h-11 bg-indigo-600 rounded-[14px] flex items-center justify-center text-white shadow-xl shadow-indigo-100 group-hover:scale-105 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.546 1.159 3.696 1.159 5.242 0L16 15.182m-6-6.364l.879-.659c1.546-1.159 3.696-1.159 5.242 0L16 8.818M12 3a9 9 0 110 18 9 9 0 010-18z" /></svg>
            </div>
            <span className="text-xl font-black tracking-tighter">SubTracker <span className="text-indigo-600">AI</span></span>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['dashboard', 'list', 'share'] as const).map(v => (
              <button 
                key={v} 
                onClick={() => setView(v)}
                className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${view === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {v === 'dashboard' ? '看板' : v === 'list' ? '列表' : '分享'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {view !== 'share' && (
          <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full -mr-40 -mt-40 blur-[80px] opacity-40"></div>
            <div className="relative z-10">
              <h2 className="text-[10px] font-black mb-6 text-slate-300 uppercase tracking-[0.3em]">AI-Powered Record</h2>
              <form onSubmit={handleAISubmit} className="relative mb-8">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="试试输入：订阅了 Netflix 4K 会员，每月 19.99 美元"
                  className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-400 focus:bg-white rounded-2xl md:rounded-[2rem] py-6 px-8 pr-32 md:pr-40 text-base md:text-lg font-medium outline-none transition-all placeholder:text-slate-300"
                />
                <button 
                  type="submit"
                  disabled={isParsing || !input.trim()}
                  className="absolute right-3 top-3 bottom-3 px-6 md:px-10 bg-slate-900 hover:bg-black text-white rounded-xl md:rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all disabled:bg-slate-200 disabled:cursor-not-allowed"
                >
                  {isParsing ? '解析中' : '快速记账'}
                </button>
              </form>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <div className="h-[1px] flex-1 bg-slate-100"></div>
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-4">或者从预设中选择</span>
                   <div className="h-[1px] flex-1 bg-slate-100"></div>
                </div>
                <QuickEntryGrid 
                  onSelect={(product, plan) => {
                    setDraftSub({
                      intent: 'CREATE',
                      name: product.name,
                      cost: plan === 'custom' ? 0 : plan.cost,
                      currency: plan === 'custom' ? BASE_CURRENCY : plan.currency,
                      billingCycle: plan === 'custom' ? BillingCycle.MONTHLY : plan.cycle,
                      category: product.category,
                      logoUrl: `https://www.google.com/s2/favicons?sz=128&domain=${product.id}.com`
                    });
                  }} 
                />
              </div>

              {draftSub && (
                <div className="mt-8 border-t border-slate-50 pt-8 animate-in slide-in-from-top-4 duration-300">
                  <DraftPreview 
                    draft={draftSub} 
                    onUpdate={(u) => setDraftSub({ ...draftSub, ...u })} 
                    onConfirm={confirmDraft} 
                    onCancel={() => setDraftSub(null)} 
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {view === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blocks.map(block => (
              <div key={block.id} className={block.size === 'large' ? 'lg:col-span-2' : ''}>
                <BlockContainer block={block} subscriptions={subscriptions} />
              </div>
            ))}
            <div className="lg:col-span-3 pt-4">
              <TimelineView subscriptions={subscriptions} />
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="animate-in fade-in duration-500">
            <SubscriptionList 
              subscriptions={subscriptions} 
              onDelete={(id) => deleteSubscription(id).then(loadData)} 
              onUpdateSub={(sub) => saveSubscription(sub).then(loadData)} 
            />
          </div>
        )}

        {view === 'share' && (
          <ShareView subscriptions={subscriptions} />
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 grayscale transition-all hover:opacity-100 hover:grayscale-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">© 2025 SubTracker AI Dashboard</p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Powered by Gemini 3</span>
            <span>Local IndexedDB Storage</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
