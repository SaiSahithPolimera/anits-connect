const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
        index: true
    },
    text: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        required: true,
        enum: ['user', 'bot']
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index for efficient querying
messageSchema.index({ chatId: 1, timestamp: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
