import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Play, Pause, Loader2, Sparkles, Radio, Music2, AlertCircle, Heart, Plus, ListMusic } from 'lucide-react';
import { useMood } from '../contexts/MoodContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useUI } from '../contexts/UIContext';
import { api } from '../utils/api';
import { formatTime } from '../utils/moods';
import AddToPlaylistModal from '../components/AddToPlaylistModal';

const FALLBACK = [
  { id: 'gen_calm', title: 'Calm Aurora Wave', artist: 'Syncora Generative', album: 'Procedural', duration: 240, isGenerative: true, artwork: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600' },
  { id: 'gen_focus', title: 'Deep Focus Matrix', artist: 'Syncora Generative', album: 'Procedural', duration: 300, isGenerative: true, artwork: 'https://images.unsplash.com/photo-1515462277126-270d878326e5?w=600' },
  { id: 'gen_chill', title: 'Midnight Drift', artist: 'Syncora Generative', album: 'Procedural', duration: 280, isGenerative: true, artwork: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600' },
];

function TrackCard({ track, isPlaying, isCurrent, onPlay, onAddToPlaylist, liked, onLike }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden
        ${isCurrent ? 'border-amber-400/50 shadow-lg shadow-amber-500/10' : 'border-white/5 hover:border-white/15'}`}
      style={{ background: isCurrent ? 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(236,72,153,0.06))' : 'rgba(255,255,255,0.025)' }}
    >
      {/* Artwork */}
      <div className="relative aspect-square overflow-hidden bg-white/5 cursor-pointer" onClick={onPlay}>
        {track.artwork && !imgErr ? (
          <img src={track.artwork} alt="" onError={() => setImgErr(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 className="w-8 h-8 text-slate-600" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}
          >
            {isCurrent && isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
          </div>
        </div>

        {/* Badges */}
        {track.isGenerative && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-900/60 text-purple-200 text-[9px] flex items-center gap-1 backdrop-blur-sm">
            <Radio className="w-2.5 h-2.5" /> AI
          </div>
        )}

        {/* Now playing bars */}
        {isCurrent && isPlaying && (
          <div className="absolute bottom-2 right-2 flex items-end gap-0.5 h-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="w-1 rounded-full bg-amber-400"
                style={{ height: `${n * 30 + 20}%`, animation: `nowPlaying ${0.5 + n * 0.2}s ease-in-out infinite alternate` }} />
            ))}
          </div>
        )}

        {/* Action buttons on hover */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={(e) => { e.stopPropagation(); onLike?.(); }}
            className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${liked ? 'bg-rose-500 text-white' : 'bg-black/40 text-slate-300 hover:bg-rose-500/60 hover:text-white'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddToPlaylist?.(); }}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm text-slate-300 hover:bg-white/20 hover:text-white transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 cursor-pointer" onClick={onPlay}>
        <div className="font-semibold text-sm truncate leading-tight text-slate-100">{track.title}</div>
        <div className="text-xs text-slate-400 truncate mt-0.5">{track.artist}</div>
        <div className="text-[10px] text-slate-600 mt-2 flex items-center justify-between">
          <span className="truncate mr-1">{track.album}</span>
          <span className="tabular-nums shrink-0">{formatTime(track.duration)}</span>
        </div>
      </div>
    </div>
  );
}


export default function Discover({ searchQuery }) {
  const { currentMood, theme } = useMood();
  const { playTrack, toggle, setQueue, playingTrack, isPlaying } = usePlayer();
  const { notify, openAddToPlaylist } = useUI();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState(null);
  const [liked, setLiked] = useState({});
  const [addModal, setAddModal] = useState(null);

  const load = useCallback(async (q) => {
    setLoading(true); setFetchErr(null);
    try {
      const { results } = await api.searchMusic(q);
      const proc = {
        id: `gen_${currentMood}_${Date.now()}`,
        title: `${currentMood} Aurora Wave`, artist: 'Syncora Generative',
        album: 'Procedural Engine', duration: 240, isGenerative: true,
        artwork: `https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600`,
      };
      const all = [proc, ...(results.length ? results : FALLBACK)];
      setTracks(all); setQueue(all);
    } catch {
      setFetchErr('Could not reach the music API. Showing offline tracks.');
      setTracks(FALLBACK); setQueue(FALLBACK);
    } finally { setLoading(false); }
  }, [currentMood, setQueue]);

  useEffect(() => { load(searchQuery || theme.defaultSearch); }, [searchQuery, theme.defaultSearch, load]);

  const handlePlay = (track) => {
    if (playingTrack?.id === track.id) toggle();
    else playTrack(track);
  };

  const toggleLike = (id) => {
    setLiked(p => ({ ...p, [id]: !p[id] }));
    notify(liked[id] ? 'Removed from liked' : '❤️ Added to liked');
  };

  return (
    <div className="space-y-8">
      {addModal && <AddToPlaylistModal track={addModal} onClose={() => setAddModal(null)} />}

      {/* Hero banner */}
      <div className="rounded-3xl p-8 border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 rounded-3xl" style={{ background: `linear-gradient(135deg, ${theme.hex}, #ec4899)` }} />
        {/* Animated bars decoration */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-end gap-1 h-16 opacity-30">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-1.5 rounded-full"
              style={{ background: theme.hex, height: `${25 + Math.sin(i * 0.8) * 60}%`, animation: `eqBar ${0.5 + i * 0.12}s ease-in-out infinite alternate` }} />
          ))}
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 mb-3">
            <Sparkles className="w-3 h-3" />
            <span>Mood · {currentMood}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2 leading-tight">{theme.tagline}</h1>
          <p className="text-sm text-slate-400">
            Showing results for <span className="text-slate-200">"{searchQuery || theme.defaultSearch}"</span>
            {tracks.length > 0 && <span className="ml-2 text-slate-600">· {tracks.length} tracks</span>}
          </p>
        </div>
      </div>

      {fetchErr && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{fetchErr}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/5 overflow-hidden animate-pulse">
              <div className="aspect-square bg-white/5" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-white/5 rounded w-3/4" />
                <div className="h-2 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tracks.map(t => (
            <TrackCard key={t.id} track={t}
              isCurrent={playingTrack?.id === t.id}
              isPlaying={isPlaying}
              liked={!!liked[t.id]}
              onPlay={() => handlePlay(t)}
              onLike={() => toggleLike(t.id)}
              onAddToPlaylist={() => openAddToPlaylist(t)}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes nowPlaying { from{height:20%} to{height:100%} }
        @keyframes eqBar { from{transform:scaleY(0.3)} to{transform:scaleY(1)} }
      `}</style>
    </div>
  );
}
