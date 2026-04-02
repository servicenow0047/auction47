const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  playerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  teamId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Team',   required: true },
  amount:    { type: Number, required: true, min: 0 },
  isLatest:  { type: Boolean, default: true },
  isValid:   { type: Boolean, default: true },
  placedAt:  { type: Date, default: Date.now },
});

bidSchema.index({ playerId: 1, isLatest: 1 });
bidSchema.index({ playerId: 1, isValid: 1 });

module.exports = mongoose.model('Bid', bidSchema);
