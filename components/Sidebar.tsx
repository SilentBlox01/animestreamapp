import React from 'react';
import { Home, Flame, Clock, Bookmark, Tv, Settings } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  isOpen: boolean;
  activeView: ViewState;
  setViewState: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeView, setViewState }) => {
  const menuItems = [
    { icon: <Home size={22} />, label: 'Inicio', view: ViewState.HOME },
    { icon: <Flame size={22} />, label: 'Tendencias', view: ViewState.TRENDING },
    { icon: <Tv size={22} />, label: 'Emisión', view: ViewState.AIRING },
    { icon: <Clock size={22} />, label: 'Historial', view: ViewState.HISTORY },
    { icon: <Bookmark size={22} />, label: 'Favoritos', view: ViewState.FAVORITES },
  ];

  return (
    <aside 
      className={`fixed left-0 md:top-20 top-0 bottom-0 bg-[#0b0c15] border-r border-white/5 transition-transform duration-300 ease-in-out z-40 flex flex-col justify-between py-6 overflow-y-auto scrollbar-thin 
        ${isOpen ? 'translate-x-0 w-64 shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0 md:w-20'}
      `}
    >
       {/* Mobile Header in Sidebar */}
       <div className="md:hidden px-6 pb-6 pt-2 flex items-center gap-3 border-b border-white/5 mb-2">
           <div className="w-8 h-8 bg-gradient-to-br from-anime-primary to-purple-600 rounded-lg flex items-center justify-center shadow-neon">
             <span className="font-bold text-white text-xs">AS</span>
           </div>
           <span className="text-xl font-display font-bold text-white tracking-wide">AniStream</span>
       </div>

      <div className="flex flex-col gap-2 px-3">
        {menuItems.map((item, index) => {
           const isActive = item.view === activeView;
           return (
            <button
              key={index}
              onClick={() => item.view && setViewState(item.view)}
              className={`group flex items-center px-3 py-3.5 gap-4 rounded-xl transition-all duration-300 relative overflow-hidden ${
                isActive 
                  ? 'text-white shadow-neon bg-gradient-to-r from-anime-primary/20 to-transparent' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-anime-primary rounded-r-full shadow-[0_0_10px_#ff3d71]"></div>
              )}
              
              <span className={`min-w-[24px] flex justify-center transition-transform duration-300 ${isActive ? 'scale-110 text-anime-primary' : 'group-hover:scale-110'}`}>
                  {item.icon}
              </span>
              
              <span className={`whitespace-nowrap font-medium tracking-wide transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'md:opacity-0 md:-translate-x-4 md:hidden block opacity-100'}`}>
                {item.label}
              </span>
            </button>
           );
        })}
      </div>

      <div className="flex flex-col gap-2 px-3 mt-auto">
        <button 
          onClick={() => setViewState(ViewState.SETTINGS)}
          className={`flex items-center gap-4 px-3 py-3.5 rounded-xl transition-colors ${
            activeView === ViewState.SETTINGS
            ? 'text-anime-primary bg-anime-primary/10 border border-anime-primary/20'
            : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="min-w-[24px] flex justify-center"><Settings size={22} /></span>
          <span className={`font-medium ${isOpen ? 'block' : 'md:hidden'}`}>Ajustes</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;