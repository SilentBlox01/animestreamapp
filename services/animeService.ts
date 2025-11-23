import { Anime, Episode, StreamData } from '../types';

const JIKAN_URL = 'https://api.jikan.moe/v4';
// Cambiamos a Gogoanime vía Consumet por ser más estable y tener menos restricciones CORS que Zoro
const CONSUMET_URL = 'https://consumet-api-drab.vercel.app/anime/gogoanime'; 

// Helper to delay requests to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getTopAnime = async (page: number = 1): Promise<Anime[]> => {
  try {
    await delay(300);
    const response = await fetch(`${JIKAN_URL}/top/anime?filter=bypopularity&page=${page}&limit=24`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching top anime:", error);
    return [];
  }
};

export const getSeasonNow = async (page: number = 1): Promise<Anime[]> => {
  try {
    await delay(300); // Rate limit prevention
    const response = await fetch(`${JIKAN_URL}/seasons/now?page=${page}&limit=24`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching seasonal anime:", error);
    return [];
  }
};

export const searchAnime = async (query: string): Promise<Anime[]> => {
  try {
    const response = await fetch(`${JIKAN_URL}/anime?q=${query}&sfw=true&limit=24`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error searching anime:", error);
    return [];
  }
};

// --- CONSUMET / GOGOANIME INTEGRATION ---

/**
 * Busca el anime en el proveedor de streaming.
 */
export const fetchStreamEpisodes = async (title: string): Promise<Episode[]> => {
  try {
    // 1. Buscar el anime en el proveedor
    const searchUrl = `${CONSUMET_URL}/${encodeURIComponent(title)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      console.warn("No se encontró el anime en el proveedor:", title);
      return [];
    }

    // Tomamos el primer resultado (mejor coincidencia)
    const animeId = searchData.results[0].id;

    // 2. Obtener información detallada (incluyendo episodios)
    const infoUrl = `${CONSUMET_URL}/info/${animeId}`;
    const infoRes = await fetch(infoUrl);
    const infoData = await infoRes.json();

    if (!infoData.episodes) return [];

    // Mapear al formato interno y ordenar episodios si es necesario
    const episodes = infoData.episodes.map((ep: any) => ({
      id: ep.id,
      number: ep.number,
      title: ep.title || `Episodio ${ep.number}`,
      isFiller: false // Gogoanime via consumet a veces no devuelve esto, default false
    }));
    
    // Asegurar orden ascendente
    return episodes.sort((a: any, b: any) => a.number - b.number);

  } catch (error) {
    console.error("Error fetching stream episodes from Consumet:", error);
    return [];
  }
};

/**
 * Obtiene los enlaces de streaming para un episodio específico.
 */
export const fetchStreamSource = async (episodeId: string): Promise<StreamData | null> => {
  try {
    // Nota: Gogoanime en consumet usa /watch/{episodeId}
    const url = `${CONSUMET_URL}/watch/${episodeId}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.sources) return null;

    return {
      sources: data.sources.map((s: any) => ({
        url: s.url,
        isM3U8: s.url.includes('.m3u8'),
        quality: s.quality
      })),
      subtitles: [], // Gogoanime suele quemar los subs o no devolverlos separados en este endpoint
      intro: undefined,
      outro: undefined
    };
  } catch (error) {
    console.error("Error fetching stream source:", error);
    return null;
  }
};