import { Anime, Server } from './types';

export const MOCK_TRENDING: Anime[] = [
  {
    mal_id: 1,
    title: 'Cyber Samurai X',
    images: {
      jpg: {
        image_url: 'https://picsum.photos/300/450?random=1',
        large_image_url: 'https://picsum.photos/1200/400?random=10'
      }
    },
    synopsis: 'En un futuro distópico, un samurái solitario lucha contra corporaciones corruptas usando una katana láser.',
    score: 9.2,
    genres: [{ name: 'Action' }, { name: 'Sci-Fi' }, { name: 'Cyberpunk' }],
    episodes: 24,
    status: 'Ongoing',
    year: 2024,
    type: 'TV'
  },
  {
    mal_id: 2,
    title: 'Academy of Magic',
    images: {
      jpg: {
        image_url: 'https://picsum.photos/300/450?random=2',
        large_image_url: 'https://picsum.photos/1200/400?random=11'
      }
    },
    synopsis: 'Una escuela donde la magia es tecnología. Los estudiantes compiten por el título de Archimago Supremo.',
    score: 8.5,
    genres: [{ name: 'Fantasy' }, { name: 'School' }, { name: 'Comedy' }],
    episodes: 12,
    status: 'Completed',
    year: 2023,
    type: 'TV'
  },
  {
    mal_id: 3,
    title: 'Titan Hunters',
    images: {
      jpg: {
        image_url: 'https://picsum.photos/300/450?random=3',
        large_image_url: 'https://picsum.photos/1200/400?random=12'
      }
    },
    synopsis: 'La humanidad vive detrás de muros energéticos. Un grupo de élite sale a cazar a los titanes que amenazan su existencia.',
    score: 9.8,
    genres: [{ name: 'Drama' }, { name: 'Action' }, { name: 'Horror' }],
    episodes: 75,
    status: 'Completed',
    year: 2022,
    type: 'TV'
  },
  {
    mal_id: 4,
    title: 'Neon Drift',
    images: {
      jpg: {
        image_url: 'https://picsum.photos/300/450?random=4',
        large_image_url: 'https://picsum.photos/1200/400?random=13'
      }
    },
    synopsis: 'Carreras ilegales en un Tokyo futurista donde los autos levitan y la velocidad lo es todo.',
    score: 8.9,
    genres: [{ name: 'Sports' }, { name: 'Sci-Fi' }, { name: 'Racing' }],
    episodes: 12,
    status: 'Ongoing',
    year: 2025,
    type: 'TV'
  },
  {
    mal_id: 5,
    title: 'Spirit Detective',
    images: {
      jpg: {
        image_url: 'https://picsum.photos/300/450?random=5',
        large_image_url: 'https://picsum.photos/1200/400?random=14'
      }
    },
    synopsis: 'Un joven muere y se convierte en detective espiritual para resolver crímenes del inframundo.',
    score: 9.0,
    genres: [{ name: 'Supernatural' }, { name: 'Mystery' }, { name: 'Action' }],
    episodes: 112,
    status: 'Completed',
    year: 2020,
    type: 'TV'
  }
];

export const SERVERS: Server[] = [
  { id: 's1', name: 'AnimeFLV', url: 'mock_video_1.mp4', quality: '1080p FHD', lang: 'Subtitulado' },
  { id: 's2', name: 'TioAnime', url: 'mock_video_2.mp4', quality: '1080p FHD', lang: 'Subtitulado' },
  { id: 's3', name: 'Crunchyroll (Oficial)', url: 'mock_video_3.mp4', quality: '1080p FHD', lang: 'Subtitulado' },
  { id: 's4', name: 'Monoschinos', url: 'mock_video_4.mp4', quality: '720p HD', lang: 'Subtitulado' },
  { id: 's5', name: 'Mega', url: 'mock_video_5.mp4', quality: '1080p FHD', lang: 'Latino' },
];