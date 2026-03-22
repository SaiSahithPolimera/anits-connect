const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Profile = require('../models/Profile');
const Engagement = require('../models/Engagement');
const DirectMessage = require('../models/DirectMessage');
const Interview = require('../models/Interview');
const connectDB = require('../db');



const seedData = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        // Clear all data
        await User.deleteMany({});
        await Profile.deleteMany({});
        await Engagement.deleteMany({});
        await DirectMessage.deleteMany({});
        await Interview.deleteMany({});
        console.log('Cleared existing data');

        // ── Admin ─────────────────────────────────────────────
        const admin = new User({ email: 'admin@anits.edu.in', password: 'admin123', role: 'admin', isVerified: true });
        await admin.save();
        await new Profile({ userId: admin._id, name: 'Platform Admin' }).save();
        console.log('✓ Admin created');

        // ── Seniors (Alumni) ──────────────────────────────────
        const seniors = [
            {
                email: 'kavya.nair@gmail.com', name: 'Kavya Nair',
                branch: 'CSE', company: 'Amazon', role: 'SDE-1', graduationYear: 2023,
                skills: ['Python', 'System Design', 'AWS', 'Data Structures'],
                bio: 'Cracked Amazon SDE-1 in 2023. Specialized in distributed systems and cloud architecture. Happy to help juniors prepare for FAANG interviews.',
                placementExperience: 'Amazon SDE: 2 coding rounds (LeetCode medium/hard) + system design + behavioral round on Leadership Principles. Start prep 6 months early.',
                mentorTopics: ['Amazon Prep', 'DSA', 'System Design', 'LeetCode Strategy'],
                avatar: 'https://ui-avatars.com/api/?name=Kavya+Nair&background=6366f1&color=fff&size=200'
            },
            {
                email: 'ravi.krishna@gmail.com', name: 'Ravi Krishna',
                branch: 'CSE', company: 'Microsoft', role: 'Software Engineer', graduationYear: 2023,
                skills: ['C#', 'Azure', 'Algorithms', 'System Design'],
                bio: 'Working at Microsoft on Azure cloud services. Passionate about algorithms and competitive programming. Let me guide you through the interview process.',
                placementExperience: 'Microsoft: Online coding (3 problems, 90 min) + 3 technical interviews testing DSA depth. Focus on trees, graphs, and DP.',
                mentorTopics: ['Microsoft Prep', 'Competitive Programming', 'Cloud Computing'],
                avatar: 'https://ui-avatars.com/api/?name=Ravi+Krishna&background=8b5cf6&color=fff&size=200'
            },
            {
                email: 'rahul.kumar@gmail.com', name: 'Rahul Kumar',
                branch: 'CSE', company: 'TCS', role: 'Software Engineer', graduationYear: 2022,
                skills: ['Java', 'Spring Boot', 'SQL', 'AWS'],
                bio: 'TCS Digital hire with 2+ years experience. Mentored 20+ juniors in campus placement preparation. Expert in Java ecosystem.',
                placementExperience: 'TCS NQT: Aptitude + Programming logic + Coding. Focus on Java fundamentals and data structures. Digital interview is tougher.',
                mentorTopics: ['TCS Preparation', 'Java Development', 'Campus Placement Tips'],
                avatar: 'https://ui-avatars.com/api/?name=Rahul+Kumar&background=3b82f6&color=fff&size=200'
            },
            {
                email: 'priya.sharma@gmail.com', name: 'Priya Sharma',
                branch: 'CSE', company: 'Infosys', role: 'Systems Engineer', graduationYear: 2023,
                skills: ['Python', 'Django', 'React', 'MongoDB'],
                bio: 'Full stack developer at Infosys. InfyTQ certified. Love building web applications and helping students navigate their first job.',
                placementExperience: 'Infosys InfyTQ certification is key — good score guarantees interview. Focus on Python and web development fundamentals.',
                mentorTopics: ['Infosys Prep', 'Web Development', 'Full Stack', 'Python'],
                avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=ec4899&color=fff&size=200'
            },
            {
                email: 'arjun.das@gmail.com', name: 'Arjun Das',
                branch: 'CSE', company: 'Deloitte', role: 'Analyst', graduationYear: 2023,
                skills: ['SQL', 'Python', 'Tableau', 'Data Analysis'],
                bio: 'Data analyst at Deloitte USI. Transitioned from pure coding to analytics. Can help with both tech and consulting career paths.',
                placementExperience: 'Deloitte: Aptitude + technical + case study interview. Communication skills and analytical thinking matter more than pure coding.',
                mentorTopics: ['Deloitte Prep', 'Data Analytics', 'Consulting Careers'],
                avatar: 'https://ui-avatars.com/api/?name=Arjun+Das&background=f59e0b&color=fff&size=200'
            },
            {
                email: 'sneha.patel@gmail.com', name: 'Sneha Patel',
                branch: 'IT', company: 'Cognizant', role: 'Programmer Analyst', graduationYear: 2023,
                skills: ['Java', 'React', 'Node.js', 'MySQL'],
                bio: 'GenC Next hire at Cognizant. Working on enterprise web applications. I enjoy pair programming sessions and mock interviews.',
                placementExperience: 'Cognizant GenC Next: Coding + Automata sections are crucial. Java and SQL are heavily tested. Practice on their portal.',
                mentorTopics: ['Cognizant Prep', 'Backend Development', 'Enterprise Software'],
                avatar: 'https://ui-avatars.com/api/?name=Sneha+Patel&background=10b981&color=fff&size=200'
            }
        ];

        const seniorUsers = [];
        for (const s of seniors) {
            const user = new User({ email: s.email, password: 'password123', role: 'alumni', isVerified: true });
            await user.save();
            await new Profile({
                userId: user._id, name: s.name, branch: s.branch, company: s.company,
                role: s.role, graduationYear: s.graduationYear, skills: s.skills,
                bio: s.bio, placementExperience: s.placementExperience,
                mentorTopics: s.mentorTopics, avatar: s.avatar,
                isAvailableForMentoring: true
            }).save();
            await new Engagement({
                userId: user._id,
                contributionScore: Math.floor(Math.random() * 80) + 20,
                mockInterviewsConducted: Math.floor(Math.random() * 8) + 1,
                mentorshipRequestsAccepted: Math.floor(Math.random() * 5) + 1
            }).save();
            seniorUsers.push(user);
        }
        console.log(`✓ ${seniors.length} seniors created`);

        // ── Juniors (Students) ────────────────────────────────
        const juniors = [
            {
                email: 'student1@anits.edu.in', name: 'Sai Teja',
                branch: 'CSE', year: 4, cgpa: 8.5,
                skills: ['Python', 'React', 'SQL'],
                targetCompanies: ['TCS', 'Infosys', 'Amazon'],
                careerInterests: ['Web Development', 'Data Science']
            },
            {
                email: 'student2@anits.edu.in', name: 'Lakshmi Prasanna',
                branch: 'CSE', year: 4, cgpa: 9.0,
                skills: ['Java', 'Spring Boot', 'Docker'],
                targetCompanies: ['Microsoft', 'Amazon', 'Google'],
                careerInterests: ['Backend Development', 'Cloud Computing']
            },
            {
                email: 'student3@anits.edu.in', name: 'Naveen Kumar',
                branch: 'IT', year: 3, cgpa: 7.8,
                skills: ['JavaScript', 'Node.js', 'MongoDB'],
                targetCompanies: ['Cognizant', 'Infosys', 'Wipro'],
                careerInterests: ['Full Stack Development']
            },
            {
                email: 'student4@anits.edu.in', name: 'Divya Sri',
                branch: 'CSE', year: 4, cgpa: 8.2,
                skills: ['Python', 'Data Structures', 'Machine Learning'],
                targetCompanies: ['Deloitte', 'TCS', 'Amazon'],
                careerInterests: ['Data Analytics', 'AI/ML']
            }
        ];

        const juniorUsers = [];
        for (const j of juniors) {
            const user = new User({ email: j.email, password: 'password123', role: 'student', isVerified: true });
            await user.save();
            await new Profile({
                userId: user._id, name: j.name, branch: j.branch, year: j.year,
                cgpa: j.cgpa, skills: j.skills, targetCompanies: j.targetCompanies,
                careerInterests: j.careerInterests
            }).save();
            await new Engagement({ userId: user._id }).save();
            juniorUsers.push(user);
        }
        console.log(`✓ ${juniors.length} juniors created`);

        // ── Sample Messages (student1 ↔ Kavya, student1 ↔ Rahul) ──
        const msgs = [
            { senderId: juniorUsers[0]._id, receiverId: seniorUsers[0]._id, text: 'Hi Kavya! I\'m preparing for Amazon SDE interviews. Any tips?' },
            { senderId: seniorUsers[0]._id, receiverId: juniorUsers[0]._id, text: 'Hey Sai! Start with LeetCode medium problems on arrays and strings. Then move to trees and graphs. Consistency is key — solve 2-3 problems daily.' },
            { senderId: juniorUsers[0]._id, receiverId: seniorUsers[0]._id, text: 'Thanks! How important is system design for SDE-1?' },
            { senderId: seniorUsers[0]._id, receiverId: juniorUsers[0]._id, text: 'For SDE-1, they test basic system design — know how to design a URL shortener, chat app, etc. I can do a mock interview with you if you\'d like!' },
            { senderId: juniorUsers[0]._id, receiverId: seniorUsers[2]._id, text: 'Hi Rahul sir, could you guide me on TCS NQT preparation?' },
            { senderId: seniorUsers[2]._id, receiverId: juniorUsers[0]._id, text: 'Sure Sai! Focus on aptitude first, then move to coding. TCS NQT has specific patterns — I\'ll share some resources.' },
        ];
        for (let i = 0; i < msgs.length; i++) {
            await new DirectMessage({ ...msgs[i], createdAt: new Date(Date.now() - (msgs.length - i) * 60000) }).save();
        }
        console.log('✓ Sample messages created');

        // ── Sample Interviews ────────────────────────────────
        // Note: meetingLink will be auto-generated via Google Calendar API
        // when interviews are created through the app. Seed data skips this.
        const interview1 = new Interview({
            studentId: juniorUsers[1]._id, alumniId: seniorUsers[1]._id,
            topic: 'DSA Interview Practice',
            description: 'Need help with graph algorithms and dynamic programming for Microsoft interviews.',
            scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            duration: 45,
            status: 'accepted'
        });
        await interview1.save();

        const interview2 = new Interview({
            studentId: juniorUsers[0]._id, alumniId: seniorUsers[0]._id,
            topic: 'Amazon System Design Round',
            description: 'Want to practice system design questions that Amazon typically asks.',
            scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            duration: 60,
            status: 'requested'
        });
        await interview2.save();
        console.log('✓ Sample interviews created');

        // ── Summary ──────────────────────────────────────────
        console.log('\n══════════════════════════════════════');
        console.log('  ✅ SEED COMPLETE');
        console.log('══════════════════════════════════════');
        console.log(`  Total: ${1 + seniors.length + juniors.length} users`);
        console.log(`  Admin:   admin@anits.edu.in / admin123`);
        console.log(`  Seniors: kavya.nair@gmail.com / password123`);
        console.log(`  Juniors: student1@anits.edu.in / password123`);

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedData();
