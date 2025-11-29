
import React from 'react';
import { RewardTier, User, Project, MonthlyRebateRule } from '../types';
import { Crown, TrendingUp, CheckCircle, ChevronRight, Lock, DollarSign, Calendar, Star, ArrowRight } from 'lucide-react';

interface RewardsProps {
    rewards: RewardTier[];
    monthlyRebates: MonthlyRebateRule[];
    user: User | null;
    projects: Project[];
}

export const Rewards: React.FC<RewardsProps> = ({ rewards, monthlyRebates, user, projects }) => {
  // 1. Lifetime Spend & Tier Logic
  const currentLifetimeSpend = user?.currentSpend || 0;
  const currentUserTier = user?.tier || '設計師';
  const sortedTiers = [...rewards].sort((a, b) => a.threshold - b.threshold);
  
  const nextTierIndex = sortedTiers.findIndex(t => t.threshold > currentLifetimeSpend);
  const currentTierObj = sortedTiers.find(t => t.name === currentUserTier) || sortedTiers[0];
  
  const nextTier = nextTierIndex !== -1 ? sortedTiers[nextTierIndex] : null;
  
  // 2. Monthly Rebate Logic
  const now = new Date();
  const currentMonthPaidSpend = projects
    .filter(p => {
        if (p.paymentStatus !== 'paid') return false;
        const pDate = new Date(p.date);
        return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0);

  // Sort monthly rules
  const sortedMonthlyRules = [...monthlyRebates].sort((a, b) => a.threshold - b.threshold);
  
  // Find current rebate rule based on spend
  // Fix: findLastIndex is not available in ES2020/ES2021. 
  // Using filter to find all applicable rules, then taking the last one (highest threshold).
  const applicableRules = sortedMonthlyRules.filter(r => currentMonthPaidSpend >= r.threshold);
  const currentRebateRule = applicableRules.length > 0 ? applicableRules[applicableRules.length - 1] : null;
  
  // Find next rebate target
  const nextRebateRule = sortedMonthlyRules.find(r => r.threshold > currentMonthPaidSpend);

  // Calculate specific rebate amount for current user tier
  const currentRebateAmount = currentRebateRule ? (currentRebateRule.rebatesByTier[currentUserTier] || 0) : 0;
  const nextRebateAmount = nextRebateRule ? (nextRebateRule.rebatesByTier[currentUserTier] || 0) : 0;

  // Calculate Progress Percentages
  // Lifetime
  const lifetimeGap = nextTier ? nextTier.threshold - currentTierObj.threshold : 1;
  // Fix division by zero or negative if user spend is way above threshold logic
  const lifetimeProgress = nextTier ? Math.min(100, Math.max(0, ((currentLifetimeSpend - currentTierObj.threshold) / (nextTier.threshold - currentTierObj.threshold)) * 100)) : 100;

  // Monthly
  const monthlyGap = nextRebateRule ? (currentRebateRule ? nextRebateRule.threshold - currentRebateRule.threshold : nextRebateRule.threshold) : 1;
  const monthlyBase = currentRebateRule ? currentRebateRule.threshold : 0;
  const monthlyProgress = nextRebateRule ? Math.min(100, Math.max(0, ((currentMonthPaidSpend - monthlyBase) / monthlyGap) * 100)) : 100;

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      <div className="text-center py-8">
        <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-800">會員獎勵計畫</h2>
        <p className="text-stone-500 mt-3 text-sm md:text-base font-light">等級越高，當月現金回饋比例越高</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* Card 1: Lifetime Membership Tier */}
          <div className="bg-white border border-stone-200 rounded-3xl p-8 relative overflow-hidden shadow-lg shadow-stone-200/30 flex flex-col justify-between">
             <div className="absolute top-0 right-0 w-64 h-64 bg-stone-100 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
             
             <div>
                 <div className="flex items-center gap-3 mb-6">
                     <div className="p-3 bg-stone-900 text-white rounded-full">
                         <Crown size={20} />
                     </div>
                     <div>
                         <h3 className="text-lg font-bold text-stone-800">會員等級權益</h3>
                         <p className="text-xs text-stone-500">根據歷史累積消費升級</p>
                     </div>
                 </div>

                 <div className="mb-8">
                     <p className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1">目前等級</p>
                     <h2 className="text-3xl font-serif text-stone-800">{currentTierObj.name}</h2>
                     <p className="text-sm text-stone-600 mt-2">{currentTierObj.benefits}</p>
                 </div>
             </div>

             <div>
                 {nextTier ? (
                     <>
                        <div className="flex justify-between text-xs font-medium mb-2">
                            <span className="text-stone-500">距離 {nextTier.name}</span>
                            <span className="text-stone-800">還差 NT$ {(nextTier.threshold - currentLifetimeSpend).toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-stone-800 rounded-full transition-all duration-1000" style={{ width: `${lifetimeProgress}%` }}></div>
                        </div>
                     </>
                 ) : (
                     <div className="p-3 bg-stone-100 rounded-lg text-center text-sm font-medium text-stone-600">
                         已達到最高等級，享有全方位尊榮服務
                     </div>
                 )}
             </div>
          </div>

          {/* Card 2: Monthly Cashback */}
          <div className="bg-stone-900 text-white border border-stone-800 rounded-3xl p-8 relative overflow-hidden shadow-lg shadow-stone-900/20 flex flex-col justify-between">
             <div className="absolute top-0 right-0 w-64 h-64 bg-brand-bronze/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
             
             <div>
                 <div className="flex items-center gap-3 mb-6">
                     <div className="p-3 bg-brand-bronze text-white rounded-full shadow-lg shadow-brand-bronze/30">
                         <DollarSign size={20} />
                     </div>
                     <div>
                         <h3 className="text-lg font-bold text-white">本月現金回饋</h3>
                         <p className="text-xs text-stone-400">當月已付款訂單滿額即贈</p>
                     </div>
                 </div>

                 <div className="mb-8">
                     <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-mono font-medium tracking-tight text-white">
                            NT$ {currentMonthPaidSpend.toLocaleString()}
                        </h2>
                        <span className="text-xs text-stone-400 font-medium bg-white/10 px-2 py-1 rounded">本月累積</span>
                     </div>
                     
                     <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                         <p className="text-xs text-stone-400 mb-1">以「{currentUserTier}」等級計算，目前符合回饋</p>
                         <p className="text-2xl font-bold text-brand-bronze">
                             NT$ {currentRebateAmount.toLocaleString()}
                         </p>
                     </div>
                 </div>
             </div>

             <div>
                 {nextRebateRule ? (
                     <>
                        <div className="flex justify-between text-xs font-medium mb-2 text-stone-300">
                            <span>下一個目標：回饋 NT$ {nextRebateAmount.toLocaleString()}</span>
                            <span>還差 NT$ {(nextRebateRule.threshold - currentMonthPaidSpend).toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-bronze rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(168,145,102,0.8)]" style={{ width: `${monthlyProgress}%` }}></div>
                        </div>
                     </>
                 ) : (
                     <div className="p-3 bg-white/10 rounded-lg text-center text-sm font-medium text-white border border-white/10">
                         太棒了！您已達到本月最高回饋門檻。
                     </div>
                 )}
             </div>
          </div>
      </div>

      {/* Info Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8 mt-12">
          
          {/* Tier Info */}
          <div className="xl:col-span-1">
              <h3 className="text-xl font-serif font-medium text-stone-800 mb-6 flex items-center gap-2">
                  <Star size={20} className="text-stone-400"/> 會員等級權益表
              </h3>
              <div className="space-y-4">
                  {sortedTiers.map(tier => {
                      const isCurrent = currentTierObj.name === tier.name;
                      return (
                          <div key={tier.name} className={`p-5 rounded-xl border transition-all ${isCurrent ? 'bg-white border-brand-bronze/50 shadow-md' : 'bg-stone-50 border-stone-200'}`}>
                              <div className="flex justify-between items-center mb-2">
                                  <h4 className={`font-bold ${isCurrent ? 'text-stone-800' : 'text-stone-500'}`}>{tier.name}</h4>
                                  {isCurrent && <span className="text-[10px] bg-brand-bronze text-white px-2 py-0.5 rounded">目前等級</span>}
                              </div>
                              <p className="text-xs text-stone-400 mb-2">累積消費滿 NT$ {tier.threshold.toLocaleString()}</p>
                              <div className="text-sm text-stone-600 flex items-start gap-2">
                                  <CheckCircle size={14} className="text-brand-bronze mt-0.5 shrink-0"/>
                                  {tier.benefits}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* Rebate Matrix Table */}
          <div className="xl:col-span-2">
              <h3 className="text-xl font-serif font-medium text-stone-800 mb-6 flex items-center gap-2">
                  <Calendar size={20} className="text-stone-400"/> 當月回饋對照表
              </h3>
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-stone-50 text-xs text-stone-500 font-bold uppercase">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">當月累積滿額</th>
                                {/* Dynamically generate columns for each tier */}
                                {sortedTiers.map(tier => (
                                    <th key={tier.name} className={`px-6 py-4 text-right whitespace-nowrap ${tier.name === currentUserTier ? 'bg-brand-bronze/5 text-brand-bronze' : ''}`}>
                                        {tier.name} 回饋
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {sortedMonthlyRules.map((rule, idx) => {
                                const isAchieved = currentMonthPaidSpend >= rule.threshold;
                                return (
                                    <tr key={rule.id} className={isAchieved ? 'bg-emerald-50/30' : 'hover:bg-stone-50'}>
                                        <td className="px-6 py-4 font-medium text-stone-800 font-mono whitespace-nowrap flex items-center gap-2">
                                            {isAchieved && <CheckCircle size={14} className="text-emerald-500"/>}
                                            NT$ {rule.threshold.toLocaleString()}
                                        </td>
                                        {sortedTiers.map(tier => (
                                            <td key={tier.name} className={`px-6 py-4 text-right font-mono ${tier.name === currentUserTier ? 'bg-brand-bronze/5 font-bold text-brand-bronze' : 'text-stone-600'}`}>
                                                NT$ {(rule.rebatesByTier[tier.name] || 0).toLocaleString()}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-stone-50 border-t border-stone-100 text-xs text-stone-400 text-center">
                      * 回饋金額取決於您當下的會員等級，升級後所有級距的回饋金將同步提升。
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
};
