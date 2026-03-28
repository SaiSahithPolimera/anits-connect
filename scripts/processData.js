/**
 * Accurate Placement Data Processing Script
 * 
 * This script parses placement data from PDF-extracted text with high accuracy.
 * The PDF format is a flattened table where records are concatenated.
 * 
 * Record format: ROLL_NO NAME BRANCH COMPANY PACKAGE SERIAL_NO YEAR
 * Example: "318126502030 Sravani SatyalaCHEM TCS Digital7.70 342018-2022"
 * 
 * Usage: node scripts/processData.js
 */

const fs = require('fs-extra');
const path = require('path');

const RAW_DATA_FILE = path.join(__dirname, '../data/raw_placement_data.json');
const PROCESSED_DATA_FILE = path.join(__dirname, '../data/processed_placement_data.json');

// Roll No: 12 digits starting with 3
const ROLL_NO_REGEX = /\b(3\d{11})\b/g;

// Extended branch codes - ordered by length (longest first for greedy matching)
// IMPORTANT: Include compound branch names that appear in the PDFs
const BRANCH_CODES = [
    // Compound branches (from PDF data) - MUST be first (longest)
    'CSE-AI & ML', 'CSE-AI&ML', 'CSE-AI',      // CSD branch variants
    'CSE-DS', 'CSE - DS',                       // CSM branch variants
    // Standard branches
    'BioTech', 'Bio-Tech',                      // 7-8 chars
    'Civil', 'CIVIL',                           // 5 chars  
    'MECH', 'Mech',                             // 4 chars
    'CHEM', 'CHE',                              // 4 chars
    'Auto', 'AUTO',                             // 4 chars
    'CSE', 'CSD', 'CSM',                        // 3 chars
    'ECE', 'EEE',                               // 3 chars
    'IT', 'CE', 'ME', 'CS', 'EE'               // 2 chars
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

/**
 * Find branch code in text and return match details
 * Handles compound branches like CSE-AI & ML and CSE-DS
 */
function findBranch(text) {
    // Sort by length descending to match longest first
    const sortedCodes = [...BRANCH_CODES].sort((a, b) => b.length - a.length);
    
    for (const code of sortedCodes) {
        // Escape special regex characters in the code
        const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Look for branch code followed by uppercase (company starts) or space
        const patterns = [
            // Branch directly attached to name (lowercase before branch code)
            new RegExp(`([a-z])${escapedCode}(?=[A-Z\\s])`, 'i'),
            // Branch after space, before uppercase or space
            new RegExp(`\\s${escapedCode}(?=[A-Z\\s])`, 'i'),
            // Branch at word boundary (for compound names)
            new RegExp(`${escapedCode}\\s`, 'i'),
            // Branch at exact word boundary
            new RegExp(`\\b${escapedCode}\\b`, 'i')
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const normalized = BRANCH_NORMALIZE[code] || code.toUpperCase();
                // Calculate actual index where branch starts
                let idx = match.index;
                // If matched with preceding char (like 'a' in pattern 1), adjust
                if (match[0].match(/^[a-z]/i) && match[1]) {
                    idx += 1;
                }
                return { branch: normalized, index: idx, length: code.length };
            }
        }
    }
    return null;
}

/**
 * Extract package (salary in LPA) from text
 * Strategy: Find decimal numbers (X.XX format) that represent salary
 */
function findPackage(text) {
    // Find all decimal numbers in text
    const decimalMatches = [...text.matchAll(/(\d+\.\d{1,2})/g)];
    
    // The package is typically the last decimal number before serial/year
    for (let i = decimalMatches.length - 1; i >= 0; i--) {
        const match = decimalMatches[i];
        const value = parseFloat(match[1]);
        // Valid package range: 1 LPA to 100 LPA
        if (value >= 1 && value <= 100) {
            return { package: match[1], index: match.index };
        }
    }
    
    // Fallback: Look for integers that could be packages
    // Pattern: integer followed by space then another number (serial)
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

/**
 * Clean name - remove artifacts, normalize spacing
 */
function cleanName(name) {
    if (!name) return '';
    
    // Remove leading/trailing whitespace
    name = name.trim();
    
    // Remove any leading numbers or serial numbers
    name = name.replace(/^\d+\s*/, '');
    
    // Remove trailing numbers
    name = name.replace(/\s*\d+$/, '');
    
    // Normalize multiple spaces
    name = name.replace(/\s+/g, ' ');
    
    // Title case if all caps
    if (name === name.toUpperCase() && name.length > 3) {
        name = name.split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    }
    
    return name.trim();
}

/**
 * Clean company name
 */
function cleanCompany(company) {
    if (!company) return '';
    
    company = company.trim();
    
    // Remove leading/trailing numbers
    company = company.replace(/^\d+\s*/, '');
    company = company.replace(/\s*\d+\.\d+\s*$/, '');
    company = company.replace(/\s*\d+\s*$/, '');
    
    // Normalize spaces
    company = company.replace(/\s+/g, ' ');
    
    return company.trim();
}

/**
 * Parse a single record's content (text after roll number)
 */
function parseRecordContent(content, year) {
    // Clean the content
    content = content.replace(/\s+/g, ' ').trim();
    
    // Step 1: Remove year range from end if present
    const yearMatch = content.match(/\s*(\d{4}-\d{4})\s*$/);
    if (yearMatch) {
        content = content.substring(0, yearMatch.index).trim();
    }
    
    // Step 2: Remove serial number from end (1-4 digits before year)
    // Pattern: content ends with " 34" or " 567"
    const serialMatch = content.match(/\s+(\d{1,4})\s*$/);
    if (serialMatch) {
        const serial = parseInt(serialMatch[1]);
        // Serial numbers are typically 1-1000
        if (serial >= 1 && serial <= 1500) {
            content = content.substring(0, serialMatch.index).trim();
        }
    }
    
    // Step 3: Find and extract package
    const packageResult = findPackage(content);
    let pkg = null;
    if (packageResult) {
        pkg = packageResult.package;
        // Remove package from content for easier name/company parsing
        content = content.substring(0, packageResult.index).trim();
    }
    
    // Step 4: Find branch (this splits name from company)
    const branchResult = findBranch(content);
    
    let name = null;
    let branch = null;
    let company = null;
    
    if (branchResult) {
        branch = branchResult.branch;
        name = content.substring(0, branchResult.index);
        company = content.substring(branchResult.index + branchResult.length);
    } else {
        // No branch found - try to split by looking for company patterns
        name = content;
    }
    
    // Clean extracted values
    name = cleanName(name);
    company = cleanCompany(company);
    
    return { name, branch, company, package: pkg };
}

/**
 * Calculate quality score for a record (0-100)
 */
function calculateQualityScore(record) {
    let score = 0;
    
    // Valid normalized branches
    const VALID_BRANCHES = new Set(['CSE', 'CSD', 'CSM', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL', 'CHEM', 'BioTech', 'Auto']);
    
    // Roll number validation (20 points)
    if (record.rollNo && /^3\d{11}$/.test(record.rollNo)) {
        score += 20;
    }
    
    // Name validation (25 points)
    if (record.name) {
        if (record.name.length >= 3 && record.name.length <= 100) score += 15;
        if (!/\d/.test(record.name)) score += 5; // No numbers in name
        if (record.name.split(' ').length >= 2) score += 5; // Has at least 2 parts
    }
    
    // Branch validation (20 points)
    if (record.branch && VALID_BRANCHES.has(record.branch)) {
        score += 20;
    }
    
    // Company validation (20 points)
    if (record.company) {
        if (record.company.length >= 2) score += 10;
        if (record.company.length <= 50) score += 5;
        if (!/^\d+$/.test(record.company)) score += 5; // Not just numbers
    }
    
    // Package validation (15 points)
    if (record.package) {
        const pkg = parseFloat(record.package);
        if (!isNaN(pkg) && pkg >= 1 && pkg <= 100) score += 15;
    }
    
    return score;
}

async function processData() {
    console.log('═══════════════════════════════════════════════');
    console.log('  Accurate Placement Data Processing');
    console.log('═══════════════════════════════════════════════\n');

    if (!await fs.pathExists(RAW_DATA_FILE)) {
        console.error(`Error: Raw data file not found at ${RAW_DATA_FILE}`);
        console.log('Run "node scripts/extractData.js" first to extract PDF data.');
        process.exit(1);
    }

    const rawData = await fs.readJson(RAW_DATA_FILE);
    console.log(`Loaded ${rawData.length} PDF files\n`);

    const allRecords = [];
    const seenRollNos = new Set();
    let duplicatesSkipped = 0;
    let lowQualitySkipped = 0;

    for (const file of rawData) {
        // Only process placement data PDFs (not summaries or questions)
        if (/summary|branchwise|question/i.test(file.filename)) {
            console.log(`⏭  Skipping ${file.filename} (summary/question file)`);
            continue;
        }

        console.log(`📄 Processing ${file.filename}...`);
        const text = file.text;

        // Determine year from filename
        const yearFromFile = file.filename.match(/(\d{4}-\d{2,4})/);
        const fileYear = yearFromFile ? yearFromFile[1] : 'Unknown';

        // Find all roll numbers
        ROLL_NO_REGEX.lastIndex = 0;
        const matches = [];
        let match;
        while ((match = ROLL_NO_REGEX.exec(text)) !== null) {
            matches.push({ rollNo: match[1], index: match.index });
        }

        console.log(`   Found ${matches.length} roll numbers`);

        let fileRecords = 0;
        let fileDuplicates = 0;

        for (let i = 0; i < matches.length; i++) {
            const current = matches[i];
            const next = matches[i + 1];

            // Skip duplicates
            if (seenRollNos.has(current.rollNo)) {
                fileDuplicates++;
                duplicatesSkipped++;
                continue;
            }

            // Extract content for this record
            const startIdx = current.index + current.rollNo.length;
            const endIdx = next ? next.index : text.length;
            const content = text.substring(startIdx, endIdx);

            // Parse the content
            const parsed = parseRecordContent(content, fileYear);

            // Build record
            const record = {
                file: file.filename,
                year: fileYear,
                rollNo: current.rollNo,
                name: parsed.name,
                branch: parsed.branch,
                company: parsed.company,
                package: parsed.package,
                originalText: text.substring(current.index, endIdx).replace(/\s+/g, ' ').trim().substring(0, 500),
                type: 'individual',
                content: `${parsed.name} (${current.rollNo}, ${parsed.branch || 'Unknown'}) placed at ${parsed.company || 'Unknown Company'}, ${parsed.package || 'N/A'} LPA, batch ${fileYear}`
            };

            // Calculate quality score
            record.qualityScore = calculateQualityScore(record);

            // Only include records with reasonable quality
            if (record.qualityScore >= 40) {
                seenRollNos.add(current.rollNo);
                allRecords.push(record);
                fileRecords++;
            } else {
                lowQualitySkipped++;
            }
        }

        console.log(`   ✓ ${fileRecords} valid records (${fileDuplicates} duplicates skipped)`);
    }

    // Sort by quality score (highest first)
    allRecords.sort((a, b) => b.qualityScore - a.qualityScore);

    // Generate statistics
    const stats = {
        total: allRecords.length,
        good: allRecords.filter(r => r.qualityScore >= 80).length,
        medium: allRecords.filter(r => r.qualityScore >= 60 && r.qualityScore < 80).length,
        poor: allRecords.filter(r => r.qualityScore < 60).length,
        byBranch: {},
        byCompany: {},
        byYear: {},
        packageStats: { min: Infinity, max: 0, sum: 0, count: 0 }
    };

    allRecords.forEach(r => {
        stats.byBranch[r.branch || 'Unknown'] = (stats.byBranch[r.branch || 'Unknown'] || 0) + 1;
        stats.byCompany[r.company || 'Unknown'] = (stats.byCompany[r.company || 'Unknown'] || 0) + 1;
        stats.byYear[r.year || 'Unknown'] = (stats.byYear[r.year || 'Unknown'] || 0) + 1;
        
        const pkg = parseFloat(r.package);
        if (!isNaN(pkg) && pkg > 0) {
            stats.packageStats.min = Math.min(stats.packageStats.min, pkg);
            stats.packageStats.max = Math.max(stats.packageStats.max, pkg);
            stats.packageStats.sum += pkg;
            stats.packageStats.count++;
        }
    });

    stats.packageStats.avg = stats.packageStats.count > 0 
        ? (stats.packageStats.sum / stats.packageStats.count).toFixed(2) 
        : 0;

    // Save processed data
    await fs.writeJson(PROCESSED_DATA_FILE, allRecords, { spaces: 2 });

    // Print summary
    console.log('\n═══════════════════════════════════════════════');
    console.log('  PROCESSING SUMMARY');
    console.log('═══════════════════════════════════════════════\n');
    
    console.log(`✓ Total valid records: ${stats.total}`);
    console.log(`✗ Duplicates skipped: ${duplicatesSkipped}`);
    console.log(`✗ Low quality skipped: ${lowQualitySkipped}`);
    
    console.log('\n📊 Quality Distribution:');
    console.log(`   Good (80-100):   ${stats.good}`);
    console.log(`   Medium (60-79):  ${stats.medium}`);
    console.log(`   Poor (40-59):    ${stats.poor}`);
    
    console.log('\n🎓 Branch Distribution:');
    Object.entries(stats.byBranch)
        .sort((a, b) => b[1] - a[1])
        .forEach(([branch, count]) => {
            console.log(`   ${branch}: ${count}`);
        });
    
    console.log('\n💼 Top 10 Companies:');
    Object.entries(stats.byCompany)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([company, count]) => {
            console.log(`   ${company}: ${count}`);
        });
    
    console.log('\n💰 Package Statistics:');
    console.log(`   Min: ${stats.packageStats.min === Infinity ? 'N/A' : stats.packageStats.min} LPA`);
    console.log(`   Max: ${stats.packageStats.max} LPA`);
    console.log(`   Avg: ${stats.packageStats.avg} LPA`);
    
    console.log('\n📅 Year Distribution:');
    Object.entries(stats.byYear)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([year, count]) => {
            console.log(`   ${year}: ${count}`);
        });
    
    console.log(`\n📁 Saved to: ${PROCESSED_DATA_FILE}`);
}

processData().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
