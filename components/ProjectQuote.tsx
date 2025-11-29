
import React, { useState } from 'react';
import { Project } from '../types';
import { Trash2, Plus, Minus, Wand2, Loader2, Copy, Check, Building2, Send, Undo2, ArrowRight, CreditCard, Lock, FilePlus2 } from 'lucide-react';
import { generateProjectProposal } from '../services/geminiService';

interface ProjectQuoteProps {
  items: Project['items'];
  activeProject: Project | null;
  onUpdateProjectName: (name: string) => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onSubmitForReview: (projectName: string) => void;
  onRecallQuote: () => void;
  onCreateAddon?: () => void; // New prop for creating Add-on Order
}

export const ProjectQuote: React.FC<ProjectQuoteProps> = ({ 
  items, 
  activeProject,
  onUpdateProjectName, 
  onUpdateQuantity, 
  onRemoveItem,
  onSubmitForReview,
  onRecallQuote,
  onCreateAddon
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleGenerateProposal = async () => {
    if (items.length === 0) return;
    setIsGenerating(true);
    // Pass project info to AI service
    const text = await generateProjectProposal(items, activeProject?.name);
    setProposal(text);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitClick = () => {
    if (!activeProject) return;

    if (confirmStep) {
        // Step 2: Actually submit
        setIsSubmitting(true);
        setTimeout(() => {
            onSubmitForReview(activeProject.name);
            setIsSubmitting(false);
            setConfirmStep(false);
        }, 800);
    } else {
        // Step 1: Ask for confirmation
        setConfirmStep(true);
        // Reset after 3 seconds if not confirmed
        setTimeout(() => setConfirmStep(false), 3000);
    }
  };

  if (!activeProject) {
      return (
          <div className="h-full flex items-center justify-center flex-col text-stone-400">
              <Building2 size={48} strokeWidth={1} className="mb-4" />
              <p>請先至「儀表板」選擇一個專案以檢視估價單。</p>
          </div>
      )
  }

  // Determine if quote is locked based on strict workflow
  const isLocked = activeProject.status !== '規劃中';

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in pb-4">
      
      {/* 流程引導：步驟 2 */}
      {activeProject.status === '規劃中' && items.length > 0 && (
           <div className="bg-stone-50 border border-stone-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-stone-800 font-bold text-xl shadow-sm border border-stone-200">
                       2
                   </div>
                   <div>
                       <h3 className="text-lg font-bold text-stone-800">最後確認階段</h3>
                       <p className="text-stone-600 text-sm">請核對下方數量，確認無誤後請點擊右下角按鈕提交客服。</p>
                   </div>
               </div>
               <div className="hidden md:block">
                   <div className="flex items-center gap-2 text-stone-400 text-sm">
                       <span>選購完成</span> <ArrowRight size={16}/> <span className="text-stone-800 font-bold">確認清單</span> <ArrowRight size={16}/> <span>客服審核</span>
                   </div>
               </div>
           </div>
      )}

      {activeProject.status === '等待付款' && (
           <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
               <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-xl shadow-sm border border-blue-200">
                       <CreditCard size={24} />
                   </div>
                   <div>
                       <h3 className="text-lg font-bold text-blue-900">報價已確認，請進行付款</h3>
                       <p className="text-blue-700 text-sm">客服已完成估價單審核。請點擊上方專案名稱進入專案詳情頁進行付款。</p>
                   </div>
               </div>
           </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden min-h-0">
        {/* Left: Cart Items & Project Info */}
        <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
            <div className="flex justify-between items-end flex-shrink-0">
                <h2 className="text-3xl font-serif font-medium text-stone-800">專案估價單</h2>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border 
                    ${activeProject.status === '估價審核中' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    activeProject.status === '等待付款' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                    activeProject.status === '已付款' || activeProject.status === '已出貨' ? 'bg-stone-100 text-stone-600 border-stone-200' :
                    'bg-stone-100 text-stone-500 border-stone-200'}`}>
                    狀態：{activeProject.status}
                </div>
            </div>
            
            {/* Project Information Inputs */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2 mb-5 text-brand-bronze font-medium border-b border-stone-100 pb-3">
                <Building2 size={20} strokeWidth={1.5} />
                <h3 className="font-serif">案場基本資料</h3>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 ml-1 uppercase tracking-widest">專案名稱</label>
                <div className="relative">
                <input 
                    type="text" 
                    value={activeProject.name}
                    onChange={(e) => onUpdateProjectName(e.target.value)}
                    disabled={isLocked}
                    placeholder="例：信義區陳公館"
                    className="w-full bg-white border border-stone-200 text-stone-800 px-5 py-3 rounded-xl focus:ring-1 focus:ring-brand-bronze focus:border-brand-bronze outline-none transition-all placeholder:text-stone-400 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                />
                </div>
                <p className="text-[10px] text-stone-400 pl-1 mt-1">
                * 此名稱將同步顯示於客服系統，方便與專員核對細節。
                </p>
            </div>
            </div>

            {items.length === 0 ? (
            <div className="flex-1 bg-stone-50 border border-stone-200 border-dashed rounded-2xl flex flex-col items-center justify-center text-stone-400 p-10 min-h-[300px]">
                <p className="font-medium">目前估價單是空的</p>
                <p className="text-sm mt-2 font-light">請至「產品選樣」挑選燈具並指定規格。</p>
            </div>
            ) : (
            <div className="flex-1 bg-white border border-stone-200 rounded-2xl overflow-hidden flex flex-col shadow-sm min-h-0">
                <div className="overflow-y-auto flex-1 p-6 space-y-4">
                {items.map((item, index) => (
                    <div key={`${item.id}-${index}-${item.selectedCCT}-${item.selectedColor}`} className="bg-stone-50 border border-stone-100 rounded-xl p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center group hover:border-stone-300 transition-all hover:shadow-md duration-300">
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-white shadow-sm flex-shrink-0" />
                        <div className="sm:hidden flex-1">
                            <h4 className="font-bold text-stone-800 text-sm line-clamp-1">{item.name}</h4>
                            <div className="flex gap-2 text-xs text-stone-500 mt-1">
                                <span className="bg-white px-2 py-1 rounded border border-stone-200">{item.selectedCCT}</span>
                                <span className="bg-white px-2 py-1 rounded border border-stone-200">{item.selectedColor}</span>
                            </div>
                            <div className="text-brand-bronze font-mono text-sm mt-1">NT$ {item.price.toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full sm:w-auto hidden sm:block">
                        <h4 className="font-medium text-stone-800 text-sm font-serif">{item.name}</h4>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-stone-400 border-r border-stone-300 pr-4 uppercase tracking-wide">{item.category}</span>
                            <div className="flex gap-2">
                                <span className="text-xs text-brand-bronze bg-brand-bronze/10 px-2 py-0.5 rounded border border-brand-bronze/20">
                                    {item.selectedCCT}
                                </span>
                                <span className="text-xs text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                                    {item.selectedColor}
                                </span>
                            </div>
                        </div>
                        <div className="text-stone-500 text-xs mt-1 font-mono">NT$ {item.price.toLocaleString()}</div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                        <div className="flex items-center bg-white rounded-lg border border-stone-200 shadow-sm">
                        <button disabled={isLocked} onClick={() => onUpdateQuantity(index, -1)} className="p-2.5 hover:text-stone-800 text-stone-400 hover:bg-stone-50 rounded-l-lg transition-colors disabled:opacity-50"><Minus size={14} /></button>
                        <span className="w-8 text-center text-sm font-medium text-stone-800">{item.quantity}</span>
                        <button disabled={isLocked} onClick={() => onUpdateQuantity(index, 1)} className="p-2.5 hover:text-stone-800 text-stone-400 hover:bg-stone-50 rounded-r-lg transition-colors disabled:opacity-50"><Plus size={14} /></button>
                        </div>
                        <div className="text-right min-w-[90px] hidden sm:block">
                            <span className="text-stone-800 font-bold font-mono">NT$ {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                        {!isLocked && (
                            <button onClick={() => onRemoveItem(index)} className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                    </div>
                ))}
                </div>
                <div className="p-8 bg-stone-50/50 border-t border-stone-100 flex-shrink-0">
                <div className="flex justify-between items-end mb-6">
                    <span className="text-stone-500 text-sm font-medium">總計金額 (未稅)</span>
                    <span className="text-3xl font-light text-stone-800">NT$ {totalAmount.toLocaleString()}</span>
                </div>
                
                {isLocked ? (
                    <div className="flex flex-col gap-3">
                        <div className={`w-full py-4 rounded-xl font-medium text-center flex items-center justify-center gap-2 border cursor-not-allowed
                            ${activeProject.status === '等待付款' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-stone-100 text-stone-500 border-stone-200'}
                        `}>
                            <Lock size={18} />
                            {activeProject.status === '等待付款' 
                                ? '報價單已鎖定 (請至專案詳情頁付款)' 
                                : activeProject.status === '已付款' || activeProject.status === '已出貨'
                                ? '訂單已確認，專案進行中'
                                : '估價單審核中 (請等待客服確認)'}
                        </div>
                        
                        {/* New Feature: Allow user to recall quote OR create add-on if locked */}
                        {activeProject.status === '估價審核中' && (
                            <button 
                                onClick={onRecallQuote}
                                className="text-stone-400 hover:text-stone-600 text-xs text-center hover:underline flex items-center justify-center gap-1 transition-colors"
                            >
                                <Undo2 size={12} />
                                撤回審核申請 (我要修改內容)
                            </button>
                        )}

                        {/* New Feature: Create Add-on when locked */}
                        {['已付款', '已出貨', '已完工', '等待付款'].includes(activeProject.status) && onCreateAddon && (
                            <button 
                                onClick={onCreateAddon}
                                className="w-full py-3 rounded-xl font-bold bg-white border-2 border-stone-200 text-stone-600 hover:border-brand-bronze hover:text-brand-bronze transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <FilePlus2 size={18} />
                                為此案建立追加單 (Create Add-on Order)
                            </button>
                        )}
                    </div>
                ) : (
                    <button 
                        onClick={handleSubmitClick}
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-xl font-medium transition-all shadow-lg tracking-wide flex items-center justify-center gap-2
                            ${confirmStep 
                                ? 'bg-brand-bronze text-white hover:bg-brand-bronzeDark shadow-brand-bronze/20 scale-105' 
                                : 'bg-stone-900 text-white hover:bg-stone-700 shadow-stone-300'
                            }
                        `}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (confirmStep ? <Check size={18}/> : <Send size={18} />)}
                        {confirmStep ? '確定提交？ (提交後將自動打開客服窗)' : '提交客服審核 (步驟 3/3)'}
                    </button>
                )}
                </div>
            </div>
            )}
        </div>

        {/* Right: AI Proposal */}
        <div className="w-full lg:w-1/3 flex flex-col h-full lg:mt-0">
            <div className="bg-white border border-stone-200 rounded-2xl p-8 flex flex-col h-full shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <div className="bg-brand-bronze/10 p-2.5 rounded-lg">
                    <Wand2 className="text-brand-bronze" size={22} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-serif font-medium text-stone-800">AI 智慧提案生成</h3>
            </div>
            <p className="text-sm text-stone-500 mb-8 leading-relaxed font-light flex-shrink-0">
                AI 將根據您填寫的「{activeProject.name}」與選購燈具，自動撰寫一份強調光影氛圍與專業規格的照明設計提案。
            </p>
            
            <button 
                onClick={handleGenerateProposal}
                disabled={isGenerating || items.length === 0}
                className="w-full bg-brand-bronze hover:bg-brand-bronzeDark disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-bronze/20 mb-6 flex-shrink-0"
            >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                {isGenerating ? 'AI 正在撰寫中...' : '生成設計提案'}
            </button>

            {proposal ? (
                <div className="flex-1 flex flex-col bg-stone-50 border border-stone-100 rounded-xl p-6 relative min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto text-sm text-stone-700 leading-relaxed whitespace-pre-wrap font-serif custom-scrollbar">
                    {proposal}
                </div>
                <button 
                    onClick={handleCopy}
                    className="absolute top-3 right-3 p-2 bg-white text-stone-400 hover:text-stone-800 rounded-md border border-stone-200 transition-colors shadow-sm"
                    title="複製文案"
                >
                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-stone-400 text-xs italic border border-dashed border-stone-200 rounded-xl bg-stone-50/50 min-h-[200px]">
                    {items.length > 0 ? '點擊上方按鈕開始生成' : '請先加入商品至估價單'}
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};
