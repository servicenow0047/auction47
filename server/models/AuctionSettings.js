const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    numTeams:      { type: Number, default: 8 },
    initialBudget: { type: Number, default: 100000 },
    minPlayers:    { type: Number, default: 7 },
    maxPlayers:    { type: Number, default: 15 },
    basePrice:     { type: Number, default: 1000 },
    increments: {
      type: [{ upTo: Number, increment: Number }],
      default: [
        { upTo: 3000,  increment: 200  },
        { upTo: 10000, increment: 500  },
        { upTo: null,  increment: 1000 },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuctionSettings', settingsSchema);
