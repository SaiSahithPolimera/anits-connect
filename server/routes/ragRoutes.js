const express = require('express');
const { query, getVerifiedStats } = require('../ragEngine');
const Profile = require('../models/Profile');
const { authenticate, optionalAuth } = require('../middleware/auth');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();

// POST /api/rag/query — RAG query with tool calling
router.post('/query', optionalAuth, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required.' });

        const result = await query(message);

        res.json({
            response: result.text,
            toolActions: result.toolActions || [],
            query: message
        });
    } catch (error) {
        console.error('RAG query error:', error);
        res.status(500).json({ error: 'Failed to process query.', details: error.message });
    }
});

// GET /api/rag/stats — placement statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = getVerifiedStats() || {};
        res.json({ stats });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats.' });
    }
});

module.exports = router;
