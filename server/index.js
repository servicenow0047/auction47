require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const playersRouter  = require('./routes/players');
const teamsRouter    = require('./routes/teams');
const auctionRouter  = require('./routes/auction');
const settingsRouter = require('./routes/settings');
const authRouter     = require('./routes/auth');
const errorHandler   = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/players',  playersRouter);
app.use('/api/teams',    teamsRouter);
app.use('/api/auction',  auctionRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/auth',     authRouter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅  MongoDB Atlas connected');
    app.listen(PORT, () => console.log(`🚀  Server → http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  });
