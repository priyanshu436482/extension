# AI Webpage Summarizer

A Chrome Extension that summarizes any webpage using AI (OpenAI or Gemini), with a Node.js backend to keep API keys secure.

## Folder Structure

```
ai-webpage-summarizer/
│
├── extension/                # Chrome Extension (frontend)
│   ├── manifest.json         # Extension config (Manifest V3)
│   ├── popup.html            # Popup UI
│   ├── popup.js              # Popup logic
│   ├── content.js            # Content script (extracts text)
│   └── style.css             # Popup styles
│
├── backend/                  # Node.js backend server
│   ├── server.js             # Express server (POST /api/summarize)
│   ├── package.json          # Dependencies and scripts
│   ├── .env.example          # Environment variable template
│   └── .gitignore            # Git ignore rules
│
└── README.md                 # This file
```

---

## Installation & Setup

### 1. Clone or download the project

Navigate to the project folder:

```bash
cd ai-webpage-summarizer
```

### 2. Set up the backend

```bash
cd backend
npm install
```

### 3. Configure environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

**Using OpenAI (recommended):**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-openai-api-key
```

**Using Google Gemini:**
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-actual-gemini-api-key
```

> Get API keys:
> - **OpenAI**: https://platform.openai.com/api-keys
> - **Gemini**: https://aistudio.google.com/app/apikey

### 4. Start the backend server

```bash
npm start
```

Or use development mode (auto-restarts on changes):

```bash
npm run dev
```

The server starts at **http://localhost:3000**.

### 5. Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder from this project
5. The extension icon will appear in the toolbar

---

## Usage

1. Navigate to any webpage you want to summarize
2. Click the extension icon in the toolbar
3. Click **Summarize Page**
4. Wait for the AI to generate the summary
5. View the overview, 5 key points, and conclusion
6. Click the copy button (📋) to copy the summary

---

## How It Works

```
User clicks "Summarize Page"
        │
        ▼
Extension extracts webpage text (document.body.innerText)
        │
        ▼
Extension sends text to POST http://localhost:3000/api/summarize
        │
        ▼
Backend receives text and calls AI API (OpenAI or Gemini)
        │
        ▼
AI returns structured summary (overview + 5 key points + conclusion)
        │
        ▼
Backend sends summary back to extension
        │
        ▼
Extension displays summary in the popup
```

**Security:** The API key stays on the backend. The extension never sees it.

---

## Testing

### Test the backend directly

Using PowerShell:

```powershell
$body = @{ text = "Artificial intelligence is transforming the way we work and live. From healthcare to education, AI-powered tools are helping people be more productive and make better decisions." } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/summarize -Method Post -Body $body -ContentType "application/json"
```

Using curl:

```bash
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"text": "Artificial intelligence is transforming the way we work and live."}'
```

### Test the extension

1. Open any website (e.g., a news article)
2. Click the extension icon
3. Click **Summarize Page**
4. Verify the summary appears

---

## Common Errors & Fixes

### "Failed to summarize the page. Make sure the backend server is running."

- Ensure the backend is running: `npm start` in the `backend/` folder
- Check for port conflicts (default: 3000)

### "Server error: 500"

- Check your `.env` file has a valid API key
- Check the backend console for error messages
- Verify your API key has available credits/quota

### "Cannot read properties of undefined (reading 'executeScript')"

- Make sure the extension has the `scripting` permission in manifest.json
- Reload the extension on `chrome://extensions/`

### "Extension not working on chrome:// pages"

- Chrome restricts extensions on `chrome://`, `chrome-extension://`, and the Chrome Web Store
- Use normal websites (e.g., `https://example.com`)

### "CORS error"

- Make sure the backend server is running on `localhost:3000`
- The backend includes CORS middleware, so this should not occur normally

### "Module not found: 'openai' / '@google/generative-ai'"

- Run `npm install` in the `backend/` folder
- Check `package.json` lists the missing dependency

---

## Customization

### Change the summary format

Edit the `prompt` variable in `backend/server.js`:

```javascript
const prompt = `Summarize the following webpage text. Include:
- A short overview (2-3 sentences)
- 5 key points as a bullet list
- An important conclusion (1-2 sentences)`;
```

### Change the AI model

In `.env`:

```env
OPENAI_MODEL=gpt-4
# or
GEMINI_MODEL=gemini-1.5-pro
```

### Change the max text length

In `extension/popup.js`:

```javascript
const MAX_TEXT_LENGTH = 8000; // Increase or decrease
```

---

## Tech Stack

| Component  | Technology        |
|------------|-------------------|
| Extension  | Manifest V3, HTML, CSS, JavaScript |
| Backend    | Node.js, Express.js |
| AI         | OpenAI API or Gemini API |
| Security   | API keys in .env (never exposed to extension) |
