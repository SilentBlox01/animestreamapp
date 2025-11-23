import React, { useState, useMemo } from 'react';
import { Play, Star, Filter, X, Heart, Calendar } from 'lucide-react';
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

  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    animes.forEach(anime => {
      anime.genres?.forEach(g => genres.add(g.name));
    });
    return Array.from(genres).sort();
  }, [animes]);

  const displayedAnimes = selectedGenre === 'All' 
    ? animes 
    : animes.filter(anime => anime.genres?.some(g => g.name === selectedGenre));

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
    <div className="mb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-white/5 pb-4">
        <div>
           <h2 className="text-3xl font-display font-bold text-white mb-1">
             {title}
           </h2>
           <div className="w-12 h-1 bg-anime-primary rounded-full shadow-neon"></div>
        </div>
        
        {enableFilters && availableGenres.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide mask-linear">
            {['All', ...availableGenres].map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 border ${
                  selectedGenre === genre 
                    ? 'bg-anime-primary text-white border-anime-primary shadow-neon' 
                    : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                {genre === 'All' ? 'Todos' : genre}
              </button>
            ))}
          </div>
        )}
      </div>

      {displayedAnimes.length === 0 && selectedGenre !== 'All' ? (
        <div className="h-60 flex flex-col items-center justify-center text-gray-500 bg-[#151621] rounded-2xl border border-dashed border-white/10">
          <Filter size={40} className="mb-4 opacity-20"/>
          <p className="text-lg">No hay resultados para "{selectedGenre}"</p>
          <button onClick={() => setSelectedGenre('All')} className="text-anime-primary text-sm mt-4 font-bold hover:underline">Limpiar filtros</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-8">
          {displayedAnimes.map((anime) => (
            <div 
              key={anime.mal_id} 
              onClick={() => onSelect(anime)}
              className="group relative cursor-pointer"
            >
              {/* Card Image Container */}
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#151621] shadow-lg shadow-black/40 ring-1 ring-white/5 transition-all duration-500 group-hover:shadow-neon group-hover:ring-anime-primary/50 group-hover:-translate-y-2">
                <img 
                  src={anime.images.jpg.large_image_url} 
                  alt={anime.title} 
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c15] via-[#0b0c15]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-anime-primary text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">{anime.type || 'TV'}</span>
                            <span className="text-green-400 text-[10px] font-bold border border-green-400/30 px-2 py-0.5 rounded bg-green-400/10">{anime.status === 'Currently Airing' ? 'AIRING' : anime.year}</span>
                        </div>
                        <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 mb-2">{anime.title}</h3>
                        
                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                                <Star size={12} fill="currentColor"/> {anime.score}
                            </div>
                            <button className="bg-white text-black p-2 rounded-full hover:bg-anime-primary hover:text-white transition-colors">
                                <Play size={12} fill="currentColor" />
                            </button>
                        </div>
                    </div>

                </div>

                {/* Always visible Score Badge (Top Right) */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1 text-xs font-bold text-white group-hover:opacity-0 transition-opacity">
                  <Star size={10} className="text-yellow-400" fill="currentColor" /> {anime.score || 'N/A'}
                </div>
                
                {/* Heart/Favorite Button (Top Left) */}
                {onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(anime);
                    }}
                    className={`absolute top-2 left-2 p-2 rounded-full backdrop-blur-md transition-all duration-300 transform ${
                        isFavorite && isFavorite(anime)
                        ? 'bg-anime-primary text-white opacity-100'
                        : 'bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-white hover:text-red-500'
                    }`}
                  >
                    <Heart size={14} fill={isFavorite && isFavorite(anime) ? "currentColor" : "none"} />
                  </button>
                )}
              </div>
              
              {/* Title below card (Hidden on hover for cleaner look, or kept for mobile) */}
              <div className="mt-3 px-1 transition-opacity duration-300 group-hover:opacity-50">
                <h3 className="font-medium text-gray-200 text-sm line-clamp-1 group-hover:text-anime-primary transition-colors">
                  {anime.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                   {anime.genres?.[0]?.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnimeGrid;