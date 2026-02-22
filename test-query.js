const { initialize, query } = require('./server/ragEngine');

async function test() {
    try {
        console.log('Starting test...');
        await initialize();
        console.log('Initialization complete');

        const result = await query('What is the highest package?');
        console.log('Result:', result);
    } catch (error) {
        console.error('Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

test();
