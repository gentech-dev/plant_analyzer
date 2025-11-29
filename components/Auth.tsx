
import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Lock, Building2, User as UserIcon, Loader2, Smartphone, FileText, AlertCircle, ArrowRight, Phone, MapPin, Clock, MessageCircle } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from '../firebase';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Strict Check: Ensure Firebase is initialized
    if (!auth || !db) {
        setError("系統錯誤：無法連接至身份驗證伺服器 (Firebase Auth/DB Not Initialized)。請檢查您的環境變數 (.env) 設定是否正確。");
        setIsLoading(false);
        return;
    }

    try {
        if (isRegister) {
            // --- REAL REGISTRATION ---
            // 1. Create User in Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // 2. Update Auth Profile
            await updateProfile(firebaseUser, { displayName: name });

            // 3. Create User Document in Firestore
            const newUser: User = {
                id: firebaseUser.uid,
                name: name,
                email: email,
                company: company,
                phone: phone,
                taxId: taxId,
                role: 'designer', // Default role
                tier: '設計師',   // Default tier
                currentSpend: 0,
                status: 'active',
                joinDate: new Date().toISOString()
            };

            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
            
            // 4. Login Success
            onLogin(newUser);

        } else {
            // --- REAL LOGIN ---
            // 1. Sign In
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // 2. Fetch User Profile from Firestore
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as User;
                // Ensure ID is set
                userData.id = firebaseUser.uid; 
                onLogin(userData);
            } else {
                // Handle edge case where Auth exists but Firestore doc doesn't (e.g. manually created in console)
                // Create a basic profile on the fly
                const fallbackUser: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || email.split('@')[0],
                    email: email,
                    company: 'Unknown',
                    role: 'designer',
                    tier: '設計師',
                    status: 'active',
                    joinDate: new Date().toISOString()
                };
                await setDoc(userDocRef, fallbackUser);
                onLogin(fallbackUser);
            }
        }
        
    } catch (err: any) {
        console.error("Auth Error:", err);
        if (err.message && err.message.includes("密碼錯誤")) {
             setError("密碼錯誤。");
        } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
            setError("帳號或密碼錯誤，請重試。");
        } else if (err.code === 'auth/user-not-found') {
            setError("找不到此帳號，請先註冊。");
        } else if (err.code === 'auth/email-already-in-use') {
            setError("此 Email 已經被註冊過了。");
        } else if (err.code === 'auth/weak-password') {
            setError("密碼強度不足 (至少 6 位數)。");
        } else if (err.code === 'auth/network-request-failed') {
            setError("網路連線失敗，請檢查您的網路狀態。");
        } else {
            setError(`登入失敗：${err.message}`);
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4 relative overflow-y-auto">
      
      <div className="w-full max-w-5xl bg-white border border-stone-100 rounded-3xl shadow-2xl shadow-stone-200/50 overflow-hidden flex flex-col md:flex-row relative z-10 min-h-fit md:min-h-[640px] my-8">
        
        {/* Left Side: Brand Visual */}
        <div className="hidden md:flex md:w-1/2 bg-stone-100 relative flex-col justify-between p-12">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-90 grayscale-[10%]"></div>
           <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
           
           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-8">
                <img 
                   src="https://shoplineimg.com/566528b00390552841000036/66ce85144ab3872821731cf8/1200x.webp?source_format=png" 
                   alt="Gentech Logo" 
                   className="h-12 w-auto object-contain mix-blend-multiply"
                />
             </div>
           </div>

           <div className="relative z-10 space-y-8">
             <h2 className="text-4xl font-serif font-medium text-stone-900 leading-tight">
               Lighting Design<br/>
               <span className="text-brand-bronze italic">Reimagined.</span>
             </h2>
             <ul className="space-y-5 text-stone-700">
               <li className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-bronze border border-stone-200 shadow-sm">
                   <ArrowRight size={14} />
                 </div>
                 <span className="font-medium">AI 智慧照明提案生成</span>
               </li>
               <li className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-bronze border border-stone-200 shadow-sm">
                   <ArrowRight size={14} />
                 </div>
                 <span className="font-medium">B2B 專屬採購與返利</span>
               </li>
               <li className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-bronze border border-stone-200 shadow-sm">
                   <ArrowRight size={14} />
                 </div>
                 <span className="font-medium">完整 CAD / IES 下載</span>
               </li>
             </ul>
           </div>
           
           <div className="relative z-10 text-xs text-stone-500 font-medium">
             © 2025 Gentech Lighting. Japanese Modern Aesthetics.
           </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative">
          
          <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
            <div className="md:hidden flex items-center gap-2 mb-10 justify-center">
               <img 
                   src="https://shoplineimg.com/566528b00390552841000036/66ce85144ab3872821731cf8/1200x.webp?source_format=png" 
                   alt="Gentech Logo" 
                   className="h-10 w-auto object-contain mix-blend-multiply"
               />
            </div>

            <div className="mb-8 text-center md:text-left">
              <h2 className="text-3xl font-serif text-stone-800 mb-3">
                {isRegister ? 'Create Account 建立帳戶' : 'Welcome Back 歡迎登入'}
              </h2>
              <p className="text-stone-500 text-sm font-light">
                {isRegister ? '加入 Gentech Pro，開啟您的 AI 照明設計之旅。' : '請輸入您的帳號密碼以進入系統。'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 ml-1 uppercase tracking-wider">姓名</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="您的稱呼"
                          className="w-full bg-white border border-stone-200 text-stone-800 pl-11 pr-4 py-3.5 rounded-xl focus:ring-1 focus:ring-brand-bronze focus:border-brand-bronze outline-none transition-all placeholder:text-stone-400"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 ml-1 uppercase tracking-wider">手機</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                        <input 
                          type="tel" 
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0912345678"
                          className="w-full bg-white border border-stone-200 text-stone-800 pl-11 pr-4 py-3.5 rounded-xl focus:ring-1 focus:ring-brand-bronze focus:border-brand-bronze outline-none transition-all placeholder:text-stone-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 ml-1 uppercase tracking-wider">公司/工作室名稱</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                      <input 
                        type="text" 
                        required
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="例：靖軒科技有限公司"
                        className="w-full bg-white border border-stone-200 text-stone-800 pl-11 pr-4 py-3.5 rounded-xl focus:ring-1 focus:ring-brand-bronze focus:border-brand-bronze outline-none transition-all placeholder:text-stone-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 ml-1 uppercase tracking-wider">統一編號</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                      <input 
                        type="text" 
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="8碼統編 (選填)"
                        className="w-full bg-white border border-stone-200 text-stone-800 pl-11 pr-4 py-3.5 rounded-xl focus:ring-1 focus:ring-brand-bronze focus:border-brand-bronze outline-none transition-all placeholder:text-stone-400"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 ml-1 uppercase tracking-wider">電子信箱</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-white border border-stone-200 text-stone-800 pl-11 pr-4 py-3.5 rounded-xl focus:ring-1 focus:ring-brand-bronze focus:border-brand-bronze outline-none transition-all placeholder:text-stone-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-stone-400 ml-1 uppercase tracking-wider">密碼</label>
                    {!isRegister && <a href="#" className="text-xs text-brand-bronze hover:underline">忘記密碼？</a>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-stone-200 text-stone-800 pl-11 pr-4 py-3.5 rounded-xl focus:ring-1 focus:ring-brand-bronze focus:border-brand-bronze outline-none transition-all placeholder:text-stone-400"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-stone-900 text-white font-medium py-4 rounded-xl hover:bg-brand-bronze hover:shadow-lg transition-all duration-300 active:scale-[0.98] mt-6 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed tracking-wide"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                {isRegister ? '註冊帳號' : '立即登入'}
              </button>
            </form>

            <div className="mt-6 text-center pt-6">
              <p className="text-stone-500 text-sm">
                {isRegister ? '已經有帳號了嗎？' : '還沒有帳號嗎？'}{' '}
                <button 
                  onClick={() => {
                      setIsRegister(!isRegister);
                      setError(null);
                  }}
                  className="text-brand-bronze hover:text-brand-bronzeDark font-semibold transition-colors"
                >
                  {isRegister ? '返回登入' : '申請設計師帳號'}
                </button>
              </p>
            </div>
          </div>

          {/* Trusted Footer Info */}
          <div className="mt-8 pt-8 border-t border-stone-100">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Contact & Support</h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                      <Phone size={14} className="text-brand-bronze"/> (02) 2263-0026
                  </div>
                  <div className="flex items-center gap-2">
                      <MessageCircle size={14} className="text-brand-bronze"/> LINE: @genshop
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                      <Mail size={14} className="text-brand-bronze"/> gentechled@gmail.com
                  </div>
                  <div className="flex items-start gap-2 col-span-2">
                      <Clock size={14} className="text-brand-bronze shrink-0 mt-0.5"/> 
                      <span>09:00~12:30 / 13:30~17:30</span>
                  </div>
                  <div className="flex items-start gap-2 col-span-2">
                      <MapPin size={14} className="text-brand-bronze shrink-0 mt-0.5"/> 
                      <span>新北市土城區青雲路434巷10號3樓</span>
                  </div>
              </div>
              <div className="mt-4 text-[10px] text-stone-400 border-t border-stone-100 pt-2 flex justify-between items-center">
                  <span>© 靖軒科技有限公司</span>
                  <span>統編: 53682530</span>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};
