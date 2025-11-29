
import React from 'react';
import { GalleryItem } from '../../types';

interface GalleryManagerProps {
  gallery: GalleryItem[];
  setGallery: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({ gallery, setGallery }) => { 
    const handleStatus = (id: string, status: string) => { 
        setGallery((prev: any[]) => prev.map(item => item.id === id ? { ...item, status } : item)); 
    }; 
    
    return ( 
        <div className="bg-white border border-stone-200 rounded-2xl p-6 h-full flex flex-col"> 
            <h2 className="text-xl font-serif text-stone-800 mb-6">藝廊投稿審核</h2> 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto"> 
                {gallery.map((item: any) => ( 
                    <div key={item.id} className="border rounded-lg overflow-hidden flex flex-col"> 
                        <img src={item.image} className="h-40 w-full object-cover" alt={item.title}/> 
                        <div className="p-3 flex-1 flex flex-col"> 
                            <h4 className="font-bold">{item.title}</h4> 
                            <p className="text-xs text-stone-500 mb-2">{item.authorCompany}</p> 
                            <span className={`text-xs px-2 py-1 rounded w-fit mb-2 ${item.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.status}</span> 
                            <div className="mt-auto flex gap-2 pt-2"> 
                                {item.status === 'pending' && (
                                    <>
                                        <button onClick={() => handleStatus(item.id, 'approved')} className="flex-1 bg-emerald-600 text-white py-1 rounded text-xs">批准</button> 
                                        <button onClick={() => handleStatus(item.id, 'rejected')} className="flex-1 bg-red-100 text-red-600 py-1 rounded text-xs">退回</button> 
                                    </>
                                )} 
                            </div> 
                        </div> 
                    </div> 
                ))} 
            </div> 
        </div> 
    ); 
};
