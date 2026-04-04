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

// ─── Dynamic Featured Mentors Generation ─────────────────────────────────
// This function will automatically select top placements as featured mentors
// Instead of hardcoded data, we'll use actual placement records from JSON

function generateFeaturedMentors(placementRecords) {
    // Filter to individual placements only
    const individuals = placementRecords.filter(r => r.type === 'individual' && r.rollNo && r.name && r.company && r.package);
    
    // Sort by package (highest first)
    const sorted = individuals.sort((a, b) => {
        const pkgA = parseFloat(a.package) || 0;
        const pkgB = parseFloat(b.package) || 0;
        return pkgB - pkgA;
    });
    
    // Take top placements across different companies and branches for diversity
    const featured = [];
    const seenCompanies = new Set();
    const seenBranches = new Set();
    const PRIORITY_COMPANIES = ['Amazon', 'Walmart', 'Darwinbox', 'TalentServe', 'Tejas'];
    const MIN_FEATURED_PACKAGE = 7.0; // Minimum package for featured mentors
    
    // First, add top packages from priority companies
    for (const record of sorted) {
        const pkg = parseFloat(record.package) || 0;
        if (pkg < MIN_FEATURED_PACKAGE) break;
        
        const companyMatch = PRIORITY_COMPANIES.some(pc => (record.company || '').includes(pc));
        if (companyMatch && featured.length < 40) {
            featured.push(enhanceMentorProfile(record));
            seenCompanies.add(record.company);
            seenBranches.add(record.branch);
        }
    }
    
    // Then, add diversity across branches and companies
    for (const record of sorted) {
        if (featured.length >= 50) break;
        const pkg = parseFloat(record.package) || 0;
        if (pkg < MIN_FEATURED_PACKAGE) continue;
        
        // Prefer records from unseen companies or branches for diversity
        const isNewCompany = !seenCompanies.has(record.company);
        const isNewBranch = !seenBranches.has(record.branch);
        
        if (isNewCompany || isNewBranch || featured.length < 30) {
            if (!featured.find(f => f.rollNo === record.rollNo)) {
                featured.push(enhanceMentorProfile(record));
                seenCompanies.add(record.company);
                seenBranches.add(record.branch);
            }
        }
    }
    
    console.log(`Generated ${featured.length} featured mentors from placement data`);
    return featured;
}

function enhanceMentorProfile(record) {
    // Generate realistic mentor profile based on placement data
    const pkg = parseFloat(record.package) || 0;
    const branch = record.branch || 'CSE';
    const company = record.company || 'Unknown';
    
    // Determine skills based on branch
    const branchSkills = {
        'CSE': ['Java', 'Python', 'JavaScript', 'DSA', 'System Design', 'React', 'Node.js', 'SQL'],
        'CSD': ['Python', 'TensorFlow', 'Machine Learning', 'Deep Learning', 'Data Science', 'AI'],
        'CSM': ['Python', 'R', 'Data Analysis', 'Statistics', 'SQL', 'Tableau', 'Machine Learning'],
        'ECE': ['C', 'C++', 'Embedded Systems', 'VLSI', 'IoT', 'Python', 'Signal Processing'],
        'EEE': ['MATLAB', 'Python', 'Power Systems', 'Control Systems', 'PLC', 'SCADA'],
        'IT': ['Java', 'Python', 'JavaScript', 'Web Development', 'Cloud', 'Database', 'DevOps'],
        'MECH': ['CAD', 'SolidWorks', 'ANSYS', 'Python', 'Manufacturing', 'Design'],
        'CIVIL': ['AutoCAD', 'STAAD Pro', 'Project Management', 'Structural Design'],
        'CHEM': ['Process Engineering', 'Chemical Design', 'Quality Control', 'Python'],
        'BioTech': ['Biotechnology', 'Research', 'Lab Techniques', 'Data Analysis'],
        'Auto': ['Automotive Design', 'CAD', 'Vehicle Dynamics', 'Manufacturing']
    };
    
    const skills = branchSkills[branch] || branchSkills['CSE'];
    const selectedSkills = skills.slice(0, 4 + Math.floor(Math.random() * 3));
    
    // Generate mentor topics based on company and package
    const baseMentorTopics = [];
    if (company.includes('Amazon')) baseMentorTopics.push('FAANG Prep', 'System Design', 'Amazon Interview');
    else if (company.includes('Walmart')) baseMentorTopics.push('E-commerce Tech', 'System Design', 'High CTC Prep');
    else if (company.includes('TCS')) baseMentorTopics.push('Service Companies', 'Project Building', 'Tech Career');
    else baseMentorTopics.push('Interview Preparation', 'Career Guidance', 'Technical Skills');
    
    if (branch === 'CSD' || branch === 'CSM') baseMentorTopics.push('Data Science Career');
    baseMentorTopics.push(`${branch} Branch Guidance`);
    
    // Generate bio
    let bio = `Placed at ${company} with ${pkg} LPA package. `;
    if (pkg >= 20) bio += `Cracked top-tier company with excellent package. Expert in ${selectedSkills[0]} and ${selectedSkills[1]}. `;
    bio += `Happy to mentor students on placement preparation and career guidance.`;
    
    return {
        rollNo: record.rollNo,
        name: record.name,
        branch: branch,
        company: company,
        package: record.package,
        year: record.year,
        skills: selectedSkills,
        mentorTopics: baseMentorTopics,
        bio: bio
    };
}


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

        // Generate featured mentors dynamically from placement data
        console.log('Generating featured mentors from placement data...');
        const FEATURED_MENTORS = generateFeaturedMentors(allPlacements);
        console.log(`✓ Generated ${FEATURED_MENTORS.length} featured mentors`);

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
        console.log(`  Top Featured Mentors (auto-selected from placement data):`);
        const topFeatured = FEATURED_MENTORS.slice(0, 8);
        topFeatured.forEach(m => {
            console.log(`    - ${m.name} (${m.branch}) @ ${m.company} - ${m.package} LPA`);
        });

        process.exit(0);
    } catch(err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

seedRealData();
