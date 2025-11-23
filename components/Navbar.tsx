import React, { useState } from 'react';
import { Search, Bell, User as UserIcon, Menu, LogOut, Settings, Zap, X } from 'lucide-react';
import { ViewState, User, Notification } from '../types';
import { sanitizeTextInput } from '../utils/security';

interface NavbarProps {
  onSearch: (query: string) => void;
  toggleSidebar: () => void;
  setViewState: (view: ViewState) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  notifications: Notification[];
  markNotificationsRead: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onSearch, 
  toggleSidebar, 
  setViewState, 
  user, 
  onOpenAuth,
  onLogout,
  notifications,
  markNotificationsRead
}) => {
  const [query, setQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeQuery = sanitizeTextInput(query, 80);
    if (safeQuery) {
      onSearch(safeQuery);
      setViewState(ViewState.SEARCH);
      setMobileSearchOpen(false);
    } else {
      setQuery('');
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      markNotificationsRead();
    }
    setShowUserMenu(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-20 z-50 flex items-center px-4 md:px-6 justify-between transition-all duration-300 bg-[#0b0c15]/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20">
      
      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="absolute inset-0 bg-[#0b0c15] z-50 flex items-center px-4 animate-fade-in">
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-3">
             <Search size={20} className="text-anime-primary" />
             <input 
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar anime..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 h-full py-4"
             />
             <button type="button" onClick={() => setMobileSearchOpen(false)} className="p-2 text-gray-400">
                <X size={20} />
             </button>
          </form>
        </div>
      )}

      <div className="flex items-center gap-4 md:gap-6">
        <button onClick={toggleSidebar} className="p-2 -ml-2 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors">
          <Menu size={24} />
        </button>
        <div 
          onClick={() => setViewState(ViewState.HOME)}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-anime-primary to-purple-600 rounded-xl flex items-center justify-center shadow-neon transform group-hover:scale-105 transition-all duration-300 relative overflow-hidden">
             <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-12 group-hover:translate-x-12 transition-transform duration-700"></div>
             <Zap size={20} className="text-white relative z-10 fill-white md:w-6 md:h-6" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xl md:text-2xl font-display font-bold text-white leading-none tracking-wide group-hover:text-anime-primary transition-colors hidden sm:block">AniStream</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="hidden md:flex flex-1 max-w-lg mx-12 relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-500 group-focus-within:text-anime-primary transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar anime..."
          className="w-full bg-[#151621] border border-white/5 rounded-full py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-anime-primary/50 focus:bg-[#1a1b26] focus:shadow-neon-blue transition-all text-white placeholder-gray-600"
        />
      </form>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile Search Toggle */}
        <button 
          onClick={() => setMobileSearchOpen(true)}
          className="md:hidden p-2 text-gray-400 hover:text-white"
        >
           <Search size={20} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={handleNotificationClick}
            className={`p-2 md:p-3 rounded-full transition-all duration-300 ${showNotifications ? 'bg-white/10 text-white shadow-neon-blue' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-anime-primary rounded-full shadow-[0_0_8px_rgba(255,61,113,0.8)] animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-4 w-80 md:w-96 bg-[#151621]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass overflow-hidden animate-fade-in origin-top-right ring-1 ring-white/5 z-50">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="font-bold text-white font-display tracking-wide">Notificaciones</h3>
                {unreadCount > 0 && <span className="text-[10px] bg-anime-primary/20 text-anime-primary px-2 py-1 rounded-full border border-anime-primary/20">{unreadCount} nuevas</span>}
              </div>
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div key={notif.id} className="p-4 hover:bg-white/5 border-b border-white/5 last:border-0 flex gap-4 transition-colors cursor-pointer group">
                      {notif.image && <img src={notif.image} className="w-12 h-12 rounded-lg object-cover shadow-md group-hover:scale-105 transition-transform" alt="" />}
                      <div className="flex-1">
                        <p className="text-sm text-gray-100 font-semibold line-clamp-1 group-hover:text-anime-primary transition-colors">{notif.title}</p>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">{notif.message}</p>
                        <span className="text-[10px] text-gray-600 mt-2 block font-medium uppercase tracking-wider">{notif.time}</span>
                      </div>
                      {!notif.read && <div className="w-2 h-2 bg-anime-primary rounded-full mt-2 self-start shadow-neon"></div>}
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-500 text-sm flex flex-col items-center gap-3">
                    <Bell size={32} className="opacity-20" />
                    <span>Sin novedades por ahora</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        {user ? (
          <div className="relative">
            <button 
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className={`flex items-center gap-3 p-1 pr-1 md:pr-4 rounded-full transition-all border ${showUserMenu ? 'bg-white/10 border-white/10' : 'border-transparent hover:bg-white/5 hover:border-white/5'}`}
            >
              <img src={user.avatar} alt={user.name} className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border-2 border-anime-primary shadow-sm" />
              <span className="text-sm font-bold text-white hidden md:block">{user.name}</span>
            </button>

            {showUserMenu && (
              <div className="absolute top-full right-0 mt-4 w-64 bg-[#151621]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass overflow-hidden animate-fade-in origin-top-right ring-1 ring-white/5 z-50">
                <div className="p-6 border-b border-white/5 bg-gradient-to-br from-anime-primary/20 to-transparent relative overflow-hidden">
                   <div className="relative z-10">
                      <p className="font-bold text-white text-lg">{user.name}</p>
                      <p className="text-xs text-gray-300 mt-1">{user.email}</p>
                   </div>
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-anime-primary/20 rounded-full blur-2xl"></div>
                </div>
                <div className="p-2 space-y-1">
                  <button className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors flex items-center gap-3">
                    <Settings size={16} /> Configuración
                  </button>
                  <div className="h-px bg-white/5 my-1 mx-2"></div>
                  <button 
                    onClick={onLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors flex items-center gap-3 font-medium"
                  >
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={onOpenAuth}
            className="group relative px-4 md:px-6 py-2 md:py-2.5 rounded-full overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <div className="absolute inset-0 bg-anime-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div className="relative flex items-center gap-2 text-white font-bold text-sm">
                <UserIcon size={16} />
                <span className="hidden sm:inline">Acceder</span>
            </div>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;