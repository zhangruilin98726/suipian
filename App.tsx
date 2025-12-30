
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import StardustSphere from './components/StardustSphere';
import InputModal from './components/InputModal';
import { Fragment, Sentiment, FragmentType } from './types';
import { COLORS, GALAXY_CONFIG } from './constants';

const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 40 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => { setDisplayedText(''); setIndex(0); }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[index]);
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  return <p className="text-2xl md:text-3xl leading-relaxed text-white/95 serif-font font-light italic mb-12 px-4 drop-shadow-sm">{displayedText}</p>;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [activeGalaxyIndex, setActiveGalaxyIndex] = useState(0);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);
  const [isInputOpen, setIsInputOpen] = useState(false);
  
  // 序列状态管理
  const [newStarId, setNewStarId] = useState<string | null>(null);
  const [isSequenceActive, setIsSequenceActive] = useState(false);
  const [journeyReply, setJourneyReply] = useState<string | null>(null);

  useEffect(() => {
    const initialFragments: Fragment[] = [];
    const sentiments = [Sentiment.HAPPY, Sentiment.CALM, Sentiment.SAD, Sentiment.ANXIOUS, Sentiment.ANGRY, Sentiment.REMEMBERING, Sentiment.AWAKENING];
    
    const fragmentConfigs = [
      { type: FragmentType.DUST, countPerGalaxy: 220, rBase: 1300 },   
      { type: FragmentType.SHARD, countPerGalaxy: 70, rBase: 950 },   
      { type: FragmentType.BOKEH, countPerGalaxy: 4, rBase: 2600 }, 
      { type: FragmentType.STAR, countPerGalaxy: 55, rBase: 850 }    
    ];

    GALAXY_CONFIG.forEach((galaxy, gIdx) => {
      fragmentConfigs.forEach(cfg => {
        for (let i = 0; i < cfg.countPerGalaxy; i++) {
          const u = Math.random(), v = Math.random();
          const theta = 2 * Math.PI * u;
          const phi = Math.acos(2 * v - 1);
          const r = cfg.rBase * (0.45 + Math.random() * 2.3); 
          initialFragments.push({
            id: `g${gIdx}-${cfg.type}-${i}`,
            content: "", 
            sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
            type: cfg.type,
            intensity: Math.floor(Math.random() * 10) + 1,
            tags: ["#星尘", "#共鸣"],
            createdAt: Date.now(),
            isUser: false,
            galaxyIndex: gIdx,
            position: [
              r * Math.sin(phi) * Math.cos(theta), 
              r * Math.sin(phi) * Math.sin(theta) * 0.75, 
              r * Math.cos(phi)
            ]
          });
        }
      });
    });
    setFragments(initialFragments);
  }, []);

  const handleAddFragment = (f: Fragment, reply: string) => {
    setFragments(prev => [f, ...prev]);
    setIsSequenceActive(true);
    setNewStarId(f.id);
    setJourneyReply(reply);
    
    // UI状态平滑切换
    setTimeout(() => {
      setIsInputOpen(false);
      setActiveTab('home');
      setActiveGalaxyIndex(f.galaxyIndex);
    }, 600); 

    // 穿梭结束清理时间从 8.8s 缩短至 7.5s (与 StardustSphere p4End 同步)
    setTimeout(() => {
      setIsSequenceActive(false);
      setNewStarId(null);
      setJourneyReply(null);
    }, 7500); 
  };

  const activeGalaxy = GALAXY_CONFIG[activeGalaxyIndex];

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#000000] relative text-white selection:bg-white/25">
      {/* HUD Background Darkness Overlay during sequence */}
      <div className={`fixed inset-0 z-10 bg-black/40 pointer-events-none transition-opacity duration-[2000ms] ${isSequenceActive ? 'opacity-100' : 'opacity-0'}`} />

      <Sidebar activeTab={activeTab} setActiveTab={(tab) => {
        if (isSequenceActive) return; 
        if (tab === 'input') setIsInputOpen(true);
        else {
          setActiveTab(tab);
          if (tab === 'home') setActiveGalaxyIndex(0);
        }
      }} />

      <main className="flex-1 relative overflow-hidden">
        {/* Galaxy Selector UI */}
        <div className={`fixed bottom-12 right-12 z-[50] flex flex-col gap-4 transition-all duration-[1200ms] cubic-bezier(0.19, 1, 0.22, 1) ${isSequenceActive || isInputOpen ? 'opacity-0 translate-y-24 blur-md' : 'opacity-100 translate-y-0'}`}>
          <div className="flex gap-2.5 p-1.5 bg-black/40 border border-white/5 backdrop-blur-3xl rounded-full">
            {GALAXY_CONFIG.map((g, idx) => (
              <button
                key={g.id}
                onClick={() => setActiveGalaxyIndex(idx)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeGalaxyIndex === idx ? 'bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
              >
                <span className="tech-font text-[10px]">{idx + 1}</span>
              </button>
            ))}
          </div>
        </div>

        {/* HUD UI - Sector Info */}
        <div className={`absolute top-10 left-36 right-12 flex justify-between items-start z-40 pointer-events-none transition-all duration-[1500ms] cubic-bezier(0.19, 1, 0.22, 1) ${isSequenceActive || isInputOpen ? 'opacity-0 -translate-y-12 blur-sm' : 'opacity-100 translate-y-0'}`}>
           <div className="flex flex-col gap-2">
             <div className="flex items-center gap-4">
               <span className="text-[10px] font-bold tracking-[0.8em] tech-font text-white/50 uppercase">Unified_Nebula_Field</span>
             </div>
             <div className="h-[1px] w-96 bg-gradient-to-r from-white/30 via-white/5 to-transparent" />
             <div className="mt-4">
                <p className="text-[11px] font-bold tracking-[0.4em] text-white/80 uppercase tech-font">Current_Sector: <span className="text-white ml-2">{activeGalaxy.name}</span></p>
                <p className="text-[9px] text-white/30 tracking-[0.2em] mt-1 italic serif-font">{activeGalaxy.subtitle}</p>
             </div>
           </div>
           
           <div className="text-right">
              <div className="tech-font text-[8px] text-white/20 uppercase tracking-[0.5em] mb-1">Status_Online</div>
              <div className="text-[10px] tech-font text-white/40 tracking-widest">G_ID_{activeGalaxy.id.toString().padStart(3, '0')}</div>
           </div>
        </div>

        {/* Journey Text Ghosting Layer (HUD 效果) */}
        <div className={`absolute inset-0 z-30 pointer-events-none flex items-center justify-center px-12 transition-all duration-1000 ${isSequenceActive && journeyReply ? 'opacity-100' : 'opacity-0 blur-xl scale-125'}`}>
          {journeyReply && (
            <div className="max-w-2xl text-center">
               <p className="text-[8px] tech-font text-white/20 uppercase tracking-[1em] mb-10 animate-pulse">Analyzing_Resonance_Signature</p>
               <p className="text-3xl md:text-4xl serif-font font-light italic text-white/60 leading-relaxed drop-shadow-2xl">
                 “ {journeyReply} ”
               </p>
            </div>
          )}
        </div>

        <StardustSphere 
          fragments={fragments} 
          onSelectFragment={setSelectedFragment} 
          selectedFragment={selectedFragment} 
          activeGalaxyIndex={activeGalaxyIndex}
          newStarId={newStarId}
        />

        {/* Selection View Modal */}
        {selectedFragment && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md" onClick={() => setSelectedFragment(null)}>
             <div className="relative glass-panel rounded-[3.5rem] p-16 md:p-24 w-full max-w-3xl overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.9)] flex flex-col items-center border-white/10 animate-in zoom-in-95 fade-in duration-700" onClick={e => e.stopPropagation()}>
               <div className="absolute top-10 left-12 tech-font text-[7px] text-white/30 uppercase tracking-[0.6em]">Origin_Point_{GALAXY_CONFIG[selectedFragment.galaxyIndex].name}</div>
               <div className="relative z-10 text-center w-full">
                  <div className="flex justify-center mb-16">
                    <div className="px-10 py-2.5 rounded-full border text-[10px] tracking-[0.4em] uppercase flex items-center gap-4 bg-white/[0.03]" style={{ color: COLORS.SENTIMENT[selectedFragment.sentiment], borderColor: `${COLORS.SENTIMENT[selectedFragment.sentiment]}55` }}>
                      <div className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: COLORS.SENTIMENT[selectedFragment.sentiment] }} />
                      {selectedFragment.sentiment} RESONANCE
                    </div>
                  </div>
                  <TypewriterText text={selectedFragment.content || "这颗星辰静默无声，但它曾承载过一段不为人知的宇宙涟漪。"} />
                  <button onClick={() => setSelectedFragment(null)} className="mt-20 px-14 py-4 rounded-full border border-white/10 text-[9px] tracking-[0.5em] text-white/30 uppercase hover:text-white/80 hover:bg-white/5 hover:border-white/20 transition-all">RETURN_TO_ORBIT</button>
               </div>
             </div>
          </div>
        )}
      </main>

      {isInputOpen && (
        <InputModal onClose={() => setIsInputOpen(false)} onSubmit={handleAddFragment} activeGalaxyIndex={activeGalaxyIndex} />
      )}
    </div>
  );
};

export default App;
