
import React, { useState } from 'react';
import { analyzeFragment } from '../services/geminiService';
import { COLORS } from '../constants';
import { Fragment, Sentiment, FragmentType } from '../types';

interface InputModalProps {
  onClose: () => void;
  onSubmit: (f: Fragment) => void;
}

const InputModal: React.FC<InputModalProps> = ({ onClose, onSubmit }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const analysis = await analyzeFragment(text);
    setAiResponse(analysis);
    setLoading(false);
  };

  const handleConfirm = () => {
    if (!aiResponse) return;

    const r = (150 + Math.random() * 450);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    const position: [number, number, number] = [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    ];

    const newFragment: Fragment = {
      id: Math.random().toString(36).substr(2, 9),
      content: text,
      sentiment: aiResponse.sentiment,
      type: FragmentType.STAR, // User fragments are always high-resonance stars
      intensity: aiResponse.intensity,
      tags: aiResponse.tags,
      createdAt: Date.now(),
      isUser: true,
      position: position
    };

    onSubmit(newFragment);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white/[0.02] border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-12 md:p-16 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Subtle Highlight Border */}
        <div className="absolute inset-0 border-[0.5px] border-white/20 rounded-[2.5rem] pointer-events-none" />
        
        {/* HUD Elements */}
        <div className="absolute top-8 right-12 tech-font text-[8px] text-white/20 tracking-widest uppercase pointer-events-none">
          Transmitting_Link...
        </div>
        <div className="absolute bottom-12 left-0 w-16 h-[1px] bg-white/10" />

        <div className="flex justify-between items-start mb-12 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-4 bg-white/40 rounded-full" />
              <h2 className="text-2xl font-light tracking-[0.3em] text-white/90 uppercase">投放星尘</h2>
            </div>
            <p className="text-[9px] text-white/20 tech-font uppercase tracking-widest">Syncing with galactic resonance...</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-white/30 hover:text-white hover:rotate-90 transition-all duration-500"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!aiResponse ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative">
              <textarea
                className="w-full h-64 bg-white/[0.03] border border-white/5 rounded-3xl p-8 text-lg text-white/80 placeholder-white/10 focus:outline-none focus:border-white/20 transition-all resize-none serif-font font-extralight leading-relaxed"
                placeholder="在此记录你的情绪，它将化作一颗永恒的星..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="absolute bottom-6 right-8 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={handleAnalyze}
                disabled={loading || !text.trim()}
                className="px-12 py-4 bg-white text-black rounded-full font-bold tracking-[0.2em] text-[11px] hover:bg-blue-100 transition-all disabled:opacity-10 flex items-center gap-4 group"
              >
                {loading && <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
                <span className="uppercase">{loading ? 'Processing' : 'INITIALIZE_LIFT'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="p-10 bg-white/[0.02] border border-white/10 rounded-[2.5rem]">
              <p className="text-xl serif-font font-light italic text-white/70 leading-relaxed">
                “{aiResponse.reply}”
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-white/[0.01] rounded-2xl border border-white/5">
                <p className="text-[8px] text-white/30 mb-3 uppercase tracking-widest tech-font">Sentiment_Type</p>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ backgroundColor: COLORS.SENTIMENT[aiResponse.sentiment as Sentiment] }} />
                  <p className="text-lg font-light text-white/80 tracking-widest">{aiResponse.sentiment}</p>
                </div>
              </div>
              
              <div className="p-6 bg-white/[0.01] rounded-2xl border border-white/5">
                <p className="text-[8px] text-white/30 mb-3 uppercase tracking-widest tech-font">Resonance_Power</p>
                <div className="flex items-center gap-4">
                   <div className="h-[1px] flex-1 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-white/60" style={{ width: `${aiResponse.intensity * 10}%` }} />
                   </div>
                   <span className="text-lg font-light text-white/80 tech-font">{aiResponse.intensity}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setAiResponse(null)}
                className="flex-1 py-4 rounded-full border border-white/10 text-white/40 hover:bg-white/5 transition-all text-[10px] tracking-widest uppercase"
              >
                Re-Code
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-[2] py-4 bg-white text-black rounded-full font-bold text-[11px] hover:bg-blue-100 transition-all uppercase tracking-[0.2em]"
              >
                Commit_to_Galaxy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputModal;