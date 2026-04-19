const express   = require('express');
const multer    = require('multer');
const Anthropic = require('@anthropic-ai/sdk');

const router = express.Router();

/* ── File upload config ──────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PDF and image files (JPG, PNG, GIF, WebP) are supported'));
  }
});

/* ── Constants ───────────────────────────── */
const LEVEL_PROMPTS = {
  child:  'Use very short sentences (under 12 words). Only words a 7-year-old knows. No technical terms. Use "you" and "your" throughout.',
  simple: 'Use clear, simple sentences. Everyday words. Explain any jargon in plain English. Write as if explaining to a 10-year-old.',
  teen:   'Clear, moderately detailed sentences. Minimal jargon. Brief explanations of any technical terms. Write for a 14-year-old.',
  adult:  'Plain English with some standard terminology where necessary. Write for a high school graduate.'
};

const LANGUAGE_NAMES = {
  en: 'English',   es: 'Spanish',    zh: 'Mandarin Chinese',
  hi: 'Hindi',     ar: 'Arabic',     fr: 'French',
  de: 'German',    pt: 'Portuguese', ja: 'Japanese', ru: 'Russian'
};

/* ── Prompt builder ──────────────────────── */
function buildPrompt(text, readingLevel, includeActions, includeDates, includeWarnings, targetLanguages) {
  const levelDesc   = LEVEL_PROMPTS[readingLevel] || LEVEL_PROMPTS.simple;
  const nonEnglish  = (targetLanguages || ['en']).filter(l => l !== 'en');

  const sections = ['"summary": "<plain English summary — 3 to 6 sentences>"'];
  if (includeActions)  sections.push('"actions":  ["<specific action starting with a verb, include deadlines>"]');
  if (includeDates)    sections.push('"dates":    ["<important date or deadline>"]');
  if (includeWarnings) sections.push('"warnings": ["⚠ <critical consequence or thing to avoid>"]');

  let translationsBlock = '';
  if (nonEnglish.length > 0) {
    const langs = nonEnglish.map(lang => {
      const name = LANGUAGE_NAMES[lang] || lang;
      return `    "${lang}": {
      "summary":  "<summary in ${name}>",
      "actions":  ["<actions in ${name}>"],
      "dates":    ["<dates in ${name}>"],
      "warnings": ["<warnings in ${name}>"]
    }`;
    }).join(',\n');
    translationsBlock = `,\n  "translations": {\n${langs}\n  }`;
  }

  return `You are an expert accessibility translator. Your mission: take dense, jargon-heavy documents and rewrite them in plain English so that ANYONE can understand — including the elderly, non-native speakers, and people with cognitive disabilities.

READING LEVEL: ${levelDesc}

DOCUMENT:
"""
${text.substring(0, 12000)}
"""

Return ONLY a valid JSON object — no markdown fences, no extra commentary, raw JSON only:
{
  ${sections.join(',\n  ')}${translationsBlock}
}

RULES:
- "summary": 3–6 plain sentences explaining what this document is and what it means for the reader. Use "you/your". ZERO jargon.
- "actions": Each item is a complete, specific instruction starting with a verb. Include all deadlines inline (e.g., "Pay $459.00 by April 30, 2024."). Maximum 8 items.
- "dates": Extract every important date, deadline, timeframe. Format: "April 30, 2024 — last day to appeal." Maximum 8 items.
- "warnings": Critical consequences the reader MUST know. Start each with ⚠. Maximum 5 items.
- Translations: Write the same sections in the target language. Be culturally appropriate. Keep the same plain-language style.

Return ONLY valid JSON. Nothing else.`;
}

/* ── Helper: call Claude ─────────────────── */
async function callClaude(apiKey, model, prompt) {
  const anthropic = new Anthropic({ apiKey });
  const message   = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });
  const raw     = message.content[0].text.trim();
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

/* ── POST /api/translate ─────────────────── */
router.post('/', async (req, res) => {
  try {
    const {
      text, reading_level, doc_type,
      include_actions, include_dates, include_warnings,
      target_languages, claude_model
    } = req.body;

    const apiKey = req.headers['x-api-key'];
    if (!apiKey)      return res.status(400).json({ error: 'Claude API key required (x-api-key header)' });
    if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

    const model     = claude_model || 'claude-sonnet-4-5';
    const languages = Array.isArray(target_languages) ? target_languages : ['en'];

    const prompt = buildPrompt(
      text.trim(), reading_level || 'simple',
      include_actions !== false,
      include_dates   !== false,
      include_warnings !== false,
      languages
    );

    const output = await callClaude(apiKey, model, prompt);
    res.json({ success: true, output });
  } catch (err) {
    console.error('Translate error:', err.message);
    if (err instanceof SyntaxError)   return res.status(500).json({ error: 'AI returned malformed JSON. Please try again.' });
    if (err.status === 401)           return res.status(401).json({ error: 'Invalid Claude API key.' });
    if (err.status === 429)           return res.status(429).json({ error: 'Rate limited. Please wait a moment and try again.' });
    res.status(500).json({ error: err.message || 'Translation failed' });
  }
});

/* ── POST /api/translate/file ────────────── */
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(400).json({ error: 'Claude API key required' });

    const {
      reading_level, include_actions, include_dates, include_warnings,
      claude_model, target_languages
    } = req.body;

    const model = claude_model || 'claude-sonnet-4-5';
    const anthropic = new Anthropic({ apiKey });

    let extractedText = '';

    if (req.file.mimetype === 'application/pdf') {
      // Use pdf-parse inner lib to avoid test-file loading issue
      const pdfParse  = require('pdf-parse/lib/pdf-parse.js');
      const pdfData   = await pdfParse(req.file.buffer);
      extractedText   = pdfData.text;
    } else {
      // Image → Claude Vision OCR
      const base64    = req.file.buffer.toString('base64');
      const mediaType = req.file.mimetype;

      const ocrMsg = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 }
            },
            {
              type: 'text',
              text: 'Extract ALL text from this document image. Preserve structure — headings, paragraphs, lists, tables. Return only the raw extracted text, preserving the document layout as much as possible. No commentary.'
            }
          ]
        }]
      });
      extractedText = ocrMsg.content[0].text;
    }

    if (!extractedText.trim()) {
      return res.status(422).json({ error: 'Could not extract text from the file. Is it a readable document?' });
    }

    // Now translate extracted text
    const languages = target_languages ? JSON.parse(target_languages) : ['en'];
    const prompt    = buildPrompt(
      extractedText, reading_level || 'simple',
      include_actions  !== 'false',
      include_dates    !== 'false',
      include_warnings !== 'false',
      languages
    );

    const output = await callClaude(apiKey, model, prompt);

    res.json({
      success:        true,
      extracted_text: extractedText,
      output
    });
  } catch (err) {
    console.error('File translate error:', err.message);
    if (err.status === 401) return res.status(401).json({ error: 'Invalid Claude API key.' });
    res.status(500).json({ error: err.message || 'File processing failed' });
  }
});

module.exports = router;
