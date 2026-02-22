const express = require('express');
const cors = require('cors');
const { initialize, query } = require('./ragEngine');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.post('/api/chat', async (req, res) => {
    try {
        console.log('Received request:', req.body);
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log('Calling query with message:', message);
        const response = await query(message);
        console.log('Query completed successfully');
        res.json({ response });
    } catch (error) {
        console.error('Error processing chat:', error);
        console.error('Error stack:', error.stack);
        console.error('Error message:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// Initialize RAG Engine on startup and then start server
initialize()
    .then(() => {
        console.log('RAG Engine initialized successfully');
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('Failed to initialize RAG Engine:', error);
        console.error('Error stack:', error.stack);
        process.exit(1);
    });
