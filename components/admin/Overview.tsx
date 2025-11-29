import React, { useMemo } from 'react';
import { Project, Product, User } from '../../types';
import { 
  DollarSign, Briefcase, Users, Package, TrendingUp, PieChart as PieChartIcon, 
  BarChart3, AlertTriangle, ArrowRight, ShoppingBag, Activity, CheckCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';

interface OverviewProps {
  projects: Project[];
  products: Product[];
  users: User[];
}

const KpiCard = ({ title, value, trend, icon: Icon, color, subtext, isAlert }: any) => {
  const getTheme = (c: string) => {
      switch(c) {
          case 'bronze': return { bg: 'bg-brand-bronze', text: 'text-brand-bronze', light: 'bg-brand-bronze/10' };
          case 'blue': return { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50' };
          case 'emerald': return { bg: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50' };
          case 'red': return { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-50' };
          default: return { bg: 'bg-stone-800', text: 'text-stone-800', light: 'bg-stone-100' };
      }
  }
  const theme = getTheme(color);

  return (
    <div className={`p-6 rounded-2xl border bg-white shadow-sm flex flex-col justify-between transition-all hover:shadow-md h-full
        ${isAlert ? 'border-red-200 ring-2 ring-red-50' : 'border-stone-100'}
    `}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3.5 rounded-xl ${theme.light} ${theme.text}`}>
          <Icon size={22} strokeWidth={2} />
        </div>
        {trend && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isAlert ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {isAlert ? <AlertTriangle size={10}/> : <TrendingUp size={10}/>}
                {trend}
            </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-serif font-bold text-stone-800 tracking-tight">{value}</h3>
        <p className="text-xs text-stone-500 uppercase font-bold tracking-wider mt-1.5 flex items-center gap-1">
            {title}
        </p>
        {subtext && <p className="text-xs text-stone-400 mt-2 font-medium">{subtext}</p>}
      </div>
    </div>
  );
};

export const Overview: React.FC<OverviewProps> = ({ projects, products, users }) => {
  
  // --- REAL DATA ANALYTICS ---
  const analytics = useMemo(() => {
    // 1. Financials
    const paidProjects = projects.filter(p => p.paymentStatus === 'paid');
    const totalRevenue = paidProjects.reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);
    
    // Pipeline: Active projects not yet paid
    const pipelineProjects = projects.filter(p => p.status !== '已完工' && p.paymentStatus !== 'paid');
    const potentialRevenue = pipelineProjects.reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);

    // 2. Product Performance
    const productSales: Record<string, {id: string, name: string, image: string, category: string, qty: number, revenue: number}> = {};
    projects.forEach(p => {
        // Only count paid or delivered items for sales stats to be accurate, or include all for demand? 
        // Let's include all active projects to see demand.
        if (p.status !== '已完工') { 
            p.items.forEach(item => {
                if (!productSales[item.id]) {
                    productSales[item.id] = { 
                        id: item.id, 
                        name: item.name, 
                        image: item.image,
                        category: item.category,
                        qty: 0, 
                        revenue: 0 
                    };
                }
                productSales[item.id].qty += item.quantity;
                productSales[item.id].revenue += item.quantity * item.price;
            });
        }
    });
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    // 3. Inventory Health
    let stockHealth = { safe: 0, low: 0, out: 0 };
    const lowStockItems: Product[] = [];
    products.forEach(p => {
        if (p.stock === 0) {
            stockHealth.out++;
            lowStockItems.push(p);
        } else if (p.stock < 20) {
            stockHealth.low++;
            lowStockItems.push(p);
        } else {
            stockHealth.safe++;
        }
    });
    
    // Sort low stock items by stock level (ascending)
    lowStockItems.sort((a, b) => a.stock - b.stock);

    // 4. Project Status Funnel
    const statusCounts = {
        '規劃中': 0, '估價審核中': 0, '等待付款': 0, '已付款': 0, '已出貨': 0, '已完工': 0
    };
    projects.forEach(p => {
        if (statusCounts.hasOwnProperty(p.status)) {
            // @ts-ignore
            statusCounts[p.status]++;
        }
    });

    const statusData = [
        { name: '規劃中', value: statusCounts['規劃中'], fill: '#e7e5e4' }, // Stone 200
        { name: '審核中', value: statusCounts['估價審核中'], fill: '#fbbf24' }, // Amber 400
        { name: '待付款', value: statusCounts['等待付款'], fill: '#60a5fa' }, // Blue 400
        { name: '進行中', value: statusCounts['已付款'] + statusCounts['已出貨'], fill: '#A89166' }, // Bronze
        { name: '已完工', value: statusCounts['已完工'], fill: '#34d399' }, // Emerald 400
    ].filter(d => d.value > 0);

    // 5. REAL Revenue Trend (Last 6 Months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i)); // Order: -5, -4, ... 0
        return { 
            name: `${d.getMonth() + 1}月`, 
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            revenue: 0, 
            pipeline: 0 
        };
    });

    projects.forEach(p => {
        const pDate = new Date(p.date);
        if (isNaN(pDate.getTime())) return;
        const pKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
        
        const monthData = last6Months.find(m => m.key === pKey);
        
        if (monthData) {
            const amount = p.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
            if (p.paymentStatus === 'paid') {
                monthData.revenue += amount;
            } else if (p.status !== '已完工') {
                monthData.pipeline += amount;
            }
        }
    });

    return { totalRevenue, potentialRevenue, topProducts, stockHealth, lowStockItems, statusData, revenueData: last6Months };
  }, [projects, products]);

  return (
    <div className="h-full overflow-y-auto p-2 md:p-4 space-y-6 custom-scrollbar pb-24">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-2">
            <div>
                <h2 className="text-2xl font-serif font-bold text-stone-800">營運數據總覽</h2>
                <p className="text-stone-500 text-xs mt-1">即時更新的銷售、庫存與專案分析報告。</p>
            </div>
            <div className="text-right hidden md:block">
                <span className="text-[10px] bg-stone-100 text-stone-500 px-3 py-1 rounded-full font-medium">
                    最後更新: {new Date().toLocaleTimeString()}
                </span>
            </div>
        </div>

        {/* 1. KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard 
                title="實際已收營收 (Total Revenue)" 
                value={`NT$ ${(analytics.totalRevenue / 10000).toFixed(1)}萬`} 
                trend="+12.5%" 
                icon={DollarSign} 
                color="bronze"
                subtext="本年度累積"
            />
            <KpiCard 
                title="潛在案源金額 (Pipeline)" 
                value={`NT$ ${(analytics.potentialRevenue / 10000).toFixed(1)}萬`} 
                icon={Briefcase} 
                color="stone" 
                subtext={`${projects.filter(p => p.status === '規劃中').length} 個規劃中專案`}
            />
            <KpiCard 
                title="活躍設計師 (Designers)" 
                value={users.filter(u => u.role === 'designer').length} 
                trend="Active" 
                icon={Users} 
                color="blue"
                subtext="總會員數"
            />
            <KpiCard 
                title="庫存警示 (Low Stock)" 
                value={analytics.stockHealth.low + analytics.stockHealth.out} 
                trend={analytics.stockHealth.out > 0 ? "缺貨中" : "需補貨"} 
                isAlert={analytics.stockHealth.out > 0 || analytics.stockHealth.low > 0} 
                icon={Package} 
                color="red"
                subtext={`${analytics.stockHealth.out} 項商品已無庫存`}
            />
        </div>

        {/* 2. Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Revenue Trend Chart */}
            <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-serif font-bold text-stone-800 flex items-center gap-2">
                        <Activity size={20} className="text-brand-bronze"/> 營收與預估趨勢
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-medium">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-bronze"></span> 實際營收</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span> 潛在案源</span>
                    </div>
                </div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#A89166" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#A89166" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorPipeline" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#d6d3d1" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#d6d3d1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4"/>
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill:'#a8a29e', fontSize:12}}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill:'#a8a29e', fontSize:12}} 
                                tickFormatter={(val)=>`$${val/1000}k`}
                            />
                            <RechartsTooltip 
                                contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px'}}
                                formatter={(val: number) => `NT$ ${val.toLocaleString()}`}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                name="實際營收" 
                                stroke="#A89166" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                                animationDuration={1500}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="pipeline" 
                                name="潛在案源" 
                                stroke="#d6d3d1" 
                                strokeWidth={2} 
                                strokeDasharray="5 5" 
                                fillOpacity={1} 
                                fill="url(#colorPipeline)" 
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Project Status Donut Chart */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col">
                <h3 className="text-lg font-serif font-bold text-stone-800 mb-2 flex items-center gap-2">
                    <PieChartIcon size={20} className="text-stone-400"/> 專案狀態分佈
                </h3>
                <div className="flex-1 min-h-[250px] relative">
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
                                cornerRadius={4}
                            >
                                {analytics.statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0}/>
                                ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{borderRadius:'8px', fontSize: '12px', border:'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                            <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconType="circle" 
                                iconSize={8}
                                wrapperStyle={{fontSize: '11px', paddingTop: '20px'}}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                        <span className="text-3xl font-bold text-stone-800 font-serif">{projects.length}</span>
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest">Projects</span>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. Bottom Lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Products List */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
                <h3 className="text-lg font-serif font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-emerald-600"/> 熱銷產品排行 (Top 5)
                </h3>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-stone-50 text-xs text-stone-500 font-bold uppercase">
                            <tr>
                                <th className="py-2 pl-3 rounded-l-lg">產品</th>
                                <th className="py-2 text-center">銷量</th>
                                <th className="py-2 pr-3 text-right rounded-r-lg">銷售額</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {analytics.topProducts.map((p, idx) => (
                                <tr key={p.id} className="group hover:bg-stone-50 transition-colors">
                                    <td className="py-3 pl-3 flex items-center gap-3">
                                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0
                                            ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-stone-200 text-stone-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-stone-50 text-stone-400'}
                                        `}>
                                            {idx + 1}
                                        </span>
                                        <div className="w-8 h-8 rounded bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                                            <img src={p.image} className="w-full h-full object-cover" alt={p.name}/>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-stone-800 truncate text-xs sm:text-sm">{p.name}</p>
                                            <p className="text-[10px] text-stone-400 truncate">{p.category}</p>
                                        </div>
                                    </td>
                                    <td className="py-3 text-center font-medium text-stone-600">{p.qty}</td>
                                    <td className="py-3 pr-3 text-right font-mono font-bold text-stone-800">
                                        ${(p.revenue / 1000).toFixed(1)}k
                                    </td>
                                </tr>
                            ))}
                            {analytics.topProducts.length === 0 && (
                                <tr><td colSpan={3} className="text-center py-8 text-stone-400 text-xs">尚無銷售數據</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Low Stock Alerts List */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-serif font-bold text-stone-800 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-500"/> 庫存警示 (Low Stock)
                    </h3>
                    {analytics.lowStockItems.length > 0 && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
                            {analytics.lowStockItems.length} 項需補貨
                        </span>
                    )}
                </div>
                
                <div className="flex-1 overflow-auto pr-1 custom-scrollbar">
                    {analytics.lowStockItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-2">
                            <CheckCircle size={32} className="text-emerald-200"/>
                            <p className="text-sm font-medium">庫存水位健康</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {analytics.lowStockItems.map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:border-red-200 hover:bg-red-50/30 transition-all group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden shrink-0 relative">
                                            <img src={p.image} className="w-full h-full object-cover mix-blend-multiply" alt={p.name}/>
                                            {p.stock === 0 && (
                                                <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white text-[10px] font-bold">OUT</div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-stone-800 text-xs sm:text-sm truncate">{p.name}</p>
                                            <p className="text-[10px] text-stone-400">ID: {p.id}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 pl-2">
                                        <p className={`text-sm font-bold font-mono ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                                            {p.stock} <span className="text-[10px] font-sans font-normal text-stone-400">件</span>
                                        </p>
                                        <button className="text-[10px] text-stone-400 hover:text-stone-800 underline flex items-center justify-end gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            補貨 <ArrowRight size={10}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
    </div>
  );
};