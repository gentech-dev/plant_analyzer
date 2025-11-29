
import React, { useState, useRef, useEffect } from 'react';
import { Annotation, ProjectFile } from '../types';
import { X, Pen, Type, Eraser, RotateCcw, Save, MousePointer, Hand } from 'lucide-react';

interface WhiteboardProps {
  file: ProjectFile;
  annotations: Annotation[];
  currentUserRole: 'user' | 'agent';
  onAddAnnotation: (annotation: Annotation) => void;
  onClearAnnotations: (fileId: string) => void;
  onClose: () => void;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ 
  file, 
  annotations, 
  currentUserRole,
  onAddAnnotation, 
  onClearAnnotations,
  onClose 
}) => {
  const [tool, setTool] = useState<'pen' | 'text' | 'eraser'>('pen');
  const [color, setColor] = useState('#ef4444'); // Default red
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  
  // For text tool
  const [textInput, setTextInput] = useState<{x: number, y: number, value: string} | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  // Filter annotations for this file
  const fileAnnotations = annotations.filter(a => a.fileId === file.id);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent drawing if we are interacting with the text input
    if (textInput) return;

    if (tool === 'pen') {
      setIsDrawing(true);
      const coords = getCoordinates(e);
      setCurrentPath([coords]);
    } else if (tool === 'text') {
       const coords = getCoordinates(e);
       // Set initial position for text input
       setTextInput({ x: coords.x, y: coords.y, value: '' });
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool !== 'pen') return;
    const coords = getCoordinates(e);
    setCurrentPath(prev => [...prev, coords]);
  };

  const handleMouseUp = () => {
    if (isDrawing && tool === 'pen' && currentPath.length > 0) {
      const newAnnotation: Annotation = {
        id: `ant-${Date.now()}`,
        fileId: file.id,
        type: 'path',
        color: color,
        points: currentPath,
        creator: currentUserRole
      };
      onAddAnnotation(newAnnotation);
      setCurrentPath([]);
    }
    setIsDrawing(false);
  };

  // Logic to finalize text input (save or cancel)
  const handleTextFinish = () => {
      if (textInput && textInput.value.trim()) {
          const newAnnotation: Annotation = {
              id: `ant-${Date.now()}`,
              fileId: file.id,
              type: 'text',
              color: color,
              text: textInput.value,
              x: textInput.x,
              y: textInput.y,
              creator: currentUserRole
          };
          onAddAnnotation(newAnnotation);
      }
      // Reset input
      setTextInput(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleTextFinish();
      } else if (e.key === 'Escape') {
          setTextInput(null);
      }
  };

  // Convert points array to SVG path d string
  const pointsToPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    const d = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    return d;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
       <div className="bg-white rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
          
          {/* Header */}
          <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
             <div className="flex items-center gap-4">
                 <h3 className="font-serif font-bold text-stone-800 flex items-center gap-2">
                    <Pen size={18} className="text-brand-bronze"/> 
                    設計協作模式
                 </h3>
                 <span className="text-xs text-stone-500 bg-white px-2 py-1 rounded border border-stone-200">
                     檔案：{file.name}
                 </span>
             </div>
             
             {/* Toolbar */}
             <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-stone-200 shadow-sm">
                 <button 
                    onClick={() => setTool('pen')}
                    className={`p-2 rounded-md transition-all ${tool === 'pen' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-100'}`}
                    title="畫筆"
                 >
                     <Pen size={18} />
                 </button>
                 <button 
                    onClick={() => setTool('text')}
                    className={`p-2 rounded-md transition-all ${tool === 'text' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-100'}`}
                    title="文字"
                 >
                     <Type size={18} />
                 </button>
                 
                 <div className="w-px h-6 bg-stone-200 mx-1"></div>
                 
                 {/* Color Picker */}
                 <div className="flex items-center gap-1 px-1">
                     {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#000000'].map(c => (
                         <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-stone-800 scale-110' : 'border-transparent hover:scale-105'}`}
                            style={{ backgroundColor: c }}
                         />
                     ))}
                 </div>

                 <div className="w-px h-6 bg-stone-200 mx-1"></div>

                 <button 
                    onClick={() => onClearAnnotations(file.id)}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="清除所有標記"
                 >
                     <Eraser size={18} />
                 </button>
             </div>

             <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                 <X size={24} className="text-stone-500"/>
             </button>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto bg-stone-100 relative flex items-center justify-center p-8">
             <div className="relative shadow-lg select-none" style={{ cursor: tool === 'pen' ? 'crosshair' : tool === 'text' ? 'text' : 'default' }}>
                <img 
                    src={file.url} 
                    alt="Design File" 
                    className="max-w-full max-h-[70vh] object-contain pointer-events-none"
                    onDragStart={(e) => e.preventDefault()}
                />
                <svg
                    ref={svgRef}
                    className="absolute inset-0 w-full h-full"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                >
                    {/* Render existing annotations */}
                    {fileAnnotations.map(ant => {
                        if (ant.type === 'path' && ant.points) {
                            return (
                                <path
                                    key={ant.id}
                                    d={pointsToPath(ant.points)}
                                    stroke={ant.color}
                                    strokeWidth="3"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="drop-shadow-sm"
                                />
                            );
                        } else if (ant.type === 'text' && ant.text) {
                            return (
                                <text
                                    key={ant.id}
                                    x={ant.x}
                                    y={ant.y}
                                    fill={ant.color}
                                    fontSize="20"
                                    fontFamily="sans-serif"
                                    fontWeight="bold"
                                    className="drop-shadow-md"
                                >
                                    {ant.text}
                                </text>
                            );
                        }
                        return null;
                    })}

                    {/* Render current path being drawn */}
                    {currentPath.length > 0 && (
                         <path
                            d={pointsToPath(currentPath)}
                            stroke={color}
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.8"
                         />
                    )}
                </svg>

                {/* Text Input Overlay */}
                {textInput && (
                    <input
                        autoFocus
                        style={{ 
                            position: 'absolute', 
                            left: textInput.x, 
                            top: textInput.y - 15, // Offset to align baseline
                            color: color,
                            fontSize: '20px',
                            fontWeight: 'bold',
                            fontFamily: 'sans-serif',
                            zIndex: 10
                        }}
                        className="bg-white/90 border border-brand-bronze rounded px-2 py-1 min-w-[150px] shadow-sm outline-none"
                        value={textInput.value}
                        onChange={(e) => setTextInput({...textInput, value: e.target.value})}
                        onKeyDown={handleKeyDown}
                        onBlur={handleTextFinish} // Save when clicking away
                        onMouseDown={(e) => e.stopPropagation()} // Prevent triggering svg mousedown
                        placeholder="輸入文字..."
                    />
                )}
             </div>
          </div>
          
          <div className="bg-white border-t border-stone-200 p-2 text-center text-xs text-stone-400">
               雙方皆可即時看到標註內容 • 點擊 Enter 儲存文字
          </div>
       </div>
    </div>
  );
};
