const mongoose = require('mongoose');

const jobOpeningSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, required: true },
    experience: { type: String, required: true },
    postedBy: { 
        name: { type: String, required: true },
        role: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } 
    },
    link: { type: String, required: true },
    description: { type: String, required: true },
    tags: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JobOpening', jobOpeningSchema);
