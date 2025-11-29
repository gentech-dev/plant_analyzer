
import React, { useState } from 'react';
import { ChatSession, AIAnalysisResult, Project, Product, GlobalAIInsight } from '../../types';
import { analyzeChatSession, generateGlobalInsight } from '../../services/analysisService';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { 
    BrainCircuit, Search, BarChart3, TrendingUp, AlertTriangle, 
    CheckCircle, MessageSquare, RefreshCcw, ThumbsUp, ThumbsDown, 
    Target, Lightbulb, User, Building2, Calendar, FileText,
    Globe, Package, ArrowRight, Activity, Zap
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AIAnalyticsProps {
    chatSessions: ChatSession[];
    projects?: Project[]; // Optional for backward compat, but needed for Global
    products?: Product[]; // Optional for backward compat, but needed for Global
}

export const AIAnalytics: React.FC<AIAnalyticsProps> = ({ chatSessions, projects = [], products = [] }) => {
    const [activeTab, setActiveTab] = useState<'individual' | 'global'>('individual');
    
    // Individual State
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Global State
    const [globalInsight, setGlobalInsight] = useState<GlobalAIInsight | null>(null);
    const [isGlobalAnalyzing, setIsGlobalAnalyzing] = useState(false);

    // Derived Data (Individual)
    const selectedSession = chatSessions.find(s => s.userId === selectedSessionId);
    const filteredSessions = chatSessions
        .filter(s => s.userName.toLowerCase().includes(searchTerm.toLowerCase()) || s.company?.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (a.analysis && !b.analysis) return -1;
            if (!a.analysis && b.analysis) return 1;
            return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        });

    // Individual Handler
    const handleAnalyze = async () => {
        if (!selectedSession || isAnalyzing) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzeChatSession(selectedSession);
            if (db) {
                const chatRef = doc(db, "chats", selectedSession.userId);
                await updateDoc(chatRef, { analysis: result });
            }
        } catch (error) {
            console.error("Error saving analysis:", error);
            alert("分析儲存失敗");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Global Handler
    const handleGlobalAnalyze = async () => {
        setIsGlobalAnalyzing(true);
        try {
            const result = await generateGlobalInsight(projects, products, chatSessions);
            setGlobalInsight(result);
        } catch (error) {
            console.error(error);
            alert("全域分析生成失敗");
        } finally {
            setIsGlobalAnalyzing(false);
        }
    };

    const getSentimentColor = (score: number) => {
        if (score >= 80) return '#10b981';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    };

    const sentimentData = selectedSession?.analysis ? [
        { name: 'Score', value: selectedSession.analysis.sentimentScore },
        { name: 'Remaining', value: 100 - selectedSession.analysis.sentimentScore }
    ] : [];

    return (
        <div className="flex flex-col h-full bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden relative shadow-sm">
            
            {/* Header Tabs */}
            <div className="bg-white border-b border-stone-200 px-6 py-3 flex gap-4 shrink-0">
                <button 
                    onClick={() => setActiveTab('individual')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                        ${activeTab === 'individual' ? 'bg-purple-50 text-purple-700' : 'text-stone-500 hover:bg-stone-50'}
                    `}
                >
                    <User size={16}/> 個別客戶分析
                </button>
                <button 
                    onClick={() => setActiveTab('global')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                        ${activeTab === 'global' ? 'bg-stone-800 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}
                    `}
                >
                    <Globe size={16}/> 全域營運洞察
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* === INDIVIDUAL VIEW === */}
                {activeTab === 'individual' && (
                    <>
                        {/* Sidebar */}
                        <div className="w-80 border-r border-stone-200 flex flex-col shrink-0 bg-white">
                            <div className="p-4 border-b border-stone-100">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14}/>
                                    <input 
                                        type="text" 
                                        placeholder="搜尋客戶..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:border-purple-500 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {filteredSessions.map((session) => (
                                    <div 
                                        key={session.userId} 
                                        onClick={() => setSelectedSessionId(session.userId)}
                                        className={`p-3 rounded-xl cursor-pointer transition-all border flex flex-col gap-2
                                            ${selectedSessionId === session.userId 
                                                ? 'bg-purple-50 border-purple-200 shadow-sm' 
                                                : 'bg-white border-transparent hover:bg-stone-50 hover:border-stone-200'}
                                        `}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className={`font-bold text-sm ${selectedSessionId === session.userId ? 'text-purple-900' : 'text-stone-700'}`}>
                                                {session.userName}
                                            </span>
                                            {session.analysis ? (
                                                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">已分析</span>
                                            ) : (
                                                <span className="text-[10px] bg-stone-100 text-stone-400 px-2 py-0.5 rounded">未分析</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-stone-500">
                                            <span>{session.company || '個人用戶'}</span>
                                            <span>{new Date(session.lastUpdated).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Report Area */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-10">
                            {selectedSession ? (
                                <div className="max-w-4xl mx-auto space-y-8">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
                                                {selectedSession.userName} <span className="text-stone-400 font-sans font-light text-lg">的分析報告</span>
                                            </h1>
                                            <p className="text-stone-500 text-sm mt-1 flex items-center gap-4">
                                                <span className="flex items-center gap-1"><Building2 size={12}/> {selectedSession.company || 'N/A'}</span>
                                                {selectedSession.analysis && (
                                                    <span className="flex items-center gap-1"><Calendar size={12}/> 分析時間：{new Date(selectedSession.analysis.analyzedAt).toLocaleString()}</span>
                                                )}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handleAnalyze}
                                            disabled={isAnalyzing}
                                            className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-70 transition-all flex items-center gap-2"
                                        >
                                            {isAnalyzing ? <RefreshCcw className="animate-spin" size={16}/> : <BrainCircuit size={16}/>}
                                            {selectedSession.analysis ? '重新分析' : '開始 AI 分析'}
                                        </button>
                                    </div>

                                    {selectedSession.analysis ? (
                                        <div className="animate-fade-in space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                                                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest absolute top-6 left-6">情緒指數</h3>
                                                    <div className="w-full h-40 relative mt-4">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie data={sentimentData} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={80} paddingAngle={0} dataKey="value">
                                                                    <Cell fill={getSentimentColor(selectedSession.analysis.sentimentScore)} />
                                                                    <Cell fill="#f3f4f6" />
                                                                </Pie>
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pointer-events-none">
                                                            <span className="text-4xl font-bold text-stone-800">{selectedSession.analysis.sentimentScore}</span>
                                                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded mt-1 ${selectedSession.analysis.sentimentLabel === 'positive' ? 'bg-emerald-100 text-emerald-700' : selectedSession.analysis.sentimentLabel === 'negative' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                {selectedSession.analysis.sentimentLabel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                                                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-3 flex items-center gap-2"><FileText size={16}/> 對話摘要</h3>
                                                    <p className="text-stone-700 leading-relaxed text-sm bg-stone-50 p-4 rounded-xl border border-stone-100">{selectedSession.analysis.summary}</p>
                                                    <div className="mt-4 flex gap-2 flex-wrap">
                                                        {selectedSession.analysis.productPreferences.map((pref, idx) => (
                                                            <span key={idx} className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100 font-medium">{pref}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                                                    <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2"><AlertTriangle size={16}/> 客戶痛點</h3>
                                                    <ul className="space-y-3">{selectedSession.analysis.painPoints.map((point, idx) => <li key={idx} className="flex items-start gap-2 text-sm text-stone-700"><span className="text-red-400 mt-0.5">•</span> {point}</li>)}</ul>
                                                </div>
                                                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                                                    <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Target size={16}/> 銷售機會</h3>
                                                    <ul className="space-y-3">{selectedSession.analysis.salesOpportunities.map((opp, idx) => <li key={idx} className="flex items-start gap-2 text-sm text-stone-700"><CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0"/> {opp}</li>)}</ul>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-purple-100 shadow-sm">
                                                <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-widest mb-4 flex items-center gap-2"><Lightbulb size={16}/> 客服教練建議</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{selectedSession.analysis.coachTips.map((tip, idx) => <div key={idx} className="bg-white/60 p-3 rounded-xl border border-white shadow-sm text-sm text-indigo-900 flex gap-3"><div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 font-bold text-xs">{idx + 1}</div>{tip}</div>)}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-stone-400 border-2 border-dashed border-stone-200 rounded-2xl">
                                            <BrainCircuit size={48} className="mb-4 text-stone-300"/>
                                            <p className="font-medium text-stone-500">此對話尚未進行 AI 分析</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-stone-300">
                                    <BrainCircuit size={64} className="mb-6 opacity-20"/>
                                    <p className="text-lg font-bold text-stone-400">請從左側選擇客戶</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* === GLOBAL VIEW === */}
                {activeTab === 'global' && (
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                        <div className="max-w-6xl mx-auto space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div>
                                    <h1 className="text-3xl font-serif font-bold text-stone-800 flex items-center gap-3">
                                        <Globe className="text-stone-800" size={32} strokeWidth={1.5} />
                                        全域營運洞察 (Global Strategy)
                                    </h1>
                                    <p className="text-stone-500 mt-2">
                                        彙整 {projects.length} 個專案與 {chatSessions.length} 場對話紀錄，由 AI 提供的供應鏈與市場策略。
                                    </p>
                                </div>
                                <button 
                                    onClick={handleGlobalAnalyze}
                                    disabled={isGlobalAnalyzing}
                                    className="bg-stone-900 text-white px-6 py-4 rounded-xl font-bold shadow-xl hover:bg-stone-700 disabled:opacity-70 transition-all flex items-center gap-3"
                                >
                                    {isGlobalAnalyzing ? <RefreshCcw className="animate-spin" size={20}/> : <BrainCircuit size={20}/>}
                                    {globalInsight ? '更新全域報告' : '生成全域策略報告'}
                                </button>
                            </div>

                            {globalInsight ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                                    
                                    {/* 1. Market Trends */}
                                    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm lg:col-span-2">
                                        <h3 className="text-lg font-serif font-bold text-stone-800 mb-6 flex items-center gap-2">
                                            <TrendingUp className="text-brand-bronze"/> 市場趨勢訊號 (Market Signals)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <TrendCard title="熱門色溫" items={globalInsight.marketTrends.popularCCTs} icon={Activity} />
                                            <TrendCard title="流行燈殼色" items={globalInsight.marketTrends.popularColors} icon={Package} />
                                            <TrendCard title="竄升產品" items={globalInsight.marketTrends.risingProducts} icon={Zap} highlight />
                                        </div>
                                    </div>

                                    {/* 2. Inventory Advice */}
                                    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col">
                                        <h3 className="text-lg font-serif font-bold text-stone-800 mb-6 flex items-center gap-2">
                                            <Package className="text-blue-600"/> AI 智慧補貨建議
                                        </h3>
                                        <div className="flex-1 space-y-4">
                                            {globalInsight.inventoryAdvice.length > 0 ? (
                                                globalInsight.inventoryAdvice.map((item, idx) => (
                                                    <div key={idx} className="p-4 bg-stone-50 rounded-xl border border-stone-100 flex justify-between items-center group hover:border-blue-200 transition-colors">
                                                        <div>
                                                            <div className="font-bold text-stone-800">{item.productName}</div>
                                                            <div className="text-xs text-stone-500 mt-1">{item.reason}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[10px] text-stone-400 uppercase font-bold">建議補貨</div>
                                                            <div className="text-xl font-mono font-bold text-blue-600">{item.suggestedRestock}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="h-40 flex items-center justify-center text-stone-400 text-sm italic">目前庫存健康，無緊急補貨建議</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Complaint Summary */}
                                    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col">
                                        <h3 className="text-lg font-serif font-bold text-stone-800 mb-6 flex items-center gap-2">
                                            <AlertTriangle className="text-red-500"/> 客訴議題熱點
                                        </h3>
                                        <div className="flex-1 space-y-4">
                                            {globalInsight.complaintSummary.length > 0 ? (
                                                globalInsight.complaintSummary.map((issue, idx) => (
                                                    <div key={idx} className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                                                        <div className="flex justify-between mb-2">
                                                            <span className="font-bold text-red-900">{issue.issue}</span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase
                                                                ${issue.frequency === 'high' ? 'bg-red-500 text-white' : issue.frequency === 'medium' ? 'bg-orange-400 text-white' : 'bg-stone-300 text-white'}
                                                            `}>{issue.frequency} FREQUENCY</span>
                                                        </div>
                                                        <p className="text-sm text-red-800 leading-relaxed">{issue.suggestion}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="h-40 flex items-center justify-center text-stone-400 text-sm italic">近期無顯著客訴熱點</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 4. Strategic Advice */}
                                    <div className="lg:col-span-2 bg-stone-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-bronze/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-serif font-bold mb-4 text-brand-bronze flex items-center gap-2">
                                                <Lightbulb size={24}/> COO 總體策略建議
                                            </h3>
                                            <p className="text-lg leading-relaxed font-light text-stone-200">
                                                {globalInsight.strategicAdvice}
                                            </p>
                                            <div className="mt-6 pt-6 border-t border-white/10 text-xs text-stone-500 flex justify-between">
                                                <span>AI Model: Gemini 2.5 Flash</span>
                                                <span>Analyzed At: {new Date(globalInsight.analyzedAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 text-stone-400 border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50/50">
                                    <Globe size={64} className="mb-6 opacity-20"/>
                                    <p className="text-xl font-serif font-bold text-stone-500">準備好進行全域分析了嗎？</p>
                                    <p className="text-sm mt-2 max-w-md text-center">AI 將掃描所有銷售紀錄與對話，為您生成庫存與市場策略報告。</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

const TrendCard = ({ title, items, icon: Icon, highlight }: any) => (
    <div className={`p-5 rounded-2xl border flex flex-col h-full ${highlight ? 'bg-amber-50 border-amber-200' : 'bg-stone-50 border-stone-100'}`}>
        <div className="flex items-center gap-2 mb-4 text-stone-500 text-xs font-bold uppercase tracking-widest">
            <Icon size={14} /> {title}
        </div>
        <div className="flex flex-wrap gap-2 mt-auto">
            {items.map((item: string, i: number) => (
                <span key={i} className={`text-sm px-3 py-1.5 rounded-lg font-bold shadow-sm ${highlight ? 'bg-white text-amber-800' : 'bg-white text-stone-700'}`}>
                    