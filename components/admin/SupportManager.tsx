
import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, Project, Product, Attachment, ProjectFile, Annotation, QuoteItem } from '../../types';
import { 
    ChevronDown, MessageSquare, Package, Image as ImageIcon, Send, Paperclip, 
    X, Search, FileText, User, Building2, DollarSign, PenTool, 
    Loader2, Briefcase, Eye, Download, CheckCircle, Zap, 
    ClipboardList, StickyNote, Box, Plus, Trash2, CloudUpload, LayoutGrid,
    CreditCard, Truck
} from 'lucide-react';
import { uploadFile } from '../../firebase';
import { Whiteboard } from '../Whiteboard';
import { ImagePreviewModal } from '../ImagePreviewModal';

interface SupportManagerProps {
  chatSessions: ChatSession[];
  onReply: (userId: string, text: string, attachments?: Attachment[]) => void;
  onRead: (userId: string) => void;
  projects: Project[];
  onUpdateQuote: (projectId: string, action: 'add' | 'remove', item?: any, index?: number) => void;
  onUpdateStatus: (projectId: string, status: Project['status']) => void;
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onClearAnnotations: (fileId: string) => void;
  allProducts: Product[];
  onCreateProject: (targetUserId: string, newProjectData: Partial<Project>) => Promise<string>;
  onConfirmPayment?: (projectId: string) => void; // New prop
}

// Initial Quick Replies Data
const INITIAL_QUICK_REPLIES = [
    "您好，很高興為您服務！請問有什麼可以幫您的？",
    "收到，我們正在為您確認庫存狀況，請稍候。",
    "您的款項已確認，我們將盡快安排備貨與出貨。",
    "請問您方便提供現場的平面圖或照片嗎？這樣我們能更精準建議。",
    "關於這個空間的照明，我建議可以使用 3000K 色溫來營造氛圍。",
    "好的，我已經幫您更新了估價單內容，請您刷新頁面確認。"
];

export const SupportManager: React.FC<SupportManagerProps> = ({ 
    chatSessions, onReply, onRead, projects, 
    onUpdateQuote, onUpdateStatus, annotations, onAddAnnotation, onClearAnnotations,
    allProducts, onCreateProject, onConfirmPayment
}) => {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [replyText, setReplyText] = useState('');
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    
    // UI States
    const [rightPanelTab, setRightPanelTab] = useState<'info' | 'quote' | 'files'>('info');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    
    // Feature States
    const [quickReplies, setQuickReplies] = useState<string[]>(INITIAL_QUICK_REPLIES);
    const [newReplyText, setNewReplyText] = useState(''); // For adding new quick reply
    const [activeWhiteboardFile, setActiveWhiteboardFile] = useState<ProjectFile | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [internalNote, setInternalNote] = useState('');
    
    // Create Project State
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    
    // Upload States
    const [isUploading, setIsUploading] = useState(false);
    const [isQuoteUploading, setIsQuoteUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const quoteFileInputRef = useRef<HTMLInputElement>(null);

    // Derived Data
    const selectedSession = chatSessions.find((s: any) => s.userId === selectedUserId);
    
    // Filter sessions
    const filteredSessions = chatSessions
        .filter(s => s.userName.toLowerCase().includes(searchTerm.toLowerCase()) || s.company?.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    const userProjects = projects.filter((p: Project) => p.userId === selectedUserId);
    const activeProject = projects.find((p: Project) => p.id === activeProjectId) || null;
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-select most relevant project
    useEffect(() => {
        if (selectedUserId && userProjects.length > 0) {
            // If activeProjectId is already set and valid for this user, keep it.
            // Otherwise, select the most relevant one.
            const currentIsValid = userProjects.some(p => p.id === activeProjectId);
            
            if (!currentIsValid || !activeProjectId) {
                // Prioritize '估價審核中' > '規劃中' > Most Recent
                const reviewing = userProjects.find((p: Project) => p.status === '估價審核中');
                const waitingPayment = userProjects.find((p: Project) => p.status === '等待付款');
                const paid = userProjects.find((p: Project) => p.status === '已付款');
                const planning = userProjects.find((p: Project) => p.status === '規劃中');
                
                if (waitingPayment) setActiveProjectId(waitingPayment.id);
                else if (paid) setActiveProjectId(paid.id);
                else if (reviewing) setActiveProjectId(reviewing.id);
                else if (planning) setActiveProjectId(planning.id);
                else setActiveProjectId(userProjects[0].id);
            }
        } else {
            setActiveProjectId(null);
        }
    }, [selectedUserId, userProjects.length]); // Added userProjects.length to re-trigger when new project added

    // Scroll to bottom
    useEffect(() => {
        if (selectedSession) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedSession?.messages.length, selectedUserId]);

    const handleSend = (text: string = replyText, attachments: Attachment[] = []) => {
        if (!selectedUserId || (!text.trim() && attachments.length === 0)) return;
        onReply(selectedUserId, text, attachments);
        setReplyText('');
        setShowQuickReplies(false);
    };

    // --- Quick Reply Management ---
    const handleAddQuickReply = () => {
        if (newReplyText.trim()) {
            setQuickReplies([...quickReplies, newReplyText.trim()]);
            setNewReplyText('');
        }
    };

    const handleDeleteQuickReply = (index: number) => {
        setQuickReplies(prev => prev.filter((_, i) => i !== index));
    };

    // --- File Uploads ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0 && selectedUserId) {
            setIsUploading(true);
            try {
                const newAttachmentsPromises = Array.from(files).map(async (file: File) => {
                    const url = await uploadFile(file, 'chat-attachments');
                    return {
                        id: `att-${Date.now()}-${Math.random()}`,
                        type: file.type.startsWith('image/') ? 'image' : 'file',
                        name: file.name,
                        url: url,
                        size: (file.size / 1024).toFixed(1) + ' KB'
                    } as Attachment;
                });
                
                const newAttachments = await Promise.all(newAttachmentsPromises);
                handleSend("", newAttachments);
            } catch (error) {
                console.error("Upload failed", error);
                alert("檔案上傳失敗");
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    // --- Quote PDF Upload ---
    const handleQuoteUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && selectedUserId && activeProject) {
            setIsQuoteUploading(true);
            try {
                const url = await uploadFile(file, 'quotes');
                // Create a special attachment for the quote
                const attachment: Attachment = {
                    id: `quote-${Date.now()}`,
                    type: 'file',
                    name: `正式報價單_${activeProject.name}.pdf`,
                    url: url,
                    size: (file.size / 1024).toFixed(1) + ' KB'
                };
                
                // Send specific message
                handleSend(`[系統通知] 專案「${activeProject.name}」的正式報價單已上傳，請點擊下載查閱。`, [attachment]);
                
            } catch (error) {
                console.error("Quote upload failed", error);
                alert("報價單上傳失敗，請重試。");
            } finally {
                setIsQuoteUploading(false);
                if (quoteFileInputRef.current) quoteFileInputRef.current.value = '';
            }
        }
    };

    const handleConfirmQuote = () => {
        if (!activeProjectId) return;
        if(confirm('確認估價單無誤，並發送付款通知給設計師？')) {
            onUpdateStatus(activeProjectId, '等待付款');
            handleSend(`[系統通知] 您的估價單已審核通過。請您至專案頁面確認金額並查看匯款資訊，謝謝。`);
        }
    };

    const handlePaymentReceived = () => {
        if (!activeProjectId || !onConfirmPayment) return;
        if(confirm('確認已收到款項？系統將通知客戶並更新狀態為「已付款」。')) {
            onConfirmPayment(activeProjectId);
        }
    };

    const handleArrangeShipment = () => {
        if (!activeProjectId) return;
        if(confirm('確認商品已備齊並安排出貨？')) {
            onUpdateStatus(activeProjectId, '已出貨');
            handleSend(`[系統通知] 您的專案「${activeProject?.name}」已安排出貨，商品將盡快送達。`);
        }
    };

    const handleAddProductToQuote = (product: Product) => {
        if (!activeProjectId) { alert("請先從右側選擇一個專案"); return; }
        onUpdateQuote(activeProjectId, 'add', product);
        handleSend(`[系統訊息] 我已將「${product.name}」加入您的專案「${activeProject?.name}」估價單中。`);
        setIsProductModalOpen(false);
        setRightPanelTab('quote'); // Auto switch to quote tab
    };

    const handleRecommendProduct = (product: Product) => {
        handleSend(`推薦您參考這款產品：\n${product.name}\n${Object.entries(product.specs).slice(0,3).map(([k,v]) => `${k}: ${v}`).join(', ')}`);
        setIsProductModalOpen(false);
    };

    const handleCreateProjectSubmit = async () => {
        if (!selectedUserId || !newProjectName.trim()) return;
        
        try {
            const newId = await onCreateProject(selectedUserId, {
                name: newProjectName,
                client: selectedSession?.userName || 'Client',
                budget: 0
            });
            setActiveProjectId(newId);
            setIsCreateProjectOpen(false);
            setNewProjectName('');
        } catch (error) {
            console.error("Failed to create project", error);
            alert("建立專案失敗");
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case '估價審核中': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case '等待付款': return 'text-blue-600 bg-blue-50 border-blue-200';
            case '已付款': return 'text-brand-bronze bg-brand-bronze/10 border-brand-bronze/20';
            case '已出貨': return 'text-purple-600 bg-purple-50 border-purple-200';
            case '已完工': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            default: return 'text-stone-500 bg-stone-100 border-stone-200';
        }
    };

    return (
        // KEY FIX: Fixed height calculated from viewport (100vh - header/padding offset)
        <div className="flex h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] bg-white border border-stone-200 rounded-2xl overflow-hidden relative shadow-sm">
            
            {/* 1. Left Sidebar: Session List */}
            <div className="w-80 border-r border-stone-200 flex flex-col shrink-0 bg-stone-50/30 h-full">
                {/* ... (Session List UI - No Changes) ... */}
                <div className="p-4 border-b border-stone-200 bg-white shrink-0">
                    <h2 className="font-serif font-bold text-stone-800 text-lg mb-4 flex items-center gap-2">
                        客服中心 <span className="text-[10px] bg-stone-100 text-stone-500 border border-stone-200 px-2 py-0.5 rounded-full font-sans">Support</span>
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14}/>
                        <input 
                            type="text" 
                            placeholder="搜尋客戶、公司..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze/20 transition-all shadow-sm"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredSessions.length === 0 ? (
                        <div className="p-8 text-center text-stone-400 text-xs">沒有找到相關對話</div>
                    ) : (
                        filteredSessions.map((session: any) => (
                            <div 
                                key={session.userId} 
                                onClick={() => { setSelectedUserId(session.userId); onRead(session.userId); }}
                                className={`p-4 border-b border-stone-100 cursor-pointer hover:bg-white transition-all relative group
                                    ${selectedUserId === session.userId ? 'bg-white border-l-4 border-l-brand-bronze shadow-md z-10' : 'border-l-4 border-l-transparent'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <span className={`font-bold text-sm ${selectedUserId === session.userId ? 'text-stone-800' : 'text-stone-600'}`}>{session.userName}</span>
                                    {session.unreadCount > 0 ? (
                                        <span className="bg-red-500 text-white text-[10px] px-1.5 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center rounded-full font-bold shadow-sm animate-pulse">{session.unreadCount}</span>
                                    ) : (
                                        <span className="text-[10px] text-stone-300">{new Date(session.lastUpdated).toLocaleDateString()}</span>
                                    )}
                                </div>
                                <div className="text-xs text-stone-500 truncate mb-1 flex items-center gap-1">
                                    <Building2 size={10} className="text-stone-300"/> {session.company || '個人用戶'}
                                </div>
                                <div className={`text-xs truncate ${selectedUserId === session.userId ? 'text-stone-600' : 'text-stone-400'}`}>
                                    {session.lastMessage}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            {/* 2. Middle: Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-stone-50/50 relative z-0 overflow-hidden h-full">
                {selectedSession ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-white shadow-sm z-20 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-sm shadow-md">
                                    {selectedSession.userName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
                                        {selectedSession.userName}
                                        <span className="text-[10px] bg-brand-bronze/10 text-brand-bronze px-2 py-0.5 rounded border border-brand-bronze/20 font-bold">VIP 設計師</span>
                                    </h3>
                                    <p className="text-xs text-stone-500 flex items-center gap-1">
                                        <Building2 size={10}/> {selectedSession.company || '未填寫公司'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Project Context Summary in Header */}
                            {activeProject && (
                                <div className="hidden md:flex flex-col items-end">
                                    <div className="text-xs text-stone-400 uppercase font-bold tracking-wider mb-0.5">正在討論</div>
                                    <div className="text-sm font-medium text-stone-800 flex items-center gap-2 bg-stone-50 px-3 py-1 rounded-lg border border-stone-200">
                                        <Briefcase size={12} className="text-brand-bronze"/> 
                                        {activeProject.name}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Messages Container (Fixed Scroll) */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 custom-scrollbar">
                            {/* ... (Messages UI - No Changes) ... */}
                            {selectedSession.messages.map((msg: any, idx: number) => {
                                const showDate = idx === 0 || new Date(msg.timestamp).toDateString() !== new Date(selectedSession.messages[idx-1].timestamp).toDateString();
                                return (
                                    <React.Fragment key={msg.id}>
                                        {showDate && (
                                            <div className="flex justify-center my-4">
                                                <span className="text-[10px] text-stone-400 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
                                                    {new Date(msg.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex ${msg.role === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex flex-col gap-1 max-w-[75%] ${msg.role === 'agent' ? 'items-end' : 'items-start'}`}>
                                                
                                                {/* Attachments */}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="flex gap-2 flex-wrap justify-end mb-1">
                                                        {msg.attachments.map((att: Attachment) => (
                                                            <div key={att.id} className="cursor-pointer group relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm hover:shadow-md transition-all">
                                                                {att.type === 'image' ? (
                                                                    <div onClick={() => setPreviewImage(att.url)}>
                                                                        <img src={att.url} alt={att.name} className="h-32 w-auto object-cover" />
                                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                                                            <Eye size={20}/>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 min-w-[200px]">
                                                                        <div className={`p-2 rounded-lg text-white ${att.name.includes('報價單') ? 'bg-red-500' : 'bg-stone-400'}`}>
                                                                            <FileText size={20}/>
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className={`text-xs font-bold truncate ${att.name.includes('報價單') ? 'text-red-600' : 'text-stone-800'}`}>{att.name}</p>
                                                                            <p className="text-[10px] text-stone-400 uppercase">{att.type}</p>
                                                                        </div>
                                                                        <Download size={14} className="text-stone-300 hover:text-stone-600"/>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Text Bubble */}
                                                {msg.text && (
                                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap relative
                                                        ${msg.text.includes('[系統訊息]') || msg.text.includes('[系統通知]')
                                                            ? 'bg-stone-100 text-stone-500 text-center w-full italic text-xs py-2 shadow-none border border-stone-200'
                                                            : msg.role === 'agent' 
                                                                ? 'bg-stone-800 text-white rounded-br-none' 
                                                                : 'bg-white border border-stone-200 text-stone-700 rounded-bl-none'}
                                                    `}>
                                                        {msg.text}
                                                    </div>
                                                )}
                                                
                                                {/* Timestamp */}
                                                {!msg.text.includes('[系統') && (
                                                    <span className="text-[10px] text-stone-300 px-1 font-medium">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area (Fixed Bottom) */}
                        <div className="p-4 bg-white border-t border-stone-200 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-20 shrink-0">
                            {/* ... (Input UI - No Changes) ... */}
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setShowQuickReplies(!showQuickReplies)}
                                        className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors flex items-center gap-1.5 border
                                            ${showQuickReplies ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'}
                                        `}
                                    >
                                        <Zap size={12} className={showQuickReplies ? "fill-amber-700" : ""}/> 快速回覆
                                    </button>
                                    <button 
                                        onClick={() => setIsProductModalOpen(true)}
                                        className="text-xs bg-stone-50 border border-stone-200 text-stone-600 px-3 py-1.5 rounded-full font-bold hover:bg-brand-bronze hover:text-white hover:border-brand-bronze transition-colors flex items-center gap-1.5"
                                    >
                                        <Package size={12} /> 推薦/加購
                                    </button>
                                </div>
                                <div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*,.pdf" 
                                        multiple 
                                        onChange={handleFileUpload}
                                    />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-stone-400 hover:text-stone-800 p-1.5 hover:bg-stone-100 rounded-full transition-colors"
                                        title="上傳附件"
                                        disabled={isUploading}
                                    >
                                        {isUploading ? <Loader2 size={18} className="animate-spin"/> : <Paperclip size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Enhanced Quick Replies Dropdown */}
                            {showQuickReplies && (
                                <div className="absolute bottom-20 left-4 bg-white border border-stone-200 shadow-xl rounded-xl z-50 w-72 animate-fade-in flex flex-col overflow-hidden max-h-80">
                                    {/* ... Quick Replies content ... */}
                                    <div className="flex justify-between items-center p-3 border-b border-stone-100 bg-stone-50">
                                        <span className="text-xs font-bold text-stone-500 uppercase">常用語句管理</span>
                                        <button onClick={() => setShowQuickReplies(false)}><X size={14} className="text-stone-400 hover:text-stone-800"/></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                                        {quickReplies.map((reply, idx) => (
                                            <div key={idx} className="flex items-center gap-1 p-1 hover:bg-stone-50 rounded-lg group">
                                                <button 
                                                    onClick={() => handleSend(reply)}
                                                    className="flex-1 text-left text-xs text-stone-600 hover:text-brand-bronze p-2 rounded transition-colors truncate"
                                                >
                                                    {reply}
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteQuickReply(idx); }}
                                                    className="p-1.5 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="刪除此範本"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-2 border-t border-stone-100 bg-stone-50 flex gap-2">
                                        <input 
                                            value={newReplyText}
                                            onChange={(e) => setNewReplyText(e.target.value)}
                                            placeholder="新增常用語..."
                                            className="flex-1 text-xs border border-stone-200 rounded px-2 py-1.5 outline-none focus:border-brand-bronze"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddQuickReply()}
                                        />
                                        <button 
                                            onClick={handleAddQuickReply}
                                            disabled={!newReplyText.trim()}
                                            className="bg-stone-800 text-white px-2 rounded hover:bg-stone-700 disabled:opacity-50"
                                        >
                                            <Plus size={14}/>
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Main Input */}
                            <div className="flex gap-2 bg-stone-50 p-1.5 rounded-xl border border-stone-200 focus-within:ring-2 focus-within:ring-brand-bronze/20 focus-within:border-brand-bronze transition-all">
                                <textarea 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="輸入訊息..."
                                    className="flex-1 bg-transparent border-none px-3 py-2.5 text-sm outline-none resize-none max-h-32 text-stone-800 placeholder:text-stone-400 custom-scrollbar"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                                <button 
                                    onClick={() => handleSend()} 
                                    disabled={!replyText.trim() && !isUploading}
                                    className="bg-stone-900 text-white w-10 h-10 flex items-center justify-center rounded-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end shadow-md"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-300 bg-stone-50">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-stone-100">
                            <MessageSquare size={40} className="text-stone-300" />
                        </div>
                        <p className="text-sm font-medium">請從左側選擇對話以開始回覆</p>
                    </div>
                )}
            </div>

            {/* 3. Right Sidebar: Command Center (Tabs) */}
            {selectedSession && (
                <div className="w-[340px] border-l border-stone-200 bg-white flex flex-col shrink-0 z-10 shadow-[-4px_0_15px_rgba(0,0,0,0.02)] h-full">
                    
                    {/* Tab Navigation */}
                    <div className="flex border-b border-stone-200 shrink-0">
                        {[
                            { id: 'info', icon: LayoutGrid, label: '概況' },
                            { id: 'quote', icon: ClipboardList, label: '估價單' },
                            { id: 'files', icon: PenTool, label: '檔案' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setRightPanelTab(tab.id as any)}
                                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors
                                    ${rightPanelTab === tab.id 
                                        ? 'border-brand-bronze text-brand-bronze bg-brand-bronze/5' 
                                        : 'border-transparent text-stone-400 hover:text-stone-600 hover:bg-stone-50'}
                                `}
                            >
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto bg-stone-50/50 p-4 custom-scrollbar">
                        {/* Project Selector (Always Visible) with Create Button */}
                        <div className="mb-4 bg-white p-1 rounded-xl border border-stone-200 shadow-sm shrink-0 flex gap-2">
                            <div className="relative flex-1">
                                <select 
                                    value={activeProjectId || ''} 
                                    onChange={(e) => setActiveProjectId(e.target.value)}
                                    className="w-full bg-transparent text-stone-800 text-xs font-bold py-2 pl-3 pr-8 outline-none appearance-none cursor-pointer hover:bg-stone-50 rounded-lg transition-colors"
                                >
                                    <option value="">請選擇專案...</option>
                                    {userProjects.map((p: Project) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"/>
                            </div>
                            <button 
                                onClick={() => setIsCreateProjectOpen(true)}
                                className="bg-stone-100 hover:bg-brand-bronze hover:text-white text-stone-600 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                title="幫客戶快速開案"
                            >
                                <Plus size={14} /> 代客開案
                            </button>
                        </div>

                        {activeProject ? (
                            <>
                                {/* TAB 1: OVERVIEW */}
                                {rightPanelTab === 'info' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(activeProject.status)}`}>
                                                    {activeProject.status}
                                                </span>
                                                <span className="text-xs text-stone-400">{activeProject.date}</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-stone-500 flex items-center gap-1"><User size={12}/> 客戶</span>
                                                    <span className="font-medium text-stone-800">{activeProject.client}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-stone-500 flex items-center gap-1"><DollarSign size={12}/> 預算</span>
                                                    <span className="font-mono font-bold text-stone-800">${activeProject.budget.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Internal Notes */}
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2 text-yellow-700">
                                                <StickyNote size={12}/>
                                                <span className="text-xs font-bold uppercase">內部備註 (Private)</span>
                                            </div>
                                            <textarea 
                                                className="w-full bg-white/50 border border-yellow-200 rounded-lg p-2 text-xs text-stone-700 focus:outline-none focus:border-yellow-400 resize-none placeholder:text-stone-400"
                                                rows={3}
                                                placeholder="紀錄此專案的特殊需求、客戶喜好..."
                                                value={internalNote}
                                                onChange={(e) => setInternalNote(e.target.value)}
                                            />
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">快速操作</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button 
                                                    onClick={handleConfirmQuote}
                                                    disabled={activeProject.status !== '估價審核中'}
                                                    className="bg-white border border-stone-200 text-stone-600 text-xs py-2 rounded-lg font-medium hover:bg-stone-50 hover:text-brand-bronze disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center gap-1"
                                                >
                                                    <CheckCircle size={14}/> 確認報價
                                                </button>
                                                
                                                {/* Upload Quote PDF Button */}
                                                <div className="relative">
                                                    <input 
                                                        type="file" 
                                                        className="hidden" 
                                                        ref={quoteFileInputRef}
                                                        accept=".pdf"
                                                        onChange={handleQuoteUpload}
                                                    />
                                                    <button 
                                                        onClick={() => quoteFileInputRef.current?.click()}
                                                        disabled={isQuoteUploading}
                                                        className="w-full bg-white border border-stone-200 text-stone-600 text-xs py-2 rounded-lg font-medium hover:bg-stone-50 hover:text-brand-bronze transition-all flex flex-col items-center gap-1"
                                                    >
                                                        {isQuoteUploading ? <Loader2 size={14} className="animate-spin"/> : <CloudUpload size={14}/>}
                                                        {isQuoteUploading ? '上傳中...' : '上傳報價單 PDF'}
                                                    </button>
                                                </div>

                                                {/* Confirm Payment Button */}
                                                {activeProject.status === '等待付款' && (
                                                    <button 
                                                        onClick={handlePaymentReceived}
                                                        className="col-span-2 bg-brand-bronze text-white text-xs py-2.5 rounded-lg font-bold hover:bg-brand-bronzeDark transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brand-bronze/20"
                                                    >
                                                        <CreditCard size={14}/> 確認已收到款項 (查帳成功)
                                                    </button>
                                                )}

                                                {/* Arrange Shipment Button (New) */}
                                                {activeProject.status === '已付款' && (
                                                    <button 
                                                        onClick={handleArrangeShipment}
                                                        className="col-span-2 bg-purple-600 text-white text-xs py-2.5 rounded-lg font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-1.5 shadow-md"
                                                    >
                                                        <Truck size={14}/> 安排出貨
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: QUOTE VIEWER */}
                                {rightPanelTab === 'quote' && (
                                    <div className="space-y-3 animate-fade-in h-full flex flex-col">
                                        {/* ... Quote Viewer Content ... */}
                                        <div className="flex justify-between items-center pb-2 border-b border-stone-200 shrink-0">
                                            <span className="text-xs font-bold text-stone-500">共 {activeProject.items.length} 項商品</span>
                                            <span className="text-xs font-mono font-bold text-brand-bronze">
                                                總計: ${activeProject.items.reduce((acc, i) => acc + i.price * i.quantity, 0).toLocaleString()}
                                            </span>
                                        </div>
                                        
                                        <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar min-h-0">
                                            {activeProject.items.length === 0 ? (
                                                <div className="text-center py-10 text-stone-400 text-xs">估價單是空的</div>
                                            ) : (
                                                activeProject.items.map((item: QuoteItem, idx: number) => (
                                                    <div key={`${item.id}-${idx}`} className="bg-white border border-stone-200 rounded-lg p-2.5 shadow-sm flex gap-3 group hover:border-brand-bronze transition-colors">
                                                        <img src={item.image} className="w-12 h-12 rounded object-cover bg-stone-100 shrink-0"/>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <p className="text-xs font-bold text-stone-800 truncate" title={item.name}>{item.name}</p>
                                                                <p className="text-xs font-mono text-stone-500">x{item.quantity}</p>
                                                            </div>
                                                            <p className="text-[10px] text-stone-400 mt-0.5">{item.selectedCCT} • {item.selectedColor}</p>
                                                            <div className="flex justify-between items-end mt-1">
                                                                <p className="text-[10px] font-mono font-medium text-stone-600">${item.price.toLocaleString()}</p>
                                                                <button 
                                                                    onClick={() => handleSend(`關於「${item.name}」這項商品...`)}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-800"
                                                                    title="討論此商品"
                                                                >
                                                                    <MessageSquare size={12}/>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        
                                        <button 
                                            onClick={() => setIsProductModalOpen(true)}
                                            className="w-full py-2 bg-stone-800 text-white rounded-lg text-xs font-bold hover:bg-stone-700 transition-colors flex items-center justify-center gap-2 mt-auto shrink-0"
                                        >
                                            <Package size={12}/> 為客戶新增商品
                                        </button>
                                    </div>
                                )}

                                {/* TAB 3: FILES */}
                                {rightPanelTab === 'files' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="grid grid-cols-2 gap-2">
                                            {activeProject.files && activeProject.files.length > 0 ? (
                                                activeProject.files.map(file => (
                                                    <div key={file.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm group">
                                                        <div className="aspect-square bg-stone-100 flex items-center justify-center relative overflow-hidden">
                                                            {file.type === 'image' ? (
                                                                <img src={file.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/>
                                                            ) : (
                                                                <FileText size={24} className="text-stone-400"/>
                                                            )}
                                                            {/* Overlay Actions */}
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                                <button onClick={() => window.open(file.url, '_blank')} className="text-white hover:text-brand-bronze"><Eye size={16}/></button>
                                                                {file.type === 'image' && (
                                                                    <button onClick={() => setActiveWhiteboardFile(file)} className="text-white hover:text-brand-bronze"><PenTool size={16}/></button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="p-2 border-t border-stone-100">
                                                            <p className="text-[10px] font-bold text-stone-700 truncate">{file.name}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-2 text-center py-10 text-stone-400 text-xs">暫無檔案</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-stone-400 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50">
                                <Box size={32} className="mb-2 opacity-50"/>
                                <p className="text-xs">請先選擇上方專案</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Project Popover */}
            {isCreateProjectOpen && (
                <div className="absolute inset-0 z-[60] bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-lg text-stone-800 mb-2">協助客戶建立新專案</h3>
                        <p className="text-xs text-stone-500 mb-4">這將建立一個新專案並自動通知客戶。</p>
                        
                        <div className="space-y-1 mb-4">
                            <label className="text-xs font-bold text-stone-400">專案名稱</label>
                            <input 
                                autoFocus
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="例：忠孝東路李宅 (客服代開)"
                                className="w-full border border-stone-200 rounded-lg p-2 text-sm focus:border-brand-bronze outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateProjectSubmit()}
                            />
                        </div>
                        
                        <div className="flex gap-2">
                            <button onClick={() => setIsCreateProjectOpen(false)} className="flex-1 py-2 bg-stone-100 text-stone-600 rounded-lg text-sm hover:bg-stone-200">取消</button>
                            <button 
                                onClick={handleCreateProjectSubmit}
                                disabled={!newProjectName.trim()}
                                className="flex-1 py-2 bg-stone-900 text-white rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50"
                            >
                                建立專案
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {isProductModalOpen && (
                <div className="absolute inset-0 z-[50] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-stone-100 flex justify-between items-center">
                            <h3 className="font-bold text-stone-800">選擇推薦產品</h3>
                            <button onClick={() => setIsProductModalOpen(false)}><X size={20} className="text-stone-400 hover:text-stone-800"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4">
                            {allProducts.map((p: Product) => (
                                <div key={p.id} className="border border-stone-200 rounded-lg p-3 flex gap-3 hover:border-brand-bronze transition-colors group">
                                    <img src={p.image} className="w-16 h-16 object-cover rounded bg-stone-100" />
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <div className="font-bold text-sm truncate">{p.name}</div>
                                        <div className="text-xs text-stone-500 mb-auto">{p.category}</div>
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => handleRecommendProduct(p)} className="flex-1 bg-stone-100 text-stone-600 text-[10px] py-1 rounded hover:bg-stone-200">傳送資訊</button>
                                            <button onClick={() => handleAddProductToQuote(p)} className="flex-1 bg-stone-900 text-white text-[10px] py-1 rounded hover:bg-stone-700">加入估價單</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeWhiteboardFile && (
                <Whiteboard 
                    file={activeWhiteboardFile}
                    annotations={annotations}
                    currentUserRole="agent"
                    onAddAnnotation={onAddAnnotation}
                    onClearAnnotations={onClearAnnotations}
                    onClose={() => setActiveWhiteboardFile(null)}
                />
            )}

            {previewImage && (
                <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
            )}
        </div>
    );
};
