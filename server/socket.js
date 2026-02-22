const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const DirectMessage = require('./models/DirectMessage');

let io;

function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: ['http://localhost:5173', 'http://localhost:3000'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            socket.userRole = decoded.role;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId}`);

        // Join personal room
        socket.join(socket.userId);

        // Handle sending messages
        socket.on('sendMessage', async (data) => {
            try {
                const { receiverId, text } = data;

                const message = new DirectMessage({
                    senderId: socket.userId,
                    receiverId,
                    text
                });
                await message.save();

                // Emit to receiver
                io.to(receiverId).emit('receiveMessage', {
                    _id: message._id,
                    senderId: socket.userId,
                    receiverId,
                    text,
                    createdAt: message.createdAt,
                    isRead: false
                });

                // Confirm to sender
                socket.emit('messageSent', {
                    _id: message._id,
                    senderId: socket.userId,
                    receiverId,
                    text,
                    createdAt: message.createdAt
                });
            } catch (error) {
                socket.emit('messageError', { error: 'Failed to send message' });
            }
        });

        // Typing indicator
        socket.on('typing', (data) => {
            io.to(data.receiverId).emit('userTyping', {
                userId: socket.userId,
                isTyping: data.isTyping
            });
        });

        // Mark messages as read
        socket.on('markRead', async (data) => {
            try {
                await DirectMessage.updateMany(
                    { senderId: data.senderId, receiverId: socket.userId, isRead: false },
                    { isRead: true, readAt: new Date() }
                );

                io.to(data.senderId).emit('messagesRead', {
                    readBy: socket.userId
                });
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
        });
    });

    return io;
}

function getIO() {
    return io;
}

module.exports = { initializeSocket, getIO };
