import React, { useEffect, useState } from 'react';
import {
  Music,
  Plus,
  Trash2,
  Play,
  ChevronDown,
  ChevronUp,
  ListMusic,
  Search,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { api } from '../utils/api';
import { usePlayer } from '../contexts/PlayerContext';
import { useMood } from '../contexts/MoodContext';
import { useUI } from '../contexts/UIContext';
import { formatTime } from '../utils/moods';

// ── Add Songs Search Modal ─────────────────────────────────────────────
function AddSongsModal({ pl, onClose, onTrackAdded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const { playingTrack } = usePlayer();
  const { notify } = useUI();
  const { MOOD_THEMES } = useMood();
  const mTheme = MOOD_THEMES[pl.mood] || MOOD_THEMES['Calm'];

  // Initial suggested tracks based on playlist mood
  useEffect(() => {
    setLoading(true);
    api.searchMusic(pl.mood || 'top hits')
      .then(res => setResults(res.results || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [pl.mood]);

  const search = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await api.searchMusic(q);
      setResults(res.results || []);
    } catch {
      notify('Search failed — please try again');
    } finally {
      setLoading(false);
    }
  };

  const isTrackInPlaylist = (track) => {
    return (pl.tracks || []).some(
      t =>
        (t.id && track.id && t.id === track.id) ||
        (t.title?.toLowerCase() === track.title?.toLowerCase() &&
          t.artist?.toLowerCase() === track.artist?.toLowerCase())
    );
  };

  const handleAdd = async (track) => {
    const trackKey = track.id || track.title;
    setAddingId(trackKey);
    try {
      const updatedTracks = [...(pl.tracks || []), track];
      const updatedPl = await api.updatePlaylist(pl._id || pl.id, { tracks: updatedTracks });
      notify(`Added "${track.title}" to ${pl.name}`);
      onTrackAdded(updatedPl || { ...pl, tracks: updatedTracks });
    } catch (e) {
      notify(e.message || 'Could not add track');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        style={{ background: 'rgba(11, 14, 23, 0.98)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${mTheme.hex}20` }}
            >
              <ListMusic className="w-4 h-4" style={{ color: mTheme.hex }} />
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                Add Songs to "{pl.name}"
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full font-medium text-white"
                  style={{ background: mTheme.hex }}
                >
                  {pl.mood}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {pl.tracks?.length || 0} track{pl.tracks?.length === 1 ? '' : 's'} in playlist
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Add Now Playing Track */}
        {playingTrack && !isTrackInPlaylist(playingTrack) && (
          <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {playingTrack.artwork ? (
                <img
                  src={playingTrack.artwork}
                  alt=""
                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4 text-amber-400" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                  Currently Playing
                </div>
                <div className="text-xs font-medium text-slate-200 truncate">
                  {playingTrack.title} · <span className="text-slate-400">{playingTrack.artist}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleAdd(playingTrack)}
              disabled={addingId === (playingTrack.id || playingTrack.title)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-4 border-b border-white/5">
          <form
            onSubmit={e => {
              e.preventDefault();
              search(query);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search songs, artists, genres... (Press Enter)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm outline-none focus:border-white/20 transition-all text-slate-100 placeholder-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition-all disabled:opacity-40"
            >
              Search
            </button>
          </form>
        </div>

        {/* Search / Suggestions Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              Finding tracks…
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No tracks found. Type a song or artist above to search!
            </div>
          ) : (
            results.map(track => {
              const alreadyIn = isTrackInPlaylist(track);
              const isAdding = addingId === (track.id || track.title);

              return (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all"
                >
                  {track.artwork ? (
                    <img
                      src={track.artwork}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-slate-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">{track.title}</div>
                    <div className="text-xs text-slate-500 truncate">{track.artist}</div>
                  </div>

                  <div className="text-[11px] text-slate-500 tabular-nums shrink-0">
                    {formatTime(track.duration)}
                  </div>

                  <button
                    onClick={() => !alreadyIn && handleAdd(track)}
                    disabled={alreadyIn || isAdding}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shrink-0 ${alreadyIn
                        ? 'bg-white/5 text-emerald-400 border border-emerald-500/20 cursor-default'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 active:scale-95'
                      }`}
                  >
                    {alreadyIn ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Added
                      </>
                    ) : isAdding ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Add
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── View Playlist Songs Modal ──────────────────────────────────────────
function ViewPlaylistModal({ pl, onClose, onPlayTrack, onRemoveTrack, onAddSongs }) {
  const { MOOD_THEMES } = useMood();
  const mTheme = MOOD_THEMES[pl.mood] || MOOD_THEMES['Calm'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        style={{ background: 'rgba(11, 14, 23, 0.98)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${mTheme.hex}20` }}
            >
              <ListMusic className="w-4 h-4" style={{ color: mTheme.hex }} />
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                {pl.name}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                  style={{ background: mTheme.hex }}
                >
                  {pl.mood}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {pl.tracks?.length || 0} track{pl.tracks?.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onAddSongs(pl); onClose(); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Songs
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[60vh]">
          {(!pl.tracks || pl.tracks.length === 0) ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No tracks yet. Click "Add Songs" above to get started!
            </div>
          ) : (
            (pl.tracks || []).map((t, i) => (
              <div
                key={t.id || i}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all group"
              >
                <span className="text-[10px] text-slate-600 w-5 text-right shrink-0 tabular-nums">{i + 1}</span>
                {t.artwork ? (
                  <img src={t.artwork} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{t.title}</div>
                  <div className="text-xs text-slate-500 truncate">{t.artist}</div>
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums shrink-0">
                  {formatTime(t.duration)}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onPlayTrack(t)}
                    title="Play track"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveTrack(pl, t.id || t.title)}
                    title="Remove track"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Playlist Card Component ────────────────────────────────────────────
function PlaylistCard({ pl, onDelete, onPlayAll, onPlayTrack, onAddSongs, onRemoveTrack, onViewTracks }) {
  const { MOOD_THEMES } = useMood();
  const mTheme = MOOD_THEMES[pl.mood] || MOOD_THEMES['Calm'];

  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all flex flex-col justify-between">
      {/* Header bar with mood color */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${mTheme.hex}, #ec4899)` }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${mTheme.hex}20` }}
            >
              <ListMusic className="w-4.5 h-4.5" style={{ color: mTheme.hex }} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate text-slate-100">{pl.name}</div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center">
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white mr-1.5"
                  style={{ background: mTheme.hex }}
                >
                  {pl.mood}
                </span>
                {pl.tracks?.length || 0} tracks
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => onAddSongs(pl)}
              title="Add songs to this playlist"
              className="p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPlayAll(pl)}
              disabled={!pl.tracks?.length}
              title="Play playlist"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewTracks(pl)}
              title="View all tracks"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(pl._id || pl.id)}
              title="Delete playlist"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>


        {/* Preview thumbnails */}
        {pl.tracks?.length > 0 && (
          <div className="flex -space-x-2 mt-2">
            {(pl.tracks || []).slice(0, 5).map((t, i) =>
              t.artwork ? (
                <img
                  key={i}
                  src={t.artwork}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover border-2 border-black/50"
                />
              ) : (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-white/10 border-2 border-black/50 flex items-center justify-center"
                >
                  <Music className="w-3 h-3 text-slate-500" />
                </div>
              )
            )}
            {pl.tracks.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-black/50 flex items-center justify-center text-[9px] text-slate-400 font-medium">
                +{pl.tracks.length - 5}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Playlists Page Component ──────────────────────────────────────
export default function Playlists() {
  const [lists, setLists] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModalPlaylist, setActiveModalPlaylist] = useState(null);
  const [viewTracksPlaylist, setViewTracksPlaylist] = useState(null);

  const { playingTrack, playTrack, setQueue } = usePlayer();
  const { currentMood } = useMood();
  const { notify } = useUI();

  const load = () =>
    api
      .listPlaylists()
      .then(setLists)
      .catch(e => notify(e.message || 'Could not load playlists'));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const p = await api.createPlaylist({
        name,
        mood: currentMood,
        tracks: playingTrack ? [playingTrack] : [],
      });
      setLists([p, ...lists]);
      setName('');
      notify(`✨ Playlist "${name}" created`);
    } catch (e) {
      notify(e.message || 'Could not create playlist — try again');
    }
    setLoading(false);
  };

  const remove = async id => {
    try {
      await api.deletePlaylist(id);
      setLists(lists.filter(l => (l._id || l.id) !== id));
      notify('Playlist deleted');
    } catch (e) {
      notify(e.message || 'Could not delete playlist — try again');
    }
  };

  const playAll = pl => {
    if (pl.tracks?.length) {
      setQueue(pl.tracks);
      playTrack(pl.tracks[0]);
      notify(`▶ Playing "${pl.name}"`);
    }
  };

  const handleTrackAdded = updatedPl => {
    setLists(prev =>
      prev.map(l => ((l._id || l.id) === (updatedPl._id || updatedPl.id) ? updatedPl : l))
    );
    // Also keep modal state synced
    if (activeModalPlaylist && (activeModalPlaylist._id || activeModalPlaylist.id) === (updatedPl._id || updatedPl.id)) {
      setActiveModalPlaylist(updatedPl);
    }
  };

  const handleRemoveTrack = async (pl, trackIdentifier) => {
    try {
      const updatedTracks = (pl.tracks || []).filter(
        t => t.id !== trackIdentifier && t.title !== trackIdentifier
      );
      const updatedPl = await api.updatePlaylist(pl._id || pl.id, { tracks: updatedTracks });
      setLists(prev =>
        prev.map(l => ((l._id || l.id) === (pl._id || pl.id) ? (updatedPl || { ...pl, tracks: updatedTracks }) : l))
      );
      notify('Track removed from playlist');
    } catch (e) {
      notify(e.message || 'Could not remove track');
    }
  };

  const totalTracks = lists.reduce((s, l) => s + (l.tracks?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Modal for adding songs */}
      {activeModalPlaylist && (
        <AddSongsModal
          pl={activeModalPlaylist}
          onClose={() => setActiveModalPlaylist(null)}
          onTrackAdded={handleTrackAdded}
        />
      )}

      {/* Modal for viewing playlist tracks */}
      {viewTracksPlaylist && (
        <ViewPlaylistModal
          pl={viewTracksPlaylist}
          onClose={() => setViewTracksPlaylist(null)}
          onPlayTrack={playTrack}
          onRemoveTrack={(pl, tid) => { handleRemoveTrack(pl, tid); setViewTracksPlaylist(prev => prev ? { ...prev, tracks: (prev.tracks || []).filter(t => t.id !== tid && t.title !== tid) } : null); }}
          onAddSongs={setActiveModalPlaylist}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-semibold flex items-center gap-3">
          <Music className="w-7 h-7 text-amber-400" /> Playlists
        </h1>
        <div className="text-xs text-slate-500">
          {lists.length} playlist{lists.length === 1 ? '' : 's'} · {totalTracks} tracks
        </div>
      </div>

      {/* Create bar */}
      <div className="glass rounded-2xl p-4 border border-white/5">
        <div className="text-xs text-slate-500 mb-3">
          {playingTrack ? (
            <>
              Current track <span className="text-amber-400">{playingTrack.title}</span> will be added
            </>
          ) : (
            'Create a new playlist'
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()}
            placeholder="Playlist name…"
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 outline-none text-sm focus:border-white/15 transition-colors text-slate-100"
          />
          <button
            onClick={create}
            disabled={!name.trim() || loading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)', color: '#fff' }}
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <ListMusic className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <div>No playlists yet.</div>
          <div className="text-sm mt-1">Create one above to get started.</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map(pl => (
            <PlaylistCard
              key={pl._id || pl.id}
              pl={pl}
              onDelete={remove}
              onPlayAll={playAll}
              onPlayTrack={playTrack}
              onAddSongs={setActiveModalPlaylist}
              onRemoveTrack={handleRemoveTrack}
              onViewTracks={setViewTracksPlaylist}
            />
          ))}
        </div>
      )}
    </div>
  );
}

