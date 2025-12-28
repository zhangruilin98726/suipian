
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import StardustSphere from './components/StardustSphere';
import InputModal from './components/InputModal';
import { Fragment, Sentiment, FragmentType } from './types';
import { COLORS } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);
  const [isInputOpen, setIsInputOpen] = useState(false);

  useEffect(() => {
    const initialFragments: Fragment[] = [];
    const sentiments = [Sentiment.HAPPY, Sentiment.CALM, Sentiment.SAD, Sentiment.ANXIOUS, Sentiment.ANGRY];
    
    // 能量中心分布逻辑
    const clusters = [
      { center: [200, 100, 50], strength: 1.2 },
      { center: [-150, -200, 100], strength: 0.8 },
      { center: [50, -50, -300], strength: 1.0 },
    ];

    const config = [
      { type: FragmentType.DUST, count: 1200, rScale: 1.2 },   
      { type: FragmentType.SHARD, count: 400, rScale: 0.9 },   
      { type: FragmentType.BOKEH, count: 12, rScale: 1.6 }, 
      { type: FragmentType.STAR, count: 300, rScale: 0.75 }    
    ];
    
    const baseRadius = 550;

    config.forEach(cfg => {
      for (let i = 0; i < cfg.count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        
        const clusterIdx = Math.floor(Math.random() * (clusters.length + 2));
        let r = baseRadius * cfg.rScale;
        let finalPos: [number, number, number] = [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ];

        if (clusterIdx < clusters.length) {
          const c = clusters[clusterIdx];
          const blend = 0.3 + Math.random() * 0.5;
          finalPos[0] = finalPos[0] * (1 - blend) + c.center[0] * blend;
          finalPos[1] = finalPos[1] * (1 - blend) + c.center[1] * blend;
          finalPos[2] = finalPos[2] * (1 - blend) + c.center[2] * blend;
        }

        initialFragments.push({
          id: `${cfg.type}-${i}`,
          content: "", 
          sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
          type: cfg.type,
          intensity: Math.floor(Math.random() * 10) + 1,
          tags: ["#星尘", "#回响"],
          createdAt: Date.now(),
          isUser: false,
          position: finalPos
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
    <div className="h-screen w-screen overflow-hidden flex bg-black relative text-white selection:bg-white/10">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => {
        if (tab === 'input') setIsInputOpen(true);
        else setActiveTab(tab);
      }} />

      <main className="flex-1 relative overflow-hidden">
        {/* Poetic HUD */}
        <div className="absolute top-12 left-32 right-12 flex justify-between items-start z-40 pointer-events-none">
           <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-left-4 duration-1000">
             <span className="text-[9px] font-light tracking-[0.5em] tech-font text-white/40 uppercase">Ethereal_Orbit</span>
             <div className="h-[1px] w-24 bg-gradient-to-r from-white/20 to-transparent" />
             <p className="text-[10px] serif-font italic text-white/20 mt-2">万物在此交汇，又在共鸣中永恒。</p>
           </div>

           <div className="text-right animate-in fade-in slide-in-from-right-4 duration-1000">
              <p className="text-2xl font-thin text-white/10 tech-font tracking-widest leading-none">
                {fragments.length}
              </p>
              <span className="text-[7px] text-white/5 uppercase tracking-[0.3em]">Galactic_Nodes</span>
           </div>
        </div>

        <StardustSphere 
          fragments={fragments} 
          onSelectFragment={setSelectedFragment} 
          selectedFragment={selectedFragment} 
        />

        {/* 碎片详情 (浮窗) */}
        {selectedFragment && (
          <div 
            className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-500" 
            onClick={() => setSelectedFragment(null)}
          >
             <div 
               className="relative bg-white/[0.02] border border-white/10 backdrop-blur-3xl rounded-[3.5rem] p-16 md:p-24 w-full max-w-2xl overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.8)]"
               onClick={e => e.stopPropagation()}
             >
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
               
               <div className="relative z-10 text-center">
                  <div className="flex justify-center mb-12">
                    <div 
                      className="px-5 py-1.5 rounded-full border border-white/10 text-[9px] tracking-[0.4em] uppercase"
                      style={{ color: COLORS.SENTIMENT[selectedFragment.sentiment], borderColor: `${COLORS.SENTIMENT[selectedFragment.sentiment]}33` }}
                    >
                      {selectedFragment.sentiment} Resonance
                    </div>
                  </div>
                  
                  <p className="text-2xl md:text-3xl leading-relaxed text-white/90 serif-font font-light italic mb-12 px-4">
                    “{selectedFragment.content || "这抹微光，在深空寻找它的归属。"}”
                  </p>
                  
                  <div className="flex justify-center gap-8 opacity-40">
                    {selectedFragment.tags.map(tag => (
                      <span key={tag} className="text-[9px] tracking-[0.5em] uppercase tech-font">{tag}</span>
                    ))}
                  </div>

                  <button 
                    onClick={() => setSelectedFragment(null)}
                    className="mt-16 text-[8px] tracking-[0.6em] text-white/20 uppercase hover:text-white/60 transition-colors"
                  >
                    Close_Link
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
