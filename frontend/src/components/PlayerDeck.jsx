import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2, Radio, Music2, Youtube, ExternalLink, Tv2, X, ListMusic, Plus } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { useUI } from '../contexts/UIContext';
import { formatTime } from '../utils/moods';
import VisualizerWaveform from './VisualizerWaveform';

export default function PlayerDeck() {
  const { openAddToPlaylist } = useUI();
  const {
    playingTrack, isPlaying, progress, duration, volume, setVolume,
    muted, setMuted, toggle, next, prev, seek, engine, loading, error,
    currentVideoId, showVideo, setShowVideo,
  } = usePlayer();

  const openYouTube = () => {
    if (!playingTrack) return;
    const q = encodeURIComponent(`${playingTrack.title} ${playingTrack.artist} official music video`);
    window.open(`https://www.youtube.com/results?search_query=${q}`, '_blank');
  };

  const safeDuration = duration > 0 ? duration : (playingTrack?.duration || 210);
  const pct = Math.min(100, (progress / safeDuration) * 100);

  return (
    <>
      {/* ── Docked YouTube Player Frame ── */}
      {/* Always kept in DOM so background playback doesn't get destroyed on toggle */}
      <div
        className={`fixed z-40 transition-all duration-300 ${
          showVideo && engine === 'youtube' && currentVideoId
            ? 'bottom-24 right-6 w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl border border-white/10 opacity-100 scale-100 pointer-events-auto'
            : 'bottom-0 left-0 w-1 h-1 opacity-0 pointer-events-none'
        }`}
        style={{ background: 'rgba(8,10,18,0.95)', backdropFilter: 'blur(20px)' }}
      >
        {showVideo && (
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-2 min-w-0">
              <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="text-xs font-medium text-slate-200 truncate">{playingTrack?.title}</span>
            </div>
            <button
              onClick={() => setShowVideo(false)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="relative aspect-video w-full bg-black">
          <div id="syncora-yt-iframe" className="w-full h-full" />
        </div>
      </div>

      {!playingTrack ? (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/5"
          style={{ background: 'rgba(10,12,20,0.85)', backdropFilter: 'blur(24px)' }}
        >
          <div className="flex items-center justify-center gap-3 px-6 py-4 text-sm text-slate-500">
            <Music2 className="w-4 h-4 opacity-40" />
            Pick a track from Discover to start listening.
          </div>
        </div>
      ) : (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/5"
          style={{ background: 'rgba(10,12,20,0.92)', backdropFilter: 'blur(24px)' }}
        >
          {error && (
            <div className="px-6 py-1.5 text-xs text-amber-300 bg-amber-500/10 border-b border-amber-500/20 text-center">
              {error}
            </div>
          )}

          {/* Progress bar */}
          <div
            className="h-1 cursor-pointer relative group"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - r.left) / r.width) * safeDuration);
            }}
          >
            <div
              className="h-full transition-all duration-100"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #f59e0b, #ec4899)' }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none"
              style={{ left: `calc(${pct}% - 6px)` }}
            />
          </div>

          <div className="grid grid-cols-3 items-center px-6 py-3 gap-4">
            {/* Track info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {playingTrack.artwork ? (
                  <img
                    src={playingTrack.artwork}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover shadow-lg"
                    style={{ boxShadow: isPlaying ? '0 0 16px rgba(245,158,11,0.4)' : undefined }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                    <Music2 className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-black" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold truncate leading-tight">{playingTrack.title}</div>
                  <button
                    onClick={() => openAddToPlaylist(playingTrack)}
                    title="Add to playlist"
                    className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors shrink-0"
                  >
                    <ListMusic className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs text-slate-400 truncate mt-0.5">{playingTrack.artist}</div>
                {/* Engine badge */}
                <div className="flex items-center gap-1.5 mt-1">
                  {engine === 'youtube' && !playingTrack.isGenerative && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-500/15 border border-red-500/25 text-red-400">
                      <Youtube className="w-2.5 h-2.5" /> Full song
                    </span>
                  )}
                  {engine === 'stream' && !playingTrack.isGenerative && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                      ▶ Preview
                    </span>
                  )}
                  {engine === 'generative' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-500/15 border border-purple-500/25 text-purple-400">
                      <Radio className="w-2.5 h-2.5" /> Generative
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Controls (center) */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-4">
                <button
                  onClick={prev}
                  className="p-1.5 text-slate-400 hover:text-white transition rounded-full hover:bg-white/5"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={toggle}
                  disabled={loading}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-4 h-4 text-white" />
                  ) : (
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  )}
                </button>
                <button
                  onClick={next}
                  className="p-1.5 text-slate-400 hover:text-white transition rounded-full hover:bg-white/5"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 tabular-nums">
                <span>{formatTime(progress)}</span>
                <VisualizerWaveform />
                <span>{formatTime(safeDuration)}</span>
              </div>
            </div>

            {/* Volume & Right side controls */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => openAddToPlaylist(playingTrack)}
                title="Add to playlist"
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Playlist
              </button>
              {!playingTrack.isGenerative && engine === 'youtube' && (
                <button
                  onClick={() => setShowVideo(!showVideo)}
                  className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    showVideo
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-transparent'
                  }`}
                >
                  <Tv2 className="w-3.5 h-3.5" /> {showVideo ? 'Hide Video' : 'Watch Video'}
                </button>
              )}
              <button
                onClick={() => setMuted(!muted)}
                className="p-2 text-slate-400 hover:text-white transition rounded-full hover:bg-white/5"
              >
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="relative w-24 hidden sm:block">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setMuted(false);
                  }}
                  className="w-full volume-slider"
                  style={{ '--pct': `${(muted ? 0 : volume) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}