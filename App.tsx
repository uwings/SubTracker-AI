
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Subscription, DashboardBlock, BillingCycle, BASE_CURRENCY, PaymentPlatform } from './types';
import { getAllSubscriptions, saveSubscription, deleteSubscription, clearAllSubscriptions, importSubscriptions } from './db';
import { parseSubscriptionText, ParsedResponse } from './services/geminiService';
import { BlockContainer } from './components/BlockContainer';
import { SubscriptionList } from './components/SubscriptionList';
import { DraftPreview } from './components/DraftPreview';
import { TimelineView } from './components/TimelineView';

const App: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [draftSub, setDraftSub] = useState<ParsedResponse | null>(null);
  const [view, setView] = useState<'dashboard' | 'list'>('dashboard');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [blocks] = useState<DashboardBlock[]>([
    { id: '1', type: 'SUMMARY', title: '概览', size: 'small' },
    { id: '2', type: 'MONTH_BREAKDOWN', title: '扣费明细', size: 'medium' },
    { id: '6', type: 'NEXT_MONTH_PROJECTION', title: '下月预计', size: 'medium' },
    { id: '4', type: 'MONTH_CHART', title: '消费趋势', size: 'large' },
    { id: '7', type: 'PRODUCT_BAR', title: '产品消费比对', size: 'medium' },
    { id: '5', type: 'CATEGORY_PIE', title: '分类占比', size: 'medium' },
    { id: '3', type: 'UPCOMING', title: '待支付账单', size: 'small' },
  ]);

  const loadData = useCallback(async () => {
    try {
      const data = await getAllSubscriptions();
      setSubscriptions([...data]); 
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), notification.type === 'error' ? 8000 : 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isParsing) return;

    setIsParsing(true);
    const parsed = await parseSubscriptionText(input);
    setIsParsing(false);

    if (parsed && parsed.name) {
      if (parsed.intent === 'DELETE' || parsed.intent === 'CANCEL') {
        handleExecuteIntent(parsed);
      } else {
        setDraftSub(parsed);
      }
    } else {
      setNotification({ message: "无法识别输入内容，请重试。", type: 'error' });
    }
  };

  const handleExecuteIntent = async (parsed: ParsedResponse) => {
    const existingMatches = subscriptions.filter(s => 
      s.name.toLowerCase().includes(parsed.name!.toLowerCase())
    );

    if (parsed.intent === 'DELETE') {
      if (existingMatches.length > 0) {
        for (const match of existingMatches) {
          if (match.id) await deleteSubscription(match.id);
        }
        setNotification({ message: `已移除匹配 "${parsed.name}" 的项目`, type: 'info' });
      } else {
        setNotification({ message: `未找到名称包含 "${parsed.name}" 的项目`, type: 'error' });
      }
    } else if (parsed.intent === 'CANCEL') {
      if (existingMatches.length > 0) {
        for (const match of existingMatches) {
          const updated = { ...match, status: 'canceled' as const, endDate: new Date().toISOString(), updatedAt: Date.now() };
          await saveSubscription(updated as Subscription);
        }
        setNotification({ message: `已取消 "${parsed.name}" 的续费`, type: 'info' });
      } else {
        setNotification({ message: `未找到可取消的 "${parsed.name}" 项目`, type: 'error' });
      }
    }
    
    setInput('');
    setDraftSub(null);
    loadData();
  };

  const handleSaveDraft = async () => {
    if (!draftSub || !draftSub.name) return;

    const existingMatch = subscriptions.find(s => 
      s.name.toLowerCase() === draftSub.name!.toLowerCase()
    );

    if (existingMatch) {
      const updated: Subscription = {
        ...existingMatch,
        ...Object.fromEntries(Object.entries(draftSub).filter(([k, v]) => v !== undefined && k !== 'intent')),
        updatedAt: Date.now()
      } as Subscription;
      await saveSubscription(updated);
      setNotification({ message: `已更新 "${draftSub.name}"`, type: 'success' });
    } else {
      const newSub: Subscription = {
        uid: crypto.randomUUID(),
        name: draftSub.name,
        cost: draftSub.cost || 0,
        currency: draftSub.currency?.toUpperCase() || BASE_CURRENCY,
        billingCycle: (draftSub.billingCycle as BillingCycle) || BillingCycle.MONTHLY,
        platform: (draftSub.platform as PaymentPlatform) || PaymentPlatform.OTHER,
        startDate: draftSub.startDate || new Date().toISOString(),
        autoRenew: draftSub.autoRenew ?? true,
        category: draftSub.category || '生活',
        status: 'active',
        updatedAt: Date.now(),
        notes: draftSub.notes,
        websiteUrl: draftSub.websiteUrl,
        logoUrl: draftSub.logoUrl
      };
      await saveSubscription(newSub);
      setNotification({ message: `已添加 "${newSub.name}"`, type: 'success' });
    }

    setDraftSub(null);
    setInput('');
    loadData();
  };

  const handleExportData = () => {
    if (subscriptions.length === 0) {
      setNotification({ message: "没有可导出的数据", type: 'info' });
      return;
    }
    // 导出纯净 JSON，并显式指定编码
    const dataStr = JSON.stringify(subscriptions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const exportFileDefaultName = `subtracker-backup-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
    setNotification({ message: "备份导出成功", type: 'success' });
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // 重置以触发 onChange
      fileInputRef.current.click();
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') return;
        
        let importedData: any;
        try {
          importedData = JSON.parse(content);
        } catch (e) {
          throw new Error("文件内容格式错误，请确保是标准的 JSON 文件。");
        }
        
        if (!Array.isArray(importedData)) {
          throw new Error("导入的数据格式不匹配（应为列表）。");
        }

        if (confirm(`准备同步 ${importedData.length} 条记录。系统将自动按 UID 进行覆盖或新增，是否继续？`)) {
          setNotification({ message: "正在同步数据...", type: 'info' });
          await importSubscriptions(importedData);
          setNotification({ message: `导入完成：已同步 ${importedData.length} 条数据`, type: 'success' });
          await loadData();
        }
      } catch (err: any) {
        console.error("Import error:", err);
        setNotification({ 
          message: `导入失败: ${err.message}`, 
          type: 'error' 
        });
      }
    };
    reader.onerror = () => setNotification({ message: "文件读取失败", type: 'error' });
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {notification && (
        <div className="fixed top-24 right-8 z-50 px-6 py-3 rounded-2xl shadow-2xl border border-slate-100 text-sm font-black bg-white/90 backdrop-blur-md animate-in slide-in-from-right-8 fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${notification.type === 'error' ? 'bg-red-500' : notification.type === 'info' ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-500'}`}></span>
            {notification.message}
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none tracking-tight">SubTracker AI</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">智能订阅管家</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
              <button 
                onClick={() => setView('dashboard')} 
                className={`px-6 py-2 text-xs font-black uppercase tracking-tighter rounded-lg transition-all ${view === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700'}`}
              >
                数据看板
              </button>
              <button 
                onClick={() => setView('list')} 
                className={`px-6 py-2 text-xs font-black uppercase tracking-tighter rounded-lg transition-all ${view === 'list' ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700'}`}
              >
                详细账单
              </button>
            </nav>

            <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleImportClick}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-2 group"
                title="导入备份 (.json)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </button>
              <button 
                onClick={handleExportData}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-2 group"
                title="导出备份 (.json)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".json" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="mb-10">
          <form onSubmit={handleAISubmit} className="relative group">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="试试输入：'每月15元订阅网易云音乐，支付宝支付'"
              className="w-full bg-white border-2 border-slate-100 focus:border-indigo-400 focus:ring-8 focus:ring-indigo-50 rounded-3xl py-6 px-8 pr-44 text-slate-800 shadow-2xl shadow-slate-200/50 transition-all outline-none text-lg font-medium placeholder:text-slate-300"
            />
            <button 
              type="submit"
              disabled={isParsing || !input.trim()}
              className="absolute right-4 top-3 bottom-3 px-8 bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95"
            >
              {isParsing ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>AI 记账</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </>
              )}
            </button>
          </form>

          {draftSub && (
            <DraftPreview 
              draft={draftSub} 
              onUpdate={(upd) => setDraftSub({ ...draftSub, ...upd })} 
              onConfirm={handleSaveDraft} 
              onCancel={() => setDraftSub(null)} 
            />
          )}
        </div>

        {view === 'dashboard' ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {blocks.map((block) => (
                <div key={block.id} className={`${block.size === 'large' ? 'lg:col-span-2' : block.size === 'medium' ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                  <BlockContainer block={block} subscriptions={subscriptions} />
                </div>
              ))}
            </div>
            
            <div className="pt-8 border-t border-slate-100">
              <TimelineView subscriptions={subscriptions} />
            </div>
          </div>
        ) : (
          <SubscriptionList 
            subscriptions={subscriptions} 
            onDelete={(id) => {
              if (confirm('确定要彻底删除这条记录吗？')) {
                deleteSubscription(id).then(loadData);
              }
            }} 
            onToggleStatus={async (sub) => {
              const updated = { 
                ...sub, 
                status: sub.status === 'active' ? 'canceled' : 'active', 
                endDate: sub.status === 'active' ? new Date().toISOString() : undefined,
                updatedAt: Date.now() 
              } as Subscription;
              await saveSubscription(updated);
              loadData();
            }} 
          />
        )}
      </main>

      <footer className="p-10 text-center border-t border-slate-100 bg-white mt-12 flex flex-col items-center gap-4">
        <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.3em]">
          Smart Lifecycle Management & Analysis Ledger
        </p>
        <button 
          onClick={() => {
            if(confirm("警告：这将清除所有本地数据！建议先导出备份。是否继续？")) {
              clearAllSubscriptions().then(loadData);
            }
          }}
          className="text-[8px] font-black text-slate-200 hover:text-red-400 uppercase tracking-widest transition-colors"
        >
          重置数据库
        </button>
      </footer>
    </div>
  );
};

export default App;
