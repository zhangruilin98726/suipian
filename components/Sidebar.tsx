
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
    <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-50 group">
      {/* Floating Glass Dock */}
      <div className="p-3 bg-white/[0.03] border border-white/10 backdrop-blur-2xl rounded-full flex flex-col gap-4 shadow-2xl transition-all duration-500 hover:bg-white/[0.05] hover:border-white/20">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 relative group/btn ${
              activeTab === item.id 
                ? 'bg-white text-black scale-110' 
                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <item.icon className="w-5 h-5" />
            
            {/* Tooltip */}
            <div className="absolute left-16 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-md opacity-0 group-hover/btn:opacity-100 translate-x-[-10px] group-hover/btn:translate-x-0 transition-all pointer-events-none whitespace-nowrap">
              <span className="text-[10px] tracking-[0.2em] font-light uppercase text-white/80">{item.label}</span>
            </div>
          </button>
        ))}
      </div>
      
      {/* User Avatar */}
      <button className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-2xl flex items-center justify-center overflow-hidden hover:border-white/30 transition-all group/avatar">
        <div className="w-1.5 h-1.5 bg-white/40 rounded-full group-hover/avatar:scale-150 transition-transform" />
      </button>
    </div>
  );
};

export default Sidebar;
