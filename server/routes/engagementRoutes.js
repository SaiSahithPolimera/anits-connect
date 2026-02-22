const express = require('express');
const Engagement = require('../models/Engagement');
const Profile = require('../models/Profile');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/engagement/me — own engagement stats
router.get('/me', authenticate, async (req, res) => {
    try {
        let engagement = await Engagement.findOne({ userId: req.user._id });
        if (!engagement) {
            engagement = new Engagement({ userId: req.user._id });
            await engagement.save();
        }
        res.json({ engagement });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch engagement.' });
    }
});

// GET /api/engagement/leaderboard — top contributors
router.get('/leaderboard', authenticate, async (req, res) => {
    try {
        const topAlumni = await Engagement.find({})
            .sort({ contributionScore: -1 })
            .limit(20)
            .lean();

        // Enrich with profile data
        const enriched = await Promise.all(topAlumni.map(async (e) => {
            const profile = await Profile.findOne({ userId: e.userId })
                .select('name company role avatar branch')
                .lean();
            return { ...e, profile };
        }));

        // Filter out those without profiles
        const filtered = enriched.filter(e => e.profile);

        res.json({ leaderboard: filtered });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leaderboard.' });
    }
});

module.exports = router;
