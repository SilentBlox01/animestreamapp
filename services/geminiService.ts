import { GoogleGenAI, Type } from "@google/genai";
import { Anime, ChatMessage } from '../types';

// Safe access to API Key to prevent "process is not defined" crashes
const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env?.API_KEY) || '';
  } catch (e) {
    console.warn("API Key access error:", e);
    return '';
  }
};

const apiKey = getApiKey();
// Initialize safe client even if key is missing to prevent crash, though functionality will fail.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateAnimeRecommendations = async (genre: string): Promise<Anime[]> => {
  if (!ai) return [];

  const model = 'gemini-2.5-flash';
  const prompt = `Generate a list of 4 fictional or real anime recommendations for the genre "${genre}". 
  Strictly EXCLUDE Chinese (Donghua) and Korean (Aeni/Manhwa adaptations) animations.
  Only provide Japanese Anime.
  Return JSON with: mal_id (number), title, synopsis (max 20 words), score (number 1-10), genres (array of strings), episodes (number), status (Ongoing/Completed), year, type (TV/Movie).`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              mal_id: { type: Type.NUMBER },
              title: { type: Type.STRING },
              synopsis: { type: Type.STRING },
              score: { type: Type.NUMBER },
              genres: { type: Type.ARRAY, items: { type: Type.STRING } },
              episodes: { type: Type.NUMBER },
              status: { type: Type.STRING },
              year: { type: Type.NUMBER },
              type: { type: Type.STRING }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '[]');
    // Add random images since Gemini might return empty strings or text placeholders
    return data.map((item: any, index: number) => ({
      mal_id: item.mal_id || index + 1000,
      title: item.title,
      title_japanese: item.title,
      synopsis: item.synopsis,
      score: item.score,
      genres: (item.genres || []).map((g: string) => ({ name: g })),
      episodes: item.episodes,
      status: item.status,
      year: item.year,
      type: item.type || 'TV',
      images: {
        jpg: {
          image_url: `https://picsum.photos/300/450?random=${index + 100}`,
          large_image_url: `https://picsum.photos/1200/400?random=${index + 200}`
        }
      }
    }));
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};

export const searchAnime = async (query: string): Promise<Anime[]> => {
  if (!ai) return [];
  
  const prompt = `Search for anime matching "${query}". Return 5 results. 
  Strictly EXCLUDE Chinese (Donghua) and Korean (Aeni/Manhwa adaptations) animations.
  Only provide Japanese Anime.
  JSON format required: mal_id, title, synopsis, score, genres, episodes, status, year, type.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              mal_id: { type: Type.NUMBER },
              title: { type: Type.STRING },
              synopsis: { type: Type.STRING },
              score: { type: Type.NUMBER },
              genres: { type: Type.ARRAY, items: { type: Type.STRING } },
              episodes: { type: Type.NUMBER },
              status: { type: Type.STRING },
              year: { type: Type.NUMBER },
              type: { type: Type.STRING }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '[]');
    return data.map((item: any, index: number) => ({
        mal_id: item.mal_id || index + 2000,
        title: item.title,
        title_japanese: item.title,
        synopsis: item.synopsis,
        score: item.score,
        genres: (item.genres || []).map((g: string) => ({ name: g })),
        episodes: item.episodes,
        status: item.status,
        year: item.year,
        type: item.type || 'TV',
        images: {
            jpg: {
                image_url: `https://picsum.photos/300/450?random=${index + 500}`,
                large_image_url: `https://picsum.photos/1200/400?random=${index + 600}`
            }
        }
    }));
  } catch (e) {
      console.error(e);
      return [];
  }
}

export const chatWithOtakuBot = async (history: ChatMessage[], message: string): Promise<string> => {
  if (!ai) return "Lo siento, no puedo conectarme sin una API Key válida.";

  try {
    const chatHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: chatHistory,
      config: {
        systemInstruction: "Eres OtakuBot, un asistente experto en anime y manga. Tu personalidad es alegre, entusiasta y usas emojis (🤖, ✨, 🔥, etc). Ayudas a los usuarios a encontrar series, resolver dudas sobre tramas y personajes, y recomendar contenido basado en sus gustos.",
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Lo siento, no pude generar una respuesta.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "¡Gomen nasai! 🙇‍♂️ Tuve un error interno.";
  }
};