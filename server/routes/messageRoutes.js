const express = require('express');
const DirectMessage = require('../models/DirectMessage');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/conversations — list all conversations
router.get('/conversations', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all unique users this person has exchanged messages with
        const sent = await DirectMessage.distinct('receiverId', { senderId: userId });
        const received = await DirectMessage.distinct('senderId', { receiverId: userId });

        const contactIds = [...new Set([...sent.map(String), ...received.map(String)])];

        // For each contact, get the last message and unread count
        const conversations = await Promise.all(contactIds.map(async (contactId) => {
            const lastMessage = await DirectMessage.findOne({
                $or: [
                    { senderId: userId, receiverId: contactId },
                    { senderId: contactId, receiverId: userId }
                ]
            }).sort({ createdAt: -1 }).lean();

            const unreadCount = await DirectMessage.countDocuments({
                senderId: contactId,
                receiverId: userId,
                isRead: false
            });

            const contactProfile = await Profile.findOne({ userId: contactId })
                .select('name avatar company role branch')
                .lean();

            return {
                contactId,
                contactProfile,
                lastMessage,
                unreadCount
            };
        }));

        // Sort by most recent message
        conversations.sort((a, b) =>
            new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0)
        );

        res.json({ conversations });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversations.' });
    }
});

// GET /api/messages/:userId — get message history with a user
router.get('/:userId', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const messages = await DirectMessage.find({
            $or: [
                { senderId: req.user._id, receiverId: req.params.userId },
                { senderId: req.params.userId, receiverId: req.user._id }
            ]
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Mark messages as read
        await DirectMessage.updateMany(
            {
                senderId: req.params.userId,
                receiverId: req.user._id,
                isRead: false
            },
            { $set: { isRead: true, readAt: new Date() } }
        );

        const contactProfile = await Profile.findOne({ userId: req.params.userId })
            .select('name avatar company role')
            .lean();

        res.json({
            messages: messages.reverse(), // Chronological order
            contactProfile
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

// POST /api/messages — send a direct message
router.post('/', authenticate, async (req, res) => {
    try {
        const { receiverId, text } = req.body;

        if (!receiverId || !text) {
            return res.status(400).json({ error: 'Receiver ID and text are required.' });
        }

        const message = new DirectMessage({
            senderId: req.user._id,
            receiverId,
            text
        });
        await message.save();

        // Create notification
        const senderProfile = await Profile.findOne({ userId: req.user._id });
        await new Notification({
            userId: receiverId,
            type: 'new_message',
            title: 'New Message',
            message: `${senderProfile?.name || 'Someone'}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
            data: { senderId: req.user._id.toString(), messageId: message._id }
        }).save();

        res.status(201).json({ message: message });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

module.exports = router;
