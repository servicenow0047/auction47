const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const Team = require('../models/Team');
const Bid = require('../models/Bid');
const AuctionSession = require('../models/AuctionSession');
const AuctionSettings = require('../models/AuctionSettings');
const AuctionLog = require('../models/AuctionLog');
const { requireAdmin } = require('../middleware/authMiddleware');

// Helper – get or create the single session document
async function getSession() {
  let session = await AuctionSession.findOne();
  if (!session) session = await AuctionSession.create({});
  return session;
}

// Helper – compute next bid amount from settings
function nextBidAmount(currentBid, increments) {
  if (currentBid === 0) return increments[0] ? Math.min(...increments.map(r => r.upTo).filter(Boolean)) || 1000 : 1000;
  const rule = increments.find(r => r.upTo != null && currentBid < r.upTo);
  return currentBid + (rule ? rule.increment : increments[increments.length - 1]?.increment || 1000);
}

// GET current auction state
router.get('/state', async (req, res, next) => {
  try {
    const session = await getSession();
    const settings = await AuctionSettings.findOne() || {};
    const players = await Player.find();
    const teams = await Team.find().populate('players', '_id name role soldPrice photo age basePrice');
    const logs = await AuctionLog.find().sort({ timestamp: -1 }).limit(100)
      .populate('playerId', 'name').populate('teamId', 'name');

    // Build logs in frontend format
    const formattedLogs = logs.map(l => ({
      id: l._id,
      type: l.type,
      playerId: l.playerId?._id || l.playerId,
      teamId: l.teamId?._id || l.teamId,
      amount: l.amount,
      timestamp: l.timestamp,
    }));

    // Map teams to frontend shape
    const formattedTeams = teams.map(t => ({
      id: t._id,
      name: t.name,
      logo: t.logo || '',
      budget: t.budget,
      totalSpent: t.totalSpent,
      maxPlayers: t.maxPlayers,
      minPlayers: t.minPlayers,
      players: t.players.map(p => p._id),
    }));

    // Map players to frontend shape
    const formattedPlayers = players.map(p => {
      const doc = typeof p.toObject === 'function' ? p.toObject() : p;
      const { _id, __v, createdAt, updatedAt, assignedTeamId, ...rest } = doc;
      return {
        ...rest,
        id: _id,
        teamId: assignedTeamId,
      };
    });

    res.json({
      status: session.status,
      currentPlayerId: session.currentPlayerId,
      currentBid: session.currentBid,
      currentBidTeamId: session.currentBidTeamId,
      settings,
      players: formattedPlayers,
      teams: formattedTeams,
      logs: formattedLogs,
    });
  } catch (err) { next(err); }
});

// POST start auction
router.post('/start', requireAdmin, async (req, res, next) => {
  try {
    const session = await getSession();
    session.status = 'ready';
    await session.save();
    await AuctionLog.create({ type: 'started' });
    res.json({ success: true, status: 'ready' });
  } catch (err) { next(err); }
});

// POST select next player for auction
router.post('/next-player', requireAdmin, async (req, res, next) => {
  try {
    const session = await getSession();
    const { playerId } = req.body;

    let player;
    if (playerId) {
      player = await Player.findById(playerId);
    } else {
      const available = await Player.find({ status: 'not_called' });
      if (available.length === 0) {
        const session2 = await AuctionSession.findOne();
        session2.status = 'completed';
        await session2.save();
        return res.json({ completed: true });
      }
      player = available[Math.floor(Math.random() * available.length)];
    }

    if (!player) return res.status(404).json({ error: 'Player not found' });

    player.status = 'in_auction';
    await player.save();

    session.status = 'running';
    session.currentPlayerId = player._id;
    session.currentBid = 0;
    session.currentBidTeamId = null;
    await session.save();

    await AuctionLog.create({ type: 'spinner_selected', playerId: player._id });
    res.json({ success: true, playerId: player._id });
  } catch (err) { next(err); }
});

// POST place bid
router.post('/bid', requireAdmin, async (req, res, next) => {
  try {
    const { teamId, amount } = req.body;
    const session = await getSession();
    if (!session.currentPlayerId) return res.status(400).json({ error: 'No active player' });

    // Invalidate previous latest bid
    await Bid.updateMany({ playerId: session.currentPlayerId, isLatest: true }, { isLatest: false });

    // Create new bid
    await Bid.create({ playerId: session.currentPlayerId, teamId, amount, isLatest: true, isValid: true });

    // Update session
    session.currentBid = amount;
    session.currentBidTeamId = teamId;
    await session.save();

    await AuctionLog.create({ type: 'bid', playerId: session.currentPlayerId, teamId, amount });
    res.json({ success: true, currentBid: amount, currentBidTeamId: teamId });
  } catch (err) { next(err); }
});

// POST undo last bid
router.post('/undo-bid', requireAdmin, async (req, res, next) => {
  try {
    const session = await getSession();
    if (!session.currentPlayerId) return res.status(400).json({ error: 'No active player' });

    // Invalidate current latest
    await Bid.findOneAndUpdate(
      { playerId: session.currentPlayerId, isLatest: true },
      { isValid: false, isLatest: false }
    );

    // Promote previous valid bid
    const previous = await Bid.findOne({ playerId: session.currentPlayerId, isValid: true }).sort({ placedAt: -1 });
    if (previous) {
      previous.isLatest = true;
      await previous.save();
      session.currentBid = previous.amount;
      session.currentBidTeamId = previous.teamId;
    } else {
      session.currentBid = 0;
      session.currentBidTeamId = null;
    }
    await session.save();

    await AuctionLog.create({ type: 'bid_undone', playerId: session.currentPlayerId });
    res.json({ success: true, currentBid: session.currentBid, currentBidTeamId: session.currentBidTeamId });
  } catch (err) { next(err); }
});

// POST sell player
router.post('/sell', requireAdmin, async (req, res, next) => {
  try {
    const session = await getSession();
    if (!session.currentPlayerId || !session.currentBidTeamId || session.currentBid === 0) {
      return res.status(400).json({ error: 'No active bid to sell' });
    }

    const [player, team] = await Promise.all([
      Player.findById(session.currentPlayerId),
      Team.findById(session.currentBidTeamId),
    ]);
    if (!player || !team) return res.status(404).json({ error: 'Player or team not found' });

    // Update player
    player.status = 'sold';
    player.soldPrice = session.currentBid;
    player.assignedTeamId = team._id;
    player.auctionDate = new Date();
    await player.save();

    // Update team
    team.budget -= session.currentBid;
    team.totalSpent += session.currentBid;
    team.players.push(player._id);
    await team.save();

    await AuctionLog.create({ type: 'sold', playerId: player._id, teamId: team._id, amount: session.currentBid });

    // Reset session
    session.currentPlayerId = null;
    session.currentBid = 0;
    session.currentBidTeamId = null;
    await session.save();

    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST mark unsold
router.post('/unsold', requireAdmin, async (req, res, next) => {
  try {
    const session = await getSession();
    if (!session.currentPlayerId) return res.status(400).json({ error: 'No active player' });

    await Player.findByIdAndUpdate(session.currentPlayerId, {
      status: 'unsold', assignedTeamId: null, soldPrice: null,
    });

    await AuctionLog.create({ type: 'unsold', playerId: session.currentPlayerId });

    session.currentPlayerId = null;
    session.currentBid = 0;
    session.currentBidTeamId = null;
    await session.save();

    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST re-add unsold players to pool
router.post('/readd-unsold', requireAdmin, async (req, res, next) => {
  try {
    await Player.updateMany({ status: 'unsold' }, { status: 'not_called' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST reset entire auction (Create New Tournament)
router.post('/reset', requireAdmin, async (req, res, next) => {
  try {
    const { keepPlayers, tournamentName, tournamentLogo } = req.body;
    
    // Always clear bidding history and logs
    await Bid.deleteMany({});
    await AuctionLog.deleteMany({});
    
    if (keepPlayers) {
      // Just reset statuses
      await Player.updateMany({}, { status: 'not_called', soldPrice: null, assignedTeamId: null, auctionDate: null });
      const settings = await AuctionSettings.findOne() || { initialBudget: 100000 };
      await Team.updateMany({}, { budget: settings.initialBudget, totalSpent: 0, players: [] });
    } else {
      // True hard wipe
      await Player.deleteMany({});
      await Team.deleteMany({});
    }
    
    // Reset session back to setup
    await AuctionSession.findOneAndUpdate({}, { status: 'setup', currentPlayerId: null, currentBid: 0, currentBidTeamId: null });
    
    // Update Tournament Settings (Name & Logo)
    let settings = await AuctionSettings.findOne();
    if (!settings) settings = new AuctionSettings();
    if (tournamentName) settings.tournamentName = tournamentName;
    if (tournamentLogo !== undefined) settings.tournamentLogo = tournamentLogo;
    await settings.save();

    res.json({ success: true, hardReset: !keepPlayers });
  } catch (err) { next(err); }
});

// POST end auction (manually complete)
router.post('/end', requireAdmin, async (req, res, next) => {
  try {
    const session = await getSession();
    session.status = 'completed';
    session.currentPlayerId = null;
    session.currentBid = 0;
    session.currentBidTeamId = null;
    await session.save();
    
    await AuctionLog.create({ type: 'ended' });
    res.json({ success: true, status: 'completed' });
  } catch (err) { next(err); }
});

module.exports = router;
