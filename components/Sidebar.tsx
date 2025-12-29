
import React from 'react';
import { ICONS } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'home', label: '星河', icon: ICONS.Home },
    { id: 'input', label: '投放', icon: ICONS.Plus },
    { id: 'notify', label: '消息', icon: ICONS.Bell },
  ];

  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-10 z-50">
      {/* Decorative vertical axis */}
      <div className="absolute left-1/2 -top-20 -bottom-20 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none" />
      <div className="absolute -left-4 top-0 tech-font text-[6px] text-white/10 rotate-90 origin-left tracking-[1em] uppercase">Sector_09_Alpha</div>

      {/* Main Glass Dock */}
      <div className="relative p-2 bg-black/40 border border-white/5 backdrop-blur-3xl rounded-full flex flex-col gap-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-700 hover:border-white/20">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 relative group/btn ${
              activeTab === item.id 
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]' 
                : 'text-white/30 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <item.icon className="w-5 h-5" />
            
            {/* Tooltip */}
            <div className="absolute left-20 px-4 py-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg opacity-0 group-hover/btn:opacity-100 translate-x-[-10px] group-hover/btn:translate-x-0 transition-all pointer-events-none whitespace-nowrap">
              <span className="text-[9px] tracking-[0.3em] font-light uppercase text-white/90">{item.label}</span>
            </div>
            
            {/* Decorative dot for active state */}
            {activeTab === item.id && (
              <div className="absolute -right-1 w-1 h-1 bg-white rounded-full animate-ping" />
            )}
          </button>
        ))}
      </div>
      
      {/* HUD Info bit */}
      <div className="flex flex-col items-center gap-2 opacity-20">
         <div className="w-1 h-1 bg-white rounded-full" />
         <div className="w-[1px] h-8 bg-white" />
      </div>
    </div>
  );
};

export default Sidebar;
