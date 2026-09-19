// In development, uses '/api' which Vite proxies to http://localhost:5000/api
// In production, set VITE_API_URL to the production backend endpoint if deployed separately
const BASE = import.meta.env.VITE_API_URL || '/api';

let cachedToken = localStorage.getItem('syncora_token') || null;

export function setAuthToken(token) {
  cachedToken = token || null;
  if (token) {
    localStorage.setItem('syncora_token', token);
  } else {
    localStorage.removeItem('syncora_token');
  }
}

function authHeaders() {
  const t = cachedToken || localStorage.getItem('syncora_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function request(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(opts.headers || {}),
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  // Only dispatch unauthorized for protected endpoints that explicitly fail with 401
  if (
    res.status === 401 &&
    path !== '/auth/login' &&
    path !== '/auth/register' &&
    path !== '/auth/me' &&
    (cachedToken || localStorage.getItem('syncora_token'))
  ) {
    window.dispatchEvent(new CustomEvent('syncora:unauthorized'));
  }

  if (!res.ok) {
    const errorMsg =
      data?.error ||
      data?.message ||
      (text && text.length < 150 ? text : null) ||
      res.statusText ||
      'Request failed';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  searchMusic: (q) => request(`/music/search?q=${encodeURIComponent(q)}`),
  searchSuggestions: (q) => request(`/music/suggestions?q=${encodeURIComponent(q)}`),
  getYouTubeId: (title, artist) => request(`/music/youtube?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`),
  listMoods: () => request('/moods'),
  logMood: (body) => request('/moods', { method: 'POST', body: JSON.stringify(body) }),
  listNotes: () => request('/notes'),
  createNote: (body) => request('/notes', { method: 'POST', body: JSON.stringify(body) }),
  deleteNote: (id) => request(`/notes/${id}`, { method: 'DELETE' }),
  listPlaylists: () => request('/playlists'),
  createPlaylist: (body) => request('/playlists', { method: 'POST', body: JSON.stringify(body) }),
  updatePlaylist: (id, body) => request(`/playlists/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  addTrackToPlaylist: (id, track) => request(`/playlists/${id}/tracks`, { method: 'POST', body: JSON.stringify(track) }),
  removeTrackFromPlaylist: (id, trackId) => request(`/playlists/${id}/tracks/${encodeURIComponent(trackId)}`, { method: 'DELETE' }),
  deletePlaylist: (id) => request(`/playlists/${id}`, { method: 'DELETE' }),
};
