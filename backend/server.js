require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/error');

const app = express();

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : null;

app.use(cors({
  origin: allowedOrigins
    ? (origin, cb) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          console.warn(`[CORS] Blocked origin: ${origin}`);
          cb(new Error('Not allowed by CORS'));
        }
      }
    : true, // Allow all origins if FRONTEND_URL not set
  credentials: true
}));

console.log('[CORS] Allowed origins:', allowedOrigins || 'ALL (FRONTEND_URL not set)');
app.use(express.json({ limit: '1mb' }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/moods', require('./routes/moods'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/music', require('./routes/music'));
app.use('/api/playlists', require('./routes/playlists'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().finally(() => {
  app.listen(PORT, () => console.log(`Syncora API listening on :${PORT}`));
});
