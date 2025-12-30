
import React, { useState } from 'react';
import { analyzeFragment } from '../services/geminiService';
import { COLORS, SENTIMENT_GALAXY_MAP } from '../constants';
import { Fragment, Sentiment, FragmentType } from '../types';

interface InputModalProps {
  onClose: () => void;
  onSubmit: (f: Fragment, reply: string) => void;
  activeGalaxyIndex: number;
}

const InputModal: React.FC<InputModalProps> = ({ onClose, onSubmit, activeGalaxyIndex }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [isCommitting, setIsCommitting] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const analysis = await analyzeFragment(text);
    setAiResponse(analysis);
    setLoading(false);
  };

  const handleConfirm = () => {
    if (!aiResponse) return;
    setIsCommitting(true);

    // 提交仪式：等待粒子坍缩感动画
    setTimeout(() => {
      const sentiment = aiResponse.sentiment as Sentiment;
      const targetGalaxyIndex = SENTIMENT_GALAXY_MAP[sentiment] ?? activeGalaxyIndex;

      const intensity = Math.min(Math.max(aiResponse.intensity, 1), 10);
      const r = 180 + (10 - intensity) * 60; 

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      const relativePosition: [number, number, number] = [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.8,
        r * Math.cos(phi)
      ];

      const newFragment: Fragment = {
        id: Math.random().toString(36).substr(2, 9),
        content: text,
        sentiment: sentiment,
        type: FragmentType.STAR, 
        intensity: intensity,
        tags: aiResponse.tags,
        createdAt: Date.now(),
        isUser: true,
        position: relativePosition,
        galaxyIndex: targetGalaxyIndex
      };

      onSubmit(newFragment, aiResponse.reply);
    }, 700); 
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* 遮罩层同步消失 */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-md transition-all duration-[1000ms] ${isCommitting ? 'opacity-0 scale-110' : 'opacity-100'}`} 
        onClick={onClose} 
      />
      
      {/* 坍缩动画容器 */}
      <div className={`relative w-full max-w-2xl transition-all duration-[800ms] cubic-bezier(0.68, -0.6, 0.32, 1.6) ${
        isCommitting 
        ? 'scale-0 opacity-0 blur-[60px] -translate-y-[30vh] rotate-[-10deg] skew-x-[15deg]' 
        : 'scale-100 opacity-100'
      } bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-[3rem] p-12 md:p-16 shadow-[0_0_120px_rgba(0,0,0,0.6)] overflow-hidden`}>
        <div className="absolute inset-0 border-[0.5px] border-white/20 rounded-[3rem] pointer-events-none" />
        
        <div className="flex justify-between items-start mb-12 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-4 bg-white/40 rounded-full" />
              <h2 className="text-2xl font-light tracking-[0.3em] text-white/90 uppercase">投放星尘</h2>
            </div>
            <p className="text-[9px] text-white/20 tracking-[0.5em] tech-font uppercase">Initialize_Consciousness_Transfer</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/30 hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!aiResponse ? (
          <div className="space-y-10">
            <textarea
              className="w-full h-64 bg-white/[0.03] border border-white/5 rounded-3xl p-8 text-lg text-white/80 placeholder-white/10 focus:outline-none focus:border-white/20 transition-all resize-none serif-font font-extralight leading-relaxed"
              placeholder="在此记录你的碎片..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex justify-end">
              <button 
                onClick={handleAnalyze}
                disabled={loading || !text.trim()}
                className="px-12 py-4 bg-white text-black rounded-full font-bold tracking-[0.2em] text-[11px] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all disabled:opacity-30 flex items-center gap-4 group"
              >
                {loading && <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
                <span className="uppercase tracking-widest">{loading ? 'Synthesizing' : 'INITIALIZE_LIFT'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="p-10 bg-white/[0.02] border border-white/10 rounded-[2.5rem] relative group/quote">
              <div className="absolute -top-4 -left-4 w-12 h-12 flex items-center justify-center text-4xl text-white/10 serif-font">“</div>
              <p className="text-xl serif-font font-light italic text-white/80 leading-relaxed relative z-10">
                {aiResponse.reply}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-white/[0.01] rounded-2xl border border-white/5">
                <p className="text-[8px] text-white/30 mb-2 uppercase tracking-widest tech-font">Sentiment_Map</p>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.SENTIMENT[aiResponse.sentiment as Sentiment] }} />
                  <p className="text-lg font-light text-white/80">{aiResponse.sentiment}</p>
                </div>
              </div>
              <div className="p-6 bg-white/[0.01] rounded-2xl border border-white/5">
                <p className="text-[8px] text-white/30 mb-2 uppercase tracking-widest tech-font">Resonance_Freq</p>
                <p className="text-lg font-light text-white/80 tech-font">{aiResponse.intensity}/10</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setAiResponse(null)}
                className="flex-1 py-4 rounded-full border border-white/10 text-white/40 hover:bg-white/5 transition-all text-[10px] tracking-widest uppercase"
              >
                Refine
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-[2] py-4 bg-white text-black rounded-full font-bold text-[11px] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all uppercase tracking-[0.2em]"
              >
                Commit_to_Constellation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputModal;
