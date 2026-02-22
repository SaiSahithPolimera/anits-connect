const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['mentorship_request', 'mentorship_accepted', 'mentorship_rejected',
            'interview_request', 'interview_accepted', 'interview_declined',
            'interview_rescheduled', 'interview_reminder',
            'new_message', 'feedback_received', 'badge_earned', 'system'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed, // Additional data (link IDs, etc.)
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
