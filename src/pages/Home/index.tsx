import { useState } from 'react';
import { Search, Loader2, Music, XCircle, Settings } from 'lucide-react';
import { searchSongMetadata, fetchLyrics, fetchYoutubeIds } from 'services/api';
import { KaraokePlayer } from 'components/KaraokePlayer';
import { SettingsModal } from 'components/SettingsModal';
import { Song, LyricLine } from 'types';
import { ApiError } from 'errors';

function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [songOptions, setSongOptions] = useState<Song[]>([]); // Revertido para Song[]
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [session, setSession] = useState<{
    song: Song;
    lyrics: LyricLine[];
    youtubeIds: string[];
  } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSongOptions([]); // Limpar as opções
    setSession(null);

    try {
      const songs = await searchSongMetadata(query);
      if (songs.length === 1) {
        handleSongSelect(songs[0]);
      } else {
        // Filtrar para ter apenas uma música por artista
        const uniqueArtistSongs: Song[] = [];
        const seenArtists = new Set<string>();

        for (const song of songs) {
          if (!seenArtists.has(song.artist)) {
            uniqueArtistSongs.push(song);
            seenArtists.add(song.artist);
          }
        }
        setSongOptions(uniqueArtistSongs); // Definir as opções filtradas
        setLoading(false);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        console.error(err);
        setError('Ocorreu um erro inesperado. Tente novamente.');
      }
      setLoading(false);
    }
  };

  const handleSongSelect = async (song: Song) => {
    setLoading(true);
    setSongOptions([]); // Limpar as opções ao selecionar
    setQuery(''); // Limpar a query ao selecionar a música

    try {
      const [lyrics, youtubeIds] = await Promise.all([
        fetchLyrics(song.title, song.artist, song.duration),
        fetchYoutubeIds(song.title, song.artist, song.id)
      ]);

      setSession({ song, lyrics, youtubeIds });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        console.error(err);
        setError('Ocorreu um erro inesperado. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-black text-white font-sans selection:bg-yellow-500 selection:text-black">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <Settings className="w-6 h-6 text-yellow-500" />
        </button>
      </div>

      {!session ? (
        <div className="container mx-auto px-4 h-screen flex flex-col items-center justify-center">
          <div className="text-center mb-8 animate-bounce-slow">
            <Music className="w-20 h-20 mx-auto text-yellow-500 mb-4" />
            <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-yellow-400 to-pink-600">
              Karaoke Tanha
            </h1>
          </div>
          <form onSubmit={handleSearch} className="w-full max-w-lg relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: Queen Bohemian Rhapsody..."
              className="w-full bg-white/10 border border-white/20 rounded-full py-4 pl-6 pr-14 text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white/20 transition-all backdrop-blur-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 p-2 bg-yellow-500 text-black rounded-full hover:bg-yellow-400 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
            >
              <Search className="w-6 h-6" />
            </button>
          </form>
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-yellow-500">
              <Loader2 className="animate-spin w-5 h-5" />
              <span>Buscando...</span>
            </div>
          )}
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded-lg flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
          {songOptions.length > 0 && ( // Mapear sobre songOptions
            <div className="mt-8 w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4">Selecione uma música:</h2>
              <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4 scrollbar-hide"> {/* Single horizontal list */}
                {songOptions.map(song => (
                  <button key={song.id} onClick={() => handleSongSelect(song)} className="bg-white/10 p-4 rounded-lg shrink-0 w-64 flex items-center gap-4 hover:bg-white/20 transition-colors">
                    <img src={song.coverUrl} alt={song.title} className="w-16 h-16 rounded-md" />
                    <div>
                      <p className="font-bold">{song.title}</p>
                      <p className="text-sm text-gray-400">{song.artist}</p> {/* Artista de volta no card */}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-screen">
          <KaraokePlayer
            song={session!.song}
            lyrics={session!.lyrics}
            youtubeIds={session!.youtubeIds}
            onReset={() => setSession(null)}
          />
        </div>
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default Home;