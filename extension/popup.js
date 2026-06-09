// Backend API URL
const DEFAULT_API_URL = "http://localhost:3010/api/summarize";
// Max characters to send to backend (to avoid token limits)
const MAX_TEXT_LENGTH = 8000;

// Main DOM elements
const summarizeBtn = document.getElementById("summarizeBtn");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const errorMessage = document.getElementById("errorMessage");
const resultEl = document.getElementById("result");
const summaryContent = document.getElementById("summaryContent");
const copyBtn = document.getElementById("copyBtn");

// Settings Panel DOM elements
const settingsToggleBtn = document.getElementById("settingsToggleBtn");
const settingsPanel = document.getElementById("settingsPanel");
const providerSelect = document.getElementById("providerSelect");
const modelInput = document.getElementById("modelInput");
const apiKeyInput = document.getElementById("apiKeyInput");
const apiUrlInput = document.getElementById("apiUrlInput");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const settingsStatus = document.getElementById("settingsStatus");

// Load stored settings on startup
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["provider", "model", "apiKey", "apiUrl"], (items) => {
    if (items.provider) {
      providerSelect.value = items.provider;
    } else {
      providerSelect.value = "gemini"; // Default out of the box
    }
    
    if (items.model) {
      modelInput.value = items.model;
    }
    
    if (items.apiKey) {
      apiKeyInput.value = items.apiKey;
    }

    if (items.apiUrl) {
      apiUrlInput.value = items.apiUrl;
    }
  });
});

// Toggle Settings Drawer visibility
settingsToggleBtn.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
});

// Toggle password visibility for API key input
togglePasswordBtn.addEventListener("click", () => {
  const isPassword = apiKeyInput.type === "password";
  apiKeyInput.type = isPassword ? "text" : "password";
  togglePasswordBtn.textContent = isPassword ? "🙈" : "👁️";
});

// Save settings to chrome.storage.local
saveSettingsBtn.addEventListener("click", () => {
  const provider = providerSelect.value;
  const model = modelInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const apiUrl = apiUrlInput.value.trim();

  chrome.storage.local.set({ provider, model, apiKey, apiUrl }, () => {
    settingsStatus.classList.remove("hidden");
    setTimeout(() => {
      settingsStatus.classList.add("hidden");
      // Optionally close the drawer after saving
      setTimeout(() => {
        settingsPanel.classList.add("hidden");
      }, 300);
    }, 1500);
  });
});

// Show/hide helper functions
function showLoading() {
  loadingEl.classList.remove("hidden");
  summarizeBtn.disabled = true;
  summarizeBtn.innerHTML = '<span class="btn-icon">⚡</span> Synthesizing...';
  errorEl.classList.add("hidden");
  resultEl.classList.add("hidden");
}

function hideLoading() {
  loadingEl.classList.add("hidden");
  summarizeBtn.disabled = false;
  summarizeBtn.innerHTML = '<span class="btn-icon">✨</span> Summarize Page';
}

function showError(message) {
  errorMessage.textContent = message;
  errorEl.classList.remove("hidden");
  resultEl.classList.add("hidden");
  hideLoading();
}

function showSummary(summary) {
  summaryContent.innerHTML = formatSummary(summary);
  resultEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  hideLoading();
}

// Custom Markdown-to-HTML parser for premium structured output
function formatSummary(text) {
  if (!text) return "";
  
  // Escape HTML to prevent XSS while maintaining styling tags
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Parse Headers: ### Header, ## Header, # Header
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // Parse Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Parse Bullet Points: lines starting with "- " or "* "
  let lines = html.split('\n');
  let inList = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.substring(2);
      if (!inList) {
        lines[i] = '<ul>\n<li>' + content + '</li>';
        inList = true;
      } else {
        lines[i] = '<li>' + content + '</li>';
      }
    } else {
      if (inList) {
        lines[i] = '</ul>\n' + lines[i];
        inList = false;
      }
    }
  }
  if (inList) {
    lines.push('</ul>');
  }
  html = lines.join('\n');
  
  // Parse Paragraphs (split by double newlines)
  html = html.split(/\n{2,}/).map(p => {
    const trimmed = p.trim();
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('</ul')) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
  
  return `<div class="summary-text">${html}</div>`;
}

// Get text from the page via scripting API
async function getPageText(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => document.body?.innerText || document.documentElement?.innerText || "",
  });
  return result?.result || "";
}

// Send extracted text to backend for summarization with config overrides
async function fetchSummary(text) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000); // 45 seconds timeout

  // Fetch settings from local storage
  const settings = await new Promise((resolve) => {
    chrome.storage.local.get(["provider", "model", "apiKey", "apiUrl"], (items) => {
      resolve(items || {});
    });
  });

  const provider = settings.provider || "gemini";
  const model = settings.model || "";
  const apiKey = settings.apiKey || "";
  const apiUrl = settings.apiUrl || DEFAULT_API_URL;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text: text.substring(0, MAX_TEXT_LENGTH),
        provider: provider,
        model: model ? model : undefined,
        apiKey: apiKey ? apiKey : undefined
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.summary;
  } finally {
    clearTimeout(timeout);
  }
}

// Copy summary to clipboard
async function copySummary() {
  const text = summaryContent.innerText;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.innerHTML = "<span>✅</span>";
    setTimeout(() => {
      copyBtn.innerHTML = "<span>📋</span>";
    }, 2000);
  } catch {
    alert("Failed to copy summary.");
  }
}

// Restricted URLs where content scripts cannot run
const RESTRICTED_PREFIXES = [
  "chrome://",
  "chrome-extension://",
  "about:",
  "view-source:",
  "edge://",
  "about:blank",
  "about:srcdoc",
];

function isRestrictedUrl(url) {
  return RESTRICTED_PREFIXES.some((prefix) => url.startsWith(prefix));
}

// Main summarize flow
async function handleSummarize() {
  showLoading();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error("No active tab found.");
    }

    if (!tab.url || isRestrictedUrl(tab.url)) {
      throw new Error("Cannot summarize this page. Chrome system pages (chrome://, about:, etc.) are not accessible.");
    }

    const pageText = await getPageText(tab.id);
    if (!pageText || pageText.trim().length === 0) {
      throw new Error("No text found on this page to summarize.");
    }

    const summary = await fetchSummary(pageText);
    showSummary(summary);
  } catch (err) {
    if (err.name === "AbortError") {
      showError("Request timed out. Make sure the backend server and dynamic model APIs are responsive.");
    } else {
      showError(err.message || "Failed to summarize the page. Make sure the backend server is running.");
    }
  }
}

// Event listeners
summarizeBtn.addEventListener("click", handleSummarize);
copyBtn.addEventListener("click", copySummary);
