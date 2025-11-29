
import React, { useState } from 'react';
import { Product } from '../../types';
import { 
    Search, FolderOpen, Plus, Package, Edit2, Trash2, X, AlertTriangle, Save
} from 'lucide-react';
import { ProductEditorModal } from './ProductEditorModal';
import { CategoryManagerModal } from './CategoryManagerModal';

interface ProductManagerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: string[];
  setCategories: (newCategories: string[] | ((prev: string[]) => string[])) => void;
  specKeys: string[];
  setSpecKeys: React.Dispatch<React.SetStateAction<string[]>>;
  onCreate: (product: Product) => void;
  onUpdate: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export const ProductManager: React.FC<ProductManagerProps> = ({ 
    products, setProducts, categories, setCategories, onCreate, onUpdate, onDelete 
}) => { 
    const [searchTerm, setSearchTerm] = useState(''); 
    const [selectedCategory, setSelectedCategory] = useState('全部'); 
    const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null); 
    const [isCreating, setIsCreating] = useState(false); 
    const [showCategoryManager, setShowCategoryManager] = useState(false); 
    const [showProductEditor, setShowProductEditor] = useState(false); 
    
    // Quick Stock Edit State
    const [quickStockEdits, setQuickStockEdits] = useState<Record<string, number>>({});

    const filteredProducts = products.filter((p: any) => { 
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()); 
        const matchesCategory = selectedCategory === '全部' || p.category === selectedCategory; 
        let matchesStatus = true;
        if (statusFilter === 'low') matchesStatus = p.stock < 20 && p.stock > 0;
        if (statusFilter === 'out') matchesStatus = p.stock === 0;
        
        return matchesSearch && matchesCategory && matchesStatus; 
    }); 
    
    const handleDeleteProduct = (productId: string) => { 
        if(confirm("確定要刪除此產品嗎？")) {
            onDelete(productId); 
        }
    }; 
    
    const handleCreateProduct = () => { 
        const defaultSpecs = { '瓦數(W)': 10, '流明(lm)': 800, 'CRI': 90, 'UGR': 19, '色溫': '3000K', '光束角': '24°' }; 
        setEditingProduct({ 
            id: `gt-${Date.now()}`, 
            name: '', 
            category: categories[0] || '未分類', 
            image: 'https://picsum.photos/400/400', 
            specs: defaultSpecs, 
            price: 0, 
            stock: 100, 
            resources: [], 
            availableCCTs: ['3000K', '4000K'], 
            availableColors: ['白色', '黑色'] 
        }); 
        setIsCreating(true); 
        setShowProductEditor(true); 
    }; 
    
    const handleEditProduct = (product: Product) => { 
        setEditingProduct({ ...product, resources: product.resources || [] }); 
        setIsCreating(false); 
        setShowProductEditor(true); 
    }; 
    
    const handleSaveProduct = (product: Product) => { 
        if (isCreating) { onCreate(product); } else { onUpdate(product); } 
        setShowProductEditor(false); 
        setEditingProduct(null); 
    };

    const handleQuickStockChange = (id: string, val: string) => {
        const num = parseInt(val);
        if (!isNaN(num) && num >= 0) {
            setQuickStockEdits(prev => ({...prev, [id]: num}));
        }
    };

    const saveQuickStock = (product: Product) => {
        const newStock = quickStockEdits[product.id];
        if (newStock !== undefined && newStock !== product.stock) {
            onUpdate({ ...product, stock: newStock });
            // Clear edit state to show saved value
            const newEdits = {...quickStockEdits};
            delete newEdits[product.id];
            setQuickStockEdits(newEdits);
        }
    };

    // Calculate Stats
    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.stock < 20).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    
    return ( 
        <div className="bg-white border border-stone-200 rounded-2xl h-full flex flex-col overflow-hidden relative shadow-sm"> 
            
            {/* Header & Stats */}
            <div className="p-6 border-b border-stone-100 bg-white z-10 space-y-6"> 
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"> 
                    <div>
                        <h2 className="text-2xl font-serif text-stone-800 font-bold">產品目錄管理</h2>
                        <p className="text-xs text-stone-500 mt-1">庫存監控與規格維護</p>
                    </div> 
                    <div className="flex gap-3"> 
                        <button onClick={() => setShowCategoryManager(true)} className="bg-white border border-stone-200 text-stone-600 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-stone-50 hover:text-stone-900 shadow-sm font-medium transition-all">
                            <FolderOpen size={16}/> 分類管理
                        </button> 
                        <button onClick={handleCreateProduct} className="bg-stone-900 text-white px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-stone-700 shadow-md font-bold transition-all">
                            <Plus size={16}/> 新增產品
                        </button> 
                    </div> 
                </div> 

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">總產品數</p>
                            <p className="text-2xl font-bold text-stone-800 mt-1">{totalProducts}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg text-stone-400"><Package size={20}/></div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 flex items-center justify-between cursor-pointer hover:bg-orange-100/50 transition-colors" onClick={() => setStatusFilter('low')}>
                        <div>
                            <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">庫存過低</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">{lowStockCount}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg text-orange-400"><AlertTriangle size={20}/></div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex items-center justify-between cursor-pointer hover:bg-red-100/50 transition-colors" onClick={() => setStatusFilter('out')}>
                        <div>
                            <p className="text-xs text-red-400 font-bold uppercase tracking-wider">已缺貨</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{outOfStockCount}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg text-red-400"><X size={20}/></div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-2"> 
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                        <input type="text" placeholder="搜尋產品名稱、型號..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-brand-bronze outline-none transition-all"/>
                    </div> 
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:border-brand-bronze outline-none cursor-pointer font-medium min-w-[140px]">
                            <option value="全部">全部分類</option>
                            {categories.map((c: any) => <option key={c} value={c}>{c}</option>)}
                        </select> 
                        <div className="bg-stone-100 p-1 rounded-xl flex gap-1 border border-stone-200">
                            {[
                                { id: 'all', label: '全部' },
                                { id: 'low', label: '低庫存' },
                                { id: 'out', label: '缺貨' }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setStatusFilter(f.id as any)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === f.id ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div> 
            </div> 

            <div className="flex-1 overflow-auto bg-white relative">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-50 text-xs text-stone-500 uppercase font-bold sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 w-20">圖片</th>
                            <th className="px-6 py-4">產品資訊</th>
                            <th className="px-6 py-4">分類</th>
                            <th className="px-6 py-4">價格</th>
                            <th className="px-6 py-4 w-48">庫存管理</th>
                            <th className="px-6 py-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-sm">
                        {filteredProducts.map((p) => {
                            const isEditingStock = quickStockEdits[p.id] !== undefined;
                            const stockValue = isEditingStock ? quickStockEdits[p.id] : p.stock;
                            
                            return (
                                <tr key={p.id} className="group hover:bg-stone-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden border border-stone-200">
                                            <img src={p.image} className="w-full h-full object-cover mix-blend-multiply" alt={p.name} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-stone-800">{p.name}</p>
                                        <p className="text-xs text-stone-400 font-mono mt-0.5">{p.id}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-xs font-medium border border-stone-200">{p.category}</span>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-medium text-stone-600">
                                        NT$ {p.price.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-2 p-1 rounded-lg border w-32 transition-all ${isEditingStock ? 'bg-white border-brand-bronze ring-2 ring-brand-bronze/10' : 'bg-transparent border-transparent group-hover:border-stone-200 group-hover:bg-white'}`}>
                                            <input 
                                                type="number" 
                                                value={stockValue} 
                                                onChange={(e) => handleQuickStockChange(p.id, e.target.value)}
                                                onBlur={() => saveQuickStock(p)}
                                                onKeyDown={(e) => e.key === 'Enter' && saveQuickStock(p)}
                                                className={`w-full bg-transparent outline-none text-center font-mono font-bold ${stockValue === 0 ? 'text-red-500' : stockValue < 20 ? 'text-orange-500' : 'text-stone-800'}`}
                                            />
                                            {isEditingStock && <Save size={14} className="text-brand-bronze animate-pulse mr-1"/>}
                                        </div>
                                        {p.stock < 20 && <span className="text-[10px] text-red-500 font-bold mt-1 block pl-2">{p.stock === 0 ? '缺貨' : '低庫存'}</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditProduct(p)} className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors" title="編輯">
                                                <Edit2 size={16}/>
                                            </button>
                                            <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="刪除">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-20 text-center text-stone-400">
                                    <Package size={48} className="mx-auto mb-4 opacity-20"/>
                                    <p>沒有符合條件的產品</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showCategoryManager && <CategoryManagerModal isOpen={showCategoryManager} onClose={() => setShowCategoryManager(false)} categories={categories} setCategories={setCategories} products={products} />} 
            {showProductEditor && editingProduct && <ProductEditorModal isOpen={showProductEditor} onClose={() => setShowProductEditor(false)} product={editingProduct} onSave={handleSaveProduct} isCreating={isCreating} categories={categories} />} 
        </div> 
    ); 
};
