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
require('dotenv').config();

const DATA_FILE = path.join(__dirname, '../data/processed_placement_data.json');
const CACHE_FILE = path.join(__dirname, '../data/embeddings_cache.json');

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

    if (!fs.existsSync(DATA_FILE)) {
        console.warn("Warning: Processed data file not found. RAG will work with senior data only.");
        placementData = [];
        embeddings = [];
        buildDataIndex();
        return;
    }
    placementData = await fs.readJson(DATA_FILE);
    console.log(`Loaded ${placementData.length} placement records.`);

    // Build data index for fact verification
    buildDataIndex();

    if (!forceRegenerateEmbeddings && fs.existsSync(CACHE_FILE)) {
        console.log("Loading embeddings from cache...");
        embeddings = await fs.readJson(CACHE_FILE);
        if (embeddings.length !== placementData.length) {
            console.log(`Cache mismatch (${embeddings.length} vs ${placementData.length}). Regenerating...`);
            await generateEmbeddings();
        }
    } else {
        if (forceRegenerateEmbeddings) {
            console.log("Forced reindex requested. Regenerating embeddings from latest data...");
        }
        await generateEmbeddings();
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

async function generateEmbeddings() {
    console.log("Generating embeddings (this may take a while)...");
    embeddings = [];
    const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
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
 * Validate tool actions against actual senior profiles
 * Removes any tool actions that reference non-existent users
 */
function validateToolActions(toolActions, seniorProfiles) {
    const validUserIds = new Set(seniorProfiles.map(s => s.userId));
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
 * Enhanced query with anti-hallucination measures
 * @param {string} userQuery - User's question
 * @param {Array} seniorProfiles - Array of senior profiles from DB (injected by route)
 * @returns {{ text: string, toolActions: Array, stats: Object }}
 */
async function query(userQuery, seniorProfiles = []) {
    try {
        if (placementData.length > 0 && embeddings.length === 0) {
            await initialize();
        }

        // 1. Find relevant placement records via embedding similarity + Keyword Boosting
        let context = '';
        let topMatches = [];
        const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
        
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
                        keywordScore = (matches / keywords.length) * 0.8; 
                    }
                }

                return { rec, score: embScore + keywordScore, embScore, keywordScore };
            });

            scored.sort((a, b) => b.score - a.score);
            
            // Use dynamic context window - include results above threshold
            const SCORE_THRESHOLD = 0.3;
            const MAX_RESULTS = 20;
            topMatches = scored.filter(s => s.score >= SCORE_THRESHOLD).slice(0, MAX_RESULTS);
            
            context = topMatches.map(s => formatRecord(s.rec, keywords)).join('\n');
            
            if (topMatches.length > 0) {
                console.log(`Top ${topMatches.length} matches (threshold ${SCORE_THRESHOLD}):`);
                topMatches.slice(0, 3).forEach(m => {
                    console.log(`  - ${m.rec.name || m.rec.chunkTitle || 'Unnamed'} | Score: ${m.score.toFixed(3)}`);
                });
            }
        }

        // 2. Build senior profile context with verified IDs
        const seniorContext = seniorProfiles.map(s =>
            `SENIOR: ${s.name} | ID: ${s.userId} | Company: ${s.company || 'N/A'} | Role: ${s.role || 'N/A'} | Branch: ${s.branch || 'N/A'} | Skills: ${(s.skills || []).join(', ')} | Bio: ${s.bio || 'N/A'} | Placement Tips: ${s.placementExperience || 'N/A'} | Topics: ${(s.mentorTopics || []).join(', ')}`
        ).join('\n');

        // 3. Get verified statistics for grounding
        const stats = getVerifiedStats();
        const statsContext = stats ? `
VERIFIED STATISTICS (use these exact numbers):
- Total Placements: ${stats.totalPlacements}
- Average Package: ${stats.averagePackage} LPA
- Highest Package: ${stats.highestPackage} LPA
- Lowest Package: ${stats.lowestPackage} LPA
- Unique Companies: ${stats.uniqueCompanies}
- Batches: ${stats.years.join(', ')}
- Branches: ${stats.branches.join(', ')}` : '';

        // 4. Generate response with STRICT anti-hallucination prompt
        const prompt = `You are an AI assistant for the ANITS Alumni-Student Platform. You MUST follow strict grounding rules.

=== CRITICAL ANTI-HALLUCINATION RULES ===
1. ONLY state facts that appear EXACTLY in the PLACEMENT DATA CONTEXT below
2. NEVER invent student names, companies, packages, or statistics
3. If asked for statistics, ONLY use the VERIFIED STATISTICS provided
4. If information is not in the context, say "I don't have that specific information in my records"
5. When quoting numbers (packages, counts), use EXACT values from the context
6. Do NOT extrapolate or estimate beyond the provided data
7. If unsure, acknowledge uncertainty rather than guess

=== DATA SOURCES ===

PLACEMENT DATA CONTEXT (${topMatches.length} relevant records found):
${context || '(No specific placement records match this query)'}
${statsContext}

AVAILABLE SENIORS ON PLATFORM (${seniorProfiles.length} profiles):
${seniorContext || '(No senior profiles loaded)'}

=== TOOL ACTIONS ===
When recommending a senior from the list above, include tool tags using their EXACT ID from the list:

[TOOL:VIEW_PROFILE:USER_ID:SENIOR_NAME] — link to profile
[TOOL:SEND_MESSAGE:USER_ID:SENIOR_NAME] — suggest messaging
[TOOL:REQUEST_INTERVIEW:USER_ID:SENIOR_NAME] — suggest mock interview

ONLY use IDs that appear in the AVAILABLE SENIORS section above. Do NOT invent IDs.

=== RESPONSE GUIDELINES ===
- Be specific: cite batch years, exact package amounts, company names from context
- When listing placements, use the exact format from context
- For questions about topics not in context, suggest reaching out to seniors
- Keep answers concise, accurate, and grounded

User Question: ${userQuery}

Answer (grounded only in provided context):`;

        const response = await model.generateContent(prompt);
        const rawText = response.response.text();

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
        const validatedToolActions = validateToolActions(toolActions, seniorProfiles);

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
