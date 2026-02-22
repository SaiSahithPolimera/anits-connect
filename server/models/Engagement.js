const mongoose = require('mongoose');

const engagementSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },

    // Alumni metrics
    contributionScore: {
        type: Number,
        default: 0
    },
    mockInterviewsConducted: {
        type: Number,
        default: 0
    },
    mentorshipRequestsAccepted: {
        type: Number,
        default: 0
    },
    responseRate: {
        type: Number, // percentage
        default: 100
    },
    badges: [{
        name: String,
        earnedAt: { type: Date, default: Date.now },
        icon: String
    }],

    // Student metrics
    interviewsCompleted: {
        type: Number,
        default: 0
    },
    queriesAsked: {
        type: Number,
        default: 0
    },
    messagesExchanged: {
        type: Number,
        default: 0
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

engagementSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const Engagement = mongoose.model('Engagement', engagementSchema);

module.exports = Engagement;
