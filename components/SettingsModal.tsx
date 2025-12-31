
import React, { useState, useEffect } from 'react';
import { AIConfig } from '../types';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [config, setConfig] = useState<AIConfig>({
    provider: 'gemini',
    geminiModel: 'gemini-3-flash-preview'
  });

  useEffect(() => {
    const saved = localStorage.getItem('subtracker_ai_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('subtracker_ai_config', JSON.stringify(config));
    window.location.reload(); // 强制刷新以应用新的 AI 配置
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">智能引擎设置</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configure your AI backbone</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">选择服务商</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setConfig({ ...config, provider: 'gemini' })}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${config.provider === 'gemini' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 hover:border-slate-200'}`}
              >
                <div className="font-black text-sm mb-1 text-slate-900">系统默认</div>
                <div className="text-[10px] text-slate-500 font-medium">Gemini 3 系列 (推荐)</div>
              </button>
              <button 
                onClick={() => setConfig({ ...config, provider: 'custom' })}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${config.provider === 'custom' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 hover:border-slate-200'}`}
              >
                <div className="font-black text-sm mb-1 text-slate-900">自定义 BYOK</div>
                <div className="text-[10px] text-slate-500 font-medium">DeepSeek, OpenAI 等</div>
              </button>
            </div>
          </section>

          {config.provider === 'gemini' ? (
            <section className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">模型版本</h3>
              <div className="space-y-2">
                {(['gemini-3-flash-preview', 'gemini-3-pro-preview'] as const).map(m => (
                  <label key={m} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${config.geminiModel === m ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="geminiModel" 
                        checked={config.geminiModel === m} 
                        onChange={() => setConfig({...config, geminiModel: m})} 
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="font-bold text-sm text-slate-800">{m === 'gemini-3-flash-preview' ? '⚡ Gemini 3 Flash' : '🧠 Gemini 3 Pro'}</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m === 'gemini-3-flash-preview' ? 'Speedy' : 'Intelligent'}</span>
                  </label>
                ))}
              </div>
            </section>
          ) : (
            <section className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">配置信息 (OpenAI 兼容接口)</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">API Key</label>
                  <input 
                    type="password"
                    value={config.customConfig?.apiKey || ''}
                    placeholder="sk-..."
                    onChange={e => setConfig({ ...config, customConfig: { ...(config.customConfig || { baseUrl: '', model: '' }), apiKey: e.target.value } })}
                    className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-100 rounded-xl py-3 px-5 text-sm outline-none font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Base URL</label>
                  <input 
                    type="text"
                    value={config.customConfig?.baseUrl || ''}
                    placeholder="https://api.deepseek.com/v1"
                    onChange={e => setConfig({ ...config, customConfig: { ...(config.customConfig || { apiKey: '', model: '' }), baseUrl: e.target.value } })}
                    className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-100 rounded-xl py-3 px-5 text-sm outline-none font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Model Name</label>
                  <input 
                    type="text"
                    value={config.customConfig?.model || ''}
                    placeholder="deepseek-chat"
                    onChange={e => setConfig({ ...config, customConfig: { ...(config.customConfig || { apiKey: '', baseUrl: '' }), model: e.target.value } })}
                    className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-100 rounded-xl py-3 px-5 text-sm outline-none font-medium"
                  />
                </div>
              </div>
            </section>
          )}

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
             <div className="flex gap-3">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
               <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                 注意：切换设置会刷新应用。如果您选择自定义 Provider，请确保其支持 OpenAI 兼容的聊天补全接口（Chat Completion）。
               </p>
             </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="flex-[2] py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200"
          >
            保存并应用
          </button>
        </div>
      </div>
    </div>
  );
};
