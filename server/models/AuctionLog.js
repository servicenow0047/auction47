const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  type:      { type: String, required: true },
  playerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
  teamId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Team',   default: null },
  amount:    { type: Number, default: null },
  note:      { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

logSchema.index({ timestamp: -1 });

module.exports = mongoose.models.AuctionLog || mongoose.model('AuctionLog', logSchema);
