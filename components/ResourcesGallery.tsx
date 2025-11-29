
import React, { useState, useMemo } from 'react';
import { GalleryItem } from '../types';
import { Download, File, Image as ImageIcon, Eye, Building2, Search, X, ChevronLeft, ChevronRight, Grid } from 'lucide-react';

interface ResourcesGalleryProps {
    gallery: GalleryItem[];
}

export const ResourcesGallery: React.FC<ResourcesGalleryProps> = ({ gallery }) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'downloads'>('gallery');
  
  // Gallery Logic
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [sliderIndex, setSliderIndex] = useState(0);

  // Filter only items that are official or approved
  const visibleGallery = useMemo(() => {
      let items = gallery.filter(item => item.status === 'official' || item.status === 'approved');
      
      if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          items = items.filter(item => 
              item.title.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q) ||
              item.authorCompany?.toLowerCase().includes(q) ||
              item.tags?.some(t => t.toLowerCase().includes(q))
          );
      }
      return items;
  }, [gallery, searchQuery]);

  const displayedItems = visibleGallery.slice(0, visibleCount);
  const hasMore = visibleCount < visibleGallery.length;

  const handleLoadMore = () => {
      setVisibleCount(prev => prev + 6);
  };

  const handleOpenModal = (item: GalleryItem) => {
      setSelectedItem(item);
      setSliderIndex(0); // Reset slider
  };

  const handleSliderNav = (dir: 'prev' | 'next') => {
      if (!selectedItem) return;
      const images = selectedItem.images || [selectedItem.image];
      const max = images.length - 1;

      if (dir === 'prev') {
          setSliderIndex(prev => prev > 0 ? prev - 1 : max);
      } else {
          setSliderIndex(prev => prev < max ? prev + 1 : 0);
      }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Case Study Modal */}
      {selectedItem && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in p-4 md:p-10">
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[110]"
              >
                  <X size={32} />
              </button>

              <div className="w-full h-full max-w-7xl flex flex-col md:flex-row bg-stone-900/50 rounded-2xl overflow-hidden border border-white/10">
                  
                  {/* Image Slider */}
                  <div className="flex-1 relative bg-black flex items-center justify-center">
                      {(selectedItem.images && selectedItem.images.length > 1) && (
                          <>
                            <button 
                                onClick={() => handleSliderNav('prev')}
                                className="absolute left-4 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full z-10 transition-colors"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button 
                                onClick={() => handleSliderNav('next')}
                                className="absolute right-4 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full z-10 transition-colors"
                            >
                                <ChevronRight size={24} />
                            </button>
                            
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                {selectedItem.images.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`w-2 h-2 rounded-full transition-all ${idx === sliderIndex ? 'bg-white scale-125' : 'bg-white/30'}`}
                                    />
                                ))}
                            </div>
                          </>
                      )}

                      <img 
                          src={(selectedItem.images && selectedItem.images.length > 0) ? selectedItem.images[sliderIndex] : selectedItem.image}
                          className="max-w-full max-h-full object-contain"
                          alt="Case Study" 
                      />
                  </div>

                  {/* Info Sidebar */}
                  <div className="w-full md:w-96 bg-white flex flex-col p-8 overflow-y-auto shrink-0">
                      <div>
                          <div className="flex gap-2 mb-4">
                              {selectedItem.tags?.map(tag => (
                                  <span key={tag} className="px-2 py-1 bg-stone-100 text-stone-600 text-[10px] rounded uppercase tracking-wider font-bold">
                                      {tag}
                                  </span>
                              ))}
                          </div>
                          <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">{selectedItem.title}</h2>
                          {selectedItem.authorCompany && (
                              <p className="text-brand-bronze font-medium text-sm mb-6 flex items-center gap-1.5">
                                  <Building2 size={14}/> Design by {selectedItem.authorCompany}
                              </p>
                          )}

                          <div className="grid grid-cols-2 gap-4 mb-8">
                                {selectedItem.ugr && (
                                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 text-center">
                                        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">眩光值 UGR</p>
                                        <p className="text-xl font-mono text-stone-800 font-bold">&lt; {selectedItem.ugr}</p>
                                    </div>
                                )}
                                {selectedItem.cri && (
                                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 text-center">
                                        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">演色性 CRI</p>
                                        <p className="text-xl font-mono text-stone-800 font-bold">&gt; {selectedItem.cri}</p>
                                    </div>
                                )}
                          </div>

                          <div className="prose prose-sm prose-stone mb-8">
                              <p className="text-stone-600 font-light leading-relaxed whitespace-pre-wrap">
                                  {selectedItem.description}
                              </p>
                          </div>
                      </div>

                      <div className="mt-auto pt-6 border-t border-stone-100">
                           <p className="text-xs text-stone-400">
                               {selectedItem.status === 'official' ? 'Official Case Study' : `Posted by ${selectedItem.authorName}`}
                           </p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-800">資源與藝廊</h2>
          <p className="text-stone-500 mt-2 font-light">完工案例展示與技術檔案下載</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            {activeTab === 'gallery' && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16}/>
                    <input 
                        type="text" 
                        placeholder="搜尋案例、設計師..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 bg-white border border-stone-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-brand-bronze outline-none shadow-sm"
                    />
                </div>
            )}
            <div className="bg-white p-1 rounded-xl flex gap-1 border border-stone-200 shadow-sm">
                <button 
                    onClick={() => setActiveTab('gallery')}
                    className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                        ${activeTab === 'gallery' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-400 hover:text-stone-800'}`}
                >
                    <ImageIcon size={16} strokeWidth={1.5} /> 完工藝廊
                </button>
                <button 
                    onClick={() => setActiveTab('downloads')}
                    className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                        ${activeTab === 'downloads' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-400 hover:text-stone-800'}`}
                >
                    <Download size={16} strokeWidth={1.5} /> 檔案下載
                </button>
            </div>
        </div>
      </div>

      {activeTab === 'gallery' ? (
        <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayedItems.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => handleOpenModal(item)}
                        className="bg-white border border-stone-100 rounded-2xl overflow-hidden group hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-500 flex flex-col cursor-pointer"
                    >
                        <div className="relative h-72 overflow-hidden">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent opacity-80"></div>
                            
                            {/* Multi-image indicator */}
                            {item.images && item.images.length > 1 && (
                                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
                                    <Grid size={12} /> +{item.images.length - 1}
                                </div>
                            )}

                            <div className="absolute bottom-6 left-6 right-6">
                                <h3 className="text-2xl font-serif text-white mb-3 leading-tight">{item.title}</h3>
                                <div className="flex gap-2 flex-wrap">
                                    {item.authorCompany && (
                                        <span className="px-3 py-1 bg-brand-bronze/90 backdrop-blur-md rounded border border-brand-bronze/50 text-xs text-white font-medium flex items-center gap-1.5 shadow-md">
                                            <Building2 size={12} /> Design by {item.authorCompany}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <p className="text-stone-500 text-sm leading-relaxed font-light flex-1 line-clamp-3">{item.description}</p>
                            
                            <div className="flex gap-2 mt-4 flex-wrap">
                                {item.tags?.slice(0,3).map(tag => (
                                    <span key={tag} className="text-[10px] text-stone-400 bg-stone-50 px-2 py-1 rounded border border-stone-100">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {visibleGallery.length === 0 && (
                <div className="text-center py-20 text-stone-400 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                    <p>找不到符合搜尋條件的案例</p>
                </div>
            )}

            {hasMore && (
                <div className="flex justify-center pt-8">
                    <button 
                        onClick={handleLoadMore}
                        className="bg-white border border-stone-200 text-stone-600 px-8 py-3 rounded-full hover:bg-stone-50 hover:text-stone-900 hover:shadow-sm transition-all text-sm font-medium flex items-center gap-2"
                    >
                        載入更多案例 <ChevronRight size={16} className="rotate-90"/>
                    </button>
                </div>
            )}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                <h3 className="font-serif text-lg text-stone-800">常用技術檔案庫</h3>
            </div>
            <div className="divide-y divide-stone-100">
                {[
                    { name: 'Gentech Aero Track System.dwg', size: '2.4 MB', type: 'CAD' },
                    { name: 'Pro-Vision Downlight Series.ies', size: '156 KB', type: 'IES' },
                    { name: 'Infinity Linear Profile.skp', size: '5.1 MB', type: 'SketchUp' },
                    { name: '2024 Gentech Master Catalog.pdf', size: '28.5 MB', type: 'PDF' },
                ].map((file, idx) => (
                    <div key={idx} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors group">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 group-hover:text-brand-bronze group-hover:bg-brand-bronze/10 transition-colors">
                                <File size={22} strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-stone-800 font-medium text-sm">{file.name}</p>
                                <p className="text-stone-400 text-xs mt-1 font-mono">{file.type} • {file.size}</p>
                            </div>
                        </div>
                        <button className="text-stone-400 hover:text-brand-bronze p-2.5 rounded-full hover:bg-stone-100 transition-colors">
                            <Download size={22} strokeWidth={1.5} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};
