import { useState, useEffect } from 'react';
import { X, Frown } from 'lucide-react';
import { getAllDislikedVideos, removeDislikedVideo } from 'services/videoPreferences';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [dislikedVideos, setDislikedVideos] = useState<{ songId: string; videoId: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDislikedVideos(getAllDislikedVideos());
    }
  }, [isOpen]);

  const handleRemove = (songId: string, videoId: string) => {
    removeDislikedVideo(songId, videoId);
    setDislikedVideos(dislikedVideos.filter(v => v.videoId !== videoId || v.songId !== songId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl shadow-yellow-500/10">
        <header className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-2xl font-bold text-yellow-500">Vídeos bloqueados</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </header>
        
        <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500/50 scrollbar-track-white/10">
          {dislikedVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-gray-400 py-12">
              <Frown className="w-16 h-16 mb-4" />
              <h3 className="text-xl font-semibold">Nenhum vídeo bloqueado</h3>
              <p className="mt-2 max-w-sm">Quando você bloquear um vídeo que não gosta, ele aparecerá aqui para que você possa desbloqueá-lo mais tarde.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {dislikedVideos.map(({ songId, videoId }) => (
                <li
                  key={`${songId}-${videoId}`}
                  className="bg-white/5 p-4 rounded-lg flex items-center justify-between transition-colors hover:bg-white/10"
                >
                  <div className="font-mono text-sm overflow-hidden">
                    <p className="text-gray-400 truncate">
                      <span className="text-yellow-500 font-semibold">Song ID:</span> {songId}
                    </p>
                    <p className="text-gray-400 truncate">
                      <span className="text-yellow-500 font-semibold">Video ID:</span> {videoId}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(songId, videoId)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-semibold"
                  >
                    Desbloquear
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="p-4 border-t border-white/10 text-center">
            <p className="text-xs text-gray-500">
                A ID da música é exibida para referência. O bloqueio é por vídeo.
            </p>
        </footer>
      </div>
    </div>
  );
}