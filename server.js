const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 5050;

/* ── Middleware ──────────────────────────── */
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ── API Routes ──────────────────────────── */
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/translate', require('./routes/translate'));
app.use('/api/history',   require('./routes/history'));
app.use('/api/share',     require('./routes/share'));

/* ── Share URL: /s/:id → SPA ─────────────── */
app.get('/s/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ── Error handler ───────────────────────── */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

/* ── Start ───────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀  ClearText v2 running at http://localhost:${PORT}`);
  console.log(`📂  Serving from: ${path.join(__dirname, 'public')}\n`);
});
