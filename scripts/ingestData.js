/**
 * Data Ingestion Pipeline (Lightweight)
 * 
 * Approach:
 *   1. Loads existing processed_placement_data.json (individual records, already processed)
 *   2. Extracts summary & question PDFs and chunks them
 *   3. Combines everything into processed_placement_data.json 
 *   4. Inserts into MongoDB
 *   5. Clears embeddings cache so RAG engine regenerates on next query
 * 
 * Usage: node scripts/ingestData.js
 */

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const pdf = require('pdf-parse');
const mongoose = require('mongoose');

const FILES_DIR = path.join(__dirname, '../files');
const DATA_DIR = path.join(__dirname, '../data');
const PROCESSED_FILE = path.join(DATA_DIR, 'processed_placement_data.json');
const CACHE_FILE = path.join(DATA_DIR, 'embeddings_cache.json');

async function connectDB() {
    const uri = process.env.MONGO_DB_URL;
    if (!uri) throw new Error('MONGO_DB_URL not set in .env');
    await mongoose.connect(uri);
    console.log('✓ Connected to MongoDB');
}

// Chunk text into overlapping segments
function chunkText(text, size = 800, overlap = 100) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.substring(i, i + size).trim());
        i += size - overlap;
    }
    return chunks.filter(c => c.length > 20);
}

async function main() {
    console.log('═══════════════════════════════════════════════');
    console.log('  ANITS Placement Data Ingestion Pipeline');
    console.log('═══════════════════════════════════════════════\n');

    await connectDB();

    // ── Step 1: Load existing individual records ──────────────────
    console.log('📊 Step 1: Loading existing placement records...');
    let existingRecords = [];
    if (await fs.pathExists(PROCESSED_FILE)) {
        existingRecords = await fs.readJson(PROCESSED_FILE);
        // Filter to keep only individual records (exclude old chunks if re-running)
        existingRecords = existingRecords.filter(r => !r.type || r.type === 'individual');
    }

    // Re-run the extract + process if no records exist
    if (existingRecords.length === 0) {
        console.log('  No existing records found. Running extract + process first...');
        const { execSync } = require('child_process');
        execSync('node scripts/extractData.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
        execSync('node scripts/processData.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
        existingRecords = await fs.readJson(PROCESSED_FILE);
    }

    // Normalize existing records to have the type field and enhanced content field
    const individualRecords = existingRecords
        .filter(r => !r.type || r.type === 'individual') // Filter out any old chunks
        .map(r => ({
            ...r,
            type: 'individual',
            // Enhanced content field with structured data for better embedding quality
            content: `[PLACEMENT] ${r.name || 'Unknown'} (Roll: ${r.rollNo || 'N/A'}, Branch: ${r.branch || 'Unknown'}) was placed at ${r.company || 'Unknown Company'} with a package of ${r.package || 'N/A'} LPA in batch ${r.year || 'Unknown'}`,
            sourceFile: r.file
        }));
    console.log(`  ✓ ${individualRecords.length} individual placement records loaded`);

    // ── Step 2: Extract & chunk summary PDFs (one at a time to save memory) ──
    console.log('\n📋 Step 2: Processing summary & question PDFs...');
    const allFiles = (await fs.readdir(FILES_DIR)).filter(f => f.toLowerCase().endsWith('.pdf'));
    const supplementaryFiles = allFiles.filter(f =>
        /summary|branchwise|question/i.test(f)
    );
    console.log(`  Found ${supplementaryFiles.length} supplementary PDFs`);

    const chunkRecords = [];

    for (const filename of supplementaryFiles) {
        try {
            const buf = await fs.readFile(path.join(FILES_DIR, filename));
            const data = await pdf(buf);
            console.log(`  Processing ${filename} (${data.numpages} pages)...`);

            const isQ = /question/i.test(filename);
            const type = isQ ? 'questions' : 'summary';
            const batchMatch = filename.match(/(\d{2,4})\s*Batch/i);
            const batchYear = batchMatch ? batchMatch[1] : '';
            const title = isQ
                ? 'Placement Interview Questions & Experiences'
                : `${batchYear} Batch Placement Summary Branchwise`;

            const cleanText = data.text.replace(/\f/g, '\n').replace(/\n{3,}/g, '\n\n');
            const chunks = chunkText(cleanText, 1000, 150);

            for (let i = 0; i < chunks.length; i++) {
                // Add type marker to content for better embedding quality
                const typeMarker = isQ ? '[INTERVIEW_EXPERIENCE]' : '[BATCH_SUMMARY]';
                chunkRecords.push({
                    file: filename,
                    year: batchYear ? (batchYear.length === 2 ? `20${batchYear}` : batchYear) : '',
                    rollNo: null,
                    name: null,
                    branch: null,
                    company: null,
                    package: null,
                    type,
                    chunkTitle: `${title} (Part ${i + 1}/${chunks.length})`,
                    content: `${typeMarker} ${title}: ${chunks[i]}`,
                    originalText: chunks[i],
                    sourceFile: filename
                });
            }
            console.log(`    ✓ ${chunks.length} chunks created`);

            // Free memory
            buf.fill(0);
        } catch (err) {
            console.error(`    ✗ Error: ${err.message}`);
        }
    }

    // ── Step 3: Combine and write ───────────────────────────────────
    const allRecords = [...individualRecords, ...chunkRecords];
    console.log(`\n📦 Step 3: Total records: ${allRecords.length} (${individualRecords.length} individual + ${chunkRecords.length} chunks)`);

    // Write the combined JSON
    await fs.writeJson(PROCESSED_FILE, allRecords, { spaces: 2 });
    console.log(`  ✓ Written to processed_placement_data.json`);

    // ── Step 4: Insert into MongoDB ─────────────────────────────────
    console.log('\n💾 Step 4: Inserting into MongoDB...');
    const PlacementRecord = require('../server/models/PlacementRecord');
    await PlacementRecord.deleteMany({});

    const BATCH = 100;
    for (let i = 0; i < allRecords.length; i += BATCH) {
        await PlacementRecord.insertMany(allRecords.slice(i, i + BATCH));
        process.stdout.write(`  Inserted ${Math.min(i + BATCH, allRecords.length)}/${allRecords.length}\r`);
    }
    console.log(`\n  ✓ All records inserted into MongoDB`);

    // ── Step 5: Clear embeddings cache ──────────────────────────────
    if (await fs.pathExists(CACHE_FILE)) {
        await fs.remove(CACHE_FILE);
        console.log('  ✓ Cleared embeddings cache (will regenerate on first query)');
    }

    // ── Summary ─────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════');
    console.log('  ✅ INGESTION COMPLETE');
    console.log('═══════════════════════════════════════════════');

    const byType = {};
    allRecords.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1; });
    Object.entries(byType).forEach(([t, c]) => console.log(`  ${t}: ${c}`));

    if (individualRecords.length > 0) {
        const companies = new Set(individualRecords.map(r => r.company).filter(Boolean));
        const years = new Set(individualRecords.map(r => r.year));
        console.log(`  Companies: ${companies.size}`);
        console.log(`  Batches: ${[...years].sort().join(', ')}`);
    }

    console.log('\n  Next: Restart the server (npm start)');
    console.log('  The RAG engine will auto-generate embeddings on first query (~2-5 min)');

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
});
