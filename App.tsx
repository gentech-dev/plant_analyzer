import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import AnalysisResult from './components/AnalysisResult';
import { analyzePlantImage } from './services/geminiService';
import { AnalysisState, PlantAnalysis } from './types';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    data: null,
  });

  const handleImageSelected = useCallback(async (base64: string, mimeType: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, data: null }));

    try {
      const result: PlantAnalysis = await analyzePlantImage(base64, mimeType);
      setState({
        isLoading: false,
        error: null,
        data: result,
      });
    } catch (err: any) {
      setState({
        isLoading: false,
        error: err.message || "分析圖片時發生未預期的錯誤。",
        data: null,
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-green-200">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 pt-4 pb-12 flex flex-col items-center">
        
        {/* Title Section */}
        {!state.data && (
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-3">
              GENTECH植物光照檢測
            </h1>
            <p className="text-gray-500 text-lg font-medium">
              AI 即時分析，一路進階<span className="text-green-600">綠手指</span>大神
            </p>
          </div>
        )}

        <UploadZone 
          onImageSelected={handleImageSelected} 
          isLoading={state.isLoading}
        />

        {state.error && (
          <div className="w-full max-w-md mb-6 bg-red-50 border-2 border-red-100 text-red-600 px-6 py-4 rounded-3xl flex items-center gap-3 shadow-sm">
            <AlertCircle className="flex-shrink-0" size={24} />
            <div className="font-bold">{state.error}</div>
          </div>
        )}

        {state.data && !state.isLoading && (
          <AnalysisResult data={state.data} />
        )}

      </main>

      <footer className="py-8 text-center">
        <p className="text-gray-400 text-xs font-medium tracking-wider">
          © GENTECH · AI POWERED ANALYSIS
        </p>
      </footer>
    </div>
  );
};

export default App;