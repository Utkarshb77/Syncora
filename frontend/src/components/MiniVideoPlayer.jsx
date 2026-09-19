import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, Youtube, Loader2, ExternalLink } from 'lucide-react';
import { api } from '../utils/api';

export default function MiniVideoPlayer({ track, onClose }) {
  const [videoId, setVideoId]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos]           = useState({ x: 16, y: null }); // null y = bottom-anchored
  const dragRef  = useRef(null);
  const isDragging = useRef(false);
  const dragStart  = useRef({});

  useEffect(() => {
    if (!track) return;
    setLoading(true);
    setError(null);
    setVideoId(null);
    api.getYouTubeId(track.title, track.artist)
      .then(({ videoId }) => {
        if (videoId) setVideoId(videoId);
        else setError('No video found for this track.');
      })
      .catch(() => setError('Could not load video.'))
      .finally(() => setLoading(false));
  }, [track?.title, track?.artist]);

  // Drag logic
  const onMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('iframe')) return;
    isDragging.current = true;
    dragStart.current = {
      mx: e.clientX, my: e.clientY,
      ox: dragRef.current.offsetLeft,
      oy: dragRef.current.offsetTop,
    };
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      setPos({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.title} ${track.artist} official music video`)}`;

  const style = {
    position: 'fixed',
    left: `${pos.x}px`,
    zIndex: 60,
    ...(pos.y !== null ? { top: `${pos.y}px` } : { bottom: '96px' }),
    cursor: 'grab',
    userSelect: 'none',
  };

  return (
    <div
      ref={dragRef}
      style={style}
      onMouseDown={onMouseDown}
      className="w-72 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
    >
      {/* Solid background so it's always readable */}
      <div style={{ background: 'rgba(8,10,18,0.97)', backdropFilter: 'blur(24px)' }}>

        {/* Header bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 cursor-grab">
          <div className="w-5 h-5 rounded-md bg-red-600/20 flex items-center justify-center shrink-0">
            <Youtube className="w-3 h-3 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-100 truncate">{track.title}</div>
            <div className="text-[10px] text-slate-500 truncate">{track.artist}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a href={ytUrl} target="_blank" rel="noopener noreferrer"
              className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              title="Open on YouTube">
              <ExternalLink className="w-3 h-3" />
            </a>
            <button onClick={() => setMinimized(!minimized)}
              className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              {minimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
            <button onClick={onClose}
              className="w-6 h-6 rounded-md hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Video area */}
        {!minimized && (
          <div className="relative" style={{ aspectRatio: '16/9' }}>
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50">
                <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
                <span className="text-[11px] text-slate-400">Finding video…</span>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                <Youtube className="w-8 h-8 text-red-400/40" />
                <p className="text-xs text-slate-400 text-center">{error}</p>
                <a href={ytUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#ff0000,#cc0000)' }}>
                  <Youtube className="w-3 h-3" /> Search on YouTube
                </a>
              </div>
            )}

            {videoId && !loading && (
              <iframe
                key={videoId}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={`${track.title} - ${track.artist}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
                style={{ display: 'block' }}
              />
            )}
          </div>
        )}

        {/* Minimized footer */}
        {minimized && (
          <div className="px-3 py-2 text-[10px] text-slate-500">
            Video minimized · click ↑ to expand
          </div>
        )}
      </div>
    </div>
  );
}