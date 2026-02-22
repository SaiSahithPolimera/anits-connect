const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    text: {
        type: String,
        required: true
    },
    attachments: [{
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String
    }],
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// For efficient conversation queries
directMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

const DirectMessage = mongoose.model('DirectMessage', directMessageSchema);

module.exports = DirectMessage;
