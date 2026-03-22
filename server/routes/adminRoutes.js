const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs-extra');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Engagement = require('../models/Engagement');
const Interview = require('../models/Interview');
const MentorshipRequest = require('../models/MentorshipRequest');
const DirectMessage = require('../models/DirectMessage');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// File upload config
const upload = multer({
    dest: path.join(__dirname, '../../uploads/'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.csv', '.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed.'));
        }
    }
});

// GET /api/admin/users — list all users
router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { role, search, blocked, page = 1, limit = 50 } = req.query;
        const filter = {};

        if (role) filter.role = role;
        if (blocked === 'true') filter.isBlocked = true;
        if (blocked === 'false') filter.isBlocked = { $ne: true };
        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Enrich with profiles
        const enriched = await Promise.all(users.map(async (u) => {
            const profile = await Profile.findOne({ userId: u._id }).select('name company branch role').lean();
            return { ...u, profile };
        }));

        res.json({
            users: enriched,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// PUT /api/admin/users/:id — approve/block/unblock user
router.put('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { isBlocked, isApproved, role } = req.body;
        const updates = {};

        if (isBlocked !== undefined) updates.isBlocked = isBlocked;
        if (isApproved !== undefined) updates.isApproved = isApproved;
        if (role) updates.role = role;

        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ message: 'User updated.', user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user.' });
    }
});

// DELETE /api/admin/users/:id — delete user
router.delete('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const userId = req.params.id;

        // Don't allow deleting self
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot delete your own account.' });
        }

        await User.findByIdAndDelete(userId);
        await Profile.findOneAndDelete({ userId });
        await Engagement.findOneAndDelete({ userId });

        res.json({ message: 'User deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user.' });
    }
});

// POST /api/admin/placement-data — upload CSV/Excel placement data
router.post('/placement-data', authenticate, requireRole('admin'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const filePath = req.file.path;
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Save to placement data JSON file
        const dataFile = path.join(__dirname, '../../data/raw_placement_data.json');
        let existingData = [];
        if (await fs.pathExists(dataFile)) {
            existingData = await fs.readJson(dataFile);
        }

        const merged = [...existingData, ...data];
        await fs.writeJson(dataFile, merged, { spaces: 2 });

        // Cleanup uploaded file
        await fs.remove(filePath);

        res.json({
            message: `Successfully imported ${data.length} records.`,
            totalRecords: merged.length,
            importedRecords: data.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process file.', details: error.message });
    }
});

// GET /api/admin/analytics — platform analytics
router.get('/analytics', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalAlumni = await User.countDocuments({ role: 'alumni' });
        const blockedUsers = await User.countDocuments({ isBlocked: true });
        const totalInterviews = await Interview.countDocuments();
        const completedInterviews = await Interview.countDocuments({ status: 'completed' });
        const totalMentorships = await MentorshipRequest.countDocuments();
        const acceptedMentorships = await MentorshipRequest.countDocuments({ status: 'accepted' });
        const totalMessages = await DirectMessage.countDocuments();

        // Recent registrations (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentRegistrations = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

        res.json({
            analytics: {
                users: { total: totalUsers, students: totalStudents, alumni: totalAlumni, blocked: blockedUsers, recentRegistrations },
                interviews: { total: totalInterviews, completed: completedInterviews },
                mentorships: { total: totalMentorships, accepted: acceptedMentorships },
                messages: { total: totalMessages }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics.' });
    }
});

module.exports = router;
