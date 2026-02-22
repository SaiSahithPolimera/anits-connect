const express = require('express');
const Profile = require('../models/Profile');
const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');
const Notification = require('../models/Notification');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/match/suggestions — smart mentor suggestions for students
router.get('/suggestions', authenticate, requireRole('student'), async (req, res) => {
    try {
        const studentProfile = await Profile.findOne({ userId: req.user._id });
        if (!studentProfile) {
            return res.status(404).json({ error: 'Please complete your profile first.' });
        }

        // Find alumni who are available for mentoring
        const alumni = await User.find({ role: 'alumni', isBlocked: false }).select('_id');
        const alumniIds = alumni.map(a => a._id);

        const alumniProfiles = await Profile.find({
            userId: { $in: alumniIds },
            isAvailableForMentoring: true
        }).lean();

        // Score each alumni based on matching criteria
        const scored = alumniProfiles.map(ap => {
            let score = 0;

            // Branch match
            if (ap.branch && ap.branch === studentProfile.branch) score += 30;

            // Skill overlap
            if (studentProfile.skills && ap.skills) {
                const overlap = studentProfile.skills.filter(s =>
                    ap.skills.some(as => as.toLowerCase() === s.toLowerCase())
                );
                score += overlap.length * 15;
            }

            // Target company match
            if (studentProfile.targetCompanies && ap.company) {
                const companyMatch = studentProfile.targetCompanies.some(tc =>
                    tc.toLowerCase() === ap.company.toLowerCase()
                );
                if (companyMatch) score += 25;
            }

            // Career interest match with mentor topics
            if (studentProfile.careerInterests && ap.mentorTopics) {
                const topicOverlap = studentProfile.careerInterests.filter(ci =>
                    ap.mentorTopics.some(mt => mt.toLowerCase().includes(ci.toLowerCase()))
                );
                score += topicOverlap.length * 10;
            }

            return { profile: ap, score };
        });

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);

        // Return top 20
        const suggestions = scored.slice(0, 20).map(s => ({
            ...s.profile,
            matchScore: s.score
        }));

        res.json({ suggestions });
    } catch (error) {
        console.error('Match suggestions error:', error);
        res.status(500).json({ error: 'Failed to get suggestions.' });
    }
});

// GET /api/match/alumni — search/filter alumni
router.get('/alumni', authenticate, async (req, res) => {
    try {
        const { company, role, branch, skills, available, search, page = 1, limit = 20 } = req.query;

        const alumni = await User.find({ role: 'alumni', isBlocked: false }).select('_id');
        const alumniIds = alumni.map(a => a._id);

        const filter = { userId: { $in: alumniIds } };

        if (available === 'true') filter.isAvailableForMentoring = true;
        if (branch) filter.branch = branch;
        if (company) filter.company = { $regex: company, $options: 'i' };
        if (role) filter.role = { $regex: role, $options: 'i' };
        if (skills) {
            const skillArray = skills.split(',').map(s => s.trim());
            filter.skills = { $in: skillArray };
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { role: { $regex: search, $options: 'i' } },
                { skills: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Profile.countDocuments(filter);
        const profiles = await Profile.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        res.json({
            alumni: profiles,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to search alumni.' });
    }
});

// POST /api/match/mentorship/request — send mentorship request
router.post('/mentorship/request', authenticate, requireRole('student'), async (req, res) => {
    try {
        const { alumniId, message } = req.body;

        if (!alumniId) {
            return res.status(400).json({ error: 'Alumni ID is required.' });
        }

        // Check if alumni exists
        const alumniUser = await User.findOne({ _id: alumniId, role: 'alumni' });
        if (!alumniUser) {
            return res.status(404).json({ error: 'Alumni not found.' });
        }

        // Check for existing pending request
        const existing = await MentorshipRequest.findOne({
            studentId: req.user._id,
            alumniId,
            status: 'pending'
        });
        if (existing) {
            return res.status(400).json({ error: 'You already have a pending request to this alumni.' });
        }

        const request = new MentorshipRequest({
            studentId: req.user._id,
            alumniId,
            message: message || ''
        });
        await request.save();

        // Send notification to alumni
        const studentProfile = await Profile.findOne({ userId: req.user._id });
        await new Notification({
            userId: alumniId,
            type: 'mentorship_request',
            title: 'New Mentorship Request',
            message: `${studentProfile?.name || 'A student'} has sent you a mentorship request.`,
            data: { requestId: request._id, studentId: req.user._id }
        }).save();

        res.status(201).json({ message: 'Mentorship request sent.', request });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send request.', details: error.message });
    }
});

// GET /api/match/mentorship/requests — list mentorship requests
router.get('/mentorship/requests', authenticate, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};

        if (req.user.role === 'student') {
            filter.studentId = req.user._id;
        } else if (req.user.role === 'alumni') {
            filter.alumniId = req.user._id;
        }

        if (status) filter.status = status;

        const requests = await MentorshipRequest.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        // Enrich with profile data
        const enriched = await Promise.all(requests.map(async (r) => {
            const studentProfile = await Profile.findOne({ userId: r.studentId }).lean();
            const alumniProfile = await Profile.findOne({ userId: r.alumniId }).lean();
            return {
                ...r,
                studentProfile,
                alumniProfile
            };
        }));

        res.json({ requests: enriched });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch requests.' });
    }
});

// PUT /api/match/mentorship/requests/:id — accept/reject mentorship request
router.put('/mentorship/requests/:id', authenticate, requireRole('alumni'), async (req, res) => {
    try {
        const { status, responseMessage } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be "accepted" or "rejected".' });
        }

        const request = await MentorshipRequest.findOne({
            _id: req.params.id,
            alumniId: req.user._id,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found or already handled.' });
        }

        request.status = status;
        request.responseMessage = responseMessage || '';
        request.respondedAt = new Date();
        await request.save();

        // Notify student
        const alumniProfile = await Profile.findOne({ userId: req.user._id });
        await new Notification({
            userId: request.studentId,
            type: status === 'accepted' ? 'mentorship_accepted' : 'mentorship_rejected',
            title: `Mentorship Request ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
            message: `${alumniProfile?.name || 'An alumni'} has ${status} your mentorship request.`,
            data: { requestId: request._id, alumniId: req.user._id }
        }).save();

        res.json({ message: `Request ${status}.`, request });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update request.' });
    }
});

module.exports = router;
