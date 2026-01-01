
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Subscription, DashboardBlock, BillingCycle, BASE_CURRENCY, PaymentPlatform } from './types';
import { getAllSubscriptions, saveSubscription, deleteSubscription, importSubscriptions } from './db';
import { parseSubscriptionText, ParsedResponse } from './services/geminiService';
import { BlockContainer } from './components/BlockContainer';
import { SubscriptionList } from './components/SubscriptionList';
import { DraftPreview } from './components/DraftPreview';
import { QuickEntryGrid } from './components/QuickEntryGrid';
import { ShareView } from './components/ShareView';
import { TimelineView } from './components/TimelineView';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [draftSubs, setDraftSubs] = useState<ParsedResponse[]>([]);
  const [view, setView] = useState<'dashboard' | 'list' | 'share'>('dashboard');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isParsing) return;

    setIsParsing(true);
    try {
      const existingCats = Array.from(new Set(subscriptions.map(s => s.category))) as string[];
      const items = await parseSubscriptionText(input, existingCats);
      
      if (items.length > 0) {
        // 分离删除意图和创建意图
        const toProcessImmediately = items.filter(it => it.intent === 'DELETE' || it.intent === 'CANCEL');
        const toDraft = items.filter(it => it.intent !== 'DELETE' && it.intent !== 'CANCEL');

        // 立即处理删除/取消
        for (const it of toProcessImmediately) {
          const target = subscriptions.find(s => s.name.toLowerCase().includes(it.name!.toLowerCase()));
          if (target && target.id) {
            if (it.intent === 'DELETE') {
              await deleteSubscription(target.id);
            } else {
              await saveSubscription({ ...target, status: 'canceled', autoRenew: false, updatedAt: Date.now() });
            }
          }
        }

        if (toDraft.length > 0) {
          setDraftSubs(toDraft);
          setInput('');
        } else if (toProcessImmediately.length > 0) {
          showNotice(`已执行 ${toProcessImmediately.length} 项变更操作`);
          setInput('');
          loadData();
        }
      } else {
        showNotice("AI 暂时无法理解，请换种描述方式", "error");
      }
    } catch (err) {
      showNotice("智能服务连接失败", "error");
    } finally {
      setIsParsing(false);
    }
  };

  const confirmAllDrafts = async () => {
    if (draftSubs.length === 0) return;
    try {
      for (const draft of draftSubs) {
        if (!draft.name) continue;
        const newSub: Subscription = {
          uid: crypto.randomUUID(),
          name: draft.name,
          cost: draft.cost || 0,
          currency: draft.currency || BASE_CURRENCY,
          billingCycle: draft.billingCycle || BillingCycle.MONTHLY,
          platform: draft.platform || PaymentPlatform.OTHER,
          startDate: new Date().toISOString(),
          autoRenew: draft.autoRenew ?? true,
          category: draft.category || '其它',
          status: 'active',
          updatedAt: Date.now(),
          logoUrl: draft.logoUrl
        };
        await saveSubscription(newSub);
      }
      setDraftSubs([]);
      loadData();
      showNotice(`成功批量记录 ${draftSubs.length} 项订阅`);
    } catch (err) {
      showNotice("保存失败", "error");
    }
  };

  const updateDraft = (index: number, updates: Partial<ParsedResponse>) => {
    const newDrafts = [...draftSubs];
    newDrafts[index] = { ...newDrafts[index], ...updates };
    setDraftSubs(newDrafts);
  };

  const removeDraft = (index: number) => {
    setDraftSubs(prev => prev.filter((_, i) => i !== index));
  };

  const handleExport = () => {
    if (subscriptions.length === 0) {
      showNotice("暂无数据可导出", "error");
      return;
    }
    const dataStr = JSON.stringify(subscriptions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `subtracker-export-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showNotice("数据已准备好下载");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          await importSubscriptions(json);
          await loadData();
          showNotice(`成功导入 ${json.length} 条记录`);
        } else {
          showNotice("无效的文件格式", "error");
        }
      } catch (err) {
        showNotice("导入失败，请检查文件内容", "error");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
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

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-11 h-11 bg-indigo-600 rounded-[14px] flex items-center justify-center text-white shadow-xl shadow-indigo-100 group-hover:scale-105 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.546 1.159 3.696 1.159 5.242 0L16 15.182m-6-6.364l.879-.659c1.546-1.159 3.696-1.159 5.242 0L16 8.818M12 3a9 9 0 110 18 9 9 0 010-18z" /></svg>
            </div>
            <span className="text-xl font-black tracking-tighter">SubTracker <span className="text-indigo-600">AI</span></span>
          </div>

          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-4">
                <button onClick={handleExport} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 transition-colors py-2" title="导出数据">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">导出数据</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 transition-colors py-2" title="导入数据">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">导入数据</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
             </div>
             <div className="flex items-center gap-3">
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
               <button 
                 onClick={() => setShowSettings(true)}
                 className="p-2.5 bg-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                 title="AI 设置"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               </button>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {view !== 'share' && (
          <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full -mr-40 -mt-40 blur-[80px] opacity-40"></div>
            <div className="relative z-10">
              <h2 className="text-[10px] font-black mb-6 text-slate-300 uppercase tracking-[0.3em]">AI-Powered Batch Record</h2>
              <form onSubmit={handleAISubmit} className="relative mb-8">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="试试输入：ChatGPT 每月 20 美金，DeepSeek 充值 100 元..."
                  className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-400 focus:bg-white rounded-2xl md:rounded-[2rem] py-6 px-8 pr-32 md:pr-40 text-base md:text-lg font-medium outline-none transition-all placeholder:text-slate-300"
                />
                <button 
                  type="submit"
                  disabled={isParsing || !input.trim()}
                  className="absolute right-3 top-3 bottom-3 px-6 md:px-10 bg-slate-900 hover:bg-black text-white rounded-xl md:rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all disabled:bg-slate-200 disabled:cursor-not-allowed"
                >
                  {isParsing ? '解析中' : '批量记账'}
                </button>
              </form>

              {draftSubs.length === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                     <div className="h-[1px] flex-1 bg-slate-100"></div>
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-4">或者从预设中选择</span>
                     <div className="h-[1px] flex-1 bg-slate-100"></div>
                  </div>
                  <QuickEntryGrid 
                    onSelect={(product, plan) => {
                      setDraftSubs([{
                        intent: 'CREATE',
                        name: product.name,
                        cost: plan === 'custom' ? 0 : plan.cost,
                        currency: plan === 'custom' ? BASE_CURRENCY : plan.currency,
                        billingCycle: plan === 'custom' ? BillingCycle.MONTHLY : plan.cycle,
                        category: product.category,
                        logoUrl: `https://www.google.com/s2/favicons?sz=128&domain=${product.id}.com`
                      }]);
                    }} 
                  />
                </div>
              )}

              {draftSubs.length > 0 && (
                <div className="mt-8 space-y-6 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-4 px-2">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {draftSubs.slice(0, 5).map((d, i) => (
                          <div key={i} className="w-9 h-9 rounded-xl bg-white border-2 border-slate-50 flex items-center justify-center text-[10px] font-black overflow-hidden shadow-sm">
                            {d.logoUrl ? <img src={d.logoUrl} className="w-full h-full object-contain p-1" /> : d.name?.charAt(0)}
                          </div>
                        ))}
                        {draftSubs.length > 5 && (
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black border-2 border-slate-50 shadow-sm">
                            +{draftSubs.length - 5}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-black text-slate-900">识别到 {draftSubs.length} 项消费记录</span>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => setDraftSubs([])} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors">全部清空</button>
                      <button 
                        onClick={confirmAllDrafts} 
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95"
                      >
                        全部确认并保存
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {draftSubs.map((draft, index) => (
                      <div key={index}>
                        <DraftPreview 
                          draft={draft} 
                          onUpdate={(u) => updateDraft(index, u)} 
                          onConfirm={() => {
                            const newSub: Subscription = {
                              uid: crypto.randomUUID(),
                              name: draft.name!,
                              cost: draft.cost || 0,
                              currency: draft.currency || BASE_CURRENCY,
                              billingCycle: draft.billingCycle || BillingCycle.MONTHLY,
                              platform: draft.platform || PaymentPlatform.OTHER,
                              startDate: new Date().toISOString(),
                              autoRenew: draft.autoRenew ?? true,
                              category: draft.category || '其它',
                              status: 'active',
                              updatedAt: Date.now(),
                              logoUrl: draft.logoUrl
                            };
                            saveSubscription(newSub).then(() => {
                              removeDraft(index);
                              loadData();
                              showNotice(`已保存 ${newSub.name}`);
                            });
                          }} 
                          onCancel={() => removeDraft(index)} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {view === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blocks.map(block => (
              <div key={block.id} className={block.type === 'MONTH_CHART' ? 'lg:col-span-3' : (block.size === 'large' ? 'lg:col-span-2' : '')}>
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
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center text-[8px] text-white font-black">S</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">© 2025 AiCC@jovi</p>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={handleExport} className="hover:text-indigo-600 transition-colors">导出 JSON</button>
            <button onClick={() => fileInputRef.current?.click()} className="hover:text-indigo-600 transition-colors">导入 JSON</button>
            <button onClick={() => setShowSettings(true)} className="hover:text-indigo-600 transition-colors">模型引擎</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
