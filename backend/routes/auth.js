const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isMongo, fileStore } = require('../config/db');
const User = require('../models/User');

const SECRET = () => process.env.JWT_SECRET || 'dev-secret';
const sign = (u) => jwt.sign(
  { id: String(u.id || u._id), email: u.email },
  SECRET(),
  { expiresIn: '30d' }
);

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });
    const passwordHash = await bcrypt.hash(password, 10);
    if (isMongo()) {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return res.status(409).json({ error: 'Email already used' });
      const u = await User.create({ email: email.toLowerCase(), passwordHash, displayName: displayName || '' });
      return res.json({ token: sign(u), user: { id: u._id, email: u.email, displayName: u.displayName } });
    }
    const users = fileStore.read('users');
    if (users.find(u => u.email === email.toLowerCase())) return res.status(409).json({ error: 'Email already used' });
    const u = { id: 'u_' + Date.now(), email: email.toLowerCase(), passwordHash, displayName: displayName || '' };
    users.push(u); fileStore.write('users', users);
    res.json({ token: sign(u), user: { id: u.id, email: u.email, displayName: u.displayName } });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });

    let u;
    if (isMongo()) {
      u = await User.findOne({ email: email.toLowerCase() });
    } else {
      u = fileStore.read('users').find(x => x.email === email.toLowerCase());
    }

    if (!u) return res.status(401).json({ error: 'No account found with that email' });
    if (!u.passwordHash) return res.status(401).json({ error: 'Account has no password set — please register again' });

    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Wrong password' });

    res.json({ token: sign(u), user: { id: u.id || u._id, email: u.email, displayName: u.displayName || '' } });
  } catch (e) { next(e); }
});

const auth = require('../middleware/auth');
router.get('/me', auth, async (req, res, next) => {
  try {
    if (isMongo()) {
      const u = await User.findById(req.user.id).select('-passwordHash');
      if (!u) return res.status(401).json({ error: 'User not found in Atlas database' });
      return res.json({ user: { id: u._id, email: u.email, displayName: u.displayName } });
    }
    const u = fileStore.read('users').find(x => x.id === req.user.id);
    if (!u) return res.status(401).json({ error: 'User not found' });
    res.json({ user: { id: u.id, email: u.email, displayName: u.displayName } });
  } catch (e) { next(e); }
});

module.exports = router;