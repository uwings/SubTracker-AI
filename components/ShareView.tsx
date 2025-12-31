
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { domToPng } from 'modern-screenshot';
import { Subscription, BASE_CURRENCY } from '../types';
import { calculateMonthlyCost } from '../utils/calculations';
import { formatCurrency } from '../utils/currency';
import { getCurrentDate } from '../utils/dateUtils';

interface ShareViewProps {
  subscriptions: Subscription[];
}

// 预设的高质量抽象背景图
const ABSTRACT_BGS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=800&auto=format&fit=crop',
];

/**
 * 辅助函数：将远程图片转换为 Base64
 * 这是解决 dom-to-image 类库跨域问题的终极方案
 */
const toDataURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      const reader = new FileReader();
      reader.onloadend = function() {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = () => reject();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  });
};

export const ShareView: React.FC<ShareViewProps> = ({ subscriptions }) => {
  const [sharerName, setSharerName] = useState('SubTracker 用户');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [logoCache, setLogoCache] = useState<Record<string, string>>({});
  const posterRef = useRef<HTMLDivElement>(null);

  const displaySubs = useMemo(() => {
    return [...subscriptions].sort((a, b) => b.cost - a.cost).slice(0, 10);
  }, [subscriptions]);

  // 预加载 Logo 并转换为 Base64 缓存
  useEffect(() => {
    const loadLogos = async () => {
      const cache: Record<string, string> = {};
      const promises = displaySubs.map(async (sub) => {
        if (sub.logoUrl) {
          try {
            // 注意：如果图片服务器不支持 CORS，此步骤可能失败
            // 但 google favicons 协议通常支持
            const base64 = await toDataURL(sub.logoUrl);
            cache[sub.uid] = base64;
          } catch (e) {
            console.warn(`Failed to cache logo for ${sub.name}`);
          }
        }
      });
      await Promise.allSettled(promises);
      setLogoCache(cache);
    };
    loadLogos();
  }, [displaySubs]);

  const now = getCurrentDate();
  const monthlyCost = calculateMonthlyCost(subscriptions, now.getFullYear(), now.getMonth());

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setAvatar(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setIsGenerating(true);
    
    try {
      const dataUrl = await domToPng(posterRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        quality: 1,
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `subtracker-ai-report-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Poster generation failed:', err);
      alert('海报生成失败，由于浏览器安全限制，某些图片无法加载，建议直接截屏分享。');
    } finally {
      setIsGenerating(false);
    }
  };

  const nextBg = () => setBgIndex((prev) => (prev + 1) % ABSTRACT_BGS.length);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-8">
            <div>
               <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">定制分享海报</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Customize your square visual report</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">展示昵称</label>
                <input 
                  value={sharerName}
                  onChange={(e) => setSharerName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-100 rounded-xl py-3.5 px-5 text-sm font-bold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">个人头像</label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                    {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-xl">?</div>}
                  </div>
                  <label className="flex-1 cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase text-center border-2 border-dashed border-slate-200 transition-all">
                    更换头像
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">视觉风格 (背景图片)</label>
                <button 
                  onClick={nextBg}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-3 rounded-xl text-[10px] font-black uppercase text-center border border-slate-200 transition-all"
                >
                  点击切换背景图
                </button>
              </div>
            </div>

            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-100/30 flex items-center justify-center gap-3 active:scale-95"
            >
              {isGenerating ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : '导出方角海报'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 flex justify-center">
          <div className="sticky top-28 w-full max-w-[420px]">
            {/* 方角海报主体 */}
            <div 
              ref={posterRef}
              className="bg-white shadow-2xl overflow-hidden w-full border border-slate-100 flex flex-col relative rounded-none"
              style={{ minHeight: '720px' }}
            >
              {/* Header 区域 */}
              <div 
                className="p-12 text-white relative flex flex-col justify-end overflow-hidden"
                style={{ 
                  height: '280px',
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%), url(${ABSTRACT_BGS[bgIndex]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="flex items-center gap-4 mb-auto relative z-10">
                  <div className="w-16 h-16 rounded-full border-4 border-white/30 shadow-2xl overflow-hidden bg-white/10 backdrop-blur-md">
                    {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/40 text-2xl font-black">?</div>}
                  </div>
                  <div>
                    <h3 className="text-xl font-black truncate max-w-[200px] drop-shadow-md">{sharerName}</h3>
                    <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-1 drop-shadow-md">Subscription Collector</p>
                  </div>
                </div>
                
                <div className="mt-8 relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/60 mb-1 drop-shadow-sm">Current Monthly Cost</p>
                  <p className="text-5xl font-black tracking-tighter drop-shadow-lg">{formatCurrency(monthlyCost, BASE_CURRENCY)}</p>
                </div>
              </div>

              <div className="flex-1 p-10 bg-white flex flex-col">
                <div className="flex-1 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Service Details</h4>
                  {displaySubs.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between group py-1">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-none bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden flex-shrink-0">
                           {/* 优先使用 Base64 缓存的图片，彻底解决海报导出时的跨域问题 */}
                           {logoCache[sub.uid] || sub.logoUrl ? (
                             <img 
                               src={logoCache[sub.uid] || sub.logoUrl} 
                               alt={sub.name}
                               className="w-full h-full object-contain p-1.5"
                               onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                                 const p = e.currentTarget.parentElement;
                                 if (p) {
                                   p.innerHTML = `<span class="text-indigo-600 font-black text-sm">${sub.name.charAt(0)}</span>`;
                                 }
                               }}
                             />
                           ) : (
                             <span className="text-indigo-600 font-black text-sm">{sub.name.charAt(0)}</span>
                           )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 leading-tight truncate max-w-[140px]">{sub.name}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{sub.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900">{formatCurrency(sub.cost, sub.currency)}</p>
                        <p className="text-[7px] text-slate-300 font-bold uppercase tracking-tighter mt-0.5">{sub.billingCycle}</p>
                      </div>
                    </div>
                  ))}
                  {displaySubs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 opacity-10">
                      <p className="text-xs font-black uppercase tracking-widest">No Active Subscriptions</p>
                    </div>
                  )}
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 flex items-end justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-600 flex items-center justify-center text-white font-black text-[10px]">S</div>
                      {/* 添加 whitespace-nowrap 防止 Logo 文字换行 */}
                      <p className="text-lg font-black text-slate-900 tracking-tighter leading-none whitespace-nowrap">SubTracker <span className="text-indigo-600">AI</span></p>
                    </div>
                    <p className="text-[7px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-3">Intelligent Personal Subscription Manager</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 inline-block">
                      {now.getFullYear()} Digital Report
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-6 bg-slate-100/50 py-2 rounded-lg">
              Square Minimalist Design • SubTracker AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
