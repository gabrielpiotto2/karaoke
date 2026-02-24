import axios from "axios";
import { Song, LyricLine } from "types";
import {
  ApiError,
  SongNotFoundError,
  LyricsNotFoundError,
  YoutubeVideoNotFoundError,
  YoutubeApiKeyError,
  YoutubeQuotaError,
} from "errors";

// =================================================================
// 1. BUSCA METADADOS (Mudamos para DEEZER API via Proxy Corsproxy.io)
// =================================================================
// Usamos um proxy público (corsproxy.io) para evitar erro de CORS no navegador
export const searchSongMetadata = async (query: string): Promise<Song[]> => {
  try {
    console.log(`🔍 Buscando na Deezer: ${query}`);

    // Deezer API endpoint
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}`;

    // Truque para CORS: Usar um proxy público
    const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(url);

    const res = await axios.get(proxyUrl);

    if (!res.data || !res.data.data || res.data.data.length === 0) {
      throw new SongNotFoundError();
    }

    const tracks = res.data.data;
    console.log(`✅ ${tracks.length} músicas encontradas.`);

    return tracks.map((track: any) => ({
      id: track.id.toString(),
      title: track.title,
      artist: track.artist.name,
      coverUrl: track.album.cover_xl,
      duration: track.duration,
    }));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("❌ Erro fatal na busca Deezer:", error);
    throw new ApiError("Failed to search for song metadata.");
  }
};

// =================================================================
// 2. BUSCA LETRA (LRCLIB - Continua igual, mas com logs)
// =================================================================
export const fetchLyrics = async (title: string, artist: string, duration: number): Promise<LyricLine[]> => {
  try {
    console.log(`📜 Buscando letra para: ${title} - ${artist} (${duration}s)`);

    const res = await axios.get("https://lrclib.net/api/get", {
      params: {
        artist_name: artist,
        track_name: title,
        duration: Math.round(duration),
      },
    });

    if (!res.data?.syncedLyrics) {
      throw new LyricsNotFoundError();
    }

    return parseLrc(res.data.syncedLyrics);
  } catch (error) {
    // Tenta busca genérica (sem duração) se a específica falhar
    console.log("🔄 Tentando busca genérica de letra...");
    try {
      const retry = await axios.get("https://lrclib.net/api/search", {
        params: { q: `${title} ${artist}` },
      });
      if (retry.data && retry.data.length > 0 && retry.data[0].syncedLyrics) {
        return parseLrc(retry.data[0].syncedLyrics);
      }
    } catch (e) {
      console.error("❌ Erro total na letra");
    }
    throw new LyricsNotFoundError();
  }
};

import { getLikedVideos, getDislikedVideos } from "./videoPreferences";

// ... (other imports and functions)

// =================================================================
// 3. BUSCA YOUTUBE (Com Log de Erro e Preferências)
// =================================================================
export const fetchYoutubeIds = async (title: string, artist: string, songId: string): Promise<string[]> => {
  const likedVideos = getLikedVideos(songId);
  if (likedVideos.length > 0) {
    console.log(`✅ Usando vídeos curtidos: ${likedVideos.join(', ')}`);
    return likedVideos;
  }

  try {
    const q = `${title} ${artist} karaoke instrumental`;
    console.log(`🎥 Buscando YouTube: ${q}`);

    // Verifica se a chave existe
    if (!import.meta.env.VITE_YOUTUBE_DATA_API_KEY) {
      throw new YoutubeApiKeyError();
    }

    const res = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        q: q,
        type: "video",
        key: import.meta.env.VITE_YOUTUBE_DATA_API_KEY,
        maxResults: 10, // Aumentar para ter mais opções
      },
    });

    const dislikedVideos = getDislikedVideos(songId);
    const videoIds = res.data.items
      .map((item: any) => item.id.videoId)
      .filter(Boolean)
      .filter((id: string) => !dislikedVideos.includes(id));

    if (videoIds.length === 0) {
      throw new YoutubeVideoNotFoundError();
    }

    console.log(`✅ Vídeos encontrados: ${videoIds.join(', ')}`);
    return videoIds;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error("❌ Erro YouTube:", error.response?.data?.error?.message || error.message);

    // Se der erro de cota, avisa o usuário
    if (error.response?.status === 403) {
      throw new YoutubeQuotaError();
    }
    throw new ApiError("Failed to fetch YouTube video.");
  }
};

// Helper Parser
const parseLrc = (lrc: string): LyricLine[] => {
  return lrc
    .split("\n")
    .map((line, idx) => {
      const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
      if (!match) return null;
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const ms = parseFloat(`0.${match[3]}`);
      return {
        id: `line-${idx}`,
        time: min * 60 + sec + ms,
        text: match[4].trim(),
      };
    })
    .filter((l): l is LyricLine => l !== null);
};
