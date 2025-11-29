
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { generateLightingAdvice } from '../services/geminiService';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';

export const AIConsultant: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "您好！我是 Gentech 專屬的 AI 照明顧問。我可以協助您計算照度 (Lux)、查詢眩光值 (UGR) 或提供空間照明建議。請問今天想了解哪個案場的照明需求？",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepare context for API
    const history = messages.map(m => ({ role: m.role, text: m.text }));

    try {
      const responseText = await generateLightingAdvice(userMsg.text, history);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
         id: Date.now().toString(),
         role: 'model',
         text: "系統連線異常，請稍後再試。",
         timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white animate-fade-in relative rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
        
        {/* Header */}
        <div className="bg-white p-6 border-b border-stone-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-bronze/10 flex items-center justify-center">
            <Bot size={24} className="text-brand-bronze" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-stone-800 flex items-center gap-2">
              AI 燈光顧問
              <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-500 border border-stone-200 uppercase tracking-widest font-sans">Beta</span>
            </h2>
            <p className="text-xs text-stone-500">Powered by Gemini 2.5 Flash • 專業照明技術支援</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-stone-50/50">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-1 border shadow-sm
                ${msg.role === 'user' ? 'bg-white border-stone-200' : 'bg-brand-bronze/5 border-brand-bronze/20'}`}>
                {msg.role === 'user' ? <User size={18} className="text-stone-400" /> : <Sparkles size={18} className="text-brand-bronze" />}
              </div>
              
              <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-6 py-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-stone-800 text-white rounded-tr-none font-medium' 
                    : 'bg-white text-stone-700 border border-stone-100 rounded-tl-none'}`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-stone-400 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
             <div className="flex gap-4">
               <div className="w-10 h-10 rounded-full bg-brand-bronze/5 border border-brand-bronze/20 flex-shrink-0 flex items-center justify-center mt-1">
                 <Sparkles size={18} className="text-brand-bronze" />
               </div>
               <div className="bg-white border border-stone-100 px-6 py-4 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                 <Loader2 size={16} className="text-brand-bronze animate-spin" />
                 <span className="text-stone-500 text-sm">正在分析規格並計算參數...</span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-stone-100">
          <div className="relative flex items-center gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="詢問關於流明、UGR、CCT 或空間配置建議..."
              className="w-full bg-white text-stone-800 pl-6 pr-14 py-4 rounded-2xl border border-stone-200 focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze resize-none h-14 min-h-[56px] max-h-32 transition-all shadow-inner"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-3 p-2.5 bg-brand-bronze hover:bg-brand-bronzeDark text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-center text-stone-400 mt-3">
            AI 建議僅供參考，實際施工請參閱原廠規格書 (Datasheet)。
          </p>
        </div>
    </div>
  );
};
