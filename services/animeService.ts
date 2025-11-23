import { Anime, Episode, StreamData } from '../types';

const JIKAN_URL = 'https://api.jikan.moe/v4';
// Proveedores compatibles para streaming
const ANIME_API_BASE = 'https://anime-api-justalk.vercel.app';
const ANIWATCH_BASE = `${ANIME_API_BASE}/aniwatch`;
const ANIMEFLV_BASE = `${ANIME_API_BASE}/animeflv`;
const CONSUMET_URL = `${ANIME_API_BASE}/gogoanime`;

type StreamProvider = 'aniwatch' | 'animeflv' | 'consumet';

// Helper to delay requests to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getTopAnime = async (page: number = 1): Promise<Anime[]> => {
  try {
    await delay(300);
    const response = await fetch(`${JIKAN_URL}/top/anime?filter=bypopularity&page=${page}&limit=24`);
    if (!response.ok) throw new Error(`Top anime request failed (${response.status})`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching top anime:", error);
    throw error;
  }
};

export const getSeasonNow = async (page: number = 1): Promise<Anime[]> => {
  try {
    await delay(300); // Rate limit prevention
    const response = await fetch(`${JIKAN_URL}/seasons/now?page=${page}&limit=24`);
    if (!response.ok) throw new Error(`Season now request failed (${response.status})`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching seasonal anime:", error);
    throw error;
  }
};

export const searchAnime = async (query: string): Promise<Anime[]> => {
  try {
    const response = await fetch(`${JIKAN_URL}/anime?q=${query}&sfw=true&limit=24`);
    if (!response.ok) throw new Error(`Search request failed (${response.status})`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error searching anime:", error);
    throw error;
  }
};

// --- CONSUMET / GOGOANIME INTEGRATION ---

/**
 * Busca el anime en el proveedor de streaming.
 */
export const fetchStreamEpisodes = async (title: string): Promise<Episode[]> => {
  const providers: { base: string; key: StreamProvider }[] = [
    { base: ANIWATCH_BASE, key: 'aniwatch' },
    { base: ANIMEFLV_BASE, key: 'animeflv' },
    { base: CONSUMET_URL, key: 'consumet' },
  ];

  for (const provider of providers) {
    try {
      const searchUrl = `${provider.base}/search?query=${encodeURIComponent(title)}`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) throw new Error(`Search failed (${searchRes.status})`);
      const searchData = await searchRes.json();

      if (!searchData.results || searchData.results.length === 0) {
        continue;
      }

      const animeId = searchData.results[0].id;
      const infoUrl = `${provider.base}/info/${animeId}`;
      const infoRes = await fetch(infoUrl);
      if (!infoRes.ok) throw new Error(`Info failed (${infoRes.status})`);
      const infoData = await infoRes.json();

      if (!infoData.episodes || infoData.episodes.length === 0) continue;

      const episodes: Episode[] = infoData.episodes
        .map((ep: any) => ({
          id: ep.id,
          number: ep.number,
          title: ep.title || `Episodio ${ep.number}`,
          isFiller: !!ep.isFiller,
          provider: provider.key,
        }))
        .sort((a: Episode, b: Episode) => a.number - b.number);

      if (episodes.length > 0) return episodes;
    } catch (error) {
      console.warn(`Error fetching episodes from ${provider.key}:`, error);
    }
  }

  return [];
};

/**
 * Obtiene los enlaces de streaming para un episodio específico.
 */
export const fetchStreamSource = async (
  episodeId: string,
  provider: StreamProvider = 'consumet'
): Promise<StreamData | null> => {
  const providerBase =
    provider === 'aniwatch' ? ANIWATCH_BASE : provider === 'animeflv' ? ANIMEFLV_BASE : CONSUMET_URL;

  try {
    const url = `${providerBase}/watch/${episodeId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Watch failed (${response.status})`);
    const data = await response.json();

    if (!data.sources) return null;

    return {
      sources: data.sources.map((s: any) => ({
        url: s.url,
        isM3U8: s.isM3U8 ?? s.url.includes('.m3u8'),
        quality: s.quality || s.resolution,
      })),
      subtitles: data.subtitles?.map((sub: any) => ({ url: sub.url, lang: sub.lang || sub.label })) || [],
      intro: data.intro,
      outro: data.outro,
    };
  } catch (error) {
    console.error(`Error fetching stream source from ${provider}:`, error);
    return null;
  }
};