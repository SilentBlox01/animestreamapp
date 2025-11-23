import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import AnimeGrid from './components/AnimeGrid';
import VideoPlayer from './components/VideoPlayer';
import AuthModal from './components/AuthModal';
import SecurityPanel from './components/SecurityPanel';
import { Anime, ViewState, User, Notification } from './types';
import { getTopAnime, getSeasonNow, searchAnime } from './services/animeService';
import { Play, Plus, Check, Clock, Trash2, ChevronDown, Settings, User as UserIcon, Shield, Bell, Eye, AlertTriangle, Sparkles, Activity, Heart, History } from 'lucide-react';
import { MOCK_TRENDING } from './constants';
import { sanitizeTextInput } from './utils/security';

// Mock Notifications
const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Nuevo Episodio: One Piece', message: 'El episodio 1095 ya está disponible en AnimeFLV.', time: 'Hace 5 min', read: false, image: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg' },
  { id: '2', title: 'Jujutsu Kaisen S2', message: '¡El arco de Shibuya ha comenzado! Mira el trailer.', time: 'Hace 1 hora', read: false, image: 'https://cdn.myanimelist.net/images/anime/3/56122.jpg' },
  { id: '3', title: 'Bienvenido a AniStream', message: 'Completa tu perfil para recibir recomendaciones personalizadas.', time: 'Hace 1 día', read: true },
];

function App() {
  const [viewState, setViewState] = useState<ViewState>(ViewState.HOME);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // User & Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  
  // Data States
  const [trending, setTrending] = useState<Anime[]>([]);
  const [seasonal, setSeasonal] = useState<Anime[]>([]);
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [favorites, setFavorites] = useState<Anime[]>([]);
  const [history, setHistory] = useState<Anime[]>([]);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<number, number[]>>({});
  
  // Pagination States
  const [trendingPage, setTrendingPage] = useState(1);
  const [seasonalPage, setSeasonalPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [dataError, setDataError] = useState('');
  const [searchError, setSearchError] = useState('');

  // Initial Load & Persistence
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };

    handleResize(); // Init
    window.addEventListener('resize', handleResize);

    const loadData = async () => {
      setIsLoadingData(true);
      setDataError('');

      try {
        const [topData, seasonData] = await Promise.all([
          getTopAnime(1),
          getSeasonNow(1)
        ]);

        const hasTopData = topData.length > 0;
        const hasSeasonData = seasonData.length > 0;

        if (!hasTopData || !hasSeasonData) {
          setDataError('No pudimos cargar los listados en vivo. Mostrando datos de respaldo.');
        }

        setTrending(hasTopData ? topData : MOCK_TRENDING);
        setSeasonal(hasSeasonData ? seasonData : MOCK_TRENDING);
      } catch (error) {
        console.error('Error loading anime data', error);
        setTrending(MOCK_TRENDING);
        setSeasonal(MOCK_TRENDING);
        setDataError('No pudimos contactar a los servidores de anime. Revisa tu conexión o intenta nuevamente.');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();

    // Load Persisted Data
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));

    const savedHistory = localStorage.getItem('history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedWatched = localStorage.getItem('watchedEpisodes');
    if (savedWatched) setWatchedEpisodes(JSON.parse(savedWatched));

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handlers for Persistence
  const toggleFavorite = (anime: Anime) => {
    let newFavorites;
    if (favorites.some(f => f.mal_id === anime.mal_id)) {
      newFavorites = favorites.filter(f => f.mal_id !== anime.mal_id);
    } else {
      newFavorites = [anime, ...favorites];
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const addToHistory = (anime: Anime) => {
    const newHistory = [anime, ...history.filter(h => h.mal_id !== anime.mal_id)].slice(0, 20); // Limit to 20
    setHistory(newHistory);
    localStorage.setItem('history', JSON.stringify(newHistory));
  };

  const markEpisodeAsWatched = (animeId: number, episodeNumber: number) => {
    setWatchedEpisodes(prev => {
      const currentWatched = prev[animeId] || [];
      if (currentWatched.includes(episodeNumber)) return prev;
      
      const updated = { ...prev, [animeId]: [...currentWatched, episodeNumber] };
      localStorage.setItem('watchedEpisodes', JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('history');
  };

  const isFavorite = (anime: Anime) => favorites.some(f => f.mal_id === anime.mal_id);

  // Navigation & Actions
  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setSearchError('');
    setViewState(ViewState.SEARCH);
    const safeQuery = sanitizeTextInput(query);
    if (!safeQuery) {
      setIsSearching(false);
      setSearchResults([]);
      setSearchError('La búsqueda fue bloqueada por seguridad. Intenta con un título válido.');
      return;
    }
    try {
      const results = await searchAnime(safeQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError('No encontramos resultados. Intenta con otro título o revisa tu conexión.');
      }
    } catch (error) {
      console.error('Error searching anime', error);
      setSearchResults([]);
      setSearchError('No pudimos completar la búsqueda. Inténtalo más tarde.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnimeSelect = (anime: Anime) => {
    setSelectedAnime(anime);
    setViewState(ViewState.DETAILS);
    // Note: No window.scrollTo needed here as the container scrolls independently
    
    // Simulate loading episodes
    setIsLoadingEpisodes(true);
    setTimeout(() => setIsLoadingEpisodes(false), 1000);
  };

  const handleWatch = (anime: Anime, episodeNumber: number = 1) => {
    // Auth check removed to allow guest viewing
    addToHistory(anime);
    setSelectedAnime(anime);
    setSelectedEpisode(episodeNumber);
    setViewState(ViewState.WATCH);
  };

  const handleLogout = () => {
    setUser(null);
    setViewState(ViewState.HOME);
  };

  const markNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const loadMoreTrending = async () => {
    setIsLoadingMore(true);
    try {
      const nextPage = trendingPage + 1;
      const newData = await getTopAnime(nextPage);
      if (newData.length > 0) {
        setTrending(prev => [...prev, ...newData]);
        setTrendingPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more trending anime', error);
      setDataError('No pudimos cargar más tendencias. Intenta nuevamente.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadMoreSeasonal = async () => {
    setIsLoadingMore(true);
    try {
      const nextPage = seasonalPage + 1;
      const newData = await getSeasonNow(nextPage);
      if (newData.length > 0) {
        setSeasonal(prev => [...prev, ...newData]);
        setSeasonalPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more seasonal anime', error);
      setDataError('No pudimos cargar más estrenos de temporada. Intenta nuevamente.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleViewStateChange = (view: ViewState) => {
    setViewState(view);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const highlightCards = [
    {
      title: 'Tendencias',
      description: 'Mejores valorados de la semana',
      value: trending.length || '—',
      icon: <Sparkles size={18} />,
      accent: 'from-pink-500/20 to-orange-500/10'
    },
    {
      title: 'En emisión',
      description: 'Episodios nuevos cada día',
      value: seasonal.length || '—',
      icon: <Activity size={18} />,
      accent: 'from-blue-500/20 to-cyan-500/10'
    },
    {
      title: 'Favoritos',
      description: 'Tu lista personalizada',
      value: favorites.length || 0,
      icon: <Heart size={18} />,
      accent: 'from-purple-500/20 to-pink-500/10'
    },
    {
      title: 'Historial',
      description: 'Lo que viste recientemente',
      value: history.length || 0,
      icon: <History size={18} />,
      accent: 'from-emerald-500/20 to-teal-500/10'
    }
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#05060d] text-gray-100 font-sans flex flex-col">
      <Navbar
        onSearch={handleSearch}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        setViewState={handleViewStateChange}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        notifications={notifications}
        markNotificationsRead={markNotificationsRead}
      />
      
      <div className="flex flex-1 overflow-hidden pt-20 relative">
        {/* Mobile Backdrop for Sidebar */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <Sidebar 
          isOpen={sidebarOpen} 
          activeView={viewState} 
          setViewState={handleViewStateChange}
        />

        <main
          className={`flex-1 h-full overflow-y-auto scrollbar-thin transition-all duration-300 relative ${
            sidebarOpen ? 'md:ml-64' : 'md:ml-20'
          } ml-0 w-full`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,61,113,0.05),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(66,141,255,0.05),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(0,255,200,0.04),transparent_30%)] pointer-events-none" />
          <div className="absolute inset-0 opacity-30 bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_25%,transparent_25%),linear-gradient(225deg,rgba(255,255,255,0.04)_25%,transparent_25%),linear-gradient(45deg,rgba(255,255,255,0.04)_25%,transparent_25%),linear-gradient(315deg,rgba(255,255,255,0.04)_25%,rgba(255,255,255,0.04)_25%)] bg-[length:24px_24px]" />
          <div className="relative p-4 md:p-8 max-w-[1920px] mx-auto min-h-full pb-20 md:pb-8">

            {dataError && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-300">
                <AlertTriangle size={20} className="mt-0.5" />
                <div>
                  <p className="font-semibold">Se mostrará contenido de respaldo.</p>
                  <p className="text-sm text-yellow-200/80">{dataError}</p>
                </div>
              </div>
            )}

            {/* HOME VIEW */}
            {viewState === ViewState.HOME && (
              <div className="animate-fade-in space-y-8 md:space-y-12">
                {!isLoadingData && trending.length > 0 && (
                  <Hero
                      featured={trending[0]}
                      onWatch={(a) => handleWatch(a, 1)}
                      onInfo={handleAnimeSelect}
                    />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                  {highlightCards.map(card => (
                    <div
                      key={card.title}
                      className={`relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 backdrop-blur-lg p-4 md:p-5 shadow-xl shadow-black/30 flex items-center gap-4 md:gap-6`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.accent} flex items-center justify-center text-white shadow-neon`}>{card.icon}</div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold">{card.title}</p>
                        <p className="text-2xl font-display font-bold text-white leading-none">{card.value}</p>
                        <p className="text-sm text-gray-400">{card.description}</p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  ))}
                </div>

                <SecurityPanel
                  onClearHistory={clearHistory}
                  onLogout={handleLogout}
                  user={user}
                />

                <AnimeGrid
                  title="Top Anime Japón 🔥"
                  animes={trending.slice(1, 13)}
                  onSelect={handleAnimeSelect}
                  isLoading={isLoadingData}
                  enableFilters={true}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                />

                <div className="flex justify-center">
                    <button onClick={() => setViewState(ViewState.TRENDING)} className="bg-white/5 hover:bg-white/10 border border-white/5 px-6 py-2 rounded-full text-sm font-bold transition-colors">
                        Ver Ranking Completo
                    </button>
                </div>

                <AnimeGrid 
                  title="Temporada Actual" 
                  animes={seasonal} 
                  onSelect={handleAnimeSelect}
                  isLoading={isLoadingData}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                />
              </div>
            )}

            {/* TRENDING VIEW */}
            {viewState === ViewState.TRENDING && (
              <div className="animate-fade-in">
                <AnimeGrid 
                  title="Tendencias Globales" 
                  animes={trending} 
                  onSelect={handleAnimeSelect}
                  isLoading={isLoadingData}
                  enableFilters={true}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                />
                <div className="flex justify-center py-8">
                    <button 
                      onClick={loadMoreTrending} 
                      disabled={isLoadingMore}
                      className="flex items-center gap-2 bg-anime-primary hover:bg-pink-600 px-6 py-3 rounded-full font-bold transition-colors disabled:opacity-50"
                    >
                      {isLoadingMore ? 'Cargando...' : <>Cargar Más <ChevronDown size={18}/></>}
                    </button>
                </div>
              </div>
            )}

            {/* AIRING VIEW */}
            {viewState === ViewState.AIRING && (
              <div className="animate-fade-in">
                <AnimeGrid 
                  title="En Emisión (Simulcast)" 
                  animes={seasonal} 
                  onSelect={handleAnimeSelect}
                  isLoading={isLoadingData}
                  enableFilters={true}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                />
                <div className="flex justify-center py-8">
                    <button 
                      onClick={loadMoreSeasonal} 
                      disabled={isLoadingMore}
                      className="flex items-center gap-2 bg-anime-primary hover:bg-pink-600 px-6 py-3 rounded-full font-bold transition-colors disabled:opacity-50"
                    >
                      {isLoadingMore ? 'Cargando...' : <>Cargar Más <ChevronDown size={18}/></>}
                    </button>
                </div>
              </div>
            )}

            {/* FAVORITES VIEW */}
            {viewState === ViewState.FAVORITES && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl md:text-2xl font-bold font-display">Mi Lista ({favorites.length})</h2>
                </div>
                
                {favorites.length > 0 ? (
                  <AnimeGrid 
                    title="" 
                    animes={favorites} 
                    onSelect={handleAnimeSelect}
                    enableFilters={true}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isFavorite}
                  />
                ) : (
                  <div className="text-center py-20 flex flex-col items-center gap-4 opacity-50">
                      <Plus size={48} />
                      <p>Aún no tienes animes en tu lista de favoritos.</p>
                      <button 
                        onClick={() => setViewState(ViewState.HOME)}
                        className="text-anime-primary hover:underline"
                      >
                        Explorar anime
                      </button>
                  </div>
                )}
              </div>
            )}

            {/* HISTORY VIEW */}
            {viewState === ViewState.HISTORY && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl md:text-2xl font-bold font-display flex items-center gap-2">
                      <Clock className="text-anime-primary"/> Historial
                    </h2>
                    {history.length > 0 && (
                      <button 
                        onClick={clearHistory}
                        className="text-sm text-red-400 hover:text-red-300 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={16} /> Borrar
                      </button>
                    )}
                </div>
                
                {history.length > 0 ? (
                  <AnimeGrid 
                    title="Visto recientemente" 
                    animes={history} 
                    onSelect={handleAnimeSelect}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isFavorite}
                  />
                ) : (
                  <div className="text-center py-20 flex flex-col items-center gap-4 opacity-50">
                      <Clock size={48} />
                      <p>No hay historial reciente.</p>
                  </div>
                )}
              </div>
            )}

            {/* SEARCH VIEW */}
            {viewState === ViewState.SEARCH && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => setViewState(ViewState.HOME)} className="text-gray-400 hover:text-white">Volver</button>
                    <h2 className="text-xl md:text-2xl font-bold font-display">Resultados de búsqueda</h2>
                </div>

                {searchError && (
                  <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-300">
                    <AlertTriangle size={20} className="mt-0.5" />
                    <div>
                      <p className="font-semibold">Problema al buscar</p>
                      <p className="text-sm text-yellow-200/80">{searchError}</p>
                    </div>
                  </div>
                )}

                <AnimeGrid
                  title={isSearching ? "Buscando..." : `Resultados`}
                  animes={searchResults}
                  onSelect={handleAnimeSelect}
                  isLoading={isSearching}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                />
                
                {!isSearching && searchResults.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        Intenta buscar otro título.
                    </div>
                )}
              </div>
            )}

            {/* SETTINGS VIEW */}
            {viewState === ViewState.SETTINGS && (
              <div className="animate-fade-in max-w-4xl mx-auto">
                <h2 className="text-xl md:text-2xl font-bold font-display mb-8 flex items-center gap-2">
                  <Settings className="text-anime-primary"/> Configuración
                </h2>

                <div className="grid gap-6">
                  {/* Profile Settings */}
                  <section className="bg-[#1a1a2e] p-6 rounded-xl border border-white/5">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                        <UserIcon size={20}/> Perfil de Usuario
                      </h3>
                      {user ? (
                        <div className="flex flex-col md:flex-row items-center gap-4">
                          <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border-2 border-anime-primary" />
                          <div className="text-center md:text-left">
                              <p className="font-bold text-lg">{user.name}</p>
                              <p className="text-gray-400">{user.email}</p>
                          </div>
                          <button onClick={handleLogout} className="md:ml-auto w-full md:w-auto text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors">
                              Cerrar Sesión
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-gray-400 mb-4">Inicia sesión para sincronizar tu lista y progreso.</p>
                          <button onClick={() => setAuthOpen(true)} className="bg-anime-primary hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-bold transition-colors w-full md:w-auto">
                              Iniciar Sesión / Registrarse
                          </button>
                        </div>
                      )}
                  </section>

                  {/* App Preferences */}
                  <section className="bg-[#1a1a2e] p-6 rounded-xl border border-white/5">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                        <Shield size={20}/> Preferencias
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                            <div>
                              <p className="font-bold">Autoplay</p>
                              <p className="text-xs text-gray-400">Siguiente episodio</p>
                            </div>
                            <div className="w-12 h-6 bg-anime-primary rounded-full relative">
                              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </div>
                      </div>
                  </section>
                </div>
              </div>
            )}

            {/* DETAILS VIEW */}
            {viewState === ViewState.DETAILS && selectedAnime && (
              <div className="animate-fade-in max-w-7xl mx-auto">
                <div className="relative h-[350px] md:h-[450px] w-full rounded-3xl overflow-hidden mb-8 shadow-2xl shadow-black/50 ring-1 ring-white/10 group">
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" style={{ backgroundImage: `url(${selectedAnime.images.jpg.large_image_url})` }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c15] via-[#0b0c15]/80 to-transparent"></div>
                    
                    <div className="absolute bottom-0 left-0 p-6 md:p-12 flex flex-col md:flex-row gap-8 items-end w-full">
                        <img 
                            src={selectedAnime.images.jpg.image_url} 
                            alt={selectedAnime.title} 
                            className="w-52 rounded-2xl shadow-2xl shadow-black border-2 border-white/10 hidden md:block transform -translate-y-4 hover:rotate-2 transition-transform duration-300"
                        />
                        <div className="mb-4 flex-1 z-10 w-full">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedAnime.genres.map(g => (
                                    <span key={g.name} className="bg-anime-primary/20 text-anime-primary border border-anime-primary/20 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide shadow-neon">{g.name}</span>
                                ))}
                            </div>
                            <h1 className="text-3xl md:text-7xl font-display font-bold text-white mb-2 leading-none drop-shadow-xl line-clamp-2 md:line-clamp-none">{selectedAnime.title}</h1>
                            {selectedAnime.title_japanese && <h2 className="text-sm md:text-xl text-gray-300 mb-6 md:mb-8 font-serif italic tracking-wider line-clamp-1">{selectedAnime.title_japanese}</h2>}
                            
                            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                                <button 
                                    onClick={() => handleWatch(selectedAnime, 1)}
                                    className="bg-anime-primary hover:bg-pink-600 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl font-bold shadow-neon transition-all hover:scale-105 flex items-center justify-center gap-2 uppercase tracking-widest text-sm w-full md:w-auto"
                                >
                                    <Play size={20} fill="currentColor" />
                                    VER AHORA
                                </button>
                                <button 
                                    onClick={() => toggleFavorite(selectedAnime)}
                                    className={`${isFavorite(selectedAnime) ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'} px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold transition-all border uppercase tracking-widest text-sm flex items-center justify-center gap-2 backdrop-blur-md hover:border-white/30 w-full md:w-auto`}
                                >
                                    {isFavorite(selectedAnime) ? <Check size={18} /> : <Plus size={18} />}
                                    {isFavorite(selectedAnime) ? 'En Mi Lista' : 'Mi Lista'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        <section className="bg-white/5 p-6 md:p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
                            <h3 className="text-lg md:text-xl font-bold mb-4 text-white flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-anime-primary rounded-full shadow-neon"></span> Sinopsis
                            </h3>
                            <p className="text-gray-300 leading-loose text-base md:text-lg font-light">{selectedAnime.synopsis}</p>
                        </section>

                        <section>
                            <h3 className="text-lg md:text-xl font-bold mb-6 text-white flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-anime-primary rounded-full shadow-neon"></span> Episodios
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-2 pr-4 scrollbar-thin">
                                {isLoadingEpisodes ? (
                                    Array.from({ length: 8 }).map((_, idx) => (
                                        <div key={idx} className="bg-[#1a1a2e] border border-white/5 rounded-2xl overflow-hidden">
                                            <div className="aspect-video bg-white/5 animate-pulse"></div>
                                            <div className="p-3 space-y-2">
                                                <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse"></div>
                                                <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse"></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    Array.from({ length: selectedAnime.episodes || 12 }).map((_, idx) => {
                                        const epNum = idx + 1;
                                        const isWatched = watchedEpisodes[selectedAnime.mal_id]?.includes(epNum);
                                        
                                        return (
                                            <button 
                                                key={idx}
                                                onClick={() => handleWatch(selectedAnime, epNum)}
                                                className={`group bg-[#1a1a2e] border ${isWatched ? 'border-green-500/30 bg-green-900/10' : 'border-white/5'} hover:border-anime-primary/50 rounded-2xl overflow-hidden transition-all text-left relative hover:-translate-y-1 hover:shadow-lg`}
                                            >
                                                {isWatched && (
                                                    <div className="absolute top-2 right-2 z-10 bg-black/80 text-green-400 p-1.5 rounded-full shadow-lg border border-green-500/20">
                                                        <Eye size={12} />
                                                    </div>
                                                )}
                                                <div className="aspect-video bg-black/50 relative overflow-hidden">
                                                    <img 
                                                        src={selectedAnime.images.jpg.large_image_url} 
                                                        alt={`Episodio ${epNum}`} 
                                                        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${isWatched ? 'opacity-40 grayscale' : 'opacity-70 group-hover:opacity-100'}`}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="bg-anime-primary/80 p-3 rounded-full shadow-neon backdrop-blur-sm">
                                                            <Play size={20} fill="currentColor" className="text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-3 md:p-4">
                                                    <span className={`text-xs font-bold block mb-1 uppercase tracking-wide ${isWatched ? 'text-green-400' : 'text-anime-primary'}`}>
                                                        Episodio {epNum}
                                                    </span>
                                                    <span className={`text-sm font-bold line-clamp-1 group-hover:text-anime-primary transition-colors ${isWatched ? 'text-gray-500' : 'text-white'}`}>
                                                        Capítulo {epNum}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </section>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-[#151621] p-6 rounded-3xl border border-white/5 sticky top-6">
                            <h3 className="font-bold mb-6 text-white border-b border-white/5 pb-4 font-display text-lg tracking-wide">Info. Técnica</h3>
                            <ul className="space-y-4 text-sm">
                                <li className="flex justify-between items-center group">
                                    <span className="text-gray-400 group-hover:text-white transition-colors">Puntuación</span>
                                    <span className="text-yellow-400 font-bold text-lg shadow-black drop-shadow-sm">★ {selectedAnime.score}</span>
                                </li>
                                <li className="flex justify-between group">
                                    <span className="text-gray-400 group-hover:text-white transition-colors">Estado</span>
                                    <span className="text-white font-medium bg-white/5 px-2 py-0.5 rounded">{selectedAnime.status}</span>
                                </li>
                                <li className="flex justify-between group">
                                    <span className="text-gray-400 group-hover:text-white transition-colors">Episodios</span>
                                    <span className="text-white font-bold">{selectedAnime.episodes || '?'}</span>
                                </li>
                                <li className="flex justify-between group">
                                    <span className="text-gray-400 group-hover:text-white transition-colors">Año</span>
                                    <span className="text-white">{selectedAnime.year || 'N/A'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
              </div>
            )}

            {/* WATCH VIEW */}
            {viewState === ViewState.WATCH && selectedAnime && (
                <VideoPlayer 
                    anime={selectedAnime} 
                    onBack={() => setViewState(ViewState.DETAILS)}
                    initialEpisode={selectedEpisode}
                    onEpisodeComplete={(epNum) => markEpisodeAsWatched(selectedAnime.mal_id, epNum)}
                />
            )}
          </div>
        </main>
      </div>

      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)} 
        onLogin={(u) => setUser(u)}
      />
    </div>
  );
}

export default App;