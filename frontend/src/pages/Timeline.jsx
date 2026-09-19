import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Clock, Music2, Smile, Filter, Plus } from 'lucide-react';
import { MOOD_THEMES } from '../utils/moods';
import { useMood } from '../contexts/MoodContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useUI } from '../contexts/UIContext';


function LogMoodPanel({ onLogged }) {
  const { currentMood, setCurrentMood, MOOD_THEMES: themes } = useMood();
  const { playingTrack } = usePlayer();
  const { notify } = useUI();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const log = async () => {
    setBusy(true);
    try {
      await api.logMood({
        mood: currentMood,
        message: note || `Feeling ${currentMood}`,
        trackName: playingTrack?.title,
        artistName: playingTrack?.artist,
        type: 'manual',
      });
      setNote('');
      notify(`Mood "${currentMood}" logged`);
      window.dispatchEvent(new CustomEvent('syncora:moodLogged'));
      onLogged?.();
    } catch (e) {
      notify(e.message || 'Could not log mood — try again');
    }
    setBusy(false);
  };

  return (
    <div className="glass rounded-2xl p-5 border border-white/5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <Smile className="w-4 h-4 text-amber-400" /> Log current mood
      </h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.keys(themes).map(m => (
          <button key={m} onClick={() => setCurrentMood(m)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${currentMood === m ? 'text-white shadow-md' : 'text-slate-400 bg-white/5 hover:text-white hover:bg-white/8'}`}
            style={currentMood === m ? { background: themes[m].hex } : {}}
          >{m}</button>
        ))}
      </div>
      {playingTrack && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 mb-3 text-xs text-slate-400">
          <Music2 className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span className="truncate">Listening to <span className="text-slate-200">{playingTrack.title}</span> · {playingTrack.artist}</span>
        </div>
      )}
      <div className="flex gap-2">
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note…"
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-sm outline-none" />
        <button onClick={log} disabled={busy}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)', color:'#fff' }}>
          {busy ? '…' : 'Log'}
        </button>
      </div>
    </div>
  );
}

export default function Timeline() {
  const [logs, setLogs]       = useState([]);
  const [filter, setFilter]   = useState('All');
  const { notify, openAddToPlaylist } = useUI();
  const moods = ['All', ...Object.keys(MOOD_THEMES)];

  const load = () => api.listMoods().then(setLogs).catch((e) => notify(e.message || 'Could not load timeline'));
  useEffect(() => { load(); }, []);
  const filtered = filter === 'All' ? logs : logs.filter(l => l.mood === filter);

  // Group by date
  const grouped = filtered.reduce((acc, l) => {
    const d = new Date(l.createdAt).toDateString();
    if (!acc[d]) acc[d] = [];
    acc[d].push(l);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-semibold flex items-center gap-3">
        <Clock className="w-7 h-7 text-amber-400" /> Timeline
      </h1>

      <LogMoodPanel onLogged={load} />

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        {moods.map(m => (
          <button key={m} onClick={() => setFilter(m)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filter === m ? 'text-white' : 'text-slate-400 bg-white/5 hover:text-white'}`}
            style={filter === m && m !== 'All' ? { background: MOOD_THEMES[m]?.hex } : filter === m ? { background: '#f59e0b' } : {}}
          >{m}</button>
        ))}
      </div>

      {/* Timeline */}
      {Object.keys(grouped).length === 0 && (
        <div className="text-slate-500 py-8 text-center">
          No mood entries yet. Log your first mood above!
        </div>
      )}

      {Object.entries(grouped).map(([date, entries]) => (
        <div key={date}>
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-white/5" />
            {date}
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="relative border-l border-white/8 pl-6 space-y-3">
            {entries.map((l, i) => {
              const mTheme = MOOD_THEMES[l.mood] || MOOD_THEMES['Calm'];
              return (
                <div key={l._id || l.id || i} className="relative group">
                  <div className="absolute -left-[29px] top-3 w-3.5 h-3.5 rounded-full ring-4 ring-black/50 transition-transform group-hover:scale-125"
                    style={{ background: mTheme.hex }} />
                  <div className="glass rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: mTheme.hex }}>
                          {l.mood}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(l.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                        </span>
                      </div>
                    </div>
                    {l.message && l.message !== `${l.type} · ${l.mood}` && (
                      <div className="text-sm text-slate-300 mt-1">{l.message}</div>
                    )}
                    {l.trackName && (
                      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 min-w-0">
                          <Music2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{l.trackName} <span className="text-slate-500">— {l.artistName}</span></span>
                        </div>
                        <button
                          onClick={() => openAddToPlaylist({
                            id: l._id || `${l.trackName}_${l.artistName}`,
                            title: l.trackName,
                            artist: l.artistName || 'Unknown Artist',
                            duration: 210,
                          })}
                          title="Add song to playlist"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all shrink-0 hover:scale-105"
                        >
                          <Plus className="w-3 h-3" /> Add to playlist
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
