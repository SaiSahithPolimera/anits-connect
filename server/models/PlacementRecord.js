const mongoose = require('mongoose');

const placementRecordSchema = new mongoose.Schema({
    // For individual placement records
    rollNo: { type: String, index: true },
    name: { type: String },
    branch: { type: String, index: true },
    company: { type: String, index: true },
    package: { type: String },
    year: { type: String, index: true },

    // For document chunks (summaries, questions, etc.)
    type: {
        type: String,
        enum: ['individual', 'summary', 'questions', 'chunk', 'document'],
        default: 'individual',
        index: true
    },
    chunkTitle: { type: String },  // e.g., "22 Batch Branchwise Summary"
    content: { type: String, required: true },  // searchable text content

    // Source tracking
    sourceFile: { type: String },
    originalText: { type: String },

    // RAG and AI Vectors
    embedding: { type: [Number], default: [] },
    addedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Text index for full-text search fallback
placementRecordSchema.index({ content: 'text', name: 'text', company: 'text' });

module.exports = mongoose.model('PlacementRecord', placementRecordSchema);
