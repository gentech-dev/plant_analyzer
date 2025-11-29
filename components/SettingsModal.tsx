
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { X, User as UserIcon, Building2, Phone, FileText, Lock, Save, Loader2, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (updatedData: Partial<User>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onUpdateUser }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    taxId: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Sync with user prop when opened
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        company: user.company || '',
        phone: user.phone || '',
        taxId: user.taxId || '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsSaved(false);
    }
  }, [isOpen, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      alert("兩次輸入的密碼不一致！");
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const updates: Partial<User> = {
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        taxId: formData.taxId,
      };

      if (formData.newPassword) {
        updates.password = formData.newPassword;
      }

      onUpdateUser(updates);
      setIsLoading(false);
      setIsSaved(true);

      // Auto close after success
      setTimeout(() => {
          onClose();
      }, 1500);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl animate-fade-in flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div>
            <h3 className="text-xl font-serif text-stone-800">帳號設定</h3>
            <p className="text-xs text-stone-500 mt-1">管理您的個人資料與密碼</p>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-stone-800 p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                
                {/* Basic Info Section */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-stone-800 border-l-4 border-brand-bronze pl-2">基本資料</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">姓名</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                                <input 
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-stone-200 text-stone-800 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze text-sm"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">聯絡電話</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                                <input 
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="0912-345-678"
                                    className="w-full bg-white border border-stone-200 text-stone-800 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">公司名稱</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <input 
                                type="text"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                className="w-full bg-white border border-stone-200 text-stone-800 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">統一編號</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <input 
                                type="text"
                                name="taxId"
                                value={formData.taxId}
                                onChange={handleChange}
                                className="w-full bg-white border border-stone-200 text-stone-800 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze text-sm"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-stone-100" />

                {/* Password Section */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-stone-800 border-l-4 border-brand-bronze pl-2">安全性設定</h4>
                    <p className="text-xs text-stone-400 bg-stone-50 p-2 rounded">若不修改密碼請留空。</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">新密碼</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                                <input 
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full bg-white border border-stone-200 text-stone-800 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">確認新密碼</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                                <input 
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full bg-white border border-stone-200 text-stone-800 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        type="submit"
                        disabled={isLoading || isSaved}
                        className={`w-full py-3.5 rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2
                            ${isSaved 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-stone-900 text-white hover:bg-stone-700'
                            }
                        `}
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : (isSaved ? <Check size={18} /> : <Save size={18} />)}
                        {isLoading ? '儲存中...' : (isSaved ? '已更新資料' : '儲存變更')}
                    </button>
                </div>

            </form>
        </div>
      </div>
    </div>
  );
};
