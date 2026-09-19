import React from 'react';

export function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-24 text-xs text-slate-400">{d.label}</div>
          <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, background: `linear-gradient(90deg, ${d.color || '#f59e0b'}, #ec4899)` }} />
          </div>
          <div className="w-10 text-xs text-slate-400 text-right">{d.value}</div>
        </div>
      ))}
    </div>
  );
}

export function RingChart({ value, max = 100, color = '#f59e0b', label }) {
  const pct = Math.min(1, value / max);
  const C = 2 * Math.PI * 44;
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: 'stroke-dashoffset .6s' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-display font-semibold">{value}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}
