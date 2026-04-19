/**
 * ClearText v2 – Application Logic
 * Claude AI · Auth · File Upload · Audio · Share · History · Multi-language
 */

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
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

NOTE: This claim was processed under your out-of-network benefits because Mercy General Hospital does not participate in your plan's network. If you believe this claim was processed incorrectly, you must submit a written appeal within 180 days of receiving this EOB to: BlueCross Appeals Department, P.O. Box 8000, City, ST 00000.`,

  government: `NOTICE OF DETERMINATION — SUPPLEMENTAL NUTRITION ASSISTANCE PROGRAM

Case Number: 2024-SNAP-089234   Effective Date of Action: April 30, 2024   Action Taken: CLOSURE

This is to inform you that your Supplemental Nutrition Assistance Program (SNAP) benefits have been CLOSED effective April 30, 2024, for the following reason(s):
— Failure to provide requested verification documents within the prescribed timeframe as required by 7 CFR 273.2(f).

Your monthly benefit amount of $387.00 will be discontinued.

RIGHT TO APPEAL: You have the right to request a fair hearing if you believe this action is incorrect. To preserve your right to continued benefits pending a hearing decision, you MUST request a hearing within 10 days from the date of this notice (by April 21, 2024). If you request a hearing after 10 days but within 90 days from the date of this notice, you may still have a hearing, but your benefits will not continue during the hearing process. To request a hearing, contact your local county office at 1-800-555-0100 or submit Form DHS-123 in person.`
};

const LEVEL_DESC = {
  child:  'Simplified to 1st–3rd grade reading level',
  simple: 'Simplified to 4th–6th grade reading level',
  teen:   'Simplified to 7th–9th grade reading level',
  adult:  'Simplified to 10th–12th grade reading level',
};

const LANG_NAMES = {
  en:'English',   es:'Spanish',      zh:'Mandarin',     hi:'Hindi',
  ar:'Arabic',    fr:'French',       de:'German',       pt:'Portuguese',
  ja:'Japanese',  ru:'Russian',      it:'Italian',      ko:'Korean',
  nl:'Dutch',     tr:'Turkish',      pl:'Polish',       sv:'Swedish',
  el:'Greek',     he:'Hebrew',       th:'Thai',         vi:'Vietnamese',
  id:'Indonesian',bn:'Bengali',      ur:'Urdu',         sw:'Swahili',
  fa:'Persian',   uk:'Ukrainian',    cs:'Czech',        ro:'Romanian',
  ms:'Malay',     da:'Danish'
};

const LANG_CODES_TTS = {
  en:'en-US', es:'es-ES', zh:'zh-CN', hi:'hi-IN',
  ar:'ar-SA', fr:'fr-FR', de:'de-DE', pt:'pt-BR',
  ja:'ja-JP', ru:'ru-RU', it:'it-IT', ko:'ko-KR',
  nl:'nl-NL', tr:'tr-TR', pl:'pl-PL', sv:'sv-SE',
  el:'el-GR', he:'he-IL', th:'th-TH', vi:'vi-VN',
  id:'id-ID', bn:'bn-IN', ur:'ur-PK', sw:'sw-KE',
  fa:'fa-IR', uk:'uk-UA', cs:'cs-CZ', ro:'ro-RO',
  ms:'ms-MY', da:'da-DK'
};

const DOC_ICONS = {
  legal:'⚖️', medical:'🏥', financial:'💰',
  government:'🏛️', insurance:'🛡️', contract:'📋', auto:'📄'
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
const state = {
  apiKey:          '',
  claudeModel:     'claude-sonnet-4-5',
  authToken:       null,
  currentUser:     null,
  currentOutput:   null,
  currentInputText:'',
  selectedLangs:   ['en'],
  activeLang:      'en',
  attachedFile:    null,   // File object
  isSpeaking:      false,
  isPaused:        false,
};

// ═══════════════════════════════════════════════════════════════
// DOM REFS
// ═══════════════════════════════════════════════════════════════
const $ = id => document.getElementById(id);

const apiKeyInput      = $('api-key-input');
const toggleKeyBtn     = $('toggle-key-btn');
const saveKeyBtn       = $('save-key-btn');
const keyStatus        = $('key-status');
const claudeModelSel   = $('claude-model');

const inputText        = $('input-text');
const charCount        = $('char-count');
const docType          = $('doc-type');
const readingLevel     = $('reading-level');
const clearBtn         = $('clear-btn');
const pasteBtn         = $('paste-btn');
const sampleBtn        = $('sample-btn');

const fileUploadZone   = $('file-upload-zone');
const fileInput        = $('file-input');
const uploadBrowseBtn  = $('upload-browse-btn');
const uploadPrompt     = $('upload-prompt');
const uploadFileChip   = $('upload-file-chip');
const fileChipName     = $('file-chip-name');
const fileChipSize     = $('file-chip-size');
const fileChipRemove   = $('file-chip-remove');

const langChips        = document.querySelectorAll('.lang-chip');
const translateBtn     = $('translate-btn');
const translateStatus  = $('translate-status-text');
const chkSummary       = $('include-summary');
const chkActions       = $('include-actions');
const chkDates         = $('include-dates');
const chkWarnings      = $('include-warnings');

const speakBtn         = $('speak-btn');
const pauseSpeakBtn    = $('pause-speak-btn');
const stopSpeakBtn     = $('stop-speak-btn');
const shareBtn         = $('share-btn');
const saveHistoryBtn   = $('save-history-btn');
const copyBtn          = $('copy-btn');
const printBtn         = $('print-btn');

const outputLevelLabel = $('output-level-label');
const outputLangTabs   = $('output-lang-tabs');
const outputBlocks     = $('output-blocks');
const emptyState       = $('empty-state');

const authModal        = $('auth-modal');
const closeAuthModal   = $('close-auth-modal');
const tabLogin         = $('tab-login');
const tabRegister      = $('tab-register');
const formLogin        = $('form-login');
const formRegister     = $('form-register');
const loginEmail       = $('login-email');
const loginPassword    = $('login-password');
const loginError       = $('login-error');
const registerError    = $('register-error');
const loginSubmitBtn   = $('login-submit-btn');
const registerSubmitBtn= $('register-submit-btn');

const signinNavBtn     = $('signin-nav-btn');
const userNav          = $('user-nav');
const userAvatarBtn    = $('user-avatar-btn');
const userAvatarInitial= $('user-avatar-initial');
const userDropdown     = $('user-dropdown');
const userDropdownName = $('user-dropdown-name');
const userDropdownEmail= $('user-dropdown-email');
const logoutBtn        = $('logout-btn');
const openHistoryBtn   = $('open-history-btn');

const historyPanel     = $('history-panel');
const panelBackdrop    = $('panel-backdrop');
const closeHistoryBtn  = $('close-history-panel');
const historyList      = $('history-list');
const historyEmpty     = $('history-empty');
const historyCountLabel= $('history-count-label');

const toastEl          = $('toast');

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
function init() {
  loadSavedConfig();
  bindEvents();
  updateAuthUI();
  checkSharedLink();
  initScrollAnimations();
}

function loadSavedConfig() {
  const key = localStorage.getItem('cleartext_api_key');
  if (key) {
    state.apiKey  = key;
    apiKeyInput.value = key;
    setKeyStatus('✓ API key loaded', 'success');
  }
  const model = localStorage.getItem('cleartext_model');
  if (model) {
    state.claudeModel = model;
    claudeModelSel.value = model;
  }
  const token = localStorage.getItem('cleartext_token');
  if (token) {
    state.authToken = token;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        state.currentUser = { id: payload.id, name: payload.name, email: payload.email };
      } else {
        localStorage.removeItem('cleartext_token');
        state.authToken = null;
      }
    } catch { state.authToken = null; }
  }
}

// ═══════════════════════════════════════════════════════════════
// EVENT BINDING
// ═══════════════════════════════════════════════════════════════
function bindEvents() {
  // Config
  saveKeyBtn.addEventListener('click', saveApiKey);
  apiKeyInput.addEventListener('keydown', e => e.key === 'Enter' && saveApiKey());
  toggleKeyBtn.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });
  claudeModelSel.addEventListener('change', () => {
    state.claudeModel = claudeModelSel.value;
    localStorage.setItem('cleartext_model', state.claudeModel);
  });

  // Input
  inputText.addEventListener('input', () => {
    updateCharCount();
    if (state.attachedFile) clearFile();
  });
  clearBtn.addEventListener('click', clearAll);
  pasteBtn.addEventListener('click', pasteFromClipboard);
  sampleBtn.addEventListener('click', loadSample);

  // File upload
  fileUploadZone.addEventListener('click', e => {
    if (e.target !== fileChipRemove && !uploadFileChip.contains(e.target)) {
      fileInput.click();
    }
  });
  fileUploadZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });
  uploadBrowseBtn.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
  fileInput.addEventListener('change', () => fileInput.files[0] && handleFileSelect(fileInput.files[0]));
  fileChipRemove.addEventListener('click', e => { e.stopPropagation(); clearFile(); });

  fileUploadZone.addEventListener('dragover', e => { e.preventDefault(); fileUploadZone.classList.add('drag-over'); });
  fileUploadZone.addEventListener('dragleave', () => fileUploadZone.classList.remove('drag-over'));
  fileUploadZone.addEventListener('drop', e => {
    e.preventDefault();
    fileUploadZone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  });

  // Language chips
  langChips.forEach(chip => {
    if (chip.classList.contains('disabled')) return;
    chip.addEventListener('click', () => toggleLang(chip.dataset.lang));
    chip.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleLang(chip.dataset.lang); }
    });
  });

  // Translate
  translateBtn.addEventListener('click', handleTranslate);

  // Output actions
  speakBtn.addEventListener('click', startSpeech);
  pauseSpeakBtn.addEventListener('click', togglePauseSpeech);
  stopSpeakBtn.addEventListener('click', stopSpeech);
  shareBtn.addEventListener('click', handleShare);
  saveHistoryBtn.addEventListener('click', handleSaveHistory);
  copyBtn.addEventListener('click', copyOutput);
  printBtn.addEventListener('click', () => window.print());

  // Auth
  signinNavBtn.addEventListener('click', () => showAuthModal('login'));
  closeAuthModal.addEventListener('click', hideAuthModal);
  authModal.addEventListener('click', e => e.target === authModal && hideAuthModal());
  tabLogin.addEventListener('click', () => switchAuthTab('login'));
  tabRegister.addEventListener('click', () => switchAuthTab('register'));
  formLogin.addEventListener('submit', handleLogin);
  formRegister.addEventListener('submit', handleRegister);
  logoutBtn.addEventListener('click', handleLogout);
  userAvatarBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = !userDropdown.hidden;
    userDropdown.hidden = open;
    userAvatarBtn.setAttribute('aria-expanded', !open);
  });
  document.addEventListener('click', () => {
    userDropdown.hidden = true;
    userAvatarBtn.setAttribute('aria-expanded', 'false');
  });

  // History
  openHistoryBtn.addEventListener('click', openHistoryPanel);
  closeHistoryBtn.addEventListener('click', closeHistoryPanel);
  panelBackdrop.addEventListener('click', closeHistoryPanel);

  // Example cards
  document.querySelectorAll('.example-card').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.type || 'legal';
      inputText.value = SAMPLE_TEXTS[type] || SAMPLE_TEXTS.legal;
      updateCharCount();
      clearFile();
      showToast(`📄 Loaded ${card.querySelector('.example-title').textContent} sample`);
      document.getElementById('settings-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    card.addEventListener('keydown', e => { if (e.key === 'Enter') card.click(); });
  });

  // Speech end events
  if ('speechSynthesis' in window) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {});
  }
}

// ═══════════════════════════════════════════════════════════════
// API KEY
// ═══════════════════════════════════════════════════════════════
function saveApiKey() {
  const val = apiKeyInput.value.trim();
  if (!val) { setKeyStatus('⚠ Please enter your API key', 'error'); return; }
  if (!val.startsWith('sk-ant')) {
    setKeyStatus('⚠ Doesn't look like a Claude key (should start with sk-ant…)', 'error');
    return;
  }
  state.apiKey = val;
  localStorage.setItem('cleartext_api_key', val);
  setKeyStatus('✓ API key saved. Ready to translate!', 'success');
  showToast('API key saved ✓', 'success');
}

function setKeyStatus(msg, type) {
  keyStatus.textContent = msg;
  keyStatus.className = `key-status ${type || ''}`;
}

// ═══════════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════════
function updateCharCount() {
  const n = inputText.value.length;
  charCount.textContent = `${n.toLocaleString()} character${n !== 1 ? 's' : ''}`;
}

function clearAll() {
  inputText.value = '';
  updateCharCount();
  clearFile();
  resetOutput();
  inputText.focus();
}

async function pasteFromClipboard() {
  try {
    inputText.value = await navigator.clipboard.readText();
    updateCharCount();
    clearFile();
    showToast('Pasted from clipboard ✓');
  } catch {
    showToast('Cannot access clipboard — press Ctrl+V', 'error');
  }
}

function loadSample() {
  const type = docType.value;
  inputText.value = SAMPLE_TEXTS[type] || SAMPLE_TEXTS.legal;
  updateCharCount();
  clearFile();
  showToast('Sample document loaded');
}

// ═══════════════════════════════════════════════════════════════
// FILE UPLOAD
// ═══════════════════════════════════════════════════════════════
function handleFileSelect(file) {
  const allowed = ['application/pdf','image/jpeg','image/png','image/gif','image/webp'];
  if (!allowed.includes(file.type)) {
    showToast('Only PDF and images (JPG, PNG, GIF, WebP) are supported', 'error');
    return;
  }
  if (file.size > 15 * 1024 * 1024) {
    showToast('File too large — max size is 15 MB', 'error');
    return;
  }
  state.attachedFile = file;
  inputText.value = '';
  inputText.disabled = true;
  inputText.style.opacity = '.4';
  updateCharCount();

  fileChipName.textContent = file.name;
  fileChipSize.textContent = formatFileSize(file.size);
  uploadFileChip.hidden    = false;
  uploadPrompt.hidden      = true;
  showToast(`📎 ${file.name} attached`);
}

function clearFile() {
  state.attachedFile       = null;
  fileInput.value          = '';
  inputText.disabled       = false;
  inputText.style.opacity  = '';
  uploadFileChip.hidden    = true;
  uploadPrompt.hidden      = false;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

// ═══════════════════════════════════════════════════════════════
// LANGUAGE SELECTION
// ═══════════════════════════════════════════════════════════════
function toggleLang(lang) {
  if (lang === 'en') return;
  const chip = document.querySelector(`.lang-chip[data-lang="${lang}"]`);
  const selected = state.selectedLangs.includes(lang);
  if (selected) {
    state.selectedLangs = state.selectedLangs.filter(l => l !== lang);
    chip.classList.remove('selected');
    chip.setAttribute('aria-pressed', 'false');
  } else {
    state.selectedLangs.push(lang);
    chip.classList.add('selected');
    chip.setAttribute('aria-pressed', 'true');
  }
}

// ═══════════════════════════════════════════════════════════════
// TRANSLATION
// ═══════════════════════════════════════════════════════════════
async function handleTranslate() {
  if (!state.apiKey) {
    showToast('Please save your Claude API key first', 'error');
    document.getElementById('settings-panel').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (!chkSummary.checked && !chkActions.checked && !chkDates.checked && !chkWarnings.checked) {
    showToast('Select at least one output section', 'error');
    return;
  }

  setLoading(true);
  resetOutput();

  try {
    let result;
    if (state.attachedFile) {
      result = await translateFile();
    } else {
      const text = inputText.value.trim();
      if (!text) { showToast('Paste a document or upload a file first', 'error'); return; }
      state.currentInputText = text;
      result = await translateText(text);
    }
    renderOutput(result);
    enableOutputActions();
  } catch (err) {
    showToast(err.message || 'Translation failed. Please try again.', 'error');
    console.error(err);
  } finally {
    setLoading(false);
  }
}

async function translateText(text) {
  const r = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': state.apiKey,
      ...(state.authToken ? { 'Authorization': `Bearer ${state.authToken}` } : {})
    },
    body: JSON.stringify({
      text,
      reading_level:    readingLevel.value,
      doc_type:         docType.value,
      include_actions:  chkActions.checked,
      include_dates:    chkDates.checked,
      include_warnings: chkWarnings.checked,
      target_languages: state.selectedLangs,
      claude_model:     state.claudeModel,
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Translation failed');
  return data.output;
}

async function translateFile() {
  const formData = new FormData();
  formData.append('file', state.attachedFile);
  formData.append('reading_level',    readingLevel.value);
  formData.append('doc_type',         docType.value);
  formData.append('include_actions',  chkActions.checked);
  formData.append('include_dates',    chkDates.checked);
  formData.append('include_warnings', chkWarnings.checked);
  formData.append('claude_model',     state.claudeModel);
  formData.append('target_languages', JSON.stringify(state.selectedLangs));

  updateTranslateStatus('Extracting text from file…');
  const r = await fetch('/api/translate/file', {
    method: 'POST',
    headers: {
      'x-api-key': state.apiKey,
      ...(state.authToken ? { 'Authorization': `Bearer ${state.authToken}` } : {})
    },
    body: formData
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'File processing failed');
  if (data.extracted_text) {
    state.currentInputText = data.extracted_text;
    inputText.value        = data.extracted_text;
    inputText.disabled     = false;
    inputText.style.opacity = '';
    updateCharCount();
  }
  return data.output;
}

function updateTranslateStatus(msg) {
  translateStatus.textContent = msg;
}

// ═══════════════════════════════════════════════════════════════
// RENDER OUTPUT
// ═══════════════════════════════════════════════════════════════
function renderOutput(output) {
  state.currentOutput = output;
  state.activeLang    = 'en';
  outputBlocks.innerHTML = '';

  // Build language tab bar
  const hasTranslations = output.translations && Object.keys(output.translations).length > 0;
  buildLangTabs(hasTranslations ? Object.keys(output.translations) : []);

  // English output
  const enPanel = buildLangPanel(output, 'en');
  outputBlocks.appendChild(enPanel);

  // Translated outputs
  if (hasTranslations) {
    Object.entries(output.translations).forEach(([lang, data]) => {
      const panel = buildLangPanel(data, lang);
      panel.hidden = true;
      outputBlocks.appendChild(panel);
    });
  }

  emptyState.hidden   = true;
  outputBlocks.hidden = false;
  outputLevelLabel.textContent = LEVEL_DESC[readingLevel.value] || '';
  requestAnimationFrame(() => requestAnimationFrame(() => animateOutputBlocks()));
}

function buildLangTabs(extraLangs) {
  if (extraLangs.length === 0) {
    outputLangTabs.hidden = true;
    return;
  }
  outputLangTabs.hidden = false;
  outputLangTabs.innerHTML = '';

  const allLangs = ['en', ...extraLangs];
  allLangs.forEach(lang => {
    const btn = document.createElement('button');
    btn.className   = 'output-lang-tab' + (lang === 'en' ? ' active' : '');
    btn.textContent = LANG_NAMES[lang] || lang.toUpperCase();
    btn.dataset.lang = lang;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', lang === 'en' ? 'true' : 'false');
    btn.addEventListener('click', () => switchOutputLang(lang));
    outputLangTabs.appendChild(btn);
  });
}

function buildLangPanel(data, lang) {
  const panel = document.createElement('div');
  panel.className = 'lang-output-panel';
  panel.dataset.lang = lang;

  if (data.summary && chkSummary.checked) {
    panel.appendChild(buildTextBlock('summary', '📄', 'Plain English Summary', data.summary));
  }
  if (data.actions?.length && chkActions.checked) {
    panel.appendChild(buildListBlock('actions',  '✅', 'What You Need To Do', data.actions, '→'));
  }
  if (data.dates?.length && chkDates.checked) {
    panel.appendChild(buildListBlock('dates',    '📅', 'Important Dates & Deadlines', data.dates, '🗓'));
  }
  if (data.warnings?.length && chkWarnings.checked) {
    panel.appendChild(buildListBlock('warnings', '⚠️', 'Important Warnings', data.warnings, '⚠️'));
  }
  return panel;
}

function switchOutputLang(lang) {
  state.activeLang = lang;
  document.querySelectorAll('.lang-output-panel').forEach(p => {
    p.hidden = p.dataset.lang !== lang;
  });
  document.querySelectorAll('.output-lang-tab').forEach(t => {
    const isActive = t.dataset.lang === lang;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function buildTextBlock(type, emoji, title, text) {
  const div = document.createElement('div');
  div.className = `output-block block-${type}`;
  div.innerHTML = `
    <div class="output-block-header"><span aria-hidden="true">${emoji}</span> ${esc(title)}</div>
    <div class="output-block-body">${esc(text)}</div>`;
  return div;
}

function buildListBlock(type, emoji, title, items, bullet) {
  const div = document.createElement('div');
  div.className = `output-block block-${type}`;
  const lis = items.map(i => `<li><span class="list-bullet" aria-hidden="true">${bullet}</span><span>${esc(i)}</span></li>`).join('');
  div.innerHTML = `
    <div class="output-block-header"><span aria-hidden="true">${emoji}</span> ${esc(title)}</div>
    <div class="output-block-body"><ul class="output-block-list">${lis}</ul></div>`;
  return div;
}

function enableOutputActions() {
  speakBtn.disabled      = false;
  shareBtn.disabled      = false;
  copyBtn.disabled       = false;
  printBtn.disabled      = false;
  saveHistoryBtn.disabled = !state.currentUser; // only if logged in
}

function resetOutput() {
  state.currentOutput    = null;
  outputBlocks.innerHTML = '';
  outputBlocks.hidden    = true;
  outputLangTabs.innerHTML = '';
  outputLangTabs.hidden  = true;
  emptyState.hidden      = false;
  outputLevelLabel.textContent = 'Waiting for input…';
  speakBtn.disabled      = true;
  shareBtn.disabled      = true;
  copyBtn.disabled       = true;
  printBtn.disabled      = true;
  saveHistoryBtn.disabled = true;
  stopSpeech();
  updateTranslateStatus('Powered by Claude AI');
}

// ═══════════════════════════════════════════════════════════════
// AUDIO – Web Speech API
// ═══════════════════════════════════════════════════════════════
function buildSpeechText(output, lang) {
  const src = (lang !== 'en' && output.translations?.[lang]) ? output.translations[lang] : output;
  const parts = [];
  if (src.summary)          parts.push(src.summary);
  if (src.actions?.length)  parts.push('Things you need to do. ' + src.actions.join('. '));
  if (src.dates?.length)    parts.push('Important dates. '       + src.dates.join('. '));
  if (src.warnings?.length) parts.push('Warnings. '              + src.warnings.join('. '));
  return parts.join('. ');
}

function startSpeech() {
  if (!('speechSynthesis' in window)) {
    showToast('Your browser does not support text-to-speech', 'error');
    return;
  }
  if (!state.currentOutput) return;

  window.speechSynthesis.cancel();
  state.isSpeaking = false;
  state.isPaused   = false;

  const text = buildSpeechText(state.currentOutput, state.activeLang);
  const utt  = new SpeechSynthesisUtterance(text);
  utt.lang   = LANG_CODES_TTS[state.activeLang] || 'en-US';
  utt.rate   = 0.88;
  utt.pitch  = 1;

  utt.onstart = () => {
    state.isSpeaking = true;
    speakBtn.hidden      = true;
    pauseSpeakBtn.hidden = false;
    stopSpeakBtn.hidden  = false;
  };
  utt.onend = utt.onerror = () => {
    state.isSpeaking = false;
    speakBtn.hidden      = false;
    pauseSpeakBtn.hidden = true;
    stopSpeakBtn.hidden  = true;
    pauseSpeakBtn.querySelector('svg').innerHTML = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
  };

  window.speechSynthesis.speak(utt);
}

function togglePauseSpeech() {
  if (!('speechSynthesis' in window)) return;
  if (state.isPaused) {
    window.speechSynthesis.resume();
    state.isPaused = false;
    pauseSpeakBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
    pauseSpeakBtn.setAttribute('aria-label', 'Pause reading');
  } else {
    window.speechSynthesis.pause();
    state.isPaused = true;
    pauseSpeakBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    pauseSpeakBtn.setAttribute('aria-label', 'Resume reading');
  }
}

function stopSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  state.isSpeaking = false;
  state.isPaused   = false;
  speakBtn.hidden      = false;
  pauseSpeakBtn.hidden = true;
  stopSpeakBtn.hidden  = true;
}

// ═══════════════════════════════════════════════════════════════
// SHARE
// ═══════════════════════════════════════════════════════════════
async function handleShare() {
  if (!state.currentOutput) return;
  try {
    shareBtn.disabled = true;
    const r = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        output:        state.currentOutput,
        reading_level: readingLevel.value,
        doc_type:      docType.value,
        input_preview: state.currentInputText.substring(0, 150),
      })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    const fullUrl = `${location.origin}/s/${data.id}`;
    await navigator.clipboard.writeText(fullUrl);
    showToast('🔗 Share link copied to clipboard!', 'success');
  } catch (err) {
    showToast(err.message || 'Could not create share link', 'error');
  } finally {
    shareBtn.disabled = false;
  }
}

async function checkSharedLink() {
  // Check path /s/:id
  const pathMatch = location.pathname.match(/^\/s\/([a-f0-9]{8})$/i);
  // Or query ?s=...
  const queryParam = new URLSearchParams(location.search).get('s');
  const shareId = pathMatch?.[1] || queryParam;
  if (!shareId) return;

  try {
    const r = await fetch(`/api/share/${shareId}`);
    if (!r.ok) { showToast('Shared translation not found', 'error'); return; }
    const data = await r.json();
    state.currentOutput = data.output;

    // Show a banner
    const banner = document.createElement('div');
    banner.style.cssText = `background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.3);border-radius:12px;padding:12px 20px;text-align:center;color:#818cf8;font-size:.875rem;margin:0 40px 20px;position:relative;z-index:1;`;
    banner.innerHTML = `<strong>You're viewing a shared translation.</strong> <button onclick="location.href='/'" style="background:none;border:none;color:#818cf8;cursor:pointer;text-decoration:underline;font-size:.875rem;">Start your own →</button>`;
    document.querySelector('main').prepend(banner);

    renderOutput(data.output);
    enableOutputActions();
    document.getElementById('output-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    console.error('Share load error:', err);
  }
}

// ═══════════════════════════════════════════════════════════════
// COPY OUTPUT
// ═══════════════════════════════════════════════════════════════
async function copyOutput() {
  if (!state.currentOutput) return;
  const output  = state.currentOutput;
  const langData = (state.activeLang !== 'en' && output.translations?.[state.activeLang])
    ? output.translations[state.activeLang] : output;

  let text = `ClearText Translation (${LANG_NAMES[state.activeLang] || 'English'})\n${'═'.repeat(40)}\n\n`;
  if (langData.summary)         text += `SUMMARY\n${langData.summary}\n\n`;
  if (langData.actions?.length) text += `WHAT TO DO\n${langData.actions.map(a => `→ ${a}`).join('\n')}\n\n`;
  if (langData.dates?.length)   text += `KEY DATES\n${langData.dates.map(d => `• ${d}`).join('\n')}\n\n`;
  if (langData.warnings?.length)text += `WARNINGS\n${langData.warnings.join('\n')}\n`;

  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard ✓', 'success');
  } catch {
    showToast('Copy failed — try selecting text manually', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTH UI
// ═══════════════════════════════════════════════════════════════
function updateAuthUI() {
  const loggedIn = !!state.currentUser;
  signinNavBtn.hidden = loggedIn;
  userNav.hidden      = !loggedIn;
  saveHistoryBtn.disabled = !loggedIn || !state.currentOutput;

  if (loggedIn) {
    const initial = (state.currentUser.name || 'U').charAt(0).toUpperCase();
    userAvatarInitial.textContent = initial;
    userDropdownName.textContent  = state.currentUser.name;
    userDropdownEmail.textContent = state.currentUser.email;
  }
}

function showAuthModal(tab = 'login') {
  authModal.hidden = false;
  document.body.style.overflow = 'hidden';
  switchAuthTab(tab);
  setTimeout(() => (tab === 'login' ? loginEmail : $('reg-name')).focus(), 100);
}

function hideAuthModal() {
  authModal.hidden = true;
  document.body.style.overflow = '';
  loginError.textContent    = '';
  registerError.textContent = '';
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  tabLogin.classList.toggle('active', isLogin);
  tabRegister.classList.toggle('active', !isLogin);
  tabLogin.setAttribute('aria-selected', isLogin ? 'true' : 'false');
  tabRegister.setAttribute('aria-selected', !isLogin ? 'true' : 'false');
  formLogin.hidden    = !isLogin;
  formRegister.hidden = isLogin;
}

async function handleLogin(e) {
  e.preventDefault();
  loginError.textContent = '';
  loginSubmitBtn.disabled = true;
  loginSubmitBtn.textContent = 'Signing in…';
  try {
    const r    = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail.value, password: loginPassword.value })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    setAuthState(data.token, data.user);
    hideAuthModal();
    showToast(`Welcome back, ${data.user.name}! 👋`, 'success');
  } catch (err) {
    loginError.textContent = err.message;
  } finally {
    loginSubmitBtn.disabled  = false;
    loginSubmitBtn.textContent = 'Sign In';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  registerError.textContent = '';
  registerSubmitBtn.disabled = true;
  registerSubmitBtn.textContent = 'Creating account…';
  try {
    const r    = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:     $('reg-name').value,
        email:    $('reg-email').value,
        password: $('reg-password').value
      })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    setAuthState(data.token, data.user);
    hideAuthModal();
    showToast(`Account created! Welcome, ${data.user.name} 🎉`, 'success');
  } catch (err) {
    registerError.textContent = err.message;
  } finally {
    registerSubmitBtn.disabled  = false;
    registerSubmitBtn.textContent = 'Create Account';
  }
}

function handleLogout() {
  localStorage.removeItem('cleartext_token');
  state.authToken    = null;
  state.currentUser  = null;
  userDropdown.hidden = true;
  updateAuthUI();
  showToast('Signed out successfully');
}

function setAuthState(token, user) {
  state.authToken   = token;
  state.currentUser = user;
  localStorage.setItem('cleartext_token', token);
  updateAuthUI();
}

// ═══════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════
async function handleSaveHistory() {
  if (!state.authToken || !state.currentOutput) return;
  saveHistoryBtn.disabled  = true;
  saveHistoryBtn.textContent = '…';
  try {
    const title = state.currentInputText.substring(0, 50).trim() + '…' || 'Translation';
    const r     = await fetch('/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify({
        title,
        input_text:    state.currentInputText,
        output:        state.currentOutput,
        reading_level: readingLevel.value,
        doc_type:      docType.value,
        languages:     state.selectedLangs,
      })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    showToast('💾 Saved to history', 'success');
    saveHistoryBtn.textContent = '✓ Saved';
    setTimeout(() => {
      saveHistoryBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save`;
    }, 2000);
  } catch (err) {
    showToast(err.message || 'Could not save', 'error');
    saveHistoryBtn.disabled = false;
  }
}

async function openHistoryPanel() {
  if (!state.authToken) { showAuthModal('login'); return; }
  panelBackdrop.hidden = false;
  historyPanel.classList.add('open');
  historyPanel.setAttribute('aria-hidden', 'false');
  openHistoryBtn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  await loadHistory();
}

function closeHistoryPanel() {
  panelBackdrop.hidden = true;
  historyPanel.classList.remove('open');
  historyPanel.setAttribute('aria-hidden', 'true');
  openHistoryBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

async function loadHistory() {
  historyList.innerHTML = '';
  historyEmpty.hidden = false;
  try {
    const r    = await fetch('/api/history', { headers: { 'Authorization': `Bearer ${state.authToken}` } });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);

    const items = data.history;
    historyCountLabel.textContent = `${items.length} translation${items.length !== 1 ? 's' : ''} saved`;

    if (items.length === 0) {
      historyList.appendChild(historyEmpty);
      historyEmpty.hidden = false;
      return;
    }
    historyEmpty.hidden = true;
    items.forEach(item => historyList.appendChild(buildHistoryItem(item)));
  } catch (err) {
    showToast(err.message || 'Could not load history', 'error');
  }
}

function buildHistoryItem(item) {
  const icon = DOC_ICONS[item.doc_type] || '📄';
  const date = new Date(item.created_at * 1000).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  const langs = item.languages ? item.languages.split(',').map(l => LANG_NAMES[l] || l).join(', ') : 'English';

  const div = document.createElement('div');
  div.className = 'history-item';
  div.setAttribute('role', 'listitem');
  div.innerHTML = `
    <div class="history-item-icon">${icon}</div>
    <div class="history-item-body">
      <div class="history-item-title">${esc(item.title)}</div>
      <div class="history-item-meta">${date} · ${LEVEL_DESC[item.reading_level] || item.reading_level} · ${langs}</div>
    </div>
    <button class="history-item-delete" data-id="${item.id}" aria-label="Delete this translation">🗑</button>`;

  div.querySelector('.history-item-body').addEventListener('click', () => loadHistoryItem(item.id));
  div.querySelector('.history-item-icon').addEventListener('click',  () => loadHistoryItem(item.id));
  div.querySelector('.history-item-delete').addEventListener('click', e => {
    e.stopPropagation();
    deleteHistoryItem(item.id, div);
  });
  return div;
}

async function loadHistoryItem(id) {
  try {
    const r    = await fetch(`/api/history/${id}`, { headers: { 'Authorization': `Bearer ${state.authToken}` } });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    state.currentOutput    = data.item.output;
    state.currentInputText = data.item.input_text;
    inputText.value        = data.item.input_text;
    updateCharCount();
    renderOutput(data.item.output);
    enableOutputActions();
    closeHistoryPanel();
    document.getElementById('output-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('📂 Translation loaded');
  } catch (err) {
    showToast(err.message || 'Could not load item', 'error');
  }
}

async function deleteHistoryItem(id, el) {
  try {
    const r = await fetch(`/api/history/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
    el.style.animation = 'fadeIn .2s ease reverse';
    setTimeout(() => { el.remove(); showToast('Deleted'); }, 200);
  } catch (err) {
    showToast(err.message || 'Delete failed', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════
function setLoading(loading) {
  translateBtn.disabled = loading;
  translateBtn.classList.toggle('loading', loading);
  if (loading) {
    translateStatus.textContent = state.attachedFile ? 'Processing file…' : 'Translating…';
    // Show skeleton in output
    emptyState.hidden   = true;
    outputBlocks.hidden = true;
    const existing = document.getElementById('output-skeleton-el');
    if (!existing) {
      const skel = document.createElement('div');
      skel.id = 'output-skeleton-el';
      skel.className = 'output-skeleton';
      skel.innerHTML = `
        <div class="sk-block"><div class="sk-header"><div class="sk-h skeleton" style="width:40%"></div></div><div class="sk-body"><div class="sk-line skeleton"></div><div class="sk-line skeleton"></div><div class="sk-line skeleton"></div></div></div>
        <div class="sk-block"><div class="sk-header"><div class="sk-h skeleton" style="width:30%"></div></div><div class="sk-body"><div class="sk-line skeleton"></div><div class="sk-line skeleton"></div></div></div>
        <div class="sk-block"><div class="sk-header"><div class="sk-h skeleton" style="width:35%"></div></div><div class="sk-body"><div class="sk-line skeleton"></div><div class="sk-line skeleton"></div></div></div>`;
      document.getElementById('output-content').appendChild(skel);
    }
  } else {
    const skel = document.getElementById('output-skeleton-el');
    if (skel) skel.remove();
    updateTranslateStatus('AI-powered accessibility translation');
  }
}

let toastTimer;
function showToast(msg, type = '') {
  toastEl.textContent = msg;
  toastEl.className   = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.className = `toast ${type}`; }, 3500);
}

/* ── Scroll animations observer ─────────── */
function initScrollAnimations() {
  const targets = document.querySelectorAll('.step, .example-card, .stat');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
  targets.forEach(el => obs.observe(el));
}

/* ── Animate output blocks ───────────────── */
function animateOutputBlocks() {
  const blocks = document.querySelectorAll('.lang-output-panel:not([hidden]) .output-block');
  blocks.forEach((b, i) => {
    setTimeout(() => b.classList.add('visible'), i * 90);
  });
}

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// ═══════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════
init();
