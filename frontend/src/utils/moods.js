export const MOOD_THEMES = {
  Happy: {
    gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    accent: 'text-amber-400',
    bgAccent: 'bg-amber-500',
    border: 'border-amber-500/30',
    hex: '#f59e0b',
    tagline: 'Turn up the joy and let every beat brighten your day.',
    defaultSearch: 'happy pop summer hits',
    tempo: 95,
  },

  Energetic: {
    gradient: 'from-rose-600/20 via-orange-500/10 to-transparent',
    accent: 'text-rose-400',
    bgAccent: 'bg-rose-500',
    border: 'border-rose-500/30',
    hex: '#f43f5e',
    tagline: 'Power up your moment with beats that keep you moving.',
    defaultSearch: 'workout edm electronic',
    tempo: 110,
  },

  Focused: {
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    accent: 'text-emerald-400',
    bgAccent: 'bg-emerald-500',
    border: 'border-emerald-500/30',
    hex: '#10b981',
    tagline: 'Clear the noise and find your rhythm, one beat at a time.',
    defaultSearch: 'lofi focus study beats',
    tempo: 75,
  },

  Calm: {
    gradient: 'from-sky-500/20 via-indigo-500/10 to-transparent',
    accent: 'text-sky-400',
    bgAccent: 'bg-sky-500',
    border: 'border-sky-500/30',
    hex: '#0ea5e9',
    tagline: 'Slow down, breathe deeply, and let the music take over.',
    defaultSearch: 'ambient meditation relaxation',
    tempo: 60,
  },

  Sad: {
    gradient: 'from-blue-600/20 via-slate-700/10 to-transparent',
    accent: 'text-blue-400',
    bgAccent: 'bg-blue-600',
    border: 'border-blue-500/30',
    hex: '#3b82f6',
    tagline: 'Let the music sit with you through the quieter moments.',
    defaultSearch: 'melancholy piano slow indie',
    tempo: 65,
  },

  Melancholic: {
    gradient: 'from-purple-600/20 via-pink-700/10 to-transparent',
    accent: 'text-purple-400',
    bgAccent: 'bg-purple-600',
    border: 'border-purple-500/30',
    hex: '#a855f7',
    tagline: 'Drift through memories and lose yourself in every sound.',
    defaultSearch: 'dream pop shoegaze nostalgia',
    tempo: 70,
  },
};

export const formatTime = (s) => {
  if (isNaN(s) || s == null) return '0:00';
  const m = Math.floor(s / 60), x = Math.floor(s % 60);
  return `${m}:${x < 10 ? '0' : ''}${x}`;
};

export const getSeed = (str) => {
  if (!str) return 42;
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
};

export const toLocalDateKey = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateLabel = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - target) / 86400000);

  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  if (diffDays > 1 && diffDays < 7) {
    const dayName = d.toLocaleDateString([], { weekday: 'short' });
    return `${dayName}, ${timeStr}`;
  }
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
};

