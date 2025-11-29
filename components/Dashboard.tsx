
import React, { useState, useMemo } from 'react';
import { TrendingUp, Zap, AlertCircle, Calendar, ArrowUpRight, Gift, Plus, Building2, ArrowRight, Wallet, FileText, ShoppingCart, Upload, Headphones, MapPin, Package, Crown, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AppView, User, Project, ProjectFile, GalleryItem } from '../types';
import { ProjectDetailDialog } from './ProjectDetailDialog';
import { MOCK_MONTHLY_REBATES } from '../constants';

const StatCard = ({ title, value, subtext, icon: Icon, alert, progress }: any) => {
    return (
        <div className={`relative bg-white border p-6 rounded-2xl transition-all duration-300 group hover:shadow-lg flex flex-col justify-between h-full overflow-hidden
            ${alert ? 'border-blue-200 bg-blue-50/30' : 'border-stone-100'}
        `}>
            {alert && <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-bl-full -mr-8 -mt-8 z-0"></div>}
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-xl ${alert ? 'bg-blue-100 text-blue-600' : 'bg-stone-50 text-stone-500 group-hover:bg-brand-bronze group-hover:text-white transition-colors'}`}>
                    <Icon size={20} strokeWidth={2} />
                </div>
                {alert && (
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                )}
            </div>
            
            <div className="relative z-10">
                <h3 className="text-3xl font-serif font-bold text-stone-800 tracking-tight">{value}</h3>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-1">{title}</p>
                
                {progress ? (
                    <div className="mt-4">
                        <div className="flex justify-between text-[10px] font-medium text-stone-500 mb-1.5">
                            <span>{progress.label}</span>
                            <span>{progress.percent}%</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-bronze rounded-full transition-all duration-1000" style={{ width: `${progress.percent}%` }}></div>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1.5">{subtext}</p>
                    </div>
                ) : (
                    subtext && <p className={`text-xs mt-3 font-medium flex items-center gap-1 ${alert ? 'text-blue-600' : 'text-stone-500'}`}>{subtext}</p>
                )}
            </div>
        </div>
    );
};

interface DashboardProps {
  onChangeView: (view: AppView) => void;
  user: User | null;
  projects: Project[];
  onOpenCreateProject: () => void;
  onSelectProject: (id: string) => void;
  onUpdateStatus: (id: string, status: Project['status']) => void;
  onUpdateNotes?: (id: string, notes: string) => void; 
  onUploadFile?: (id: string, files: ProjectFile[]) => void; 
  onQuickAdd: (id: string) => void;
  onGallerySubmission?: (item: GalleryItem) => void;
  onPaymentComplete?: (id: string) => void;
  onNotifyPayment?: (id: string) => void;
  onOpenBooking?: () => void;
  onCreateAddon?: (id: string) => void; // New prop
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    onChangeView, user, projects, onOpenCreateProject, onSelectProject, onUpdateStatus, onUpdateNotes, onUploadFile, onQuickAdd, onGallerySubmission, onPaymentComplete, onNotifyPayment, onOpenBooking, onCreateAddon
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  // --- Calculations (REAL DATA) ---
  
  const getStatusStyle = (status: string) => {
    switch (status) {
        case '已付款': return 'bg-brand-bronze/10 text-brand-bronze border-brand-bronze/20';
        case '已出貨': return 'bg-purple-50 text-purple-600 border-purple-100';
        case '已完工': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case '估價審核中': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
        case '等待付款': return 'bg-blue-50 text-blue-600 border-blue-100';
        default: return 'bg-stone-100 text-stone-500 border-stone-200';
    }
  };

  const getProjectProgress = (status: string) => {
    const map: Record<string, number> = {
        '已完工': 100,
        '已出貨': 90,
        '已付款': 75,
        '等待付款': 50,
        '估價審核中': 30,
        '規劃中': 10
    };
    return map[status] || 5;
  };

  const projectStatusData = [
    { name: '規劃中', value: projects.filter(p => p.status === '規劃中').length, color: '#d6d3d1' },
    { name: '審核中', value: projects.filter(p => p.status === '估價審核中').length, color: '#fbbf24' },
    { name: '待付款', value: projects.filter(p => p.status === '等待付款').length, color: '#3b82f6' },
    { name: '進行中', value: projects.filter(p => p.status === '已付款' || p.status === '已出貨').length, color: '#A89166' },
    { name: '已完工', value: projects.filter(p => p.status === '已完工').length, color: '#10b981' },
  ].filter(d => d.value > 0);

  // Current Month Spend Calculation
  const now = new Date();
  const currentMonthAmount = projects.reduce((acc, project) => {
      try {
          let pDate = new Date(project.date);
          if (isNaN(pDate.getTime())) return acc; 

          const isCurrentMonth = pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
          // Logic: Count spend if paid
          const isPaid = project.paymentStatus === 'paid';
          
          if (isCurrentMonth && isPaid) {
              const projectTotal = project.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              return acc + projectTotal;
          }
      } catch (e) {}
      return acc;
  }, 0);

  // Rebate Progress Logic
  const sortedRebates = [...MOCK_MONTHLY_REBATES].sort((a, b) => a.threshold - b.threshold);
  const nextRebate = sortedRebates.find(r => r.threshold > currentMonthAmount);
  const currentRebateRule = [...sortedRebates].reverse().find(r => currentMonthAmount >= r.threshold);
  
  const gapAmount = nextRebate ? nextRebate.threshold - currentMonthAmount : 0;
  const progressPercent = nextRebate 
    ? Math.min(100, Math.max(5, ((currentMonthAmount - (currentRebateRule?.threshold || 0)) / (nextRebate.threshold - (currentRebateRule?.threshold || 0))) * 100))
    : 100;

  // Trend Data (Mock for visualization structure, but scaled to real total)
  const trendData = useMemo(() => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.map((m, i) => ({
          name: m,
          spend: i === 5 ? currentMonthAmount : Math.floor(currentMonthAmount * (0.5 + Math.random() * 0.5)) 
      }));
  }, [currentMonthAmount]);

  const pendingPayments = projects.filter(p => p.status === '等待付款').length;
  const activeProjectsCount = projects.filter(p => p.status !== '已完工').length;

  return (
    <>
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
              onSelectProjectForQuote={(id) => { onSelectProject(id); setSelectedProjectId(null); }}
              onQuickAdd={(id) => { onQuickAdd(id); setSelectedProjectId(null); }}
              onPaymentComplete={onPaymentComplete}
              onNotifyPayment={onNotifyPayment}
              onCreateAddon={onCreateAddon}
          />
      )}

      <div className="space-y-8 animate-fade-in pb-16 max-w-[1600px] mx-auto">
        
        {/* 1. Hero / Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-serif font-medium text-stone-800 tracking-tight">
                    早安，{user?.name}
                </h1>
                {user?.tier && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border
                        ${user.tier === '黑鑽總監' ? 'bg-stone-900 text-brand-bronze border-brand-bronze' : 'bg-white text-stone-500 border-stone-200'}
                    `}>
                        <Crown size={10} /> {user.tier}
                    </span>
                )}
            </div>
            <p className="text-stone-500 text-sm font-light">
                這裡是你目前的專案概況與營運數據總覽。
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={onOpenBooking}
                className="bg-white border border-stone-200 text-stone-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-stone-50 hover:text-stone-900 transition-all flex items-center gap-2 shadow-sm"
             >
                <MapPin size={16} /> 預約門市
             </button>
             <button 
                onClick={onOpenCreateProject}
                className="bg-stone-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-stone-700 transition-all flex items-center gap-2 shadow-lg shadow-stone-200 hover:shadow-xl active:scale-95"
             >
                <Plus size={16} /> 開始新專案
             </button>
          </div>
        </div>

        {/* 2. KPI Grid (Real Data) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Monthly Spend */}
          <StatCard 
            title="本月累計消費 (已付)" 
            value={`NT$ ${currentMonthAmount.toLocaleString()}`} 
            subtext="較上月同期成長"
            icon={Wallet}
          />
          
          {/* Card 2: Rebate Progress */}
          <StatCard 
            title="回饋達成進度" 
            value={`${Math.round(progressPercent)}%`}
            icon={Gift}
            progress={{
                label: nextRebate ? `再消費 $${gapAmount.toLocaleString()}` : '已達最高門檻',
                percent: progressPercent
            }}
            subtext={nextRebate ? `目標：${user?.tier}級別回饋` : '恭喜！享有最高回饋'}
          />

          {/* Card 3: Action Required */}
          <StatCard 
            title="待付款項目" 
            value={pendingPayments} 
            subtext={pendingPayments > 0 ? "請盡速確認以免延誤工期" : "目前無待處理款項"}
            icon={AlertCircle}
            alert={pendingPayments > 0}
          />

          {/* Card 4: Active Projects */}
          <StatCard 
            title="進行中專案" 
            value={activeProjectsCount} 
            subtext="含規劃中與施工中案件"
            icon={Building2}
          />
        </div>

        {/* 3. Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Recent Projects List */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
                    <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                        <h3 className="font-serif font-bold text-stone-800 text-lg flex items-center gap-2">
                           <FileText size={18} className="text-brand-bronze"/> 近期專案動態
                        </h3>
                        <button 
                            onClick={() => onChangeView(AppView.PROJECTS)}
                            className="text-stone-400 hover:text-stone-800 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                           查看全部 <ArrowRight size={12} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-stone-50/50 text-xs text-stone-400 font-bold uppercase tracking-wider border-b border-stone-100">
                                <tr>
                                    <th className="px-6 py-4">專案名稱</th>
                                    <th className="px-6 py-4">目前狀態</th>
                                    <th className="px-6 py-4 text-right">訂單金額 Total</th>
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {projects.slice(0, 5).map((project) => {
                                    // Real-time calculation of order total
                                    const total = project.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                                    const progress = getProjectProgress(project.status);
                                    const isConfirmed = ['已付款', '已出貨', '已完工'].includes(project.status);

                                    return (
                                        <tr 
                                            key={project.id} 
                                            onClick={() => setSelectedProjectId(project.id)}
                                            className="group hover:bg-stone-50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-stone-800">{project.name}</div>
                                                <div className="text-xs text-stone-400 mt-0.5">{project.client} • {project.date}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${getStatusStyle(project.status)}`}>
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className={`font-mono ${isConfirmed ? 'text-stone-800 font-bold text-base' : 'text-stone-400 font-medium'}`}>
                                                    NT$ {total.toLocaleString()}
                                                </div>
                                                <div className="flex items-center justify-end gap-2 mt-1">
                                                    <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                                project.status === '已完工' ? 'bg-emerald-500' :
                                                                project.status === '已出貨' ? 'bg-purple-500' :
                                                                project.status === '已付款' ? 'bg-brand-bronze' :
                                                                'bg-stone-300'
                                                            }`} 
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] text-stone-400 font-mono">{progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-300 group-hover:text-brand-bronze group-hover:border-brand-bronze transition-colors">
                                                    <ChevronRight size={14} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {projects.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-stone-400">
                                            <Package size={40} className="mx-auto mb-3 opacity-20"/>
                                            <p>目前沒有專案資料</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Right Column: Charts & Quick Actions */}
            <div className="space-y-6">
                
                {/* Status Chart */}
                <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm min-h-[300px] flex flex-col">
                    <h3 className="font-serif font-bold text-stone-800 text-lg mb-2">案件狀態分佈</h3>
                    <div className="flex-1 relative">
                        {projectStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={projectStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {projectStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} 
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-stone-300 text-xs">
                                <Package size={32} className="mb-2 opacity-20"/> 尚無數據
                            </div>
                        )}
                        
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                             <span className="text-3xl font-bold text-stone-800">{projects.length}</span>
                             <span className="text-[10px] text-stone-400 uppercase tracking-wider">Total</span>
                        </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2">
                        {projectStatusData.map(d => (
                            <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-stone-500 font-medium">
                                <span className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}></span>
                                {d.name} ({d.value})
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">常用捷徑 Shortcuts</p>
                    <div className="space-y-2">
                        <button onClick={() => onChangeView(AppView.CATALOG)} className="w-full bg-white p-3 rounded-xl border border-stone-200 hover:border-brand-bronze hover:text-brand-bronze transition-all shadow-sm flex items-center gap-3 text-xs font-bold text-stone-600 group">
                            <div className="p-1.5 bg-stone-100 rounded-lg group-hover:bg-brand-bronze group-hover:text-white transition-colors"><ShoppingCart size={14}/></div>
                            瀏覽產品目錄
                        </button>
                        <button onClick={() => onOpenCreateProject()} className="w-full bg-white p-3 rounded-xl border border-stone-200 hover:border-brand-bronze hover:text-brand-bronze transition-all shadow-sm flex items-center gap-3 text-xs font-bold text-stone-600 group">
                            <div className="p-1.5 bg-stone-100 rounded-lg group-hover:bg-brand-bronze group-hover:text-white transition-colors"><Upload size={14}/></div>
                            上傳設計圖檔
                        </button>
                        <button onClick={() => onChangeView(AppView.AI_CONSULTANT)} className="w-full bg-white p-3 rounded-xl border border-stone-200 hover:border-brand-bronze hover:text-brand-bronze transition-all shadow-sm flex items-center gap-3 text-xs font-bold text-stone-600 group">
                            <div className="p-1.5 bg-stone-100 rounded-lg group-hover:bg-brand-bronze group-hover:text-white transition-colors"><Headphones size={14}/></div>
                            聯繫 AI 顧問
                        </button>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </>
  );
};
