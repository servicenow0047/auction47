const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      default: 'setup',
      enum: ['setup', 'ready', 'running', 'completed'],
    },
    currentPlayerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
    currentBid:       { type: Number, default: 0 },
    currentBidTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuctionSession', sessionSchema);
