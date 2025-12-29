
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import StardustSphere from './components/StardustSphere';
import InputModal from './components/InputModal';
import { Fragment, Sentiment, FragmentType } from './types';
import { COLORS } from './constants';

const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[index]);
        setIndex(index + 1);
      }, 40);
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  return <p className="text-2xl md:text-3xl leading-relaxed text-white/95 serif-font font-light italic mb-12 px-4 drop-shadow-sm">{displayedText}</p>;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({ snr: 98.2, energy: 45.3 });

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    
    // Simulate telemetry jitter
    const interval = setInterval(() => {
      setStats({
        snr: 98 + Math.random() * 1.5,
        energy: 40 + Math.random() * 10
      });
    }, 2000);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const initialFragments: Fragment[] = [];
    const sentiments = [Sentiment.HAPPY, Sentiment.CALM, Sentiment.SAD, Sentiment.ANXIOUS, Sentiment.ANGRY];
    const baseRadius = 600;

    const config = [
      { type: FragmentType.DUST, count: 1800, rScale: 1.5 },   
      { type: FragmentType.SHARD, count: 600, rScale: 1.0 },   
      { type: FragmentType.BOKEH, count: 20, rScale: 2.0 }, 
      { type: FragmentType.STAR, count: 450, rScale: 0.85 }    
    ];

    config.forEach(cfg => {
      for (let i = 0; i < cfg.count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = baseRadius * cfg.rScale * (0.85 + Math.random() * 0.3);
        
        initialFragments.push({
          id: `${cfg.type}-${i}`,
          content: "", 
          sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
          type: cfg.type,
          intensity: Math.floor(Math.random() * 10) + 1,
          tags: ["#星尘", "#回响"],
          createdAt: Date.now(),
          isUser: false,
          position: [
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          ]
        });
      }
    });
    setFragments(initialFragments);
  }, []);

  const addFragment = (f: Fragment) => {
    setFragments(prev => [f, ...prev]);
    setIsInputOpen(false); 
    setActiveTab('home');
    setSelectedFragment(f);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#000002] relative text-white selection:bg-white/20">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => {
        if (tab === 'input') setIsInputOpen(true);
        else setActiveTab(tab);
      }} />

      {/* Decorative corners */}
      <div className="fixed top-0 left-0 w-32 h-32 border-t border-l border-white/5 pointer-events-none z-50" />
      <div className="fixed bottom-0 right-0 w-32 h-32 border-b border-r border-white/5 pointer-events-none z-50" />

      <main className="flex-1 relative overflow-hidden">
        {/* Advanced HUD Layer */}
        <div className="absolute top-10 left-36 right-12 flex justify-between items-start z-40 pointer-events-none">
           <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-8 duration-1000">
             <div className="flex items-center gap-4">
               <span className="text-[10px] font-bold tracking-[0.8em] tech-font text-white/60 uppercase">Ethereal_Orbit_V.2.5</span>
               <div className="flex gap-1">
                 {[...Array(4)].map((_, i) => <div key={i} className="w-1 h-1 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
               </div>
             </div>
             <div className="h-[1px] w-80 bg-gradient-to-r from-white/40 via-white/5 to-transparent" />
             <div className="flex gap-10 mt-3">
                <div className="max-w-[180px]">
                   <p className="text-[9px] serif-font italic text-white/40 leading-relaxed">“碎片是星河的语言，每一抹微光都是不曾熄灭的共鸣。”</p>
                </div>
                <div className="tech-font text-[8px] text-white/20 flex flex-col gap-1 border-l border-white/10 pl-4">
                   <div className="flex justify-between w-24"><span>LAT:</span> <span className="text-white/40">{((mousePos.y / window.innerHeight) * 180 - 90).toFixed(4)}</span></div>
                   <div className="flex justify-between w-24"><span>LNG:</span> <span className="text-white/40">{((mousePos.x / window.innerWidth) * 360 - 180).toFixed(4)}</span></div>
                   <div className="flex justify-between w-24"><span>SNR:</span> <span className="text-white/40">{stats.snr.toFixed(1)}%</span></div>
                </div>
             </div>
           </div>

           <div className="text-right animate-in fade-in slide-in-from-right-8 duration-1000 group">
              <div className="relative">
                <p className="text-5xl font-thin text-white/20 tech-font tracking-tighter leading-none group-hover:text-white/50 transition-all duration-700">
                  {fragments.length.toLocaleString()}
                </p>
                <div className="absolute -right-3 top-0 bottom-0 w-[1px] bg-white/10" />
              </div>
              <span className="text-[8px] text-white/10 uppercase tracking-[0.5em] mt-3 block">Galactic_Memory_Nodes</span>
           </div>
        </div>

        {/* Global UI Decoration (Bottom) */}
        <div className="absolute bottom-10 left-36 flex items-end gap-16 z-40 pointer-events-none">
          <div className="tech-font text-[8px] flex flex-col gap-3 opacity-30">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                <span>SYNC_STABLE</span>
              </div>
              <span>RES: 4K_ENHANCED</span>
            </div>
            <div className="w-64 h-[1px] bg-white/10 relative">
              <div className="absolute top-0 left-0 h-full bg-white/40 transition-all duration-1000" style={{ width: `${stats.energy}%` }} />
              <div className="absolute -top-1 left-0 text-[6px] tracking-widest uppercase">Flux_Capacity</div>
            </div>
          </div>
        </div>

        <StardustSphere 
          fragments={fragments} 
          onSelectFragment={setSelectedFragment} 
          selectedFragment={selectedFragment} 
        />

        {/* Cinematic Fragment Detail */}
        {selectedFragment && (
          <div 
            className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-700" 
            onClick={() => setSelectedFragment(null)}
          >
             <div 
               className="relative glass-panel rounded-[3rem] p-16 md:p-20 w-full max-w-2xl overflow-hidden shadow-[0_0_120px_rgba(0,0,0,1)] flex flex-col items-center border-white/10"
               onClick={e => e.stopPropagation()}
             >
               {/* Detail HUD Decoration */}
               <div className="absolute top-8 left-10 tech-font text-[7px] text-white/30 uppercase tracking-[0.4em]">Signal_Locked // ID_{selectedFragment.id}</div>
               <div className="absolute top-8 right-10 tech-font text-[7px] text-white/30 uppercase tracking-[0.4em]">Resonance_{selectedFragment.intensity}0%</div>
               <div className="absolute bottom-8 left-1/2 -translate-x-1/2 tech-font text-[6px] text-white/10 uppercase tracking-[1em]">Celestial_Observation_Log</div>
               
               <div className="scanline opacity-30" />
               
               <div className="relative z-10 text-center w-full">
                  <div className="flex justify-center mb-12">
                    <div 
                      className="px-8 py-2.5 rounded-full border text-[10px] tracking-[0.5em] uppercase flex items-center gap-4 transition-all duration-1000"
                      style={{ 
                        color: COLORS.SENTIMENT[selectedFragment.sentiment], 
                        borderColor: `${COLORS.SENTIMENT[selectedFragment.sentiment]}33`,
                        boxShadow: `0 0 20px ${COLORS.SENTIMENT[selectedFragment.sentiment]}11`
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: COLORS.SENTIMENT[selectedFragment.sentiment] }} />
                      {selectedFragment.sentiment} MODE
                    </div>
                  </div>
                  
                  <div className="min-h-[160px] flex items-center justify-center">
                    <TypewriterText text={selectedFragment.content || "一段情绪在这里沉淀，等待着跨越星系的理解。"} />
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-8 mt-6">
                    {selectedFragment.tags.map(tag => (
                      <span key={tag} className="text-[10px] tracking-[0.3em] uppercase tech-font text-white/40 border-b border-white/5 pb-1 hover:text-white/80 transition-colors cursor-default">{tag}</span>
                    ))}
                  </div>

                  <button 
                    onClick={() => setSelectedFragment(null)}
                    className="mt-16 px-12 py-3 rounded-full border border-white/10 text-[9px] tracking-[0.4em] text-white/40 uppercase hover:text-white/90 hover:bg-white/5 hover:border-white/20 transition-all duration-500"
                  >
                    CLOSE_PORTAL
                  </button>
               </div>
             </div>
          </div>
        )}
      </main>

      {isInputOpen && (
        <InputModal 
          onClose={() => setIsInputOpen(false)} 
          onSubmit={addFragment} 
        />
      )}
    </div>
  );
};

export default App;
