const express = require('express');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications — list notifications
router.get('/', authenticate, async (req, res) => {
    try {
        const { unread, page = 1, limit = 30 } = req.query;
        const filter = { userId: req.user._id };
        if (unread === 'true') filter.isRead = false;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Notification.countDocuments(filter);
        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const unreadCount = await Notification.countDocuments({
            userId: req.user._id,
            isRead: false
        });

        res.json({
            notifications,
            unreadCount,
            pagination: { page: parseInt(page), limit: parseInt(limit), total }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
});

// PUT /api/notifications/:id/read — mark as read
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isRead: true }
        );
        res.json({ message: 'Notification marked as read.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification.' });
    }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', authenticate, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notifications.' });
    }
});

module.exports = router;
