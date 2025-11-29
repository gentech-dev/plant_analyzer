
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, RewardTier } from '../../types';
import { X, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

interface UserEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'create' | 'edit';
    user: User | null;
    onSave: (data: any) => void;
    rewards: RewardTier[];
    currentUser: User | null;
}

export const UserEditorModal: React.FC<UserEditorModalProps> = ({ isOpen, onClose, mode, user, onSave, rewards, currentUser }) => {
  const [formData, setFormData] = useState({
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      company: user?.company || '',
      phone: user?.phone || '',
      role: user?.role || 'designer',
      tier: user?.tier || '設計師',
      status: user?.status || 'active'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
      setFormData({
          name: user?.name || '',
          email: user?.email || '',
          password: '',
          company: user?.company || '',
          phone: user?.phone || '',
          role: user?.role || 'designer',
          tier: user?.tier || '設計師',
          status: user?.status || 'active'
      });
  }, [user, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      await onSave(formData);
      setIsSaving(false);
  };

  if (!isOpen) return null;

  const isSuperAdmin = currentUser?.role === 'admin';

  return createPortal(
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in">
              <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                  <h3 className="font-serif font-bold text-lg text-stone-800">{mode === 'create' ? '新增帳號' : '編輯用戶資料'}</h3>
                  <button onClick={onClose}><X size={20} className="text-stone-400 hover:text-stone-800"/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-400 uppercase">姓名</label>
                          <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-brand-bronze"/>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-400 uppercase">公司/單位</label>
                          <input required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-brand-bronze"/>
                      </div>
                  </div>
                  
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-400 uppercase">Email (帳號)</label>
                      <div className="relative">
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"/>
                          <input type="email" required disabled={mode === 'edit'} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 pl-10 text-sm outline-none focus:border-brand-bronze disabled:opacity-60 disabled:cursor-not-allowed"/>
                      </div>
                  </div>

                  {mode === 'create' && (
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-400 uppercase">設定密碼</label>
                          <div className="relative">
                              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"/>
                              <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 pl-10 text-sm outline-none focus:border-brand-bronze" placeholder="至少 6 位數"/>
                          </div>
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-400 uppercase flex items-center gap-1">
                              角色權限
                              {!isSuperAdmin && <Lock size={10} className="text-stone-400"/>}
                          </label>
                          <select 
                              value={formData.role} 
                              onChange={e => setFormData({...formData, role: e.target.value as any})} 
                              disabled={!isSuperAdmin}
                              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-brand-bronze cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-stone-100"
                          >
                              <option value="designer">設計師 (一般會員)</option>
                              <option value="sales">業務經理 (Sales)</option>
                              <option value="support">客服專員 (Support)</option>
                              {/* Only Super Admin can create other Admins */}
                              {isSuperAdmin && <option value="admin">超級管理員 (Admin)</option>}
                          </select>
                      </div>
                      
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-400 uppercase flex items-center gap-1">
                              帳號狀態
                              {!isSuperAdmin && <Lock size={10} className="text-stone-400"/>}
                          </label>
                          <select 
                              value={formData.status} 
                              onChange={e => setFormData({...formData, status: e.target.value as any})} 
                              disabled={!isSuperAdmin}
                              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-brand-bronze cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-stone-100"
                          >
                              <option value="active">Active 活躍</option>
                              <option value="suspended">Suspended 停權</option>
                          </select>
                      </div>
                  </div>

                  {formData.role === 'designer' && (
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-400 uppercase flex items-center gap-1">
                              會員等級
                              {!isSuperAdmin && <Lock size={10} className="text-stone-400"/>}
                          </label>
                          <select 
                              value={formData.tier} 
                              onChange={e => setFormData({...formData, tier: e.target.value})} 
                              disabled={!isSuperAdmin}
                              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-brand-bronze cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-stone-100"
                          >
                              {rewards.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                          </select>
                      </div>
                  )}

                  <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-400 uppercase">電話</label>
                      <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-brand-bronze"/>
                  </div>

                  {/* Warning for non-super admins */}
                  {!isSuperAdmin && (
                      <div className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded flex items-center gap-1">
                          <AlertCircle size={12} />
                          您無權限修改角色、狀態與會員等級。
                      </div>
                  )}

                  <div className="pt-4 flex gap-3">
                      <button type="button" onClick={onClose} className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 text-sm font-bold">取消</button>
                      <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-700 text-sm font-bold flex justify-center items-center gap-2 shadow-lg">
                          {isSaving && <Loader2 size={16} className="animate-spin" />}
                          {mode === 'create' ? '建立帳號' : '儲存變更'}
                      </button>
                  </div>
              </form>
          </div>
      </div>,
      document.body
  );
};
