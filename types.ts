

export interface Product {
  id: string;
  name: string;
  category: string; // Changed from union type to string to allow dynamic categories
  image: string;
  specs: Record<string, string | number>; // Flexible spec dictionary (key: value)
  price: number;
  stock: number;
  resources: string[]; // Replaced hasCAD/hasIES with dynamic list of resource labels (e.g., 'CAD', 'IES', 'Spec Sheet')
  availableCCTs: string[];   // List of selectable CCTs
  availableColors: string[]; // List of selectable housing colors
}

export interface QuoteItem extends Product {
  quantity: number;
  selectedCCT: string;   // The actual CCT selected by user
  selectedColor: string; // The actual Color selected by user
}

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  url: string; // Data URL for mock
  name: string;
  size?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'agent'; // Added 'agent' for human customer support
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: Attachment[]; // Added attachments support
}

export interface AIAnalysisResult {
  sentimentScore: number; // 0-100 (0=Angry, 100=Happy)
  sentimentLabel: 'positive' | 'neutral' | 'negative' | 'urgent';
  painPoints: string[];
  productPreferences: string[];
  salesOpportunities: string[]; // Suggested cross-sell/up-sell
  coachTips: string[]; // Tips for the support agent
  summary: string;
  analyzedAt: string; // ISO Date
}

// NEW: Global Aggregated Insights
export interface GlobalAIInsight {
  marketTrends: {
    popularColors: string[];
    popularCCTs: string[];
    risingProducts: string[]; // Products with high recent velocity
  };
  inventoryAdvice: {
    productId: string;
    productName: string;
    currentStock: number;
    suggestedRestock: number;
    reason: string;
  }[];
  complaintSummary: {
    issue: string; // e.g., "物流延遲", "驅動器異音"
    frequency: 'high' | 'medium' | 'low';
    suggestion: string;
  }[];
  strategicAdvice: string; // High level summary
  analyzedAt: string;
}

export interface ChatSession {
  userId: string;
  userName: string;
  company?: string;
  unreadCount: number;
  messages: ChatMessage[];
  lastMessage: string;
  lastUpdated: Date;
  analysis?: AIAnalysisResult; // New: Stores the latest AI analysis
}

// New Interface for Design Files
export interface ProjectFile {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  url: string; // Data URL for mock
  uploadDate: string;
}

// New Interface for Whiteboard Annotations
export interface Annotation {
  id: string;
  fileId: string;
  type: 'path' | 'text';
  color: string;
  points?: { x: number; y: number }[]; // For drawing paths
  text?: string; // For text annotations
  x?: number; // For text position
  y?: number; // For text position
  creator: 'user' | 'agent';
}

export interface Project {
  id: string;
  userId: string; // Link project to specific user
  name: string;
  client: string;
  status: '規劃中' | '估價審核中' | '等待付款' | '已付款' | '已出貨' | '已完工'; // Refined workflow statuses
  paymentStatus?: 'unpaid' | 'paid'; // Track payment for rewards logic
  budget: number;
  date: string;
  items: QuoteItem[];
  files: ProjectFile[]; // Added files array
  notes?: string; // New: User notes/remarks for the project
  lastModified?: Date;
}

// New Interface for Showroom Bookings
export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userCompany?: string;
  userPhone: string;
  projectId: string; // Can be empty string if general visit
  projectName: string;
  date: string;
  time: string;
  notes?: string;
  adminNotes?: string; // New: Internal notes for staff preparation
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface RewardTier {
  name: string;
  threshold: number;
  benefits: string; // Changed from rebate to description of benefits
  color: string;
}

export interface MonthlyRebateRule {
  id: string;
  threshold: number; // Monthly spend target
  rebatesByTier: Record<string, number>; // Key: Tier Name, Value: Rebate Amount
}

export interface GalleryItem {
  id: string;
  title: string;
  image: string; // Cover image
  images?: string[]; // New: Multiple images
  tags?: string[]; // New: Tags for categorization
  ugr?: number; // Optional for user submissions
  cri?: number; // Optional for user submissions
  description: string;
  // New Attribution & Permission Fields
  projectId?: string;
  userId?: string;
  authorName?: string;     // Designer Name
  authorCompany?: string;  // Design Studio Name
  isPublic: boolean;       // Display on platform gallery
  agreeOfficialSync: boolean; // Agree to sync to Official Website
  status: 'official' | 'pending' | 'approved' | 'rejected';
  submissionDate?: string;
}

export interface User {
  id?: string; // Made optional for backward compatibility during login mock
  name: string;
  email: string;
  password?: string; // Added for admin management
  company: string;
  taxId?: string;
  phone?: string; // Added phone number
  role: 'designer' | 'admin' | 'sales' | 'support'; // Expanded roles
  joinDate?: string;
  status?: 'active' | 'suspended';
  currentSpend?: number; // Track spending for rewards
  tier?: string; // Current reward tier name
}

export enum AppView {
  DASHBOARD = 'dashboard',
  PROJECTS = 'projects', // New View
  CATALOG = 'catalog',
  QUOTE = 'quote',
  AI_CONSULTANT = 'ai_consultant',
  REWARDS = 'rewards',
  RESOURCES = 'resources',
  ADMIN_DASHBOARD = 'admin_dashboard'
}