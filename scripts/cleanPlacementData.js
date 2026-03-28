/**
 * Clean Placement Data Script
 * 
 * Removes fabricated entries from processed_placement_data.json
 * Keeps only data from actual PDF files
 * 
 * Usage: node scripts/cleanPlacementData.js
 */

const fs = require('fs-extra');
const path = require('path');

const PROCESSED_FILE = path.join(__dirname, '../data/processed_placement_data.json');

// Valid source files - actual PDF files
const VALID_SOURCES = [
    '2018-22 Placement Data.pdf',
    '2019-23 Placement Data.pdf',
    '2020-24 Placement Data.pdf',
    'csm_placement (1).pdf'
];

async function cleanData() {
    console.log('═══════════════════════════════════════════════');
    console.log('  Cleaning Placement Data');
    console.log('═══════════════════════════════════════════════\n');

    if (!await fs.pathExists(PROCESSED_FILE)) {
        console.error('Error: processed_placement_data.json not found');
        process.exit(1);
    }

    const data = await fs.readJson(PROCESSED_FILE);
    console.log(`Loaded ${data.length} total records`);

    // Filter to keep only records from valid PDF sources
    const cleanedData = data.filter(record => {
        // Keep if file is a valid PDF source
        if (VALID_SOURCES.some(src => record.file && record.file.includes(src.replace('.pdf', '')))) {
            return true;
        }
        // Also keep summary/question chunks from valid sources
        if (record.type === 'summary' || record.type === 'questions') {
            return true;
        }
        return false;
    });

    // Count removed entries
    const removed = data.length - cleanedData.length;
    
    // Get list of removed sources
    const removedSources = new Set();
    data.forEach(r => {
        if (!cleanedData.includes(r)) {
            removedSources.add(r.file);
        }
    });

    console.log(`\n✗ Removed ${removed} fabricated records from:`);
    removedSources.forEach(src => console.log(`   - ${src}`));

    console.log(`\n✓ Keeping ${cleanedData.length} valid records from actual PDFs`);

    // Statistics
    const stats = {
        byFile: {},
        byType: {},
        byBranch: {}
    };
    
    cleanedData.forEach(r => {
        stats.byFile[r.file] = (stats.byFile[r.file] || 0) + 1;
        stats.byType[r.type || 'individual'] = (stats.byType[r.type || 'individual'] || 0) + 1;
        if (r.branch) stats.byBranch[r.branch] = (stats.byBranch[r.branch] || 0) + 1;
    });

    console.log('\n📊 Records by source file:');
    Object.entries(stats.byFile)
        .sort((a, b) => b[1] - a[1])
        .forEach(([file, count]) => {
            console.log(`   ${file}: ${count}`);
        });

    console.log('\n📊 Records by type:');
    Object.entries(stats.byType).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
    });

    console.log('\n🎓 Records by branch:');
    Object.entries(stats.byBranch)
        .sort((a, b) => b[1] - a[1])
        .forEach(([branch, count]) => {
            console.log(`   ${branch}: ${count}`);
        });

    // Save cleaned data
    await fs.writeJson(PROCESSED_FILE, cleanedData, { spaces: 2 });
    console.log(`\n📁 Saved cleaned data to ${PROCESSED_FILE}`);
}

cleanData().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
