import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, Loader2, X, Camera } from 'lucide-react';

interface UploadZoneProps {
  onImageSelected: (base64: string, mimeType: string, previewUrl: string) => void;
  isLoading: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelected, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('請上傳圖片檔案。');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      onImageSelected(base64Data, file.type, objectUrl);
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  const clearImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto mb-6 relative z-10">
      {/* Card Container imitating the 'Profile' section */}
      <div 
        className={`
          relative overflow-hidden rounded-[2.5rem] shadow-2xl transition-all duration-500
          bg-gradient-to-br from-[#a78bfa] to-[#818cf8]
          text-white min-h-[320px] flex flex-col items-center justify-center p-8
          ${isDragging ? 'scale-105 ring-4 ring-white/50' : 'hover:shadow-xl'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Decorative Circles Background */}
        <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-xl"></div>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          disabled={isLoading}
        />

        {preview ? (
          <div className="relative w-full h-full flex flex-col items-center z-10">
            <div className="relative w-48 h-48 mb-4 rounded-3xl overflow-hidden border-4 border-white/30 shadow-lg">
                <img 
                src={preview} 
                alt="Plant Preview" 
                className="w-full h-full object-cover"
                />
                 {isLoading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </div>
                 )}
            </div>
            
            <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-1">
                    {isLoading ? "正在分析..." : "圖片已就緒"}
                </h3>
                <p className="text-white/80 text-sm">
                    {isLoading ? "AI 正在讀取植物數據" : "點擊重新選擇"}
                </p>
            </div>

            {!isLoading && (
                <button 
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all z-30"
                >
                    <X size={20} />
                </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center z-10">
             <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30 group-hover:scale-110 transition-transform">
                <Camera size={40} className="text-white" />
             </div>
            <h3 className="text-2xl font-black tracking-wide mb-2">
              植物檢測站
            </h3>
            <p className="text-white/90 text-sm mb-8">
              上傳植物照片<br/>AI 即時分析光照需求
            </p>
            
            <div className="flex gap-4 text-xs font-medium text-white/70">
                <span className="bg-black/10 px-3 py-1 rounded-full">LPC 檢測</span>
                <span className="bg-black/10 px-3 py-1 rounded-full">PPFD 建議</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadZone;