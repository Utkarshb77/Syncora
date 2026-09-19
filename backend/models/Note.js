const mongoose = require('mongoose');
const NoteSchema = new mongoose.Schema({
  userId: { type: String, index: true, required: true },
  title: String,
  mood: String,
  encryptedContent: String,
  isEncrypted: { type: Boolean, default: true },
  tags: [String],
}, { timestamps: true });
module.exports = mongoose.models.Note || mongoose.model('Note', NoteSchema);
