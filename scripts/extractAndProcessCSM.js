/**
 * Extract and Process CSM Placement Data
 * 
 * This script:
 * 1. Extracts data from csm_placement (1).pdf
 * 2. Processes it into structured placement records
 * 3. Merges with existing processed_placement_data.json
 * 4. Clears embeddings cache
 */

const fs = require('fs-extra');
const path = require('path');
const pdf = require('pdf-parse');

const CSM_PDF = path.join(__dirname, '../files/csm_placement (1).pdf');
const PROCESSED_FILE = path.join(__dirname, '../data/processed_placement_data.json');
const CACHE_FILE = path.join(__dirname, '../data/embeddings_cache.json');

// Roll No: 12 digits starting with 3
const ROLL_NO_REGEX = /\b(3\d{11})\b/g;

// Branch codes - ordered by length (longest first for greedy matching)
const BRANCH_CODES = [
    'CSE-AI & ML', 'CSE-AI&ML', 'CSE-AI',
    'CSE-DS', 'CSE - DS',
    'BioTech', 'Bio-Tech',
    'Civil', 'CIVIL',
    'MECH', 'Mech',
    'CHEM', 'CHE',
    'Auto', 'AUTO',
    'CSE', 'CSD', 'CSM',
    'ECE', 'EEE',
    'IT', 'CE', 'ME', 'CS', 'EE'
];

// Normalized branch mapping
const BRANCH_NORMALIZE = {
    'CSE': 'CSE', 'CS': 'CSE',
    'CSD': 'CSD', 'CSE-AI & ML': 'CSD', 'CSE-AI&ML': 'CSD', 'CSE-AI': 'CSD',
    'CSM': 'CSM', 'CSE-DS': 'CSM', 'CSE - DS': 'CSM',
    'ECE': 'ECE', 'EC': 'ECE',
    'EEE': 'EEE', 'EE': 'EEE',
    'IT': 'IT',
    'MECH': 'MECH', 'ME': 'MECH', 'Mech': 'MECH',
    'CIVIL': 'CIVIL', 'CE': 'CIVIL', 'Civil': 'CIVIL',
    'CHEM': 'CHEM', 'CHE': 'CHEM', 'Chemical': 'CHEM',
    'BioTech': 'BioTech', 'Bio-Tech': 'BioTech', 'BT': 'BioTech',
    'Auto': 'Auto', 'AUTO': 'Auto'
};

function findBranch(text) {
    const sortedCodes = [...BRANCH_CODES].sort((a, b) => b.length - a.length);
    
    for (const code of sortedCodes) {
        const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const patterns = [
            new RegExp(`([a-z])${escapedCode}(?=[A-Z\\s])`, 'i'),
            new RegExp(`\\s${escapedCode}(?=[A-Z\\s])`, 'i'),
            new RegExp(`${escapedCode}\\s`, 'i'),
            new RegExp(`\\b${escapedCode}\\b`, 'i')
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const normalized = BRANCH_NORMALIZE[code] || code.toUpperCase();
                let idx = match.index;
                if (match[0].match(/^[a-z]/i) && match[1]) {
                    idx += 1;
                }
                return { branch: normalized, index: idx, length: code.length };
            }
        }
    }
    return null;
}

function findPackage(text) {
    const decimalMatches = [...text.matchAll(/(\d+\.\d{1,2})/g)];
    
    for (let i = decimalMatches.length - 1; i >= 0; i--) {
        const match = decimalMatches[i];
        const value = parseFloat(match[1]);
        if (value >= 1 && value <= 100) {
            return { package: match[1], index: match.index };
        }
    }
    
    const intPattern = /\b(\d{1,2})(?=\s+\d{1,4}\s*$)/;
    const intMatch = text.match(intPattern);
    if (intMatch) {
        const value = parseInt(intMatch[1]);
        if (value >= 2 && value <= 50) {
            return { package: intMatch[1], index: intMatch.index };
        }
    }
    
    return null;
}

function cleanName(name) {
    if (!name) return '';
    name = name.trim()
        .replace(/^\d+\s*/, '')
        .replace(/\s*\d+$/, '')
        .replace(/\s+/g, ' ');
    
    if (name === name.toUpperCase() && name.length > 3) {
        name = name.split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    }
    
    return name.trim();
}

function cleanCompany(company) {
    if (!company) return '';
    return company.trim()
        .replace(/^\d+\s*/, '')
        .replace(/\s*\d+\.\d+\s*$/, '')
        .replace(/\s*\d+\s*$/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseRecordContent(content, year) {
    content = content.replace(/\s+/g, ' ').trim();
    
    // Remove year range from end
    const yearMatch = content.match(/\s*(\d{4}-\d{4})\s*$/);
    if (yearMatch) {
        content = content.substring(0, yearMatch.index).trim();
    }
    
    // Remove serial number
    const serialMatch = content.match(/\s+(\d{1,4})\s*$/);
    if (serialMatch) {
        const serial = parseInt(serialMatch[1]);
        if (serial >= 1 && serial <= 1500) {
            content = content.substring(0, serialMatch.index).trim();
        }
    }
    
    // Find and extract package
    const packageResult = findPackage(content);
    let pkg = null;
    if (packageResult) {
        pkg = packageResult.package;
        content = content.substring(0, packageResult.index).trim();
    }
    
    // Find branch (splits name from company)
    const branchResult = findBranch(content);
    
    let name = null;
    let branch = null;
    let company = null;
    
    if (branchResult) {
        branch = branchResult.branch;
        name = content.substring(0, branchResult.index);
        company = content.substring(branchResult.index + branchResult.length);
    } else {
        name = content;
    }
    
    name = cleanName(name);
    company = cleanCompany(company);
    
    return { name, branch, company, package: pkg };
}

async function main() {
    console.log('═══════════════════════════════════════════════');
    console.log('  CSM Placement Data Extraction');
    console.log('═══════════════════════════════════════════════\n');

    // Step 1: Check if PDF exists
    if (!await fs.pathExists(CSM_PDF)) {
        console.error(`❌ Error: PDF not found at ${CSM_PDF}`);
        process.exit(1);
    }

    console.log('📄 Step 1: Extracting text from PDF...');
    const dataBuffer = await fs.readFile(CSM_PDF);
    const pdfData = await pdf(dataBuffer);
    console.log(`  ✓ Extracted ${pdfData.numpages} pages`);

    // Step 2: Parse placement records
    console.log('\n📊 Step 2: Parsing placement records...');
    const text = pdfData.text;
    
    // Determine year from filename or content
    const fileYear = 'CSM-Batch'; // Could be extracted if year appears in PDF

    // Find all roll numbers
    ROLL_NO_REGEX.lastIndex = 0;
    const matches = [];
    let match;
    while ((match = ROLL_NO_REGEX.exec(text)) !== null) {
        matches.push({ rollNo: match[1], index: match.index });
    }

    console.log(`  Found ${matches.length} roll numbers`);

    const newRecords = [];
    const seenRollNos = new Set();

    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];

        if (seenRollNos.has(current.rollNo)) {
            continue;
        }

        const startIdx = current.index + current.rollNo.length;
        const endIdx = next ? next.index : text.length;
        const content = text.substring(startIdx, endIdx);

        const parsed = parseRecordContent(content, fileYear);

        // Build record
        const record = {
            file: 'csm_placement (1).pdf',
            year: fileYear,
            rollNo: current.rollNo,
            name: parsed.name,
            branch: parsed.branch || 'CSM',  // Default to CSM if not found
            company: parsed.company,
            package: parsed.package,
            originalText: text.substring(current.index, endIdx).replace(/\s+/g, ' ').trim().substring(0, 500),
            type: 'individual',
            content: `${parsed.name} (${current.rollNo}, ${parsed.branch || 'CSM'}) placed at ${parsed.company || 'Unknown Company'}, ${parsed.package || 'N/A'} LPA, CSM batch`
        };

        // Basic validation
        if (record.name && record.name.length > 2) {
            seenRollNos.add(current.rollNo);
            newRecords.push(record);
        }
    }

    console.log(`  ✓ Parsed ${newRecords.length} valid records`);

    // Step 3: Merge with existing data
    console.log('\n📦 Step 3: Merging with existing data...');
    let existingRecords = [];
    if (await fs.pathExists(PROCESSED_FILE)) {
        existingRecords = await fs.readJson(PROCESSED_FILE);
        console.log(`  Loaded ${existingRecords.length} existing records`);
    }

    // Filter out duplicates based on roll number
    const existingRollNos = new Set(
        existingRecords
            .filter(r => r.type === 'individual')
            .map(r => r.rollNo)
    );
    
    const trulyNewRecords = newRecords.filter(r => !existingRollNos.has(r.rollNo));
    console.log(`  ${trulyNewRecords.length} new records (${newRecords.length - trulyNewRecords.length} duplicates skipped)`);

    // Combine
    const allRecords = [...existingRecords, ...trulyNewRecords];
    console.log(`  Total records: ${allRecords.length}`);

    // Step 4: Save updated data
    await fs.writeJson(PROCESSED_FILE, allRecords, { spaces: 2 });
    console.log(`  ✓ Saved to ${PROCESSED_FILE}`);

    // Step 5: Clear embeddings cache
    if (await fs.pathExists(CACHE_FILE)) {
        await fs.remove(CACHE_FILE);
        console.log('  ✓ Cleared embeddings cache');
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════');
    console.log('  ✅ EXTRACTION COMPLETE');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Added: ${trulyNewRecords.length} new records`);
    console.log(`  Total: ${allRecords.length} placement records`);
    console.log('\n  Next steps:');
    console.log('  1. Run "npm run seed" to update mentor data');
    console.log('  2. Restart server - RAG will regenerate embeddings');

    // Show sample of new records
    if (trulyNewRecords.length > 0) {
        console.log('\n📋 Sample of new records:');
        trulyNewRecords.slice(0, 5).forEach(r => {
            console.log(`  - ${r.name} (${r.branch}) → ${r.company} @ ${r.package} LPA`);
        });
    }
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
});
