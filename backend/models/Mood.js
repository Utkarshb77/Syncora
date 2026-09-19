const mongoose = require('mongoose');
const MoodSchema = new mongoose.Schema({
  userId: { type: String, index: true, required: true },
  mood: { type: String, required: true },
  message: String,
  type: { type: String, default: 'mood' },
  trackName: String,
  artistName: String,
}, { timestamps: true });
module.exports = mongoose.models.Mood || mongoose.model('Mood', MoodSchema);
