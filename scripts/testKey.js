const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
    console.log("Testing API Key...");
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("Error: GEMINI_API_KEY not found in .env");
        return;
    }
    console.log(`Key found: ${key.substring(0, 5)}...${key.substring(key.length - 4)}`);

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
        console.log("Testing Generation (gemini-pro)...");
        const result = await model.generateContent("Hello");
        console.log("Generation Success:", result.response.text());

        console.log("Testing Embedding (text-embedding-004)...");
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embedResult = await embeddingModel.embedContent("Hello world");
        console.log("Embedding Success! Vector length:", embedResult.embedding.values.length);

    } catch (error) {
        console.error("API Error:", error.message);
        if (error.message.includes("API key not valid")) {
            console.error("Suggestion: Check for extra spaces, quotes, or copied characters in .env");
        }
    }
}

test();
