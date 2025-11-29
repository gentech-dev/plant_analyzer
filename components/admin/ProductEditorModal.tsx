
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '../../types';
import { X, Loader2, Upload, Image as ImageIcon, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { uploadFile } from '../../firebase';

interface ProductEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    onSave: (product: Product) => void;
    isCreating: boolean;
    categories: string[];
}

export const ProductEditorModal: React.FC<ProductEditorModalProps> = ({ isOpen, onClose, product, onSave, isCreating, categories }) => { 
    const [formData, setFormData] = useState<Product>(product); 
    const [newSpecKey, setNewSpecKey] = useState(''); 
    const [newSpecValue, setNewSpecValue] = useState(''); 
    const [newResource, setNewResource] = useState(''); 
    const [previewImage, setPreviewImage] = useState(product.image); 
    const [isUploading, setIsUploading] = useState(false); 
    const [specsList, setSpecsList] = useState<{id: string, key: string, value: any}[]>([]); 
    const dragItem = useRef<number | null>(null); 
    const dragOverItem = useRef<number | null>(null); 
    
    useEffect(() => { 
        setFormData(product); 
        setPreviewImage(product.image); 
        if (product.specs) { 
            setSpecsList(Object.entries(product.specs).map(([k, v], i) => ({ id: `spec-${i}-${k}`, key: k, value: v }))); 
        } 
    }, [product]); 
    
    const handleChange = (field: keyof Product, value: any) => { setFormData(prev => ({ ...prev, [field]: value })); }; 
    const syncSpecsToFormData = (list: {key: string, value: any}[]) => { const newSpecs = Object.fromEntries(list.map(i => [i.key, i.value])); setFormData(prev => ({...prev, specs: newSpecs})); }; 
    const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => { const _list = [...specsList]; _list[index] = { ..._list[index], [field]: val }; setSpecsList(_list); syncSpecsToFormData(_list); }; 
    const handleDeleteSpec = (index: number) => { const _list = [...specsList]; _list.splice(index, 1); setSpecsList(_list); syncSpecsToFormData(_list); }; 
    const handleAddSpec = () => { if (newSpecKey && newSpecValue) { const newItem = { id: `spec-${Date.now()}`, key: newSpecKey, value: newSpecValue }; const _list = [...specsList, newItem]; setSpecsList(_list); syncSpecsToFormData(_list); setNewSpecKey(''); setNewSpecValue(''); } }; 
    const onDragStart = (e: React.DragEvent, index: number) => { dragItem.current = index; }; 
    const onDragEnter = (e: React.DragEvent, index: number) => { dragOverItem.current = index; }; 
    const onDragEnd = () => { if (dragItem.current === null || dragOverItem.current === null) return; const _list = [...specsList]; const draggedItemContent = _list[dragItem.current]; _list.splice(dragItem.current, 1); _list.splice(dragOverItem.current, 0, draggedItemContent); dragItem.current = null; dragOverItem.current = null; setSpecsList(_list); syncSpecsToFormData(_list); }; 
    const moveItem = (index: number, direction: -1 | 1) => { if (index + direction < 0 || index + direction >= specsList.length) return; const _list = [...specsList]; const temp = _list[index]; _list[index] = _list[index + direction]; _list[index + direction] = temp; setSpecsList(_list); syncSpecsToFormData(_list); }; 
    const handleAddResource = () => { if (newResource && !formData.resources.includes(newResource)) { setFormData(prev => ({ ...prev, resources: [...prev.resources, newResource] })); setNewResource(''); } }; 
    const handleDeleteResource = (res: string) => { setFormData(prev => ({ ...prev, resources: prev.resources.filter(r => r !== res) })); }; 
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setIsUploading(true); try { const url = await uploadFile(file, 'products'); setPreviewImage(url); handleChange('image', url); } catch (error) { console.error("Upload failed", error); alert("圖片上傳失敗"); } finally { setIsUploading(false); } } }; 
    const handleSave = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); }; 
    
    if (!isOpen) return null; 
    
    return createPortal( 
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"> 
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"> 
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50"> 
                    <h3 className="text-xl font-serif font-bold text-stone-800">{isCreating ? '新增產品' : '編輯產品'}</h3> 
                    <button onClick={onClose}><X size={20} className="text-stone-400 hover:text-stone-800" /></button> 
                </div> 
                <div className="overflow-y-auto p-6"> 
                    <form id="productForm" onSubmit={handleSave} className="space-y-6"> 
                        <div className="grid grid-cols-2 gap-4"> 
                            <div className="space-y-1"> <label className="text-xs font-bold text-stone-400">產品名稱</label> <input required value={formData.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-brand-bronze"/> </div> 
                            <div className="space-y-1"> <label className="text-xs font-bold text-stone-400">分類</label> <select value={formData.category} onChange={e => handleChange('category', e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-brand-bronze"> {categories.map((c: any) => <option key={c} value={c}>{c}</option>)} </select> </div> 
                        </div> 
                        <div className="grid grid-cols-2 gap-4"> 
                            <div className="space-y-1"> <label className="text-xs font-bold text-stone-400">價格 (NT$)</label> <input type="number" required value={formData.price} onChange={e => handleChange('price', Number(e.target.value))} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-brand-bronze"/> </div> 
                            <div className="space-y-1"> <label className="text-xs font-bold text-stone-400">庫存</label> <input type="number" required value={formData.stock} onChange={e => handleChange('stock', Number(e.target.value))} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-brand-bronze"/> </div> 
                        </div> 
                        {/* Image Upload Area */}
                        <div className="space-y-2"> 
                            <label className="text-xs font-bold text-stone-400">產品圖片</label> 
                            <div className="flex items-start gap-4"> 
                                <div className="w-32 h-32 bg-stone-100 rounded-lg border border-stone-200 overflow-hidden shrink-0"> {previewImage ? <img src={previewImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-stone-400"><ImageIcon size={24}/></div>} </div> 
                                <div className="flex-1 space-y-2"> 
                                    <input type="text" placeholder="輸入圖片 URL" value={formData.image} onChange={e => { handleChange('image', e.target.value); setPreviewImage(e.target.value); }} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-brand-bronze"/> 
                                    <div className="flex items-center gap-2"> <span className="text-xs text-stone-400">或</span> <label className={`cursor-pointer bg-stone-100 text-stone-600 px-3 py-2 rounded-lg text-xs hover:bg-stone-200 transition-colors flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}> {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={14} />} {isUploading ? '上傳中...' : '上傳本地圖片'} <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} /> </label> </div> 
                                </div> 
                            </div> 
                        </div> 
                        {/* Specs */}
                        <div className="space-y-2 border-t border-stone-100 pt-4"> 
                            <div className="flex justify-between items-center"><label className="text-xs font-bold text-stone-400 uppercase tracking-widest">技術規格</label> <span className="text-[10px] text-stone-400">拖曳排序</span></div> 
                            <div className="space-y-2"> 
                                {specsList.map((spec: any, idx: number) => ( 
                                    <div key={spec.id} draggable onDragStart={(e) => onDragStart(e, idx)} onDragEnter={(e) => onDragEnter(e, idx)} onDragEnd={onDragEnd} onDragOver={(e) => e.preventDefault()} className={`flex items-center gap-2 bg-stone-50 p-2 rounded border border-stone-100 group transition-all ${idx < 6 ? 'border-l-4 border-l-brand-bronze shadow-sm' : 'opacity-75'}`}> 
                                        <div className="flex flex-col items-center gap-1 text-stone-300 px-1 cursor-grab active:cursor-grabbing hover:text-stone-500"> <GripVertical size={16} /></div> 
                                        <div className="flex flex-col gap-0.5 mr-1"><button type="button" onClick={() => moveItem(idx, -1)} className="text-stone-300 hover:text-stone-800 disabled:opacity-20" disabled={idx === 0}><ArrowUp size={10} /></button><button type="button" onClick={() => moveItem(idx, 1)} className="text-stone-300 hover:text-stone-800 disabled:opacity-20" disabled={idx === specsList.length - 1}><ArrowDown size={10} /></button></div> 
                                        <div className="flex-1 min-w-0 flex gap-2"> 
                                            <div className="w-1/3"><input value={spec.key} onChange={e => handleSpecChange(idx, 'key', e.target.value)} className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-xs outline-none focus:border-brand-bronze"/></div> 
                                            <div className="flex-1"><input value={spec.value} onChange={e => handleSpecChange(idx, 'value', e.target.value)} className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-xs outline-none focus:border-brand-bronze"/></div> 
                                        </div> 
                                        <button type="button" onClick={() => handleDeleteSpec(idx)} className="text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button> 
                                    </div> 
                                ))} 
                            </div> 
                            <div className="flex gap-2 mt-2"> <input placeholder="規格名稱" value={newSpecKey} onChange={e => setNewSpecKey(e.target.value)} className="flex-1 bg-stone-50 border border-stone-200 rounded p-1.5 text-xs outline-none"/> <input placeholder="數值" value={newSpecValue} onChange={e => setNewSpecValue(e.target.value)} className="flex-1 bg-stone-50 border border-stone-200 rounded p-1.5 text-xs outline-none"/> <button type="button" onClick={handleAddSpec} className="bg-stone-800 text-white px-3 py-1 rounded text-xs hover:bg-stone-600">新增</button> </div> 
                        </div> 
                        {/* Resources */}
                        <div className="space-y-2 border-t border-stone-100 pt-4"> 
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">下載資源</label> 
                            <div className="flex flex-wrap gap-2 mb-2"> {formData.resources.map(res => ( <span key={res} className="bg-stone-100 border border-stone-200 px-3 py-1 rounded-full text-xs text-stone-700 flex items-center gap-2"> {res} <button type="button" onClick={() => handleDeleteResource(res)} className="text-stone-400 hover:text-red-500"><X size={12}/></button> </span> ))} </div> 
                            <div className="flex gap-2"> <input placeholder="輸入資源名稱" value={newResource} onChange={e => setNewResource(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddResource(); }}} className="flex-1 bg-stone-50 border border-stone-200 rounded p-2 text-xs outline-none"/> <button type="button" onClick={handleAddResource} className="bg-stone-100 text-stone-600 px-3 py-1 rounded text-xs hover:bg-stone-200">新增</button> </div> 
                        </div> 
                    </form> 
                </div> 
                <div className="p-6 border-t border-stone-100 flex gap-3 bg-stone-50"> <button onClick={onClose} className="flex-1 py-3 bg-white border border-stone-200 text-stone-500 rounded-xl hover:bg-stone-100 font-bold text-sm">取消</button> <button type="submit" form="productForm" disabled={isUploading} className="flex-1 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm shadow-lg">{isUploading ? '上傳中...' : '儲存變更'}</button> </div> 
            </div> 
        </div>, document.body); 
};
