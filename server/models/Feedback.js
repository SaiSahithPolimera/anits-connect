const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    interviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interview',
        required: true,
        index: true
    },
    givenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Rating categories (1-5 scale)
    technical: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    communication: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    confidence: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    problemSolving: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    overallRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    notes: {
        type: String,
        default: '',
        maxlength: 2000
    },
    strengths: [{
        type: String,
        trim: true
    }],
    improvements: [{
        type: String,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
