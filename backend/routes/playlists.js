const router = require('express').Router();
const auth = require('../middleware/auth');
const { isMongo, fileStore } = require('../config/db');
const Playlist = require('../models/Playlist');

router.get('/', auth, async (req, res, next) => {
  try {
    if (isMongo()) return res.json(await Playlist.find({ userId: req.user.id }).sort({ createdAt: -1 }));
    res.json(fileStore.read('playlists').filter(p => p.userId === req.user.id));
  } catch (e) { next(e); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const payload = { ...req.body, userId: req.user.id, createdAt: new Date().toISOString() };
    if (isMongo()) return res.json(await Playlist.create(payload));
    const all = fileStore.read('playlists');
    const p = { id: 'p_' + Date.now(), ...payload };
    all.push(p); fileStore.write('playlists', all);
    res.json(p);
  } catch (e) { next(e); }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    if (isMongo()) {
      const p = await Playlist.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
      return res.json(p);
    }
    const all = fileStore.read('playlists');
    const idx = all.findIndex(p => p.id === req.params.id && p.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'not found' });
    all[idx] = { ...all[idx], ...req.body };
    fileStore.write('playlists', all);
    res.json(all[idx]);
  } catch (e) { next(e); }
});

router.post('/:id/tracks', auth, async (req, res, next) => {
  try {
    const track = req.body;
    if (!track || !track.title) return res.status(400).json({ error: 'Track details required' });
    if (isMongo()) {
      const pl = await Playlist.findOne({ _id: req.params.id, userId: req.user.id });
      if (!pl) return res.status(404).json({ error: 'Playlist not found' });
      pl.tracks = pl.tracks || [];
      const exists = pl.tracks.some(t => (t.id && t.id === track.id) || (t.title === track.title && t.artist === track.artist));
      if (!exists) {
        pl.tracks.push(track);
        await pl.save();
      }
      return res.json(pl);
    }
    const all = fileStore.read('playlists');
    const idx = all.findIndex(p => p.id === req.params.id && p.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'Playlist not found' });
    all[idx].tracks = all[idx].tracks || [];
    const exists = all[idx].tracks.some(t => (t.id && t.id === track.id) || (t.title === track.title && t.artist === track.artist));
    if (!exists) all[idx].tracks.push(track);
    fileStore.write('playlists', all);
    res.json(all[idx]);
  } catch (e) { next(e); }
});

router.delete('/:id/tracks/:trackId', auth, async (req, res, next) => {
  try {
    const trackId = decodeURIComponent(req.params.trackId);
    if (isMongo()) {
      const pl = await Playlist.findOne({ _id: req.params.id, userId: req.user.id });
      if (!pl) return res.status(404).json({ error: 'Playlist not found' });
      pl.tracks = (pl.tracks || []).filter(t => t.id !== trackId && t.title !== trackId && (t._id ? t._id.toString() !== trackId : true));
      await pl.save();
      return res.json(pl);
    }
    const all = fileStore.read('playlists');
    const idx = all.findIndex(p => p.id === req.params.id && p.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'Playlist not found' });
    all[idx].tracks = (all[idx].tracks || []).filter(t => t.id !== trackId && t.title !== trackId);
    fileStore.write('playlists', all);
    res.json(all[idx]);
  } catch (e) { next(e); }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    if (isMongo()) {
      await Playlist.deleteOne({ _id: req.params.id, userId: req.user.id });
      return res.json({ ok: true });
    }
    fileStore.write('playlists', fileStore.read('playlists').filter(p => !(p.id === req.params.id && p.userId === req.user.id)));
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
