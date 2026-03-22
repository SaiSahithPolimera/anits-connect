const express = require('express');
const Profile = require('../models/Profile');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure upload directory exists (kept for legacy code compatibility, but no longer used for resumes)
const uploadDir = path.join(__dirname, '../../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Modify multer storage to seamlessly encode the buffer into memory
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

// GET /api/profiles/me — get own profile
router.get('/me', authenticate, async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user._id });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found.' });
        }
        res.json({ profile });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
});

// PUT /api/profiles/me — update own profile
router.put('/me', authenticate, async (req, res) => {
    try {
        const allowedFields = [
            'name', 'avatar', 'phone', 'bio', 'branch', 'year', 'cgpa',
            'skills', 'targetCompanies', 'careerInterests',
            'company', 'role', 'department', 'graduationYear',
            'placementExperience',
            'isAvailableForMentoring', 'mentorTopics'
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const profile = await Profile.findOneAndUpdate(
            { userId: req.user._id },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found.' });
        }

        res.json({ message: 'Profile updated.', profile });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile.', details: error.message });
    }
});

// GET /api/profiles/:id — view another user's profile
router.get('/:id', authenticate, async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.params.id });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found.' });
        }

        const user = await User.findById(req.params.id).select('email role createdAt');

        res.json({ profile, user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
});

// GET /api/profiles — list/search profiles with filters
router.get('/', authenticate, async (req, res) => {
    try {
        const { role, branch, company, skills, search, page = 1, limit = 20 } = req.query;

        // Build user filter for role
        let userFilter = {};
        if (role) {
            userFilter.role = role;
        }

        // Get user IDs matching the role
        let userIds = null;
        if (role) {
            const users = await User.find(userFilter).select('_id');
            userIds = users.map(u => u._id);
        }

        // Build profile filter
        const profileFilter = {};
        if (userIds) {
            profileFilter.userId = { $in: userIds };
        }
        if (branch) {
            profileFilter.branch = branch;
        }
        if (company) {
            profileFilter.company = { $regex: company, $options: 'i' };
        }
        if (skills) {
            const skillArray = skills.split(',').map(s => s.trim());
            profileFilter.skills = { $in: skillArray };
        }
        if (search) {
            profileFilter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { role: { $regex: search, $options: 'i' } },
                { skills: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Profile.countDocuments(profileFilter);
        
        // Use .select('-resumeUrl') so we don't send 40MB of base64 resumes to the client for every list query!
        const profiles = await Profile.find(profileFilter)
            .select('-resumeUrl')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Attach user role info
        const profileUserIds = profiles.map(p => p.userId);
        const users = await User.find({ _id: { $in: profileUserIds } }).select('_id role email').lean();
        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u; });

        const enriched = profiles.map(p => ({
            ...p,
            userRole: userMap[p.userId.toString()]?.role,
            userEmail: userMap[p.userId.toString()]?.email
        }));

        res.json({
            profiles: enriched,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Profile search error:', error);
        res.status(500).json({ error: 'Failed to fetch profiles.' });
    }
});

// POST /api/profiles/resume — upload or replace resume
router.post('/resume', authenticate, (req, res, next) => {
    upload.single('resume')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a PDF file.' });
        }

        const profile = await Profile.findOne({ userId: req.user._id });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found.' });
        }

        // IMPORTANT: If they previously had a physical file saved, we clean it up from disk!
        if (profile.resumeUrl && profile.resumeUrl.startsWith('/uploads/resumes/')) {
            const oldFilename = path.basename(profile.resumeUrl);
            const oldPath = path.join(uploadDir, oldFilename);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // Convert the file buffer to a Base64 string directly
        const base64Data = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;
        
        profile.resumeUrl = dataUrl;
        profile.resumeOriginalName = req.file.originalname;
        await profile.save();

        res.json({ 
            message: 'Resume uploaded successfully to MongoDB.', 
            resumeUrl: dataUrl,
            resumeOriginalName: req.file.originalname
        });
    } catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ error: 'Failed to upload resume.' });
    }
});

// DELETE /api/profiles/resume — remove the resume
router.delete('/resume', authenticate, async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user._id });
        if (!profile) return res.status(404).json({ error: 'Profile not found.' });

        // Clean up physical file if it was from the legacy system
        if (profile.resumeUrl && profile.resumeUrl.startsWith('/uploads/resumes/')) {
            const oldFilename = path.basename(profile.resumeUrl);
            const oldPath = path.join(uploadDir, oldFilename);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }
        
        profile.resumeUrl = '';
        profile.resumeOriginalName = '';
        await profile.save();

        res.json({ message: 'Resume deleted successfully.' });
    } catch (error) {
        console.error('Resume delete error:', error);
        res.status(500).json({ error: 'Failed to delete resume.' });
    }
});

module.exports = router;
