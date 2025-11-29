
import React, { useState } from 'react';
import { RewardTier, MonthlyRebateRule, User } from '../../types';
import { 
    Plus, Edit2, Trash2, Crown, DollarSign, Info, Lock
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { TierEditorModal } from './TierEditorModal';
import { RebateEditorModal } from './RebateEditorModal';

interface RewardManagerProps {
  currentUser: User | null;
  rewards: RewardTier[];
  setRewards: React.Dispatch<React.SetStateAction<RewardTier[]>>;
  monthlyRebates: MonthlyRebateRule[];
  setMonthlyRebates: React.Dispatch<React.SetStateAction<MonthlyRebateRule[]>>;
}

export const RewardManager: React.FC<RewardManagerProps> = ({ 
    currentUser, rewards, setRewards, monthlyRebates, setMonthlyRebates 
}) => {
  const isSuperAdmin = currentUser?.role === 'admin';
  
  // Modal States
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<RewardTier | null>(null);
  
  const [isRebateModalOpen, setIsRebateModalOpen] = useState(false);
  const [editingRebate, setEditingRebate] = useState<MonthlyRebateRule | null>(null);

  // --- Handlers for Tiers ---
  const handleEditTier = (tier: RewardTier) => {
      if (!isSuperAdmin) return;
      setEditingTier(tier);
      setIsTierModalOpen(true);
  };

  const handleCreateTier = () => {
      if (!isSuperAdmin) return;
      setEditingTier(null);
      setIsTierModalOpen(true);
  };

  const handleDeleteTier = async (tierName: string) => {
      if (!isSuperAdmin) return;
      if (!confirm(`確定要刪除會員等級「${tierName}」嗎？\n\n警告：這將同時移除所有回饋規則中關於此等級的設定。`)) return;

      try {
          const batch = writeBatch(db!);
          
          // 1. Delete the Tier document
          const tierRef = doc(db!, "rewards", tierName);
          batch.delete(tierRef);

          // 2. Clean up this tier from all Monthly Rebate Rules
          monthlyRebates.forEach(rule => {
              const ruleRef = doc(db!, "monthly_rebates", rule.id);
              const updatedRebates = { ...rule.rebatesByTier };
              delete updatedRebates[tierName];
              batch.update(ruleRef, { rebatesByTier: updatedRebates });
          });

          await batch.commit();
          alert("等級已刪除");
      } catch (error) {
          console.error("Error deleting tier:", error);
          alert("刪除失敗");
      }
  };

  // --- Handlers for Rebate Rules ---
  const handleEditRebate = (rule: MonthlyRebateRule) => {
      if (!isSuperAdmin) return;
      setEditingRebate(rule);
      setIsRebateModalOpen(true);
  };

  const handleCreateRebate = () => {
      if (!isSuperAdmin) return;
      setEditingRebate(null);
      setIsRebateModalOpen(true);
  };

  const handleDeleteRebate = async (ruleId: string) => {
      if (!isSuperAdmin) return;
      if (!confirm("確定要刪除此回饋規則嗎？")) return;

      try {
          await deleteDoc(doc(db!, "monthly_rebates", ruleId));
      } catch (error) {
          console.error("Error deleting rule:", error);
      }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl h-full flex flex-col overflow-hidden relative shadow-sm">
        
        <div className="p-6 border-b border-stone-100 bg-white z-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-2">
                        獎勵與回饋設定
                        {!isSuperAdmin && <span className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded flex items-center gap-1"><Lock size={10}/> 唯讀</span>}
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">設定會員等級門檻與月度現金回饋比例</p>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-stone-50/30 custom-scrollbar">
            
            {/* 1. Membership Tiers Section */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                        <Crown size={18} className="text-brand-bronze"/> 會員等級 (Membership Tiers)
                    </h3>
                    {isSuperAdmin && (
                        <button onClick={handleCreateTier} className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-stone-700 transition-colors shadow-sm">
                            <Plus size={14}/> 新增等級
                        </button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {rewards.map((tier) => (
                        <div key={tier.name} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${tier.color?.includes('bronze') ? 'bg-brand-bronze' : tier.color?.includes('purple') ? 'bg-purple-600' : 'bg-stone-400'}`}></div>
                            
                            <div className="flex justify-between items-start mb-3 pl-2">
                                <div>
                                    <h4 className="font-bold text-lg text-stone-800">{tier.name}</h4>
                                    <p className="text-xs text-stone-400 font-mono mt-0.5">Threshold</p>
                                </div>
                                {isSuperAdmin && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditTier(tier)} className="p-1.5 hover:bg-stone-100 rounded text-stone-500"><Edit2 size={14}/></button>
                                        <button onClick={() => handleDeleteTier(tier.name)} className="p-1.5 hover:bg-red-50 rounded text-stone-400 hover:text-red-500"><Trash2 size={14}/></button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="pl-2">
                                <div className="text-2xl font-mono font-bold text-stone-800 mb-3">
                                    ${tier.threshold.toLocaleString()}
                                </div>
                                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100 min-h-[60px]">
                                    <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                                        {tier.benefits}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <hr className="border-stone-200"/>

            {/* 2. Monthly Rebate Rules Section */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                        <DollarSign size={18} className="text-emerald-600"/> 月度回饋規則 (Rebate Matrix)
                    </h3>
                    {isSuperAdmin && (
                        <button onClick={handleCreateRebate} className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-stone-700 transition-colors shadow-sm">
                            <Plus size={14}/> 新增規則
                        </button>
                    )}
                </div>

                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-stone-50 text-xs text-stone-500 font-bold uppercase border-b border-stone-200">
                                <tr>
                                    <th className="px-6 py-4 whitespace-nowrap bg-stone-50 sticky left-0 z-10 border-r border-stone-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                        當月消費達標 (Threshold)
                                    </th>
                                    {rewards.map((r) => (
                                        <th key={r.name} className="px-6 py-4 text-right whitespace-nowrap min-w-[120px]">
                                            {r.name} 回饋金
                                        </th>
                                    ))}
                                    {isSuperAdmin && <th className="px-6 py-4 text-right w-20">操作</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {monthlyRebates.length === 0 ? (
                                    <tr>
                                        <td colSpan={rewards.length + 2} className="px-6 py-10 text-center text-stone-400 text-xs">
                                            尚未設定回饋規則
                                        </td>
                                    </tr>
                                ) : (
                                    monthlyRebates.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-stone-50 transition-colors group">
                                            <td className="px-6 py-4 font-mono font-bold text-stone-800 bg-white group-hover:bg-stone-50 sticky left-0 z-10 border-r border-stone-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                NT$ {rule.threshold.toLocaleString()}
                                            </td>
                                            {rewards.map((r) => {
                                                const amount = rule.rebatesByTier[r.name] || 0;
                                                return (
                                                    <td key={r.name} className="px-6 py-4 text-right">
                                                        <span className={`font-mono font-medium ${amount > 0 ? 'text-emerald-600' : 'text-stone-300'}`}>
                                                            ${amount.toLocaleString()}
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                            {isSuperAdmin && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditRebate(rule)} className="text-stone-400 hover:text-stone-800"><Edit2 size={14}/></button>
                                                        <button onClick={() => handleDeleteRebate(rule.id)} className="text-stone-400 hover:text-red-500"><Trash2 size={14}/></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <p className="text-[10px] text-stone-400 mt-2 pl-1 flex items-center gap-1">
                    <Info size={12}/> 設定當月已付款金額達到左側門檻時，不同等級會員可獲得的現金回饋金額。
                </p>
            </section>
        </div>

        {/* --- MODALS --- */}
        {isTierModalOpen && (
            <TierEditorModal 
                isOpen={isTierModalOpen} 
                onClose={() => setIsTierModalOpen(false)}
                tier={editingTier}
                monthlyRebates={monthlyRebates}
            />
        )}

        {isRebateModalOpen && (
            <RebateEditorModal
                isOpen={isRebateModalOpen}
                onClose={() => setIsRebateModalOpen(false)}
                rule={editingRebate}
                rewards={rewards}
            />
        )}

    </div>
  );
};
