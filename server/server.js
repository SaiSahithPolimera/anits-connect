const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./db');
const { initialize, query } = require('./ragEngine');
const { initializeSocket } = require('./socket');

// Import routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const matchRoutes = require('./routes/matchRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const engagementRoutes = require('./routes/engagementRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ragRoutes = require('./routes/ragRoutes');
const jobOpeningRoutes = require('./routes/jobOpeningRoutes');

// Import models (needed for existing chat endpoint)
const Chat = require('./models/Chat');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/match', matchRoutes);
app.use('/api', chatRoutes);           // Legacy chat routes
app.use('/api/messages', messageRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/job-openings', jobOpeningRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Chat endpoint with MongoDB persistence (legacy — kept for backward compatibility)
app.post('/api/chat', async (req, res) => {
    try {
        const { message, chatId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        let currentChatId = chatId;

        if (!currentChatId) {
            const newChat = new Chat({
                title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
                userId: 'default-user'
            });
            await newChat.save();
            currentChatId = newChat._id.toString();
        }

        const userMessage = new Message({
            chatId: currentChatId,
            text: message,
            sender: 'user'
        });
        await userMessage.save();

        const response = await query(message);

        const botMessage = new Message({
            chatId: currentChatId,
            text: response,
            sender: 'bot'
        });
        await botMessage.save();

        await Chat.findByIdAndUpdate(currentChatId, { updatedAt: new Date() });

        res.json({
            response,
            chatId: currentChatId,
            userMessageId: userMessage._id,
            botMessageId: botMessage._id
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// Initialize and start
console.log('Starting server initialization...');

Promise.all([
    connectDB(),
    initialize()
])
    .then(() => {
        console.log('✓ MongoDB connected');
        console.log('✓ RAG Engine initialized');

        // Initialize Socket.io
        initializeSocket(server);
        console.log('✓ Socket.io initialized');

        server.listen(PORT, () => {
            console.log(`✓ Server running on http://localhost:${PORT}`);
            console.log(`✓ Ready to accept requests`);
        });
    })
    .catch(error => {
        console.error('✗ Failed to initialize server:', error);
        process.exit(1);
    });
