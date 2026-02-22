const fs = require('fs-extra');
const path = require('path');
const pdf = require('pdf-parse');

const FILES_DIR = path.join(__dirname, '../files');
const OUTPUT_FILE = path.join(__dirname, '../data/raw_placement_data.json');

async function extractData() {
    try {
        const files = await fs.readdir(FILES_DIR);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

        console.log(`Found ${pdfFiles.length} PDF files.`);

        const extractedData = [];

        for (const file of pdfFiles) {
            console.log(`Processing ${file}...`);
            const filePath = path.join(FILES_DIR, file);
            const dataBuffer = await fs.readFile(filePath);

            try {
                const data = await pdf(dataBuffer);
                extractedData.push({
                    filename: file,
                    text: data.text,
                    info: data.info,
                    metadata: data.metadata,
                    numpages: data.numpages
                });
                console.log(`Successfully extracted text from ${file}`);
            } catch (err) {
                console.error(`Error parsing PDF ${file}:`, err);
            }
        }

        await fs.outputJson(OUTPUT_FILE, extractedData, { spaces: 2 });
        console.log(`Extraction complete. Data saved to ${OUTPUT_FILE}`);

    } catch (err) {
        console.error('Error reading directory:', err);
    }
}

extractData();
