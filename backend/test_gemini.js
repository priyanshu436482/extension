const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";
  console.log("API Key:", apiKey);
  console.log("Model:", modelName);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello!");
    console.log("Success:", result.response.text());
  } catch (err) {
    console.error("Error message:", err.message);
    console.error("Full error:", err);
  }
}

run();
