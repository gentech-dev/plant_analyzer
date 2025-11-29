
import React, { useState } from 'react';
import { Project } from '../../types';
import { AlertTriangle, Clock, DollarSign, Truck, CheckCircle, Check } from 'lucide-react';

interface ProjectManagerProps {
  projects: Project[];
  onUpdateStatus: (projectId: string, status: Project['status']) => void;
  onConfirmPayment: (projectId: string) => void;
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, onUpdateStatus, onConfirmPayment, onUpdateProject }) => { 
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
