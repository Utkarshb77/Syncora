import React, { useEffect, useState } from 'react';
import { ListMusic, Plus, Check, X, Loader2, Music2 } from 'lucide-react';
import { api } from '../utils/api';
import { useMood } from '../contexts/MoodContext';
import { useUI } from '../contexts/UIContext';
import { formatTime } from '../utils/moods';

export default function AddToPlaylistModal({ track, onClose }) {
  const [playlists, setPlaylists] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addedPlaylists, setAddedPlaylists] = useState({});
  const { currentMood, MOOD_THEMES } = useMood();
  const { notify } = useUI();

  useEffect(() => {
    setLoading(true);
    api.listPlaylists()
      .then(lists => {
        setPlaylists(Array.isArray(lists) ? lists : []);
        // Check which playlists already contain this track
        const alreadyIn = {};
        (lists || []).forEach(pl => {
          const exists = (pl.tracks || []).some(
            t => (t.id && track.id && t.id === track.id) ||
                 (t.title?.toLowerCase() === track.title?.toLowerCase() &&
                  t.artist?.toLowerCase() === track.artist?.toLowerCase())
          );
          if (exists) alreadyIn[pl._id || pl.id] = true;
        });
        setAddedPlaylists(alreadyIn);
      })
      .catch((e) => notify(e.message || 'Could not load playlists'))
      .finally(() => setLoading(false));
  }, [track]);

  const addToExisting = async (pl) => {
    const plId = pl._id || pl.id;
    if (addedPlaylists[plId]) return;

    setSubmitting(true);
    try {
      const updatedTracks = [...(pl.tracks || []), track];
      await api.updatePlaylist(plId, { tracks: updatedTracks });
      setAddedPlaylists(prev => ({ ...prev, [plId]: true }));
      notify(`Added "${track.title}" to "${pl.name}"`);
      setTimeout(() => onClose(), 600);
    } catch (e) {
      notify(e.message || 'Could not add to playlist');
    } finally {
      setSubmitting(false);
    }
  };

  const createNewAndAdd = async (e) => {
    if (e) e.preventDefault();
    if (!newName.trim()) return;

    setSubmitting(true);
    try {
      const pl = await api.createPlaylist({
        name: newName.trim(),
        mood: currentMood,
        tracks: [track],
      });
      notify(`✨ Created "${newName}" with "${track.title}"`);
      onClose();
    } catch (e) {
      notify(e.message || 'Could not create playlist');
    } finally {
      setSubmitting(false);
    }
  };

  if (!track) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[85vh] bg-[#0c0f1d]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <ListMusic className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-100">Add to Playlist</div>
              <div className="text-[11px] text-slate-500">Save song to your custom collections</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Song Preview Banner */}
        <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-3">
          {track.artwork ? (
            <img src={track.artwork} alt="" className="w-12 h-12 rounded-xl object-cover shadow-md shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Music2 className="w-5 h-5 text-amber-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-100 truncate">{track.title}</div>
            <div className="text-xs text-slate-400 truncate mt-0.5">{track.artist}</div>
            {track.duration && (
              <div className="text-[10px] text-slate-500 mt-1 tabular-nums">
                {formatTime(track.duration)}
              </div>
            )}
          </div>
        </div>

        {/* Playlists List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-56">
          <div className="text-xs font-semibold text-slate-400 px-1 mb-1">Your Playlists</div>
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              Loading playlists…
            </div>
          ) : playlists.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">
              No playlists found. Create your first one below!
            </div>
          ) : (
            playlists.map((pl) => {
              const plId = pl._id || pl.id;
              const isAdded = addedPlaylists[plId];
              const mTheme = MOOD_THEMES[pl.mood] || MOOD_THEMES['Calm'];

              return (
                <button
                  key={plId}
                  onClick={() => addToExisting(pl)}
                  disabled={isAdded || submitting}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isAdded
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default'
                      : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/10 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: mTheme.hex }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{pl.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {pl.tracks?.length || 0} track{pl.tracks?.length === 1 ? '' : 's'} · {pl.mood}
                      </div>
                    </div>
                  </div>

                  {isAdded ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <Check className="w-3.5 h-3.5" /> Added
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Create New Playlist Form */}
        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
          <div className="text-xs font-semibold text-slate-400 mb-2">Create New Playlist & Add</div>
          <form onSubmit={createNewAndAdd} className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="New playlist name…"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs outline-none focus:border-amber-400/50 text-slate-100 placeholder-slate-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!newName.trim() || submitting}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-white text-xs font-semibold hover:opacity-95 transition-opacity disabled:opacity-40 shrink-0"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
