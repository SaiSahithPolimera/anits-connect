const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../db');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Engagement = require('../models/Engagement');
const DirectMessage = require('../models/DirectMessage');
const Interview = require('../models/Interview');
const PlacementRecord = require('../models/PlacementRecord');

const seedRealData = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        // Clear mock data
        await User.deleteMany({});
        await Profile.deleteMany({});
        await Engagement.deleteMany({});
        await DirectMessage.deleteMany({});
        await Interview.deleteMany({});
        await PlacementRecord.deleteMany({});
        console.log('Cleared existing data from all collections.');

        // Add Admin
        const admin = new User({ email: 'admin@anits.edu.in', password: 'admin123', role: 'admin', isVerified: true });
        await admin.save();
        await new Profile({ userId: admin._id, name: 'Platform Admin' }).save();
        console.log('✓ Admin created');

        // Add 5 Mock Students for testing
        const students = [
            { email: 'student1@anits.edu.in', name: 'Sai Teja', branch: 'CSE', year: 4 },
            { email: 'student2@anits.edu.in', name: 'Lakshmi Prasanna', branch: 'ECE', year: 3 }
        ];
        for (const s of students) {
            const u = new User({ email: s.email, password: 'password123', role: 'student', isVerified: true });
            await u.save();
            await new Profile({ userId: u._id, name: s.name, branch: s.branch, year: s.year }).save();
            await new Engagement({ userId: u._id }).save();
        }
        console.log('✓ Mock students created for testing');

        // Read JSON
        const dataPath = path.join(__dirname, '../../data/processed_placement_data.json');
        if (!fs.existsSync(dataPath)) {
            throw new Error(`Data file not found at ${dataPath}`);
        }
        const fileContent = fs.readFileSync(dataPath, 'utf-8');
        const placements = JSON.parse(fileContent);

        // Insert into PlacementRecord directly
        await PlacementRecord.insertMany(placements);
        console.log(`✓ Inserted ${placements.length} raw placement records into DB for RAG`);

        // Extract unique alumni (highest package offer if multiple)
        const uniqueAlumni = {};
        for (const p of placements) {
            if (p.type === 'individual' && p.rollNo && p.name && p.company) {
                const pkg = parseFloat(p.package) || 0;
                if (!uniqueAlumni[p.rollNo]) {
                    uniqueAlumni[p.rollNo] = { ...p, pkg };
                } else if (pkg > uniqueAlumni[p.rollNo].pkg) {
                    uniqueAlumni[p.rollNo] = { ...p, pkg };
                }
            }
        }
        
        const alumniList = Object.values(uniqueAlumni);
        console.log(`Found ${alumniList.length} unique alumni... hashing generic password...`);

        // Use pre-hashed password so we don't take ages
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const usersToInsert = [];
        for (const a of alumniList) {
            const email = `${parseInt(a.rollNo, 10) || a.rollNo.toLowerCase()}@anits.edu.in`;
            usersToInsert.push({
                email: email,
                password: hashedPassword,
                role: 'alumni',
                isVerified: true,
                createdAt: new Date()
            });
        }

        console.log('Inserting alumni users...');
        const insertedUsers = await User.insertMany(usersToInsert, { lean: true });

        // Map inserted users back to profiles
        const profilesToInsert = [];
        const engagementsToInsert = [];

        // Build a map of email to _id
        const userMap = {};
        for (const u of insertedUsers) {
            userMap[u.email] = u._id;
        }

        for (const a of alumniList) {
            let email = `${parseInt(a.rollNo, 10) || a.rollNo.toLowerCase()}@anits.edu.in`;
            const userId = userMap[email];
            if (!userId) continue;

            const gradYearMatch = a.year && a.year.match(/-(\d{2})$/);
            const gradYear = gradYearMatch ? 2000 + parseInt(gradYearMatch[1], 10) : 2024;

            let cleanBranch = (a.branch || '').toUpperCase().trim();
            if (cleanBranch === 'CIVIL' || cleanBranch === 'CIV') cleanBranch = 'CIVIL';
            else if (cleanBranch === 'MECH' || cleanBranch === 'MECHANICAL') cleanBranch = 'MECH';
            else if (!['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'CSBS'].includes(cleanBranch)) {
                cleanBranch = '';
            }

            profilesToInsert.push({
                userId: userId,
                name: a.name,
                branch: cleanBranch,
                company: a.company,
                graduationYear: gradYear,
                bio: `I am an alumni of batch ${gradYear}. I placed at ${a.company} with ${a.package} LPA.`,
                isAvailableForMentoring: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            engagementsToInsert.push({
                userId: userId,
                contributionScore: Math.floor(Math.random() * 20),
                mockInterviewsConducted: 0,
                mentorshipRequestsAccepted: 0
            });
        }

        console.log(`Inserting ${profilesToInsert.length} alumni profiles...`);
        const insertedProfilesList = await Profile.insertMany(profilesToInsert, { lean: true });
        await Engagement.insertMany(engagementsToInsert, { lean: true });

        console.log(`✓ Inserted ${insertedProfilesList.length} alumni user accounts + profiles`);
        console.log('\n══════════════════════════════════════');
        console.log('  ✅ REAL DATA SEED COMPLETE');
        console.log('══════════════════════════════════════');
        console.log(`  Admin:    admin@anits.edu.in / admin123`);
        console.log(`  Students: student1@anits.edu.in / password123`);
        console.log(`  Alumni:   [rollNo]@anits.edu.in / password123`);

        process.exit(0);
    } catch(err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

seedRealData();
