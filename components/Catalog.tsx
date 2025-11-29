
import React, { useState, useEffect } from 'react';
import { Product, Project } from '../types';
import { Search, Plus, Check, Minus, Building2, ShoppingCart, ArrowRight, Headphones, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface CatalogProps {
  products: Product[];
  categories: string[];
  activeProject: Project | null;
  onAddToQuote: (product: Product, quantity: number, cct: string, color: string) => void;
  onOpenCreateProject: () => void;
  onViewQuote?: () => void;
  onOpenSupport?: () => void;
}

export const Catalog: React.FC<CatalogProps> = ({ products, categories, activeProject, onAddToQuote, onOpenCreateProject, onViewQuote, onOpenSupport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('全部');
  
  // State for Support Button Feedback
  const [supportState, setSupportState] = useState<'idle' | 'loading' | 'success'>('idle');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '全部' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSupportClick = () => {
      if (supportState !== 'idle') return;
      
      setSupportState('loading');
      
      // Simulate connection delay for better UX feedback
      setTimeout(() => {
          onOpenSupport?.();
          setSupportState('success');
          
          // Keep success state for a while so user sees it, then reset
          setTimeout(() => {
              setSupportState('idle');
          }, 4000);
      }, 800);
  };

  // Combine '全部' with the dynamic categories
  const displayCategories = ['全部', ...categories];

  const cartTotal = activeProject ? activeProject.items.reduce((acc, item) => acc + (item.price * item.quantity), 0) : 0;
  const cartCount = activeProject ? activeProject.items.length : 0;

  return (
    <div className="h-full flex flex-col space-y-8 animate-fade-in pb-24 relative">
      
      {/* 流程引導與客服支援區塊 */}
      {activeProject && activeProject.status === '規劃中' && activeProject.items.length === 0 && (
          <div className="bg-gradient-to-r from-stone-50 to-white border border-stone-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in shadow-sm">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0 ring-4 ring-stone-100">
                      1
                  </div>
                  <div>
                      <h3 className="text-lg font-bold text-stone-800">專案「{activeProject.name}」已準備就緒</h3>
                      <p className="text-stone-600 text-sm mt-1">
                          請從下方選擇適合的燈具加入清單。<br className="hidden md:block"/>如果不確定該如何配置，可直接點擊右側按鈕請求 <span className="text-brand-bronze font-bold">人工協助</span>。
                      </p>
                  </div>
              </div>
              <button 
                 onClick={handleSupportClick}
                 disabled={supportState !== 'idle'}
                 className={`w-full md:w-auto px-6 py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all shadow-md transform active:scale-95
                    ${supportState === 'success' 
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-100' 
                        : supportState === 'loading'
                            ? 'bg-stone-700 text-stone-300 cursor-wait'
                            : 'bg-white text-stone-800 border border-stone-200 hover:border-brand-bronze hover:text-brand-bronze'}
                 `}
              >
                  {supportState === 'loading' ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>正在連線客服系統...</span>
                      </>
                  ) : supportState === 'success' ? (
                      <>
                        <CheckCircle size={20} className="text-white" />
                        <span className="font-bold">客服視窗已開啟 (右下角)</span>
                      </>
                  ) : (
                      <>
                        <Headphones size={20} />
                        <span>不知道怎麼選？聯繫客服代為配置</span>
                      </>
                  )}
              </button>
          </div>
      )}

      {/* Floating Action Button (FAB) - Bottom Right (保留作為備用) */}
      {activeProject && cartCount > 0 && (
          <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center animate-bounce-in pointer-events-none md:hidden">
              <button 
                  onClick={onViewQuote}
                  className="pointer-events-auto bg-stone-900 text-white pl-6 pr-2 py-3 rounded-full shadow-2xl shadow-stone-900/40 flex items-center gap-4 hover:scale-105 transition-transform border border-stone-700/50 backdrop-blur-sm"
              >
                  <div className="flex flex-col items-start">
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Step 2</span>
                      <span className="font-medium text-sm">下一步：查看估價單 ({cartCount})</span>
                  </div>
                  <div className="w-10 h-10 bg-brand-bronze rounded-full flex items-center justify-center text-white shadow-lg">
                      <ArrowRight size={20} />
                  </div>
              </button>
          </div>
      )}

      {/* Active Project Sticky Banner (Top) - 強化「下一步」按鈕 */}
      {activeProject ? (
          <div className="sticky top-16 md:top-0 z-30 bg-white/95 border-b border-stone-200 shadow-sm p-3 md:p-4 rounded-b-xl flex flex-wrap justify-between items-center backdrop-blur-md transition-all -mx-2 md:mx-0">
             <div className="flex items-center gap-3">
                 <div className="bg-brand-bronze text-white p-2 rounded-lg shadow-sm hidden sm:block">
                     <Building2 size={18} />
                 </div>
                 <div>
                     <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Current Project</p>
                     <h2 className="text-stone-800 font-bold text-sm md:text-base flex items-center gap-2">
                         {activeProject.name}
                         <span className="text-xs font-normal text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full hidden md:inline-block">規劃中</span>
                     </h2>
                 </div>
             </div>
             
             <div className="flex items-center gap-4 mt-2 md:mt-0 ml-auto">
                 {cartCount > 0 && (
                     <div className="text-right hidden sm:block mr-2">
                        <p className="text-xs text-stone-500">預估金額 Total</p>
                        <p className="font-mono font-bold text-stone-800">NT$ {cartTotal.toLocaleString()}</p>
                     </div>
                 )}
                 
                 {cartCount > 0 ? (
                     <button 
                        onClick={onViewQuote}
                        className="bg-brand-bronze text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-brand-bronzeDark transition-all flex items-center gap-2 shadow-lg shadow-brand-bronze/20 animate-pulse hover:animate-none scale-105"
                     >
                         <ShoppingCart size={18} />
                         <span>下一步：查看估價單 ({cartCount})</span>
                         <ArrowRight size={16} className="text-white/80" />
                     </button>
                 ) : (
                     <div className="flex items-center gap-2 text-stone-400 text-sm bg-stone-50 border border-stone-100 px-4 py-2 rounded-lg">
                         <ShoppingCart size={16} />
                         <span>請選擇商品加入清單</span>
                     </div>
                 )}
             </div>
          </div>
      ) : (
          <div className="sticky top-16 md:top-0 z-30 bg-red-50 border-l-4 border-red-400 shadow-sm p-4 rounded-r-xl flex justify-between items-center">
             <p className="text-red-500 font-medium text-sm flex items-center gap-2">
                 <AlertCircle size={18} />
                 注意：您尚未選擇專案。請先建立或選擇一個專案以開始加入估價單。
             </p>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-medium text-stone-800 tracking-tight">產品選樣 Catalog</h1>
          <p className="text-stone-500 mt-2 font-light">Japanese Quality, Professional Lighting Standards (CRI&gt;90).</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
          <button 
             onClick={onOpenCreateProject}
             className="w-full md:w-auto bg-white border border-stone-200 text-stone-600 hover:text-stone-900 px-5 py-3 rounded-full text-sm font-medium hover:bg-stone-50 transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
          >
             <Plus size={18} />
             新增其他專案
          </button>
          
          <div className="relative flex-1 md:w-72 w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" size={18} strokeWidth={1.5} />
            <input 
              type="text" 
              placeholder="搜尋型號或規格..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-stone-200 text-stone-800 pl-11 pr-4 py-3 rounded-full focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze transition-all placeholder:text-stone-400 text-sm shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {displayCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap tracking-wide
              ${categoryFilter === cat 
                ? 'bg-stone-800 text-white shadow-md' 
                : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-400 hover:text-stone-800'}
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
        {filteredProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAdd={onAddToQuote} 
            disabled={!activeProject}
          />
        ))}
      </div>
    </div>
  );
};

const ProductCard: React.FC<{ 
    product: Product, 
    onAdd: (p: Product, qty: number, cct: string, color: string) => void,
    disabled: boolean
}> = ({ product, onAdd, disabled }) => {
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [selectedCCT, setSelectedCCT] = useState(product.availableCCTs[0]);
  const [selectedColor, setSelectedColor] = useState(product.availableColors[0]);

  const handleAdd = () => {
    if (disabled) return;
    const qtyToAdd = quantity === '' ? 1 : quantity;
    onAdd(product, qtyToAdd, selectedCCT, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => {
        const current = prev === '' ? 0 : prev;
        return Math.max(1, current + delta);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
        setQuantity('');
    } else {
        const parsed = parseInt(val);
        if (!isNaN(parsed) && parsed > 0) {
            setQuantity(parsed);
        }
    }
  };

  const handleBlur = () => {
    if (quantity === '' || quantity < 1) {
        setQuantity(1);
    }
  };

  // Extract specs into an array to render safely
  const specEntries = Object.entries(product.specs || {});

  return (
    <div className={`bg-white border border-stone-100 rounded-2xl overflow-hidden flex flex-col transition-all duration-500 group 
        ${disabled ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-xl hover:shadow-stone-200/50 hover:-translate-y-1'}
    `}>
      <div className="relative h-64 overflow-hidden bg-stone-50">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
        />
        
        <div className="absolute top-4 left-4">
             <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-500 border border-stone-100 shadow-sm">
                {product.category}
             </span>
        </div>
        
        <div className="absolute bottom-4 right-4 flex gap-2 flex-wrap justify-end">
            {product.resources && product.resources.map(res => (
                <span key={res} className="bg-white/90 text-stone-600 border border-stone-200 px-2 py-1 rounded text-[10px] font-medium shadow-sm">
                    {res}
                </span>
            ))}
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-bold text-stone-800 text-lg truncate font-serif" title={product.name}>{product.name}</h3>
        
        {/* Dynamic Specs - Show top 6 based on Admin Sort */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-2 mt-6 mb-6 border-b border-stone-100 pb-4">
          {specEntries.slice(0, 6).map(([key, value]) => {
            // UGR Replacement Logic: If spec key is 'UGR', render it as '品號' with Product ID
            if (key === 'UGR') {
                return (
                    <SpecItem 
                        key={key} 
                        label="品號" 
                        value={product.id.toUpperCase()} 
                        highlight={true} 
                    />
                );
            }
            return (
                <SpecItem 
                    key={key} 
                    label={key} 
                    value={String(value)} 
                    highlight={key.toLowerCase().includes('cri')} 
                />
            );
          })}
        </div>

        {/* Configuration Area */}
        <div className="space-y-4 mb-6">
            {/* Color Temp Selection */}
            <div>
                <p className="text-[10px] text-stone-400 mb-2 uppercase tracking-widest font-bold">色溫 (CCT)</p>
                <div className="flex flex-wrap gap-2">
                    {product.availableCCTs.map(cct => (
                        <button
                            key={cct}
                            onClick={() => setSelectedCCT(cct)}
                            disabled={disabled}
                            className={`px-3 py-1 text-[11px] rounded border transition-all duration-300 font-medium
                                ${selectedCCT === cct 
                                    ? 'bg-brand-bronze text-white border-brand-bronze' 
                                    : 'text-stone-500 border-stone-200 hover:border-brand-bronze hover:text-brand-bronze bg-white'}`}
                        >
                            {cct}
                        </button>
                    ))}
                </div>
            </div>

            {/* Housing Color Selection */}
            <div>
                <p className="text-[10px] text-stone-400 mb-2 uppercase tracking-widest font-bold">外殼顏色</p>
                <div className="flex flex-wrap gap-2">
                    {product.availableColors.map(color => (
                        <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            disabled={disabled}
                            className={`px-3 py-1 text-[11px] rounded border transition-all duration-300 flex items-center gap-1.5 font-medium
                                ${selectedColor === color 
                                    ? 'bg-stone-100 text-stone-900 border-stone-300' 
                                    : 'text-stone-500 border-stone-200 hover:border-stone-400 bg-white'}`}
                        >
                            <span className={`w-2 h-2 rounded-full border border-stone-200
                                ${color.includes('黑') ? 'bg-stone-900' : 
                                  color.includes('白') ? 'bg-white' : 
                                  color.includes('金') ? 'bg-[#D6C6A6]' : 'bg-stone-400'}`}></span>
                            {color}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        
        {/* Footer: Price & Add */}
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-stone-100">
          <div>
            <div className="text-stone-800 font-medium font-mono text-lg">NT$ {product.price.toLocaleString()}</div>
          </div>
          
          <div className="flex items-center gap-2">
              {/* Qty Stepper & Manual Input */}
              <div className="flex items-center bg-white border border-stone-200 rounded-lg h-10 w-28 overflow-hidden shadow-sm hover:border-stone-300 transition-colors">
                  <button disabled={disabled} onClick={() => handleQuantityChange(-1)} className="px-2 text-stone-400 hover:text-stone-800 transition-colors h-full flex items-center justify-center">
                      <Minus size={14} />
                  </button>
                  <input 
                    type="number"
                    value={quantity}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    className="w-full h-full bg-transparent text-center text-stone-800 font-mono text-sm focus:outline-none border-none p-0"
                  />
                  <button disabled={disabled} onClick={() => handleQuantityChange(1)} className="px-2 text-stone-400 hover:text-stone-800 transition-colors h-full flex items-center justify-center">
                      <Plus size={14} />
                  </button>
              </div>

              <button 
                onClick={handleAdd}
                disabled={disabled}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 shadow-md
                    ${added 
                        ? 'bg-emerald-500 text-white' 
                        : disabled 
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : 'bg-brand-bronze text-white hover:bg-[#958059] hover:shadow-lg'
                    }`}
                title={disabled ? "請先選擇專案" : "加入估價單"}
              >
                {added ? <Check size={20} /> : <Plus size={20} />}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SpecItem: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div>
    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-1 truncate" title={label}>{label}</p>
    <p className={`text-sm font-medium ${highlight ? 'text-brand-bronze' : 'text-stone-700'}`}>{value}</p>
  </div>
);
