
import React from 'react';
import { LayoutDashboard, Grid, Bot, FileText, Gift, Download, Settings, LogOut, X, ShieldCheck, FolderOpen } from 'lucide-react';
import { AppView, User } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenSettings: () => void; // New prop
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose, onLogout, onOpenSettings, user }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: '總覽 Overview', icon: LayoutDashboard },
    { id: AppView.PROJECTS, label: '專案管理 Projects', icon: FolderOpen }, // New Menu Item
    { id: AppView.CATALOG, label: '產品選樣 Catalog', icon: Grid },
    { id: AppView.QUOTE, label: '專案估價單 Quotes', icon: FileText },
    { id: AppView.AI_CONSULTANT, label: 'AI 照明顧問', icon: Bot, highlight: true },
    { id: AppView.REWARDS, label: '會員獎勵 Rewards', icon: Gift },
    { id: AppView.RESOURCES, label: '資源與藝廊', icon: Download },
  ];

  // Check if user has any admin privileges
  const hasAdminAccess = user?.role === 'admin' || user?.role === 'sales' || user?.role === 'support';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container - Light Theme */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-stone-200 flex flex-col 
        transition-transform duration-500 cubic-bezier(0.25, 1, 0.5, 1) shadow-sm
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-8 border-b border-stone-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <img 
               src="https://shoplineimg.com/566528b00390552841000036/66ce85144ab3872821731cf8/1200x.webp?source_format=png" 
               alt="Gentech Logo" 
               className="h-10 w-auto object-contain mix-blend-multiply"
             />
          </div>
          <button onClick={onClose} className="md:hidden text-stone-400 hover:text-stone-800 transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-lg text-sm tracking-wide transition-all duration-300 group
                ${currentView === item.id 
                  ? 'bg-stone-100 text-brand-bronze font-semibold' 
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                }
              `}
            >
              <item.icon 
                size={20} 
                strokeWidth={1.5}
                className={`transition-colors ${currentView === item.id ? 'text-brand-bronze' : 'text-stone-400 group-hover:text-stone-600'}`} 
              />
              {item.label}
              
              {item.highlight && currentView !== item.id && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-bronze animate-pulse"></span>
              )}
            </button>
          ))}

          {/* Admin Link - Visible to Admin, Sales, Support */}
          {hasAdminAccess && (
            <div className="pt-4 mt-4 border-t border-stone-100">
              <p className="px-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Internal System</p>
              <button
                onClick={() => onChangeView(AppView.ADMIN_DASHBOARD)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-lg text-sm tracking-wide transition-all duration-300 group
                  ${currentView === AppView.ADMIN_DASHBOARD 
                    ? 'bg-stone-800 text-white font-semibold shadow-md' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }
                `}
              >
                <ShieldCheck size={20} strokeWidth={1.5} />
                後台管理系統
              </button>
            </div>
          )}
        </nav>

        <div className="p-6 border-t border-stone-100 bg-stone-50/50">
          <button 
            onClick={onOpenSettings}
            className="w-full flex items-center gap-4 px-4 py-3 text-stone-500 hover:text-stone-900 rounded-lg text-sm transition-colors hover:bg-white border border-transparent hover:border-stone-100 hover:shadow-sm"
          >
            <Settings size={20} strokeWidth={1.5} />
            帳號設定
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors mt-1"
          >
            <LogOut size={20} strokeWidth={1.5} />
            登出帳戶
          </button>
        </div>
      </aside>
    </>
  );
};
