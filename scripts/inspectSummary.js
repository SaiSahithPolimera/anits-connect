const fs = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/raw_placement_data.json');

async function inspect() {
    const data = await fs.readJson(DATA_FILE);

    data.forEach(file => {
        if (file.filename.includes('Placement summary')) {
            console.log('---', file.filename, '---');
            console.log(file.text.substring(0, 500)); // Print first 500 chars
            console.log('...');
        }
    });
}

inspect();
