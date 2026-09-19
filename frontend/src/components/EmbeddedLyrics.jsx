import React from 'react';
import { usePlayer } from '../contexts/PlayerContext';

const LIB = {
  default: [
    'Letting the frequencies guide us…',
    'Floating across the harmonic waves.',
    'Each note a doorway to the mood.',
    'Resonate with the present moment.',
    'Listen closely — the song knows.',
  ],
};

export default function EmbeddedLyrics() {
  const { playingTrack, progress } = usePlayer();
  if (!playingTrack) return null;
  const lines = LIB[playingTrack.title?.toLowerCase()] || LIB.default;
  const activeIdx = Math.floor((progress / Math.max(1, playingTrack.duration || 30)) * lines.length) % lines.length;

  return (
    <div className="space-y-3">
      {lines.map((l, i) => (
        <div key={i} className={`text-lg transition-all ${i === activeIdx ? 'text-white scale-105' : 'text-slate-500'}`}>
          {l}
        </div>
      ))}
    </div>
  );
}
