# ClearText 🌍

> **Making the written world accessible to everyone.**

ClearText is an AI-powered accessibility tool that translates complex legal, medical, and bureaucratic documents into plain English — complete with action items, audio read-aloud, and support for 30 languages.

## ✨ Features

- **📋 Smart Simplification** — Paste text or upload a PDF/image; get a plain-English summary at 4 reading levels (Child → Adult)
- **✅ Action Items** — Specific instructions with deadlines: *"Pay $459 by April 30. Here's how."*
- **📅 Key Dates** — Every important date and deadline extracted automatically
- **⚠️ Warnings** — Critical consequences highlighted in plain language
- **🔊 Audio Read-Aloud** — Web Speech API reads output in any of 30 supported languages
- **🌍 30 Languages** — Simultaneous translation: English, Spanish, Mandarin, Hindi, Arabic, French, German, Portuguese, Japanese, Russian, Italian, Korean, Dutch, Turkish, Polish, Swedish, Greek, Hebrew, Thai, Vietnamese, Indonesian, Bengali, Urdu, Swahili, Persian, Ukrainian, Czech, Romanian, Malay, Danish
- **📄 PDF & Image OCR** — Upload documents directly; Claude Vision extracts text from images
- **🔗 Share Links** — One-click shareable URL to send the plain-English version to family
- **💾 Translation History** — Create a free account to save and revisit translations
- **🖨️ Print-Ready** — Clean print layout for taking to appointments

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **AI** | [Anthropic Claude](https://anthropic.com) (Sonnet, Opus, Haiku) |
| **Backend** | Node.js + Express |
| **Database** | NeDB (embedded, pure JS — no compilation needed) |
| **Auth** | JWT + bcryptjs |
| **File Processing** | Multer + pdf-parse + Claude Vision |
| **Frontend** | Vanilla HTML/CSS/JS |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A free [Claude API key](https://console.anthropic.com/settings/keys)

### Installation

```bash
git clone https://github.com/Atri02/ClearText.git
cd ClearText
npm install
node server.js
```

Then open **http://localhost:5050**, paste your Claude API key, and start translating.

### API Key Security
Your API key is stored **only in your browser's localStorage** and sent as a header to the backend, which proxies requests to Anthropic. Keys are **never stored** in the database or on the server.

## ☁️ Deploy to Render (Free)

1. Fork this repo
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo — `render.yaml` is already configured
4. Click **Deploy**
5. Add `JWT_SECRET` environment variable (any random string)

## 📂 Project Structure

```
ClearText/
├── server.js           # Express server entry point
├── db.js               # NeDB database setup
├── middleware/
│   └── auth.js         # JWT authentication middleware
├── routes/
│   ├── auth.js         # Register / Login / Me
│   ├── translate.js    # Text + file translation via Claude API
│   ├── history.js      # Saved translation CRUD
│   └── share.js        # Shareable link generation
├── public/
│   ├── index.html      # Single-page application
│   ├── style.css       # Design system + animations
│   └── app.js          # All client-side logic
├── render.yaml         # One-click Render.com deployment
└── Procfile            # Railway / Heroku deployment
```

## 🌐 Who Is This For?

- **Elderly adults** receiving confusing benefit letters or medical bills
- **Non-native English speakers** navigating legal documents
- **People with cognitive disabilities** who need plain-language summaries
- **Social workers & patient advocates** helping clients understand paperwork
- **Legal aid organizations** supporting low-income clients
- **Anyone** who has ever stared at a document and thought *"what does this actually mean?"*

## ⚠️ Privacy Note

Do not paste documents containing sensitive personal identifiers (SSN, full name + address) without reviewing [Anthropic's data usage policies](https://www.anthropic.com/legal/privacy).

## 📄 License

MIT — free to use, modify, and distribute.

---

*Built with ❤️ to make the written world accessible to everyone.*
