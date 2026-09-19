const mongoose = require('mongoose');
const PlaylistSchema = new mongoose.Schema({
  userId: { type: String, index: true, required: true },
  name: { type: String, required: true },
  mood: String,
  tracks: [{
    id: String, title: String, artist: String, album: String,
    artwork: String, duration: Number, previewUrl: String, isGenerative: Boolean,
  }],
}, { timestamps: true });
module.exports = mongoose.models.Playlist || mongoose.model('Playlist', PlaylistSchema);
