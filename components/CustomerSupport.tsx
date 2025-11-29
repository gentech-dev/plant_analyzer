
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Headphones, Paperclip, Bell, FileText, ArrowRight, Image as ImageIcon, PenTool, Briefcase, Eye } from 'lucide-react';
import { ChatMessage, User, Project, ProjectFile, Annotation, Attachment } from '../types';
import { Whiteboard } from './Whiteboard';
import { ImagePreviewModal } from './ImagePreviewModal';
import { uploadFile } from '../firebase';

interface CustomerSupportProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
  messages: ChatMessage[];
  onSendMessage: (text: string, attachments?: Attachment[]) => void;
  onInitChat: () => void;
  // Annotation Props
  projects: Project[];
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onClearAnnotations: (fileId: string) => void;
}

export const CustomerSupport: React.FC<CustomerSupportProps> = ({ 
  isOpen, setIsOpen,
  user, messages, onSendMessage, onInitChat,
  projects, annotations, onAddAnnotation, onClearAnnotations
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // Notification State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<ChatMessage | null>(null);

  // File & Whiteboard State
  const [showFileList, setShowFileList] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [activeWhiteboardFile, setActiveWhiteboardFile] = useState<ProjectFile | null>(null);
  
  // Image Preview State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Attachment State
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages ? messages.length : 0);

  // Collect all files from all projects
  const allFiles = projects.flatMap(p => p.files || []);

  // Initialize chat when opened if empty
  useEffect(() => {
    if (isOpen && (!messages || messages.length === 0)) {
        onInitChat();
    }
  }, [isOpen, messages, onInitChat]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Smart Notification Logic
  useEffect(() => {
    if (messages && messages.length > prevMessagesLength.current) {
        const lastMsg = messages[messages.length - 1];
        
        if (lastMsg && lastMsg.role === 'agent' && !isOpen) {
            setToastMessage(lastMsg);
            setShowToast(true);
            
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
                audio.volume = 0.2;
                audio.play().catch(() => {});
            } catch (e) {}
        }
    }
    prevMessagesLength.current = messages ? messages.length : 0;
  }, [messages, isOpen]);

  // Auto-hide simple toasts after 8 seconds
  useEffect(() => {
    if (showToast && toastMessage) {
        const isImportant = toastMessage.text.includes('報價單') || toastMessage.text.includes('Quote') || toastMessage.text.includes('PDF');
        const duration = isImportant ? 15000 : 8000;
        
        const timer = setTimeout(() => {
            setShowToast(false);
        }, duration);
        return () => clearTimeout(timer);
    }
  }, [showToast, toastMessage]);

  const handleSend = () => {
    if ((!inputText.trim() && pendingAttachments.length === 0) || isUploading) return;
    onSendMessage(inputText, pendingAttachments);
    setInputText('');
    setPendingAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToastClick = () => {
      setIsOpen(true);
      setShowToast(false);
  };

  const handleSelectProject = (project: Project) => {
      const contextMsg = `[專案諮詢] 我想討論專案：「${project.name}」`;
      onSendMessage(contextMsg);
      setShowProjectList(false);
  };

  // Updated handleFiles with error handling for missing storage
  const handleFiles = async (files: File[]) => {
    setIsUploading(true);
    try {
        const newAttachmentsPromises = files.map(async (file) => {
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
        setPendingAttachments(prev => [...prev, ...newAttachments]);
    } catch (error) {
        console.error("Upload failed:", error);
    } finally {
        setIsUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
            const file = items[i].getAsFile();
            if (file) files.push(file);
        }
    }
    if (files.length > 0) handleFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFiles(Array.from(e.dataTransfer.files));
      }
  };

  // Determine active project context based on last message (Safe access)
  const activeContext = messages && messages.length > 0 
      ? messages
          .slice()
          .reverse()
          .find(m => m.text && m.text.includes('[專案諮詢]'))?.text.split('：「')[1]?.replace('」', '')
      : null;

  const isQuoteNotification = toastMessage?.text.includes('報價單') || toastMessage?.text.includes('Quote') || toastMessage?.text.includes('PDF');

  // Helper to safely format time
  const formatTime = (dateInput: any) => {
    try {
        if (!dateInput) return '';
        // Handle Firestore Timestamp (has toDate)
        const dateObj = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
        if (isNaN(dateObj.getTime())) return '';
        return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return 'Time Error';
    }
  };

  return (
    <>
      {/* Smart Notification Toast */}
      {showToast && toastMessage && !isOpen && (
          <div 
            onClick={handleToastClick}
            className={`fixed bottom-24 right-6 md:right-10 w-[340px] p-5 rounded-xl shadow-2xl z-[90] cursor-pointer transform transition-all duration-500 hover:-translate-y-2 animate-fade-in border overflow-hidden
                ${isQuoteNotification 
                    ? 'bg-[#1c1917] border-brand-bronze shadow-brand-bronze/30' 
                    : 'bg-white border-stone-200 shadow-stone-300/50'}
            `}
          >
             {isQuoteNotification && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-bronze"></div>
             )}
             
             <button 
                onClick={(e) => { e.stopPropagation(); setShowToast(false); }}
                className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${isQuoteNotification ? 'text-stone-400 hover:text-white hover:bg-white/10' : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'}`}
             >
                 <X size={14} />
             </button>

             <div className="flex items-start gap-4">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border-2
                    ${isQuoteNotification ? 'bg-brand-bronze text-white border-stone-800' : 'bg-stone-100 text-stone-600 border-white'}
                 `}>
                    {isQuoteNotification ? <FileText size={22} className="animate-pulse" /> : <Bell size={22} />}
                 </div>
                 <div className="flex-1 min-w-0 pt-0.5">
                     <h4 className={`text-base font-bold mb-1 flex items-center gap-2 font-serif ${isQuoteNotification ? 'text-white' : 'text-stone-800'}`}>
                         {isQuoteNotification ? '收到正式報價單' : '新訊息通知'}
                         {isQuoteNotification && <span className="flex w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>}
                     </h4>
                     <p className={`text-xs line-clamp-2 leading-relaxed ${isQuoteNotification ? 'text-stone-300' : 'text-stone-500'}`}>
                         {toastMessage.text}
                     </p>
                     <div className={`mt-3 text-xs font-medium flex items-center gap-1 group ${isQuoteNotification ? 'text-brand-bronze' : 'text-brand-bronze'}`}>
                         點擊查看詳情 <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                     </div>
                 </div>
             </div>
          </div>
      )}

      {/* Whiteboard Modal */}
      {activeWhiteboardFile && (
          <Whiteboard 
              file={activeWhiteboardFile}
              annotations={annotations}
              currentUserRole="user"
              onAddAnnotation={onAddAnnotation}
              onClearAnnotations={onClearAnnotations}
              onClose={() => setActiveWhiteboardFile(null)}
          />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
          <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] md:w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl shadow-stone-900/20 border border-stone-200 z-[90] flex flex-col overflow-hidden animate-fade-in origin-bottom-right">
          
          {/* Header */}
          <div className="bg-stone-900 p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-brand-bronze flex items-center justify-center text-white border-2 border-stone-800">
                  <Headphones size={20} />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-stone-900 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-medium text-sm flex items-center gap-2">
                   {user?.tier && user.tier !== '設計師' ? '專屬客戶經理' : '線上客服中心'}
                   {user?.tier && user.tier !== '設計師' && <span className="bg-brand-bronze text-[10px] px-1.5 py-0.5 rounded text-stone-900 font-bold">VIP</span>}
                </h3>
                <p className="text-xs text-stone-400">通常在 5 分鐘內回覆</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Active Project Context Banner */}
          {activeContext && (
             <div className="bg-amber-50 border-b border-amber-100 p-2 px-4 flex items-center gap-2 text-xs text-amber-800 font-medium shrink-0 animate-fade-in">
                 <Briefcase size={12} />
                 <span>正在討論：{activeContext}</span>
             </div>
          )}

          {/* Project Selection Overlay */}
          {showProjectList && (
              <div className="absolute inset-x-0 bottom-[60px] top-[72px] bg-white/95 backdrop-blur-sm z-30 flex flex-col animate-fade-in border-t border-stone-100">
                  <div className="p-3 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                      <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2">
                          <Briefcase size={16}/> 選擇討論專案
                      </h4>
                      <button onClick={() => setShowProjectList(false)} className="text-stone-400 hover:text-stone-800"><X size={18}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {projects.length === 0 ? (
                          <div className="text-center text-stone-400 text-xs py-10">
                              無進行中的專案
                          </div>
                      ) : (
                          projects.map(project => (
                              <button 
                                key={project.id} 
                                onClick={() => handleSelectProject(project)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 rounded-lg border border-transparent hover:border-stone-200 transition-all text-left group"
                              >
                                  <div className="w-10 h-10 rounded bg-stone-100 flex items-center justify-center text-stone-500 border border-stone-200">
                                      <FileText size={20}/>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm text-stone-800 truncate">{project.name}</div>
                                      <div className="text-[10px] text-stone-400 flex items-center gap-1">
                                          {project.status} • {project.client}
                                      </div>
                                  </div>
                                  <div className="text-stone-300 group-hover:text-brand-bronze">
                                      <ArrowRight size={16}/>
                                  </div>
                              </button>
                          ))
                      )}
                  </div>
              </div>
          )}

          {/* Files List Overlay */}
          {showFileList && (
              <div className="absolute inset-x-0 bottom-[60px] top-[72px] bg-white/95 backdrop-blur-sm z-30 flex flex-col animate-fade-in border-t border-stone-100">
                  <div className="p-3 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                      <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2">
                          <ImageIcon size={16}/> 選擇協作圖檔
                      </h4>
                      <button onClick={() => setShowFileList(false)} className="text-stone-400 hover:text-stone-800"><X size={18}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {allFiles.length === 0 ? (
                          <div className="text-center text-stone-400 text-xs py-10">
                              無可用的設計圖檔<br/>請先在建立專案時上傳
                          </div>
                      ) : (
                          allFiles.map(file => (
                              <button 
                                key={file.id} 
                                onClick={() => {
                                    setActiveWhiteboardFile(file);
                                    setShowFileList(false);
                                }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg border border-transparent hover:border-stone-200 transition-all text-left group"
                              >
                                  <div className="w-12 h-12 rounded bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200">
                                      {file.type === 'image' ? <img src={file.url} className="w-full h-full object-cover"/> : <FileText size={20}/>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm text-stone-800 truncate">{file.name}</div>
                                      <div className="text-[10px] text-stone-400">點擊開啟協作白板</div>
                                  </div>
                                  <div className="text-stone-300 group-hover:text-brand-bronze">
                                      <PenTool size={16}/>
                                  </div>
                              </button>
                          ))
                      )}
                  </div>
              </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 bg-stone-50 overflow-y-auto p-4 space-y-4">
            <div className="text-center text-[10px] text-stone-400 my-2">
              <span className="bg-stone-100 px-2 py-1 rounded-full">今天 {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            
            {messages && messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Agent Avatar */}
                {msg.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-stone-200 flex-shrink-0 mr-2 flex items-center justify-center text-stone-500 text-xs font-bold">
                        {msg.role === 'agent' ? '客服' : 'AI'}
                    </div>
                )}
                
                <div className={`max-w-[80%] flex flex-col gap-2`}>
                   {/* Attachments */}
                   {msg.attachments && msg.attachments.length > 0 && (
                      <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {msg.attachments.map(att => (
                              <div key={att.id} className="overflow-hidden rounded-lg border border-stone-200 shadow-sm bg-white max-w-[200px] cursor-pointer hover:opacity-90 transition-opacity">
                                  {att.type === 'image' ? (
                                      <div className="relative group" onClick={() => setPreviewImage(att.url)}>
                                          <img src={att.url} alt={att.name} className="w-full h-auto" />
                                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                                               <div className="bg-white/80 rounded-full p-1 shadow-sm"><Eye size={16} className="text-stone-800"/></div>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="p-3 flex items-center gap-3 hover:bg-stone-50" onClick={() => window.open(att.url, '_blank')}>
                                          <FileText size={24} className="text-stone-400"/>
                                          <div className="flex-1 min-w-0">
                                              <p className="text-xs font-bold truncate">{att.name}</p>
                                              <p className="text-[10px] text-stone-400">{att.size}</p>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                   )}

                   {/* Text Message */}
                   {msg.text && (
                        <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap
                          ${msg.text.includes('[專案諮詢]') 
                             ? 'bg-amber-100 text-amber-900 border border-amber-200 w-full text-center font-bold' 
                             : msg.role === 'user' 
                                ? 'bg-brand-bronze text-white rounded-tr-none' 
                                : 'bg-white text-stone-700 border border-stone-100 rounded-tl-none'}
                          `}
                        >
                          {msg.text}
                          {/* Render Link Preview if detected */}
                          {(msg.text.includes('.pdf') || msg.text.includes('QUOTE')) && (
                              <div className={`mt-2 p-2 rounded flex items-center gap-2 cursor-pointer transition-colors border
                                  ${msg.role === 'user' ? 'bg-white/20 hover:bg-white/30 border-white/20' : 'bg-stone-50 hover:bg-stone-100 border-stone-200'}
                              `}>
                                  <FileText size={24} className={msg.role === 'user' ? 'text-white' : 'text-red-500'} />
                                  <div className="flex-1 min-w-0">
                                      <p className="font-bold text-xs truncate">Official_Quote.pdf</p>
                                      <p className="text-[10px] opacity-70">Signed Document • PDF</p>
                                  </div>
                              </div>
                          )}
                          <div className={`text-[10px] mt-1 text-right ${msg.role === 'user' ? 'text-white/60' : 'text-stone-400'}`}>
                              {formatTime(msg.timestamp)}
                          </div>
                        </div>
                   )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div 
            className={`p-3 bg-white border-t border-stone-100 transition-colors z-40 relative ${isDragging ? 'bg-brand-bronze/10' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
             {/* Pending Attachments Preview */}
             {pendingAttachments.length > 0 && (
                 <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                     {pendingAttachments.map(att => (
                         <div key={att.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-stone-200 bg-stone-50 group shrink-0">
                             {att.type === 'image' ? (
                                 <img src={att.url} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center"><FileText size={20} className="text-stone-400"/></div>
                             )}
                             <button 
                                onClick={() => setPendingAttachments(prev => prev.filter(p => p.id !== att.id))}
                                className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500"
                             >
                                 <X size={10} />
                             </button>
                         </div>
                     ))}
                 </div>
             )}

             <div className="flex items-end gap-2 bg-stone-50 border border-stone-200 rounded-xl p-2 focus-within:ring-1 focus-within:ring-brand-bronze focus-within:border-brand-bronze transition-all">
                
                {/* Project Selector Button */}
                <button 
                    onClick={() => { setShowProjectList(!showProjectList); setShowFileList(false); }}
                    className={`p-2 transition-colors rounded-lg ${showProjectList ? 'text-brand-bronze bg-brand-bronze/10' : 'text-stone-400 hover:text-stone-600'}`}
                    title="選擇討論專案"
                >
                   <Briefcase size={18} />
                </button>

                {/* Collaboration Button */}
                <button 
                    onClick={() => { setShowFileList(!showFileList); setShowProjectList(false); }}
                    className={`p-2 transition-colors rounded-lg ${showFileList ? 'text-brand-bronze bg-brand-bronze/10' : 'text-stone-400 hover:text-stone-600'}`}
                    title="開啟設計圖協作"
                >
                   <PenTool size={18} />
                </button>

                {/* File Upload Button */}
                <div className="relative">
                    <input 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={(e) => { if(e.target.files?.length) handleFiles(Array.from(e.target.files)); }} 
                        multiple 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-2 transition-colors rounded-lg ${isUploading ? 'text-brand-bronze animate-pulse' : 'text-stone-400 hover:text-stone-600'}`}
                        title="上傳圖片或檔案"
                        disabled={isUploading}
                    >
                        <Paperclip size={18} />
                    </button>
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}
                  placeholder={isUploading ? "檔案上傳中..." : (pendingAttachments.length > 0 ? "輸入訊息..." : "輸入訊息...")}
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-24 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
                  rows={1}
                  disabled={isUploading}
                />
                <button 
                   onClick={handleSend}
                   disabled={(!inputText.trim() && pendingAttachments.length === 0) || isUploading}
                   className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                   <Send size={16} />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => { setIsOpen(!isOpen); setShowToast(false); }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed bottom-6 right-6 z-[90] flex items-center gap-3 p-4 rounded-full shadow-lg transition-all duration-300 group
          ${isOpen ? 'bg-stone-800 text-white rotate-90 scale-90' : 'bg-brand-bronze text-white hover:bg-brand-bronzeDark hover:scale-105 shadow-brand-bronze/30'}
        `}
      >
        {isOpen ? (
           <X size={24} />
        ) : (
           <>
             <MessageCircle size={24} className={showToast ? "animate-none" : "animate-pulse"} />
             {isHovered && (
               <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap text-sm font-medium pr-1">
                  聯繫客服經理
               </span>
             )}
             {showToast && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-bounce"></span>
             )}
           </>
        )}
      </button>
    </>
  );
};
