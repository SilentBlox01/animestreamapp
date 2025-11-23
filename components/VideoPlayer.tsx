import React, { useState, useEffect, useRef } from 'react';
import { Play, SkipForward, ArrowLeft, Loader2, AlertTriangle, Settings, Subtitles, Volume2, VolumeX, Maximize, Minimize, RefreshCw } from 'lucide-react';
import { Anime, Episode, StreamData } from '../types';
import { fetchStreamEpisodes, fetchStreamSource } from '../services/animeService';

interface VideoPlayerProps {
  anime: Anime;
  onBack: () => void;
  initialEpisode?: number;
  onEpisodeComplete?: (episodeNumber: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ anime, onBack, initialEpisode = 1, onEpisodeComplete }) => {
  // State for streaming logic
  const [streamEpisodes, setStreamEpisodes] = useState<Episode[]>([]);
  const [currentEpisodeNum, setCurrentEpisodeNum] = useState(initialEpisode);
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [activeQuality, setActiveQuality] = useState<string>('default');
  const [activeProvider, setActiveProvider] = useState<'aniwatch' | 'animeflv' | 'consumet'>('consumet');
  
  // UI States
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [error, setError] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);

  // 1. Initial Load: Find Anime on Provider and get episodes
  useEffect(() => {
    let mounted = true;
    const loadEpisodes = async () => {
      setIsLoadingInfo(true);
      setError('');
      
      const episodes = await fetchStreamEpisodes(anime.title);
      
      if (mounted) {
        if (episodes.length > 0) {
          setStreamEpisodes(episodes);
        } else {
          setError(`No se encontró "${anime.title}" en el servidor de streaming.`);
          // Fallback visual
          setStreamEpisodes(Array.from({ length: anime.episodes || 12 }, (_, i) => ({
             id: `fallback-${i+1}`,
             number: i + 1,
             title: `Episodio ${i+1} (No disponible)`
          })));
        }
        setIsLoadingInfo(false);
      }
    };

    loadEpisodes();
    return () => { mounted = false; };
  }, [anime.title]);

  // 2. Load Source when Current Episode changes
  useEffect(() => {
    const loadSource = async () => {
      if (streamEpisodes.length === 0) return;

      const targetEpisode = streamEpisodes.find(e => e.number === currentEpisodeNum);
      if (!targetEpisode || targetEpisode.id.startsWith('fallback')) {
        if (!isLoadingInfo) setError('Este episodio no está disponible en el servidor.');
        return;
      }

      setIsLoadingSource(true);
      setError('');
      setStreamData(null);
      
      // Cleanup previous HLS/Video
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }

      const data = await fetchStreamSource(targetEpisode.id, targetEpisode.provider);

      if (data && data.sources.length > 0) {
        setStreamData(data);
        setActiveProvider(targetEpisode.provider || 'consumet');
      } else {
        setError('No se pudo obtener el video. Intenta con otro episodio.');
      }
      setIsLoadingSource(false);
    };

    if (!isLoadingInfo) {
      loadSource();
    }
  }, [currentEpisodeNum, streamEpisodes, isLoadingInfo]);

  // 3. Initialize HLS Player when source is available
  useEffect(() => {
    if (!streamData || !videoRef.current) return;

    // Logic to select quality: 'default' > 'backup' > 'auto' > first available
    const source = streamData.sources.find(s => s.quality === 'default') || 
                   streamData.sources.find(s => s.quality === 'backup') ||
                   streamData.sources.find(s => s.quality === 'auto') || 
                   streamData.sources[0];

    if (!source) {
        setError("No hay fuentes de video compatibles.");
        return;
    }
    
    setActiveQuality(source.quality || 'auto');

    const video = videoRef.current;
    const Hls = (window as any).Hls;

    const handleMediaError = () => {
        if (hlsRef.current) {
           hlsRef.current.recoverMediaError();
        }
    };

    if (Hls && Hls.isSupported() && source.isM3U8) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        xhrSetup: function(xhr: any) {
             // Optional: some CORS handling adjustments if needed
        },
        // Configuración para ser más resiliente
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 10000,
        fragLoadingTimeOut: 20000,
      });

      hlsRef.current = hls;
      hls.loadSource(source.url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log("Autoplay blocked, waiting for user interaction", e));
        setIsPlaying(true);
      });

      hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
              switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                      console.log("HLS Network Error, trying to recover...");
                      hls.startLoad();
                      break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                      console.log("HLS Media Error, trying to recover...");
                      hls.recoverMediaError();
                      break;
                  default:
                      console.error("HLS Fatal Error", data);
                      hls.destroy();
                      setError("Error fatal de reproducción. Intenta recargar.");
                      break;
              }
          }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = source.url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
        setIsPlaying(true);
      });
      video.addEventListener('error', () => {
          setError("Error nativo del reproductor.");
      });
    } else {
      // Direct MP4 fallback
      video.src = source.url;
      video.play().catch(() => {});
      setIsPlaying(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamData]);

  // Handlers
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleNextEpisode = () => {
      const next = currentEpisodeNum + 1;
      // Check if next episode exists in our stream list
      if (streamEpisodes.some(e => e.number === next)) {
          setCurrentEpisodeNum(next);
          if (onEpisodeComplete) onEpisodeComplete(next);
      }
  };

  const reloadPlayer = () => {
      // Force reload of current episode logic
      const current = currentEpisodeNum;
      setCurrentEpisodeNum(-1);
      setTimeout(() => setCurrentEpisodeNum(current), 100);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative z-20">
      
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="hover:bg-white/10 p-2 rounded-full transition-colors text-white group">
              <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white font-display tracking-wide">{anime.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                 <span className="bg-anime-primary px-2 py-0.5 rounded text-[10px] text-white font-bold uppercase tracking-wider shadow-neon">
                    Episodio {currentEpisodeNum}
                 </span>
                 <span className="text-xs text-green-400 border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded font-medium capitalize">
                    {activeProvider === 'aniwatch' ? 'Aniwatch' : activeProvider === 'animeflv' ? 'AnimeFLV' : 'Gogoanime'}
                 </span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Player Container */}
        <div 
            ref={containerRef}
            className="relative aspect-video bg-black shadow-2xl rounded-2xl overflow-hidden group select-none ring-1 ring-white/5 mx-2 md:mx-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
             {/* Loading & Error States Overlay */}
             {(isLoadingInfo || isLoadingSource) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 backdrop-blur-sm">
                    <Loader2 size={48} className="text-anime-primary animate-spin mb-4" />
                    <p className="text-white font-bold animate-pulse">
                        {isLoadingInfo ? "Buscando stream compatible..." : "Cargando video..."}
                    </p>
                </div>
             )}

             {error && !isLoadingInfo && !isLoadingSource && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#151621] z-30 p-8 text-center">
                    <AlertTriangle size={48} className="text-yellow-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Error de Reproducción</h3>
                    <p className="text-gray-400 text-sm max-w-md mb-6">{error}</p>
                    <button 
                        onClick={reloadPlayer}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full text-sm flex items-center gap-2"
                    >
                        <RefreshCw size={16} /> Reintentar
                    </button>
                </div>
             )}

             {/* HTML Video Element */}
             <video 
                ref={videoRef}
                className="w-full h-full object-contain cursor-pointer"
                playsInline
                onClick={handlePlayPause}
                onEnded={handleNextEpisode}
             />

             {/* Custom Controls Overlay */}
             <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-20 flex flex-col justify-between p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                {/* Top Bar */}
                <div className="flex justify-between items-start">
                    <div className="text-white/80 text-sm font-bold drop-shadow-md">
                         {anime.title} - Ep. {currentEpisodeNum}
                    </div>
                    {/* Quality Selector (Mock UI for now, logic can be extended) */}
                    <div className="flex gap-2">
                        {streamData && (
                            <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-md text-xs font-bold text-white border border-white/10 flex items-center gap-1">
                                <Settings size={12} />
                                {activeQuality?.toUpperCase() || 'AUTO'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Center Play Button (only if paused) */}
                {!isPlaying && !isLoadingSource && !error && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-anime-primary/90 p-5 rounded-full shadow-neon backdrop-blur-sm transform scale-100 animate-pulse">
                            <Play size={32} fill="white" className="text-white ml-1" />
                        </div>
                    </div>
                )}

                {/* Bottom Bar */}
                <div className="flex items-center gap-4">
                    <button onClick={handlePlayPause} className="text-white hover:text-anime-primary transition-colors">
                        {isPlaying ? <span className="font-black text-xl">||</span> : <Play size={24} fill="currentColor" />}
                    </button>

                    <button onClick={toggleMute} className="text-white hover:text-gray-300 transition-colors">
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    {/* Progress Bar Placeholder - Native controls handle this mostly in full screen, but custom implementation would go here */}
                    <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                         <div className="h-full bg-anime-primary w-0 relative"></div> 
                    </div>

                    <button className="text-white hover:text-gray-300 transition-colors" title="Subtítulos">
                        <Subtitles size={20} className={streamData?.subtitles ? "text-white" : "text-gray-600"} />
                    </button>

                    <button onClick={toggleFullscreen} className="text-white hover:text-gray-300 transition-colors">
                         {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                </div>
             </div>
        </div>

        {/* Controls Below Player */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 px-2 md:px-0">
             <button 
               onClick={handleNextEpisode}
               className="flex items-center gap-2 px-8 py-3 bg-anime-primary hover:bg-pink-600 rounded-xl text-sm font-bold text-white transition-all shadow-neon disabled:opacity-50 disabled:shadow-none"
               disabled={!streamEpisodes.some(e => e.number === currentEpisodeNum + 1)}
             >
                <SkipForward size={18} /> Siguiente Episodio
             </button>
             
             <p className="text-xs text-gray-500 italic max-w-md text-right">
                Fuente: Gogoanime (vía Consumet). Si falla, es posible que el servidor de streaming tenga alta carga.
             </p>
        </div>
      </div>

      {/* Episodes Sidebar */}
      <div className="lg:w-[350px] flex flex-col lg:max-h-[800px]">
         <div className="bg-[#151621] rounded-2xl border border-white/5 flex flex-col overflow-hidden shadow-lg h-[600px]">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#1a1b26]">
                <h3 className="font-bold text-white font-display text-lg tracking-wide">Episodios</h3>
                <span className="text-xs text-white bg-anime-primary px-2 py-0.5 rounded font-bold shadow-neon">
                   {streamEpisodes.length} Disp.
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
                {isLoadingInfo ? (
                    <div className="p-4 flex flex-col items-center justify-center h-40 text-gray-500 gap-2">
                        <Loader2 size={24} className="animate-spin" />
                        <span className="text-xs">Cargando lista...</span>
                    </div>
                ) : (
                    streamEpisodes.map(ep => (
                        <button
                            key={ep.id}
                            onClick={() => setCurrentEpisodeNum(ep.number)}
                            disabled={ep.id.startsWith('fallback')}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all group relative overflow-hidden text-left ${
                                currentEpisodeNum === ep.number 
                                ? 'bg-anime-primary/10 border border-anime-primary/50' 
                                : 'hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0 ${currentEpisodeNum === ep.number ? 'bg-anime-primary text-white shadow-neon' : 'bg-gray-800 text-gray-400'}`}>
                                {ep.number}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className={`text-sm font-medium block truncate ${currentEpisodeNum === ep.number ? 'text-anime-primary' : 'text-gray-300'}`}>
                                    {ep.title}
                                </span>
                            </div>
                            {currentEpisodeNum === ep.number && (
                                <div className="w-2 h-2 rounded-full bg-anime-primary shadow-neon animate-pulse"></div>
                            )}
                        </button>
                    ))
                )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default VideoPlayer;