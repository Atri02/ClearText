const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'cleartext-jwt-secret-change-me';

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token  = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  const token  = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch (_) {}
  }
  next();
}

module.exports = { requireAuth, optionalAuth, JWT_SECRET };
