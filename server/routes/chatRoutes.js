const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Get all chats for a user
router.get('/chats', async (req, res) => {
    try {
        const userId = req.query.userId || 'default-user';

        const chats = await Chat.find({ userId })
            .sort({ updatedAt: -1 })
            .lean();

        // Get message count and last message for each chat
        const chatsWithDetails = await Promise.all(
            chats.map(async (chat) => {
                const messageCount = await Message.countDocuments({ chatId: chat._id });
                const lastMessage = await Message.findOne({ chatId: chat._id })
                    .sort({ timestamp: -1 })
                    .lean();

                return {
                    ...chat,
                    messageCount,
                    lastMessage: lastMessage ? lastMessage.text.substring(0, 50) : null
                };
            })
        );

        res.json({ chats: chatsWithDetails });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Failed to fetch chats', details: error.message });
    }
});

// Get a specific chat with all messages
router.get('/chats/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const chat = await Chat.findById(id);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const messages = await Message.find({ chatId: id })
            .sort({ timestamp: 1 })
            .lean();

        res.json({
            chat,
            messages: messages.map(msg => ({
                id: msg._id,
                text: msg.text,
                sender: msg.sender,
                timestamp: msg.timestamp
            }))
        });
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ error: 'Failed to fetch chat', details: error.message });
    }
});

// Create a new chat
router.post('/chats', async (req, res) => {
    try {
        const { title, userId } = req.body;

        const chat = new Chat({
            title: title || 'New Chat',
            userId: userId || 'default-user'
        });

        await chat.save();
        res.status(201).json({ chat });
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ error: 'Failed to create chat', details: error.message });
    }
});

// Add a message to a chat
router.post('/chats/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const { text, sender } = req.body;

        if (!text || !sender) {
            return res.status(400).json({ error: 'Text and sender are required' });
        }

        // Verify chat exists
        const chat = await Chat.findById(id);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const message = new Message({
            chatId: id,
            text,
            sender
        });

        await message.save();

        // Update chat's updatedAt timestamp
        chat.updatedAt = new Date();

        // Update chat title if it's the first user message
        const messageCount = await Message.countDocuments({ chatId: id });
        if (messageCount === 1 && sender === 'user') {
            // Use first 50 characters of first message as title
            chat.title = text.substring(0, 50) + (text.length > 50 ? '...' : '');
        }

        await chat.save();

        res.status(201).json({
            message: {
                id: message._id,
                text: message.text,
                sender: message.sender,
                timestamp: message.timestamp
            }
        });
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ error: 'Failed to add message', details: error.message });
    }
});

// Delete a chat
router.delete('/chats/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const chat = await Chat.findById(id);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Delete all messages associated with this chat
        await Message.deleteMany({ chatId: id });

        // Delete the chat
        await Chat.findByIdAndDelete(id);

        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ error: 'Failed to delete chat', details: error.message });
    }
});

module.exports = router;
