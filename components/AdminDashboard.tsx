
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, Package, Users, MessageSquare, Gift, Image as ImageIcon, 
  Settings, Edit2, Trash2, Plus, Save, Search, Check, X, Crown, DollarSign, 
  FileText, ChevronRight, Filter, Shield, Ban, CheckCircle, Smartphone, MapPin, Eye,
  Send, AlertCircle, Briefcase, UserCog, Lock, Tag, ArrowUp, ArrowDown, PenTool, LayoutGrid, List, AlertTriangle, FolderOpen, Download, Upload, ShoppingCart, Minus, ArrowRight, Paperclip, Globe, Grid, CreditCard, Calendar, TrendingUp, PieChart as PieChartIcon, BarChart3, Loader2, Activity, Box, ArrowUpRight, ArrowDownRight, ClipboardList, Clock, GripVertical, Mail, Coffee, Zap, Info, StickyNote,
  ChevronDown, Truck, Flag
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend, RadialBarChart, RadialBar
} from 'recharts';
import { Product, RewardTier, GalleryItem, User, ChatSession, QuoteItem, Project, Annotation, ProjectFile, MonthlyRebateRule, Attachment, Booking } from '../types';
import { Whiteboard } from './Whiteboard';
import { ImagePreviewModal } from './ImagePreviewModal';
import { uploadFile, provisionAccount, db } from '../firebase';
import { doc, setDoc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';

interface AdminDashboardProps {
  currentUser: User | null;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  
  onCreateProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;

  rewards: RewardTier[];
  setRewards: React.Dispatch<React.SetStateAction<RewardTier[]>>;
  monthlyRebates: MonthlyRebateRule[];
  setMonthlyRebates: React.Dispatch<React.SetStateAction<MonthlyRebateRule[]>>;
  gallery: GalleryItem[];
  setGallery: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  specKeys: string[];
  setSpecKeys: React.Dispatch<React.SetStateAction<string[]>>;
  chatSessions: ChatSession[];
  onAdminReply: (userId: string, text: string, attachments?: Attachment[]) => void;
  onAdminRead: (userId: string) => void;
  projects: Project[];
  onAdminUpdateQuote: (projectId: string, action: 'add' | 'remove', item?: QuoteItem | Product, index?: number) => void;
  onAdminUpdateProjectStatus: (projectId: string, status: Project['status']) => void;
  onConfirmPayment: (projectId: string) => void;
  onAdminUpdateProject?: (projectId: string, updates: Partial<Project>) => void; 
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onClearAnnotations: (fileId: string) => void;
  bookings: Booking[];
  onUpdateBookingStatus: (id: string, updates: Partial<Booking>) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  currentUser, products, setProducts, 
  onCreateProduct, onUpdateProduct, onDeleteProduct,
  rewards, setRewards, 
  monthlyRebates, setMonthlyRebates, gallery, setGallery, 
  users, setUsers, categories, setCategories, specKeys, setSpecKeys,
  chatSessions, onAdminReply, onAdminRead,
  projects, onAdminUpdateQuote, onAdminUpdateProjectStatus, onConfirmPayment, onAdminUpdateProject,
  annotations, onAddAnnotation, onClearAnnotations,
  bookings, onUpdateBookingStatus
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const isSuperAdmin = currentUser?.role === 'admin';
  const hasStaffAccess = ['admin', 'sales', 'support'].includes(currentUser?.role || '');

  // --- Analytics Calculation Logic ---
  const analytics = useMemo(() => {
    // 1. Financials
    const paidProjects = projects.filter(p => p.paymentStatus === 'paid');
    const totalRevenue = paidProjects.reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);
    const pipelineProjects = projects.filter(p => p.status !== '已完工' && p.paymentStatus !== 'paid');
    const potentialRevenue = pipelineProjects.reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);

    // 2. Product Performance
    const productSales: Record<string, {name: string, qty: number, revenue: number}> = {};
    projects.forEach(p => {
        p.items.forEach(item => {
            if (!productSales[item.id]) {
                productSales[item.id] = { name: item.name, qty: 0, revenue: 0 };
            }
            productSales[item.id].qty += item.quantity;
            productSales[item.id].revenue += item.quantity * item.price;
        });
    });
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    // 3. Inventory Health
    let stockHealth = { safe: 0, low: 0, out: 0 };
    const lowStockItems: Product[] = [];
    products.forEach(p => {
        if (p.stock === 0) stockHealth.out++;
        else if (p.stock < 20) {
            stockHealth.low++;
            lowStockItems.push(p);
        }
        else stockHealth.safe++;
    });
    const stockData = [
        { name: '充足 Safe', value: stockHealth.safe, color: '#10b981' },
        { name: '低水位 Low', value: stockHealth.low, color: '#f59e0b' },
        { name: '缺貨 Out', value: stockHealth.out, color: '#ef4444' },
    ];

    // 4. Project Status Funnel (Updated Colors)
    const statusData = [
        { name: '規劃中', value: projects.filter(p => p.status === '規劃中').length, fill: '#d6d3d1' },
        { name: '審核中', value: projects.filter(p => p.status === '估價審核中').length, fill: '#fbbf24' },
        { name: '待付款', value: projects.filter(p => p.status === '等待付款').length, fill: '#3b82f6' },
        { name: '進行中', value: projects.filter(p => p.status === '已付款' || p.status === '已出貨').length, fill: '#A89166' },
        { name: '已完工', value: projects.filter(p => p.status === '已完工').length, fill: '#10b981' },
    ];

    // 5. Revenue Trend Mock (Simulated based on project dates)
    const revenueData = [
        { name: '1月', revenue: 120000, pipeline: 50000 },
        { name: '2月', revenue: 180000, pipeline: 80000 },
        { name: '3月', revenue: 150000, pipeline: 120000 },
        { name: '4月', revenue: 250000, pipeline: 100000 },
        { name: '5月', revenue: 320000, pipeline: 150000 },
        { name: '6月', revenue: totalRevenue > 320000 ? totalRevenue : 450000, pipeline: potentialRevenue },
    ];

    return { totalRevenue, potentialRevenue, topProducts, stockData, lowStockItems, statusData, revenueData };
  }, [projects, products]);

  const menuItems = [
    { id: 'overview', label: '營運總覽', icon: LayoutDashboard },
    { id: 'bookings', label: '預約 CRM', icon: Calendar },
    { id: 'support', label: '客服中心', icon: MessageSquare },
    { id: 'projects', label: '專案管理', icon: Briefcase },
    { id: 'products', label: '產品目錄', icon: Package },
    { id: 'users', label: '帳號權限', icon: Users },
    { id: 'rewards', label: '獎勵設定', icon: Gift },
    { id: 'gallery', label: '藝廊管理', icon: ImageIcon },
  ];

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in relative">
       {/* Header & Tabs */}
       <div className="bg-white p-2 rounded-xl border border-stone-200 shadow-sm flex overflow-x-auto gap-2 no-scrollbar shrink-0">
          {menuItems.map(item => (
             <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                   ${activeTab === item.id ? 'bg-stone-800 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'}
                `}
             >
                <item.icon size={16} />
                {item.label}
             </button>
          ))}
       </div>

       <div className="flex-1 min-h-0 overflow-hidden relative">
           {activeTab === 'overview' && (
               <div className="h-full overflow-y-auto p-1 pr-2 space-y-6 custom-scrollbar pb-20">
                   {/* KPI Cards */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       <KpiCard title="實際已收營收" value={`NT$ ${analytics.totalRevenue.toLocaleString()}`} trend="+12.5%" icon={DollarSign} color="bronze"/>
                       <KpiCard title="預估潛在營收 (Pipeline)" value={`NT$ ${analytics.potentialRevenue.toLocaleString()}`} trend="+5.2%" icon={Briefcase} color="stone" subtext={`${projects.filter(p => p.status === '規劃中').length} 個規劃中專案`}/>
                       <KpiCard title="活躍設計師會員" value={users.filter(u => u.role === 'designer').length} trend="+3" icon={Users} color="stone"/>
                       <KpiCard title="低庫存/缺貨警示" value={analytics.stockData[1].value + analytics.stockData[2].value} trend={analytics.stockData[2].value > 0 ? "急需補貨" : "庫存健康"} isAlert={analytics.stockData[2].value > 0} icon={Package} color="red"/>
                   </div>

                   {/* Charts Section */}
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                       {/* Main Revenue Chart */}
                       <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                           <h3 className="text-lg font-serif font-bold text-stone-800 mb-6 flex items-center gap-2">
                               <TrendingUp size={20} className="text-brand-bronze"/> 營收與預估趨勢
                           </h3>
                           <div className="h-72">
                               <ResponsiveContainer width="100%" height="100%">
                                   <AreaChart data={analytics.revenueData}>
                                       <defs>
                                           <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                               <stop offset="5%" stopColor="#A89166" stopOpacity={0.3}/>
                                               <stop offset="95%" stopColor="#A89166" stopOpacity={0}/>
                                           </linearGradient>
                                           <linearGradient id="colorPipeline" x1="0" y1="0" x2="0" y2="1">
                                               <stop offset="5%" stopColor="#d6d3d1" stopOpacity={0.3}/>
                                               <stop offset="95%" stopColor="#d6d3d1" stopOpacity={0}/>
                                           </linearGradient>
                                       </defs>
                                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4"/>
                                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#a8a29e', fontSize:12}}/>
                                       <YAxis axisLine={false} tickLine={false} tick={{fill:'#a8a29e', fontSize:12}} tickFormatter={(val)=>`$${val/1000}k`}/>
                                       <RechartsTooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}/>
                                       <Legend />
                                       <Area type="monotone" dataKey="revenue" name="實際營收" stroke="#A89166" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                       <Area type="monotone" dataKey="pipeline" name="潛在案源" stroke="#d6d3d1" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPipeline)" />
                                   </AreaChart>
                               </ResponsiveContainer>
                           </div>
                       </div>

                       {/* Project Status Pie Chart */}
                       <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                           <h3 className="text-lg font-serif font-bold text-stone-800 mb-2 flex items-center gap-2">
                               <PieChartIcon size={20} className="text-stone-400"/> 專案狀態分佈
                           </h3>
                           <div className="h-64 relative">
                               <ResponsiveContainer width="100%" height="100%">
                                   <PieChart>
                                       <Pie
                                           data={analytics.statusData}
                                           cx="50%"
                                           cy="50%"
                                           innerRadius={60}
                                           outerRadius={80}
                                           paddingAngle={5}
                                           dataKey="value"
                                       >
                                           {analytics.statusData.map((entry, index) => (
                                               <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0}/>
                                           ))}
                                       </Pie>
                                       <RechartsTooltip contentStyle={{borderRadius:'8px'}} />
                                       <Legend verticalAlign="bottom" height={36}/>
                                   </PieChart>
                               </ResponsiveContainer>
                               <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                                   <span className="text-3xl font-bold text-stone-800">{projects.length}</span>
                                   <span className="text-xs text-stone-400">Total Projects</span>
                               </div>
                           </div>
                       </div>
                   </div>

                   {/* Bottom Grid: Top Products */}
                   <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-serif font-bold text-stone-800 mb-6 flex items-center gap-2">
                                <BarChart3 size={20} className="text-emerald-500"/> 熱銷產品排行 (Top 5)
                            </h3>
                            <div className="h-60">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.topProducts} layout="vertical" margin={{left: 20}}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f5f5f4"/>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={150} tick={{fontSize:12, fill:'#57534e'}} axisLine={false} tickLine={false}/>
                                        <RechartsTooltip cursor={{fill: '#f5f5f4'}} contentStyle={{borderRadius:'8px'}} formatter={(val:number)=>`NT$ ${val.toLocaleString()}`}/>
                                        <Bar dataKey="revenue" name="銷售額" fill="#A89166" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                   </div>
               </div>
           )}

           {activeTab === 'bookings' && hasStaffAccess && <BookingManager bookings={bookings} projects={projects} users={users} onUpdateBooking={onUpdateBookingStatus} />}
           {activeTab === 'rewards' && <RewardManager currentUser={currentUser} rewards={rewards} setRewards={setRewards} monthlyRebates={monthlyRebates} setMonthlyRebates={setMonthlyRebates} />}
           {activeTab === 'projects' && hasStaffAccess && <ProjectManager projects={projects} onUpdateStatus={onAdminUpdateProjectStatus} onConfirmPayment={onConfirmPayment} onUpdateProject={onAdminUpdateProject}/>}
           {activeTab === 'products' && hasStaffAccess && <ProductManager products={products} setProducts={setProducts} categories={categories} setCategories={setCategories} specKeys={specKeys} setSpecKeys={setSpecKeys} onCreate={onCreateProduct} onUpdate={onUpdateProduct} onDelete={onDeleteProduct}/>}
           {activeTab === 'users' && <UserManager users={users} setUsers={setUsers} rewards={rewards} currentUser={currentUser} />}
           {activeTab === 'support' && hasStaffAccess && <SupportManager chatSessions={chatSessions} onReply={onAdminReply} onRead={onAdminRead} projects={projects} onUpdateQuote={onAdminUpdateQuote} onUpdateStatus={onAdminUpdateProjectStatus} annotations={annotations} onAddAnnotation={onAddAnnotation} onClearAnnotations={onClearAnnotations} allProducts={products} />}
           {activeTab === 'gallery' && hasStaffAccess && <GalleryManager gallery={gallery} setGallery={setGallery} />}
       </div>
    </div>
  );
};

const KpiCard = ({ title, value, trend, icon: Icon, color, subtext, isAlert }: any) => {
  const colorClasses: any = { bronze: "bg-brand-bronze text-white", stone: "bg-stone-100 text-stone-600", red: "bg-red-100 text-red-600", };
  return <div className={`p-6 rounded-2xl border border-stone-100 bg-white shadow-sm flex flex-col justify-between ${isAlert ? 'border-red-200 bg-red-50' : ''}`}><div className="flex justify-between items-start mb-4"><div className={`p-3 rounded-xl ${colorClasses[color] || 'bg-stone-100'}`}><Icon size={20} /></div>{trend && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{trend}</span>}</div><div><h3 className="text-2xl font-bold text-stone-800">{value}</h3><p className="text-xs text-stone-500 uppercase font-bold tracking-wider mt-1">{title}</p>{subtext && <p className="text-xs text-stone-400 mt-2">{subtext}</p>}</div></div>;
};

// --- ENHANCED BOOKING MANAGER ---
const BookingManager = ({ bookings, projects, users, onUpdateBooking }: any) => {
    // ... (No changes here, omitted for brevity)
    // Assuming same implementation as previous file
    // Re-rendering it for completeness of the file content
    const [filter, setFilter] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const filteredBookings = bookings.filter((b: any) => filter === 'all' || b.status === filter);
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12}/> 待確認</span>;
            case 'confirmed': return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12}/> 已確認</span>;
            case 'completed': return <span className="bg-stone-100 text-stone-500 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-fit"><Check size={12}/> 已完成</span>;
            case 'cancelled': return <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-fit"><X size={12}/> 已取消</span>;
            default: return status;
        }
    };
    const getUserInfo = (userId: string) => users.find((u: User) => u.id === userId || u.email === userId);
    return (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-serif text-stone-800">門市預約管理 CRM</h2>
                    <p className="text-xs text-stone-500 mt-1">管理客戶來訪預約、準備樣品與內部溝通</p>
                </div>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-stone-100">
                    <option value="all">所有狀態</option>
                    <option value="pending">待確認</option>
                    <option value="confirmed">已確認</option>
                    <option value="completed">已完成</option>
                </select>
            </div>
            <div className="flex-1 overflow-auto border border-stone-100 rounded-lg relative">
                <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-xs text-stone-500 uppercase font-bold sticky top-0 z-10">
                        <tr><th className="px-4 py-3">預約資訊</th><th className="px-4 py-3">客戶</th><th className="px-4 py-3">專案 / 備註</th><th className="px-4 py-3">內部備註</th><th className="px-4 py-3">狀態</th><th className="px-4 py-3 text-right">詳情</th></tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {filteredBookings.map((b: any) => {
                            const userDetails = getUserInfo(b.userId);
                            return (
                                <tr key={b.id} onClick={() => setSelectedBooking(b)} className="hover:bg-stone-50 cursor-pointer group transition-colors">
                                    <td className="px-4 py-4 align-top"><div className="font-mono font-bold text-stone-800">{b.date}</div><div className="text-brand-bronze font-bold text-lg mt-1">{b.time}</div></td>
                                    <td className="px-4 py-4 align-top"><div className="font-bold text-stone-800">{b.userName}</div><div className="text-xs text-stone-500 mt-0.5">{b.userPhone}</div>{userDetails?.tier && userDetails.tier !== '設計師' && (<span className="inline-block mt-1 px-1.5 py-0.5 bg-stone-900 text-brand-bronze text-[10px] rounded border border-brand-bronze">{userDetails.tier}</span>)}</td>
                                    <td className="px-4 py-4 align-top max-w-[200px]"><div className="font-medium text-stone-800 flex items-center gap-1">{b.projectId ? <Briefcase size={12} className="text-stone-400"/> : <MapPin size={12} className="text-stone-400"/>}{b.projectName}</div><div className="text-xs text-stone-400 mt-1 line-clamp-2">{b.notes || '無客戶備註'}</div></td>
                                    <td className="px-4 py-4 align-top">{b.adminNotes ? (<div className="flex items-start gap-1 text-xs text-stone-600 bg-yellow-50 p-2 rounded border border-yellow-100 max-w-[150px]"><StickyNote size={12} className="text-yellow-600 shrink-0 mt-0.5"/><span className="line-clamp-2">{b.adminNotes}</span></div>) : (<span className="text-xs text-stone-300 italic group-hover:text-stone-400">點擊新增</span>)}</td>
                                    <td className="px-4 py-4 align-top">{getStatusBadge(b.status)}</td>
                                    <td className="px-4 py-4 align-top text-right"><button className="text-stone-300 group-hover:text-stone-800 p-1 rounded-full hover:bg-stone-200 transition-colors"><ChevronRight size={18} /></button></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredBookings.length === 0 && <div className="p-20 text-center text-stone-400 flex flex-col items-center"><Calendar size={48} className="mb-4 opacity-20"/><p>目前沒有符合條件的預約</p></div>}
            </div>
            {selectedBooking && <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} onUpdate={onUpdateBooking} userInfo={getUserInfo(selectedBooking.userId)}/>}
        </div>
    );
};
// --- NEW BOOKING DETAIL MODAL ---
const BookingDetailModal: React.FC<{ booking: Booking, onClose: () => void, onUpdate: (id: string, updates: Partial<Booking>) => void, userInfo?: User }> = ({ booking, onClose, onUpdate, userInfo }) => { const [adminNotes, setAdminNotes] = useState(booking.adminNotes || ''); const [isSaving, setIsSaving] = useState(false); const handleSaveNotes = () => { setIsSaving(true); setTimeout(() => { onUpdate(booking.id, { adminNotes }); setIsSaving(false); }, 500); }; const handleStatusChange = (status: Booking['status']) => { if(confirm(`確定要將狀態更改為「${status}」嗎？`)) { onUpdate(booking.id, { status }); onClose(); } }; return createPortal(<div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm"><div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-fade-in"><div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50"><div><div className="flex items-center gap-3 mb-1"><h3 className="text-xl font-serif font-bold text-stone-800">預約詳細資料</h3><span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : booking.status === 'completed' ? 'bg-stone-200 text-stone-600' : 'bg-red-50 text-red-500'}`}>{booking.status.toUpperCase()}</span></div><p className="text-xs text-stone-500 font-mono">ID: {booking.id}</p></div><button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full text-stone-400 hover:text-stone-800 transition-colors"><X size={20} /></button></div><div className="flex-1 overflow-y-auto p-0 flex flex-col md:flex-row"><div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-stone-100 space-y-6"><div className="bg-stone-900 text-white p-4 rounded-xl flex items-center justify-between shadow-lg"><div><p className="text-xs text-stone-400 uppercase tracking-widest font-bold">預約時間</p><p className="text-2xl font-mono font-bold">{booking.date}</p></div><div className="text-right"><p className="text-3xl font-bold text-brand-bronze">{booking.time}</p></div></div><div><h4 className="text-sm font-bold text-stone-800 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={14} className="text-stone-400"/> 客戶資料</h4><div className="bg-stone-50 p-4 rounded-xl border border-stone-100 space-y-3"><div className="flex justify-between"><span className="text-sm text-stone-500">姓名</span><span className="text-sm font-bold text-stone-800">{booking.userName}</span></div><div className="flex justify-between"><span className="text-sm text-stone-500">電話</span><span className="text-sm font-mono text-stone-800">{booking.userPhone}</span></div>{userInfo && (<><div className="flex justify-between"><span className="text-sm text-stone-500">公司</span><span className="text-sm text-stone-800">{userInfo.company}</span></div><div className="flex justify-between items-center"><span className="text-sm text-stone-500">等級</span><span className={`text-xs px-2 py-0.5 rounded border ${userInfo.tier === '黑鑽總監' ? 'bg-stone-900 text-brand-bronze border-brand-bronze' : 'bg-white text-stone-600 border-stone-200'}`}>{userInfo.tier || '一般會員'}</span></div></>)}</div></div><div><h4 className="text-sm font-bold text-stone-800 uppercase tracking-widest mb-3 flex items-center gap-2"><Briefcase size={14} className="text-stone-400"/> 需求內容</h4><div className="bg-white border border-stone-200 p-4 rounded-xl"><div className="mb-2"><span className="text-xs text-stone-400 block mb-1">關聯專案</span><span className="font-bold text-stone-800 text-sm">{booking.projectName}</span></div><div><span className="text-xs text-stone-400 block mb-1">客戶備註</span><p className="text-sm text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg">{booking.notes || '無填寫備註'}</p></div></div></div></div><div className="w-full md:w-1/2 p-6 bg-stone-50/30 space-y-6 flex flex-col"><div className="flex-1 flex flex-col"><h4 className="text-sm font-bold text-stone-800 uppercase tracking-widest mb-3 flex items-center gap-2"><StickyNote size={14} className="text-amber-500"/> 內部管理備註 (僅員工可見)</h4><div className="flex-1 flex flex-col bg-yellow-50/50 border border-yellow-200 rounded-xl p-1 focus-within:ring-2 focus-within:ring-yellow-400/50 transition-all"><textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="輸入內部交辦事項..." className="flex-1 w-full bg-transparent border-none outline-none p-3 text-sm text-stone-700 placeholder:text-stone-400 resize-none"/><div className="p-2 flex justify-end border-t border-yellow-200/50"><button onClick={handleSaveNotes} disabled={isSaving} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50">{isSaving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}{isSaving ? '儲存中' : '儲存備註'}</button></div></div><p className="text-[10px] text-stone-400 mt-2 pl-1">* 此區塊內容客戶端不會看到，僅供門市人員交接使用。</p></div><div className="pt-6 border-t border-stone-200"><h4 className="text-sm font-bold text-stone-800 uppercase tracking-widest mb-3">預約狀態操作</h4><div className="grid grid-cols-1 gap-3">{booking.status === 'pending' && (<><button onClick={() => handleStatusChange('confirmed')} className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold shadow-md shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"><CheckCircle size={18}/> 確認預約 (發送通知)</button><button onClick={() => handleStatusChange('cancelled')} className="w-full py-3 bg-white border border-stone-200 text-stone-500 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-medium transition-all">取消預約</button></>)}{booking.status === 'confirmed' && (<><button onClick={() => handleStatusChange('completed')} className="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-700 font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"><Check size={18}/> 標記為已完成 (客戶已到訪)</button><button onClick={() => handleStatusChange('cancelled')} className="w-full py-3 bg-white border border-stone-200 text-stone-500 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-medium transition-all">取消/未到</button></>)}{(booking.status === 'completed' || booking.status === 'cancelled') && (<button onClick={() => handleStatusChange('pending')} className="w-full py-3 bg-stone-100 text-stone-500 rounded-xl hover:bg-stone-200 font-medium transition-all text-xs">重置為待確認狀態</button>)}</div></div></div></div></div></div>, document.body); };

const UserManager: React.FC<{ users: User[], setUsers: any, rewards: RewardTier[], currentUser: User | null }> = ({ users, setUsers, rewards, currentUser }) => { const isSuperAdmin = currentUser?.role === 'admin'; const [subTab, setSubTab] = useState<'staff' | 'designers'>('designers'); const [isEditorOpen, setIsEditorOpen] = useState(false); const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create'); const [selectedUser, setSelectedUser] = useState<User | null>(null); const staffUsers = users.filter(u => ['admin', 'sales', 'support'].includes(u.role)); const designerUsers = users.filter(u => u.role === 'designer'); useEffect(() => { if (!isSuperAdmin) { setSubTab('designers'); } }, [isSuperAdmin]); const handleEdit = (user: User) => { setSelectedUser(user); setEditorMode('edit'); setIsEditorOpen(true); }; const handleCreate = () => { setSelectedUser(null); setEditorMode('create'); setIsEditorOpen(true); }; const handleDeleteUser = async (userId: string) => { if (!confirm("確定要刪除此用戶資料嗎？\n\n注意：這只會刪除資料庫中的用戶資料 (Profile)。\n若要完全禁止該用戶登入，請務必至 Firebase Authentication 控制台刪除該帳號。")) return; if (db) { try { await deleteDoc(doc(db, "users", userId)); alert("用戶資料已從資料庫移除。"); } catch (e) { console.error("Delete failed", e); alert("刪除失敗，請檢查權限或網路。"); } } }; const handleUserSave = async (userData: any) => { if (editorMode === 'create') { try { const uid = await provisionAccount(userData.email, userData.password); const newUser: User = { id: uid, name: userData.name, email: userData.email, role: userData.role, company: userData.company, phone: userData.phone || '', joinDate: new Date().toISOString(), status: 'active', currentSpend: 0 }; if (userData.role === 'designer') { newUser.tier = userData.tier || '設計師'; } await setDoc(doc(db, "users", uid), newUser); alert(`成功建立帳號：${userData.email}`); } catch (e: any) { console.error(e); let msg = e.message; if (msg.includes('email-already-in-use') || e.code === 'auth/email-already-in-use') { msg = "此 Email 已經被註冊過了。"; } alert("建立失敗：" + msg); return; } } else { if (!selectedUser?.id) return; const updates: any = { name: userData.name, role: userData.role, company: userData.company, phone: userData.phone }; if (userData.role === 'designer') { updates.tier = userData.tier; } await updateDoc(doc(db, "users", selectedUser.id), updates); } setIsEditorOpen(false); }; return ( <div className="bg-white border border-stone-200 rounded-2xl p-6 h-full flex flex-col"> <div className="flex justify-between items-center mb-6"> <div><h2 className="text-xl font-serif text-stone-800">用戶權限管理</h2><p className="text-xs text-stone-500 mt-1">管理內部員工與設計師會員資料</p></div> <div className="flex gap-2 p-1 bg-stone-100 rounded-lg"> <button onClick={() => setSubTab('designers')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${subTab === 'designers' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500'}`}>設計師會員 ({designerUsers.length})</button> {isSuperAdmin && ( <button onClick={() => setSubTab('staff')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${subTab === 'staff' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500'}`}>內部團隊 ({staffUsers.length})</button> )} </div> </div> {subTab === 'staff' && isSuperAdmin && ( <div className="mb-4 flex justify-end"> <button onClick={handleCreate} className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-stone-700"> <Plus size={16} /> 新增員工帳號 </button> </div> )} <div className="flex-1 overflow-auto border border-stone-100 rounded-lg"><table className="w-full text-left text-sm"><thead className="bg-stone-50 text-xs text-stone-500 uppercase font-bold sticky top-0 z-10"><tr><th className="px-4 py-3">姓名</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">公司/單位</th><th className="px-4 py-3">角色</th>{subTab === 'designers' && <th className="px-4 py-3">會員等級</th>}<th className="px-4 py-3 text-right">操作</th></tr></thead><tbody className="divide-y divide-stone-100">{(subTab === 'staff' ? staffUsers : designerUsers).map((u) => <tr key={u.id} className="hover:bg-stone-50"><td className="px-4 py-3 font-medium flex items-center gap-2"><div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 text-xs font-bold">{u.name.charAt(0)}</div>{u.name}</td><td className="px-4 py-3 text-stone-500 font-mono text-xs">{u.email}</td><td className="px-4 py-3">{u.company}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-bold border ${u.role === 'admin' ? 'bg-stone-800 text-white border-stone-800' : u.role === 'sales' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : u.role === 'support' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-stone-600 border-stone-200'}`}>{u.role.toUpperCase()}</span></td>{subTab === 'designers' && <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs border ${u.tier === '黑鑽總監' ? 'bg-stone-900 text-brand-bronze border-brand-bronze' : 'bg-stone-50 border-stone-200'}`}>{u.tier || '設計師'}</span></td>}<td className="px-4 py-3 text-right flex gap-1 justify-end"><button onClick={() => handleEdit(u)} className="p-1.5 hover:bg-stone-200 rounded text-stone-500 transition-colors" title="編輯"><Edit2 size={14} /></button>{(isSuperAdmin || subTab === 'designers') && <button onClick={() => u.id && handleDeleteUser(u.id)} className="p-1.5 hover:bg-red-100 hover:text-red-500 rounded text-stone-400 transition-colors" title="刪除資料"><Trash2 size={14} /></button>}</td></tr>)}</tbody></table></div> {isEditorOpen && <UserEditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} mode={editorMode} user={selectedUser} onSave={handleUserSave} rewards={rewards}/>} </div> ); };
// ... UserEditorModal, GalleryManager, ProductManager components remain mostly unchanged but re-included for context ...
const UserEditorModal: React.FC<{ isOpen: boolean, onClose: () => void, mode: 'create' | 'edit', user: User | null, onSave: (data: any) => void, rewards: RewardTier[] }> = ({ isOpen, onClose, mode, user, onSave, rewards }) => { const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '', password: '', company: user?.company || '', phone: user?.phone || '', role: user?.role || 'designer', tier: user?.tier || '設計師' }); const [isSaving, setIsSaving] = useState(false); const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setIsSaving(true); await onSave(formData); setIsSaving(false); }; if (!isOpen) return null; return createPortal(<div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"><div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col"><div className="p-5 border-b border-stone-100 flex justify-between items-center"><h3 className="font-bold text-lg text-stone-800">{mode === 'create' ? '新增帳號' : '編輯用戶資料'}</h3><button onClick={onClose}><X size={20} className="text-stone-400 hover:text-stone-800"/></button></div><form onSubmit={handleSubmit} className="p-6 space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-xs font-bold text-stone-400">姓名</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-sm outline-none focus:border-brand-bronze"/></div><div className="space-y-1"><label className="text-xs font-bold text-stone-400">公司/單位</label><input required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-sm outline-none focus:border-brand-bronze"/></div></div><div className="space-y-1"><label className="text-xs font-bold text-stone-400">Email (帳號)</label><div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"/><input type="email" required disabled={mode === 'edit'} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded p-2 pl-9 text-sm outline-none focus:border-brand-bronze disabled:opacity-60"/></div></div>{mode === 'create' && <div className="space-y-1"><label className="text-xs font-bold text-stone-400">設定密碼</label><div className="relative"><Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"/><input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded p-2 pl-9 text-sm outline-none focus:border-brand-bronze" placeholder="至少 6 位數"/></div></div>}<div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-xs font-bold text-stone-400">角色權限</label><select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-sm outline-none focus:border-brand-bronze"><option value="designer">設計師 (一般會員)</option><option value="sales">業務經理 (Sales)</option><option value="support">客服專員 (Support)</option><option value="admin">超級管理員 (Admin)</option></select></div>{formData.role === 'designer' && <div className="space-y-1"><label className="text-xs font-bold text-stone-400">會員等級</label><select value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-sm outline-none focus:border-brand-bronze">{rewards.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}</select></div>}</div><div className="space-y-1"><label className="text-xs font-bold text-stone-400">電話</label><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-sm outline-none focus:border-brand-bronze"/></div><div className="pt-4 flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-2.5 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 text-sm">取消</button><button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-700 text-sm flex justify-center items-center gap-2">{isSaving && <Loader2 size={14} className="animate-spin" />}{mode === 'create' ? '建立帳號' : '儲存變更'}</button></div></form></div></div>, document.body); };
const GalleryManager = ({ gallery, setGallery }: any) => { const handleStatus = (id: string, status: string) => { setGallery((prev: any[]) => prev.map(item => item.id === id ? { ...item, status } : item)); }; return <div className="bg-white border border-stone-200 rounded-2xl p-6 h-full flex flex-col"><h2 className="text-xl font-serif text-stone-800 mb-6">藝廊投稿審核</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">{gallery.map((item: any) => <div key={item.id} className="border rounded-lg overflow-hidden flex flex-col"><img src={item.image} className="h-40 w-full object-cover" alt={item.title}/><div className="p-3 flex-1 flex flex-col"><h4 className="font-bold">{item.title}</h4><p className="text-xs text-stone-500 mb-2">{item.authorCompany}</p><span className={`text-xs px-2 py-1 rounded w-fit mb-2 ${item.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.status}</span><div className="mt-auto flex gap-2 pt-2">{item.status === 'pending' && <><button onClick={() => handleStatus(item.id, 'approved')} className="flex-1 bg-emerald-600 text-white py-1 rounded text-xs">批准</button><button onClick={() => handleStatus(item.id, 'rejected')} className="flex-1 bg-red-100 text-red-600 py-1 rounded text-xs">退回</button></>}</div></div></div>)}</div></div>; }

// --- UPDATED PROJECT MANAGER FOR NEW WORKFLOW ---
const ProjectManager: React.FC<any> = ({ projects, onUpdateStatus, onConfirmPayment, onUpdateProject }) => { 
    const [filter, setFilter] = useState('all'); 
    
    // Sort projects: Attention required first
    const sortedProjects = [...projects].sort((a, b) => {
        const priorityOrder = { '估價審核中': 0, '已付款': 1, '等待付款': 2, '規劃中': 3, '已出貨': 4, '已完工': 5 };
        return (priorityOrder[a.status as keyof typeof priorityOrder] || 99) - (priorityOrder[b.status as keyof typeof priorityOrder] || 99);
    });

    const filtered = sortedProjects.filter((p: any) => filter === 'all' || p.status === filter); 
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case '估價審核中': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><AlertTriangle size={12}/> 需審核</span>;
            case '等待付款': return <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12}/> 待付款</span>;
            case '已付款': return <span className="bg-brand-bronze text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><DollarSign size={12}/> 已付款 (需出貨)</span>;
            case '已出貨': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Truck size={12}/> 已出貨</span>;
            case '已完工': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12}/> 已完工</span>;
            default: return <span className="bg-stone-100 text-stone-500 px-2 py-1 rounded-full text-xs font-bold w-fit">{status}</span>;
        }
    };

    return (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-serif text-stone-800">專案管理</h2>
                    <p className="text-xs text-stone-500 mt-1">管理報價審核、付款確認與出貨流程</p>
                </div>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none">
                    <option value="all">所有狀態</option>
                    <option value="估價審核中">估價審核中</option>
                    <option value="等待付款">等待付款</option>
                    <option value="已付款">已付款</option>
                    <option value="已出貨">已出貨</option>
                    <option value="已完工">已完工</option>
                </select>
            </div>
            <div className="flex-1 overflow-auto border border-stone-100 rounded-lg">
                <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-xs text-stone-500 uppercase font-bold sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3">專案名稱</th>
                            <th className="px-4 py-3">客戶</th>
                            <th className="px-4 py-3">預算/金額</th>
                            <th className="px-4 py-3">目前階段</th>
                            <th className="px-4 py-3 text-right">下一步操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {filtered.map((p:any) => (
                            <tr key={p.id} className="hover:bg-stone-50">
                                <td className="px-4 py-3 font-medium">
                                    {p.name}
                                    <div className="text-xs text-stone-400 font-mono">{p.date}</div>
                                </td>
                                <td className="px-4 py-3 text-stone-500">{p.client}</td>
                                <td className="px-4 py-3 font-mono">NT$ {p.budget.toLocaleString()}</td>
                                <td className="px-4 py-3">{getStatusBadge(p.status)}</td>
                                <td className="px-4 py-3 text-right">
                                    {/* Workflow Actions */}
                                    {p.status === '估價審核中' && (
                                        <button 
                                            onClick={() => { if(confirm('確認估價單無誤，並發送付款通知給設計師？')) onUpdateStatus(p.id, '等待付款'); }}
                                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 shadow-sm font-bold flex items-center gap-1 ml-auto"
                                        >
                                            <Check size={12}/> 確認報價
                                        </button>
                                    )}
                                    {p.status === '等待付款' && (
                                        <span className="text-xs text-stone-400 italic">等待設計師付款...</span>
                                    )}
                                    {p.status === '已付款' && (
                                        <button 
                                            onClick={() => { if(confirm('確認商品已備齊並安排出貨？')) onUpdateStatus(p.id, '已出貨'); }}
                                            className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 shadow-sm font-bold flex items-center gap-1 ml-auto"
                                        >
                                            <Truck size={12}/> 安排出貨
                                        </button>
                                    )}
                                    {p.status === '已出貨' && (
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-xs text-stone-400 italic">等待完工...</span>
                                            {/* Admin emergency complete if needed, but UI suggests designer does it */}
                                        </div>
                                    )}
                                    {p.status === '已完工' && (
                                        <span className="text-xs text-emerald-600 font-bold">案件結束</span>
                                    )}
                                    {p.status === '規劃中' && (
                                        <span className="text-xs text-stone-300">設計中</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    ); 
};

const ProductManager: React.FC<any> = ({ products, setProducts, categories, setCategories, onCreate, onUpdate, onDelete }) => { const [searchTerm, setSearchTerm] = useState(''); const [selectedCategory, setSelectedCategory] = useState('全部'); const [editingProduct, setEditingProduct] = useState<Product | null>(null); const [isCreating, setIsCreating] = useState(false); const [showCategoryManager, setShowCategoryManager] = useState(false); const [showProductEditor, setShowProductEditor] = useState(false); const filteredProducts = products.filter((p: any) => { const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()); const matchesCategory = selectedCategory === '全部' || p.category === selectedCategory; return matchesSearch && matchesCategory; }); const handleDeleteProduct = (productId: string) => { onDelete(productId); }; const handleCreateProduct = () => { const defaultSpecs = { '瓦數(W)': 10, '流明(lm)': 800, 'CRI': 90, 'UGR': 19, '色溫': '3000K', '光束角': '24°' }; setEditingProduct({ id: `gt-${Date.now()}`, name: '', category: categories[0] || '未分類', image: 'https://picsum.photos/400/400', specs: defaultSpecs, price: 0, stock: 100, resources: [], availableCCTs: ['3000K', '4000K'], availableColors: ['白色', '黑色'] }); setIsCreating(true); setShowProductEditor(true); }; const handleEditProduct = (product: Product) => { setEditingProduct({ ...product, resources: product.resources || [] }); setIsCreating(false); setShowProductEditor(true); }; const handleSaveProduct = (product: Product) => { if (isCreating) { onCreate(product); } else { onUpdate(product); } setShowProductEditor(false); setEditingProduct(null); }; return ( <div className="bg-white border border-stone-200 rounded-2xl h-full flex flex-col overflow-hidden relative"> <div className="p-6 border-b border-stone-100 bg-white z-10"> <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"> <div><h2 className="text-xl font-serif text-stone-800">產品目錄管理</h2><p className="text-xs text-stone-500 mt-1">管理所有上架的燈具產品與規格</p></div> <div className="flex gap-2"> <button type="button" onClick={() => setShowCategoryManager(true)} className="bg-white border border-stone-200 text-stone-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-stone-50 hover:text-stone-900 shadow-sm"><FolderOpen size={16}/> 管理分類</button> <button type="button" onClick={handleCreateProduct} className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-stone-700 shadow-md"><Plus size={16}/> 新增產品</button> </div> </div> <div className="flex gap-4 mt-6"> <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} /><input type="text" placeholder="搜尋產品名稱..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-brand-bronze outline-none"/></div> <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:border-brand-bronze outline-none cursor-pointer"><option value="全部">全部分類</option>{categories.map((c: any) => <option key={c} value={c}>{c}</option>)}</select> </div> </div> <div className="flex-1 overflow-y-auto p-6 bg-stone-50/30"> {filteredProducts.length === 0 ? <div className="text-center py-20 text-stone-400"><Package size={48} className="mx-auto mb-4 opacity-20"/><p>找不到符合條件的產品</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"> {filteredProducts.map((p: any) => ( <div key={p.id} className="group bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 relative flex flex-col"> <div className="flex p-4 gap-4"> <div className="w-20 h-20 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-stone-100"><img src={p.image} className="w-full h-full object-cover mix-blend-multiply" alt={p.name} /></div> <div className="flex-1 min-w-0"><div className="flex justify-between items-start"><span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full mb-1 inline-block">{p.category}</span></div><h4 className="font-bold text-sm text-stone-800 truncate mb-1">{p.name}</h4><p className="text-brand-bronze font-mono font-medium text-sm">NT$ {p.price.toLocaleString()}</p><div className="text-[10px] text-stone-400 mt-2 flex gap-2"><span>庫存: {p.stock}</span><span>•</span><span>{p.availableCCTs.length} 種色溫</span></div></div> </div> <div className="mt-auto border-t border-stone-100 p-2 flex bg-stone-50/50 gap-2 items-center"> <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditProduct(p); }} className="flex-1 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded transition-colors flex items-center justify-center gap-1"><Edit2 size={12}/> 編輯</button> <div className="w-px bg-stone-200 h-4"></div> <div className="flex-1 flex justify-center"><DeleteButton onDelete={() => handleDeleteProduct(p.id)} label="刪除" /></div> </div> </div> ))} </div> } </div> {showCategoryManager && <CategoryManagerModal isOpen={showCategoryManager} onClose={() => setShowCategoryManager(false)} categories={categories} setCategories={setCategories} products={products} setProducts={setProducts} />} {showProductEditor && editingProduct && <ProductEditorModal isOpen={showProductEditor} onClose={() => setShowProductEditor(false)} product={editingProduct} onSave={handleSaveProduct} isCreating={isCreating} categories={categories} />} </div> ); };
const ProductEditorModal: React.FC<any> = ({ isOpen, onClose, product, onSave, isCreating, categories }) => { const [formData, setFormData] = useState<Product>(product); const [newSpecKey, setNewSpecKey] = useState(''); const [newSpecValue, setNewSpecValue] = useState(''); const [newResource, setNewResource] = useState(''); const [previewImage, setPreviewImage] = useState(product.image); const [isUploading, setIsUploading] = useState(false); const [specsList, setSpecsList] = useState<{id: string, key: string, value: any}[]>([]); const dragItem = useRef<number | null>(null); const dragOverItem = useRef<number | null>(null); useEffect(() => { setFormData(product); setPreviewImage(product.image); if (product.specs) { setSpecsList(Object.entries(product.specs).map(([k, v], i) => ({ id: `spec-${i}-${k}`, key: k, value: v }))); } }, [product]); const handleChange = (field: keyof Product, value: any) => { setFormData(prev => ({ ...prev, [field]: value })); }; const syncSpecsToFormData = (list: {key: string, value: any}[]) => { const newSpecs = Object.fromEntries(list.map(i => [i.key, i.value])); setFormData(prev => ({...prev, specs: newSpecs})); }; const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => { const _list = [...specsList]; _list[index] = { ..._list[index], [field]: val }; setSpecsList(_list); syncSpecsToFormData(_list); }; const handleDeleteSpec = (index: number) => { const _list = [...specsList]; _list.splice(index, 1); setSpecsList(_list); syncSpecsToFormData(_list); }; const handleAddSpec = () => { if (newSpecKey && newSpecValue) { const newItem = { id: `spec-${Date.now()}`, key: newSpecKey, value: newSpecValue }; const _list = [...specsList, newItem]; setSpecsList(_list); syncSpecsToFormData(_list); setNewSpecKey(''); setNewSpecValue(''); } }; const onDragStart = (e: React.DragEvent, index: number) => { dragItem.current = index; }; const onDragEnter = (e: React.DragEvent, index: number) => { dragOverItem.current = index; }; const onDragEnd = () => { if (dragItem.current === null || dragOverItem.current === null) return; const _list = [...specsList]; const draggedItemContent = _list[dragItem.current]; _list.splice(dragItem.current, 1); _list.splice(dragOverItem.current, 0, draggedItemContent); dragItem.current = null; dragOverItem.current = null; setSpecsList(_list); syncSpecsToFormData(_list); }; const moveItem = (index: number, direction: -1 | 1) => { if (index + direction < 0 || index + direction >= specsList.length) return; const _list = [...specsList]; const temp = _list[index]; _list[index] = _list[index + direction]; _list[index + direction] = temp; setSpecsList(_list); syncSpecsToFormData(_list); }; const handleAddResource = () => { if (newResource && !formData.resources.includes(newResource)) { setFormData(prev => ({ ...prev, resources: [...prev.resources, newResource] })); setNewResource(''); } }; const handleDeleteResource = (res: string) => { setFormData(prev => ({ ...prev, resources: prev.resources.filter(r => r !== res) })); }; const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setIsUploading(true); try { const url = await uploadFile(file, 'products'); setPreviewImage(url); handleChange('image', url); } catch (error) { console.error("Upload failed", error); alert("圖片上傳失敗"); } finally { setIsUploading(false); } } }; const handleSave = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); }; if (!isOpen) return null; return createPortal( <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"> <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"> <div className="p-6 border-b border-stone-100 flex justify-between items-center"> <h3 className="text-xl font-serif font-bold text-stone-800">{isCreating ? '新增產品' : '編輯產品'}</h3> <button onClick={onClose}><X size={20} className="text-stone-400 hover:text-stone-800" /></button> </div> <div className="overflow-y-auto p-6"> <form id="productForm" onSubmit={handleSave} className="space-y-6"> <div className="grid grid-cols-2 gap-4"> <div className="space-y-1"> <label className="text-xs font-bold text-stone-400">產品名稱</label> <input required value={formData.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-brand-bronze"/> </div> <div className="space-y-1"> <label className="text-xs font-bold text-stone-400">分類</label> <select value={formData.category} onChange={e => handleChange('category', e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-brand-bronze"> {categories.map((c: any) => <option key={c} value={c}>{c}</option>)} </select> </div> </div> <div className="grid grid-cols-2 gap-4"> <div className="space-y-1"> <label className="text-xs font-bold text-stone-400">價格 (NT$)</label> <input type="number" required value={formData.price} onChange={e => handleChange('price', Number(e.target.value))} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-brand-bronze"/> </div> <div className="space-y-1"> <label className="text-xs font-bold text-stone-400">庫存</label> <input type="number" required value={formData.stock} onChange={e => handleChange('stock', Number(e.target.value))} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-brand-bronze"/> </div> </div> <div className="space-y-2"> <label className="text-xs font-bold text-stone-400">產品圖片</label> <div className="flex items-start gap-4"> <div className="w-24 h-24 bg-stone-100 rounded-lg border border-stone-200 overflow-hidden shrink-0"> {previewImage ? <img src={previewImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-stone-400"><ImageIcon size={24}/></div>} </div> <div className="flex-1 space-y-2"> <input type="text" placeholder="輸入圖片 URL" value={formData.image} onChange={e => { handleChange('image', e.target.value); setPreviewImage(e.target.value); }} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-brand-bronze"/> <div className="flex items-center gap-2"> <span className="text-xs text-stone-400">或</span> <label className={`cursor-pointer bg-stone-100 text-stone-600 px-3 py-1.5 rounded text-xs hover:bg-stone-200 transition-colors flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}> {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} {isUploading ? '上傳中...' : '上傳本地圖片'} <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} /> </label> </div> </div> </div> </div> <div className="space-y-2 border-t border-stone-100 pt-4"> <div className="flex justify-between items-center"><label className="text-xs font-bold text-stone-400 uppercase tracking-widest">技術規格</label> <span className="text-[10px] text-stone-400">拖曳排序</span></div> <div className="space-y-2"> {specsList.map((spec: any, idx: number) => ( <div key={spec.id} draggable onDragStart={(e) => onDragStart(e, idx)} onDragEnter={(e) => onDragEnter(e, idx)} onDragEnd={onDragEnd} onDragOver={(e) => e.preventDefault()} className={`flex items-center gap-2 bg-stone-50 p-2 rounded border border-stone-100 group transition-all ${idx < 6 ? 'border-l-4 border-l-brand-bronze shadow-sm' : 'opacity-75'}`}> <div className="flex flex-col items-center gap-1 text-stone-300 px-1 cursor-grab active:cursor-grabbing hover:text-stone-500"> <GripVertical size={16} /></div> <div className="flex flex-col gap-0.5 mr-1"><button type="button" onClick={() => moveItem(idx, -1)} className="text-stone-300 hover:text-stone-800 disabled:opacity-20" disabled={idx === 0}><ArrowUp size={10} /></button><button type="button" onClick={() => moveItem(idx, 1)} className="text-stone-300 hover:text-stone-800 disabled:opacity-20" disabled={idx === specsList.length - 1}><ArrowDown size={10} /></button></div> <div className="flex-1 min-w-0 flex gap-2"> <div className="w-1/3"><input value={spec.key} onChange={e => handleSpecChange(idx, 'key', e.target.value)} className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-xs outline-none focus:border-brand-bronze"/></div> <div className="flex-1"><input value={spec.value} onChange={e => handleSpecChange(idx, 'value', e.target.value)} className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-xs outline-none focus:border-brand-bronze"/></div> </div> <button type="button" onClick={() => handleDeleteSpec(idx)} className="text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button> </div> ))} </div> <div className="flex gap-2 mt-2"> <input placeholder="規格名稱" value={newSpecKey} onChange={e => setNewSpecKey(e.target.value)} className="flex-1 bg-stone-50 border border-stone-200 rounded p-1.5 text-xs outline-none"/> <input placeholder="數值" value={newSpecValue} onChange={e => setNewSpecValue(e.target.value)} className="flex-1 bg-stone-50 border border-stone-200 rounded p-1.5 text-xs outline-none"/> <button type="button" onClick={handleAddSpec} className="bg-stone-800 text-white px-3 py-1 rounded text-xs hover:bg-stone-600">新增</button> </div> </div> <div className="space-y-2 border-t border-stone-100 pt-4"> <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">下載資源</label> <div className="flex flex-wrap gap-2 mb-2"> {formData.resources.map(res => ( <span key={res} className="bg-stone-100 border border-stone-200 px-3 py-1 rounded-full text-xs text-stone-700 flex items-center gap-2"> {res} <button type="button" onClick={() => handleDeleteResource(res)} className="text-stone-400 hover:text-red-500"><X size={12}/></button> </span> ))} </div> <div className="flex gap-2"> <input placeholder="輸入資源名稱" value={newResource} onChange={e => setNewResource(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddResource(); }}} className="flex-1 bg-stone-50 border border-stone-200 rounded p-2 text-xs outline-none"/> <button type="button" onClick={handleAddResource} className="bg-stone-100 text-stone-600 px-3 py-1 rounded text-xs hover:bg-stone-200">新增</button> </div> </div> </form> </div> <div className="p-6 border-t border-stone-100 flex gap-3"> <button onClick={onClose} className="flex-1 py-3 bg-stone-100 text-stone-500 rounded-xl hover:bg-stone-200">取消</button> <button type="submit" form="productForm" disabled={isUploading} className="flex-1 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed">{isUploading ? '上傳中...' : '儲存'}</button> </div> </div> </div>, document.body); };
const DeleteButton = ({ onDelete, label }: { onDelete: () => void, label: string }) => { const [confirm, setConfirm] = useState(false); if (confirm) { return ( <div className="flex gap-1 justify-center"> <button onClick={onDelete} className="bg-red-600 text-white px-2 py-1 rounded text-xs">確定?</button> <button onClick={() => setConfirm(false)} className="bg-stone-200 text-stone-600 px-2 py-1 rounded text-xs">取消</button> </div> ) } return ( <button onClick={() => setConfirm(true)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 justify-center w-full"> <Trash2 size={12}/> {label} </button> ) }
const CategoryManagerModal = ({ isOpen, onClose, categories, setCategories }: any) => { const [newCat, setNewCat] = useState(''); if(!isOpen) return null; return createPortal( <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"> <div className="bg-white p-6 rounded-xl w-80"> <h3 className="font-bold mb-4">分類管理</h3> <div className="space-y-2 mb-4"> {categories.map((c: string) => ( <div key={c} className="flex justify-between text-sm border-b pb-1"> {c} <button onClick={() => setCategories((prev:string[]) => prev.filter(x => x !== c))} className="text-red-500"><X size={14}/></button> </div> ))} </div> <div className="flex gap-2"> <input value={newCat} onChange={e => setNewCat(e.target.value)} className="border p-1 text-sm flex-1" placeholder="新分類"/> <button onClick={() => {if(newCat) { setCategories((p:string[]) => [...p, newCat]); setNewCat('');}}} className="bg-stone-800 text-white px-2 rounded text-sm">+</button> </div> <button onClick={onClose} className="mt-4 w-full bg-stone-100 py-1 rounded text-sm">關閉</button> </div> </div>, document.body); }
const RewardManager: React.FC<any> = ({ currentUser, rewards, setRewards, monthlyRebates, setMonthlyRebates }) => { return ( <div className="bg-white border border-stone-200 rounded-2xl p-6 h-full overflow-y-auto"> <h2 className="text-xl font-serif text-stone-800 mb-6">獎勵與回饋設定</h2> <div className="mb-8"> <h3 className="font-bold text-lg mb-4">會員等級 (Reward Tiers)</h3> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {rewards.map((r: any) => ( <div key={r.name} className="border p-4 rounded-xl"> <div className="font-bold text-lg">{r.name}</div> <div className="text-sm text-stone-500">門檻: ${r.threshold.toLocaleString()}</div> <div className="text-xs mt-2 bg-stone-50 p-2 rounded">{r.benefits}</div> </div> ))} </div> </div> <div> <h3 className="font-bold text-lg mb-4">月度回饋規則 (Monthly Rebates)</h3> <div className="overflow-x-auto border rounded-lg"> <table className="w-full text-sm"> <thead className="bg-stone-50"> <tr> <th className="p-3 text-left">達標門檻</th> {rewards.map((r: any) => <th key={r.name} className="p-3 text-right">{r.name}</th>)} </tr> </thead> <tbody> {monthlyRebates.map((rule: any) => ( <tr key={rule.id} className="border-t"> <td className="p-3 font-mono font-bold">${rule.threshold.toLocaleString()}</td> {rewards.map((r: any) => ( <td key={r.name} className="p-3 text-right text-stone-600"> ${(rule.rebatesByTier[r.name] || 0).toLocaleString()} </td> ))} </tr> ))} </tbody> </table> </div> </div> </div> ); };

// --- UPDATED SUPPORT MANAGER (Full Chat Console) ---
const SupportManager: React.FC<any> = ({ chatSessions, onReply, onRead, projects, onUpdateQuote, onUpdateStatus, allProducts }) => {
    // ... (Support Manager implementation same as provided in previous context, ensuring it's included)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    
    // Derived Data
    const selectedSession = chatSessions.find((s: any) => s.userId === selectedUserId);
    const userProjects = projects.filter((p: Project) => p.userId === selectedUserId);
    const activeProject = projects.find((p: Project) => p.id === activeProjectId) || null;
    const sortedSessions = [...chatSessions].sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    // Auto-select most relevant project when user changes
    useEffect(() => {
        if (selectedUserId && userProjects.length > 0) {
            // Prioritize '規劃中' or most recent
            const planning = userProjects.find((p: Project) => p.status === '規劃中');
            if (planning) setActiveProjectId(planning.id);
            else setActiveProjectId(userProjects[0].id);
        } else {
            setActiveProjectId(null);
        }
    }, [selectedUserId]);

    const handleSend = (text: string = replyText) => {
        if (!selectedUserId || !text.trim()) return;
        onReply(selectedUserId, text);
        setReplyText('');
    };

    const handleAddProductToQuote = (product: Product) => {
        if (!activeProjectId) { alert("請先選擇一個討論中的專案"); return; }
        onUpdateQuote(activeProjectId, 'add', product);
        handleSend(`[系統訊息] 我已將「${product.name}」加入您的專案「${activeProject?.name}」估價單中。`);
        setIsProductModalOpen(false);
    };

    const handleRecommendProduct = (product: Product) => {
        handleSend(`推薦您參考這款產品：\n${product.name}\n${Object.entries(product.specs).slice(0,3).map(([k,v]) => `${k}: ${v}`).join(', ')}`);
        setIsProductModalOpen(false);
    };

    return (
        <div className="flex h-full bg-white border border-stone-200 rounded-2xl overflow-hidden">
            {/* Sidebar List */}
            <div className="w-80 border-r border-stone-100 flex flex-col shrink-0">
                <div className="p-4 border-b border-stone-100 font-bold text-stone-700 bg-stone-50">客服訊息 ({sortedSessions.length})</div>
                <div className="flex-1 overflow-y-auto">
                    {sortedSessions.map((session: any) => (
                        <div 
                            key={session.userId} 
                            onClick={() => { setSelectedUserId(session.userId); onRead(session.userId); }}
                            className={`p-4 border-b border-stone-50 cursor-pointer hover:bg-stone-50 transition-colors ${selectedUserId === session.userId ? 'bg-stone-100 border-l-4 border-l-brand-bronze' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm text-stone-800">{session.userName}</span>
                                {session.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{session.unreadCount}</span>}
                            </div>
                            <div className="text-xs text-stone-500 truncate">{session.lastMessage}</div>
                            <div className="text-[10px] text-stone-400 mt-1 text-right">
                                {new Date(session.lastUpdated).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {selectedSession ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-white shadow-sm z-10">
                            <div>
                                <h3 className="font-bold text-stone-800 text-lg">{selectedSession.userName}</h3>
                                <p className="text-xs text-stone-500">{selectedSession.company}</p>
                            </div>
                            {/* Project Context Switcher */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-stone-400 font-bold uppercase">正在討論:</span>
                                <div className="relative">
                                    <select 
                                        value={activeProjectId || ''} 
                                        onChange={(e) => setActiveProjectId(e.target.value)}
                                        className="bg-stone-100 border border-stone-200 text-stone-700 text-xs rounded-lg py-1.5 pl-3 pr-8 outline-none appearance-none font-bold cursor-pointer hover:bg-stone-200 transition-colors min-w-[150px]"
                                    >
                                        <option value="">無指定專案</option>
                                        {userProjects.map((p: Project) => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none"/>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/30">
                            {selectedSession.messages.map((msg: any) => (
                                <div key={msg.id} className={`flex ${msg.role === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-xl text-sm shadow-sm whitespace-pre-wrap ${msg.role === 'agent' ? 'bg-stone-800 text-white rounded-br-none' : 'bg-white border border-stone-200 text-stone-700 rounded-bl-none'}`}>
                                        {msg.text}
                                        {/* Attachments rendering if any */}
                                        {msg.attachments && (
                                            <div className="mt-2 flex gap-2 flex-wrap">
                                                {msg.attachments.map((att: Attachment) => (
                                                    att.type === 'image' ? 
                                                    <img key={att.id} src={att.url} className="w-20 h-20 object-cover rounded border" /> :
                                                    <div key={att.id} className="text-xs bg-black/10 p-1 rounded flex items-center gap-1"><Paperclip size={10}/> {att.name}</div>
                                                ))}
                                            </div>
                                        )}
                                        <div className={`text-[10px] mt-1 text-right ${msg.role === 'agent' ? 'text-stone-400' : 'text-stone-300'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area & Toolbar */}
                        <div className="p-4 bg-white border-t border-stone-100">
                            <div className="flex gap-2 mb-2">
                                <button 
                                    onClick={() => setIsProductModalOpen(true)}
                                    className="text-xs bg-brand-bronze/10 text-brand-bronze px-3 py-1.5 rounded-full font-bold hover:bg-brand-bronze hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <Package size={14} /> 推薦產品 / 加入估價單
                                </button>
                                {/* Future features: Upload Image, Send Quote PDF, etc. */}
                                <button className="text-xs bg-stone-100 text-stone-500 px-3 py-1.5 rounded-full font-bold hover:bg-stone-200 flex items-center gap-1" disabled title="Coming soon">
                                    <ImageIcon size={14} /> 上傳圖片
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="輸入回覆..."
                                    className="flex-1 border border-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-brand-bronze bg-stone-50 focus:bg-white transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <button onClick={() => handleSend()} className="bg-stone-900 text-white px-6 py-2 rounded-lg text-sm hover:bg-stone-700 font-medium">
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-300">
                        <MessageSquare size={48} className="mb-4 opacity-20" />
                        <p>請從左側選擇對話以開始回覆</p>
                    </div>
                )}
            </div>

            {/* Product Recommender Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
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
        </div>
    );
};
