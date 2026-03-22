const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    avatar: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: '',
        maxlength: 500
    },
    resumeUrl: {
        type: String,
        default: ''
    },
    resumeOriginalName: {
        type: String,
        default: ''
    },

    // Student-specific fields
    branch: {
        type: String,
        enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'CSBS', ''],
        default: ''
    },
    year: {
        type: Number, // Current year for students, graduation year for alumni
        default: null
    },
    cgpa: {
        type: Number,
        default: null,
        min: 0,
        max: 10
    },
    skills: [{
        type: String,
        trim: true
    }],
    targetCompanies: [{
        type: String,
        trim: true
    }],
    careerInterests: [{
        type: String,
        trim: true
    }],

    // Alumni-specific fields
    company: {
        type: String,
        default: '',
        trim: true
    },
    role: {
        type: String,
        default: '',
        trim: true
    },
    department: {
        type: String,
        default: '',
        trim: true
    },
    graduationYear: {
        type: Number,
        default: null
    },
    placementExperience: {
        type: String,
        default: '',
        maxlength: 2000
    },


    // Mentor availability (for alumni)
    isAvailableForMentoring: {
        type: Boolean,
        default: true
    },
    mentorTopics: [{
        type: String,
        trim: true
    }],

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

profileSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Index for search/matching
profileSchema.index({ branch: 1, company: 1, skills: 1 });
profileSchema.index({ isAvailableForMentoring: 1 });

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
