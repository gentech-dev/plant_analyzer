
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { RewardTier, MonthlyRebateRule } from '../../types';
import { X, Loader2 } from 'lucide-react';
import { db } from '../../firebase';
import { doc, writeBatch } from 'firebase/firestore';

interface TierEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    tier: RewardTier | null;
    monthlyRebates: MonthlyRebateRule[];
}

export const TierEditorModal: React.FC<TierEditorModalProps> = ({ isOpen, onClose, tier, monthlyRebates }) => {
    const [formData, setFormData] = useState<RewardTier>(tier || {
        name: '',
        threshold: 0,
        benefits: '',
        color: 'text-stone-600'
    });
    const [isSaving, setIsSaving] = useState(false);
    const isCreate = !tier;

    // We store the original name to handle renames
    const originalName = tier?.name;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;
        setIsSaving(true);

        try {
            const batch = writeBatch(db!);

            if (isCreate) {
                // Create new doc
                const newRef = doc(db!, "rewards", formData.name);
                batch.set(newRef, formData);
                
                // Add this new tier to all existing rebate rules with 0 amount
                monthlyRebates.forEach(rule => {
                    const ruleRef = doc(db!, "monthly_rebates", rule.id);
                    const updatedRebates = { ...rule.rebatesByTier, [formData.name]: 0 };
                    batch.update(ruleRef, { rebatesByTier: updatedRebates });
                });

            } else {
                // Edit Mode
                if (originalName && originalName !== formData.name) {
                    // Name changed: This is complex because name is key
                    // 1. Create new doc
                    const newRef = doc(db!, "rewards", formData.name);
                    batch.set(newRef, formData);
                    // 2. Delete old doc
                    const oldRef = doc(db!, "rewards", originalName);
                    batch.delete(oldRef);
                    // 3. Update all rebate rules to migrate key
                    monthlyRebates.forEach(rule => {
                        const ruleRef = doc(db!, "monthly_rebates", rule.id);
                        const updatedRebates = { ...rule.rebatesByTier };
                        updatedRebates[formData.name] = updatedRebates[originalName] || 0;
                        delete updatedRebates[originalName];
                        batch.update(ruleRef, { rebatesByTier: updatedRebates });
                    });
                } else {
                    // Simple update
                    const ref = doc(db!, "rewards", formData.name);
                    batch.update(ref, { ...formData });
                }
            }

            await batch.commit();
            onClose();
        } catch (error) {
            console.error("Save Tier Error:", error);
            alert("儲存失敗");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in">
                <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                    <h3 className="font-serif font-bold text-lg text-stone-800">{isCreate ? '新增會員等級' : '編輯等級'}</h3>
                    <button onClick={onClose}><X size={20} className="text-stone-400 hover:text-stone-800"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 uppercase">等級名稱</label>
                        <input 
                            required 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            placeholder="例如：黑鑽總監"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-brand-bronze"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 uppercase">升級門檻 (累積消費)</label>
                        <input 
                            type="number"
                            required 
                            value={formData.threshold} 
                            onChange={e => setFormData({...formData, threshold: Number(e.target.value)})} 
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-brand-bronze"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 uppercase">權益描述</label>
                        <textarea 
                            required 
                            rows={3}
                            value={formData.benefits} 
                            onChange={e => setFormData({...formData, benefits: e.target.value})} 
                            placeholder="列出該等級享有的服務..."
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-brand-bronze resize-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 uppercase">標籤顏色樣式 (Class)</label>
                        <select 
                            value={formData.color} 
                            onChange={e => setFormData({...formData, color: e.target.value})} 
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-brand-bronze cursor-pointer"
                        >
                            <option value="text-stone-600">標準灰 (Default)</option>
                            <option value="text-brand-bronze">品牌金 (Bronze)</option>
                            <option value="text-purple-600">尊爵紫 (Purple)</option>
                            <option value="text-blue-600">專業藍 (Blue)</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 text-sm font-bold">取消</button>
                        <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-700 text-sm font-bold flex justify-center items-center gap-2 shadow-lg">
                            {isSaving && <Loader2 size={16} className="animate-spin" />}
                            儲存
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
