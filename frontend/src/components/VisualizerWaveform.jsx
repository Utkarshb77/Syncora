import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../contexts/PlayerContext';

/**
 * Waveform visualizer.
 * - For procedural (generative) engine: reads real FFT data from the Web Audio analyser.
 * - For stream engine: iTunes previews can't be routed through Web Audio (CORS),
 *   so we render an animated CSS-based waveform that pulses when playing.
 */
export default function VisualizerWaveform() {
  const ref = useRef(null);
  const rafRef = useRef(null);
  const { analyserRef, isPlaying, engine } = usePlayer();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 168, H = 22;
    canvas.width = W; canvas.height = H;
    const BARS = 28;

    const an = (engine === 'generative') ? analyserRef.current : null;
    const data = an ? new Uint8Array(an.frequencyBinCount) : null;
    let frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (an && isPlaying && data) {
        // Real FFT
        an.getByteFrequencyData(data);
        const step = Math.floor(data.length / BARS);
        for (let i = 0; i < BARS; i++) {
          const v = data[i * step] / 255;
          const h = Math.max(2, v * H);
          ctx.fillStyle = `rgba(245,158,11,${0.35 + v * 0.65})`;
          ctx.beginPath();
          ctx.roundRect((i * (W / BARS)), (H - h) / 2, (W / BARS) - 2, h, 2);
          ctx.fill();
        }
      } else if (isPlaying) {
        // Animated bars for stream / no analyser
        frame++;
        for (let i = 0; i < BARS; i++) {
          const wave = Math.sin((i / BARS) * Math.PI * 2 + frame * 0.08) * 0.4 + 0.6;
          const noise = Math.sin(frame * 0.15 + i * 1.3) * 0.2;
          const v = Math.max(0.08, Math.min(1, wave + noise));
          const h = Math.max(2, v * H);
          const alpha = 0.25 + v * 0.55;
          ctx.fillStyle = `rgba(245,158,11,${alpha})`;
          ctx.beginPath();
          ctx.roundRect((i * (W / BARS)), (H - h) / 2, (W / BARS) - 2, h, 2);
          ctx.fill();
        }
      } else {
        // Idle flat line
        for (let i = 0; i < BARS; i++) {
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.beginPath();
          ctx.roundRect((i * (W / BARS)), H / 2 - 1, (W / BARS) - 2, 2, 1);
          ctx.fill();
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyserRef, isPlaying, engine]);

  return <canvas ref={ref} className="rounded opacity-90" />;
}
