import { useState, useEffect } from 'react';

// Retorna uma tupla: [valor atual, função para atualizar]
export const useSyncOffset = (songId: string): [number, (val: number) => void] => {
  const [offset, setOffset] = useState<number>(0);

  // Chave única para salvar no navegador
  const storageKey = `karaoke_offset_${songId}`;

  useEffect(() => {
    // Verifica se window existe (evita erro se usar Next.js SSR)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        // Converte string para number
        setOffset(parseFloat(saved));
      } else {
        setOffset(0);
      }
    }
  }, [songId, storageKey]);

  const updateOffset = (newValue: number) => {
    setOffset(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newValue.toString());
    }
  };

  return [offset, updateOffset];
};