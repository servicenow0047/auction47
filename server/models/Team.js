const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, unique: true, trim: true },
    budget:        { type: Number, required: true },
    totalSpent:    { type: Number, default: 0 },
    maxPlayers:    { type: Number, default: 15 },
    minPlayers:    { type: Number, default: 7 },
    players:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
