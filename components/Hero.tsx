import React from 'react';
import { Play, Info, Star, Calendar, Clock } from 'lucide-react';
import { Anime } from '../types';

interface HeroProps {
  featured: Anime;
  onWatch: (anime: Anime) => void;
  onInfo: (anime: Anime) => void;
}

const Hero: React.FC<HeroProps> = ({ featured, onWatch, onInfo }) => {
  if (!featured) return null;

  return (
    <div className="relative w-full h-[55vh] md:h-[65vh] min-h-[400px] md:min-h-[500px] rounded-2xl md:rounded-3xl overflow-hidden mb-8 md:mb-16 group shadow-2xl shadow-black/80 ring-1 ring-white/5">
      {/* Background Image with Parallax-like effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-linear group-hover:scale-110"
        style={{ backgroundImage: `url(${featured.images.jpg.large_image_url})` }}
      />
      
      {/* Cinematic Gradient Overlay - Cleaner visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c15] via-[#0b0c15]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c15] via-[#0b0c15]/80 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-6 md:p-16 w-full lg:w-2/3 flex flex-col gap-4 md:gap-6 animate-slide-up z-10">
        <div className="flex flex-wrap items-center gap-3">
            <span className="bg-anime-primary text-white px-3 py-1 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-neon">
                #1 Trending
            </span>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-md text-yellow-400 font-bold text-xs md:text-sm">
                <Star size={14} fill="currentColor" /> {featured.score}
            </div>
            <span className="text-gray-300 text-[10px] md:text-xs font-bold uppercase tracking-wider border border-white/10 px-3 py-1 rounded-md bg-black/20 backdrop-blur-sm">
                {featured.type}
            </span>
        </div>
        
        <h1 className="text-3xl md:text-5xl lg:text-7xl font-display font-bold text-white leading-[0.9] drop-shadow-lg tracking-tight line-clamp-2 md:line-clamp-none">
          {featured.title}
        </h1>
        
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-300 font-medium">
            <div className="flex items-center gap-2"><Calendar size={16} className="text-anime-primary"/> {featured.year}</div>
            <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
            <div className="flex items-center gap-2"><Clock size={16} className="text-anime-primary"/> {featured.episodes} Episodios</div>
            <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
            <div className="text-anime-primary font-bold">{featured.status}</div>
        </div>

        <p className="text-gray-300 line-clamp-3 text-sm md:text-base md:text-lg drop-shadow-md max-w-2xl font-light leading-relaxed opacity-90">
          {featured.synopsis}
        </p>

        <div className="flex items-center gap-3 mb-2 overflow-x-auto scrollbar-hide pb-1 mask-linear md:mask-none">
            {featured.genres.slice(0, 3).map(g => (
                <span key={g.name} className="text-xs text-gray-400 border border-white/10 px-3 py-1 rounded-full hover:bg-white/5 hover:text-white transition-colors cursor-default whitespace-nowrap">
                    {g.name}
                </span>
            ))}
        </div>

        <div className="flex items-center gap-4 mt-2">
          <button 
            onClick={() => onWatch(featured)}
            className="flex-1 md:flex-none flex justify-center items-center gap-3 bg-anime-primary text-white px-8 py-3 md:py-4 rounded-xl font-bold transition-all transform hover:scale-105 hover:shadow-neon tracking-wide uppercase text-xs md:text-sm group/btn"
          >
            <div className="bg-white text-anime-primary rounded-full p-1 group-hover/btn:rotate-12 transition-transform">
                <Play size={14} fill="currentColor" />
            </div>
            Ver Ahora
          </button>
          <button 
            onClick={() => onInfo(featured)}
            className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white px-8 py-3 md:py-4 rounded-xl font-bold transition-all border border-white/10 uppercase text-xs md:text-sm tracking-wide hover:border-white/30"
          >
            <Info size={18} />
            Detalles
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;