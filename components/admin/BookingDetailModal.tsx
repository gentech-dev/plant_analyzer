
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Booking, User } from '../../types';
import { CheckCircle, Check, X, Loader2, Save, Users, Briefcase, StickyNote } from 'lucide-react';

interface BookingDetailModalProps {
    booking: Booking;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<Booking>) => void;
    userInfo?: User;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ booking, onClose, onUpdate, userInfo }) => { 
    const [adminNotes, setAdminNotes] = useState(booking.adminNotes || ''); 
    const [isSaving, setIsSaving] = useState(false); 
    
    const handleSaveNotes = () => { 
        setIsSaving(true); 
        setTimeout(() => { 
            onUpdate(booking.id, { adminNotes }); 
            setIsSaving(false); 
        }, 500); 
    }; 
    
    const handleStatusChange = (status: Booking['status']) => { 
        if(confirm(`確定要將狀態更改為「${status}」嗎？`)) { 
            onUpdate(booking.id, { status }); 
            onClose(); 
        } 
    }; 
    
    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-fade-in">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-serif font-bold text-stone-800">預約詳細資料</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : booking.status === 'completed' ? 'bg-stone-200 text-stone-600' : 'bg-red-50 text-red-500'}`}>{booking.status.toUpperCase()}</span>
                        </div>
                        <p className="text-xs text-stone-500 font-mono">ID: {booking.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full text-stone-400 hover:text-stone-800 transition-colors"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-0 flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-stone-100 space-y-6">
                        <div className="bg-stone-900 text-white p-4 rounded-xl flex items-center justify-between shadow-lg">
                            <div><p className="text-xs text-stone-400 uppercase tracking-widest font-bold">預約時間</p><p className="text-2xl font-mono font-bold">{booking.date}</p></div>
                            <div className="text-right"><p className="text-3xl font-bold text-brand-bronze">{booking.time}</p></div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-stone-800 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={14} className="text-stone-400"/> 客戶資料</h4>
                            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 space-y-3">
                                <div className="flex justify-between"><span className="text-sm text-stone-500">姓名</span><span className="text-sm font-bold text-stone-800">{booking.userName}</span></div>
                                <div className="flex justify-between"><span className="text-sm text-stone-500">電話</span><span className="text-sm font-mono text-stone-800">{booking.userPhone}</span></div>
                                {userInfo && (<><div className="flex justify-between"><span className="text-sm text-stone-500">公司</span><span className="text-sm text-stone-800">{userInfo.company}</span></div><div className="flex justify-between items-center"><span className="text-sm text-stone-500">等級</span><span className={`text-xs px-2 py-0.5 rounded border ${userInfo.tier === '黑鑽總監' ? 'bg-stone-900 text-brand-bronze border-brand-bronze' : 'bg-white text-stone-600 border-stone-200'}`}>{userInfo.tier || '一般會員'}</span></div></>)}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-stone-800 uppercase tracking-widest mb-3 flex items-center gap-2"><Briefcase size={14} className="text-stone-400"/> 需求內容</h4>
                            <div className="bg-white border border-stone-200 p-4 rounded-xl">
                                <div className="mb-2"><span className="text-xs text-stone-400 block mb-1">關聯專案</span><span className="font-bold text-stone-800 text-sm">{booking.projectName}</span></div>
                                <div><span className="text-xs text-stone-400 block mb-1">客戶備註</span><p className="text-sm text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg">{booking.notes || '無填寫備註'}</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 p-6 bg-stone-50/30 space-y-6 flex flex-col">
                        <div className="flex-1 flex flex-col">
                            <h4 className="text-sm font-bold text-stone-800 uppercase tracking-widest mb-3 flex items-center gap-2"><StickyNote size={14} className="text-amber-500"/> 內部管理備註 (僅員工可見)</h4>
                            <div className="flex-1 flex flex-col bg-yellow-50/50 border border-yellow-200 rounded-xl p-1 focus-within:ring-2 focus-within:ring-yellow-400/50 transition-all">
                                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="輸入內部交辦事項..." className="flex-1 w-full bg-transparent border-none outline-none p-3 text-sm text-stone-700 placeholder:text-stone-400 resize-none"/>
                                <div className="p-2 flex justify-end border-t border-yellow-200/50">
                                    <button onClick={handleSaveNotes} disabled={isSaving} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50">{isSaving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}{isSaving ? '儲存中' : '儲存備註'}</button>
                                </div>
                            </div>
                            <p className="text-[10px] text-stone-400 mt-2 pl-1">* 此區塊內容客戶端不會看到，僅供門市人員交接使用。</p>
                        </div>
                        <div className="pt-6 border-t border-stone-200">
                            <h4 className="text-sm font-bold text-stone-800 uppercase tracking-widest mb-3">預約狀態操作</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {booking.status === 'pending' && (<><button onClick={() => handleStatusChange('confirmed')} className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold shadow-md shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"><CheckCircle size={18}/> 確認預約 (發送通知)</button><button onClick={() => handleStatusChange('cancelled')} className="w-full py-3 bg-white border border-stone-200 text-stone-500 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-medium transition-all">取消預約</button></>)}
                                {booking.status === 'confirmed' && (<><button onClick={() => handleStatusChange('completed')} className="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-700 font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"><Check size={18}/> 標記為已完成 (客戶已到訪)</button><button onClick={() => handleStatusChange('cancelled')} className="w-full py-3 bg-white border border-stone-200 text-stone-500 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-medium transition-all">取消/未到</button></>)}
                                {(booking.status === 'completed' || booking.status === 'cancelled') && (<button onClick={() => handleStatusChange('pending')} className="w-full py-3 bg-stone-100 text-stone-500 rounded-xl hover:bg-stone-200 font-medium transition-all text-xs">重置為待確認狀態</button>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>, 
        document.body
    ); 
};
