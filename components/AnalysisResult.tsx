
import React, { useMemo } from 'react';
import { PlantAnalysis } from '../types';
import { Sun, Wind, Sprout, Activity, ArrowRight, Lightbulb, CheckCircle2, Ruler, Rainbow } from 'lucide-react';
import { GENTECH_LIGHTS } from '../utils/lightingData';

interface AnalysisResultProps {
  data: PlantAnalysis;
}

// Simplified Chart optimized for the new style
const LightCurveChart: React.FC<{
  lpc: number;
  ppfdMin: number;
  ppfdMax: number;
  saturation: number;
}> = ({ lpc, ppfdMin, ppfdMax, saturation }) => {
  const width = 500;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  
  const maxX = Math.max(saturation * 1.1, ppfdMax * 1.2);
  const xScale = (val: number) => ((val / maxX) * (width - padding.left - padding.right)) + padding.left;
  
  const maxY = 100;
  const yScale = (val: number) => height - padding.bottom - ((val / maxY) * (height - padding.top - padding.bottom));

  const dPath = `
    M ${xScale(0)} ${yScale(0)}
    Q ${xScale(lpc)} ${yScale(5)} ${xScale(lpc * 1.5)} ${yScale(30)}
    T ${xScale(ppfdMin)} ${yScale(70)}
    T ${xScale(ppfdMax)} ${yScale(90)}
    T ${xScale(saturation)} ${yScale(95)}
  `;

  return (
    <div className="w-full overflow-hidden rounded-3xl bg-white p-4">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Background Area */}
        <path d={`${dPath} L ${xScale(maxX)} ${height-padding.bottom} L ${padding.left} ${height-padding.bottom} Z`} fill="url(#chartGradient)" opacity="0.2" />
        
        <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={padding.left} y1={height-padding.bottom} x2={width-padding.right} y2={height-padding.bottom} stroke="#e5e7eb" strokeWidth="2" />
        
        {/* The Curve */}
        <path d={dPath} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />

        {/* Active Range Area Indicator */}
        <rect x={xScale(ppfdMin)} y={padding.top} width={xScale(ppfdMax) - xScale(ppfdMin)} height={height - padding.top - padding.bottom} fill="#10b981" opacity="0.1" rx="4" />

        {/* Points */}
        <circle cx={xScale(lpc)} cy={yScale(10)} r="4" fill="#3b82f6" />
        <text x={xScale(lpc)} y={yScale(10) - 10} textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="bold">LPC {lpc}</text>

        <circle cx={xScale((ppfdMin + ppfdMax)/2)} cy={yScale(80)} r="4" fill="#10b981" />
        <text x={xScale((ppfdMin + ppfdMax)/2)} y={yScale(80) - 10} textAnchor="middle" fontSize="10" fill="#10b981" fontWeight="bold">最佳區間 {ppfdMin}-{ppfdMax}</text>
        
      </svg>
    </div>
  )
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ data }) => {
  
  const recommendation = useMemo(() => {
    const min = data.numericValues.ppfdMin;
    const max = data.numericValues.ppfdMax;
    const target = (min + max) / 2;
    const plantSize = data.plantSize; // 'Small', 'Medium', 'Large'

    // Flatten all options
    const options = GENTECH_LIGHTS.flatMap(light => 
      light.distances.map(d => ({
        wattage: light.wattage,
        wattageVal: parseInt(light.wattage),
        distance: d.distanceCm,
        ppfd: d.ppfd,
        diff: Math.abs(d.ppfd - target),
        inRange: d.ppfd >= min && d.ppfd <= max,
        isAboveMin: d.ppfd >= min
      }))
    );

    // Helper: Score wattage appropriateness based on plant size
    const getWattageScore = (wattageVal: number) => {
        if (plantSize === 'Large') {
            // Large plants need higher wattage for coverage (24W, 28W)
            // 7W is penalized heavily
            if (wattageVal >= 24) return 3;
            if (wattageVal >= 10) return 2;
            return 0; 
        }
        if (plantSize === 'Medium') {
            // Medium plants are versatile (10W, 24W, 28W)
            if (wattageVal >= 10) return 2;
            return 1;
        }
        if (plantSize === 'Small') {
            // Small plants prefer lower wattage (7W, 10W) to save energy/space, 
            // but higher wattage is acceptable if distance is adjusted.
            if (wattageVal <= 10) return 3;
            if (wattageVal <= 24) return 2;
            return 1;
        }
        return 1;
    };

    const distanceScore = (d: number) => {
      if (d === 30) return 3;
      if (d === 60) return 2;
      if (d === 20) return 1;
      return 0;
    };

    const sorted = options.sort((a, b) => {
      // Priority 0: Wattage Suitability for Plant Size
      const wScoreA = getWattageScore(a.wattageVal);
      const wScoreB = getWattageScore(b.wattageVal);
      if (wScoreA !== wScoreB) return wScoreB - wScoreA;

      // Priority 1: In Range
      if (a.inRange && !b.inRange) return -1;
      if (!a.inRange && b.inRange) return 1;

      // Priority 2: Distance Preference (if both in range or both out)
      if (a.inRange) {
        const dScoreA = distanceScore(a.distance);
        const dScoreB = distanceScore(b.distance);
        if (dScoreA !== dScoreB) return dScoreB - dScoreA;
      }

      // Priority 3: Closest to target (or just sufficient)
      if (!a.inRange && !b.inRange) {
          if (a.isAboveMin && !b.isAboveMin) return -1;
          if (!a.isAboveMin && b.isAboveMin) return 1;
          return a.diff - b.diff;
      }

      return a.diff - b.diff;
    });

    return sorted[0];
  }, [data]);

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-12">
      
      {/* Header Info */}
      <div className="text-center mb-6 animate-fade-in-up">
        <h2 className="text-3xl font-black text-gray-800 tracking-tight mb-1">{data.commonName}</h2>
        <div className="flex justify-center gap-2 items-center">
            <p className="text-gray-500 font-medium text-sm bg-white/50 px-3 py-1 rounded-full">
                {data.scientificName}
            </p>
            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                data.plantSize === 'Large' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                data.plantSize === 'Medium' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                'bg-green-100 text-green-700 border-green-200'
            }`}>
                {data.plantSize === 'Large' ? '大型植栽' : data.plantSize === 'Medium' ? '中型植栽' : '小型植栽'}
            </span>
        </div>
      </div>

      {/* Card 1: Green - PPFD (Like 'Breathing Training' card) */}
      <div className="w-full rounded-[2.5rem] bg-gradient-to-r from-[#6ee7b7] to-[#4ade80] p-6 text-white shadow-lg shadow-green-200 hover:scale-[1.02] transition-transform duration-300 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                    建議光照 PPFD <Sprout className="w-5 h-5 opacity-80" />
                </h3>
                <p className="text-white/80 text-xs mt-1">植物健康生長區間</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Sun className="w-6 h-6 text-white" />
            </div>
        </div>
        <div className="flex items-end gap-2">
             <span className="text-4xl font-black tracking-tighter">{data.ppfd}</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm font-medium bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
            <Activity size={14} />
            <span>光合作用效率核心區</span>
        </div>
      </div>

      {/* Card 2: Blue - LPC (Like 'Stability Training' card) */}
      <div className="w-full rounded-[2.5rem] bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] p-6 text-white shadow-lg shadow-blue-200 hover:scale-[1.02] transition-transform duration-300 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                    光補償點 LPC <Wind className="w-5 h-5 opacity-80" />
                </h3>
                <p className="text-white/80 text-xs mt-1">最低生存需求</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Activity className="w-6 h-6 text-white" />
            </div>
        </div>
        <div className="flex items-end gap-2">
             <span className="text-3xl font-black tracking-tighter">{data.lpc}</span>
        </div>
         <div className="mt-4 text-sm text-white/90 leading-relaxed">
            低於此數值植物將消耗自身養分，請務必提供高於此數值的光照。
        </div>
      </div>

      {/* Card 3: Spectrum Analysis (NEW) */}
      {data.spectrum && (
        <div className="w-full rounded-[2.5rem] bg-gradient-to-br from-indigo-900 to-purple-900 p-6 text-white shadow-lg shadow-purple-200 hover:scale-[1.02] transition-transform duration-300 animate-fade-in-up" style={{animationDelay: '0.25s'}}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        光譜需求分析 <Rainbow className="w-5 h-5 opacity-80" />
                    </h3>
                    <p className="text-white/70 text-xs mt-1">藍光(葉) vs 紅光(花/果)</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                    <span className="text-lg font-bold">{data.spectrum.bluePercent > data.spectrum.redPercent ? "藍光" : "紅光"}</span>
                </div>
            </div>
            
            {/* Visual Spectrum Bar */}
            <div className="relative w-full h-6 bg-gray-800 rounded-full overflow-hidden mb-2">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 opacity-50" />
                
                {/* Active Indicator Segment */}
                <div 
                    className="absolute top-0 bottom-0 bg-white transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    style={{
                        left: `${Math.max(0, Math.min(98, (100 - data.spectrum.bluePercent)))}%`, // Calculate position based on blue vs red
                        width: '4px',
                    }}
                />
            </div>
            <div className="flex justify-between text-xs font-bold text-white/80 mb-4">
                <span className="text-blue-300">藍光 (觀葉生長)</span>
                <span className="text-red-300">紅光 (開花/多肉)</span>
            </div>

            <div className="bg-white/10 rounded-2xl p-3 border border-white/5 backdrop-blur-sm">
                <p className="text-sm leading-relaxed text-white/90">
                    {data.spectrum.description}
                </p>
            </div>
        </div>
      )}


      {/* Card 4: GENTECH Recommendation (Black/Gold Theme) */}
      {recommendation && (
        <div className="w-full rounded-[2.5rem] bg-gradient-to-br from-gray-900 to-black p-6 text-white shadow-xl shadow-gray-400 hover:scale-[1.02] transition-transform duration-300 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500">
                        GENTECH 專屬方案 <Lightbulb className="w-5 h-5 text-amber-400" />
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">依照您的植物需求量身推薦</p>
                </div>
                <div className="bg-white/10 px-3 py-1 rounded-full text-xs text-amber-300 border border-amber-500/30">
                    最佳適配
                </div>
            </div>
            
            <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
                    <span className="text-gray-300 text-sm">推薦型號</span>
                    <span className="text-2xl font-black tracking-tight text-white">{recommendation.wattage} <span className="text-base font-normal text-gray-400">全光譜植物燈</span></span>
                </div>

                <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
                    <span className="text-gray-300 text-sm">建議距離</span>
                    <span className="text-2xl font-black tracking-tight text-amber-400">{recommendation.distance} <span className="text-sm font-normal text-amber-200/70">cm</span></span>
                </div>

                <div className="mt-2 text-xs text-gray-500 flex items-start gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 text-green-500 min-w-[14px]" />
                    <span>
                        系統判定為<strong>{data.plantSize === 'Large' ? '大型' : data.plantSize === 'Medium' ? '中型' : '小型'}植栽</strong>，
                        已為您挑選適合的瓦數以確保光照覆蓋率。
                        此配置可提供 <strong>{recommendation.ppfd} PPFD</strong>。
                    </span>
                </div>
            </div>
        </div>
      )}

      {/* Card 5: Purple/White - Chart & Summary */}
      <div className="w-full rounded-[2.5rem] bg-white p-6 shadow-xl shadow-indigo-100 border border-indigo-50 animate-fade-in-up" style={{animationDelay: '0.35s'}}>
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">光照生長曲線</h3>
            <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-1 rounded-lg">分析結果</span>
         </div>
         
         {data.numericValues && (
            <div className="mb-6 -mx-2">
                <LightCurveChart 
                    lpc={data.numericValues.lpc}
                    ppfdMin={data.numericValues.ppfdMin}
                    ppfdMax={data.numericValues.ppfdMax}
                    saturation={data.numericValues.saturation}
                />
            </div>
         )}

         <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-gray-600 text-sm leading-relaxed">
                {data.lightSummary}
            </p>
         </div>
      </div>

    </div>
  );
};

export default AnalysisResult;
