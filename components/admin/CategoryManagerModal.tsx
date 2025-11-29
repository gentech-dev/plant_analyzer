
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '../../types';
import { X, Trash2 } from 'lucide-react';

interface CategoryManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
    setCategories: (newCategories: string[] | ((prev: string[]) => string[])) => void;
    products: Product[];
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose, categories, setCategories, products }) => { 
    const [newCat, setNewCat] = useState(''); 
    
    const handleDeleteCategory = (category: string) => {
        // Check for dependencies
        const linkedProducts = products.filter((p: Product) => p.category === category);
        if (linkedProducts.length > 0) {
            alert(`無法刪除分類「${category}」！\n\n尚有 ${linkedProducts.length} 個產品屬於此分類。\n請先將這些產品移動到其他分類後再試。`);
            return;
        }
        
        if (confirm(`確定要刪除分類「${category}」嗎？`)) {
            setCategories((prev:string[]) => prev.filter(x => x !== category));
        }
    };

    if(!isOpen) return null; 
    return createPortal( 
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-[100] backdrop-blur-sm"> 
            <div className="bg-white rounded-2xl w-96 shadow-xl overflow-hidden animate-fade-in"> 
                <div className="p-5 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-stone-800 font-serif">分類管理</h3> 
                    <button onClick={onClose} className="p-1 hover:bg-stone-200 rounded-full"><X size={18} className="text-stone-500"/></button>
                </div>
                <div className="p-5">
                    <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-1"> 
                        {categories.map((c: string) => ( 
                            <div key={c} className="flex justify-between items-center p-3 bg-stone-50 rounded-lg border border-stone-100 group hover:border-stone-200"> 
                                <span className="text-sm font-medium text-stone-700">{c}</span> 
                                <button onClick={() => handleDeleteCategory(c)} className="text-stone-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"><Trash2 size={16}/></button> 
                            </div> 
                        ))} 
                    </div> 
                    <div className="flex gap-2"> 
                        <input value={newCat} onChange={e => setNewCat(e.target.value)} className="border border-stone-200 rounded-lg p-2.5 text-sm flex-1 outline-none focus:border-brand-bronze" placeholder="輸入新分類名稱..."/> 
                        <button onClick={() => {if(newCat && !categories.includes(newCat)) { setCategories((p:string[]) => [...p, newCat]); setNewCat('');}}} disabled={!newCat} className="bg-stone-900 text-white px-4 rounded-lg text-sm font-bold hover:bg-stone-700 disabled:opacity-50">新增</button> 
                    </div> 
                </div>
            </div> 
        </div>, document.body); 
}
