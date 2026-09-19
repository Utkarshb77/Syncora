import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Music2, Radio, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const FEATURES = [
  { icon: Music2,    label: 'Mood-matched music',    desc: 'Tracks curated to your emotional state' },
  { icon: Radio,     label: 'Generative audio',       desc: 'AI-composed ambient soundscapes' },
  { icon: BarChart3, label: 'Mood analytics',          desc: 'Track how your mood shifts over time' },
];

/* ── Cinematic canvas background ─────────────────────────────────────── */
function CinematicCanvas() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;

    // Floating music notes
    const NOTE_CHARS = ['♩','♪','♫','♬','𝅘𝅥𝅮'];
    const notes = Array.from({ length: 18 }, (_, i) => ({
      x:     Math.random() * 1200,
      y:     Math.random() * 800,
      vy:    -0.3 - Math.random() * 0.5,
      vx:    (Math.random() - 0.5) * 0.3,
      size:  14 + Math.random() * 22,
      alpha: 0.05 + Math.random() * 0.18,
      char:  NOTE_CHARS[i % NOTE_CHARS.length],
      phase: Math.random() * Math.PI * 2,
    }));

    // Orbiting rings
    const rings = [
      { r: 220, speed: 0.0004, dots: 8,  dotR: 3,  color: [245,158,11] },
      { r: 320, speed:-0.0003, dots: 12, dotR: 2,  color: [236,72,153] },
      { r: 420, speed: 0.0002, dots: 6,  dotR: 4,  color: [139,92,246] },
    ];

    // Waveform bars
    const BARS = 64;
    const barPhases = Array.from({ length: BARS }, () => Math.random() * Math.PI * 2);
    const barSpeeds = Array.from({ length: BARS }, () => 0.8 + Math.random() * 1.4);

    // Particle field
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      r:  1 + Math.random() * 2,
      a:  0.04 + Math.random() * 0.12,
    }));

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.016;

      /* ── Particle field ── */
      particles.forEach(p => {
        p.x = (p.x + p.vx + 1) % 1;
        p.y = (p.y + p.vy + 1) % 1;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,158,11,${p.a})`;
        ctx.fill();
      });

      /* ── Orbiting rings (centred on left panel ~30% from left) ── */
      const cx = W * 0.28, cy = H * 0.52;
      rings.forEach(ring => {
        // Ring outline (faint)
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ring.color.join(',')},0.07)`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Dots along ring
        for (let d = 0; d < ring.dots; d++) {
          const angle = t * ring.speed * 1000 + (d / ring.dots) * Math.PI * 2;
          const dx = cx + Math.cos(angle) * ring.r;
          const dy = cy + Math.sin(angle) * ring.r;
          ctx.beginPath();
          ctx.arc(dx, dy, ring.dotR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${ring.color.join(',')},0.55)`;
          ctx.fill();
          // Glow
          const grad = ctx.createRadialGradient(dx, dy, 0, dx, dy, ring.dotR * 4);
          grad.addColorStop(0, `rgba(${ring.color.join(',')},0.25)`);
          grad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(dx, dy, ring.dotR * 4, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      });

      /* ── Waveform at bottom of left panel ── */
      const wY   = H * 0.82;
      const wW   = Math.min(W * 0.46, 480);
      const wX   = cx - wW / 2;
      const bW   = (wW / BARS) * 0.6;
      const gap  = (wW / BARS) * 0.4;
      for (let b = 0; b < BARS; b++) {
        const phase  = barPhases[b] + t * barSpeeds[b];
        const height = (Math.sin(phase) * 0.5 + 0.5) * 40 + 4;
        const frac   = b / BARS;
        // gradient colour: amber → pink → violet
        const r = Math.round(245 - frac * 106);
        const g = Math.round(158 - frac * 86);
        const bC= Math.round(11  + frac * 235);
        const x = wX + b * (bW + gap);
        ctx.beginPath();
        ctx.roundRect(x, wY - height / 2, bW, height, 2);
        ctx.fillStyle = `rgba(${r},${g},${bC},0.55)`;
        ctx.fill();
      }

      /* ── Floating music notes ── */
      notes.forEach(n => {
        n.x += n.vx + Math.sin(t * 0.4 + n.phase) * 0.15;
        n.y += n.vy;
        if (n.y < -40) { n.y = H + 20; n.x = Math.random() * W; }
        ctx.save();
        ctx.globalAlpha = n.alpha * (0.7 + 0.3 * Math.sin(t * 0.8 + n.phase));
        ctx.font        = `${n.size}px serif`;
        ctx.fillStyle   = '#f59e0b';
        ctx.fillText(n.char, n.x, n.y);
        ctx.restore();
      });

      /* ── Central glowing orb ── */
      const orbR  = 90 + Math.sin(t * 0.7) * 10;
      const gOrb  = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR);
      gOrb.addColorStop(0,   'rgba(245,158,11,0.18)');
      gOrb.addColorStop(0.5, 'rgba(236,72,153,0.08)');
      gOrb.addColorStop(1,   'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = gOrb;
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/* ── Animated equalizer bars (small, for form panel decoration) ──────── */
function MiniEqualizer({ bars = 5 }) {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full"
          style={{
            background: 'linear-gradient(to top, #f59e0b, #ec4899)',
            animation: `eqBar ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
            height: `${30 + i * 12}%`,
          }}
        />
      ))}
    </div>
  );
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode,     setMode    ] = useState('login');
  const [email,    setEmail   ] = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName    ] = useState('');
  const [err,      setErr     ] = useState(null);
  const [busy,     setBusy    ] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password) {
        setErr('Email and password are required');
        setBusy(false);
        return;
      }
      if (mode === 'login') {
        await login(cleanEmail, password);
      } else {
        await register(cleanEmail, password, name.trim());
      }
    } catch (e) {
      setErr(e.message || 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch relative overflow-hidden">
      {/* ── Static background gradient (original) ── */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(245,158,11,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(236,72,153,0.1) 0%, transparent 50%), #07090E' }} />

      {/* ── Cinematic animated canvas ── */}
      <CinematicCanvas />

      {/* ── Left panel — branding (original content kept) ── */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-display font-bold text-shimmer">Syncora</span>
          {/* Mini equalizer next to logo */}
          <MiniEqualizer bars={4} />
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-5xl font-display font-bold leading-tight mb-4">
              Music that<br />
              <span className="text-shimmer">feels</span> you.
            </h2>
            <p className="text-slate-400 text-lg max-w-xs leading-relaxed">
              Syncora listens to your mood and serves up the perfect soundtrack for every moment.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── NEW: animated now-playing card ── */}
          <div
            className="rounded-2xl p-4 border border-white/8 flex items-center gap-4 max-w-xs"
            style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
          >
            <div
              className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f59e0b33, #ec4899aa)' }}
            >
              <Music2 className="w-5 h-5 text-amber-300" style={{ animation: 'spin 8s linear infinite' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 mb-0.5">Now Playing</div>
              <div className="text-sm font-semibold text-slate-100 truncate">Your perfect mood track</div>
              <div className="text-xs text-slate-500 truncate">Syncora · Curated for you</div>
            </div>
            <MiniEqualizer bars={5} />
          </div>
        </div>

        <div className="text-xs text-slate-600">© 2025 Syncora · Music for every mood</div>
      </div>

      {/* ── Right panel — form (original content kept entirely) ── */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-shimmer">Syncora</span>
          </div>

          <div
            className="rounded-3xl p-8 border border-white/8"
            style={{ background: 'rgba(12,15,24,0.8)', backdropFilter: 'blur(24px)' }}
          >
            {/* ── NEW: animated header decoration ── */}
            <div className="flex items-center gap-2 mb-4">
              <MiniEqualizer bars={4} />
              <span className="text-[10px] text-slate-500 tracking-widest uppercase">
                {mode === 'login' ? 'Welcome back' : 'Join Syncora'}
              </span>
            </div>

            <h1 className="text-2xl font-display font-bold mb-1">
              {mode === 'login' ? 'Welcome back' : 'Get started'}
            </h1>
            <p className="text-sm text-slate-400 mb-7">
              {mode === 'login' ? 'Sign in to your Syncora account.' : 'Create a free Syncora account.'}
            </p>

            <form onSubmit={submit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Display name</label>
                  <input
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border"
                    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>

              {err && (
                <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex flex-col gap-1.5">
                  <div>{err}</div>
                  {err.toLowerCase().includes('already used') && (
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setErr(null); }}
                      className="text-left text-[11px] font-semibold text-amber-400 hover:underline"
                    >
                      Click here to sign in with this email →
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-60 hover:opacity-90 active:scale-98"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)', color: '#fff' }}
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-white/5 text-center">
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(null); }}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <span className="text-amber-400 font-medium">{mode === 'login' ? 'Sign up free' : 'Sign in'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Keyframes injected once ── */}
      <style>{`
        @keyframes eqBar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1);   }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
