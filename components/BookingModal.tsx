
import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, Clock, Calendar, CheckCircle, Building2, User, ArrowRight, Loader2 } from 'lucide-react';
import { Project, User as UserType, Booking } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  projects: Project[];
  onSubmit: (data: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, user, projects, onSubmit }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    projectId: '',
    name: user?.name || '',
    phone: user?.phone || '',
    date: '',
    time: '10:00',
    notes: ''
  });

  // Calculate local date string for min attribute (YYYY-MM-DD)
  const [minDate, setMinDate] = useState('');

  useEffect(() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setMinDate(`${year}-${month}-${day}`);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setStep('success');
      
      const projectName = projects.find(p => p.id === formData.projectId)?.name || '門市參觀';
      
      const newBooking: Booking = {
          id: `bk-${Date.now()}`,
          userId: user?.id || 'guest',
          userName: formData.name,
          userPhone: formData.phone,
          projectId: formData.projectId,
          projectName: projectName,
          date: formData.date,
          time: formData.time,
          notes: formData.notes,
          status: 'pending',
          createdAt: new Date().toISOString()
      };

      onSubmit(newBooking);
    }, 1500);
  };

  const activeProjects = projects.filter(p => p.status !== '已完工');

  // Time slots logic (avoid lunch break 12:30-13:30)
  const timeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
      '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl animate-fade-in flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Left: Store Info */}
        <div className="w-full md:w-2/5 bg-stone-900 text-white p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-bronze/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="relative z-10">
                <h3 className="text-2xl font-serif font-bold mb-2">預約門市諮詢</h3>
                <p className="text-stone-400 text-sm mb-8 leading-relaxed">
                    帶著您的平面圖，讓 Gentech 專業燈光規劃師為您提供一對一的照明配置建議與實品體驗。
                </p>

                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <MapPin className="text-brand-bronze" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1">門市地址</p>
                            <p className="font-medium text-sm leading-relaxed">新北市土城區青雲路434巷10號3樓</p>
                            <a 
                                href="https://maps.google.com/?q=新北市土城區青雲路434巷10號3樓" 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs text-brand-bronze hover:text-white underline mt-1 inline-block transition-colors"
                            >
                                開啟 Google Maps
                            </a>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <Phone className="text-brand-bronze" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1">預約專線</p>
                            <p className="font-medium text-lg font-mono">(02) 2263-0026</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <Clock className="text-brand-bronze" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1">營業時間</p>
                            <p className="text-sm">09:00 ~ 12:30</p>
                            <p className="text-sm">13:30 ~ 17:30</p>
                            <p className="text-xs text-stone-500 mt-1">(例假日公休)</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-8 pt-8 border-t border-white/10">
                 <p className="text-xs text-stone-500 text-center">
                    Gentech Lighting Experience Center
                 </p>
            </div>
        </div>

        {/* Right: Booking Form */}
        <div className="w-full md:w-3/5 bg-white p-8 md:p-10 overflow-y-auto relative">
             <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-stone-400 hover:text-stone-800 p-2 hover:bg-stone-100 rounded-full transition-colors z-20"
            >
                <X size={24} />
            </button>

            {step === 'form' ? (
                <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
                    <div className="space-y-1">
                         <h4 className="text-xl font-bold text-stone-800">填寫預約資料</h4>
                         <p className="text-sm text-stone-500">我們會安排專屬規劃師協助您</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">聯絡人</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                                <input 
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-stone-50 border border-stone-200 text-stone-800 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-brand-bronze text-sm"
                                    placeholder="您的姓名"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">電話</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                                <input 
                                    required
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    className="w-full bg-stone-50 border border-stone-200 text-stone-800 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-brand-bronze text-sm"
                                    placeholder="09xx-xxx-xxx"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">討論專案 (選填)</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <select 
                                value={formData.projectId}
                                onChange={e => setFormData({...formData, projectId: e.target.value})}
                                className="w-full bg-stone-50 border border-stone-200 text-stone-800 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-brand-bronze text-sm appearance-none cursor-pointer"
                            >
                                <option value="">無指定專案 / 純粹參觀</option>
                                {activeProjects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">日期</label>
                            <div className="relative">
                                <input 
                                    required
                                    type="date"
                                    min={minDate} // Use local date string
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                    className="w-full bg-stone-50 border border-stone-200 text-stone-800 px-4 py-3 rounded-xl focus:outline-none focus:border-brand-bronze text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">時段</label>
                            <div className="relative">
                                <select 
                                    required
                                    value={formData.time}
                                    onChange={e => setFormData({...formData, time: e.target.value})}
                                    className="w-full bg-stone-50 border border-stone-200 text-stone-800 px-4 py-3 rounded-xl focus:outline-none focus:border-brand-bronze text-sm appearance-none cursor-pointer"
                                >
                                    {timeSlots.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">備註需求</label>
                        <textarea 
                            rows={3}
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                            className="w-full bg-stone-50 border border-stone-200 text-stone-800 px-4 py-3 rounded-xl focus:outline-none focus:border-brand-bronze text-sm resize-none"
                            placeholder="例如：想看磁吸軌道燈實體、需要照度計算..."
                        />
                    </div>

                    <div className="mt-auto pt-4">
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-stone-900 text-white py-3.5 rounded-xl font-medium hover:bg-stone-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Calendar size={18} />}
                            {isLoading ? '預約中...' : '確認預約'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-stone-800 mb-2">預約申請已送出！</h3>
                    <p className="text-stone-500 text-sm mb-8 leading-relaxed max-w-xs">
                        我們已收到您的預約資訊。<br/>
                        期待您的光臨。
                    </p>
                    
                    <div className="bg-stone-50 p-4 rounded-xl w-full mb-8 text-left border border-stone-100">
                         <div className="flex justify-between items-center mb-2 border-b border-stone-200 pb-2">
                             <span className="text-xs text-stone-400">預約專案</span>
                             <span className="text-sm font-bold text-stone-800">
                                 {projects.find(p => p.id === formData.projectId)?.name || '門市參觀'}
                             </span>
                         </div>
                         <div className="flex justify-between items-center">
                             <span className="text-xs text-stone-400">時間</span>
                             <span className="text-sm font-bold text-brand-bronze">
                                 {formData.date} {formData.time}
                             </span>
                         </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full bg-stone-100 text-stone-600 py-3 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                    >
                        返回首頁
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
