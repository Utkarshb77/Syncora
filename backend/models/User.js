const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
