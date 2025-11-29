
import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const handleReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col animate-fade-in text-white select-none">
      {/* Toolbar */}
      <div className="flex justify-between items-center p-4 bg-black/40 border-b border-white/10 z-50">
        <div className="flex items-center gap-4">
          <div className="flex bg-white/10 rounded-lg p-1">
            <button onClick={handleZoomIn} className="p-2 hover:bg-white/20 rounded-md transition-colors" title="放大">
                <ZoomIn size={20} />
            </button>
            <button onClick={handleZoomOut} className="p-2 hover:bg-white/20 rounded-md transition-colors" title="縮小">
                <ZoomOut size={20} />
            </button>
            <button onClick={handleReset} className="p-2 hover:bg-white/20 rounded-md transition-colors" title="重置">
                <RotateCcw size={20} />
            </button>
          </div>
          <span className="text-sm font-mono text-stone-400">{Math.round(scale * 100)}%</span>
        </div>
        <div className="flex gap-4">
          <a href={imageUrl} download="image" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/20 rounded-full transition-colors" title="開啟原圖/下載">
             <Download size={24} />
          </a>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="關閉">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        className="flex-1 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => {
            if (e.deltaY < 0) handleZoomIn();
            else handleZoomOut();
        }}
      >
        <img 
          src={imageUrl} 
          alt="Full Preview" 
          className="max-w-none transition-transform duration-75 ease-out object-contain"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            maxHeight: scale === 1 ? '85vh' : 'none',
            maxWidth: scale === 1 ? '85vw' : 'none'
          }}
          draggable={false}
        />
      </div>
      
      <div className="p-2 text-center text-xs text-stone-500 bg-black/40">
          滾輪縮放 • 拖曳移動
      </div>
    </div>
  );
};
