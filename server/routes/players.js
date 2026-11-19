const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const AuctionLog = require('../models/AuctionLog');
const { requireAdmin } = require('../middleware/authMiddleware');

// GET all players (with optional filters, excluding heavy photo by default for bandwidth protection)
router.get('/', async (req, res, next) => {
  try {
    const { status, role, includePhoto } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (role && role !== 'All') filter.role = role;
    let query = Player.find(filter).sort({ createdAt: -1 });
    if (includePhoto !== 'true') {
      query = query.select('-photo');
    }
    const players = await query;
    res.json(players);
  } catch (err) { next(err); }
});

// GET single player photo on demand
router.get('/:id/photo', async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id).select('photo');
    if (!player || !player.photo) return res.status(404).json({ error: 'Photo not found' });
    res.json({ photo: player.photo });
  } catch (err) { next(err); }
});

// POST register new player
router.post('/', async (req, res, next) => {
  try {
    // Duplicate check
    const existing = await Player.findOne({
      $or: [
        { phone: req.body.phone },
        ...(req.body.email ? [{ email: req.body.email }] : [])
      ]
    });
    if (existing) return res.status(409).json({ error: 'A player with this phone or email already exists.' });

    const player = await Player.create({ ...req.body, status: 'pending' });
    await AuctionLog.create({ type: 'player_registered', playerId: player._id });
    res.status(201).json(player);
  } catch (err) { next(err); }
});

// PATCH update player status (approve / reject / etc.)
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'not_called', 'rejected'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const update = { status };
    if (status === 'not_called') update.approvalDate = new Date();

    const player = await Player.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const logType = status === 'not_called' ? 'player_approved' : status === 'rejected' ? 'player_rejected' : 'player_pending';
    await AuctionLog.create({ type: logType, playerId: player._id });

    res.json(player);
  } catch (err) { next(err); }
});

// PUT full update (admin edit)
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) { next(err); }
});

// DELETE player
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await Player.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST Google Form Webhook
router.post('/webhook/google-form', async (req, res, next) => {
  try {
    const secret = req.headers['x-api-key'];
    if (secret !== 'YOUR_SUPER_SECRET_KEY') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, phone, basePrice, role, ...otherFields } = req.body;

    // Basic duplicate check based on phone
    if (phone) {
      const existing = await Player.findOne({ phone });
      if (existing) {
        return res.status(409).json({ error: 'Player already exists' });
      }
    }

    // Map form data to your Player Schema
    const newPlayer = new Player({
      name: name || 'Unknown Google Form User',
      phone: phone || 'N/A',
      basePrice: parseInt(basePrice) || 1000,
      role: role || 'Player',
      status: 'pending', // Keeps them waiting for admin approval
      ...otherFields,
    });

    // Save to MongoDB
    await newPlayer.save();
    
    // Add log
    await AuctionLog.create({ type: 'player_registered', playerId: newPlayer._id });
    
    res.status(200).json({ message: 'Success', player: newPlayer });
  } catch (err) {
    console.error('Webhook Error:', err);
    next(err);
  }
});

module.exports = router;
