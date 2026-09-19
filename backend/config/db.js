const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('[db] No MONGO_URI set — using JSON-file fallback store.');
    ensureFallback();
    return;
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    console.log('[db] MongoDB Atlas connected successfully to:', mongoose.connection.name);
    // Drop stale indexes left over from old schema versions
    try {
      const indexes = await mongoose.connection.db.collection('users').indexes();
      if (indexes.find(i => i.name === 'username_1')) {
        await mongoose.connection.db.collection('users').dropIndex('username_1');
        console.log('[db] Dropped stale username_1 index');
      }
    } catch (e) {
      console.warn('[db] Index cleanup skipped:', e.message);
    }
  } catch (err) {
    console.warn('[db] Mongo connection failed — using JSON fallback:', err.message);
    ensureFallback();
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[db] MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('connected', () => {
  console.log('[db] MongoDB reconnected.');
});

function ensureFallback() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  ['users', 'moods', 'notes', 'playlists'].forEach((col) => {
    const f = path.join(DATA_DIR, `${col}.json`);
    if (!fs.existsSync(f)) fs.writeFileSync(f, '[]');
  });
}

const fileStore = {
  read(col) {
    const f = path.join(DATA_DIR, `${col}.json`);
    if (!fs.existsSync(f)) return [];
    return JSON.parse(fs.readFileSync(f, 'utf-8') || '[]');
  },
  write(col, data) {
    const f = path.join(DATA_DIR, `${col}.json`);
    fs.writeFileSync(f, JSON.stringify(data, null, 2));
  },
};

module.exports = {
  connectDB,
  fileStore,
  isMongo: () => mongoose.connection.readyState === 1,
};