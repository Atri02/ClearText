const express        = require('express');
const { requireAuth } = require('../middleware/auth');
const { translations, findOne, find, insert, remove } = require('../db');

const router = express.Router();

/* ── GET /api/history ────────────────────── */
router.get('/', requireAuth, async (req, res) => {
  try {
    const items = await find(
      translations,
      { userId: req.user.id },
      { createdAt: -1 },
      50
    );
    res.json({
      history: items.map(i => ({
        id:            i._id,
        title:         i.title,
        reading_level: i.reading_level,
        doc_type:      i.doc_type,
        languages:     i.languages,
        created_at:    Math.floor(i.createdAt / 1000)
      }))
    });
  } catch (err) {
    console.error('History GET:', err);
    res.status(500).json({ error: 'Could not load history' });
  }
});

/* ── GET /api/history/:id ────────────────── */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const item = await findOne(translations, { _id: req.params.id, userId: req.user.id });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({
      item: {
        id:            item._id,
        title:         item.title,
        input_text:    item.input_text,
        output:        item.output,
        reading_level: item.reading_level,
        doc_type:      item.doc_type,
        languages:     item.languages,
        created_at:    Math.floor(item.createdAt / 1000)
      }
    });
  } catch (err) {
    console.error('History GET/:id:', err);
    res.status(500).json({ error: 'Could not load item' });
  }
});

/* ── POST /api/history ───────────────────── */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, input_text, output, reading_level, doc_type, languages } = req.body;
    if (!input_text || !output)
      return res.status(400).json({ error: 'input_text and output are required' });

    const langStr = Array.isArray(languages) ? languages.join(',') : (languages || 'en');
    const doc = await insert(translations, {
      userId:        req.user.id,
      title:         title || 'Untitled Translation',
      input_text:    input_text.substring(0, 5000),
      output,
      reading_level: reading_level || 'simple',
      doc_type:      doc_type || 'auto',
      languages:     langStr,
      createdAt:     Date.now()
    });
    res.status(201).json({ id: doc._id });
  } catch (err) {
    console.error('History POST:', err);
    res.status(500).json({ error: 'Could not save translation' });
  }
});

/* ── DELETE /api/history/:id ─────────────── */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const n = await remove(translations, { _id: req.params.id, userId: req.user.id });
    if (n === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('History DELETE:', err);
    res.status(500).json({ error: 'Could not delete' });
  }
});

module.exports = router;
