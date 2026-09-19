const router = require('express').Router();
const fetch = require('node-fetch');

const cache = new Map();
const TTL = 1000 * 60 * 30;

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let spToken = null, spExpiry = 0;
async function getSpToken() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured');
  }
  if (spToken && Date.now() < spExpiry) return spToken;
  const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const d = await r.json();
  if (!d.access_token) throw new Error('Spotify auth failed');
  spToken = d.access_token;
  spExpiry = Date.now() + (d.expires_in - 60) * 1000;
  return spToken;
}

// iTunes search — always has previewUrl (30s AAC, no CORS issues)
async function itunesSearch(q, limit = 20) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=${limit}`;
  const r = await fetch(url);
  const d = await r.json();
  return (d.results || [])
    .filter(it => it.previewUrl)
    .map((it, i) => ({
      id: String(it.trackId || `t_${i}`),
      title: it.trackName,
      artist: it.artistName,
      album: it.collectionName || 'Single',
      artwork: it.artworkUrl100 ? it.artworkUrl100.replace('100x100bb', '600x600bb') : null,
      duration: it.trackTimeMillis ? Math.floor(it.trackTimeMillis / 1000) : 30,
      previewUrl: it.previewUrl,   // ← always present (filtered above)
      isGenerative: false,
    }));
}

// Spotify — for rich metadata; preview_url can be null for some tracks
async function spotifySearch(q, limit = 20) {
  const token = await getSpToken();
  const r = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const d = await r.json();
  return (d.tracks?.items || []).map((it, i) => ({
    id: it.id || `sp_${i}`,
    title: it.name,
    artist: it.artists?.[0]?.name || 'Unknown',
    album: it.album?.name || 'Single',
    artwork: it.album?.images?.[0]?.url || null,
    duration: it.duration_ms ? Math.floor(it.duration_ms / 1000) : 210,
    previewUrl: it.preview_url || null,
    isGenerative: false,
  }));
}

// Merge Spotify metadata with iTunes preview URLs
async function mergedSearch(q, limit = 20) {
  const [itTracks, spTracks] = await Promise.allSettled([
    itunesSearch(q, limit),
    spotifySearch(q, limit),
  ]);

  const itList = itTracks.status === 'fulfilled' ? itTracks.value : [];
  const spList = spTracks.status === 'fulfilled' ? spTracks.value : [];

  if (!spList.length) return itList;   // Spotify failed — use iTunes directly

  // Build iTunes preview map keyed by "title|artist" (lowercase)
  const itMap = new Map();
  itList.forEach(t => itMap.set(`${t.title.toLowerCase()}|${t.artist.toLowerCase()}`, t.previewUrl));

  // Attach iTunes preview to Spotify results where possible
  return spList.map(sp => {
    const key = `${sp.title.toLowerCase()}|${sp.artist.toLowerCase()}`;
    const preview = sp.previewUrl || itMap.get(key) || null;
    return { ...sp, previewUrl: preview };
  });
}

router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.json({ results: [] });
    const key = `s:${q.toLowerCase()}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < TTL) return res.json(hit.data);

    const results = await mergedSearch(q, 20);
    const payload = { results };
    cache.set(key, { ts: Date.now(), data: payload });
    res.json(payload);
  } catch (e) { next(e); }
});

router.get('/suggestions', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q || q.length < 2) return res.json({ results: [] });
    const key = `sg:${q.toLowerCase()}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < TTL) return res.json(hit.data);

    // Suggestions: just iTunes (fast, no auth)
    const results = await itunesSearch(q, 6);
    const payload = { results };
    cache.set(key, { ts: Date.now(), data: payload });
    res.json(payload);
  } catch (e) { next(e); }
});
// Scrape YouTube search results to get a videoId for a song
router.get('/youtube', async (req, res, next) => {
  try {
    const title = (req.query.title || '').toString().trim();
    const artist = (req.query.artist || '').toString().trim();
    if (!title) return res.json({ videoId: null });

    const key = `yt:${title.toLowerCase()}:${artist.toLowerCase()}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < TTL) return res.json(hit.data);

    const q = encodeURIComponent(`${title} ${artist} official music video`);
    const r = await fetch(`https://www.youtube.com/results?search_query=${q}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    const html = await r.text();
    // Extract first videoId from the page
    const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    const videoId = match ? match[1] : null;

    const payload = { videoId };
    if (videoId) cache.set(key, { ts: Date.now(), data: payload });
    res.json(payload);
  } catch (e) { next(e); }
});

module.exports = router;