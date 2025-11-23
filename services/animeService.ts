import { Anime } from '../types';

const BASE_URL = 'https://api.jikan.moe/v4';

// Helper to delay requests to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getTopAnime = async (page: number = 1): Promise<Anime[]> => {
  try {
    await delay(300);
    const response = await fetch(`${BASE_URL}/top/anime?filter=bypopularity&page=${page}&limit=24`);
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
    const response = await fetch(`${BASE_URL}/seasons/now?page=${page}&limit=24`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching seasonal anime:", error);
    return [];
  }
};

export const searchAnime = async (query: string): Promise<Anime[]> => {
  try {
    const response = await fetch(`${BASE_URL}/anime?q=${query}&sfw=true&limit=24`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error searching anime:", error);
    return [];
  }
};