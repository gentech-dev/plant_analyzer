
import React, { useState } from 'react';
import { Booking, Project, User } from '../../types';
import { Clock, CheckCircle, Check, X, ChevronRight, Calendar, Briefcase, MapPin, StickyNote } from 'lucide-react';
import { BookingDetailModal } from './BookingDetailModal';

interface BookingManagerProps {
  bookings: Booking[];
  projects: Project[];
  users: User[];
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
}

export const BookingManager: React.FC<BookingManagerProps> = ({ bookings, projects, users, onUpdateBooking }) => {
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
