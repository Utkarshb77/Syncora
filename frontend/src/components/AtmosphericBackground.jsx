import React, { useEffect, useRef } from 'react';
import { useMood } from '../contexts/MoodContext';

export default function AtmosphericBackground() {
  const ref = useRef(null);
  const { theme, currentMood } = useMood();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const onR = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onR);

    const hex = theme.hex;
    const clouds = Array.from({ length: 5 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 280 + 220,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      clouds.forEach(c => {
        c.x += c.vx; c.y += c.vy;
        if (c.x < -c.r) c.x = w + c.r; if (c.x > w + c.r) c.x = -c.r;
        if (c.y < -c.r) c.y = h + c.r; if (c.y > h + c.r) c.y = -c.r;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        g.addColorStop(0, hex + '33');
        g.addColorStop(1, hex + '00');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onR); };
  }, [currentMood, theme.hex]);

  return <canvas ref={ref} className="fixed inset-0 w-full h-full pointer-events-none opacity-60 z-0" />;
}
