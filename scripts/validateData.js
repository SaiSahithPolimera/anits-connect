/**
 * Data Validation Script
 * 
 * Audits existing processed_placement_data.json for data quality issues.
 * Generates a detailed report of problems found.
 * 
 * Usage: node scripts/validateData.js
 */

const fs = require('fs-extra');
const path = require('path');

const PROCESSED_DATA_FILE = path.join(__dirname, '../data/processed_placement_data.json');
const REPORT_FILE = path.join(__dirname, '../data/validation_report.json');

// Valid branch codes with variations
const VALID_BRANCHES = new Set([
    'CSE', 'CS', 'CSM', 'CSD', 'CSE-AI', 'AI-ML', 'AI',
    'ECE', 'EEE', 'EE',
    'IT', 'MECH', 'ME', 'CIVIL', 'CE', 
    'CHEM', 'CHE', 'BioTech', 'Bio-Tech', 'Auto'
]);

// Known company patterns (for validation)
const KNOWN_COMPANIES = new Set([
    'TCS', 'TCS Digital', 'TCS Ninja', 'Wipro', 'Wipro Turbo', 'Infosys',
    'Amazon', 'Microsoft', 'Google', 'Cognizant', 'Accenture', 'IBM',
    'HCL', 'Tech Mahindra', 'L&T', 'Capgemini', 'DXC', 'Deloitte',
    'Virtusa', 'MEIL', 'CDK Global', 'Wiley mThree', 'HETERO',
    'Deccan fine Chemical', 'Aurobindo', 'DTPL', 'Pennant Technologies',
    'Lyfius', 'Team Lease', 'IOPEX Technologies', 'Petrocon',
    'Spider Tech Lab', 'Nueve ITSolutions', 'ENERGETIC PEOPLE PVT.LTD'
]);

function validateRecord(record, idx) {
    const issues = [];

    // Check roll number format (should be 12 digits starting with 3)
    if (!record.rollNo) {
        issues.push({ field: 'rollNo', issue: 'missing', severity: 'high' });
    } else if (!/^3\d{11}$/.test(record.rollNo) && !/^\d{12}$/.test(record.rollNo)) {
        // Also allow other 12-digit formats
        if (!/^3\d+/.test(record.rollNo)) {
            issues.push({ field: 'rollNo', issue: 'invalid_format', value: record.rollNo, severity: 'medium' });
        }
    }

    // Check name
    if (!record.name || record.name.trim() === '') {
        issues.push({ field: 'name', issue: 'missing', severity: 'high' });
    } else {
        // Check for obvious parsing errors
        if (/[A-Z]{3,4}$/.test(record.name)) {
            // Name ends with branch code (parsing error)
            issues.push({ field: 'name', issue: 'contains_branch_code', value: record.name, severity: 'high' });
        }
        if (/\d{2,}/.test(record.name)) {
            // Name contains numbers (likely parsing error)
            issues.push({ field: 'name', issue: 'contains_numbers', value: record.name, severity: 'high' });
        }
        if (record.name.length < 3) {
            issues.push({ field: 'name', issue: 'too_short', value: record.name, severity: 'medium' });
        }
        if (record.name.length > 100) {
            issues.push({ field: 'name', issue: 'too_long', value: record.name.substring(0, 50) + '...', severity: 'medium' });
        }
    }

    // Check branch
    if (!record.branch || record.branch.trim() === '') {
        issues.push({ field: 'branch', issue: 'missing', severity: 'high' });
    } else if (!VALID_BRANCHES.has(record.branch.toUpperCase())) {
        issues.push({ field: 'branch', issue: 'unknown_branch', value: record.branch, severity: 'medium' });
    }

    // Check company
    if (!record.company || record.company.trim() === '') {
        issues.push({ field: 'company', issue: 'missing', severity: 'high' });
    } else {
        // Check for obvious parsing errors
        if (/^\d+$/.test(record.company)) {
            issues.push({ field: 'company', issue: 'numeric_value', value: record.company, severity: 'high' });
        }
        if (record.company.length < 2) {
            issues.push({ field: 'company', issue: 'too_short', value: record.company, severity: 'high' });
        }
        // Check for company names merged with package
        if (/\d+\.\d+$/.test(record.company)) {
            issues.push({ field: 'company', issue: 'contains_package', value: record.company, severity: 'high' });
        }
    }

    // Check package
    if (!record.package) {
        issues.push({ field: 'package', issue: 'missing', severity: 'medium' });
    } else {
        const pkg = parseFloat(record.package);
        if (isNaN(pkg)) {
            issues.push({ field: 'package', issue: 'not_numeric', value: record.package, severity: 'high' });
        } else if (pkg < 1 || pkg > 100) {
            issues.push({ field: 'package', issue: 'out_of_range', value: record.package, severity: 'medium' });
        }
    }

    // Check year format
    if (!record.year) {
        issues.push({ field: 'year', issue: 'missing', severity: 'low' });
    } else if (!/^\d{4}-\d{2,4}$/.test(record.year) && !/^\d{4}$/.test(record.year)) {
        issues.push({ field: 'year', issue: 'invalid_format', value: record.year, severity: 'low' });
    }

    // Check content field
    if (!record.content || record.content.trim() === '') {
        issues.push({ field: 'content', issue: 'missing', severity: 'medium' });
    }

    return issues;
}

function findDuplicates(records) {
    const rollNoMap = new Map();
    const duplicates = [];

    records.forEach((record, idx) => {
        if (record.type !== 'individual' && record.type) return;
        
        if (!record.rollNo) return;
        
        if (rollNoMap.has(record.rollNo)) {
            const existing = rollNoMap.get(record.rollNo);
            duplicates.push({
                rollNo: record.rollNo,
                indices: [existing.idx, idx],
                records: [existing.record, record]
            });
        } else {
            rollNoMap.set(record.rollNo, { idx, record });
        }
    });

    return duplicates;
}

function analyzeDataDistribution(records) {
    const stats = {
        byBranch: {},
        byCompany: {},
        byYear: {},
        packageRanges: {
            '0-4': 0,
            '4-8': 0,
            '8-12': 0,
            '12-20': 0,
            '20+': 0
        }
    };

    const individualRecords = records.filter(r => !r.type || r.type === 'individual');

    individualRecords.forEach(record => {
        // Branch distribution
        const branch = record.branch || 'Unknown';
        stats.byBranch[branch] = (stats.byBranch[branch] || 0) + 1;

        // Company distribution
        const company = record.company || 'Unknown';
        stats.byCompany[company] = (stats.byCompany[company] || 0) + 1;

        // Year distribution
        const year = record.year || 'Unknown';
        stats.byYear[year] = (stats.byYear[year] || 0) + 1;

        // Package ranges
        const pkg = parseFloat(record.package) || 0;
        if (pkg < 4) stats.packageRanges['0-4']++;
        else if (pkg < 8) stats.packageRanges['4-8']++;
        else if (pkg < 12) stats.packageRanges['8-12']++;
        else if (pkg < 20) stats.packageRanges['12-20']++;
        else stats.packageRanges['20+']++;
    });

    return stats;
}

async function main() {
    console.log('═══════════════════════════════════════════════');
    console.log('  ANITS Placement Data Validation Report');
    console.log('═══════════════════════════════════════════════\n');

    if (!await fs.pathExists(PROCESSED_DATA_FILE)) {
        console.error('Error: processed_placement_data.json not found!');
        process.exit(1);
    }

    const data = await fs.readJson(PROCESSED_DATA_FILE);
    console.log(`Total records loaded: ${data.length}`);

    // Separate individual records from chunks
    const individualRecords = data.filter(r => !r.type || r.type === 'individual');
    const chunkRecords = data.filter(r => r.type && r.type !== 'individual');

    console.log(`Individual placement records: ${individualRecords.length}`);
    console.log(`Document chunks (summary/questions): ${chunkRecords.length}\n`);

    // Validate each individual record
    console.log('🔍 Validating individual records...');
    const allIssues = [];
    let recordsWithIssues = 0;

    individualRecords.forEach((record, idx) => {
        const issues = validateRecord(record, idx);
        if (issues.length > 0) {
            recordsWithIssues++;
            allIssues.push({
                index: idx,
                rollNo: record.rollNo,
                name: record.name,
                issues
            });
        }
    });

    // Find duplicates
    console.log('🔍 Finding duplicates...');
    const duplicates = findDuplicates(individualRecords);

    // Analyze distribution
    console.log('📊 Analyzing data distribution...');
    const distribution = analyzeDataDistribution(individualRecords);

    // Generate report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalRecords: data.length,
            individualRecords: individualRecords.length,
            chunkRecords: chunkRecords.length,
            recordsWithIssues,
            duplicateCount: duplicates.length,
            issuesByField: {},
            issuesBySeverity: { high: 0, medium: 0, low: 0 }
        },
        distribution,
        issues: allIssues.slice(0, 100), // Top 100 issues
        duplicates: duplicates.slice(0, 20) // Top 20 duplicates
    };

    // Count issues by field and severity
    allIssues.forEach(item => {
        item.issues.forEach(issue => {
            report.summary.issuesByField[issue.field] = (report.summary.issuesByField[issue.field] || 0) + 1;
            report.summary.issuesBySeverity[issue.severity]++;
        });
    });

    // Save report
    await fs.writeJson(REPORT_FILE, report, { spaces: 2 });

    // Print summary
    console.log('\n═══════════════════════════════════════════════');
    console.log('  VALIDATION SUMMARY');
    console.log('═══════════════════════════════════════════════\n');

    console.log(`✓ Total individual records: ${individualRecords.length}`);
    console.log(`✗ Records with issues: ${recordsWithIssues} (${(recordsWithIssues / individualRecords.length * 100).toFixed(1)}%)`);
    console.log(`✗ Duplicate roll numbers: ${duplicates.length}`);

    console.log('\n📌 Issues by Field:');
    Object.entries(report.summary.issuesByField)
        .sort((a, b) => b[1] - a[1])
        .forEach(([field, count]) => {
            console.log(`  ${field}: ${count}`);
        });

    console.log('\n🚨 Issues by Severity:');
    console.log(`  HIGH: ${report.summary.issuesBySeverity.high}`);
    console.log(`  MEDIUM: ${report.summary.issuesBySeverity.medium}`);
    console.log(`  LOW: ${report.summary.issuesBySeverity.low}`);

    console.log('\n📊 Branch Distribution:');
    Object.entries(distribution.byBranch)
        .sort((a, b) => b[1] - a[1])
        .forEach(([branch, count]) => {
            console.log(`  ${branch}: ${count}`);
        });

    console.log('\n💼 Top 10 Companies:');
    Object.entries(distribution.byCompany)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([company, count]) => {
            console.log(`  ${company}: ${count}`);
        });

    console.log('\n💰 Package Distribution:');
    Object.entries(distribution.packageRanges).forEach(([range, count]) => {
        console.log(`  ${range} LPA: ${count}`);
    });

    console.log('\n📅 Year Distribution:');
    Object.entries(distribution.byYear)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([year, count]) => {
            console.log(`  ${year}: ${count}`);
        });

    if (allIssues.length > 0) {
        console.log('\n⚠️  Sample Issues (first 5):');
        allIssues.slice(0, 5).forEach(item => {
            console.log(`  Record ${item.index}: ${item.name || 'Unknown'} (${item.rollNo || 'No Roll'})`);
            item.issues.forEach(issue => {
                console.log(`    - [${issue.severity.toUpperCase()}] ${issue.field}: ${issue.issue}${issue.value ? ` (${issue.value})` : ''}`);
            });
        });
    }

    console.log(`\n📁 Full report saved to: ${REPORT_FILE}`);
    console.log('\n═══════════════════════════════════════════════');
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
