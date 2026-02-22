const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Engagement = require('../models/Engagement');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, role, name, branch, year, company, graduationYear } = req.body;

        // Validate required fields
        if (!email || !password || !role || !name) {
            return res.status(400).json({ error: 'Email, password, role, and name are required.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        // Validate role
        if (!['student', 'alumni'].includes(role)) {
            return res.status(400).json({ error: 'Role must be "student" or "alumni".' });
        }

        // Create user
        const user = new User({ email, password, role });
        await user.save();

        // Create profile
        const profileData = {
            userId: user._id,
            name,
            branch: branch || '',
            year: year || null,
            company: company || '',
            graduationYear: graduationYear || null
        };

        const profile = new Profile(profileData);
        await profile.save();

        // Create engagement record
        const engagement = new Engagement({ userId: user._id });
        await engagement.save();

        // Generate token
        const token = generateToken(user._id, user.role);

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            },
            profile
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed.', details: error.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Check if blocked
        if (user.isBlocked) {
            return res.status(403).json({ error: 'Your account has been blocked. Contact admin.' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Get profile
        const profile = await Profile.findOne({ userId: user._id });

        // Generate token
        const token = generateToken(user._id, user.role);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            },
            profile
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed.', details: error.message });
    }
});

// GET /api/auth/me — get current user info
router.get('/me', authenticate, async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user._id });
        const engagement = await Engagement.findOne({ userId: req.user._id });

        res.json({
            user: {
                id: req.user._id,
                email: req.user.email,
                role: req.user.role,
                isVerified: req.user.isVerified,
                createdAt: req.user.createdAt
            },
            profile,
            engagement
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user data.' });
    }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters.' });
        }

        const user = await User.findById(req.user._id);
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to change password.' });
    }
});

module.exports = router;
