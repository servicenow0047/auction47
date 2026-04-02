const express = require('express');
const router = express.Router();
const AuctionSettings = require('../models/AuctionSettings');
const RegistrationSchema = require('../models/RegistrationSchema');
const { requireAdmin } = require('../middleware/authMiddleware');

// Default Cricket schema for initial seed
const defaultCricketSchema = {
  sportName: 'Cricket',
  fields: [
    { id: 'name', label: 'Full Name', type: 'text', required: true, builtIn: true, order: 1 },
    { id: 'age', label: 'Age', type: 'number', required: true, builtIn: true, order: 2 },
    { id: 'phone', label: 'Phone Number', type: 'tel', required: true, builtIn: true, order: 3 },
    { id: 'email', label: 'Email Address', type: 'email', required: false, builtIn: false, order: 4 },
    { id: 'role', label: 'Role', type: 'select', required: true, builtIn: true, options: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'], order: 5 },
    { id: 'battingStyle', label: 'Batting Style', type: 'select', required: false, builtIn: true, options: ['Right-hand bat', 'Left-hand bat'], order: 6 },
    { id: 'bowlingStyle', label: 'Bowling Style', type: 'select', required: false, builtIn: true, options: ['None', 'Right-arm fast', 'Right-arm medium', 'Right-arm offbreak', 'Right-arm legbreak', 'Left-arm fast', 'Left-arm orthodox', 'Left-arm chinaman'], order: 7 },
    { id: 'experience', label: 'Experience Level', type: 'select', required: false, builtIn: false, options: ['Beginner', 'Intermediate', 'Professional'], order: 8 },
    { id: 'previousTeam', label: 'Previous Team (if any)', type: 'text', required: false, builtIn: false, order: 9 },
    { id: 'photo', label: 'Player Photo', type: 'file', required: true, builtIn: true, accept: 'image/*', order: 10 },
    { id: 'idProof', label: 'ID Proof (Aadhar/Passport)', type: 'file', required: false, builtIn: false, accept: 'image/*,.pdf', order: 11 },
  ]
};

// GET settings
router.get('/', async (req, res, next) => {
  try {
    let settings = await AuctionSettings.findOne();
    if (!settings) settings = await AuctionSettings.create({});
    res.json(settings);
  } catch (err) { next(err); }
});

// PUT update settings
router.put('/', requireAdmin, async (req, res, next) => {
  try {
    let settings = await AuctionSettings.findOne();
    if (!settings) {
      settings = await AuctionSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json(settings);
  } catch (err) { next(err); }
});

// GET registration schema
router.get('/schema', async (req, res, next) => {
  try {
    let schema = await RegistrationSchema.findOne();
    if (!schema) schema = await RegistrationSchema.create(defaultCricketSchema);
    res.json(schema);
  } catch (err) { next(err); }
});

// PUT update registration schema
router.put('/schema', requireAdmin, async (req, res, next) => {
  try {
    let schema = await RegistrationSchema.findOne();
    if (!schema) {
      schema = await RegistrationSchema.create(req.body);
    } else {
      schema.sportName = req.body.sportName;
      schema.fields = req.body.fields;
      await schema.save();
    }
    res.json(schema);
  } catch (err) { next(err); }
});

module.exports = router;
