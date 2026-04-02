const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    phone:         { type: String, required: true, unique: true, trim: true },
    photo:         { type: String, default: '' },
    basePrice:     { type: Number, required: true, default: 1000, min: 500 },

    status: {
      type: String,
      required: true,
      default: 'pending',
      enum: ['pending', 'rejected', 'not_called', 'in_auction', 'sold', 'unsold'],
    },

    assignedTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    soldPrice:      { type: Number, default: null },
    auctionDate:    { type: Date, default: null },
    approvalDate:   { type: Date, default: null },
  },
  { timestamps: true, strict: false }
);

playerSchema.index({ status: 1 });
playerSchema.index({ phone: 1 });
playerSchema.index({ role: 1 });

module.exports = mongoose.model('Player', playerSchema);
