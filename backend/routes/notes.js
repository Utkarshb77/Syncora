const router = require('express').Router();
const auth = require('../middleware/auth');
const { isMongo, fileStore } = require('../config/db');
const Note = require('../models/Note');

router.get('/', auth, async (req, res, next) => {
  try {
    if (isMongo()) return res.json(await Note.find({ userId: req.user.id }).sort({ createdAt: -1 }));
    res.json(fileStore.read('notes').filter(n => n.userId === req.user.id));
  } catch (e) { next(e); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const payload = { ...req.body, userId: req.user.id, createdAt: new Date().toISOString() };
    if (isMongo()) return res.json(await Note.create(payload));
    const all = fileStore.read('notes');
    const n = { id: 'n_' + Date.now(), ...payload };
    all.push(n); fileStore.write('notes', all);
    res.json(n);
  } catch (e) { next(e); }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    if (isMongo()) {
      await Note.deleteOne({ _id: req.params.id, userId: req.user.id });
      return res.json({ ok: true });
    }
    const all = fileStore.read('notes').filter(n => !(n.id === req.params.id && n.userId === req.user.id));
    fileStore.write('notes', all);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
