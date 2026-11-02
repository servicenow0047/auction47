import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Fallback credentials matching server/.env
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://auctionprime_db_user:ecwPFO3sjdL3Lug4@auctionprime.ovwkgl9.mongodb.net/cricket_auction?retryWrites=true&w=majority&appName=Auctionprime';
if (!process.env.ADMIN_PASSWORD) {
  process.env.ADMIN_PASSWORD = '4774auction';
}

// Cached connection across serverless invocations
let cached = global.mongooseConnection;
if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

async function connectToMongo() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    }).then((m) => {
      console.log('✅ Serverless MongoDB Atlas connected');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}

const app = express();

app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '4.5mb' }));

// Middleware to ensure database connectivity
app.use(async (req, res, next) => {
  try {
    await connectToMongo();
    next();
  } catch (err) {
    console.error('Serverless DB Error:', err.message);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// Mount routes from existing server
const playersRouter  = require('../server/routes/players');
const teamsRouter    = require('../server/routes/teams');
const auctionRouter  = require('../server/routes/auction');
const settingsRouter = require('../server/routes/settings');
const authRouter     = require('../server/routes/auth');
const errorHandler   = require('../server/middleware/errorHandler');

app.use('/api/players',  playersRouter);
app.use('/api/teams',    teamsRouter);
app.use('/api/auction',  auctionRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/auth',     authRouter);
app.get('/api/health',  (_req, res) => res.json({ status: 'ok', runtime: 'vercel-serverless' }));

app.use(errorHandler);

export default app;
