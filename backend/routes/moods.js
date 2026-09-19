const router = require('express').Router();
const auth = require('../middleware/auth');
const { isMongo, fileStore } = require('../config/db');
const Mood = require('../models/Mood');

router.get('/', auth, async (req, res, next) => {
  try {
    if (isMongo()) {
      const list = await Mood.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(200);
      return res.json(list);
    }
    const list = fileStore.read('moods').filter(m => m.userId === req.user.id);
    res.json(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (e) { next(e); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const payload = { ...req.body, userId: req.user.id, createdAt: new Date().toISOString() };
    if (isMongo()) {
      const doc = await Mood.create(payload);
      return res.json(doc);
    }
    const all = fileStore.read('moods');
    const entry = { id: 'm_' + Date.now(), ...payload };
    all.push(entry); fileStore.write('moods', all);
    res.json(entry);
  } catch (e) { next(e); }
});

module.exports = router;
