
import React, { useState, useMemo, useEffect } from 'react';
import { User, RewardTier } from '../../types';
import { 
    Plus, Edit2, Trash2, Search, 
    Users, UserPlus, Shield, Building2, Mail, Phone
} from 'lucide-react';
import { db, provisionAccount } from '../../firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { UserEditorModal } from './UserEditorModal';

interface UserManagerProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  rewards: RewardTier[];
  currentUser: User | null;
}

export const UserManager: React.FC<UserManagerProps> = ({ users, setUsers, rewards, currentUser }) => {
  const isSuperAdmin = currentUser?.role === 'admin';
  const [filterType, setFilterType] = useState<'designers' | 'staff'>('designers');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Security: Reset filter if user loses admin rights
  useEffect(() => {
      if (!isSuperAdmin && filterType === 'staff') {
          setFilterType('designers');
      }
  }, [isSuperAdmin, filterType]);

  // --- Statistics ---
  const stats = useMemo(() => {
      const total = users.length;
      const staff = users.filter(u => ['admin', 'sales', 'support'].includes(u.role)).length;
      const designers = users.filter(u => u.role === 'designer').length;
      const newThisMonth = users.filter(u => {
          if (!u.joinDate) return false;
          const date = new Date(u.joinDate);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length;
      return { total, staff, designers, newThisMonth };
  }, [users]);

  // --- Filtering ---
  const filteredUsers = useMemo(() => {
      let result = users;
      
      // Type Filter
      if (filterType === 'staff') {
          result = result.filter(u => ['admin', 'sales', 'support'].includes(u.role));
      } else {
          result = result.filter(u => u.role === 'designer');
      }

      // Search Filter
      if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          result = result.filter(u => 
              u.name.toLowerCase().includes(q) || 
              u.email.toLowerCase().includes(q) || 
              u.company?.toLowerCase().includes(q)
          );
      }

      return result;
  }, [users, filterType, searchTerm]);

  // --- Actions ---
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditorMode('edit');
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setEditorMode('create');
    setIsEditorOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isSuperAdmin) return; // Double check logic
    if (!confirm("確定要刪除此用戶資料嗎？\n\n注意：這只會刪除資料庫中的用戶資料 (Profile)。\n若要完全禁止該用戶登入，請務必至 Firebase Authentication 控制台刪除該帳號。")) return;
    
    if (db) {
        try {
            await deleteDoc(doc(db, "users", userId));
            alert("用戶資料已從資料庫移除。");
        } catch (e) {
            console.error("Delete failed", e);
            alert("刪除失敗，請檢查權限或網路。");
        }
    }
  };

  const handleUserSave = async (userData: any) => {
    if (editorMode === 'create') {
        try {
            const uid = await provisionAccount(userData.email, userData.password);
            
            const newUser: User = {
                id: uid,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                company: userData.company,
                phone: userData.phone || '',
                joinDate: new Date().toISOString(),
                status: 'active',
                currentSpend: 0
            };

            if (userData.role === 'designer') {
                newUser.tier = userData.tier || '設計師';
            }

            await setDoc(doc(db, "users", uid), newUser);
            alert(`成功建立帳號：${userData.email}`);
        } catch (e: any) {
            console.error(e);
            let msg = e.message;
            if (msg.includes('email-already-in-use') || e.code === 'auth/email-already-in-use') {
                msg = "此 Email 已經被註冊過了。";
            }
            alert("建立失敗：" + msg);
            return;
        }
    } else {
        if (!selectedUser?.id) return;
        const updates: any = {
            name: userData.name,
            role: userData.role,
            company: userData.company,
            phone: userData.phone,
            status: userData.status // Update status logic added
        };
        if (userData.role === 'designer') {
            updates.tier = userData.tier;
        }
        await updateDoc(doc(db, "users", selectedUser.id), updates);
    }
    setIsEditorOpen(false);
  };

  const getRoleBadge = (role: string) => {
      switch(role) {
          case 'admin': return <span className="bg-stone-800 text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Admin</span>;
          case 'sales': return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Sales</span>;
          case 'support': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Support</span>;
          default: return <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Designer</span>;
      }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* 1. Stats Overview */}
      <div className={`grid grid-cols-1 md:grid-cols-${isSuperAdmin ? '3' : '2'} gap-4 shrink-0`}>
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">總會員數</p>
                  <p className="text-2xl font-serif font-bold text-stone-800 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-stone-100 rounded-xl text-stone-500"><Users size={20}/></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">本月新進</p>
                  <p className="text-2xl font-serif font-bold text-brand-bronze mt-1">+{stats.newThisMonth}</p>
              </div>
              <div className="p-3 bg-brand-bronze/10 rounded-xl text-brand-bronze"><UserPlus size={20}/></div>
          </div>
          
          {/* Internal Team Stats - Only visible to Super Admin */}
          {isSuperAdmin && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">內部團隊</p>
                    <p className="text-2xl font-serif font-bold text-stone-800 mt-1">{stats.staff}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-blue-500"><Shield size={20}/></div>
            </div>
          )}
      </div>

      {/* 2. Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-full md:w-auto">
              <button 
                  onClick={() => setFilterType('designers')}
                  className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'designers' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
              >
                  設計師會員
              </button>
              
              {/* Internal Permissions Filter - Only visible to Super Admin */}
              {isSuperAdmin && (
                <button 
                    onClick={() => setFilterType('staff')}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'staff' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
                >
                    內部權限
                </button>
              )}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16}/>
                  <input 
                      type="text" 
                      placeholder="搜尋姓名、Email、公司..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze/20 transition-all"
                  />
              </div>
              
              <button 
                  onClick={handleCreate}
                  className="bg-stone-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-stone-700 shadow-md transition-all whitespace-nowrap"
              >
                  <Plus size={16} /> 新增{filterType === 'staff' ? '員工' : '會員'}
              </button>
          </div>
      </div>

      {/* 3. User Grid */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredUsers.map(user => (
                  <div key={user.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-inner
                                  ${user.role === 'admin' ? 'bg-stone-800 text-white' : 
                                    user.role === 'sales' ? 'bg-emerald-100 text-emerald-700' :
                                    user.role === 'support' ? 'bg-blue-100 text-blue-700' :
                                    'bg-stone-100 text-stone-500'}
                              `}>
                                  {user.name.charAt(0)}
                              </div>
                              <div>
                                  <h4 className="font-bold text-stone-800 text-sm truncate max-w-[120px]" title={user.name}>{user.name}</h4>
                                  <div className="flex gap-2 mt-1">
                                      {getRoleBadge(user.role)}
                                  </div>
                              </div>
                          </div>
                          
                          {/* Status Indicator */}
                          <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} title={user.status === 'active' ? '活躍中' : '已停權'}></div>
                      </div>

                      <div className="space-y-2.5 mb-6 flex-1">
                          <div className="flex items-center gap-2 text-xs text-stone-500 truncate" title={user.company}>
                              <Building2 size={14} className="text-stone-300 shrink-0"/>
                              {user.company || '未填寫公司'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-stone-500 truncate" title={user.email}>
                              <Mail size={14} className="text-stone-300 shrink-0"/>
                              {user.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                              <Phone size={14} className="text-stone-300 shrink-0"/>
                              {user.phone || '-'}
                          </div>
                          {user.role === 'designer' && (
                              <div className="pt-2 mt-2 border-t border-stone-50 flex justify-between items-center">
                                  <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Level</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${user.tier === '黑鑽總監' ? 'bg-stone-900 text-brand-bronze border-brand-bronze' : 'bg-stone-50 text-stone-600 border-stone-200'}`}>
                                      {user.tier || '設計師'}
                                  </span>
                              </div>
                          )}
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-stone-100">
                          <button 
                              onClick={() => handleEdit(user)}
                              className="flex-1 py-2 bg-stone-50 text-stone-600 rounded-lg text-xs font-bold hover:bg-stone-100 hover:text-stone-900 transition-colors flex items-center justify-center gap-1"
                          >
                              <Edit2 size={12}/> 編輯
                          </button>
                          
                          {/* CRITICAL: ONLY Super Admin can see Delete Button */}
                          {isSuperAdmin && (
                              <button 
                                  onClick={() => user.id && handleDeleteUser(user.id)}
                                  className="py-2 px-3 bg-white border border-stone-200 text-stone-400 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                                  title="刪除用戶"
                              >
                                  <Trash2 size={14}/>
                              </button>
                          )}
                      </div>
                  </div>
              ))}
          </div>
          {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                  <Users size={48} className="opacity-20 mb-4"/>
                  <p>沒有找到符合條件的用戶</p>
              </div>
          )}
      </div>

      {/* Edit/Create Modal */}
      {isEditorOpen && (
          <UserEditorModal 
              isOpen={isEditorOpen} 
              onClose={() => setIsEditorOpen(false)} 
              mode={editorMode}
              user={selectedUser}
              onSave={handleUserSave}
              rewards={rewards}
              currentUser={currentUser} // Pass currentUser for role check
          />
      )}
    </div>
  );
};
