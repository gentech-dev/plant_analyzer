
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectFile, GalleryItem, User, QuoteItem } from '../types';
import { 
    X, User as UserIcon, Calendar, DollarSign, LayoutGrid, FileImage, 
    Package, Clock, Check, PenLine, Plus, Upload, FileText, Share2, 
    Download, ExternalLink, CheckCircle, Loader2, Megaphone, Sparkles, Image as ImageIcon,
    Tag, Grid, ShieldCheck, AlertCircle, CreditCard, Lock, ArrowRight, Truck, CloudUpload,
    ChevronRight, MapPin, Copy, Landmark, FilePlus2
} from 'lucide-react';
import { uploadFile } from '../firebase';

// --- Refined Helper: Responsive Status Timeline ---
const StatusTimeline: React.FC<{ status: string }> = ({ status }) => {
    const steps = ['規劃中', '估價審核中', '等待付款', '已付款', '已出貨', '已完工'];
    const currentStepIndex = steps.indexOf(status);

    return (
        <div className="w-full py-2 pb-10 overflow-x-auto scrollbar-hide">
            {/* Min-width ensures labels don't get squashed on mobile */}
            <div className="flex items-center justify-between relative min-w-[500px] md:min-w-0 px-4">
                {/* Background Line */}
                <div className="absolute top-[15px] left-4 right-4 h-0.5 bg-stone-100 -z-10 rounded-full"></div>
                
                {/* Colored Progress Line */}
                <div 
                    className="absolute top-[15px] left-4 h-0.5 bg-brand-bronze -z-10 transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 96}%` }} // Adjusted width calculation
                ></div>

                {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    
                    return (
                        <div key={step} className="flex flex-col items-center gap-3 relative group w-20">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 bg-white
                                ${isCompleted 
                                    ? 'bg-brand-bronze border-brand-bronze text-white shadow-md shadow-brand-bronze/20 scale-110' 
                                    : 'border-stone-200 text-stone-300'}
                            `}>
                                {index < currentStepIndex ? <Check size={14} strokeWidth={3} /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                            </div>
                            
                            {/* Label */}
                            <span className={`
                                text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors text-center
                                ${isCurrent ? 'text-brand-bronze' : isCompleted ? 'text-stone-500' : 'text-stone-300'}
                            `}>
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface ProjectDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    user: User | null;
    onUpdateStatus?: (id: string, status: Project['status']) => void;
    onUpdateNotes?: (id: string, notes: string) => void;
    onUploadFile?: (id: string, files: ProjectFile[]) => void;
    onGallerySubmission?: (item: GalleryItem) => void;
    onSelectProjectForQuote: (id: string) => void;
    onQuickAdd: (id: string) => void;
    onPaymentComplete?: (id: string) => void; // Keep for backward compatibility or Admin override
    onNotifyPayment?: (id: string) => void; // New: User notifies payment
    onCreateAddon?: (id: string) => void; // New: Create Add-on Order
}

export const ProjectDetailDialog: React.FC<ProjectDetailDialogProps> = ({
    isOpen, onClose, project, user, 
    onUpdateStatus, onUpdateNotes, onUploadFile, onGallerySubmission, 
    onSelectProjectForQuote, onQuickAdd, onPaymentComplete, onNotifyPayment, onCreateAddon
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'quote'>('overview');
    
    // Notes Auto-save State
    const [notesInput, setNotesInput] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // File Upload State
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Completion Confirmation State
    const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false);

    // Payment State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Gallery Submission State
    const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]); // URLs of selected images
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [submissionTitle, setSubmissionTitle] = useState('');
    const [submissionDesc, setSubmissionDesc] = useState('');
    const [submissionTags, setSubmissionTags] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [agreeSync, setAgreeSync] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);

    // Reset State when Project ID changes
    useEffect(() => {
        if (isOpen && project) {
            setSubmissionTitle(`${project.name} 完工案例`);
            setSelectedImages([]);
            setCoverImage(null);
            setSubmissionDesc('');
            setSubmissionTags('');
            setShowSubmissionSuccess(false);
            setIsSubmissionOpen(false);
            setIsConfirmingCompletion(false);
            setIsPaymentModalOpen(false);
            setShowPaymentSuccess(false);
        }
    }, [project.id, isOpen]); 

    // Update notes when project ID changes
    useEffect(() => {
        if (project) {
            setNotesInput(project.notes || '');
        }
    }, [project.id]);

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setNotesInput(val);
        setIsSavingNotes(true);
  
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  
        saveTimeoutRef.current = setTimeout(() => {
            if (project && onUpdateNotes) {
                onUpdateNotes(project.id, val);
                setIsSavingNotes(false);
            }
        }, 1000);
    };

    const processFiles = async (fileList: FileList | File[]) => {
        if (!project || !onUploadFile) return;

        setIsUploading(true);
        const filesArray = Array.from(fileList);

        try {
            const newFilesPromises = filesArray.map(async (file) => {
                const url = await uploadFile(file, 'project-files');
                return {
                    id: `f-${Date.now()}-${Math.random()}`,
                    name: file.name,
                    type: file.type.includes('pdf') ? 'pdf' : 'image',
                    url: url,
                    uploadDate: new Date().toISOString()
                } as ProjectFile;
            });

            const newFiles = await Promise.all(newFilesPromises);
            onUploadFile(project.id, newFiles);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("檔案上傳失敗，請重試");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    // Updated: Notify Payment instead of Confirming directly
    const handlePaymentNotify = () => {
        if (!onNotifyPayment) return;

        setIsProcessingPayment(true);
        // Simulate network delay
        setTimeout(() => {
            onNotifyPayment(project.id);
            setIsProcessingPayment(false);
            setShowPaymentSuccess(true);
            setTimeout(() => {
                setIsPaymentModalOpen(false);
                setShowPaymentSuccess(false);
            }, 3000);
        }, 1000);
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleOpenSubmission = () => {
        const projectImages = project.files?.filter(f => f.type === 'image').map(f => f.url) || [];
        
        if (projectImages.length === 0) {
             setActiveTab('files');
             alert("請先上傳完工照片後再進行投稿。");
             return;
        }

        setSelectedImages(projectImages);
        if (projectImages.length > 0) {
            setSelectedImages([projectImages[0]]);
            setCoverImage(projectImages[0]);
        }
        setIsSubmissionOpen(true);
    };

    const toggleImageSelection = (url: string) => {
        if (selectedImages.includes(url)) {
            const newSelection = selectedImages.filter(img => img !== url);
            setSelectedImages(newSelection);
            if (coverImage === url) {
                setCoverImage(newSelection.length > 0 ? newSelection[0] : null);
            }
        } else {
            const newSelection = [...selectedImages, url];
            setSelectedImages(newSelection);
            if (!coverImage) {
                setCoverImage(url);
            }
        }
    };

    const handleSubmitToGallery = () => {
        if (!project || !coverImage || !user || !onGallerySubmission) return;
  
        setIsSubmitting(true);
        const tagsArray = submissionTags.split(',').map(t => t.trim()).filter(t => t);

        const newItem: GalleryItem = {
            id: `ug-${Date.now()}`,
            title: submissionTitle,
            image: coverImage,
            images: selectedImages,
            description: submissionDesc,
            tags: tagsArray,
            projectId: project.id,
            userId: user.id || user.email,
            authorName: user.name,
            authorCompany: user.company,
            isPublic: isPublic,
            agreeOfficialSync: agreeSync,
            status: 'pending',
            submissionDate: new Date().toISOString()
        };
  
        setTimeout(() => {
            onGallerySubmission(newItem);
            setIsSubmitting(false);
            setShowSubmissionSuccess(true);
        }, 1500);
    };

    const handleMarkAsCompleted = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isConfirmingCompletion) {
            if (onUpdateStatus) {
                onUpdateStatus(project.id, '已完工');
            }
            setIsConfirmingCompletion(false);
        } else {
            setIsConfirmingCompletion(true);
            setTimeout(() => setIsConfirmingCompletion(false), 3000);
        }
    };

    const handleQuickAddClick = () => {
        const isLocked = ['已付款', '已出貨', '已完工'].includes(project.status);
        if (isLocked && onCreateAddon) {
            if (confirm('此專案已鎖定。是否建立一張新的「追加單」來新增商品？\n\n新專案將繼承此專案的客戶資料。')) {
                onCreateAddon(project.id);
                onClose();
            }
        } else {
            onQuickAdd(project.id);
            onClose();
        }
    };

    const projectTotal = project.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (!isOpen) return null;

    const availableImages = project.files?.filter(f => f.type === 'image') || [];

    // Use createPortal to render the modal at the document body level
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-0 md:p-6">
            <div 
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            
            {/* Main Container - Full height on mobile, centered on desktop */}
            <div className="relative bg-white w-full max-w-6xl h-full md:h-[90vh] md:max-h-[90vh] md:rounded-2xl shadow-2xl animate-fade-in flex flex-col overflow-hidden">
                
                {/* 1. Header (Fixed Height) */}
                <div className="shrink-0 p-4 md:p-6 border-b border-stone-200 bg-white z-20">
                    <div className="flex justify-between items-start mb-2 md:mb-4">
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                                <h3 className="text-xl md:text-2xl font-serif text-stone-800 tracking-tight font-bold truncate">
                                    {project.name}
                                </h3>
                                <span className="bg-stone-100 text-stone-600 border border-stone-200 text-xs px-2 py-0.5 rounded font-bold w-fit">
                                    {project.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-stone-500 font-medium">
                                <span className="flex items-center gap-1.5"><UserIcon size={12}/> {project.client}</span>
                                <span className="flex items-center gap-1.5 font-mono"><DollarSign size={12}/> 預算: {project.budget.toLocaleString()}</span>
                                <span className="flex items-center gap-1.5"><Package size={12}/> {project.items.length} 項</span>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-stone-400 hover:text-stone-800 p-2 hover:bg-stone-100 rounded-full transition-colors -mr-2"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Integrated Progress Bar in Header */}
                    <div className="mt-2 pt-2 border-t border-stone-50">
                        <StatusTimeline status={project.status} />
                    </div>
                </div>
                
                {/* 2. Tabs (Fixed Height) */}
                <div className="shrink-0 flex border-b border-stone-200 bg-white z-10 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'overview', label: '總覽 Dashboard', icon: LayoutGrid },
                        { id: 'files', label: '圖檔 Files', icon: FileImage },
                        { id: 'quote', label: '清單 Quote', icon: Package },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-2 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap
                                ${activeTab === tab.id 
                                    ? 'border-brand-bronze text-brand-bronze' 
                                    : 'border-transparent text-stone-400 hover:text-stone-700'}
                            `}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                {/* 3. Scrollable Content Area (Flex Grow) */}
                <div className="flex-1 overflow-y-auto bg-[#FAF9F6] p-4 md:p-6 w-full custom-scrollbar">
                    
                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="max-w-5xl mx-auto space-y-6 pb-20">
                            
                            {/* Dynamic Action Banner: Waiting for Payment */}
                            {project.status === '等待付款' && (
                                <div className="bg-white border-l-4 border-blue-500 p-6 rounded-r-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
                                    <div className="flex-1">
                                        <h4 className="text-lg font-bold text-stone-800 mb-1 flex items-center gap-2">
                                            <CreditCard className="text-blue-500" /> 正式報價單已確認，等待付款
                                        </h4>
                                        <p className="text-sm text-stone-500">
                                            請核對報價單內容。確認無誤後，請點擊右側按鈕查看匯款資訊。
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                                        <div className="flex justify-between w-full md:block md:text-right">
                                            <span className="text-xs text-stone-400 font-bold uppercase tracking-wider block">應付總額</span>
                                            <span className="text-2xl font-mono font-bold text-stone-800">NT$ {Math.round(projectTotal * 1.05).toLocaleString()}</span>
                                        </div>
                                        <button 
                                            onClick={() => setIsPaymentModalOpen(true)}
                                            className="w-full md:w-auto bg-stone-900 text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-stone-700 transition-all shadow-lg flex items-center justify-center gap-2"
                                        >
                                            前往匯款資訊 <ArrowRight size={16}/>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* NEW Banner: Shipped / Waiting for Completion */}
                            {project.status === '已出貨' && (
                                <div className="bg-white border-l-4 border-emerald-500 p-6 rounded-r-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
                                    <div className="flex-1">
                                        <h4 className="text-lg font-bold text-stone-800 mb-1 flex items-center gap-2">
                                            <Truck className="text-emerald-500" /> 商品已出貨，等待驗收
                                        </h4>
                                        <p className="text-sm text-stone-500">
                                            物流正在配送中或已送達。請您確認商品數量與狀況無誤。<br/>
                                            若安裝完成，請點擊右側按鈕結案。
                                        </p>
                                    </div>
                                    <div className="w-full md:w-auto">
                                        <button 
                                            onClick={handleMarkAsCompleted}
                                            className={`w-full md:w-auto px-8 py-4 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95
                                                ${isConfirmingCompletion 
                                                    ? 'bg-amber-500 text-white animate-pulse' 
                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'}
                                            `}
                                        >
                                            {isConfirmingCompletion ? <AlertCircle size={18}/> : <CheckCircle size={18}/>}
                                            {isConfirmingCompletion ? '確定要結案嗎？' : '確認驗收並完工'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col h-full gap-6">
                                {/* Action Bar - Removed white background container for cleaner look */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mr-auto pl-1">快速操作 Actions</p>
                                    
                                    <button 
                                        onClick={() => {
                                            onSelectProjectForQuote(project.id);
                                            onClose();
                                        }}
                                        className="bg-white border border-stone-200 text-stone-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-stone-800 hover:text-white hover:border-stone-800 transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        <Package size={14}/>
                                        編輯估價單
                                    </button>
                                    <button 
                                        onClick={handleQuickAddClick}
                                        className="bg-white border border-stone-200 text-stone-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-stone-800 hover:text-white hover:border-stone-800 transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        {['已付款', '已出貨', '已完工'].includes(project.status) ? <FilePlus2 size={14}/> : <Plus size={14}/>}
                                        追加商品 {['已付款', '已出貨', '已完工'].includes(project.status) && '(開立追加單)'}
                                    </button>
                                </div>

                                {/* Full Width Notebook */}
                                <div className="flex-1 flex flex-col min-h-[350px]">
                                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col h-full relative overflow-hidden">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                                                <PenLine size={16} className="text-brand-bronze"/> 專案筆記本
                                            </h4>
                                            <span className={`text-[10px] font-medium transition-colors ${isSavingNotes ? 'text-amber-500' : 'text-stone-400'}`}>
                                                {isSavingNotes ? '儲存中...' : '已同步雲端'}
                                            </span>
                                        </div>
                                        <textarea 
                                            value={notesInput}
                                            onChange={handleNotesChange}
                                            placeholder="在此輸入業主需求、施工備註、燈具迴路規劃等任何細節..."
                                            className="flex-1 w-full resize-none outline-none text-sm text-stone-700 leading-relaxed placeholder:text-stone-300 bg-stone-50/50 p-4 rounded-xl border border-stone-100 focus:border-brand-bronze focus:ring-1 focus:ring-brand-bronze/20 transition-all min-h-[300px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: FILES */}
                    {activeTab === 'files' && (
                        <div className="max-w-5xl mx-auto h-full flex flex-col pb-10">
                            <div className="bg-white p-4 md:p-6 rounded-xl border border-stone-200 shadow-sm flex-1 flex flex-col min-h-[400px]">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                                        <FileImage size={16} className="text-brand-bronze"/> 專案圖檔中心
                                    </h4>
                                    
                                    {project.status === '已完工' && (
                                        <button 
                                            onClick={handleOpenSubmission}
                                            className="text-xs bg-brand-bronze text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-brand-bronzeDark transition-colors shadow-sm font-bold"
                                        >
                                            <Megaphone size={12} /> 投稿精選照片
                                        </button>
                                    )}
                                </div>
    
                                {/* Upload Area */}
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`
                                        border-2 border-dashed rounded-xl transition-all cursor-pointer p-8 flex flex-col items-center justify-center mb-6 group shrink-0
                                        ${isDragging 
                                            ? 'border-brand-bronze bg-brand-bronze/5' 
                                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-brand-bronze/50'}
                                    `}
                                >
                                    <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*,.pdf" onChange={handleFileChange} />
                                    
                                    {isUploading ? (
                                        <div className="flex flex-col items-center animate-pulse">
                                            <Loader2 size={32} className="text-brand-bronze animate-spin mb-3"/>
                                            <p className="text-sm font-medium text-stone-600">正在處理檔案...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                                <CloudUpload size={24} className={isDragging ? 'text-brand-bronze' : 'text-stone-400'} />
                                            </div>
                                            <p className="text-sm font-medium text-stone-600">
                                                {isDragging ? '放開以開始上傳' : '點擊或拖曳上傳檔案'}
                                            </p>
                                            <p className="text-xs mt-1 text-stone-400">支援設計圖、施工照、完工美照 (JPG, PNG, PDF)</p>
                                        </>
                                    )}
                                </div>
    
                                {/* File Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                                    {project.files && project.files.map(file => (
                                        <div key={file.id} className="relative group rounded-lg overflow-hidden border border-stone-200 bg-stone-50 aspect-square flex flex-col shadow-sm hover:shadow-md transition-shadow">
                                            {file.type === 'image' ? (
                                                <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-2 text-center bg-white">
                                                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-500 mb-2">
                                                        <FileText size={24} />
                                                    </div>
                                                    <span className="text-[10px] font-medium text-stone-600 truncate w-full px-2">{file.name}</span>
                                                </div>
                                            )}
                                            
                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 backdrop-blur-[1px]">
                                                <a 
                                                    href={file.url} 
                                                    download 
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={(e) => e.stopPropagation()} 
                                                    className="px-4 py-2 bg-white text-stone-900 rounded-full text-xs font-bold hover:bg-brand-bronze hover:text-white flex items-center gap-1 transition-colors"
                                                >
                                                    <Download size={12} /> 下載
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                    {(!project.files || project.files.length === 0) && (
                                        <div className="col-span-full py-16 flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-100 rounded-xl">
                                            <FileImage size={40} className="mb-2 opacity-20"/>
                                            <p className="text-xs">尚無檔案</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: QUOTE */}
                    {activeTab === 'quote' && (
                        <div className="max-w-5xl mx-auto pb-10">
                            <div className="bg-white p-4 md:p-6 rounded-xl border border-stone-200 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                                        <Package size={16} className="text-brand-bronze"/> 採購清單摘要
                                    </h4>
                                    <button 
                                        onClick={() => {
                                            onSelectProjectForQuote(project.id);
                                            onClose();
                                        }}
                                        className="text-xs bg-stone-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-stone-700 transition-colors shadow-sm font-bold"
                                    >
                                        前往完整估價單 <ExternalLink size={12} />
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-stone-50 text-xs text-stone-500 uppercase font-bold border-b border-stone-100">
                                            <tr>
                                                <th className="px-4 py-3 rounded-tl-lg">產品</th>
                                                <th className="px-4 py-3">規格</th>
                                                <th className="px-4 py-3 text-center">數量</th>
                                                <th className="px-4 py-3 text-right rounded-tr-lg">單價</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {project.items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-stone-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                                                                <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                                            </div>
                                                            <span className="font-bold text-stone-800 text-xs md:text-sm line-clamp-1">{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-2 flex-wrap">
                                                            <span className="text-[10px] bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-600 whitespace-nowrap">{item.selectedCCT}</span>
                                                            <span className="text-[10px] bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-600 whitespace-nowrap">{item.selectedColor}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-mono font-medium text-stone-600">x {item.quantity}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-stone-600">NT$ {item.price.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {project.items.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="py-10 text-center text-stone-400 text-xs">
                                                        目前清單是空的
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {project.items.length > 0 && (
                                    <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end items-center gap-4">
                                        <span className="text-xs text-stone-500 uppercase tracking-wider font-bold">總計預估</span>
                                        <span className="text-2xl font-mono font-bold text-stone-800">
                                            NT$ {projectTotal.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Modals (Gallery/Payment) */}
            {isSubmissionOpen && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-stone-100 bg-stone-50 flex justify-between items-center shrink-0">
                            <h3 className="font-serif font-bold text-stone-800 text-lg">投稿完工案例</h3>
                            <button onClick={() => setIsSubmissionOpen(false)}><X size={20} className="text-stone-400 hover:text-stone-800"/></button>
                        </div>
                        
                        {!showSubmissionSuccess ? (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {/* Submission Form Content */}
                                <div>
                                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-3">選擇投稿照片 ({selectedImages.length} 張)</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {availableImages.map(img => (
                                            <div 
                                                key={img.id} 
                                                onClick={() => toggleImageSelection(img.url)}
                                                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group
                                                    ${selectedImages.includes(img.url) 
                                                        ? 'border-brand-bronze ring-2 ring-brand-bronze/20' 
                                                        : 'border-transparent opacity-70 hover:opacity-100'}
                                                `}
                                            >
                                                <img src={img.url} className="w-full h-full object-cover" />
                                                <div className={`absolute top-1 right-1 w-4 h-4 rounded-full border border-white flex items-center justify-center transition-colors
                                                     ${selectedImages.includes(img.url) ? 'bg-brand-bronze' : 'bg-black/30'}
                                                `}>
                                                    {selectedImages.includes(img.url) && <Check size={10} className="text-white"/>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <input value={submissionTitle} onChange={e => setSubmissionTitle(e.target.value)} placeholder="案例標題" className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm focus:border-brand-bronze outline-none"/>
                                    <textarea value={submissionDesc} onChange={e => setSubmissionDesc(e.target.value)} placeholder="設計理念..." className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm focus:border-brand-bronze outline-none resize-none" rows={3}/>
                                </div>
                                <button onClick={handleSubmitToGallery} disabled={isSubmitting} className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-700">{isSubmitting ? '提交中...' : '確認投稿'}</button>
                            </div>
                        ) : (
                            <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
                                <CheckCircle size={48} className="text-emerald-500 mb-4"/>
                                <h4 className="text-xl font-bold text-stone-800">投稿成功！</h4>
                                <button onClick={() => { setIsSubmissionOpen(false); setShowSubmissionSuccess(false); }} className="mt-6 bg-stone-100 text-stone-600 px-6 py-2 rounded-lg font-bold">關閉</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Payment Modal (Bank Transfer) */}
            {isPaymentModalOpen && (
                <div className="absolute inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        {!showPaymentSuccess ? (
                            <>
                                <div className="p-6 bg-stone-900 text-white flex justify-between items-start">
                                    <div>
                                        <h3 className="font-serif font-bold text-xl flex items-center gap-2">
                                            <Landmark size={20} className="text-brand-bronze" /> 銀行匯款資訊
                                        </h3>
                                        <p className="text-xs text-stone-400 mt-1">請匯款至以下公司帳戶</p>
                                    </div>
                                    <button onClick={() => setIsPaymentModalOpen(false)}><X size={20} className="text-stone-400 hover:text-white"/></button>
                                </div>
                                
                                <div className="p-6 space-y-6">
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                                        <p className="text-xs text-stone-500 mb-1 font-bold uppercase tracking-wider">應付總額 (含稅)</p>
                                        <p className="text-3xl font-mono font-bold text-stone-800">NT$ {Math.round(projectTotal * 1.05).toLocaleString()}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 border border-stone-100 rounded-lg bg-stone-50/50 hover:bg-stone-50 transition-colors group">
                                            <div>
                                                <p className="text-[10px] text-stone-400 font-bold uppercase">戶名 Account Name</p>
                                                <p className="font-bold text-stone-800">靖軒科技有限公司</p>
                                            </div>
                                            <button 
                                                onClick={() => handleCopy('靖軒科技有限公司', 'name')}
                                                className="text-stone-400 hover:text-brand-bronze p-1.5 rounded hover:bg-white transition-all relative"
                                            >
                                                {copiedField === 'name' ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-center p-3 border border-stone-100 rounded-lg bg-stone-50/50 hover:bg-stone-50 transition-colors group">
                                            <div>
                                                <p className="text-[10px] text-stone-400 font-bold uppercase">銀行 Bank</p>
                                                <p className="font-bold text-stone-800">國泰世華銀行 建國分行</p>
                                                <p className="text-xs text-stone-500 font-mono">代碼 013 / 分行 2239</p>
                                            </div>
                                            <button 
                                                onClick={() => handleCopy('013', 'bank')}
                                                className="text-stone-400 hover:text-brand-bronze p-1.5 rounded hover:bg-white transition-all"
                                            >
                                                {copiedField === 'bank' ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-center p-3 border border-stone-100 rounded-lg bg-stone-50/50 hover:bg-stone-50 transition-colors group">
                                            <div>
                                                <p className="text-[10px] text-stone-400 font-bold uppercase">帳號 Account No.</p>
                                                <p className="font-mono font-bold text-lg text-brand-bronze tracking-wide">223-035-035-388</p>
                                            </div>
                                            <button 
                                                onClick={() => handleCopy('223035035388', 'account')}
                                                className="text-stone-400 hover:text-brand-bronze p-1.5 rounded hover:bg-white transition-all"
                                            >
                                                {copiedField === 'account' ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button 
                                            onClick={handlePaymentNotify}
                                            disabled={isProcessingPayment}
                                            className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-stone-700 shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            {isProcessingPayment ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18} />}
                                            {isProcessingPayment ? '通知中...' : '已匯款，通知客服查帳'}
                                        </button>
                                        <p className="text-center text-[10px] text-stone-400 mt-3">
                                            點擊按鈕後，客服人員將會收到您的付款通知並進行核對。
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-10 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                    <Check size={40} />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-stone-800 mb-2">通知已送出！</h3>
                                <p className="text-sm text-stone-500 mb-6">
                                    我們已收到您的匯款通知。<br/>
                                    客服專員確認入帳後，將立即為您安排備貨。
                                </p>
                                <p className="text-xs text-stone-400">視窗即將自動關閉...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};
