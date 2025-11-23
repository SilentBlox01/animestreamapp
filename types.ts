
export interface Anime {
  mal_id: number;
  title: string;
  title_japanese?: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    }
  };
  trailer?: {
    embed_url: string;
    images: {
      maximum_image_url: string;
    }
  };
  synopsis: string;
  score: number;
  genres: { name: string }[];
  episodes: number;
  status: string;
  year: number;
  rating?: string;
  type?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  image?: string;
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  thumbnail: string;
}

export interface Server {
  id: string;
  name: string;
  url: string; 
  quality: string;
  lang: string;
  icon?: string;
}

export enum ViewState {
  HOME = 'HOME',
  DETAILS = 'DETAILS',
  WATCH = 'WATCH',
  SEARCH = 'SEARCH',
  HISTORY = 'HISTORY',
  FAVORITES = 'FAVORITES',
  AIRING = 'AIRING',
  TRENDING = 'TRENDING',
  SETTINGS = 'SETTINGS'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}
