
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { UserProjects } from './components/UserProjects';
import { Catalog } from './components/Catalog';
import { AIConsultant } from './components/AIConsultant';
import { ProjectQuote } from './components/ProjectQuote';
import { Rewards } from './components/Rewards';
import { ResourcesGallery } from './components/ResourcesGallery';
// UPDATED: Explicitly pointing to the modular AdminDashboard in the 'admin' folder
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Auth } from './components/Auth';
import { CustomerSupport } from './components/CustomerSupport';
import { CreateProjectModal } from './components/CreateProjectModal';
import { SettingsModal } from './components/SettingsModal';
import { BookingModal } from './components/BookingModal';
import { AppView, QuoteItem, Product, User, RewardTier, GalleryItem, ChatSession, ChatMessage, Project, ProjectFile, Annotation, MonthlyRebateRule, Attachment, Booking } from './types';
import { MOCK_REWARDS, MOCK_GALLERY, MOCK_USERS, INITIAL_CATEGORIES, INITIAL_SPEC_KEYS, MOCK_MONTHLY_REBATES, MOCK_PRODUCTS } from './constants'; 
import { Menu, Loader2, WifiOff, Phone, Clock, MapPin, MessageCircle, Mail } from 'lucide-react';
import { db, auth } from './firebase'; 
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, addDoc, setDoc, doc, updateDoc, deleteDoc, query, where, getDocs, orderBy, writeBatch, getDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true); 
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // --- Data State (Synced with Firestore) ---
  const [projects, setProjects] = useState<Project[]>([]); 
  const [products, setProducts] = useState<Product[]>([]); 
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [users, setUsers] = useState<User[]>([]); 
  
  // --- UI State ---
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // --- Admin/Global State ---
  const [rewards, setRewards] = useState<RewardTier[]>([]); 
  const [monthlyRebates, setMonthlyRebates] = useState<MonthlyRebateRule[]>([]); 
  const [gallery, setGallery] = useState<GalleryItem[]>(MOCK_GALLERY);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [specKeys, setSpecKeys] = useState<string[]>(INITIAL_SPEC_KEYS);

  // ==================================================================================
  // FIRESTORE SYNCHRONIZATION
  // ==================================================================================

  // -1. Auth Persistence Listener
  useEffect(() => {
    if (!auth) {
        setIsAuthChecking(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            if (db) {
                try {
                    const docRef = doc(db, "users", firebaseUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const userData = docSnap.data() as User;
                        userData.id = firebaseUser.uid; 
                        setUser(userData);
                    } else {
                         setUser(null);
                    }
                } catch (e) {
                    console.error("Auth fetch error", e);
                }
            }
        } else {
            setUser(null);
        }
        setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // 0. Sync Current User Profile
  useEffect(() => {
    if (!db || !user?.id) return;
    const userRef = doc(db, "users", user.id);
    const unsub = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const remoteUserData = docSnap.data() as User;
            setUser(prevUser => {
                if (!prevUser) return null;
                if (remoteUserData.role !== prevUser.role || remoteUserData.tier !== prevUser.tier) {
                    return { ...prevUser, ...remoteUserData };
                }
                return prevUser;
            });
        }
    });
    return () => unsub();
  }, [user?.id]);

  // 1. Sync Products
  useEffect(() => {
    if (!db) {
        setIsOfflineMode(true);
        return;
    }
    
    setIsLoadingData(true);
    const unsub = onSnapshot(collection(db, "products"), async (snapshot) => {
        if (snapshot.empty && !isLoadingData) {
            const batch = writeBatch(db);
            MOCK_PRODUCTS.forEach(p => {
                const ref = doc(db, "products", p.id);
                batch.set(ref, p);
            });
            await batch.commit();
        } else {
            const list = snapshot.docs.map(doc => doc.data() as Product);
            setProducts(list);
        }
        setIsLoadingData(false);
    }, (error) => {
        console.error("DB Error (Products):", error);
        setIsOfflineMode(true);
        setIsLoadingData(false);
    });
    return () => unsub();
  }, []);

  // 1.1 Sync Rewards
  useEffect(() => {
    if (!db) {
        setRewards(MOCK_REWARDS);
        return;
    }
    const unsub = onSnapshot(collection(db, "rewards"), async (snapshot) => {
        if (snapshot.empty) {
            const batch = writeBatch(db);
            MOCK_REWARDS.forEach(r => batch.set(doc(db, "rewards", r.name), r));
            await batch.commit();
        } else {
            const list = snapshot.docs.map(doc => doc.data() as RewardTier);
            list.sort((a, b) => a.threshold - b.threshold);
            setRewards(list);
        }
    });
    return () => unsub();
  }, []);

  // 1.2 Sync Rebates
  useEffect(() => {
    if (!db) {
        setMonthlyRebates(MOCK_MONTHLY_REBATES);
        return;
    }
    const unsub = onSnapshot(collection(db, "monthly_rebates"), async (snapshot) => {
        if (snapshot.empty) {
            const batch = writeBatch(db);
            MOCK_MONTHLY_REBATES.forEach(r => batch.set(doc(db, "monthly_rebates", r.id), r));
            await batch.commit();
        } else {
            const list = snapshot.docs.map(doc => doc.data() as MonthlyRebateRule);
            list.sort((a, b) => a.threshold - b.threshold);
            setMonthlyRebates(list);
        }
    });
    return () => unsub();
  }, []);

  // 1.3 Sync Metadata (Categories & Specs) - NEW
  useEffect(() => {
    if (!db) {
        setCategories(INITIAL_CATEGORIES);
        setSpecKeys(INITIAL_SPEC_KEYS);
        return;
    }
    const unsub = onSnapshot(doc(db, "settings", "metadata"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.categories) setCategories(data.categories);
            if (data.specKeys) setSpecKeys(data.specKeys);
        } else {
            // Initialize if missing
            setDoc(doc(db, "settings", "metadata"), {
                categories: INITIAL_CATEGORIES,
                specKeys: INITIAL_SPEC_KEYS
            });
        }
    });
    return () => unsub();
  }, []);

  // 2. Sync Projects
  useEffect(() => {
    if (!db || !user) return;
    const q = collection(db, "projects");
    const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as Project);
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setProjects(list);
    });
    return () => unsub();
  }, [user]);

  // 3. Sync Bookings
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "bookings"), (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as Booking);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBookings(list);
    });
    return () => unsub();
  }, []);

  // 4. Sync Chat Sessions
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "chats"), (snapshot) => {
        const list = snapshot.docs.map(doc => {
            const data = doc.data() as any; 
            const fixedMessages = (data.messages || []).map((m: any) => ({
                ...m,
                timestamp: m.timestamp?.toDate ? m.timestamp.toDate() : (new Date(m.timestamp) || new Date())
            }));
            const fixedLastUpdated = data.lastUpdated?.toDate ? data.lastUpdated.toDate() : (new Date(data.lastUpdated) || new Date());
            return { ...data, messages: fixedMessages, lastUpdated: fixedLastUpdated } as ChatSession;
        });
        list.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        setChatSessions(list);
    });
    return () => unsub();
  }, []);

  // 5. Sync Users
  useEffect(() => {
    if (!db || !user || !['admin', 'sales', 'support'].includes(user.role)) {
        if (!user) setUsers([]); 
        return;
    }
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
        const list = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as User));
        setUsers(list);
    });
    return () => unsub();
  }, [user]); 

  // --- Handlers ---

  const handleLogin = (userData: User) => setUser(userData);

  const handleLogout = () => {
    if (auth) auth.signOut();
    setUser(null);
    setUsers([]);
    setCurrentView(AppView.DASHBOARD);
    setMobileMenuOpen(false);
    setActiveProjectId(null);
    setIsSupportOpen(false);
  };

  const handleUpdateUser = async (updatedData: Partial<User>) => {
      if (!user) return;
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      if (db) await updateDoc(doc(db, "users", user.id!), updatedData);
  };

  // Wrapper to sync Categories changes to Firestore
  const setCategoriesWrapper = async (newCategories: string[] | ((prev: string[]) => string[])) => {
      let updated: string[];
      if (typeof newCategories === 'function') {
          updated = newCategories(categories);
      } else {
          updated = newCategories;
      }
      setCategories(updated);
      if (db) await setDoc(doc(db, "settings", "metadata"), { categories: updated }, { merge: true });
  };

  const currentUserId = user?.id || user?.email || 'guest';
  
  // FIX: Frontend dashboard always shows ONLY the current user's projects, even for admins.
  // Admins can see all projects in the AdminDashboard view.
  const currentUserProjects = projects.filter(p => p.userId === currentUserId);
      
  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // Product CRUD
  const handleCreateProduct = async (product: Product) => { if(db) await setDoc(doc(db, "products", product.id), product); };
  const handleUpdateProduct = async (product: Product) => { if(db) await setDoc(doc(db, "products", product.id), product); };
  const handleDeleteProduct = async (productId: string) => { if(db) await deleteDoc(doc(db, "products", productId)); };

  // Project Handlers
  const handleCreateProject = async (newProjectData: Partial<Project>, files: ProjectFile[] = []) => {
      const newProjectId = `pj-${Date.now()}`;
      const newProject: Project = {
          id: newProjectId,
          userId: currentUserId,
          name: newProjectData.name || '未命名專案',
          client: newProjectData.client || '未知客戶',
          status: '規劃中',
          paymentStatus: 'unpaid',
          budget: newProjectData.budget || 0,
          date: new Date().toISOString().split('T')[0],
          items: [],
          files: files, 
          lastModified: new Date()
      };
      setProjects(prev => [newProject, ...prev]);
      if (db) await setDoc(doc(db, "projects", newProjectId), newProject);
      setActiveProjectId(newProjectId);
      setCurrentView(AppView.CATALOG); 
      setIsCreateProjectModalOpen(false);
      if (files.length > 0) handleUserSendMessage(`[系統訊息] 我建立了新專案「${newProject.name}」並上傳了 ${files.length} 份設計圖檔。`);
  };

  // --- NEW: Handle Add-on Project Creation ---
  const handleCreateAddon = async (sourceProjectId: string) => {
      const sourceProject = projects.find(p => p.id === sourceProjectId);
      if (!sourceProject) return;

      const newProjectId = `pj-${Date.now()}`;
      const addonProject: Project = {
          id: newProjectId,
          userId: sourceProject.userId,
          name: `${sourceProject.name} - 追加單`,
          client: sourceProject.client,
          status: '規劃中',
          paymentStatus: 'unpaid',
          budget: 0,
          date: new Date().toISOString().split('T')[0],
          items: [], // Start empty for clean slate
          files: [],
          lastModified: new Date()
      };

      setProjects(prev => [addonProject, ...prev]);
      if (db) await setDoc(doc(db, "projects", newProjectId), addonProject);
      
      // Switch context to new project
      setActiveProjectId(newProjectId);
      setCurrentView(AppView.CATALOG);
      
      // Notify support
      handleUserSendMessage(`[系統訊息] 我建立了一張追加單：「${addonProject.name}」。`);
  };

  // NEW: Admin Create Project on behalf of User
  const handleAdminCreateProject = async (targetUserId: string, newProjectData: Partial<Project>) => {
      const newProjectId = `pj-${Date.now()}`;
      const newProject: Project = {
          id: newProjectId,
          userId: targetUserId,
          name: newProjectData.name || '客服代開專案',
          client: newProjectData.client || 'Client',
          status: '規劃中',
          paymentStatus: 'unpaid',
          budget: newProjectData.budget || 0,
          date: new Date().toISOString().split('T')[0],
          items: [],
          files: [],
          lastModified: new Date()
      };
      
      setProjects(prev => [newProject, ...prev]);
      if (db) await setDoc(doc(db, "projects", newProjectId), newProject);
      
      // Notify the user in chat
      handleAdminReply(targetUserId, `[系統訊息] 專案「${newProject.name}」已由客服協助建立。我們將協助您將商品加入此專案。`);
      
      return newProjectId; // Return ID so SupportManager can auto-select it
  };

  const handleSelectProject = (projectId: string) => { setActiveProjectId(projectId); setCurrentView(AppView.QUOTE); };
  const handleQuickAddProject = (projectId: string) => { setActiveProjectId(projectId); setCurrentView(AppView.CATALOG); };

  const updateProjectData = async (projectId: string, data: Partial<Project>) => {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...data } : p));
      if (db) await updateDoc(doc(db, "projects", projectId), { ...data, lastModified: new Date() });
  };

  const handleUpdateProjectName = (name: string) => { if(activeProjectId) updateProjectData(activeProjectId, { name }); };
  const handleUpdateProjectStatus = (projectId: string, status: Project['status']) => updateProjectData(projectId, { status });
  const handleUpdateProjectNotes = (projectId: string, notes: string) => updateProjectData(projectId, { notes });
  
  const handleUploadProjectFile = async (projectId: string, files: ProjectFile[]) => {
      const project = projects.find(p => p.id === projectId);
      if (project) updateProjectData(projectId, { files: [...(project.files || []), ...files] });
  };

  const handleGallerySubmission = (item: GalleryItem) => {
      setGallery(prev => [item, ...prev]);
      if (user) handleAdminReply(user.id || user.email, `[系統通知] 您的案例「${item.title}」已提交。`);
  };

  const handleBookingSubmit = async (newBooking: Booking) => {
      setBookings(prev => [newBooking, ...prev]);
      if(db) await setDoc(doc(db, "bookings", newBooking.id), newBooking);
      handleUserSendMessage(`[系統通知] 感謝您的預約！\n專案：${newBooking.projectName}`);
      setIsSupportOpen(true);
      setIsBookingModalOpen(false);
  };

  const handleUpdateBooking = async (id: string, updates: Partial<Booking>) => {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
      if(db) await updateDoc(doc(db, "bookings", id), updates);
      if (updates.status === 'confirmed') {
          const targetBooking = bookings.find(b => b.id === id);
          if (targetBooking) handleAdminReply(targetBooking.userId, `[預約確認] 您的預約已確認。`);
      }
  };

  // User notifies admin of payment (Bank Transfer)
  const handleUserNotifyPayment = (projectId: string) => {
      const targetProject = projects.find(p => p.id === projectId);
      if (!targetProject) return;
      
      handleUserSendMessage(`[系統通知] 我已完成匯款，請協助查帳確認。(專案：${targetProject.name})`);
      setIsSupportOpen(true);
  };

  // Admin confirms receipt of payment
  const handleAdminConfirmPayment = (projectId: string) => {
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject || targetProject.paymentStatus === 'paid') return;
    
    // Update status to '已付款'
    updateProjectData(projectId, { status: '已付款', paymentStatus: 'paid' });
    
    if (targetProject.userId) {
        handleAdminReply(targetProject.userId, `[系統通知] 專案「${targetProject.name}」款項已確認！我們將立即安排備貨，出貨後會再次通知您。`);
    }
  };

  const handleAdminUpdateProject = (projectId: string, updates: Partial<Project>) => updateProjectData(projectId, updates);
  const handleRecallProject = (projectId: string) => updateProjectData(projectId, { status: '規劃中' });
  const handleAddAnnotation = (annotation: Annotation) => setAnnotations(prev => [...prev, annotation]);
  const handleClearAnnotations = (fileId: string) => setAnnotations(prev => prev.filter(a => a.fileId !== fileId));

  const addToProjectQuote = (product: Product, quantity: number, selectedCCT: string, selectedColor: string) => {
    if (!activeProjectId) { alert("請先選擇專案"); return; }
    const p = projects.find(p => p.id === activeProjectId);
    if (!p) return;
    const currentItems = [...p.items];
    const existingIndex = currentItems.findIndex(item => item.id === product.id && item.selectedCCT === selectedCCT && item.selectedColor === selectedColor);
    if (existingIndex >= 0) currentItems[existingIndex].quantity += quantity;
    else currentItems.push({ ...product, quantity, selectedCCT, selectedColor });
    updateProjectData(activeProjectId, { items: currentItems });
  };

  const updateQuoteQuantity = (index: number, delta: number) => {
    if (!activeProjectId) return;
    const p = projects.find(p => p.id === activeProjectId);
    if (!p) return;
    const currentItems = [...p.items];
    currentItems[index].quantity = Math.max(1, currentItems[index].quantity + delta);
    updateProjectData(activeProjectId, { items: currentItems });
  };

  const removeFromQuote = (index: number) => {
    if (!activeProjectId) return;
    const p = projects.find(p => p.id === activeProjectId);
    if (!p) return;
    const currentItems = p.items.filter((_, i) => i !== index);
    updateProjectData(activeProjectId, { items: currentItems });
  };

  const handleAdminUpdateQuote = (targetProjectId: string, action: 'add' | 'remove', item?: QuoteItem | Product, index?: number) => {
      const p = projects.find(p => p.id === targetProjectId);
      if (!p) return;
      let newItems = [...p.items];
      if (action === 'remove' && typeof index === 'number') {
          newItems = newItems.filter((_, i) => i !== index);
      } else if (action === 'add' && item) {
          const product = item as Product;
          const newItem: QuoteItem = { ...product, quantity: 1, selectedCCT: product.availableCCTs[0], selectedColor: product.availableColors[0] };
          newItems.push(newItem);
      }
      updateProjectData(targetProjectId, { items: newItems });
  };

  const handleViewChange = (view: AppView) => { setCurrentView(view); setMobileMenuOpen(false); };

  const updateChatSessionInDB = async (session: ChatSession) => { if(db) await setDoc(doc(db, "chats", session.userId), session); };

  const handleUserSendMessage = async (text: string, attachments?: Attachment[]) => {
    if (!user) return;
    const newMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: new Date(), attachments };
    const uid = user.id || user.email;
    const existingSession = chatSessions.find(s => s.userId === uid);
    let updatedSession: ChatSession;
    if (existingSession) {
        updatedSession = { ...existingSession, messages: [...existingSession.messages, newMessage], lastMessage: text || (attachments ? '[附件]' : ''), lastUpdated: new Date(), unreadCount: (existingSession.unreadCount || 0) + 1 };
    } else {
        updatedSession = { userId: uid, userName: user.name, company: user.company, unreadCount: 1, messages: [newMessage], lastMessage: text, lastUpdated: new Date() };
    }
    setChatSessions(prev => {
        const idx = prev.findIndex(s => s.userId === uid);
        if(idx >= 0) { const copy = [...prev]; copy[idx] = updatedSession; return copy; }
        return [updatedSession, ...prev];
    });
    await updateChatSessionInDB(updatedSession);
  };

  const handleInitChat = async () => {
    if (!user) return;
    const uid = user.id || user.email;
    if (!chatSessions.find(s => s.userId === uid)) {
        const newSession: ChatSession = { userId: uid, userName: user.name, company: user.company, unreadCount: 0, messages: [{id: 'welcome', role: 'agent', text: "您好！", timestamp: new Date()}], lastMessage: "您好！", lastUpdated: new Date() };
        setChatSessions(prev => [newSession, ...prev]);
        await updateChatSessionInDB(newSession);
    }
  };

  const handleAdminReply = async (userId: string, text: string, attachments?: Attachment[]) => {
    const newMessage: ChatMessage = { id: Date.now().toString(), role: 'agent', text, timestamp: new Date(), attachments };
    const session = chatSessions.find(s => s.userId === userId);
    if (session) {
        const updatedSession = { ...session, messages: [...session.messages, newMessage], lastMessage: text, lastUpdated: new Date(), unreadCount: 0 };
        setChatSessions(prev => prev.map(s => s.userId === userId ? updatedSession : s));
        await updateChatSessionInDB(updatedSession);
    }
  };

  const handleAdminRead = async (userId: string) => {
     setChatSessions(prev => prev.map(s => s.userId === userId ? { ...s, unreadCount: 0 } : s));
     if(db) await updateDoc(doc(db, "chats", userId), { unreadCount: 0 });
  };

  const currentUserMessages = chatSessions.find(s => s.userId === currentUserId)?.messages || [];

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard onChangeView={handleViewChange} user={user} projects={currentUserProjects} onOpenCreateProject={() => setIsCreateProjectModalOpen(true)} onSelectProject={handleSelectProject} onUpdateStatus={handleUpdateProjectStatus} onUpdateNotes={handleUpdateProjectNotes} onUploadFile={handleUploadProjectFile} onQuickAdd={handleQuickAddProject} onGallerySubmission={handleGallerySubmission} onNotifyPayment={handleUserNotifyPayment} onOpenBooking={() => setIsBookingModalOpen(true)} onCreateAddon={handleCreateAddon} />;
      case AppView.PROJECTS: return <UserProjects projects={currentUserProjects} user={user} onOpenCreateProject={() => setIsCreateProjectModalOpen(true)} onSelectProject={handleSelectProject} onUpdateStatus={handleUpdateProjectStatus} onUpdateNotes={handleUpdateProjectNotes} onUploadFile={handleUploadProjectFile} onQuickAdd={handleQuickAddProject} onGallerySubmission={handleGallerySubmission} onNotifyPayment={handleUserNotifyPayment} onCreateAddon={handleCreateAddon} />;
      case AppView.CATALOG: return <Catalog products={products} categories={categories} onAddToQuote={addToProjectQuote} activeProject={activeProject} onOpenCreateProject={() => setIsCreateProjectModalOpen(true)} onViewQuote={() => setCurrentView(AppView.QUOTE)} onOpenSupport={() => { setIsSupportOpen(true); handleUserSendMessage("您好，我需要產品選購上的協助。"); }} />;
      case AppView.QUOTE: return <ProjectQuote items={activeProject?.items || []} activeProject={activeProject} onUpdateProjectName={handleUpdateProjectName} onUpdateQuantity={updateQuoteQuantity} onRemoveItem={removeFromQuote} onSubmitForReview={(projName) => { handleUserSendMessage(`[系統訊息] 提交專案「${projName}」估價單。`); handleUpdateProjectStatus(activeProjectId!, '估價審核中'); setIsSupportOpen(true); }} onRecallQuote={() => { if(activeProjectId) handleRecallProject(activeProjectId); }} onCreateAddon={activeProject ? () => handleCreateAddon(activeProject.id) : undefined} />;
      case AppView.AI_CONSULTANT: return <AIConsultant />;
      case AppView.REWARDS: return <Rewards rewards={rewards} monthlyRebates={monthlyRebates} user={user} projects={currentUserProjects} />;
      case AppView.RESOURCES: return <ResourcesGallery gallery={gallery} />;
      case AppView.ADMIN_DASHBOARD:
        return (
          <AdminDashboard 
             currentUser={user}
             products={products} setProducts={setProducts}
             onCreateProduct={handleCreateProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct}
             rewards={rewards} setRewards={setRewards}
             monthlyRebates={monthlyRebates} setMonthlyRebates={setMonthlyRebates}
             gallery={gallery} setGallery={setGallery}
             users={users} setUsers={setUsers}
             // PASSING THE WRAPPER INSTEAD OF setCategories
             categories={categories} setCategories={setCategoriesWrapper}
             specKeys={specKeys} setSpecKeys={setSpecKeys}
             chatSessions={chatSessions} onAdminReply={handleAdminReply} onAdminRead={handleAdminRead}
             projects={projects} onAdminUpdateQuote={handleAdminUpdateQuote} onAdminUpdateProjectStatus={handleUpdateProjectStatus}
             onConfirmPayment={handleAdminConfirmPayment} onAdminUpdateProject={handleAdminUpdateProject} 
             annotations={annotations} onAddAnnotation={handleAddAnnotation} onClearAnnotations={handleClearAnnotations}
             bookings={bookings} onUpdateBookingStatus={handleUpdateBooking}
             onAdminCreateProject={handleAdminCreateProject} // NEW PROP
          />
        );
      default: return <Dashboard onChangeView={handleViewChange} user={user} projects={currentUserProjects} onOpenCreateProject={() => setIsCreateProjectModalOpen(true)} onSelectProject={handleSelectProject} onUpdateStatus={handleUpdateProjectStatus} onUpdateNotes={handleUpdateProjectNotes} onUploadFile={handleUploadProjectFile} onQuickAdd={handleQuickAddProject} onGallerySubmission={handleGallerySubmission} onNotifyPayment={handleUserNotifyPayment} onOpenBooking={() => setIsBookingModalOpen(true)} onCreateAddon={handleCreateAddon} />;
    }
  };

  if (isAuthChecking) return <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center"><Loader2 size={48} className="text-brand-bronze animate-spin" /></div>;
  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-[#FAF9F6] text-stone-800 font-sans selection:bg-brand-bronze/20">
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-stone-200 z-40 flex items-center px-6 justify-between shadow-sm">
         <div className="flex items-center gap-2"><img src="https://shoplineimg.com/566528b00390552841000036/66ce85144ab3872821731cf8/1200x.webp?source_format=png" alt="Gentech Logo" className="h-8 w-auto object-contain mix-blend-multiply"/></div>
         <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors"><Menu size={24} /></button>
      </div>
      <Sidebar currentView={currentView} onChangeView={handleViewChange} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} onLogout={handleLogout} onOpenSettings={() => setIsSettingsOpen(true)} user={user}/>
      <CreateProjectModal isOpen={isCreateProjectModalOpen} onClose={() => setIsCreateProjectModalOpen(false)} onSubmit={handleCreateProject}/>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} onUpdateUser={handleUpdateUser}/>
      <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} user={user} projects={currentUserProjects} onSubmit={handleBookingSubmit}/>
      
      <main className="flex-1 ml-0 md:ml-64 p-6 md:p-12 relative overflow-x-hidden min-h-screen pt-24 md:pt-12 flex flex-col">
         <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white to-transparent pointer-events-none" />
         
         {isOfflineMode && <div className="bg-red-50 border-b border-red-100 p-2 text-center text-xs text-red-800 font-medium flex items-center justify-center gap-2 relative z-50 -mx-6 -mt-6 mb-6 md:-mx-12 md:-mt-12 md:mb-6"><WifiOff size={14} /> 錯誤：無法連接至資料庫。</div>}
         
         <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full flex flex-col">
            {isLoadingData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-400 gap-3">
                    <Loader2 size={40} className="animate-spin text-brand-bronze" />
                    <p>正在同步雲端資料庫...</p>
                </div>
            ) : (
                renderContent()
            )}
         </div>

         {/* GLOBAL FOOTER */}
         <footer className="mt-12 border-t border-stone-200 bg-white w-full mx-[-24px] md:mx-[-48px] mb-[-24px] md:mb-[-48px] px-6 md:px-12 py-10">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <h4 className="font-serif font-bold text-stone-800 text-lg">聯絡我們</h4>
                        <div className="space-y-3 text-sm text-stone-500">
                            <p className="flex items-center gap-3"><Phone size={16} className="text-brand-bronze shrink-0"/> (02) 2263-0026</p>
                            <p className="flex items-center gap-3"><MessageCircle size={16} className="text-brand-bronze shrink-0"/> LINE: @genshop</p>
                            <p className="flex items-center gap-3"><Mail size={16} className="text-brand-bronze shrink-0"/> gentechled@gmail.com</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4 lg:col-span-2">
                        <h4 className="font-serif font-bold text-stone-800 text-lg">門市資訊</h4>
                        <div className="space-y-3 text-sm text-stone-500">
                            <p className="flex items-start gap-3"><MapPin size={16} className="text-brand-bronze mt-0.5 shrink-0"/> 新北市土城區青雲路434巷10號3樓</p>
                            <p className="flex items-start gap-3"><Clock size={16} className="text-brand-bronze mt-0.5 shrink-0"/> 09:00~12:30 / 13:30~17:30 (例假日公休)</p>
                        </div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-between">
                        <div>
                            <img src="https://shoplineimg.com/566528b00390552841000036/66ce85144ab3872821731cf8/1200x.webp?source_format=png" alt="Gentech" className="h-8 object-contain mix-blend-multiply opacity-50 mb-4" />
                            <p className="text-xs text-stone-400 font-bold">靖軒科技有限公司</p>
                            <p className="text-xs text-stone-400">統編: 53682530</p>
                            <p className="text-xs text-stone-400 mt-2">© 2025 Gentech Lighting.</p>
                        </div>
                    </div>
                </div>
            </div>
         </footer>
      </main>
      
      <CustomerSupport isOpen={isSupportOpen} setIsOpen={setIsSupportOpen} user={user} messages={currentUserMessages} onSendMessage={handleUserSendMessage} onInitChat={handleInitChat} projects={currentUserProjects} annotations={annotations} onAddAnnotation={handleAddAnnotation} onClearAnnotations={handleClearAnnotations}/>
    </div>
  );
};

export default App;
