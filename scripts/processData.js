const fs = require('fs-extra');
const path = require('path');

const RAW_DATA_FILE = path.join(__dirname, '../data/raw_placement_data.json');
const PROCESSED_DATA_FILE = path.join(__dirname, '../data/processed_placement_data.json');

// Regex patterns
// Roll No: 12 digits, usually starting with 3. e.g., 318126510081
const ROLL_NO_REGEX = /\b(3\d{11})\b/g;
// Package: Number with optional decimal, at the end of the line or segment. e.g., 44.00
// We'll look for it specifically in the context of a record.

async function processData() {
    const rawData = await fs.readJson(RAW_DATA_FILE);
    let allRecords = [];

    rawData.forEach(file => {
        console.log(`Processing ${file.filename}...`);
        const text = file.text;

        // Strategy:
        // 1. Split by Roll Number. The Roll Number is a strong anchor.
        // 2. Everything between two roll numbers belongs to the first roll number's record.
        // 3. Parse that chunk.

        // Find all roll number matches
        let match;
        const matches = [];
        while ((match = ROLL_NO_REGEX.exec(text)) !== null) {
            matches.push({
                rollNo: match[0],
                index: match.index
            });
        }

        console.log(`Found ${matches.length} records in ${file.filename}`);

        for (let i = 0; i < matches.length; i++) {
            const currentMatch = matches[i];
            const nextMatch = matches[i + 1];

            // content start: immediately after this roll number
            // content end: start of next roll number (or end of text)
            const startIdx = currentMatch.index + currentMatch.rollNo.length;
            const endIdx = nextMatch ? nextMatch.index : text.length;

            let content = text.substring(startIdx, endIdx).trim();

            // Clean up newlines and extra spaces
            content = content.replace(/\s+/g, ' ');

            // The content usually looks like: "Name Branch Company Package [Next Sr No] [Next Year]"
            // Example: "Sneha kiran KonchadaCSE Amazon WOW44.00 22018-2022"

            // Remove trailing Year pattern (e.g., 2018-2022)
            const yearMatch = content.match(/(\d{4}-\d{4})/);
            if (yearMatch) {
                content = content.substring(0, yearMatch.index).trim();
            }

            let packageVal = null;
            let company = null;
            let name = null;
            let branch = null;

            // Extract Package
            // Strategy: Look for the last number in the string.
            // If it's a float (contains dot), it's definitely package.
            // If it's an integer, it might be package or "Sr No".
            // "Sr No" is usually small (1-3 digits). Package can be integer "4".
            // If we have "Amazon 4 2", "4" is package, "2" is Sr No.

            // Let's try to find a float first.
            const floatMatch = content.match(/(\d+\.\d+)/g);
            if (floatMatch) {
                // Last float is the package
                packageVal = floatMatch[floatMatch.length - 1];
                // Remove everything from the start of this package to the end
                const packageIdx = content.lastIndexOf(packageVal);
                content = content.substring(0, packageIdx).trim();
            } else {
                // No float. Look for integers at the end.
                // Match one or two numbers at the end.
                const endNumbers = content.match(/(\d+)\s+(\d+)$/); // "4 2"
                if (endNumbers) {
                    // "4 2" -> 4 is package, 2 is Sr No.
                    packageVal = endNumbers[1];
                    content = content.substring(0, endNumbers.index).trim();
                } else {
                    const singleEndNumber = content.match(/(\d+)$/); // "4" or "2"
                    if (singleEndNumber) {
                        // Is it package or Sr No?
                        // If it's > 100, likely not package (unless 300000).
                        // If it's < 50, likely package (LPA) or Sr No.
                        // This is ambiguous. Let's assume it's package if it looks like a reasonable LPA (e.g. > 1).
                        // But "2" could be Sr No 2.
                        // Let's check if there's a company name before it.
                        // If we assume it's package, we might be wrong.
                        // But usually Sr No is present.
                        // Let's assume it is package for now.
                        packageVal = singleEndNumber[1];
                        content = content.substring(0, singleEndNumber.index).trim();
                    }
                }
            }

            // Now content is "Name Branch Company"
            // Branches: CSE, ECE, EEE, IT, MECH, CIVIL, CHEM, Civil, Mech, BioTech, Auto
            const branches = ['CSE', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL', 'CHEM', 'Civil', 'Mech', 'BioTech', 'Auto'];

            let branchIdx = -1;
            let foundBranch = '';

            for (const b of branches) {
                const idx = content.lastIndexOf(b);
                if (idx !== -1) {
                    if (idx > branchIdx) {
                        branchIdx = idx;
                        foundBranch = b;
                    }
                }
            }

            if (branchIdx !== -1) {
                name = content.substring(0, branchIdx).trim();
                company = content.substring(branchIdx + foundBranch.length).trim();
                branch = foundBranch;
            } else {
                name = content;
                // If no branch found, maybe it's just Name + Company or just Name.
                // Hard to split without branch anchor.
            }

            allRecords.push({
                file: file.filename,
                year: file.filename.match(/\d{4}-\d{2,4}/) ? file.filename.match(/\d{4}-\d{2,4}/)[0] : 'Unknown',
                rollNo: currentMatch.rollNo,
                name: name,
                branch: branch,
                company: company,
                package: packageVal,
                originalText: text.substring(currentMatch.index, endIdx).replace(/\s+/g, ' ').trim()
            });
        }
    });

    await fs.writeJson(PROCESSED_DATA_FILE, allRecords, { spaces: 2 });
    console.log(`Processed ${allRecords.length} records. Saved to ${PROCESSED_DATA_FILE}`);
}

processData();
