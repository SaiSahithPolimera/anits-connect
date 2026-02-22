const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    alumniId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    scheduledAt: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // in minutes
        default: 30
    },
    status: {
        type: String,
        enum: ['requested', 'accepted', 'rescheduled', 'declined', 'completed', 'cancelled'],
        default: 'requested',
        index: true
    },
    meetingLink: {
        type: String,
        default: ''
    },
    rescheduleNote: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

interviewSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;
