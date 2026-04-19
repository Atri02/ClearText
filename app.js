/**
 * ClearText – Complexity Translator
 * Main Application Logic
 * Powered by Google Gemini API
 */

// ============================================================
// CONSTANTS & SAMPLE DATA
// ============================================================

const SAMPLE_TEXTS = {
  legal: `RESIDENTIAL LEASE AGREEMENT

THIS AGREEMENT, made this 1st day of January, 2024, by and between ACME PROPERTIES LLC, hereinafter referred to as "Landlord," and the undersigned, hereinafter referred to as "Tenant."

WITNESSETH: That in consideration of the covenants and agreements herein contained, and for the sum of Two Thousand and No/100 Dollars ($2,000.00) per month, Landlord hereby leases to Tenant the premises located at 123 Main Street, Apt. 4B.

The term of this lease shall commence on February 1, 2024 and shall terminate on January 31, 2025, unless sooner terminated pursuant to provisions herein.

SECURITY DEPOSIT: Tenant shall deposit with Landlord the sum of $4,000.00 as security for performance of Tenant's obligations hereunder, which sum shall be returned to Tenant within 21 days after termination of tenancy, less any deductions for damages beyond normal wear and tear and any unpaid rent or other charges.

DEFAULT: If Tenant defaults in payment of rent or any other obligation hereunder, Landlord may, after providing three (3) days written notice to cure said default, terminate this Agreement and pursue all available legal remedies including but not limited to unlawful detainer proceedings.`,

  medical: `EXPLANATION OF BENEFITS

Member: John Doe  |  Plan: BlueCross PPO Elite  |  Claim Date: 03/15/2024

SERVICE: Emergency Department Visit — CPT Code 99285 (Level 5 E&M)
Provider: Mercy General Hospital (OUT-OF-NETWORK)
Billed Amount: $4,850.00
Not Covered (Out-of-Network Limitation): $1,820.00
Plan Allowed Amount: $3,030.00
Applied to Deductible: $1,500.00 (Remaining deductible: $0.00)
Coinsurance (30% of remaining $1,530.00): $459.00
Plan Paid: $1,071.00
YOUR RESPONSIBILITY: $1,959.00

NOTE: This claim was processed under your out-of-network benefits because Mercy General Hospital does not participate in your plan's network. You may have balance billing rights. If you believe this claim was processed incorrectly, you must submit a written appeal within 180 days of receiving this EOB to: BlueCross Appeals Department, P.O. Box 8000, City, ST 00000.`,

  government: `NOTICE OF DETERMINATION — SUPPLEMENTAL NUTRITION ASSISTANCE PROGRAM

Case Number: 2024-SNAP-089234
Effective Date of Action: April 30, 2024
Action Taken: CLOSURE

This is to inform you that your Supplemental Nutrition Assistance Program (SNAP) benefits have been CLOSED effective April 30, 2024, for the following reason(s):
— Failure to provide requested verification documents within the prescribed timeframe as required by 7 CFR 273.2(f).

Your monthly benefit amount of $387.00 will be discontinued.

RIGHT TO APPEAL: You have the right to request a fair hearing if you believe this action is incorrect. To preserve your right to continued benefits pending a hearing decision, you MUST request a hearing within 10 days from the date of this notice (by April 21, 2024). If you request a hearing after 10 days but within 90 days from the date of this notice, you may still have a hearing, but your benefits will not continue during the hearing process. To request a hearing, contact your local county office at 1-800-555-0100 or submit Form DHS-123 in person.`
};

const READING_LEVEL_DESC = {
  child: 'Simplified to 1st–3rd grade reading level',
  simple: 'Simplified to 4th–6th grade reading level',
  teen: 'Simplified to 7th–9th grade reading level',
  adult: 'Simplified to 10th–12th grade reading level',
};

const LEVEL_PROMPTS = {
  child: 'Use very short sentences (under 12 words). Use only the most common everyday words a 7-year-old would know. Avoid any technical terms. Use "you" and "your" throughout.',
  simple: 'Use clear, simple sentences. Use everyday words. Avoid jargon. Explain any technical terms in plain English. Write as if explaining to a 10-year-old.',
  teen: 'Use clear, moderately detailed sentences. Minimal jargon. Explain technical terms briefly. Write for a 13-15 year old.',
  adult: 'Use plain English with some standard terminology where needed. Write for a high school graduate.',
};

// ============================================================
// STATE
// ============================================================
let apiKey = '';

// ============================================================
// DOM REFERENCES
// ============================================================
const apiKeyInput    = document.getElementById('api-key-input');
const toggleKeyBtn   = document.getElementById('toggle-key-btn');
const saveKeyBtn     = document.getElementById('save-key-btn');
const keyStatus      = document.getElementById('key-status');
const inputText      = document.getElementById('input-text');
const charCount      = document.getElementById('char-count');
const docType        = document.getElementById('doc-type');
const readingLevel   = document.getElementById('reading-level');
const translateBtn   = document.getElementById('translate-btn');
const clearBtn       = document.getElementById('clear-btn');
const pasteBtn       = document.getElementById('paste-btn');
const sampleBtn      = document.getElementById('sample-btn');
const copyBtn        = document.getElementById('copy-btn');
const printBtn       = document.getElementById('print-btn');
const outputContent  = document.getElementById('output-content');
const outputBlocks   = document.getElementById('output-blocks');
const emptyState     = document.getElementById('empty-state');
const outputLevelLbl = document.getElementById('output-level-label');
const toast          = document.getElementById('toast');

const chkSummary    = document.getElementById('include-summary');
const chkActions    = document.getElementById('include-actions');
const chkDates      = document.getElementById('include-dates');
const chkWarnings   = document.getElementById('include-warnings');

// ============================================================
// INITIALIZATION
// ============================================================
function init() {
  // Load saved key
  const saved = localStorage.getItem('cleartext_api_key');
  if (saved) {
    apiKey = saved;
    apiKeyInput.value = saved;
    setKeyStatus('✓ API key loaded from browser storage', 'success');
  }

  // Event listeners
  saveKeyBtn.addEventListener('click', saveApiKey);
  apiKeyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveApiKey(); });
  toggleKeyBtn.addEventListener('click', toggleKeyVisibility);

  inputText.addEventListener('input', updateCharCount);
  clearBtn.addEventListener('click', clearInput);
  pasteBtn.addEventListener('click', pasteFromClipboard);
  sampleBtn.addEventListener('click', loadSample);
  translateBtn.addEventListener('click', handleTranslate);
  copyBtn.addEventListener('click', copyToClipboard);
  printBtn.addEventListener('click', () => window.print());

  // Example card clicks — load a sample by type
  document.querySelectorAll('.example-card').forEach((card, idx) => {
    const types = ['legal', 'medical', 'government', 'financial', 'insurance', 'government'];
    card.addEventListener('click', () => {
      const type = types[idx] || 'legal';
      const text = SAMPLE_TEXTS[type] || SAMPLE_TEXTS.legal;
      inputText.value = text;
      updateCharCount();
      document.getElementById('settings-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast(`Loaded ${card.querySelector('.example-title').textContent} sample`);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });

  updateCharCount();
}

// ============================================================
// API KEY MANAGEMENT
// ============================================================
function saveApiKey() {
  const val = apiKeyInput.value.trim();
  if (!val) {
    setKeyStatus('⚠ Please enter your Gemini API key.', 'error');
    return;
  }
  if (!val.startsWith('AIza')) {
    setKeyStatus('⚠ This does not look like a valid Gemini API key (should start with "AIza").', 'error');
    return;
  }
  apiKey = val;
  localStorage.setItem('cleartext_api_key', val);
  setKeyStatus('✓ API key saved. Ready to translate!', 'success');
  showToast('API key saved ✓', 'success');
}

function setKeyStatus(msg, type) {
  keyStatus.textContent = msg;
  keyStatus.className = `key-status ${type || ''}`;
}

function toggleKeyVisibility() {
  const isPassword = apiKeyInput.type === 'password';
  apiKeyInput.type = isPassword ? 'text' : 'password';
  toggleKeyBtn.setAttribute('aria-label', isPassword ? 'Hide API key' : 'Show API key');
}

// ============================================================
// INPUT MANAGEMENT
// ============================================================
function updateCharCount() {
  const len = inputText.value.length;
  charCount.textContent = `${len.toLocaleString()} character${len !== 1 ? 's' : ''}`;
}

function clearInput() {
  inputText.value = '';
  updateCharCount();
  resetOutput();
  inputText.focus();
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    inputText.value = text;
    updateCharCount();
    showToast('Pasted from clipboard ✓');
  } catch {
    showToast('Could not access clipboard — try Ctrl+V', 'error');
  }
}

function loadSample() {
  const type = docType.value;
  const text = SAMPLE_TEXTS[type] || SAMPLE_TEXTS.legal;
  inputText.value = text;
  updateCharCount();
  showToast(`Sample ${type === 'auto' ? 'legal document' : type} loaded`);
}

// ============================================================
// TRANSLATION
// ============================================================
async function handleTranslate() {
  const text = inputText.value.trim();
  if (!text) {
    showToast('Please paste a document first', 'error');
    inputText.focus();
    return;
  }

  if (!apiKey) {
    showToast('Please add your Gemini API key first', 'error');
    document.getElementById('api-key-input').focus();
    document.getElementById('settings-panel').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Build output instructions
  const wantSummary  = chkSummary.checked;
  const wantActions  = chkActions.checked;
  const wantDates    = chkDates.checked;
  const wantWarnings = chkWarnings.checked;

  if (!wantSummary && !wantActions && !wantDates && !wantWarnings) {
    showToast('Please select at least one output option', 'error');
    return;
  }

  const level      = readingLevel.value;
  const levelDesc  = LEVEL_PROMPTS[level];
  const detectedType = docType.value === 'auto' ? 'document' : docType.value;

  // Build the prompt
  const sections = [];
  if (wantSummary) sections.push(`"summary": "<plain English summary of the entire document>"`);
  if (wantActions) sections.push(`"actions": ["<action item 1>", "<action item 2>", ...]`);
  if (wantDates)   sections.push(`"dates": ["<date/deadline 1>", "<date/deadline 2>", ...]`);
  if (wantWarnings) sections.push(`"warnings": ["<warning 1>", "<warning 2>", ...]`);

  const prompt = `You are an expert accessibility translator. Your job is to take a complex ${detectedType} and translate it into easy-to-understand plain English.

READING LEVEL INSTRUCTIONS: ${levelDesc}

DOCUMENT TO TRANSLATE:
"""
${text}
"""

TASK: Analyze this document carefully and return a JSON object with the following structure. Every item must be written at the specified reading level — short, clear sentences. Use "you" and "your" to address the reader directly.

{
  ${sections.join(',\n  ')}
}

GUIDELINES:
- "summary": A 3–6 sentence plain English explanation of what this document is about and what it means for the reader. No jargon. No legalese.
- "actions": Each action item should be a complete, specific instruction starting with a verb (e.g., "Pay $40 by Tuesday, March 12."). If there are deadlines, include them in the action item. Maximum 8 items.
- "dates": List every important date, deadline, or timeframe mentioned. Format: "March 12, 2024 — deadline to pay your bill." Maximum 8 items.
- "warnings": Things the reader MUST know to avoid penalties, fees, or losing their rights. Use plain language. Start each with "⚠". Maximum 5 items.

Return ONLY valid JSON. No markdown fences, no extra text — just the raw JSON object.`;

  // Update UI
  setLoading(true);
  resetOutput();

  try {
    const result = await callGemini(prompt);
    const parsed = parseResponse(result);
    renderOutput(parsed, level);
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
    console.error(err);
  } finally {
    setLoading(false);
  }
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `API error ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseResponse(raw) {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

// ============================================================
// RENDER OUTPUT
// ============================================================
function renderOutput(data, level) {
  outputBlocks.innerHTML = '';

  if (data.summary && chkSummary.checked) {
    outputBlocks.appendChild(createBlock('summary', '📄', 'Plain English Summary', data.summary));
  }

  if (data.actions?.length && chkActions.checked) {
    outputBlocks.appendChild(createListBlock('actions', '✅', 'What You Need To Do', data.actions, '→'));
  }

  if (data.dates?.length && chkDates.checked) {
    outputBlocks.appendChild(createListBlock('dates', '📅', 'Important Dates & Deadlines', data.dates, '🗓'));
  }

  if (data.warnings?.length && chkWarnings.checked) {
    outputBlocks.appendChild(createListBlock('warnings', '⚠️', 'Important Warnings', data.warnings, '⚠️'));
  }

  // Show output
  emptyState.hidden = true;
  outputBlocks.hidden = false;
  outputLevelLbl.textContent = READING_LEVEL_DESC[level];

  // Enable copy/print
  copyBtn.disabled  = false;
  printBtn.disabled = false;
}

function createBlock(type, emoji, title, text) {
  const block = document.createElement('div');
  block.className = `output-block block-${type}`;
  block.innerHTML = `
    <div class="output-block-header">
      <span role="img" aria-label="${title}" aria-hidden="true">${emoji}</span>
      ${escapeHTML(title)}
    </div>
    <div class="output-block-body">${escapeHTML(text)}</div>
  `;
  return block;
}

function createListBlock(type, emoji, title, items, bullet) {
  const block = document.createElement('div');
  block.className = `output-block block-${type}`;

  const lis = items.map(item => `
    <li>
      <span class="list-bullet" aria-hidden="true">${bullet}</span>
      <span>${escapeHTML(item)}</span>
    </li>
  `).join('');

  block.innerHTML = `
    <div class="output-block-header">
      <span role="img" aria-label="${title}" aria-hidden="true">${emoji}</span>
      ${escapeHTML(title)}
    </div>
    <div class="output-block-body">
      <ul class="output-block-list">${lis}</ul>
    </div>
  `;
  return block;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resetOutput() {
  outputBlocks.innerHTML = '';
  outputBlocks.hidden = true;
  emptyState.hidden = false;
  outputLevelLbl.textContent = 'Waiting for input…';
  copyBtn.disabled = true;
  printBtn.disabled = true;
}

// ============================================================
// COPY
// ============================================================
async function copyToClipboard() {
  const blocks = outputBlocks.querySelectorAll('.output-block');
  let text = 'ClearText Translation\n';
  text += '='.repeat(40) + '\n\n';

  blocks.forEach(block => {
    const header = block.querySelector('.output-block-header');
    const body   = block.querySelector('.output-block-body');
    text += `## ${header.textContent.trim()}\n`;
    const listItems = body.querySelectorAll('li');
    if (listItems.length) {
      listItems.forEach(li => {
        text += `• ${li.querySelector('span:last-child').textContent.trim()}\n`;
      });
    } else {
      text += body.textContent.trim() + '\n';
    }
    text += '\n';
  });

  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard ✓', 'success');
  } catch {
    showToast('Could not copy — try selecting and copying manually', 'error');
  }
}

// ============================================================
// UI HELPERS
// ============================================================
function setLoading(loading) {
  translateBtn.disabled = loading;
  translateBtn.classList.toggle('loading', loading);
}

let toastTimer;
function showToast(message, type = '') {
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = `toast ${type}`;
  }, 3000);
}

// ============================================================
// START
// ============================================================
init();
