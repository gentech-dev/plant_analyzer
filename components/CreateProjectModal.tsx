
import React, { useState } from 'react';
import { X, Building2, User as UserIcon, Wallet, FileImage, Trash2, Upload, Plus, Loader2 } from 'lucide-react';
import { Project, ProjectFile } from '../types';
import { uploadFile } from '../firebase';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Partial<Project>, files: ProjectFile[]) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    budget: '',
    status: '規劃中'
  });
  const [uploadedFiles, setUploadedFiles] = useState<ProjectFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          setIsUploading(true);
          try {
              const fileList = Array.from(files) as File[];
              const newFilesPromises = fileList.map(async (file) => {
                  const url = await uploadFile(file, 'project-files');
                  return {
                      id: `file-${Date.now()}-${Math.random()}`,
                      name: file.name,
                      type: file.type.includes('pdf') ? 'pdf' : 'image',
                      url: url,
                      uploadDate: new Date().toISOString()
                  } as ProjectFile;
              });
              
              const newFiles = await Promise.all(newFilesPromises);
              setUploadedFiles(prev => [...prev, ...newFiles]);
          } catch (error) {
              console.error("File upload failed", error);
              alert("部分檔案上傳失敗，請重試");
          } finally {
              setIsUploading(false);
          }
      }
  };

  const removeFile = (id: string) => {
      setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;

    onSubmit({
        name: newProject.name,
        client: newProject.client,
        status: newProject.status as any,
        budget: Number(newProject.budget)
    }, uploadedFiles);
    
    // Reset form
    setNewProject({ name: '', client: '', budget: '', status: '規劃中' });
    setUploadedFiles([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl animate-fade-in flex flex-col overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 sticky top-0 z-10">
          <h3 className="text-xl font-serif text-stone-800">新增設計專案</h3>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-stone-800 p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           <div className="bg-brand-bronze/5 border border-brand-bronze/10 rounded-lg p-4 mb-4">
               <p className="text-xs text-brand-bronze font-medium">提示：新增專案後將自動切換為該專案，您可以立即開始選購。</p>
           </div>
           
           <div className="space-y-2">
             <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">專案名稱</label>
             <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input 
                  type="text"
                  required
                  placeholder="例：信義區陳公館"
                  value={newProject.name}
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                  className="w-full bg-white border border-stone-200 text-stone-800 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze transition-all"
                />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">業主姓名</label>
               <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                    type="text"
                    required
                    placeholder="陳先生"
                    value={newProject.client}
                    onChange={e => setNewProject({...newProject, client: e.target.value})}
                    className="w-full bg-white border border-stone-200 text-stone-800 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze transition-all"
                  />
               </div>
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">專案預算</label>
               <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                    type="number"
                    placeholder="500000"
                    value={newProject.budget}
                    onChange={e => setNewProject({...newProject, budget: e.target.value})}
                    className="w-full bg-white border border-stone-200 text-stone-800 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze transition-all"
                  />
               </div>
             </div>
           </div>

           {/* File Upload Section */}
           <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1 flex justify-between items-center">
                  <span>設計圖檔上傳 (平面圖/渲染圖)</span>
                  <span className="text-[10px] bg-brand-bronze/10 text-brand-bronze px-2 py-0.5 rounded">NEW: 支援線上協作</span>
              </label>
              
              <div className="grid grid-cols-1 gap-3">
                  {uploadedFiles.map(file => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-lg group">
                           <div className="w-12 h-12 bg-white rounded border border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
                               {file.type === 'image' ? (
                                   <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                               ) : (
                                   <FileImage size={24} className="text-stone-400"/>
                               )}
                           </div>
                           <div className="flex-1 min-w-0">
                               <p className="text-sm font-medium text-stone-800 truncate">{file.name}</p>
                               <p className="text-xs text-emerald-600 flex items-center gap-1">
                                   <Upload size={10} /> 上傳完成
                               </p>
                           </div>
                           <button 
                              type="button" 
                              onClick={() => removeFile(file.id)}
                              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                           >
                               <Trash2 size={16} />
                           </button>
                      </div>
                  ))}

                  <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isUploading ? 'bg-stone-50 border-stone-300' : 'border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-brand-bronze'}`}>
                      {isUploading ? (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Loader2 size={24} className="text-brand-bronze animate-spin mb-2" />
                              <p className="text-xs text-stone-500">正在上傳檔案...</p>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload size={24} className="text-stone-400 mb-2" />
                              <p className="text-xs text-stone-500"><span className="font-semibold">點擊上傳</span> 或拖曳檔案至此</p>
                              <p className="text-[10px] text-stone-400">支援 JPG, PNG (Max 5MB)</p>
                          </div>
                      )}
                      <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
              </div>
           </div>

           <div className="pt-4">
             <button 
               type="submit"
               disabled={isUploading}
               className="w-full bg-stone-900 text-white py-3.5 rounded-xl font-medium hover:bg-stone-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {isUploading ? '處理中...' : '建立專案並開始選樣'}
             </button>
           </div>
        </form>
      </div>
    </div>
  );
};
