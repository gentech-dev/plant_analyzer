
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { RewardTier, MonthlyRebateRule } from '../../types';
import { X, Loader2, DollarSign } from 'lucide-react';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface RebateEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    rule: MonthlyRebateRule | null;
    rewards: RewardTier[];
}

export const RebateEditorModal: React.FC<RebateEditorModalProps> = ({ isOpen, onClose, rule, rewards }) => {
    // Initialize rebates map. If create mode, init all tiers to 0.
    const initialRebates = rule?.rebatesByTier || rewards.reduce((acc, r) => ({...acc, [r.name]: 0}), {});

    const [threshold, setThreshold] = useState(rule?.threshold || 0);
    const [rebates, setRebates] = useState<Record<string, number>>(initialRebates);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const ruleId = rule?.id || `mr-${Date.now()}`;
            const newRule: MonthlyRebateRule = {
                id: ruleId,
                threshold,
                rebatesByTier: rebates
            };

            await setDoc(doc(db!, "monthly_rebates", ruleId), newRule);
            onClose();
        } catch (error) {
            console.error("Save Rule Error:", error);
            alert("儲存失敗");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRebateChange = (tierName: string, val: string) => {
        setRebates(prev => ({
            ...prev,
            [tierName]: Number(val)
        }));
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in max-h-[85vh]">
                <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                    <h3 className="font-serif font-bold text-lg text-stone-800">{rule ? '編輯回饋規則' : '新增回饋規則'}</h3>
                    <button onClick={onClose}><X size={20} className="text-stone-400 hover:text-stone-800"/></button>
                </div>
                
                <form id="rebateForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 uppercase">當月消費門檻 (Threshold)</label>
                        <div className="relative">
                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"/>
                            <input 
                                type="number"
                                required 
                                value={threshold} 
                                onChange={e => setThreshold(Number(e.target.value))}
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 pl-9 text-sm outline-none focus:border-brand-bronze font-mono font-bold text-stone-800"
                            />
                        </div>
                        <p className="text-[10px] text-stone-400">當會員單月已付款金額達到此數字時，觸發回饋。</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-stone-400 uppercase block">各等級回饋金額設定</label>
                        <div className="grid grid-cols-2 gap-4">
                            {rewards.map(tier => (
                                <div key={tier.name} className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-500">{tier.name}</label>
                                    <input 
                                        type="number"
                                        value={rebates[tier.name] || 0}
                                        onChange={e => handleRebateChange(tier.name, e.target.value)}
                                        className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-brand-bronze font-mono text-emerald-600 font-medium"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </form>

                <div className="p-5 border-t border-stone-100 flex gap-3 bg-stone-50">
                    <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-100 text-sm font-bold">取消</button>
                    <button type="submit" form="rebateForm" disabled={isSaving} className="flex-1 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-700 text-sm font-bold flex justify-center items-center gap-2 shadow-lg">
                        {isSaving && <Loader2 size={16} className="animate-spin" />}
                        儲存規則
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
