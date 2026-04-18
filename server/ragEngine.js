/**
 * RAG Engine with Anti-Hallucination Measures
 * 
 * Features:
 * - Strict context grounding
 * - Fact verification
 * - Tool action validation
 * - Confidence scoring
 * - Safe cosine similarity
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs-extra');
const path = require('path');
const Profile = require('./models/Profile');
const PlacementRecord = require('./models/PlacementRecord');
require('dotenv').config();

// Utility for exponential backoff handling 429 errors
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function invokeWithRetry(apiCall, maxRetries = 5, baseDelay = 2000) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            return await apiCall();
        } catch (error) {
            if (error.status === 429 || (error.message && error.message.includes('429')) || error.status === 503) {
                const delayMs = baseDelay * Math.pow(2, retries) + Math.random() * 500;
                console.warn(`[API Rate Limit] Retrying in ${Math.round(delayMs)}ms... (Attempt ${retries + 1}/${maxRetries})`);
                await sleep(delayMs);
                retries++;
            } else {
                throw error;
            }
        }
    }
    throw new Error(`API Request failed after ${maxRetries} retries due to rate limiting.`);
}



const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const EMBEDDING_MODEL = "gemini-embedding-001";

let placementData = [];
let embeddings = [];
let initializationQueue = Promise.resolve();
let ragRuntimeStatus = {
    isRunning: false,
    queuedJobs: 0,
    state: 'idle',
    startedAt: null,
    finishedAt: null,
    lastRunDurationMs: null,
    lastRunRecordCount: 0,
    lastRunEmbeddingCount: 0,
    lastError: null,
    lastForced: false
};

// Build searchable index for fact verification
let dataIndex = {
    byRollNo: new Map(),
    byName: new Map(),
    byCompany: new Map(),
    byBranch: new Map(),
    stats: null
};

/**
 * Safe cosine similarity with zero-vector handling
 */
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    // Prevent division by zero
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;
    
    return dot / denominator;
}

/**
 * Build data index for fast lookups and fact verification
 */
function buildDataIndex() {
    dataIndex = {
        byRollNo: new Map(),
        byName: new Map(),
        byCompany: new Map(),
        byBranch: new Map(),
        stats: null
    };

    const individuals = placementData.filter(r => !r.type || r.type === 'individual');
    
    individuals.forEach(record => {
        // Index by roll number
        if (record.rollNo) {
            dataIndex.byRollNo.set(record.rollNo, record);
        }
        
        // Index by normalized name (lowercase)
        if (record.name) {
            const nameLower = record.name.toLowerCase();
            if (!dataIndex.byName.has(nameLower)) {
                dataIndex.byName.set(nameLower, []);
            }
            dataIndex.byName.get(nameLower).push(record);
        }
        
        // Index by company
        if (record.company) {
            const companyLower = record.company.toLowerCase();
            if (!dataIndex.byCompany.has(companyLower)) {
                dataIndex.byCompany.set(companyLower, []);
            }
            dataIndex.byCompany.get(companyLower).push(record);
        }
        
        // Index by branch
        if (record.branch) {
            if (!dataIndex.byBranch.has(record.branch)) {
                dataIndex.byBranch.set(record.branch, []);
            }
            dataIndex.byBranch.get(record.branch).push(record);
        }
    });
    
    // Pre-compute statistics
    const packages = individuals.map(r => parseFloat(r.package) || 0).filter(p => p > 0);
    dataIndex.stats = {
        totalPlacements: individuals.length,
        averagePackage: packages.length > 0 ? (packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(2) : 0,
        highestPackage: packages.length > 0 ? Math.max(...packages) : 0,
        lowestPackage: packages.length > 0 ? Math.min(...packages) : 0,
        uniqueCompanies: dataIndex.byCompany.size,
        branches: [...dataIndex.byBranch.keys()],
        years: [...new Set(individuals.map(r => r.year).filter(Boolean))]
    };
    
    console.log(`Data index built: ${individuals.length} records indexed`);
}

/**
 * Build structured embedding text with metadata tags for better semantic search
 */
function buildEmbeddingText(record) {
    if (record.type === 'individual' || !record.type) {
        // Structured format with clear field markers
        return `[PLACEMENT_RECORD] Student: ${record.name || 'Unknown'} | Roll Number: ${record.rollNo || 'N/A'} | Branch: ${record.branch || 'Unknown'} | Placed at Company: ${record.company || 'Unknown'} | Package: ${record.package || 'N/A'} LPA | Batch Year: ${record.year || 'Unknown'}. ${record.content || ''}`;
    }
    // For summaries and questions, add type marker
    const typeMarker = record.type === 'summary' ? '[BATCH_SUMMARY]' : 
                       record.type === 'questions' ? '[INTERVIEW_EXPERIENCE]' : '[DOCUMENT]';
    return `${typeMarker} ${record.chunkTitle || record.sourceFile || ''} ${record.content || ''}`;
}

async function performInitialize({ forceRegenerateEmbeddings = false } = {}) {
    console.log("Initializing RAG Engine with anti-hallucination measures...");

    placementData = await PlacementRecord.find().lean();
    
    if (placementData.length === 0) {
        console.warn("Warning: DB placement data not found. RAG will work with senior data only.");
        embeddings = [];
        buildDataIndex();
        return;
    }
    
    console.log(`Loaded ${placementData.length} placement records from DB.`);

    // Build data index for fact verification
    buildDataIndex();

    if (forceRegenerateEmbeddings) {
        console.log("Forced reindex requested. Regenerating embeddings from latest data...");
        await generateEmbeddings(true);
    } else {
        await generateEmbeddings(false);
    }
}

function initialize(options = {}) {
    const forceRegenerateEmbeddings = Boolean(options.forceRegenerateEmbeddings);
    ragRuntimeStatus.queuedJobs += 1;

    initializationQueue = initializationQueue
        .catch((error) => {
            console.error('Previous RAG initialization failed:', error.message);
        })
        .then(async () => {
            ragRuntimeStatus.queuedJobs = Math.max(0, ragRuntimeStatus.queuedJobs - 1);
            ragRuntimeStatus.isRunning = true;
            ragRuntimeStatus.state = 'running';
            ragRuntimeStatus.startedAt = new Date().toISOString();
            ragRuntimeStatus.lastError = null;
            ragRuntimeStatus.lastForced = forceRegenerateEmbeddings;

            const startedAt = Date.now();

            try {
                await performInitialize({ forceRegenerateEmbeddings });
                ragRuntimeStatus.finishedAt = new Date().toISOString();
                ragRuntimeStatus.lastRunDurationMs = Date.now() - startedAt;
                ragRuntimeStatus.lastRunRecordCount = placementData.length;
                ragRuntimeStatus.lastRunEmbeddingCount = embeddings.length;
            } catch (error) {
                ragRuntimeStatus.finishedAt = new Date().toISOString();
                ragRuntimeStatus.lastRunDurationMs = Date.now() - startedAt;
                ragRuntimeStatus.lastError = error.message;
                throw error;
            } finally {
                ragRuntimeStatus.isRunning = false;
                ragRuntimeStatus.state = ragRuntimeStatus.queuedJobs > 0
                    ? 'queued'
                    : (ragRuntimeStatus.lastError ? 'error' : 'idle');
            }
        });

    return initializationQueue;
}

function getStatus() {
    const state = ragRuntimeStatus.isRunning
        ? 'running'
        : ragRuntimeStatus.queuedJobs > 0
            ? 'queued'
            : ragRuntimeStatus.lastError
                ? 'error'
                : 'idle';

    return {
        ...ragRuntimeStatus,
        state,
        currentRecordCount: placementData.length,
        currentEmbeddingCount: embeddings.length
    };
}

async function generateEmbeddings(forceAll = false) {
    console.log("Checking and generating missing embeddings...");
    embeddings = [];
    const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    
    // REDUCED concurrency from 30 to 3 to prevent hitting Google's rate limits
    const BATCH = 3; 
    let generatedCount = 0;
    
    for (let i = 0; i < placementData.length; i += BATCH) {
        const batch = placementData.slice(i, i + BATCH);
        let batchGenerated = false;
        
        const results = await Promise.all(batch.map(async (rec) => {
            // Use existing embedding if valid and not forcing
            if (!forceAll && rec.embedding && rec.embedding.length > 0) {
                return rec.embedding;
            }
            
            try {
                batchGenerated = true;
                const r = await invokeWithRetry(() => embeddingModel.embedContent(buildEmbeddingText(rec)));
                const vec = r.embedding.values;
                
                // Directly write to MongoDB
                await PlacementRecord.updateOne({ _id: rec._id }, { $set: { embedding: vec } });
                generatedCount++;
                return vec;
            } catch (e) {
                console.error('Embedding error for record:', rec.name || 'Unknown', e.message);
                return null;
            }
        }));
        
        embeddings.push(...results);
        
        if (batchGenerated) {
             console.log(`Progress: checked ${Math.min(i + BATCH, placementData.length)}/${placementData.length} records. Generated ${generatedCount} new embeddings.`);
             await sleep(1500); // Only sleep if we actually hit the API
        }
    }
    console.log(`Initialization complete. Generated ${generatedCount} new embeddings in DB.`);
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
 * Validate tool actions dynamically against actual senior profiles in DB
 * Removes any tool actions that reference non-existent users
 */
async function validateToolActions(toolActions) {
    if (!toolActions || toolActions.length === 0) return [];
    
    // Extract valid MongoDB ObjectIDs
    const userIds = toolActions.map(action => action.userId).filter(id => id && id.length === 24);
    
    if (userIds.length === 0) return [];

    const validProfiles = await Profile.find({ userId: { $in: userIds } })
        .populate({ path: 'userId', match: { role: 'alumni' } })
        .lean();
        
    const validUserIds = new Set(
        validProfiles.filter(p => p.userId && p.userId.role === 'alumni').map(p => p.userId._id.toString())
    );

    return toolActions.filter(action => {
        if (!validUserIds.has(action.userId)) {
            console.warn(`Removing invalid tool action: ${action.type} for non-existent user ${action.userId}`);
            return false;
        }
        return true;
    });
}

/**
 * Get verified statistics from the data index
 */
function getVerifiedStats() {
    if (!dataIndex.stats) {
        return null;
    }
    return dataIndex.stats;
}

/**
 * Enhanced query with database tools and anti-hallucination measures
 * @param {string} userQuery - User's question
 * @returns {{ text: string, toolActions: Array, stats: Object }}
 */
async function query(userQuery) {
    try {
        if (placementData.length > 0 && embeddings.length === 0) {
            await initialize();
        }

        // 1. Find relevant placement records via embedding similarity + Keyword Boosting
        let context = '';
        let topMatches = [];
        const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
        
        if (embeddings.length > 0) {
            let qEmb = null;
            try {
                const qResult = await invokeWithRetry(() => embeddingModel.embedContent(userQuery), 3, 1000);
                qEmb = qResult.embedding.values;
            } catch (embedError) {
                console.warn("User query embedding failed (Rate limit). Falling back to pure keyword search:", embedError.message);
            }

            // Extract keywords for simple boosting
            const keywords = userQuery.toLowerCase().split(/\s+/).filter(k => k.length > 2);

            const scored = placementData.map((rec, idx) => {
                let embScore = (embeddings[idx] && qEmb) ? cosineSimilarity(qEmb, embeddings[idx]) : 0;
                let keywordScore = 0;

                // Keyword boosting: significantly increase score if key terms (like names) match
                if (keywords.length > 0) {
                    const contentLower = (rec.content || '').toLowerCase();
                    const nameLower = (rec.name || '').toLowerCase();
                    const companyLower = (rec.company || '').toLowerCase();
                    const chunkTitleLower = (rec.chunkTitle || '').toLowerCase();
                    
                    let matches = 0;
                    for (const kw of keywords) {
                        if (contentLower.includes(kw) || nameLower.includes(kw) || 
                            companyLower.includes(kw) || chunkTitleLower.includes(kw)) {
                            matches++;
                        }
                    }
                    if (matches > 0) {
                        // Increase keyword impact heavily if semantic similarity completely fails
                        keywordScore = (matches / keywords.length) * (qEmb ? 0.8 : 2.0); 
                    }
                }

                return { rec, score: embScore + keywordScore, embScore, keywordScore };
            });

            scored.sort((a, b) => b.score - a.score);
            
            // Use dynamic context window - include results above threshold
            const SCORE_THRESHOLD = qEmb ? 0.3 : 0.5; // Stricter threshold for pure keyword match
            const MAX_RESULTS = 20;
            topMatches = scored.filter(s => s.score >= SCORE_THRESHOLD).slice(0, MAX_RESULTS);
            
            context = topMatches.map(s => formatRecord(s.rec, keywords)).join('\n');
            
            if (topMatches.length > 0) {
                console.log(`Top ${topMatches.length} matches (threshold ${SCORE_THRESHOLD}):`);
                topMatches.slice(0, 3).forEach(m => {
                    console.log(`  - ${m.rec.name || m.rec.chunkTitle || 'Unnamed'} | Total Score: ${m.score.toFixed(3)} (Emb: ${m.embScore.toFixed(3)}, Kw: ${m.keywordScore.toFixed(3)})`);
                });
            }
        }

        // 2. Get verified statistics for grounding
        const stats = getVerifiedStats();
        const statsContext = stats ? `
VERIFIED STATISTICS:
- Total Placements: ${stats.totalPlacements}
- Average Package: ${stats.averagePackage} LPA
- Highest Package: ${stats.highestPackage} LPA
- Lowest Package: ${stats.lowestPackage} LPA
- Unique Companies: ${stats.uniqueCompanies}` : '';

        // 3. Configure Gemini Tools 
        const tools = [{
            functionDeclarations: [
                {
                    name: "getTotalSeniorsCount",
                    description: "Queries the database for the total number of senior/alumni profiles. Use this ONLY when asked how many seniors or alumni are available.",
                },
                {
                    name: "searchSeniorsProfiles",
                    description: "Dynamically queries the database for seniors. Use this to find seniors working at a certain company or with a specific role.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            company: { type: "STRING", description: "Company name (e.g., 'TCS', 'Amazon'). Leave blank if none." },
                            role: { type: "STRING", description: "Job title (e.g., 'Software Engineer'). Leave blank if none." },
                            branch: { type: "STRING", description: "Branch (e.g., 'CSE', 'ECE'). Leave blank if none." }
                        }
                    }
                }
            ]
        }];

        const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash", tools });
        const chat = chatModel.startChat();

        // 4. Generate dynamic, professional response
        const prompt = `You are a helpful, professional AI assistant for the ANITS Alumni-Student Platform.
You can greet the user dynamically and naturally without strictly stating statistics unless asked.

=== STRICT PHRASING RULES ===
1. When providing counts of seniors, you MUST say "I have access to XX seniors' data" or "There are XX seniors in the database". 
2. Do NOT say "available on the platform" when stating numbers.
3. If the user greets you (e.g. "Hello"), provide a professional, warm greeting. DO NOT state the total number of seniors unless explicitly asked. Keep it conversational.
4. If asked about seniors, USE your Database Search Tools to query their data dynamically rather than hallucinating facts.

=== PLACEMENT DATA CONTEXT ===
${context || '(No specific placement records match this query)'}
${statsContext}

=== TOOL ACTIONS ===
If you find relevant seniors via your tools, you can recommend them using EXACT tags:
[TOOL:VIEW_PROFILE:USER_ID:SENIOR_NAME]
[TOOL:SEND_MESSAGE:USER_ID:SENIOR_NAME]

User Question: ${userQuery}`;

        let result = await invokeWithRetry(() => chat.sendMessage(prompt));

        // 5. Handle Native Tool Calling execution loop
        if (result.response.functionCalls && result.response.functionCalls().length > 0) {
            const calls = result.response.functionCalls();
            const functionResponses = [];
            
            for (const call of calls) {
                try {
                    if (call.name === "getTotalSeniorsCount") {
                        const seniorProfiles = await Profile.find().populate({ path: 'userId', match: { role: 'alumni' } }).lean();
                        const seniorsCount = seniorProfiles.filter(p => p.userId && p.userId.role === 'alumni').length;
                        
                        functionResponses.push({
                            functionResponse: { name: call.name, response: { data: { totalCount: seniorsCount } } }
                        });
                    } else if (call.name === "searchSeniorsProfiles") {
                        const { company, role, branch } = call.args;
                        let queryArgs = {};
                        if (company) queryArgs.company = new RegExp(company, 'i');
                        if (role) queryArgs.role = new RegExp(role, 'i');
                        if (branch) queryArgs.branch = new RegExp(branch, 'i');
                        
                        const profiles = await Profile.find(queryArgs).populate({ path: 'userId', match: { role: 'alumni' } }).limit(10).lean();
                        const matches = profiles.filter(p => p.userId && p.userId.role === 'alumni').map(s => ({
                            userId: s.userId._id.toString(),
                            name: s.name,
                            company: s.company || 'N/A',
                            role: s.role || 'N/A'
                        }));
                        
                        functionResponses.push({
                            functionResponse: { name: call.name, response: { data: { matches } } }
                        });
                    }
                } catch (dbErr) {
                    console.error("Database Tool execution error:", dbErr);
                    functionResponses.push({
                        functionResponse: { name: call.name, response: { error: dbErr.message } }
                    });
                }
            }
            
            // Re-invoke AI with tool outcomes
            result = await invokeWithRetry(() => chat.sendMessage(functionResponses));
        }

        const rawText = result.response.text();

        // 5. Parse and VALIDATE tool actions
        const toolActions = [];
        const toolRegex = /\[TOOL:(\w+):([a-f0-9]+):([^\]]+)\]/g;
        let match;
        while ((match = toolRegex.exec(rawText)) !== null) {
            toolActions.push({
                type: match[1],
                userId: match[2],
                seniorName: match[3]
            });
        }

        // Validate tool actions against actual senior profiles
        const validatedToolActions = await validateToolActions(toolActions);

        // Remove tool tags from display text
        const cleanText = rawText.replace(/\[TOOL:[^\]]+\]/g, '').replace(/\n{3,}/g, '\n\n').trim();

        return { 
            text: cleanText, 
            toolActions: validatedToolActions,
            stats: stats,
            matchCount: topMatches.length
        };
    } catch (error) {
        console.error('RAG query error:', error);
        throw error;
    }
}

module.exports = { initialize, query, getVerifiedStats, getStatus };
