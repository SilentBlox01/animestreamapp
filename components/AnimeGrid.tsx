import React, { useState, useMemo } from 'react';
import { Play, Star, Filter, Heart, Layers } from 'lucide-react';
import { Anime } from '../types';

interface AnimeGridProps {
  title: string;
  animes: Anime[];
  onSelect: (anime: Anime) => void;
  isLoading?: boolean;
  enableFilters?: boolean;
  onToggleFavorite?: (anime: Anime) => void;
  isFavorite?: (anime: Anime) => boolean;
}

const AnimeGrid: React.FC<AnimeGridProps> = ({ 
  title, 
  animes, 
  onSelect, 
  isLoading = false, 
  enableFilters = false,
  onToggleFavorite,
  isFavorite
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  // Extraer géneros únicos y ordenarlos
  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    animes.forEach(anime => {
      anime.genres?.forEach(g => genres.add(g.name));
    });
    return Array.from(genres).sort();
  }, [animes]);

  // Filtrar animes basado en el género seleccionado
  const displayedAnimes = useMemo(() => {
    if (selectedGenre === 'All') return animes;
    return animes.filter(anime => anime.genres?.some(g => g.name === selectedGenre));
  }, [selectedGenre, animes]);

  if (isLoading) {
    return (
      <div className="mb-16 animate-pulse">
        <div className="h-8 w-64 bg-white/5 rounded-lg mb-8"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5"></div>
          ))}
        </div>
      </div>
    );
  }

  if (animes.length === 0) return null;

  return (
    <div className="mb-12 md:mb-16">
      {/* Header con Título y Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6 border-b border-white/5 pb-6">
        <div>
           <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2 flex items-center gap-2">
             {title}
             {enableFilters && <span className="text-xs font-sans font-normal text-gray-500 bg-white/5 px-2 py-1 rounded-full">{displayedAnimes.length}</span>}
           </h2>
           <div className="w-16 h-1 bg-gradient-to-r from-anime-primary to-purple-600 rounded-full shadow-neon"></div>
        </div>
        
        {enableFilters && availableGenres.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide mask-linear max-w-full lg:max-w-2xl">
            <button
              onClick={() => setSelectedGenre('All')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 border backdrop-blur-sm ${
                selectedGenre === 'All' 
                  ? 'bg-anime-primary text-white border-anime-primary shadow-neon scale-105' 
                  : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers size={14} /> Todos
            </button>
            {availableGenres.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 border backdrop-blur-sm ${
                  selectedGenre === genre 
                    ? 'bg-white text-anime-dark border-white shadow-lg shadow-white/20 scale-105' 
                    : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid de Animes */}
      {displayedAnimes.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-[#151621]/50 rounded-3xl border border-dashed border-white/10 animate-fade-in">
          <div className="bg-white/5 p-4 rounded-full mb-4">
            <Filter size={32} className="opacity-40"/>
          </div>
          <p className="text-lg font-medium">No se encontraron animes de <span className="text-anime-primary font-bold">{selectedGenre}</span></p>
          <button 
            onClick={() => setSelectedGenre('All')} 
            className="mt-6 text-xs text-white bg-white/10 px-6 py-2 rounded-full hover:bg-white/20 transition-colors"
          >
            Ver todo el catálogo
          </button>
        </div>
      ) : (
        <div 
          key={selectedGenre} // Esto reinicia la animación al cambiar de filtro
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-8 animate-fade-in"
        >
          {displayedAnimes.map((anime, index) => (
            <div 
              key={anime.mal_id} 
              onClick={() => onSelect(anime)}
              className="group relative cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }} // Stagger effect
            >
              {/* Card Container */}
              <div className="relative aspect-[2/3] rounded-xl md:rounded-2xl overflow-hidden bg-[#151621] shadow-lg ring-1 ring-white/5 transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(255,61,113,0.3)] group-hover:ring-anime-primary/50 group-hover:-translate-y-2">
                
                {/* Image */}
                <img 
                  src={anime.images.jpg.large_image_url} 
                  alt={anime.title} 
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Dark Gradient Overlay (Always visible at bottom for readability, grows on hover) */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c15] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-anime-dark via-anime-dark/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4" />

                {/* Hover Content */}
                <div className="absolute inset-x-0 bottom-0 p-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75 z-10 flex flex-col gap-2">
                   {/* Play Button */}
                   <div className="flex items-center justify-between mb-1">
                      <div className="w-8 h-8 rounded-full bg-anime-primary text-white flex items-center justify-center shadow-neon">
                         <Play size={12} fill="currentColor" />
                      </div>
                      <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded backdrop-blur-md">
                        {anime.type || 'TV'}
                      </span>
                   </div>

                   <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 drop-shadow-md">
                     {anime.title}
                   </h3>
                   
                   <div className="flex items-center gap-2 text-[10px] font-medium text-gray-300">
                      <span className="text-green-400">{anime.year || 'N/A'}</span>
                      <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                      <span>{anime.episodes ? `${anime.episodes} Ep` : '? Ep'}</span>
                   </div>
                </div>

                {/* Score Badge (Top Right) - Visible Always */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10 flex items-center gap-1 text-[10px] font-bold text-white shadow-sm z-10 group-hover:opacity-0 transition-opacity duration-200">
                  <Star size={10} className="text-yellow-400" fill="currentColor" /> {anime.score || 'N/A'}
                </div>

                {/* Favorite Button (Top Left) */}
                {onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(anime);
                    }}
                    className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all duration-300 z-20 ${
                        isFavorite && isFavorite(anime)
                        ? 'bg-anime-primary text-white scale-100 opacity-100 shadow-neon'
                        : 'bg-black/40 text-gray-300 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 hover:bg-white hover:text-red-500 hover:border-white'
                    }`}
                  >
                    <Heart size={14} fill={isFavorite && isFavorite(anime) ? "currentColor" : "none"} />
                  </button>
                )}
              </div>
              
              {/* Title below card (Visible only when NOT hovering) */}
              <div className="mt-3 px-1 transition-opacity duration-300 group-hover:opacity-0">
                <h3 className="font-semibold text-gray-200 text-sm line-clamp-1 group-hover:text-anime-primary transition-colors">
                  {anime.title}
                </h3>
                <div className="flex items-center justify-between mt-1">
                   <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate max-w-[70%]">
                     {anime.genres?.[0]?.name}
                   </p>
                   {anime.score && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                         <Star size={8} fill="currentColor" className="text-yellow-500/50" /> {anime.score}
                      </div>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnimeGrid;