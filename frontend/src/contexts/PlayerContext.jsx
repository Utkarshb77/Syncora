import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { getSeed } from '../utils/moods';
import { api } from '../utils/api';

const PlayerContext = createContext(null);
export const usePlayer = () => useContext(PlayerContext);

export function PlayerProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const v = localStorage.getItem('syncora_volume');
    return v != null ? parseFloat(v) : 0.85;
  });
  const [muted, setMuted] = useState(false);
  const [engine, setEngine] = useState('youtube');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [showVideo, setShowVideo] = useState(false);

  // ── Stable refs so callbacks NEVER go stale ──────────────────────────
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(0.85);
  const mutedRef = useRef(false);
  const engineRef = useRef('youtube');
  const playingTrackRef = useRef(null);
  const queueRef = useRef([]);
  const errorTimerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const progressTimerRef = useRef(null);

  // Procedural synth refs
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const masterGainRef = useRef(null);
  const synthIntervalRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const nextChordRef = useRef(0);

  // Keep refs in sync with state every render
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { engineRef.current = engine; }, [engine]);
  useEffect(() => { playingTrackRef.current = playingTrack; }, [playingTrack]);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  // Persist volume; sync to active audio or YT player
  useEffect(() => {
    localStorage.setItem('syncora_volume', String(volume));
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        muted ? 0 : volume * 0.85, ctxRef.current.currentTime
      );
    }
    if (ytPlayerRef.current && ytReadyRef.current) {
      try {
        ytPlayerRef.current.setVolume(muted ? 0 : Math.round(volume * 100));
        if (muted) ytPlayerRef.current.mute();
        else ytPlayerRef.current.unMute();
      } catch {}
    }
  }, [volume, muted]);

  const showError = (msg) => {
    setError(msg);
    clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 4000);
  };

  // ── Web Audio ─────────────────────────────────────────────────────────
  const initWebAudio = () => {
    if (ctxRef.current) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const an = ctx.createAnalyser();
    an.fftSize = 256;
    an.connect(ctx.destination);
    ctxRef.current = ctx;
    analyserRef.current = an;
  };

  const resumeCtx = async () => {
    if (ctxRef.current?.state === 'suspended')
      await ctxRef.current.resume().catch(() => {});
  };

  // ── Procedural synth ─────────────────────────────────────────────────
  const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  const stopProcedural = () => {
    clearInterval(synthIntervalRef.current);
    oscillatorsRef.current.forEach(o => { try { o.stop(); } catch {} });
    oscillatorsRef.current = [];
    masterGainRef.current = null;
  };

  const startProcedural = (track) => {
    initWebAudio();
    if (!ctxRef.current) return;
    resumeCtx();
    stopProcedural();
    const ctx = ctxRef.current;
    const master = ctx.createGain();
    master.gain.setValueAtTime(mutedRef.current ? 0 : volumeRef.current * 0.85, ctx.currentTime);
    master.connect(analyserRef.current ?? ctx.destination);
    masterGainRef.current = master;

    const delay = ctx.createDelay(); delay.delayTime.value = 0.38;
    const fb = ctx.createGain(); fb.gain.value = 0.4;
    delay.connect(fb); fb.connect(delay); delay.connect(master);

    const seed = getSeed((track?.id ?? '') + (track?.title ?? '') + (track?.artist ?? ''));
    const tempo = 65 + (seed % 45);
    const step = (60 / tempo) * 4;
    const roots = [48, 50, 52, 53, 55, 57, 59];
    const base = roots[seed % roots.length];
    const scales = [[0, 2, 4, 7, 9], [0, 3, 5, 7, 10], [0, 2, 3, 5, 7, 9, 10], [0, 2, 4, 6, 7, 9, 11]];
    const scale = scales[seed % scales.length];
    const mkChord = (d) => { const r = base + scale[d % scale.length]; return [r, r + 4, r + 7, r + 11]; };
    const chords = [mkChord(seed % 5), mkChord((seed + 3) % 5), mkChord((seed + 1) % 5), mkChord((seed + 4) % 5)];

    nextChordRef.current = ctx.currentTime + 0.1;
    let i = 0;
    const schedule = () => {
      while (nextChordRef.current < ctx.currentTime + 0.3) {
        const t = Math.max(ctx.currentTime, nextChordRef.current);
        const notes = chords[i % chords.length];
        notes.forEach(m => {
          const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
          o.type = ['sawtooth', 'triangle', 'sine'][seed % 3];
          o.frequency.setValueAtTime(midiToFreq(m - 12), t);
          o.detune.setValueAtTime((Math.random() - 0.5) * 10, t);
          f.type = 'lowpass';
          f.frequency.setValueAtTime(700, t);
          f.frequency.exponentialRampToValueAtTime(1400, t + step * 0.4);
          f.frequency.exponentialRampToValueAtTime(500, t + step - 0.4);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.22, t + 0.8);
          g.gain.setValueAtTime(0.22, t + step - 1.0);
          g.gain.exponentialRampToValueAtTime(0.0001, t + step);
          o.connect(f); f.connect(g); g.connect(master);
          o.start(t); o.stop(t + step + 0.05);
          oscillatorsRef.current.push(o);
        });
        const b = ctx.createOscillator(), bg = ctx.createGain();
        b.type = 'sine';
        b.frequency.setValueAtTime(midiToFreq(notes[0] - 24), t);
        bg.gain.setValueAtTime(0.0001, t); bg.gain.linearRampToValueAtTime(0.4, t + 0.4);
        bg.gain.setValueAtTime(0.4, t + step - 0.4);
        bg.gain.exponentialRampToValueAtTime(0.0001, t + step);
        b.connect(bg); bg.connect(master); b.start(t); b.stop(t + step);
        oscillatorsRef.current.push(b);
        i++;
        nextChordRef.current += step;
      }
    };
    synthIntervalRef.current = setInterval(schedule, 100);
    setIsPlaying(true);
    engineRef.current = 'generative';
    setEngine('generative');
  };

  // ── Stop all audio sources ────────────────────────────────────────────
  const stopAllPlayback = () => {
    clearInterval(progressTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    if (ytPlayerRef.current && ytReadyRef.current) {
      try { ytPlayerRef.current.stopVideo(); } catch {}
    }
    stopProcedural();
  };

  // ── YouTube Player Lifecycle ─────────────────────────────────────────
  const initYouTubePlayer = (videoId) => {
    return new Promise((resolve) => {
      const startPlayer = () => {
        const container = document.getElementById('syncora-yt-iframe');
        if (!container || !window.YT || !window.YT.Player) {
          resolve(false);
          return;
        }

        if (ytPlayerRef.current && ytReadyRef.current) {
          try {
            ytPlayerRef.current.loadVideoById(videoId);
            ytPlayerRef.current.playVideo();
            resolve(true);
            return;
          } catch {
            ytPlayerRef.current = null;
            ytReadyRef.current = false;
          }
        }

        try {
          ytPlayerRef.current = new window.YT.Player('syncora-yt-iframe', {
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
            },
            events: {
              onReady: (event) => {
                ytReadyRef.current = true;
                event.target.setVolume(mutedRef.current ? 0 : Math.round(volumeRef.current * 100));
                if (mutedRef.current) event.target.mute();
                event.target.playVideo();
                resolve(true);
              },
              onStateChange: (event) => {
                // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
                if (event.data === 1) {
                  setIsPlaying(true);
                  setLoading(false);
                  const dur = event.target.getDuration();
                  if (dur && dur > 0) setDuration(dur);
                } else if (event.data === 2) {
                  setIsPlaying(false);
                } else if (event.data === 0) {
                  setIsPlaying(false);
                  const q = queueRef.current;
                  const cur = playingTrackRef.current;
                  const idx = q.findIndex(t => t.id === cur?.id);
                  if (idx !== -1 && q.length > 1) {
                    playTrack(q[(idx + 1) % q.length]);
                  }
                } else if (event.data === 3) {
                  setLoading(true);
                }
              },
              onError: () => {
                showError('YouTube playback failed — trying fallback preview.');
                resolve(false);
              },
            },
          });
        } catch {
          resolve(false);
        }
      };

      if (window.YT && window.YT.Player) {
        startPlayer();
      } else {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prev) prev();
          startPlayer();
        };
        setTimeout(() => resolve(false), 3000);
      }
    });
  };

  // ── Polling progress for YouTube player ────────────────────────────────
  useEffect(() => {
    if (isPlaying && engine === 'youtube') {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = setInterval(() => {
        if (ytPlayerRef.current && ytReadyRef.current) {
          try {
            const cur = ytPlayerRef.current.getCurrentTime();
            const dur = ytPlayerRef.current.getDuration();
            if (dur && dur > 0 && isFinite(dur)) setDuration(dur);
            if (cur != null && isFinite(cur)) setProgress(cur);
          } catch {}
        }
      }, 350);
    } else {
      clearInterval(progressTimerRef.current);
    }
    return () => clearInterval(progressTimerRef.current);
  }, [isPlaying, engine]);

  // ── Play Fallback Stream (Audio element) ──────────────────────────────
  const playFallbackStream = (track) => {
    if (!track.previewUrl) {
      setEngine('generative');
      engineRef.current = 'generative';
      startProcedural(track);
      return;
    }

    setEngine('stream');
    engineRef.current = 'stream';
    setLoading(true);
    setIsPlaying(false);

    const newAudio = new Audio();
    newAudio.volume = mutedRef.current ? 0 : volumeRef.current;
    newAudio.src = track.previewUrl;
    newAudio.preload = 'auto';
    audioRef.current = newAudio;

    newAudio.addEventListener('play', () => setIsPlaying(true));
    newAudio.addEventListener('pause', () => setIsPlaying(false));
    newAudio.addEventListener('ended', () => {
      setIsPlaying(false);
      const q = queueRef.current;
      const cur = playingTrackRef.current;
      const idx = q.findIndex(t => t.id === cur?.id);
      if (idx !== -1 && q.length > 1) playTrack(q[(idx + 1) % q.length]);
    });
    newAudio.addEventListener('timeupdate', () => setProgress(newAudio.currentTime));
    newAudio.addEventListener('durationchange', () => {
      const d = newAudio.duration;
      if (d && isFinite(d) && d > 1) setDuration(d);
    });
    newAudio.addEventListener('canplay', () => setLoading(false));
    newAudio.addEventListener('error', () => {
      showError('Preview unavailable — switching to generative mode.');
      setEngine('generative');
      engineRef.current = 'generative';
      startProcedural(playingTrackRef.current ?? track);
      setLoading(false);
    });

    newAudio.play().catch(() => {
      setEngine('generative');
      engineRef.current = 'generative';
      startProcedural(track);
    }).finally(() => {
      setLoading(false);
    });
  };

  // ── Main PlayTrack Function ──────────────────────────────────────────
  const playTrack = useCallback(async (track) => {
    if (!track) return;

    stopAllPlayback();
    setError(null);
    setProgress(0);
    setDuration(track.duration || 210);
    setPlayingTrack(track);
    playingTrackRef.current = track;

    initWebAudio();
    await resumeCtx();

    // Generative track
    if (track.isGenerative) {
      setEngine('generative');
      engineRef.current = 'generative';
      startProcedural(track);
      return;
    }

    // Attempt Full Song Playback via YouTube
    setLoading(true);
    setIsPlaying(false);

    try {
      const { videoId } = await api.getYouTubeId(track.title, track.artist);
      if (videoId) {
        setCurrentVideoId(videoId);
        setEngine('youtube');
        engineRef.current = 'youtube';
        const ok = await initYouTubePlayer(videoId);
        if (ok) {
          setIsPlaying(true);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('[Player] YouTube resolve failed, using preview fallback:', err);
    }

    // Fallback: iTunes preview clip
    playFallbackStream(track);
  }, []);

  // ── Toggle Play / Pause ──────────────────────────────────────────────
  const toggle = useCallback(async () => {
    const eng = engineRef.current;
    const playing = isPlayingRef.current;
    const track = playingTrackRef.current;
    if (!track) return;

    if (eng === 'generative') {
      if (playing) { stopProcedural(); setIsPlaying(false); }
      else { initWebAudio(); await resumeCtx(); startProcedural(track); }
      return;
    }

    if (eng === 'youtube') {
      if (ytPlayerRef.current && ytReadyRef.current) {
        try {
          if (playing) {
            ytPlayerRef.current.pauseVideo();
            setIsPlaying(false);
          } else {
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
          }
        } catch {}
      }
      return;
    }

    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      try {
        await resumeCtx();
        await a.play();
        setIsPlaying(true);
      } catch (e) {
        if (e.name !== 'AbortError') showError('Playback failed.');
      }
    }
  }, []);

  // ── Seek ─────────────────────────────────────────────────────────────
  const seek = useCallback((t) => {
    setProgress(t);
    const eng = engineRef.current;
    if (eng === 'youtube' && ytPlayerRef.current && ytReadyRef.current) {
      try { ytPlayerRef.current.seekTo(t, true); } catch {}
    } else if (eng === 'stream' && audioRef.current) {
      audioRef.current.currentTime = t;
    }
  }, []);

  const next = useCallback(() => {
    const q = queueRef.current;
    const cur = playingTrackRef.current;
    if (!q.length) return;
    const idx = q.findIndex(t => t.id === cur?.id);
    playTrack(q[(idx + 1) % q.length]);
  }, [playTrack]);

  const prev = useCallback(() => {
    const q = queueRef.current;
    const cur = playingTrackRef.current;
    if (!q.length) return;
    const idx = q.findIndex(t => t.id === cur?.id);
    playTrack(q[(idx - 1 + q.length) % q.length]);
  }, [playTrack]);

  return (
    <PlayerContext.Provider value={{
      queue, setQueue,
      playingTrack, isPlaying, progress, duration,
      volume, setVolume, muted, setMuted,
      engine, loading, error, isFullSong: engine === 'youtube',
      currentVideoId, showVideo, setShowVideo,
      analyserRef, streamAnalyserActive: engine === 'stream',
      playTrack, toggle, seek, next, prev,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}
