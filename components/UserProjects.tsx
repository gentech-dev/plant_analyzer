
import React, { useState, useMemo } from 'react';
import { Project, ProjectFile, GalleryItem, User } from '../types';
import { 
  Search, Plus, Building2, Calendar, User as UserIcon, ArrowRight, 
  FolderOpen, Package, FileText, Upload, MoreHorizontal, LayoutGrid, 
  ListFilter, DollarSign, Clock, CheckCircle2, AlertCircle, Image as ImageIcon,
  ChevronRight, CreditCard, Truck, Palette, Sparkles, Filter
} from 'lucide-react';
import { ProjectDetailDialog } from './ProjectDetailDialog';

interface UserProjectsProps {
  projects: Project[];
  user: User | null;
  onOpenCreateProject: () => void;
  onSelectProject: (id: string) => void;
  onUpdateStatus: (id: string, status: Project['status']) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onUploadFile?: (id: string, files: ProjectFile[]) => void;
  onQuickAdd: (id: string) => void;
  onGallerySubmission?: (item: GalleryItem) => void;
  onPaymentComplete?: (id: string) => void;
  onNotifyPayment?: (id: string) => void;
  onCreateAddon?: (id: string) => void; // New prop
}

export const UserProjects: React.FC<UserProjectsProps> = ({
  projects, user, onOpenCreateProject, onSelectProject,
  onUpdateStatus, onUpdateNotes, onUploadFile, onQuickAdd, onGallerySubmission, onPaymentComplete, onNotifyPayment, onCreateAddon
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'action_needed' | 'active' | 'completed'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  // --- Statistics Dashboard Logic ---
  const stats = useMemo(() => {
      const active = projects.filter(p => p.status !== '已完工').length;
      const actionNeeded = projects.filter(p => p.status === '估價審核中' || p.status === '等待付款').length;
      const completed = projects.filter(p => p.status === '已完工').length;
      
      // Calculate total ACTUAL ORDER VALUE for active projects only
      const totalOrderValue = projects
        .filter(p => p.status !== '已完工')
        .reduce((sum, p) => {
            const projectTotal = p.items.reduce((iSum, item) => iSum + (item.price * item.quantity), 0);
            return sum + projectTotal;
        }, 0);

      return { active, actionNeeded, completed, totalOrderValue };
  }, [projects]);

  // --- Filter Logic ---
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (statusFilter) {
        case 'action_needed':
            return p.status === '估價審核中' || p.status === '等待付款';
        case 'active':
            return p.status !== '已完工';
        case 'completed':
            return p.status === '已完工';
        default:
            return true;
    }
  });

  // Sort: Action Needed > Date Newest > Others
  const sortedProjects = filteredProjects.sort((a, b) => {
      const priorityA = (a.status === '等待付款' || a.status === '估價審核中') ? 1 : 0;
      const priorityB = (b.status === '等待付款' || b.status === '估價審核中') ? 1 : 0;
      if (priorityA !== priorityB) return priorityB - priorityA;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="h-full flex flex-col space-y-8 animate-fade-in pb-24">
      
      {/* Detail Dialog */}
      {selectedProject && (
          <ProjectDetailDialog 
              isOpen={!!selectedProject}
              onClose={() => setSelectedProjectId(null)}
              project={selectedProject}
              user={user}
              onUpdateStatus={onUpdateStatus}
              onUpdateNotes={onUpdateNotes}
              onUploadFile={onUploadFile}
              onGallerySubmission={onGallerySubmission}
              onSelectProjectForQuote={(id) => {
                  onSelectProject(id);
                  setSelectedProjectId(null);
              }}
              onQuickAdd={(id) => {
                  onQuickAdd(id);
                  setSelectedProjectId(null);
              }}
              onPaymentComplete={onPaymentComplete}
              onNotifyPayment={onNotifyPayment}
              onCreateAddon={onCreateAddon}
          />
      )}

      {/* 1. Mini Dashboard Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 tracking-tight flex items-center gap-3">
                    專案管理 Projects 
                    <span className="text-xs bg-stone-100 text-stone-500 px-3 py-1 rounded-full font-sans font-medium tracking-wide">
                        {projects.length} Total
                    </span>
                </h1>
                <p className="text-stone-500 mt-2 font-light text-sm">集中管理您的所有設計案場與進度，一手掌握專案脈動。</p>
            </div>
            <button 
                onClick={onOpenCreateProject}
                className="bg-stone-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-stone-700 transition-all flex items-center gap-2 shadow-lg shadow-stone-200 hover:shadow-xl active:scale-95 whitespace-nowrap"
            >
                <Plus size={18} />
                開立新專案
            </button>
        </div>

        {/* Stats Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between h-28 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <FolderOpen size={64} className="text-brand-bronze"/>
                </div>
                <p className="text-xs text-stone-400 font-bold uppercase tracking-wider z-10">進行中案件</p>
                <p className="text-3xl font-serif font-bold text-stone-800 z-10">{stats.active}</p>
            </div>
            
            <div className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between h-28 relative overflow-hidden group
                ${stats.actionNeeded > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-stone-200'}
            `}>
                <div className={`absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${stats.actionNeeded > 0 ? 'text-amber-600' : 'text-stone-400'}`}>
                    <AlertCircle size={64} />
                </div>
                <p className={`text-xs font-bold uppercase tracking-wider z-10 ${stats.actionNeeded > 0 ? 'text-amber-600' : 'text-stone-400'}`}>
                    需處理事項
                </p>
                <div className="z-10 flex items-baseline gap-2">
                    <p className={`text-3xl font-serif font-bold ${stats.actionNeeded > 0 ? 'text-amber-600' : 'text-stone-800'}`}>
                        {stats.actionNeeded}
                    </p>
                    {stats.actionNeeded > 0 && <span className="text-[10px] text-amber-600 font-medium">待確認</span>}
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between h-28 relative overflow-hidden group col-span-2 md:col-span-2">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <DollarSign size={80} className="text-stone-800"/>
                </div>
                <div className="flex justify-between items-start z-10">
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">進行中訂單總額 (Order Value)</p>
                    <span className="text-[10px] bg-stone-100 px-2 py-1 rounded text-stone-500 font-medium">Actual</span>
                </div>
                <p className="text-3xl font-serif font-bold text-stone-800 z-10 font-mono tracking-tight">
                    NT$ {stats.totalOrderValue.toLocaleString()}
                </p>
            </div>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-sm py-4 -my-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex w-full md:w-auto bg-stone-100 rounded-xl p-1 gap-1">
                  {[
                      { id: 'all', label: '全部' },
                      { id: 'action_needed', label: '需注意', icon: AlertCircle, count: stats.actionNeeded, alert: true },
                      { id: 'active', label: '進行中' },
                      { id: 'completed', label: '已完工' }
                  ].map((tab) => (
                      <button
                          key={tab.id}
                          onClick={() => setStatusFilter(tab.id as any)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 flex-1 justify-center md:justify-start
                              ${statusFilter === tab.id 
                                  ? 'bg-white text-stone-900 shadow-md transform scale-105' 
                                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'}
                          `}
                      >
                          {tab.icon && <tab.icon size={14} className={tab.alert && tab.count > 0 ? 'text-amber-500' : 'text-stone-400'} />}
                          {tab.label}
                          {tab.count !== undefined && tab.count > 0 && (
                              <span className={`text-[10px] px-1.5 rounded-full min-w-[1.2rem] h-4 flex items-center justify-center
                                  ${statusFilter === tab.id ? 'bg-stone-900 text-white' : 'bg-stone-300 text-white'}
                                  ${tab.alert ? 'bg-amber-500 text-white' : ''}
                              `}>
                                  {tab.count}
                              </span>
                          )}
                      </button>
                  ))}
              </div>

              <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input 
                      type="text" 
                      placeholder="搜尋專案名稱、業主..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 text-stone-800 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze/20 text-sm transition-all"
                  />
              </div>
          </div>
      </div>

      {/* 3. Projects Grid */}
      <div className="space-y-6">
          {sortedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-200 rounded-3xl p-20 bg-stone-50/50 min-h-[400px]">
                  <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
                      <FolderOpen size={32} className="opacity-30"/>
                  </div>
                  <p className="font-bold text-lg text-stone-500">沒有符合條件的專案</p>
                  <p className="text-sm mt-2">試著調整篩選條件或建立新專案</p>
                  <button onClick={onOpenCreateProject} className="mt-6 text-brand-bronze hover:text-brand-bronzeDark text-sm font-bold flex items-center gap-1 hover:underline">
                      <Plus size={16}/> 立即建立新專案
                  </button>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sortedProjects.map(project => (
                      <ProProjectCard 
                          key={project.id} 
                          project={project} 
                          onClick={() => setSelectedProjectId(project.id)}
                          onQuickQuote={() => onSelectProject(project.id)}
                          onQuickAdd={() => onQuickAdd(project.id)}
                      />
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

// --- REDESIGNED PRO PROJECT CARD ---
const ProProjectCard: React.FC<{ 
    project: Project, 
    onClick: () => void,
    onQuickQuote: () => void,
    onQuickAdd: () => void
}> = ({ project, onClick, onQuickQuote, onQuickAdd }) => {
    
    // Config based on status
    const getStatusConfig = (status: string) => {
        switch (status) {
            case '規劃中': 
                return { 
                    step: 1, 
                    badge: 'bg-stone-500/20 text-stone-600 backdrop-blur-md border-stone-200', 
                    icon: Palette,
                    label: '規劃設計中'
                };
            case '估價審核中': 
                return { 
                    step: 2, 
                    badge: 'bg-amber-100/90 text-amber-700 backdrop-blur-md border-amber-200', 
                    icon: FileText,
                    alert: true,
                    label: '客服審核中'
                };
            case '等待付款': 
                return { 
                    step: 3, 
                    badge: 'bg-blue-600/90 text-white backdrop-blur-md border-blue-500 shadow-lg shadow-blue-500/30', 
                    icon: CreditCard,
                    alert: true,
                    label: '待付款確認'
                };
            case '已付款': 
                return { 
                    step: 4, 
                    badge: 'bg-brand-bronze/90 text-white backdrop-blur-md border-brand-bronze shadow-lg', 
                    icon: Package,
                    label: '已付款/備貨'
                };
            case '已出貨': 
                return { 
                    step: 5, 
                    badge: 'bg-purple-600/90 text-white backdrop-blur-md border-purple-500 shadow-lg', 
                    icon: Truck,
                    label: '運送中'
                };
            case '已完工': 
                return { 
                    step: 6, 
                    badge: 'bg-emerald-600/90 text-white backdrop-blur-md border-emerald-500', 
                    icon: CheckCircle2,
                    label: '完美竣工'
                };
            default: 
                return { step: 0, badge: 'bg-stone-100', icon: FolderOpen, label: status };
        }
    };

    const statusConfig = getStatusConfig(project.status);
    const coverImage = project.files?.find(f => f.type === 'image')?.url;
    const itemsCount = project.items.length;
    const filesCount = project.files?.length || 0;
    
    // Calculate Order Total dynamically
    const orderTotal = project.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Visual Step Nodes
    const steps = [1, 2, 3, 4, 5, 6];
    const currentStep = statusConfig.step;

    return (
        <div 
            onClick={onClick}
            className={`group bg-white rounded-3xl overflow-hidden cursor-pointer flex flex-col h-full relative transition-all duration-300 hover:-translate-y-1
                ${statusConfig.alert ? 'ring-2 ring-amber-400/50 shadow-xl shadow-amber-100' : 'border border-stone-200 shadow-md hover:shadow-xl hover:shadow-stone-200/40'}
            `}
        >
            {/* 1. Cover Image Area (Large & Immersive) */}
            <div className="h-48 relative overflow-hidden bg-stone-100">
                {coverImage ? (
                    <img 
                        src={coverImage} 
                        alt={project.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 text-stone-300">
                        <Building2 size={40} strokeWidth={1.5} className="mb-2"/>
                        <span className="text-[10px] font-bold uppercase tracking-widest">No Cover Image</span>
                    </div>
                )}
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent opacity-90"></div>

                {/* Status Badge (Floating) */}
                <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${statusConfig.badge}`}>
                        <statusConfig.icon size={12} />
                        {statusConfig.label}
                    </span>
                </div>

                {/* Client & Title (Bottom Left) */}
                <div className="absolute bottom-4 left-5 right-5 text-white">
                    <div className="flex items-center gap-2 mb-1 opacity-90">
                        <UserIcon size={12} />
                        <span className="text-xs font-medium">{project.client}</span>
                    </div>
                    <h3 className="text-xl font-bold leading-tight shadow-black/10 drop-shadow-sm truncate">{project.name}</h3>
                </div>
            </div>

            {/* 2. Content Body */}
            <div className="p-5 flex-1 flex flex-col">
                
                {/* Stats Matrix (Horizontal) */}
                <div className="flex items-center justify-between py-3 border-b border-stone-100 mb-4">
                    <div className="text-center px-2 flex-1">
                        <p className="text-[10px] text-stone-400 font-bold uppercase mb-0.5">Order Total</p>
                        <p className={`text-sm font-mono font-bold ${orderTotal > 0 ? 'text-stone-800' : 'text-stone-300'}`}>
                            NT$ {orderTotal.toLocaleString()}
                        </p>
                    </div>
                    <div className="w-px h-8 bg-stone-100"></div>
                    <div className="text-center px-2">
                        <p className="text-[10px] text-stone-400 font-bold uppercase mb-0.5">Items</p>
                        <p className="text-sm font-bold text-stone-800">{itemsCount}</p>
                    </div>
                    <div className="w-px h-8 bg-stone-100"></div>
                    <div className="text-center px-2">
                        <p className="text-[10px] text-stone-400 font-bold uppercase mb-0.5">Files</p>
                        <p className="text-sm font-bold text-stone-800">{filesCount}</p>
                    </div>
                </div>

                {/* Micro Progress Tracker */}
                <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Progress</span>
                        <span className="text-[10px] font-bold text-brand-bronze">{Math.round((currentStep / 6) * 100)}%</span>
                    </div>
                    <div className="flex items-center justify-between relative px-1">
                        {/* Connecting Line */}
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-stone-100 -z-10 rounded-full"></div>
                        <div 
                            className="absolute left-0 top-1/2 h-0.5 bg-brand-bronze -z-10 rounded-full transition-all duration-1000"
                            style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                        ></div>

                        {steps.map((s) => {
                            const isDone = s <= currentStep;
                            const isCurrent = s === currentStep;
                            return (
                                <div 
                                    key={s} 
                                    className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-500 z-10
                                        ${isDone ? 'bg-brand-bronze border-brand-bronze' : 'bg-white border-stone-200'}
                                        ${isCurrent ? 'ring-2 ring-brand-bronze/30 scale-125' : ''}
                                    `}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Hover Actions Overlay (Desktop) or Static (Mobile) */}
                <div className="mt-5 grid grid-cols-2 gap-2 opacity-100 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onQuickQuote(); }}
                        className="bg-stone-50 border border-stone-200 text-stone-600 py-2.5 rounded-xl text-xs font-bold hover:bg-stone-800 hover:text-white hover:border-stone-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                        <FileText size={14} /> 編輯估價單
                    </button>
                    {project.status === '規劃中' ? (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onQuickAdd(); }}
                            className="bg-stone-50 border border-stone-200 text-stone-600 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-bronze hover:text-white hover:border-brand-bronze transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Plus size={14} /> 追加商品
                        </button>
                    ) : (
                        <button className="bg-stone-50 border border-stone-200 text-stone-400 py-2.5 rounded-xl text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1.5">
                            <CreditCard size={14} /> 
                            {project.status === '已完工' ? '已結案' : '處理中'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
