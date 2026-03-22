const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const DATA_FILE = path.join(__dirname, '../data/processed_placement_data.json');
const CACHE_FILE = path.join(__dirname, '../data/embeddings_cache.json');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

let placementData = [];
let embeddings = [];

function cosineSimilarity(vecA, vecB) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildEmbeddingText(record) {
    if (record.type === 'individual' || !record.type) {
        return `Student: ${record.name}, Roll No: ${record.rollNo}, Branch: ${record.branch}, Company: ${record.company}, Package: ${record.package} LPA, Year: ${record.year}. ${record.content || ''}`;
    }
    return `${record.chunkTitle || record.sourceFile || ''}. ${record.content}`;
}

async function initialize() {
    console.log("Initializing RAG Engine...");

    if (!fs.existsSync(DATA_FILE)) {
        console.warn("Warning: Processed data file not found. RAG will work with senior data only.");
        placementData = [];
        return;
    }
    placementData = await fs.readJson(DATA_FILE);
    console.log(`Loaded ${placementData.length} placement records.`);

    if (fs.existsSync(CACHE_FILE)) {
        console.log("Loading embeddings from cache...");
        embeddings = await fs.readJson(CACHE_FILE);
        if (embeddings.length !== placementData.length) {
            console.log(`Cache mismatch (${embeddings.length} vs ${placementData.length}). Regenerating...`);
            await generateEmbeddings();
        }
    } else {
        await generateEmbeddings();
    }
}

async function generateEmbeddings() {
    console.log("Generating embeddings (this may take a while)...");
    embeddings = [];
    const BATCH = 30;
    for (let i = 0; i < placementData.length; i += BATCH) {
        const batch = placementData.slice(i, i + BATCH);
        const results = await Promise.all(batch.map(async (rec) => {
            try {
                const r = await embeddingModel.embedContent(buildEmbeddingText(rec));
                return r.embedding.values;
            } catch (e) {
                console.error('Embedding error:', e.message);
                return null;
            }
        }));
        embeddings.push(...results);
        console.log(`Processed ${Math.min(i + BATCH, placementData.length)}/${placementData.length}`);
        
        // Write to cache periodically to avoid loss
        if (i % 150 === 0) await fs.writeJson(CACHE_FILE, embeddings);
        
        await new Promise(r => setTimeout(r, 200));
    }
    await fs.writeJson(CACHE_FILE, embeddings);
    console.log("Embeddings cached.");
}

function formatRecord(rec, queryKeywords = []) {
    if (rec.type === 'individual' || !rec.type) {
        return `- ${rec.name} (${rec.branch}): Placed in ${rec.company} with ${rec.package} LPA, Batch: ${rec.year}.`;
    }
    
    let text = rec.content || '';
    
    // Smart Snippet: If we have keywords, try to find them and show context around them
    if (queryKeywords.length > 0 && text.length > 1000) {
        const lowerText = text.toLowerCase();
        let bestIndex = 0;
        for (const kw of queryKeywords) {
            const idx = lowerText.indexOf(kw);
            if (idx !== -1) {
                bestIndex = idx;
                break;
            }
        }
        
        const start = Math.max(0, bestIndex - 500);
        const end = Math.min(text.length, bestIndex + 1000);
        text = (start > 0 ? "..." : "") + text.substring(start, end) + (end < text.length ? "..." : "");
    } else {
        text = text.substring(0, 1500);
    }
    
    if (rec.type === 'summary') return `- [Summary]: ${text}`;
    if (rec.type === 'questions') return `- [Interview Experience]: ${text}`;
    return `- [Doc: ${rec.sourceFile}]: ${text}`;
}

/**
 * Enhanced query with tool calling support
 * @param {string} userQuery - User's question
 * @param {Array} seniorProfiles - Array of senior profiles from DB (injected by route)
 * @returns {{ text: string, toolActions: Array }}
 */
async function query(userQuery, seniorProfiles = []) {
    try {
        if (placementData.length > 0 && embeddings.length === 0) {
            await initialize();
        }

        // 1. Find relevant placement records via embedding similarity + Keyword Boosting
        let context = '';
        if (embeddings.length > 0) {
            const qResult = await embeddingModel.embedContent(userQuery);
            const qEmb = qResult.embedding.values;

            // Extract keywords for simple boosting
            const keywords = userQuery.toLowerCase().split(/\s+/).filter(k => k.length > 2);

            const scored = placementData.map((rec, idx) => {
                let embScore = (embeddings[idx] && qEmb) ? cosineSimilarity(qEmb, embeddings[idx]) : 0;
                let keywordScore = 0;

                // Keyword boosting: significantly increase score if key terms (like names) match
                if (keywords.length > 0) {
                    const contentLower = (rec.content || '').toLowerCase();
                    const nameLower = (rec.name || '').toLowerCase();
                    const chunkTitleLower = (rec.chunkTitle || '').toLowerCase();
                    
                    let matches = 0;
                    for (const kw of keywords) {
                        if (contentLower.includes(kw) || nameLower.includes(kw) || chunkTitleLower.includes(kw)) {
                            matches++;
                        }
                    }
                    if (matches > 0) {
                        // High weight for keyword matches to overcome missing embeddings or crowded chunks
                        keywordScore = (matches / keywords.length) * 0.8; 
                    }
                }

                return { rec, score: embScore + keywordScore };
            });

            scored.sort((a, b) => b.score - a.score);
            context = scored.slice(0, 15).map(s => formatRecord(s.rec, keywords)).join('\n');
            
            if (scored.length > 0 && scored[0].score > 0.4) {
                console.log(`Top match: ${scored[0].rec.name || scored[0].rec.chunkTitle || 'Unnamed'} | Score: ${scored[0].score.toFixed(3)} (Emb: ${(scored[0].score - (scored[0].keywordScore || 0)).toFixed(3)})`);
            }
        }

        // 2. Build senior profile context
        const seniorContext = seniorProfiles.map(s =>
            `SENIOR: ${s.name} | ID: ${s.userId} | Company: ${s.company} | Role: ${s.role} | Branch: ${s.branch} | Skills: ${(s.skills || []).join(', ')} | Bio: ${s.bio || ''} | Placement Tips: ${s.placementExperience || ''} | Topics: ${(s.mentorTopics || []).join(', ')}`
        ).join('\n');

        // 3. Generate response with tool-calling instructions
        const prompt = `You are an AI assistant for the ANITS Alumni-Student Platform.

You have TWO data sources:
1. PLACEMENT DATA: Historical records from batches 2018-22, 2019-23, 2020-24 (567 individual records + summaries + interview experiences)
2. SENIOR PROFILES: Current seniors/alumni available on the platform for mentoring

PLACEMENT DATA CONTEXT:
${context || '(No specific placement records match this query)'}

AVAILABLE SENIORS ON PLATFORM:
${seniorContext || '(No senior profiles loaded)'}

TOOL ACTIONS:
When your answer references a specific senior on the platform, you MUST include tool action tags so the frontend can render interactive buttons. Use this exact format:

[TOOL:VIEW_PROFILE:USER_ID:SENIOR_NAME] — to link to their profile
[TOOL:SEND_MESSAGE:USER_ID:SENIOR_NAME] — to suggest messaging them
[TOOL:REQUEST_INTERVIEW:USER_ID:SENIOR_NAME] — to suggest booking a mock interview

Example: If someone asks "Who can help with Amazon prep?", and Kavya Nair (ID: abc123) is from Amazon, include:
"Kavya Nair from Amazon can help you! [TOOL:VIEW_PROFILE:abc123:Kavya Nair] [TOOL:SEND_MESSAGE:abc123:Kavya Nair]"

RULES:
- Answer placement data questions using the placement data context
- When relevant, recommend seniors who can help (with tool actions)
- Be specific: mention batch years, package amounts, company names
- If you don't have data, say so honestly
- Keep answers concise and helpful
- Always use tool actions when mentioning a senior by name

User Question: ${userQuery}

Answer:`;

        const response = await model.generateContent(prompt);
        const rawText = response.response.text();

        // 4. Parse tool actions from response
        const toolActions = [];
        const toolRegex = /\[TOOL:(\w+):([a-f0-9]+):([^\]]+)\]/g;
        let match;
        while ((match = toolRegex.exec(rawText)) !== null) {
            toolActions.push({
                type: match[1],           // VIEW_PROFILE, SEND_MESSAGE, REQUEST_INTERVIEW
                userId: match[2],         // MongoDB user ID
                seniorName: match[3]      // Display name
            });
        }

        // Remove tool tags from display text
        const cleanText = rawText.replace(/\[TOOL:[^\]]+\]/g, '').replace(/\n{3,}/g, '\n\n').trim();

        return { text: cleanText, toolActions };
    } catch (error) {
        console.error('RAG query error:', error);
        throw error;
    }
}

module.exports = { initialize, query };
