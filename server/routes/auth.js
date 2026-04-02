const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/authMiddleware');

router.post('/verify', requireAdmin, (req, res) => {
  res.json({ success: true, message: 'Password accepted' });
});

module.exports = router;
