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

// ─── Featured Mentors from Major Companies ─────────────────────────────────
// These are real placements from the PDF data with enhanced profile information
// Only includes roll numbers that exist in the actual placement PDFs
const FEATURED_MENTORS = [
    // Amazon placements (from 2020-24 Placement Data.pdf)
    { rollNo: '320126510165', name: 'Paidi Akileswar', branch: 'CSE', company: 'Amazon SDE', package: '48.00', year: '2020-24', skills: ['Java', 'System Design', 'AWS', 'DSA', 'Distributed Systems'], mentorTopics: ['FAANG Prep', 'System Design', 'DSA Mastery', 'Amazon Culture'], bio: 'SDE at Amazon India. Cracked Amazon with 48 LPA offer. Expertise in distributed systems and microservices. Happy to guide on FAANG preparation strategies.' },
    { rollNo: '320126510069', name: 'Chaitanya Nanda Kumar Bajjangi', branch: 'CSE', company: 'Amazon AWS', package: '26.00', year: '2020-24', skills: ['Cloud Computing', 'AWS', 'Python', 'Terraform', 'DevOps'], mentorTopics: ['Cloud Engineering', 'AWS Certifications', 'DevOps Practices', 'Interview Tips'], bio: 'Cloud Engineer at Amazon AWS. Building scalable cloud infrastructure. Certified AWS Solutions Architect.' },
    { rollNo: '320126510080', name: 'Doddi Likhitha', branch: 'CSE', company: 'Amazon AWS', package: '26.00', year: '2020-24', skills: ['Java', 'AWS Lambda', 'DynamoDB', 'Microservices', 'CI/CD'], mentorTopics: ['Women in Tech', 'Backend Development', 'AWS Services', 'Career Growth'], bio: 'SDE at Amazon AWS working on serverless architectures. Advocate for women in tech. Love mentoring on backend development.' },
    { rollNo: '320126510098', name: 'Manasa Marapakula', branch: 'CSE', company: 'Amazon AWS', package: '26.00', year: '2020-24', skills: ['Python', 'Machine Learning', 'AWS SageMaker', 'Data Pipelines', 'SQL'], mentorTopics: ['ML at Scale', 'Data Engineering', 'Amazon Interview Process', 'Women in STEM'], bio: 'Applied Scientist at Amazon AWS. Building ML models for cloud optimization.' },
    { rollNo: '320126510134', name: 'Gunasri Avala', branch: 'CSE', company: 'Amazon AWS', package: '26.00', year: '2020-24', skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS Amplify'], mentorTopics: ['Frontend at Scale', 'Full Stack Development', 'Amazon Interview', 'Open Source'], bio: 'Frontend Engineer at Amazon AWS Console. Building UI for millions of developers worldwide.' },
    { rollNo: '320126552002', name: 'Harika Bagadhi', branch: 'CSD', company: 'Amazon AWS', package: '26.00', year: '2020-24', skills: ['AI/ML', 'Python', 'Deep Learning', 'Computer Vision', 'AWS'], mentorTopics: ['AI/ML Careers', 'CSD Branch Guidance', 'Amazon AI Roles', 'Deep Learning'], bio: 'ML Engineer at Amazon AWS AI. Working on AI-powered products. First batch CSD graduate to join Amazon.' },
    { rollNo: '320126551028', name: 'Hema Sri Kedarisetty', branch: 'CSM', company: 'Amazon AWS', package: '26.00', year: '2020-24', skills: ['Data Science', 'Python', 'Statistics', 'A/B Testing', 'SQL'], mentorTopics: ['Data Science at Amazon', 'CSM Branch Tips', 'Statistical Modeling', 'Product Analytics'], bio: 'Data Scientist at Amazon AWS. Driving data-driven decisions for cloud products. CSM branch topper.' },
    { rollNo: '320126512010', name: 'Sobhasri Chappa', branch: 'ECE', company: 'Amazon AWS', package: '26.00', year: '2020-24', skills: ['Embedded Systems', 'C++', 'IoT', 'AWS IoT Core', 'Python'], mentorTopics: ['ECE to Software', 'IoT Development', 'Amazon Interview from ECE', 'Embedded Programming'], bio: 'IoT Engineer at Amazon AWS. Working on AWS IoT services. Proved ECE students can ace software roles too!' },
    { rollNo: '320126512096', name: 'Siva Rama Krishna Nollu', branch: 'ECE', company: 'Amazon AWS', package: '26.00', year: '2020-24', skills: ['VLSI', 'Python', 'SystemVerilog', 'Digital Design', 'Automation'], mentorTopics: ['Hardware Design', 'VLSI Careers', 'ECE Opportunities', 'Chip Design'], bio: 'Hardware Engineer at Amazon AWS working on custom silicon. Bridging VLSI and cloud computing.' },
    { rollNo: '320126511082', name: 'Vishali Korubilli', branch: 'IT', company: 'Amazon AWS', package: '26.00', year: '2020-24', skills: ['Java', 'Spring Boot', 'Kafka', 'Microservices', 'AWS'], mentorTopics: ['Backend Engineering', 'IT Branch at Amazon', 'System Design', 'Microservices'], bio: 'Backend Engineer at Amazon AWS. Building high-throughput event-driven systems. IT branch champion!' },
    { rollNo: '320126511084', name: 'Devi Kurmana', branch: 'IT', company: 'Amazon AWS', package: '26.00', year: '2020-24', skills: ['Python', 'Django', 'AWS', 'PostgreSQL', 'Redis'], mentorTopics: ['Python Development', 'IT to Product Companies', 'Web Development', 'DSA for Interviews'], bio: 'SDE at Amazon AWS. Transitioned from IT to a top product company. Passionate about helping others make the same leap.' },

    // Darwinbox (from 2020-24 Placement Data.pdf)
    { rollNo: '320126510083', name: 'Akhil Venkat Gopisetty', branch: 'CSE', company: 'Darwinbox', package: '16.30', year: '2020-24', skills: ['JavaScript', 'React', 'Node.js', 'System Design', 'MongoDB'], mentorTopics: ['SaaS Development', 'Darwinbox Interview', 'Startups', 'Full Stack'], bio: 'SDE at Darwinbox. Working on enterprise SaaS platform. Previously interned at multiple startups.' },

    // Walmart (from 2020-24 Placement Data.pdf)
    { rollNo: '320126510167', name: 'Deepa Priyanka Pentapalli', branch: 'CSE', company: 'Walmart Global Tech', package: '27.00', year: '2020-24', skills: ['Java', 'Spring Boot', 'Kafka', 'React', 'System Design'], mentorTopics: ['Walmart Prep', 'E-commerce Tech', 'System Design', 'High CTC Prep'], bio: 'SDE at Walmart Global Tech. Building e-commerce systems serving 100M+ users. Highest package in 2024 batch (non-Amazon).' },

    // TCS Digital - top performers (from 2020-24 Placement Data.pdf)
    { rollNo: '320126510004', name: 'Sai Sahith Polimera', branch: 'CSE', company: 'TCS Digital', package: '7.70', year: '2020-24', skills: ['React', 'Node.js', 'Python', 'AWS', 'MongoDB'], mentorTopics: ['Full Stack Development', 'TCS Digital Interview', 'Project Building', 'Tech Career'], bio: 'Digital Developer at TCS. Building full-stack enterprise solutions. Active open-source contributor.' },

    // TalentServe (from 2020-24 Placement Data.pdf)
    { rollNo: '320126510031', name: 'Kasireddi Sai Shruthi', branch: 'CSE', company: 'TalentServe', package: '10.50', year: '2020-24', skills: ['Python', 'Django', 'React', 'PostgreSQL', 'Docker'], mentorTopics: ['Web Development', 'TalentServe Interview', 'Startup Experience', 'Backend Dev'], bio: 'Full Stack Developer at TalentServe. Building AI-powered recruitment tools.' },
    { rollNo: '320126511003', name: 'Sahith Raja Arangi', branch: 'IT', company: 'TalentServe', package: '10.50', year: '2020-24', skills: ['Java', 'Spring', 'React', 'MySQL', 'Jenkins'], mentorTopics: ['Enterprise Java', 'IT Branch Success', 'Service-Based to Product'], bio: 'Software Engineer at TalentServe. Specialist in Java enterprise applications.' },

    // Tejas Networks (from 2020-24 Placement Data.pdf)
    { rollNo: '320126510136', name: 'Harshitha Bali', branch: 'CSE', company: 'Tejas Networks Pvt. Ltd', package: '10.00', year: '2020-24', skills: ['C++', 'Networking', 'Linux', 'SDLC', 'Automation'], mentorTopics: ['Networking Industry', 'C++ Development', 'Telecom Careers', 'Systems Programming'], bio: 'Software Developer at Tejas Networks. Working on 5G telecom infrastructure.' },

    // Additional high-package placements from actual PDF data
    { rollNo: '320126510081', name: 'Lalitha Vennela Draksharapu', branch: 'CSE', company: 'TalentServe', package: '10.50', year: '2020-24', skills: ['Python', 'React', 'Node.js', 'MongoDB', 'AWS'], mentorTopics: ['Full Stack Development', 'Women in Tech', 'Startup Culture'], bio: 'Full Stack Developer at TalentServe. Building innovative recruitment solutions.' },
    { rollNo: '320126510150', name: 'Naveen Kumar Karri', branch: 'CSE', company: 'TalentServe', package: '10.50', year: '2020-24', skills: ['Java', 'Spring Boot', 'React', 'Docker', 'CI/CD'], mentorTopics: ['Java Development', 'Backend Engineering', 'DevOps Basics'], bio: 'Software Engineer at TalentServe. Expert in Java backend development.' },
];


// Mentor topics pool by branch/company type
const TOPIC_POOLS = {
    CSE: ['DSA', 'System Design', 'Web Development', 'Competitive Programming', 'Open Source'],
    ECE: ['Embedded Systems', 'VLSI', 'Signal Processing', 'IoT', 'Communication Systems'],
    EEE: ['Power Systems', 'Control Systems', 'Renewable Energy', 'Instrumentation', 'Electrical Design'],
    IT: ['Software Engineering', 'Database Management', 'Cloud Computing', 'Agile/Scrum', 'DevOps'],
    MECH: ['Design Engineering', 'Manufacturing', 'Thermal Engineering', 'Automotive', 'Robotics'],
    CIVIL: ['Structural Design', 'Construction Management', 'Transportation', 'Environmental', 'BIM'],
    CSD: ['AI/ML', 'Deep Learning', 'Data Science', 'Computer Vision', 'NLP'],
    CSM: ['Data Analytics', 'Statistical Modeling', 'Machine Learning', 'Big Data', 'Business Intelligence'],
    CHEM: ['Process Engineering', 'Chemical Plant Design', 'Quality Control', 'Petrochemicals', 'Pharmaceutical'],
    BioTech: ['Biotechnology', 'Genetics', 'Pharmaceuticals', 'Research & Development', 'Bioinformatics'],
    Auto: ['Automotive Design', 'Vehicle Dynamics', 'Engine Systems', 'Electric Vehicles', 'CAD/CAM'],
};

const SKILL_POOLS = {
    CSE: ['Java', 'Python', 'C++', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS'],
    ECE: ['C', 'Embedded C', 'VHDL', 'MATLAB', 'Python', 'Arduino', 'PCB Design', 'Linux'],
    EEE: ['MATLAB', 'Simulink', 'PLC', 'SCADA', 'AutoCAD Electrical', 'Python', 'Power Systems'],
    IT: ['Java', 'Python', 'JavaScript', 'React', 'SQL', 'MongoDB', 'Spring Boot', 'AWS'],
    MECH: ['AutoCAD', 'SolidWorks', 'ANSYS', 'MATLAB', 'Python', 'CNC Programming', '3D Printing'],
    CIVIL: ['STAAD Pro', 'AutoCAD', 'ETABS', 'Primavera', 'MS Project', 'Revit', 'Python'],
    CSD: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'OpenCV', 'AWS'],
    CSM: ['Python', 'R', 'SQL', 'Tableau', 'Power BI', 'Pandas', 'Spark', 'Hadoop'],
    CHEM: ['ASPEN Plus', 'MATLAB', 'AutoCAD', 'ChemCAD', 'Python', 'Quality Management', 'Process Simulation'],
    BioTech: ['Python', 'R', 'Bioinformatics Tools', 'Lab Techniques', 'MATLAB', 'Gene Analysis', 'Cell Culture'],
    Auto: ['CATIA', 'SolidWorks', 'ANSYS', 'MATLAB', 'Python', 'Vehicle Dynamics', 'Simulink'],
};

const seedRealData = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        // Clear all data
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

        // Add Mock Students
        const students = [
            { email: 'student1@anits.edu.in', name: 'Sai Teja', branch: 'CSE', year: 4 },
            { email: 'student2@anits.edu.in', name: 'Lakshmi Prasanna', branch: 'ECE', year: 3 },
            { email: 'student3@anits.edu.in', name: 'Rohith Kumar', branch: 'CSD', year: 3 },
            { email: 'student4@anits.edu.in', name: 'Meghana Reddy', branch: 'CSM', year: 2 },
            { email: 'student5@anits.edu.in', name: 'Arun Prakash', branch: 'IT', year: 4 },
        ];
        for (const s of students) {
            const u = new User({ email: s.email, password: 'password123', role: 'student', isVerified: true });
            await u.save();
            await new Profile({ userId: u._id, name: s.name, branch: s.branch, year: s.year }).save();
            await new Engagement({ userId: u._id }).save();
        }
        console.log(`✓ ${students.length} mock students created`);

        // Read placement JSON
        const dataPath = path.join(__dirname, '../../data/processed_placement_data.json');
        if (!fs.existsSync(dataPath)) throw new Error(`Data file not found at ${dataPath}`);
        const placements = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

        // Use only the placement records from actual PDF data
        const allPlacements = placements;

        // Insert all placement records
        await PlacementRecord.insertMany(allPlacements);
        console.log(`✓ Inserted ${allPlacements.length} placement records from PDF data`);

        // Build unique alumni map (highest package)
        const uniqueAlumni = {};
        for (const p of allPlacements) {
            if (p.type === 'individual' && p.rollNo && p.name && p.company) {
                const pkg = parseFloat(p.package) || 0;
                if (!uniqueAlumni[p.rollNo]) {
                    uniqueAlumni[p.rollNo] = { ...p, pkg };
                } else if (pkg > uniqueAlumni[p.rollNo].pkg) {
                    uniqueAlumni[p.rollNo] = { ...p, pkg };
                }
            }
        }

        // Build featured mentor lookup
        const featuredMap = {};
        for (const fm of FEATURED_MENTORS) {
            featuredMap[fm.rollNo] = fm;
        }

        const alumniList = Object.values(uniqueAlumni);
        console.log(`Found ${alumniList.length} unique alumni...`);

        // Hash password once
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const usersToInsert = [];
        for (const a of alumniList) {
            const email = `${parseInt(a.rollNo, 10) || a.rollNo.toLowerCase()}@anits.edu.in`;
            usersToInsert.push({
                email, password: hashedPassword, role: 'alumni',
                isVerified: true, createdAt: new Date()
            });
        }

        console.log('Inserting alumni users...');
        const insertedUsers = await User.insertMany(usersToInsert, { lean: true });

        const userMap = {};
        for (const u of insertedUsers) userMap[u.email] = u._id;

        const profilesToInsert = [];
        const engagementsToInsert = [];
        let featuredCount = 0;

        for (const a of alumniList) {
            const email = `${parseInt(a.rollNo, 10) || a.rollNo.toLowerCase()}@anits.edu.in`;
            const userId = userMap[email];
            if (!userId) continue;

            const gradYearMatch = a.year && a.year.match(/-(\d{2})$/);
            const gradYear = gradYearMatch ? 2000 + parseInt(gradYearMatch[1], 10) : 2024;

            let cleanBranch = (a.branch || '').toUpperCase().trim();
            
            // Normalize branch names
            if (cleanBranch === 'CIVIL' || cleanBranch === 'CIV') cleanBranch = 'CIVIL';
            else if (cleanBranch === 'MECH' || cleanBranch === 'MECHANICAL') cleanBranch = 'MECH';
            else if (cleanBranch === 'CHEM' || cleanBranch === 'CHE' || cleanBranch === 'CHEMICAL') cleanBranch = 'CHEM';
            else if (cleanBranch === 'BIOTECH' || cleanBranch === 'BIO-TECH' || cleanBranch === 'BT') cleanBranch = 'BioTech';
            else if (cleanBranch === 'AUTO') cleanBranch = 'Auto';

            // Map based on roll number patterns (ANITS roll number scheme)
            // xx510xxx = CSE, xx511xxx = IT, xx512xxx = ECE, xx514xxx = EEE
            // xx520xxx = MECH, xx508xxx = CIVIL, xx502xxx = CHEM
            // xx551xxx = CSM (CSE-DS), xx552xxx = CSD (CSE-AI&ML)
            if (a.rollNo) {
                const rollNo = a.rollNo;
                if (rollNo.includes('552')) cleanBranch = 'CSD';
                else if (rollNo.includes('551')) cleanBranch = 'CSM';
                else if (rollNo.includes('510')) cleanBranch = cleanBranch || 'CSE';
                else if (rollNo.includes('511')) cleanBranch = cleanBranch || 'IT';
                else if (rollNo.includes('512')) cleanBranch = cleanBranch || 'ECE';
                else if (rollNo.includes('514')) cleanBranch = cleanBranch || 'EEE';
                else if (rollNo.includes('520')) cleanBranch = cleanBranch || 'MECH';
                else if (rollNo.includes('508')) cleanBranch = cleanBranch || 'CIVIL';
                else if (rollNo.includes('502')) cleanBranch = cleanBranch || 'CHEM';
            }

            if (!['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'CSD', 'CSM', 'CHEM', 'BioTech', 'Auto'].includes(cleanBranch)) {
                cleanBranch = '';
            }

            // Check if this alumni is a featured mentor
            const featured = featuredMap[a.rollNo];
            const isFeatured = !!featured;

            if (isFeatured) {
                cleanBranch = featured.branch; // use exact branch from featured data
                featuredCount++;
            }

            const branchSkills = SKILL_POOLS[cleanBranch] || SKILL_POOLS['CSE'];
            const branchTopics = TOPIC_POOLS[cleanBranch] || TOPIC_POOLS['CSE'];

            // Pick random skills/topics for non-featured alumni with pkg >= 5
            const pkg = parseFloat(a.package) || 0;
            const isHighPkg = pkg >= 5;

            const profileData = {
                userId,
                name: isFeatured ? featured.name : a.name,
                branch: cleanBranch,
                company: isFeatured ? featured.company : a.company,
                graduationYear: gradYear,
                isAvailableForMentoring: isFeatured || isHighPkg,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            if (isFeatured) {
                profileData.bio = featured.bio;
                profileData.skills = featured.skills;
                profileData.mentorTopics = featured.mentorTopics;
            } else if (isHighPkg) {
                // Give high-package alumni some useful profile data
                const shuffledSkills = [...branchSkills].sort(() => Math.random() - 0.5);
                const shuffledTopics = [...branchTopics].sort(() => Math.random() - 0.5);
                profileData.skills = shuffledSkills.slice(0, 3 + Math.floor(Math.random() * 3));
                profileData.mentorTopics = shuffledTopics.slice(0, 2 + Math.floor(Math.random() * 2));
                profileData.bio = `Alumni of batch ${gradYear}, placed at ${a.company} with ${a.package} LPA. Available for mentoring.`;
            } else {
                profileData.bio = `Alumni of batch ${gradYear}. Placed at ${a.company} with ${a.package} LPA.`;
            }

            profilesToInsert.push(profileData);
            engagementsToInsert.push({
                userId,
                contributionScore: isFeatured ? 50 + Math.floor(Math.random() * 50) : Math.floor(Math.random() * 30),
                mockInterviewsConducted: isFeatured ? Math.floor(Math.random() * 10) : 0,
                mentorshipRequestsAccepted: isFeatured ? Math.floor(Math.random() * 15) : 0
            });
        }

        console.log(`Inserting ${profilesToInsert.length} alumni profiles (${featuredCount} featured mentors)...`);
        await Profile.insertMany(profilesToInsert, { lean: true });
        await Engagement.insertMany(engagementsToInsert, { lean: true });

        console.log(`✓ Inserted ${profilesToInsert.length} alumni profiles`);
        console.log(`  → ${featuredCount} featured mentors with rich profiles`);
        console.log(`  → ${profilesToInsert.filter(p => p.isAvailableForMentoring).length} total mentors available`);
        console.log('\n══════════════════════════════════════');
        console.log('  ✅ REAL DATA SEED COMPLETE');
        console.log('══════════════════════════════════════');
        console.log(`  Admin:    admin@anits.edu.in / admin123`);
        console.log(`  Students: student1-5@anits.edu.in / password123`);
        console.log(`  Alumni:   [rollNo]@anits.edu.in / password123`);
        console.log(`  Featured: ${FEATURED_MENTORS.map(m => m.name).slice(0, 5).join(', ')}...`);

        process.exit(0);
    } catch(err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

seedRealData();
