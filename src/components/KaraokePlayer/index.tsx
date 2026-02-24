import { useState, useEffect, useRef, useMemo } from 'react';
import YouTube, { YouTubeProps, YouTubePlayer } from 'react-youtube';
import { Song, LyricLine } from 'types';
import { clsx } from 'clsx';
import { useSyncOffset } from 'hooks/useSyncOffset';
import { Play, Pause, ArrowUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import { addLikedVideo, addDislikedVideo, getLikedVideos } from 'services/videoPreferences';
import { fetchYoutubeIds } from 'services/api';

const YouTubeShim = YouTube as unknown as React.FC<YouTubeProps>;

interface Props {
  song: Song;
  lyrics: LyricLine[];
  youtubeIds: string[];
  onReset: () => void;
}

export const KaraokePlayer: React.FC<Props> = ({ song, lyrics, youtubeIds: initialYoutubeIds, onReset }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [offset, setOffset] = useSyncOffset(song.id.toString());
  const [youtubeIds, setYoutubeIds] = useState(initialYoutubeIds);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlayerVisible, setIsPlayerVisible] = useState(true);
  const [liked, setLiked] = useState(false);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLiked(getLikedVideos(song.id).includes(youtubeIds[currentVideoIndex]));
  }, [currentVideoIndex, song.id, youtubeIds]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPlayerVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (playerContainerRef.current) {
      observer.observe(playerContainerRef.current);
    }

    return () => {
      if (playerContainerRef.current) {
        observer.unobserve(playerContainerRef.current);
      }
    };
  }, []);

  const activeIndex = useMemo(() => {
    const time = currentTime + offset;
    return lyrics.findIndex((line, i) => {
      const next = lyrics[i + 1];
      return time >= line.time && (!next || time < next.time);
    });
  }, [currentTime, offset, lyrics]);

  useEffect(() => {
    if (activeIndex !== -1) {
      document.getElementById(`line-${activeIndex}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  const findNewVideo = async () => {
    try {
      const newYoutubeIds = await fetchYoutubeIds(song.title, song.artist, song.id);
      if (newYoutubeIds.length > 0) {
        setYoutubeIds(newYoutubeIds);
        setCurrentVideoIndex(0);
        // isLoading will be set to false by onReady handler
      } else {
        onReset();
      }
    } catch (error) {
      onReset();
    }
  };

  const handleVideoError = () => {
    if (currentVideoIndex < youtubeIds.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else {
      findNewVideo();
    }
  };

  const togglePlay = () => {
    if (playerRef.current) {
      isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
    }
  };

  const handleLike = () => {
    addLikedVideo(song.id, youtubeIds[currentVideoIndex]);
    setLiked(true);
  };

  const handleDislike = () => {
    addDislikedVideo(song.id, youtubeIds[currentVideoIndex]);
    if (currentVideoIndex < youtubeIds.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else {
      findNewVideo();
    }
  };

  const opts: YouTubeProps['opts'] = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 1,
      controls: 1,
      playsinline: 1,
      modestbranding: 1,
      rel: 0
    }
  };

  const adjustOffset = (amount: number) => {
    setOffset(parseFloat((offset + amount).toFixed(1)));
  };

  const handleTapToSync = () => {
    if (lyrics.length > 0) {
      const newOffset = lyrics[0].time - currentTime;
      setOffset(newOffset);
    }
  };

  if (currentVideoIndex >= youtubeIds.length) {
    return (
      <div className="flex flex-col h-full max-w-3xl mx-auto p-4 gap-4 animate-fade-in text-white items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500">Erro</h2>
          <p className="text-gray-300">Nenhum vídeo do YouTube disponível para esta música.</p>
          <button
            onClick={onReset}
            className="mt-4 text-sm text-gray-400 hover:text-white underline whitespace-nowrap ml-2"
          >
            Nova Busca
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto py-4 gap-4 animate-fade-in text-white">
      {/* Floating Buttons */}
      <div className="fixed inset-y-0 left-0 flex items-center z-50">
        <button
          onClick={togglePlay}
          className="bg-yellow-500 text-black rounded-r-full p-3 m-4 shadow-lg transform transition-transform hover:scale-110"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
      </div>
      {!isPlayerVisible && (
        <div className="fixed inset-y-0 right-0 flex items-center z-50">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-gray-800 text-white rounded-l-full p-3 m-4 shadow-lg transform transition-transform hover:scale-110"
          >
            <ArrowUp size={24} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/5 px-4">
        <div className="flex items-center gap-4">
          <img src={song.coverUrl} className="w-16 h-16 rounded-lg shadow-lg object-cover" alt="Cover" />
          <div>
            <h2 className="text-xl font-bold leading-tight line-clamp-1">{song.title}</h2>
            <p className="text-gray-300 text-sm line-clamp-1">{song.artist}</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-gray-400 hover:text-white underline whitespace-nowrap ml-2"
        >
          Nova Busca
        </button>
      </div>

      <div ref={playerContainerRef} className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative border border-gray-800 px-4">
        <YouTubeShim
          key={youtubeIds[currentVideoIndex]}
          videoId={youtubeIds[currentVideoIndex]}
          className="absolute inset-0 w-full h-full"
          iframeClassName="w-full h-full"
          onReady={(e: any) => {
            playerRef.current = e.target;
          }}
          onStateChange={(e: any) => setIsPlaying(e.data === 1)}
          onError={handleVideoError}
          opts={opts}
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <button onClick={handleLike} className={`p-2 rounded-full transition-colors ${liked ? 'bg-green-500 text-white' : 'bg-white/20 text-gray-300 hover:bg-green-500'}`}>
            <ThumbsUp size={20} />
          </button>
          <button onClick={handleDislike} className="p-2 rounded-full bg-white/20 text-gray-300 hover:bg-red-500 transition-colors">
            <ThumbsDown size={20} />
          </button>
        </div>
      </div>

      {/* Controles de Sincronia Manual */}
      <div className="bg-gray-800/80 p-4 rounded-xl shadow-lg border-t-2 border-yellow-500/50 backdrop-blur px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-3">
          <span className="text-gray-400 text-sm uppercase tracking-widest">
            Sync Offset: <span className="text-yellow-400 font-bold">{offset > 0 ? '+' : ''}{offset.toFixed(1)}s</span>
          </span>
          <div className="flex items-center justify-center grow">
            <button onClick={handleTapToSync} className="px-4 py-2 rounded-md text-sm font-bold bg-blue-500 text-white">
              Tap to Sync
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => adjustOffset(-0.1)} className="px-3 py-1 bg-gray-700 rounded-md text-sm hover:bg-gray-600">-0.1s</button>
            <button onClick={() => setOffset(0)} className="px-3 py-1 bg-yellow-500 text-black rounded-md text-sm hover:bg-yellow-400">Reset</button>
            <button onClick={() => adjustOffset(0.1)} className="px-3 py-1 bg-gray-700 rounded-md text-sm hover:bg-gray-600">+0.1s</button>
          </div>
        </div>
        <input
          type="range"
          min="-40" max="40" step="0.1"
          value={offset}
          onChange={(e) => setOffset(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400 transition-colors"
        />
      </div>

      {/* Área da Letra (Lyrics) */}
      <div className="flex-1 overflow-hidden relative bg-black/40 rounded-xl border border-white/10 lyrics-scroll">
        <div className="h-full overflow-y-auto overflow-x-hidden p-8 text-center space-y-8 scroll-smooth">
          {lyrics.length > 0 ? lyrics.map((line, i) => (
            <p
              key={line.id}
              id={line.id}
              className={clsx(
                "transition-all duration-300 text-xl md:text-3xl font-medium cursor-pointer select-none",
                i === activeIndex
                  ? "text-yellow-400 scale-110 font-bold drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                  : "text-gray-600 blur-[1px] hover:text-gray-400 hover:blur-0"
              )}
              onClick={() => playerRef.current?.seekTo(line.time - offset, true)}
            >
              {line.text}
            </p>
          )) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 opacity-50">
              <span className="text-4xl">🎵</span>
              <p>Instrumental sem letra sincronizada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};