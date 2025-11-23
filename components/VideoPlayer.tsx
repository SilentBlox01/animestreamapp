
import React, { useState, useEffect } from 'react';
import { Play, SkipForward, ArrowLeft, ExternalLink, Server as ServerIcon, Info, AlertTriangle, MonitorPlay, Loader2, Globe, Youtube } from 'lucide-react';
import { Anime, Server, Episode } from '../types';

interface VideoPlayerProps {
  anime: Anime;
  onBack: () => void;
  initialEpisode?: number;
  onEpisodeComplete?: (episodeNumber: number) => void;
}

// Updated Server List - prioritizing working content
const SERVERS: Server[] = [
  { id: 'yt', name: 'Smart Search (YT)', url: '', quality: 'HD', lang: 'Varios', icon: 'YT' },
  { id: 'trailer', name: 'Trailer / Clip', url: '', quality: 'FHD', lang: 'Japonés', icon: 'TR' },
  { id: 'demo', name: 'Servidor Demo', url: '', quality: '1080p', lang: 'Latino', icon: 'DM' },
  { id: 'crunchy', name: 'Crunchyroll', url: '', quality: 'FHD', lang: 'Oficial', icon: 'CR' },
  { id: 'animeflv', name: 'AnimeFLV (Web)', url: '', quality: 'HD', lang: 'Sub Esp', icon: 'FLV' },
];

const getAnimeSlug = (title: string) => {
  return title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ anime, onBack, initialEpisode = 1, onEpisodeComplete }) => {
  const [activeServer, setActiveServer] = useState<Server>(SERVERS[0]); 
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [iframeError, setIframeError] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState('');

  // Generate episodes list
  const episodes: Episode[] = Array.from({ length: anime.episodes || 12 }, (_, i) => ({
    id: `ep-${i+1}`,
    number: i + 1,
    title: `Episodio ${i + 1}`,
    thumbnail: anime.images.jpg.large_image_url
  }));

  useEffect(() => {
    const loadVideoSource = async () => {
        setIframeError(false);
        setStreamError('');
        setVideoUrl('');
        setIsLoadingStream(true);

        // Simulate network delay for realism
        await new Promise(r => setTimeout(r, 500));

        try {
            switch (activeServer.id) {
                case 'yt':
                    // Smart YouTube Search for the episode
                    // Uses 'embed?listType=search' to auto-play the most relevant result
                    const query = `${anime.title} episode ${currentEpisode} anime full`;
                    setVideoUrl(`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`);
                    break;

                case 'trailer':
                    if (anime.trailer?.embed_url) {
                         // Fix autoplay in some trailer URLs
                         setVideoUrl(anime.trailer.embed_url.replace('autoplay=1', 'autoplay=0'));
                    } else {
                        // Fallback if no trailer
                        setStreamError('Este anime no tiene trailer oficial disponible.');
                    }
                    break;

                case 'demo':
                    // High quality reliable video to demonstrate player capabilities
                    // Using "Sintel" - a common open movie that looks like CGI anime
                    setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4');
                    break;

                case 'crunchy':
                    setVideoUrl(`https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.title)}`);
                    setStreamError('Abrir en Crunchyroll para ver legalmente.');
                    break;

                case 'animeflv':
                    const slug = getAnimeSlug(anime.title);
                    setVideoUrl(`https://www3.animeflv.net/ver/${slug}-${currentEpisode}`);
                    setStreamError('Abrir en AnimeFLV (requiere pestaña externa).');
                    break;

                default:
                    setVideoUrl('');
            }
        } catch (err) {
            console.error("Error setting video:", err);
            setIframeError(true);
        } finally {
            setIsLoadingStream(false);
        }
    };

    loadVideoSource();
  }, [activeServer, currentEpisode, anime]);

  const handleNextEpisode = () => {
    if (currentEpisode < (anime.episodes || 24)) {
      const nextEp = currentEpisode + 1;
      setCurrentEpisode(nextEp);
      if (onEpisodeComplete) onEpisodeComplete(nextEp);
    }
  };

  const handleExternalOpen = () => {
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`flex flex-col gap-6 animate-fade-in relative z-20 ${theaterMode ? 'lg:flex-col' : 'lg:flex-row'}`}>
      
      {/* Backdrop for Theater Mode */}
      {theaterMode && (
        <div className="fixed inset-0 bg-[#0b0c15]/98 z-[-1] transition-opacity duration-500 backdrop-blur-sm"></div>
      )}

      {/* Main Player Area */}
      <div className={`flex-1 transition-all duration-500 ${theaterMode ? 'max-w-7xl mx-auto w-full' : ''}`}>
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="hover:bg-white/10 p-2 rounded-full transition-colors text-white group">
              <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white font-display tracking-wide">{anime.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                 <span className="bg-anime-primary px-2 py-0.5 rounded text-[10px] text-white font-bold uppercase tracking-wider shadow-neon">Episodio {currentEpisode}</span> 
                 <span className="text-xs text-gray-400">Server {activeServer.name}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setTheaterMode(!theaterMode)}
            className={`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${theaterMode ? 'bg-anime-primary text-white shadow-neon' : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'}`}
          >
            <MonitorPlay size={18} />
            <span className="hidden md:block">{theaterMode ? 'Modo Cine' : 'Modo Cine'}</span>
          </button>
        </div>

        {/* Server Tabs */}
        <div className="bg-[#151621] rounded-t-2xl flex overflow-x-auto scrollbar-hide border-b border-white/5 mx-2 md:mx-0">
            {SERVERS.map(server => (
                <button
                    key={server.id}
                    onClick={() => setActiveServer(server)}
                    className={`px-6 py-4 text-sm font-bold flex items-center gap-3 transition-all whitespace-nowrap relative ${
                        activeServer.id === server.id 
                        ? 'text-white bg-[#1a1b26]' 
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                >
                    {activeServer.id === server.id && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-anime-primary shadow-[0_-2px_10px_rgba(255,61,113,0.5)]"></span>
                    )}
                    <span className={`w-8 h-6 rounded flex items-center justify-center text-[10px] font-black uppercase ${activeServer.id === server.id ? 'bg-anime-primary text-white shadow-neon' : 'bg-gray-800 text-gray-400'}`}>
                        {server.icon}
                    </span>
                    {server.name}
                </button>
            ))}
        </div>

        {/* Video Container */}
        <div className="relative aspect-video bg-black shadow-2xl rounded-b-2xl overflow-hidden group select-none ring-1 ring-white/5 mx-2 md:mx-0">
             
             {/* Loading State */}
             {isLoadingStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
                    <Loader2 size={48} className="text-anime-primary animate-spin mb-4" />
                    <p className="text-white font-bold animate-pulse">Conectando a {activeServer.name}...</p>
                </div>
             )}

             {/* Error/Web Fallback State */}
             {(iframeError || streamError) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#151621] z-10 p-8 text-center">
                    <AlertTriangle size={48} className="text-yellow-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                        {streamError || "Reproducción restringida"}
                    </h3>
                    <p className="text-gray-400 text-sm max-w-md mb-6 leading-relaxed">
                        El servidor seleccionado ({activeServer.name}) requiere abrir el contenido en una nueva ventana por temas de derechos de autor.
                    </p>
                    <button 
                        onClick={handleExternalOpen}
                        className="bg-anime-primary hover:bg-pink-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-neon"
                    >
                        <ExternalLink size={20} />
                        Abrir Reproductor Externo
                    </button>
                </div>
             )}

             <div className="w-full h-full bg-black relative animate-fade-in">
                {!isLoadingStream && !iframeError && !streamError && videoUrl && (
                    activeServer.id === 'demo' ? (
                         <video 
                            controls 
                            autoPlay 
                            className="w-full h-full object-contain"
                            src={videoUrl}
                         >
                            Tu navegador no soporta video HTML5.
                         </video>
                    ) : (
                        <iframe 
                            key={videoUrl} 
                            src={videoUrl} 
                            title={`${anime.title} - Episode ${currentEpisode}`}
                            className="w-full h-full" 
                            frameBorder="0"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            onError={() => setIframeError(true)}
                        ></iframe>
                    )
                )}
             </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 px-2 md:px-0">
             <div className="flex items-center gap-4">
                 <button 
                   onClick={handleNextEpisode}
                   disabled={currentEpisode >= (anime.episodes || 24)}
                   className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 border border-white/5"
                 >
                    <SkipForward size={18} /> Siguiente
                 </button>
                 
                 <button 
                   onClick={handleExternalOpen}
                   className="flex items-center gap-2 px-4 py-3 text-anime-primary hover:bg-anime-primary/10 rounded-xl text-sm font-bold transition-colors border border-anime-primary/20"
                 >
                    <Globe size={18} /> Fuente Original
                 </button>
             </div>
             
             <div className="flex items-center gap-2 text-xs text-gray-500">
                <ServerIcon size={14} /> Fuente: {activeServer.name}
             </div>
        </div>

        {/* Info Box */}
        {activeServer.id === 'yt' && (
             <div className="mt-6 mx-2 md:mx-0 p-4 bg-red-500/10 rounded-xl border border-red-500/10 flex gap-4 items-start">
                <Youtube size={20} className="text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs md:text-sm text-gray-400 leading-relaxed">
                    <p className="font-bold text-gray-200 mb-1">Smart Search YouTube:</p>
                    Este modo busca automáticamente el episodio en YouTube. Si no encuentras el capítulo completo, prueba el <strong>Servidor Demo</strong> para probar el player o <strong>Crunchyroll</strong> para la versión oficial.
                </div>
            </div>
        )}
      </div>

      {/* Episodes Sidebar */}
      <div className={`w-full transition-all duration-300 ${theaterMode ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'lg:w-[400px] flex flex-col h-[600px] lg:h-auto lg:max-h-[800px]'}`}>
         <div className={`bg-[#151621] rounded-2xl border border-white/5 flex flex-col overflow-hidden shadow-lg ${theaterMode ? 'col-span-full h-80' : 'h-full'}`}>
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#1a1b26]">
                <h3 className="font-bold text-white font-display text-lg tracking-wide">Episodios</h3>
                <span className="text-xs text-white bg-anime-primary px-2 py-0.5 rounded font-bold shadow-neon">{anime.episodes || '?'} Caps</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
                {episodes.map(ep => (
                    <button
                        key={ep.id}
                        onClick={() => {
                            setCurrentEpisode(ep.number);
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all group relative overflow-hidden ${
                            currentEpisode === ep.number 
                            ? 'bg-anime-primary/10 border border-anime-primary/50' 
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        <div className="relative w-32 aspect-video bg-gray-900 rounded-lg overflow-hidden shrink-0 border border-white/5 shadow-sm group-hover:border-white/20 transition-colors">
                            <img src={ep.thumbnail} alt={ep.title} className={`w-full h-full object-cover transition-all duration-300 ${currentEpisode === ep.number ? 'opacity-40' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                            
                            {currentEpisode === ep.number && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="flex gap-1 items-end h-4">
                                        <div className="w-1 bg-anime-primary animate-[bounce_1s_infinite] h-2 shadow-[0_0_5px_#ff3d71]"></div>
                                        <div className="w-1 bg-anime-primary animate-[bounce_1.2s_infinite] h-4 shadow-[0_0_5px_#ff3d71]"></div>
                                        <div className="w-1 bg-anime-primary animate-[bounce_0.8s_infinite] h-3 shadow-[0_0_5px_#ff3d71]"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <span className={`text-sm font-bold block truncate ${currentEpisode === ep.number ? 'text-anime-primary' : 'text-gray-200 group-hover:text-white'}`}>
                                    Episodio {ep.number}
                                </span>
                            </div>
                            <span className="text-[10px] text-gray-500 truncate block mt-1.5 uppercase tracking-wider font-medium">
                                {activeServer.lang} • {activeServer.quality}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
