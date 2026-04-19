const express = require('express');
const crypto  = require('crypto');
const { shares, findOne, insert } = require('../db');

const router = express.Router();

/* ── POST /api/share ─────────────────────── */
router.post('/', async (req, res) => {
  try {
    const { output, reading_level, doc_type, input_preview } = req.body;
    if (!output) return res.status(400).json({ error: 'output is required' });

    const id = crypto.randomBytes(4).toString('hex'); // 8-char hex
    await insert(shares, {
      id,
      output,
      reading_level: reading_level || 'simple',
      doc_type:      doc_type || 'auto',
      input_preview: (input_preview || '').substring(0, 200),
      createdAt:     Date.now()
    });

    const protocol = req.protocol;
    const host     = req.get('host');
    res.json({ id, url: `${protocol}://${host}/s/${id}` });
  } catch (err) {
    console.error('Share POST:', err);
    res.status(500).json({ error: 'Could not create share link' });
  }
});

/* ── GET /api/share/:id ──────────────────── */
router.get('/:id', async (req, res) => {
  try {
    const share = await findOne(shares, { id: req.params.id });
    if (!share) return res.status(404).json({ error: 'Share not found or expired' });
    res.json({
      output:        share.output,
      reading_level: share.reading_level,
      doc_type:      share.doc_type,
      input_preview: share.input_preview,
      created_at:    Math.floor(share.createdAt / 1000)
    });
  } catch (err) {
    console.error('Share GET:', err);
    res.status(500).json({ error: 'Could not retrieve share' });
  }
});

module.exports = router;
