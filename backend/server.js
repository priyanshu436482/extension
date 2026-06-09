const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// -------------------------------
// POST /api/summarize
// Receives webpage text, sends to AI, returns summary
// -------------------------------
app.post("/api/summarize", async (req, res) => {
  try {
    const { text, provider: reqProvider, model: reqModel, apiKey: reqApiKey } = req.body;

    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "No text provided to summarize." });
    }

    // Get AI provider from request body or env, default to openai
    const provider = (reqProvider || process.env.AI_PROVIDER || "openai").toLowerCase();

    let summary;
    if (provider === "gemini") {
      summary = await summarizeWithGemini(text, reqModel, reqApiKey);
    } else if (provider === "groq") {
      summary = await summarizeWithGroq(text, reqModel, reqApiKey);
    } else if (provider === "openrouter") {
      summary = await summarizeWithOpenRouter(text, reqModel, reqApiKey);
    } else if (provider === "freellmapi") {
      summary = await summarizeWithFreeLLMAPI(text, reqModel, reqApiKey);
    } else {
      summary = await summarizeWithOpenAI(text, reqModel, reqApiKey);
    }

    res.json({ summary });
  } catch (error) {
    console.error("Summarization error:", error.stack || error);
    res.status(500).json({
      error: error.message || "Failed to generate summary. Please check your API key and try again.",
    });
  }
});

// -------------------------------
// OpenAI Summarization
// -------------------------------
async function summarizeWithOpenAI(text, customModel, customApiKey) {
  const apiKey = customApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is missing. Please provide it in settings or backend env.");
  }
  const openai = new OpenAI({ apiKey });

  const prompt = `Summarize the following webpage text. Include:
- A short overview (2-3 sentences)
- 5 key points as a bullet list
- An important conclusion (1-2 sentences)

Webpage text:
${text.substring(0, 7000)}`;

  const response = await openai.chat.completions.create({
    model: customModel || process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that creates clear, concise summaries of webpages.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 1000,
    temperature: 0.5,
  });

  return response.choices[0].message.content.trim();
}

// -------------------------------
// Gemini (Google) Summarization
// -------------------------------
async function summarizeWithGemini(text, customModel, customApiKey) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please provide it in settings or backend env.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: customModel || process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
  });

  const prompt = `Summarize the following webpage text. Include:
- A short overview (2-3 sentences)
- 5 key points as a bullet list
- An important conclusion (1-2 sentences)

Webpage text:
${text.substring(0, 7000)}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

// -------------------------------
// Groq Summarization
// -------------------------------
async function summarizeWithGroq(text, customModel, customApiKey) {
  const apiKey = customApiKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Groq API key is missing. Please provide it in settings or backend env.");
  }
  const groq = new Groq({ apiKey });

  const prompt = `Summarize the following webpage text. Include:
- A short overview (2-3 sentences)
- 5 key points as a bullet list
- An important conclusion (1-2 sentences)

Webpage text:
${text.substring(0, 7000)}`;

  const response = await groq.chat.completions.create({
    model: customModel || process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that creates clear, concise summaries of webpages.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 1000,
    temperature: 0.5,
  });

  return response.choices[0].message.content.trim();
}

// -------------------------------
// OpenRouter Summarization
// -------------------------------
async function summarizeWithOpenRouter(text, customModel, customApiKey) {
  const apiKey = customApiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API key is missing. Please provide it in settings or backend env.");
  }
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
  });

  const prompt = `Summarize the following webpage text. Include:
- A short overview (2-3 sentences)
- 5 key points as a bullet list
- An important conclusion (1-2 sentences)

Webpage text:
${text.substring(0, 7000)}`;

  const response = await openai.chat.completions.create({
    model: customModel || process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that creates clear, concise summaries of webpages.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 1000,
    temperature: 0.5,
  });

  return response.choices[0].message.content.trim();
}

// -------------------------------
// FreeLLMAPI Summarization
// -------------------------------
async function summarizeWithFreeLLMAPI(text, customModel, customApiKey) {
  const apiKey = customApiKey || process.env.FREELLMAPI_API_KEY || "freellmapi-your-unified-key";
  const openai = new OpenAI({
    baseURL: process.env.FREELLMAPI_BASE_URL || "http://localhost:3001/v1",
    apiKey: apiKey,
  });

  const prompt = `Summarize the following webpage text. Include:
- A short overview (2-3 sentences)
- 5 key points as a bullet list
- An important conclusion (1-2 sentences)

Webpage text:
${text.substring(0, 7000)}`;

  const response = await openai.chat.completions.create({
    model: customModel || process.env.FREELLMAPI_MODEL || "auto",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that creates clear, concise summaries of webpages.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 1000,
    temperature: 0.5,
  });

  return response.choices[0].message.content.trim();
}

// -------------------------------
// Health check
// -------------------------------
app.get("/", (req, res) => {
  res.json({ status: "AI Webpage Summarizer backend is running." });
});

// Start server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`AI Provider: ${process.env.AI_PROVIDER || "openai"}`);
  });
}

module.exports = app;
