
import React, { useState } from 'react';
import { 
  LayoutDashboard, Package, Users, MessageSquare, Gift, Image as ImageIcon, 
  Briefcase, Calendar, BrainCircuit
} from 'lucide-react';

// FIX: Path adjusted to ../../types
import { Product, RewardTier, GalleryItem, User, ChatSession, QuoteItem, Project, Annotation, MonthlyRebateRule, Attachment, Booking } from '../../types';

import { Overview } from './Overview';
import { BookingManager } from './BookingManager';
import { UserManager } from './UserManager';
import { RewardManager } from './RewardManager';
import { ProjectManager } from './ProjectManager';
import { ProductManager } from './ProductManager';
import { SupportManager } from './SupportManager';
import { GalleryManager } from './GalleryManager';
import { AIAnalytics } from './AIAnalytics';

interface AdminDashboardProps {
  currentUser: User | null;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  
  onCreateProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;

  rewards: RewardTier[];
  setRewards: React.Dispatch<React.SetStateAction<RewardTier[]>>;
  monthlyRebates: MonthlyRebateRule[];
  setMonthlyRebates: React.Dispatch<React.SetStateAction<MonthlyRebateRule[]>>;
  gallery: GalleryItem[];
  setGallery: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  specKeys: string[];
  setSpecKeys: React.Dispatch<React.SetStateAction<string[]>>;
  chatSessions: ChatSession[];
  onAdminReply: (userId: string, text: string, attachments?: Attachment[]) => void;
  onAdminRead: (userId: string) => void;
  projects: Project[];
  onAdminUpdateQuote: (projectId: string, action: 'add' | 'remove', item?: QuoteItem | Product, index?: number) => void;
  onAdminUpdateProjectStatus: (projectId: string, status: Project['status']) => void;
  onConfirmPayment: (projectId: string) => void;
  onAdminUpdateProject?: (projectId: string, updates: Partial<Project>) => void; 
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onClearAnnotations: (fileId: string) => void;
  bookings: Booking[];
  onUpdateBookingStatus: (id: string, updates: Partial<Booking>) => void;
  onAdminCreateProject: (targetUserId: string, newProjectData: Partial<Project>) => Promise<string>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const [activeTab, setActiveTab] = useState('overview');
  const hasStaffAccess = ['admin', 'sales', 'support'].includes(props.currentUser?.role || '');
  const isSuperAdmin = props.currentUser?.role === 'admin';

  const menuItems = [
    { id: 'overview', label: '營運總覽', icon: LayoutDashboard },
    { id: 'ai_analytics', label: 'AI 智能分析', icon: BrainCircuit, highlight: true },
    { id: 'bookings', label: '預約 CRM', icon: Calendar },
    { id: 'support', label: '客服中心', icon: MessageSquare },
    { id: 'projects', label: '專案管理', icon: Briefcase },
    { id: 'products', label: '產品目錄', icon: Package },
    { id: 'users', label: '帳號權限', icon: Users },
    { id: 'rewards', label: '獎勵設定', icon: Gift },
    { id: 'gallery', label: '藝廊管理', icon: ImageIcon },
  ];

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in relative">
       {/* Header & Tabs */}
       <div className="bg-white p-2 rounded-xl border border-stone-200 shadow-sm flex overflow-x-auto gap-2 no-scrollbar shrink-0">
          {menuItems.map(item => (
             <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                   ${activeTab === item.id 
                       ? (item.highlight ? 'bg-purple-600 text-white shadow-md' : 'bg-stone-800 text-white shadow-md')
                       : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
                   }
                `}
             >
                <item.icon size={16} />
                {item.label}
             </button>
          ))}
       </div>

       <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
           {activeTab === 'overview' && (
             <Overview 
                projects={props.projects} 
                products={props.products} 
                users={props.users} 
             />
           )}

           {activeTab === 'ai_analytics' && hasStaffAccess && (
             <AIAnalytics 
                chatSessions={props.chatSessions} 
                projects={props.projects}
                products={props.products}
             />
           )}

           {activeTab === 'bookings' && hasStaffAccess && (
             <BookingManager 
                bookings={props.bookings} 
                projects={props.projects} 
                users={props.users} 
                onUpdateBooking={props.onUpdateBookingStatus} 
             />
           )}
           
           {activeTab === 'support' && hasStaffAccess && (
             <SupportManager 
                chatSessions={props.chatSessions} 
                onReply={props.onAdminReply} 
                onRead={props.onAdminRead} 
                projects={props.projects} 
                onUpdateQuote={props.onAdminUpdateQuote} 
                onUpdateStatus={props.onAdminUpdateProjectStatus} 
                annotations={props.annotations} 
                onAddAnnotation={props.onAddAnnotation} 
                onClearAnnotations={props.onClearAnnotations} 
                allProducts={props.products} 
                onCreateProject={props.onAdminCreateProject}
                onConfirmPayment={props.onConfirmPayment}
             />
           )}

           {activeTab === 'projects' && hasStaffAccess && (
             <ProjectManager 
                projects={props.projects} 
                onUpdateStatus={props.onAdminUpdateProjectStatus} 
                onConfirmPayment={props.onConfirmPayment} 
                onUpdateProject={props.onAdminUpdateProject}
             />
           )}

           {activeTab === 'products' && hasStaffAccess && (
             <ProductManager 
                products={props.products} 
                setProducts={props.setProducts} 
                categories={props.categories} 
                setCategories={props.setCategories} 
                specKeys={props.specKeys} 
                setSpecKeys={props.setSpecKeys} 
                onCreate={props.onCreateProduct} 
                onUpdate={props.onUpdateProduct} 
                onDelete={props.onDeleteProduct}
             />
           )}

           {activeTab === 'users' && (
             <UserManager 
                users={props.users} 
                setUsers={props.setUsers} 
                rewards={props.rewards} 
                currentUser={props.currentUser} 
             />
           )}

           {activeTab === 'rewards' && (
             <RewardManager 
                currentUser={props.currentUser} 
                rewards={props.rewards} 
                setRewards={props.setRewards} 
                monthlyRebates={props.monthlyRebates} 
                setMonthlyRebates={props.setMonthlyRebates} 
             />
           )}
           
           {activeTab === 'gallery' && hasStaffAccess && (
             <GalleryManager 
                gallery={props.gallery} 
                setGallery={props.setGallery} 
             />
           )}
       </div>
    </div>
  );
};