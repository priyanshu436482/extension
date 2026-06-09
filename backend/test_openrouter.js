const OpenAI = require("openai");
require("dotenv").config();

async function test() {
  console.log("Using API Key:", process.env.OPENROUTER_API_KEY);
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Say hello!" }
      ],
      max_tokens: 10,
    });
    console.log("Success:", response.choices[0].message.content);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
