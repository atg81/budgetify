require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes        = require('./routes/auth');
const categoriesRoutes  = require('./routes/categories');
const transactionsRoutes = require('./routes/transactions');

const app = express();

// ─── Security & Parsing ───────────────────────
app.use(helmet());
app.use(cors({
  origin: '*',            // Android uygulaması için, production'da kısıtlayın
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const { query } = require('./db');
    await query('SELECT 1');
    return res.status(200).json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    return res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ─── Routes ──────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/categories',   categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);

// ─── 404 ─────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Global error handler ────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start ───────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Budgetify API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Auth:   http://localhost:${PORT}/api/auth`);
  console.log(`   Cats:   http://localhost:${PORT}/api/categories`);
  console.log(`   Trans:  http://localhost:${PORT}/api/transactions\n`);
});

module.exports = app;
