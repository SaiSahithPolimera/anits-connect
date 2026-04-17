const express = require('express');
const { query } = require('../ragEngine');
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
        const dataFile = path.join(__dirname, '../../data/processed_placement_data.json');
        if (!await fs.pathExists(dataFile)) return res.json({ stats: {} });

        const data = await fs.readJson(dataFile);
        const individuals = data.filter(r => r.type === 'individual' || !r.type);
        const packages = individuals.filter(r => r.package).map(r => parseFloat(r.package) || 0);

        res.json({
            stats: {
                totalPlacements: individuals.length,
                averagePackage: packages.length > 0
                    ? (packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(2) : 0,
                highestPackage: packages.length > 0 ? Math.max(...packages) : 0,
                uniqueCompanies: new Set(individuals.map(r => r.company).filter(Boolean)).size
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats.' });
    }
});

module.exports = router;
