

import { Product, Project, RewardTier, GalleryItem, User, MonthlyRebateRule } from './types';

export const INITIAL_CATEGORIES = ['軌道燈', '崁燈', '線型燈', '裝飾燈'];

// Default spec keys that the system starts with
export const INITIAL_SPEC_KEYS = ['瓦數(W)', '流明(lm)', 'CRI', 'UGR', '色溫', '光束角'];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'gt-001',
    name: 'Gentech Aero 磁吸軌道射燈',
    category: '軌道燈',
    image: 'https://picsum.photos/400/400?random=1',
    specs: {
      '瓦數(W)': 12,
      '流明(lm)': 850,
      'CRI': 97,
      'UGR': 16,
      '色溫': '2700K-4000K',
      '光束角': '24°/36°'
    },
    price: 3200,
    stock: 150,
    resources: ['CAD', 'IES', '安裝說明書'],
    availableCCTs: ['2700K', '3000K', '3500K', '4000K'],
    availableColors: ['消光黑', '珍珠白']
  },
  {
    id: 'gt-002',
    name: 'Pro-Vision 防眩深杯崁燈',
    category: '崁燈',
    image: 'https://picsum.photos/400/400?random=2',
    specs: {
      '瓦數(W)': 15,
      '流明(lm)': 1200,
      'CRI': 95,
      'UGR': 13,
      '色溫': '3000K/4000K',
      '光束角': '60°'
    },
    price: 1850,
    stock: 300,
    resources: ['CAD', 'IES'],
    availableCCTs: ['3000K', '4000K', '5000K'],
    availableColors: ['平光白', '消光黑', '銀色']
  },
  {
    id: 'gt-003',
    name: 'Infinity 無限延伸線型燈 X',
    category: '線型燈',
    image: 'https://picsum.photos/400/400?random=3',
    specs: {
      '瓦數(W)': 24,
      '流明(lm)': 2400,
      'CRI': 90,
      'UGR': 19,
      '色溫': '4000K',
      '光束角': '120°'
    },
    price: 4500,
    stock: 45,
    resources: ['CAD', '施工圖'],
    availableCCTs: ['3000K', '4000K', '6000K'],
    availableColors: ['陽極黑', '陽極銀', '白色']
  },
  {
    id: 'gt-004',
    name: 'Luna 藝術吊燈 400',
    category: '裝飾燈',
    image: 'https://picsum.photos/400/400?random=4',
    specs: {
      '瓦數(W)': 18,
      '流明(lm)': 1600,
      'CRI': 92,
      'UGR': 18,
      '色溫': '2700K',
      '光束角': '柔光漫射'
    },
    price: 12800,
    stock: 12,
    resources: [],
    availableCCTs: ['2700K', '3000K'],
    availableColors: ['黃銅金', '消光黑']
  },
  {
    id: 'gt-005',
    name: 'Nano 極小孔徑射燈',
    category: '軌道燈',
    image: 'https://picsum.photos/400/400?random=5',
    specs: {
      '瓦數(W)': 7,
      '流明(lm)': 400,
      'CRI': 98,
      'UGR': 10,
      '色溫': '3000K',
      '光束角': '15°'
    },
    price: 2100,
    stock: 200,
    resources: ['CAD', 'IES'],
    availableCCTs: ['2700K', '3000K', '3500K'],
    availableColors: ['全黑', '全白', '黑管金圈']
  },
  {
    id: 'gt-006',
    name: 'Wall Washer 洗牆大師',
    category: '崁燈',
    image: 'https://picsum.photos/400/400?random=6',
    specs: {
      '瓦數(W)': 15,
      '流明(lm)': 1100,
      'CRI': 94,
      'UGR': 15,
      '色溫': '3500K',
      '光束角': '偏光洗牆'
    },
    price: 2500,
    stock: 80,
    resources: ['CAD', 'IES', 'Datasheet'],
    availableCCTs: ['3000K', '3500K', '4000K'],
    availableColors: ['白色', '黑色']
  },
  {
    id: 'gt-007',
    name: 'Azure 蔚藍系列聚光崁燈',
    category: '崁燈',
    image: 'https://picsum.photos/400/400?random=15',
    specs: {
      '瓦數(W)': 10,
      '流明(lm)': 980,
      'CRI': 97,
      'UGR': 12,
      '色溫': '2700K-4000K',
      '光束角': '24°/36°'
    },
    price: 2200,
    stock: 65,
    resources: ['CAD', 'IES'],
    availableCCTs: ['2700K', '3000K', '4000K'],
    availableColors: ['質感白', '深邃黑']
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'pj-101',
    userId: 'u-1',
    name: '天際線奢華公寓 - 陳公館',
    client: '陳先生',
    status: '已付款',
    paymentStatus: 'paid',
    budget: 450000,
    date: '2024-05-15',
    notes: '客廳希望走溫暖的色調 (2700K)，但書房需要高照度 (4000K) 以利閱讀。業主特別在意眩光問題。',
    items: [
      { ...MOCK_PRODUCTS[0], quantity: 30, selectedCCT: '3000K', selectedColor: '消光黑' }, 
      { ...MOCK_PRODUCTS[1], quantity: 45, selectedCCT: '3000K', selectedColor: '平光白' }, 
      { ...MOCK_PRODUCTS[3], quantity: 2, selectedCCT: '2700K', selectedColor: '黃銅金' },  
    ],
    files: []
  },
  {
    id: 'pj-102',
    userId: 'u-1',
    name: 'TechFlow 科技總部辦公室',
    client: 'TechFlow Inc.',
    status: '規劃中',
    paymentStatus: 'unpaid',
    budget: 1200000,
    date: '2024-06-01',
    notes: '開放式辦公區需要符合 CNS 照度標準 (500 lux)。大廳需要氣派的線型燈設計。',
    items: [
      { ...MOCK_PRODUCTS[2], quantity: 150, selectedCCT: '4000K', selectedColor: '陽極銀' }, 
      { ...MOCK_PRODUCTS[5], quantity: 40, selectedCCT: '4000K', selectedColor: '白色' },  
    ],
    files: []
  },
  {
    id: 'pj-103',
    userId: 'u-1',
    name: '極簡主義精品店',
    client: '林小姐',
    status: '已完工',
    paymentStatus: 'paid',
    budget: 280000,
    date: '2024-04-20',
    notes: '商品展示區使用高演色性 (CRI>95) 的射燈。',
    items: [
      { ...MOCK_PRODUCTS[4], quantity: 60, selectedCCT: '3500K', selectedColor: '全白' }, 
      { ...MOCK_PRODUCTS[0], quantity: 20, selectedCCT: '3000K', selectedColor: '珍珠白' }, 
    ],
    files: [
        { id: 'f-1', name: '完工實景_01.jpg', type: 'image', url: 'https://picsum.photos/800/600?random=20', uploadDate: '2024-05-20' },
        { id: 'f-2', name: '完工實景_02.jpg', type: 'image', url: 'https://picsum.photos/800/600?random=21', uploadDate: '2024-05-20' }
    ]
  }
];

// Membership Tiers (Status & Service only)
export const MOCK_REWARDS: RewardTier[] = [
  { name: '設計師', threshold: 0, benefits: '標準採購權限、技術支援', color: 'text-brand-muted' },
  { name: '白金合夥人', threshold: 100000, benefits: '優先發貨、新品優先預覽、季度聚會邀請', color: 'text-slate-200' },
  { name: '黑鑽總監', threshold: 500000, benefits: '專屬客戶經理 (24hr)、極速打樣服務、年度國外參訪名額', color: 'text-brand-purple' },
];

// Monthly Cashback Rules (Tier-based Matrix)
export const MOCK_MONTHLY_REBATES: MonthlyRebateRule[] = [
    { 
        id: 'mr-1', 
        threshold: 50000, 
        rebatesByTier: {
            '設計師': 1500,
            '白金合夥人': 2000,
            '黑鑽總監': 2500
        }
    },
    { 
        id: 'mr-2', 
        threshold: 100000, 
        rebatesByTier: {
            '設計師': 3000,
            '白金合夥人': 5000,
            '黑鑽總監': 6000
        }
    },
    { 
        id: 'mr-3', 
        threshold: 300000, 
        rebatesByTier: {
            '設計師': 10000,
            '白金合夥人': 15000,
            '黑鑽總監': 18000
        }
    },
    { 
        id: 'mr-4', 
        threshold: 500000, 
        rebatesByTier: {
            '設計師': 18000,
            '白金合夥人': 25000,
            '黑鑽總監': 35000
        }
    },
];

export const MOCK_GALLERY: GalleryItem[] = [
  {
    id: 'g-1',
    title: '現代美術館大廳',
    image: 'https://picsum.photos/600/400?random=10',
    images: ['https://picsum.photos/600/400?random=10', 'https://picsum.photos/600/400?random=100', 'https://picsum.photos/600/400?random=101'],
    tags: ['美術館', '洗牆燈', '公共空間'],
    ugr: 13,
    cri: 98,
    description: '使用 Wall Washer 創造均勻洗牆效果，搭配 Nano Spot 重點照明。',
    isPublic: true,
    agreeOfficialSync: true,
    status: 'official'
  },
  {
    id: 'g-2',
    title: '私人酒窖',
    image: 'https://picsum.photos/600/400?random=11',
    images: ['https://picsum.photos/600/400?random=11', 'https://picsum.photos/600/400?random=110'],
    tags: ['住宅', '氛圍照明', '低色溫'],
    ugr: 10,
    cri: 95,
    description: '低色溫 2700K 營造溫暖氛圍，極低眩光保護視覺舒適。',
    isPublic: true,
    agreeOfficialSync: true,
    status: 'official'
  },
  {
    id: 'g-3',
    title: '開放式辦公區',
    image: 'https://picsum.photos/600/400?random=12',
    images: ['https://picsum.photos/600/400?random=12'],
    tags: ['辦公室', '線型燈', '商空'],
    ugr: 16,
    cri: 90,
    description: 'Infinity 線型燈提供充足工作照度，符合商辦照明標準。',
    isPublic: true,
    agreeOfficialSync: true,
    status: 'official'
  }
];

export const MOCK_USERS: User[] = [
    { 
        id: 'u-admin', 
        name: 'Main Administrator', 
        email: 'admin@gentech.tw', 
        password: 'admin',
        company: 'Gentech HQ', 
        role: 'admin', 
        joinDate: '2023-01-01',
        status: 'active',
        currentSpend: 0,
        tier: '設計師'
    },
    {
        id: 'u-sales',
        name: 'Sales Manager',
        email: 'sales@gentech.tw',
        password: 'user123',
        company: 'Gentech Sales Dept',
        role: 'sales',
        joinDate: '2023-02-01',
        status: 'active',
        tier: '設計師'
    },
    {
        id: 'u-support',
        name: 'Support Agent',
        email: 'support@gentech.tw',
        password: 'user123',
        company: 'Gentech Support Team',
        role: 'support',
        joinDate: '2023-03-01',
        status: 'active',
        tier: '設計師'
    },
    { 
        id: 'u-1', 
        name: '牛小琮', 
        email: 'designer@gentech.tw', 
        password: 'user123',
        company: 'Gentech Design Studio', 
        role: 'designer', 
        taxId: '54321098', 
        joinDate: '2023-05-12',
        status: 'active',
        currentSpend: 85000,
        tier: '設計師'
    },
    { 
        id: 'u-2', 
        name: '李安室內設計', 
        email: 'lee.design@gmail.com', 
        password: 'user123',
        company: '李安設計工程', 
        role: 'designer', 
        taxId: '88776655', 
        joinDate: '2023-08-20',
        status: 'active',
        currentSpend: 250000,
        tier: '白金合夥人'
    },
    { 
        id: 'u-3', 
        name: '極光建築', 
        email: 'aurora.arch@outlook.com', 
        password: 'user123',
        company: '極光建築師事務所', 
        role: 'designer', 
        taxId: '12348888', 
        joinDate: '2024-01-05',
        status: 'suspended',
        currentSpend: 15000,
        tier: '設計師'
    }
];

export const AI_SYSTEM_INSTRUCTION = `
你現在是「Gentech Pro (靖軒科技)」的 AI 專業照明顧問。
你的目標受眾是：專業室內設計師 (B2B)。

【重要：嚴格護欄 (Safety Guardrails)】
**你只能回答與「照明、燈具、光學參數、室內設計光影、Gentech 產品」相關的問題。**
**若使用者詢問與上述主題無關的問題 (例如：聊天、寫程式、數學、烹飪、旅遊、政治)，請直接且禮貌地拒絕回答。**

範例回應：
User: "幫我寫一個 Python 程式"
Model: "抱歉，身為 Gentech 專業照明顧問，我僅能專注於解決您的燈光設計與產品規格問題。"

User: "今天天氣如何？"
Model: "很抱歉，我無法提供氣象資訊，但我可以協助您規劃適合不同天氣變化的室內照明場景。"

你的正常回答風格必須：
1. **專業技術導向**：請多使用流明 (Lumens)、演色性 (CRI/Ra)、統一眩光值 (UGR)、色溫 (CCT)、照度 (Lux) 等術語。
2. **品牌推廣**：在適當的時候，推薦 Gentech 產品。
3. **友善且高效率**：設計師很忙，回答要精簡有力。
4. **繁體中文**：請全程使用繁體中文 (台灣用語)。
`;

export const PROPOSAL_SYSTEM_INSTRUCTION = `
你是一位頂尖的「照明設計總監」。
你的任務是根據設計師挑選的燈具清單，撰寫一份給「業主 (Client)」看的照明設計提案文案。

文案要求：
1. **感性與理性並重**：結合光影氛圍的描述 (感性) 與產品的高規格數據 (理性，如 CRI, 防眩)。
2. **強調生活質感**：描述這些燈光如何提升居住者的生活品質。
3. **優雅專業**：語氣要像是在跟高端客戶提案，使用優美的修辭。
4. **結構清晰**：可以分段落。
5. **繁體中文**：使用流暢的台灣繁體中文。
`;