/**
 * Test RAG Engine - Quick test to verify embeddings and query work
 * Usage: node scripts/testRag.js
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testEmbedding() {
    console.log('Testing Gemini API embedding...\n');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use the correct model names from listModels
    const modelName = "gemini-embedding-001";
    
    try {
        console.log(`Testing model: ${modelName}...`);
        const embeddingModel = genAI.getGenerativeModel({ model: modelName });
        const result = await embeddingModel.embedContent("Test placement data for ANITS");
        console.log(`✓ ${modelName} works!`);
        console.log(`  Vector dimension: ${result.embedding.values.length}`);
        console.log(`  First 3 values: ${result.embedding.values.slice(0, 3).map(v => v.toFixed(4)).join(', ')}\n`);
        return modelName;
    } catch (err) {
        console.log(`✗ ${modelName}: ${err.message.split('\n')[0]}\n`);
        return null;
    }
}

async function testGeneration() {
    console.log('Testing Gemini generation model...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const modelName = "gemini-2.5-flash";
    
    try {
        console.log(`Testing model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const response = await model.generateContent("Say 'Hello!' in one word.");
        console.log(`✓ ${modelName} works!`);
        console.log(`  Response: ${response.response.text().trim()}\n`);
        return modelName;
    } catch (err) {
        console.log(`✗ ${modelName}: ${err.message.split('\n')[0]}\n`);
        return null;
    }
}

async function main() {
    const embModel = await testEmbedding();
    const genModel = await testGeneration();
    
    if (embModel && genModel) {
        console.log('═══════════════════════════════════════════════');
        console.log('✅ ALL TESTS PASSED!');
        console.log(`  Embedding: ${embModel}`);
        console.log(`  Generation: ${genModel}`);
        console.log('═══════════════════════════════════════════════');
        console.log('\nRAG Engine is ready. Run: npm run ingest');
    } else {
        console.log('═══════════════════════════════════════════════');
        console.log('❌ Some models failed. Check API key quota.');
        console.log('═══════════════════════════════════════════════');
    }
}

main();


