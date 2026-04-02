const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const AuctionSettings = require('../models/AuctionSettings');
const { requireAdmin } = require('../middleware/authMiddleware');

// GET all teams (with players populated)
router.get('/', async (req, res, next) => {
  try {
    const teams = await Team.find().populate('players', 'name role soldPrice photo age');
    res.json(teams);
  } catch (err) { next(err); }
});

// POST create a new team
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const settings = await AuctionSettings.findOne();
    const budget = req.body.budget || (settings ? settings.initialBudget : 100000);
    const team = await Team.create({ ...req.body, budget });
    res.status(201).json(team);
  } catch (err) { next(err); }
});

// PUT update team
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) { next(err); }
});

// DELETE team
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
