const express = require('express');
const Interview = require('../models/Interview');
const Feedback = require('../models/Feedback');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const Engagement = require('../models/Engagement');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/interviews — request a mock interview
router.post('/', authenticate, requireRole('student'), async (req, res) => {
    try {
        const { alumniId, topic, description, scheduledAt, duration } = req.body;

        if (!alumniId || !topic || !scheduledAt) {
            return res.status(400).json({ error: 'Alumni ID, topic, and scheduled time are required.' });
        }

        const interview = new Interview({
            studentId: req.user._id,
            alumniId,
            topic,
            description: description || '',
            scheduledAt: new Date(scheduledAt),
            duration: duration || 30
        });
        await interview.save();

        // Notify alumni
        const studentProfile = await Profile.findOne({ userId: req.user._id });
        await new Notification({
            userId: alumniId,
            type: 'interview_request',
            title: 'Mock Interview Request',
            message: `${studentProfile?.name || 'A student'} has requested a mock interview on "${topic}".`,
            data: { interviewId: interview._id }
        }).save();

        res.status(201).json({ message: 'Interview request sent.', interview });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create interview request.', details: error.message });
    }
});

// GET /api/interviews — list interviews for current user
router.get('/', authenticate, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};

        if (req.user.role === 'student') {
            filter.studentId = req.user._id;
        } else if (req.user.role === 'alumni') {
            filter.alumniId = req.user._id;
        }

        if (status) filter.status = status;

        const interviews = await Interview.find(filter)
            .sort({ scheduledAt: -1 })
            .lean();

        // Enrich with profiles
        const enriched = await Promise.all(interviews.map(async (i) => {
            const studentProfile = await Profile.findOne({ userId: i.studentId }).select('name branch year').lean();
            const alumniProfile = await Profile.findOne({ userId: i.alumniId }).select('name company role').lean();
            const feedback = await Feedback.findOne({ interviewId: i._id }).lean();
            return { ...i, studentProfile, alumniProfile, hasFeedback: !!feedback };
        }));

        res.json({ interviews: enriched });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch interviews.' });
    }
});

// PUT /api/interviews/:id — accept/reschedule/decline/complete
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { status, meetingLink, rescheduleNote, scheduledAt } = req.body;
        const validStatuses = ['accepted', 'rescheduled', 'declined', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
        }

        const interview = await Interview.findById(req.params.id);
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found.' });
        }

        // Only involved users can modify
        const isStudent = interview.studentId.toString() === req.user._id.toString();
        const isAlumni = interview.alumniId.toString() === req.user._id.toString();
        if (!isStudent && !isAlumni) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        interview.status = status;
        if (meetingLink) interview.meetingLink = meetingLink;
        if (rescheduleNote) interview.rescheduleNote = rescheduleNote;
        if (scheduledAt) interview.scheduledAt = new Date(scheduledAt);
        await interview.save();

        // Notify the other user
        const notifyUserId = isStudent ? interview.alumniId : interview.studentId;
        const actorProfile = await Profile.findOne({ userId: req.user._id });

        await new Notification({
            userId: notifyUserId,
            type: `interview_${status}`,
            title: `Interview ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `${actorProfile?.name || 'Someone'} has ${status} the mock interview.`,
            data: { interviewId: interview._id }
        }).save();

        // Update engagement on completion
        if (status === 'completed') {
            await Engagement.findOneAndUpdate(
                { userId: interview.alumniId },
                { $inc: { mockInterviewsConducted: 1, contributionScore: 10 } }
            );
            await Engagement.findOneAndUpdate(
                { userId: interview.studentId },
                { $inc: { interviewsCompleted: 1 } }
            );
        }

        res.json({ message: `Interview ${status}.`, interview });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update interview.' });
    }
});

// POST /api/interviews/:id/feedback — submit feedback
router.post('/:id/feedback', authenticate, async (req, res) => {
    try {
        const { technical, communication, confidence, problemSolving, overallRating, notes, strengths, improvements } = req.body;

        const interview = await Interview.findById(req.params.id);
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found.' });
        }

        // Check if feedback already exists
        const existing = await Feedback.findOne({ interviewId: interview._id });
        if (existing) {
            return res.status(400).json({ error: 'Feedback already submitted for this interview.' });
        }

        const feedback = new Feedback({
            interviewId: interview._id,
            givenBy: req.user._id,
            technical,
            communication,
            confidence,
            problemSolving,
            overallRating,
            notes: notes || '',
            strengths: strengths || [],
            improvements: improvements || []
        });
        await feedback.save();

        // Mark interview as completed if not already
        if (interview.status !== 'completed') {
            interview.status = 'completed';
            await interview.save();
        }

        // Notify student about feedback
        const alumniProfile = await Profile.findOne({ userId: req.user._id });
        await new Notification({
            userId: interview.studentId,
            type: 'feedback_received',
            title: 'Interview Feedback Received',
            message: `${alumniProfile?.name || 'Your interviewer'} has submitted feedback for your mock interview.`,
            data: { interviewId: interview._id, feedbackId: feedback._id }
        }).save();

        res.status(201).json({ message: 'Feedback submitted.', feedback });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit feedback.', details: error.message });
    }
});

// GET /api/interviews/:id/feedback — view feedback
router.get('/:id/feedback', authenticate, async (req, res) => {
    try {
        const feedback = await Feedback.findOne({ interviewId: req.params.id });
        if (!feedback) {
            return res.status(404).json({ error: 'No feedback found for this interview.' });
        }

        const givenByProfile = await Profile.findOne({ userId: feedback.givenBy }).select('name').lean();

        res.json({ feedback, givenBy: givenByProfile });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch feedback.' });
    }
});

module.exports = router;
