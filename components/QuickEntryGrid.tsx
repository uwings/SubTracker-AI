
import React, { useState, useMemo, useEffect } from 'react';
import { ALL_PRESETS } from '../data/presets';
import { PresetProduct, PresetPlan } from '../types';

interface QuickEntryGridProps {
  onSelect: (product: PresetProduct, plan: PresetPlan | 'custom') => void;
  expanded?: boolean;
  onStateChange?: (isSelectingPlan: boolean) => void;
}

export const QuickEntryGrid: React.FC<QuickEntryGridProps> = ({ onSelect, expanded = false, onStateChange }) => {
  const [activeProduct, setActiveProduct] = useState<PresetProduct | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

  useEffect(() => {
    if (!expanded) {
      setActiveProduct(null);
    }
  }, [expanded]);

  // 通知父组件当前是否在“选择方案”深度页面
  useEffect(() => {
    onStateChange?.(!!activeProduct);
  }, [activeProduct, onStateChange]);

  const categories = useMemo(() => {
    return ['all', ...ALL_PRESETS.map(g => g.label)];
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') {
      const featuredIds = ['chatgpt', 'claude', 'midjourney', 'deepseek-api', 'netflix', 'spotify'];
      const all = ALL_PRESETS.flatMap(g => g.products);
      return expanded ? all : all.filter(p => featuredIds.includes(p.id));
    }
    return ALL_PRESETS.find(g => g.label === selectedCategory)?.products || [];
  }, [selectedCategory, expanded]);

  const handleProductSelect = (product: PresetProduct, plan: PresetPlan | 'custom') => {
    onSelect(product, plan);
    setActiveProduct(null);
  };

  if (activeProduct) {
    return (
      <div className="p-4 bg-slate-50/80 rounded-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveProduct(null)}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600 shadow-sm border border-transparent hover:border-slate-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>
            <div className="flex items-center gap-2">
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-sm"
                style={{ backgroundColor: activeProduct.brandColor }}
              >
                {activeProduct.name.charAt(0)}
              </div>
              <span className="text-sm font-black text-slate-800 tracking-tight">{activeProduct.name}</span>
            </div>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded-full border border-slate-100">Select Plan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {activeProduct.plans.map((plan, idx) => (
            <button
              key={idx}
              onClick={() => handleProductSelect(activeProduct, plan)}
              className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
            >
              <div className="min-w-0 pr-2">
                <div className="text-[11px] font-black text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{plan.label}</div>
                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{plan.cycle}</div>
              </div>
              <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                {plan.cost}<span className="text-[8px] ml-0.5 opacity-60">{plan.currency}</span>
              </div>
            </button>
          ))}
          <button
            onClick={() => handleProductSelect(activeProduct, 'custom')}
            className="flex items-center justify-center p-3 bg-white rounded-xl border-2 border-dashed border-slate-100 hover:border-indigo-200 hover:text-indigo-600 transition-all text-[11px] font-black text-slate-400"
          >
            自定义金额
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
              selectedCategory === cat 
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
            }`}
          >
            {cat === 'all' ? '精选 / 全部' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            onClick={() => setActiveProduct(product)}
            className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 hover:shadow-sm transition-all text-left group"
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black shadow-sm group-hover:scale-105 transition-transform"
              style={{ backgroundColor: product.brandColor }}
            >
              {product.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-black text-slate-800 truncate leading-tight group-hover:text-indigo-600 transition-colors">{product.name}</div>
              <div className="text-[8px] text-slate-400 font-bold uppercase truncate mt-0.5">{product.category.split('/')[0]}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
