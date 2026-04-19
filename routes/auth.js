const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { users, findOne, insert } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/* ── Register ─────────────────────────────── */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = await findOne(users, { email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'This email is already registered' });

    const hash = await bcrypt.hash(password, 12);
    const doc  = await insert(users, {
      name: name.trim(), email: email.toLowerCase(), passwordHash: hash, createdAt: Date.now()
    });

    const user  = { id: doc._id, name: doc.name, email: doc.email };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register:', err);
    if (err.errorType === 'uniqueViolated')
      return res.status(409).json({ error: 'This email is already registered' });
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/* ── Login ────────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const row = await findOne(users, { email: email.toLowerCase() });
    if (!row) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, row.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const user  = { id: row._id, name: row.name, email: row.email };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (err) {
    console.error('Login:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/* ── Me ───────────────────────────────────── */
router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  const token  = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { id, name, email } = jwt.verify(token, JWT_SECRET);
    res.json({ user: { id, name, email } });
  } catch {
    res.status(401).json({ error: 'Invalid session' });
  }
});

module.exports = router;
