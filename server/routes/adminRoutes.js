const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs-extra');
const pdfParse = require('pdf-parse');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Engagement = require('../models/Engagement');
const Interview = require('../models/Interview');
const MentorshipRequest = require('../models/MentorshipRequest');
const DirectMessage = require('../models/DirectMessage');
const PlacementRecord = require('../models/PlacementRecord');
const { initialize: initializeRagEngine, getStatus: getRagEngineStatus } = require('../ragEngine');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

function triggerRagRebuild() {
    setImmediate(() => {
        initializeRagEngine({ forceRegenerateEmbeddings: true })
            .catch((err) => console.error('RAG Rebuild Error:', err.message));
    });
}

// File upload config
const upload = multer({
    dest: path.join(__dirname, '../../uploads/'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.csv', '.xlsx', '.xls', '.pdf'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDFs, CSV and Excel files are allowed.'));
        }
    }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Validate that a file is actually a PDF by checking magic bytes
 */
function validatePdfMagicBytes(filePath) {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(5);
    fs.readSync(fd, buf, 0, 5, 0);
    fs.closeSync(fd);
    return buf.toString('ascii').startsWith('%PDF');
}

/**
 * Chunk text with overlap for better semantic search
 */
function chunkText(text, size = 800, overlap = 100) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.substring(i, i + size).trim());
        i += size - overlap;
    }
    return chunks.filter(c => c.length > 20);
}

/**
 * Safely parse PDF with fallback for malformed files
 */
async function safePdfParse(filePath) {
    const fileBuffer = fs.readFileSync(filePath);

    // Primary: try pdf-parse normally
    try {
        const data = await pdfParse(fileBuffer);
        return {
            text: data.text || '',
            pages: data.numpages || 0,
            info: data.info || {},
            method: 'pdf-parse'
        };
    } catch (primaryError) {
        const errorMsg = primaryError.message || '';
        console.warn(`pdf-parse failed: ${errorMsg}. Attempting raw text extraction...`);

        // Fallback: extract raw readable text from the PDF buffer
        try {
            const rawText = extractRawTextFromBuffer(fileBuffer);
            if (rawText.length > 50) {
                return {
                    text: rawText,
                    pages: 0, // unknown
                    info: {},
                    method: 'raw-fallback',
                    warning: `Standard PDF parsing failed (${errorMsg}). Used fallback text extraction — some formatting may be lost.`
                };
            }
        } catch (fallbackError) {
            // Fallback also failed
        }

        // Determine user-friendly error message
        if (errorMsg.includes('Command token too long')) {
            throw new Error(
                'This PDF appears to be malformed or corrupted. The parser encountered an invalid structure. ' +
                'Please try: (1) Open the PDF and re-save it using "Print to PDF", (2) Use a PDF repair tool, ' +
                'or (3) Convert it to a different format first.'
            );
        }
        if (errorMsg.includes('Invalid PDF') || errorMsg.includes('Bad')) {
            throw new Error(
                'This file is not a valid PDF or is severely corrupted. Please verify the file opens correctly in a PDF viewer.'
            );
        }
        throw new Error(`Failed to parse PDF: ${errorMsg}`);
    }
}

/**
 * Last-resort raw text extraction from PDF buffer
 * Finds text between BT/ET markers and stream objects
 */
function extractRawTextFromBuffer(buffer) {
    const content = buffer.toString('latin1');
    const textParts = [];

    // Extract text between BT (Begin Text) and ET (End Text) markers
    const btEtRegex = /BT\s([\s\S]*?)ET/g;
    let match;
    while ((match = btEtRegex.exec(content)) !== null) {
        const block = match[1];
        // Extract text from Tj and TJ operators
        const tjRegex = /\(([^)]*)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(block)) !== null) {
            const cleaned = tjMatch[1].replace(/\\[nrt]/g, ' ').trim();
            if (cleaned.length > 0) textParts.push(cleaned);
        }
    }

    // Also try to find readable ASCII sequences
    if (textParts.length === 0) {
        const asciiRegex = /[\x20-\x7E]{10,}/g;
        let asciiMatch;
        while ((asciiMatch = asciiRegex.exec(content)) !== null) {
            const text = asciiMatch[0].trim();
            // Filter out PDF structural commands
            if (!text.match(/^(stream|endstream|endobj|xref|trailer|startxref)/i) &&
                !text.match(/^\d+\s+\d+\s+obj/) &&
                text.length > 15) {
                textParts.push(text);
            }
        }
    }

    return textParts.join('\n').trim();
}



// ─── User Management Routes ────────────────────────────────────────────────

// GET /api/admin/users — list all users
router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { role, search, blocked, page = 1, limit = 50 } = req.query;
        const filter = {};

        if (role) filter.role = role;
        if (blocked === 'true') filter.isBlocked = true;
        if (blocked === 'false') filter.isBlocked = { $ne: true };
        if (search) {
            const matchingProfiles = await Profile.find({ name: { $regex: search, $options: 'i' } }).select('userId');
            const userIds = matchingProfiles.map(p => p.userId);

            filter.$or = [
                { email: { $regex: search, $options: 'i' } },
                { _id: { $in: userIds } }
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

// ─── Knowledge Base Routes ──────────────────────────────────────────────────

// GET /api/admin/knowledge-base — list all documents in knowledge base
router.get('/knowledge-base', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const ragData = await PlacementRecord.find().lean();

        // Group by sourceFile
        const documentsMap = new Map();
        ragData.forEach((record, index) => {
            const source = record.sourceFile || record.file || 'Unknown';
            if (!documentsMap.has(source)) {
                documentsMap.set(source, {
                    sourceFile: source,
                    chunkCount: 0,
                    recordTypes: new Set(),
                    sampleContent: '',
                    years: new Set(),
                    branches: new Set(),
                    companies: new Set(),
                    addedAt: record.addedAt || null
                });
            }
            const doc = documentsMap.get(source);
            doc.chunkCount++;
            if (record.type) doc.recordTypes.add(record.type);
            if (record.year) doc.years.add(record.year);
            if (record.branch) doc.branches.add(record.branch);
            if (record.company) doc.companies.add(record.company);
            if (!doc.sampleContent && record.content) {
                doc.sampleContent = record.content.substring(0, 200);
            }
        });

        const documents = Array.from(documentsMap.values()).map(doc => ({
            ...doc,
            recordTypes: [...doc.recordTypes],
            years: [...doc.years].sort(),
            branches: [...doc.branches].filter(Boolean).slice(0, 10),
            companies: [...doc.companies].filter(Boolean).slice(0, 10)
        }));

        res.json({
            documents,
            totalRecords: ragData.length,
            totalDocuments: documents.length
        });
    } catch (error) {
        console.error('Knowledge base list error:', error);
        res.status(500).json({ error: 'Failed to list knowledge base documents.' });
    }
});

// DELETE /api/admin/knowledge-base/:sourceFile — remove a document's records
router.delete('/knowledge-base/:sourceFile', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const sourceFile = decodeURIComponent(req.params.sourceFile);
        
        // Use MongoDB directly
        const deleteResult = await PlacementRecord.deleteMany({
            $or: [
                { sourceFile: sourceFile },
                { file: sourceFile }
            ]
        });

        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ error: `No records found for "${sourceFile}".` });
        }

        const remainingRecords = await PlacementRecord.countDocuments();

        triggerRagRebuild();

        res.json({
            message: `Removed ${deleteResult.deletedCount} records from "${sourceFile}". RAG Engine is rebuilding.`,
            removedCount: deleteResult.deletedCount,
            remainingRecords
        });
    } catch (error) {
        console.error('Knowledge base delete error:', error);
        res.status(500).json({ error: 'Failed to delete document records.' });
    }
});

// POST /api/admin/rag-rebuild — manually trigger RAG rebuild
router.post('/rag-rebuild', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const status = getRagEngineStatus();
        if (status.isRunning) {
            return res.json({
                message: 'RAG Engine is already rebuilding. Your request has been queued.',
                status
            });
        }

        triggerRagRebuild();
        res.json({
            message: 'RAG Engine rebuild started successfully.',
            status: getRagEngineStatus()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to trigger RAG rebuild.' });
    }
});

// POST /api/admin/placement-data — upload CSV/Excel/PDF data
router.post('/placement-data', authenticate, requireRole('admin'), upload.single('file'), async (req, res) => {
    let filePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        filePath = req.file.path;
        const ext = path.extname(req.file.originalname).toLowerCase();
        const replaceExisting = req.body.replaceExisting === 'true';

        // Check for zero-byte file
        const fileStat = await fs.stat(filePath);
        if (fileStat.size === 0) {
            await fs.remove(filePath);
            return res.status(400).json({ error: 'The uploaded file is empty (0 bytes).' });
        }

        let newRecords = [];
        let warning = null;

        if (ext === '.pdf') {
            // Validate PDF magic bytes
            if (!validatePdfMagicBytes(filePath)) {
                await fs.remove(filePath);
                return res.status(400).json({
                    error: 'This file does not appear to be a valid PDF. The file header is missing the PDF signature. Please check the file and try again.'
                });
            }

            // Parse PDF with fallback
            const parsed = await safePdfParse(filePath);
            const text = parsed.text;
            warning = parsed.warning || null;

            // Check for effectively empty PDF
            const cleanText = text.replace(/\s+/g, ' ').trim();
            if (cleanText.length < 30) {
                await fs.remove(filePath);
                return res.status(400).json({
                    error: 'No readable text could be extracted from this PDF. It may be a scanned document (image-only) or contain only graphics. Please upload a text-based PDF.'
                });
            }

            // Chunk with overlap for better semantic search
            const chunks = chunkText(cleanText, 800, 100);

            newRecords = chunks.map((chunk, i) => ({
                type: 'document',
                sourceFile: req.file.originalname,
                chunkTitle: `${req.file.originalname} — Chunk ${i + 1}/${chunks.length}`,
                content: chunk,
                addedAt: new Date().toISOString()
            }));

        } else {
            // CSV / XLSX / XLS
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            if (data.length === 0) {
                await fs.remove(filePath);
                return res.status(400).json({ error: 'The uploaded spreadsheet has no data rows.' });
            }

            // Format for RAG engine
            newRecords = data.map((row, i) => {
                const chunkText = Object.entries(row)
                    .map(([key, value]) => `${key.trim().replace(/\n/g, ' ')}: ${value}`)
                    .join(", ");
                return {
                    type: 'document',
                    sourceFile: req.file.originalname,
                    chunkTitle: `${req.file.originalname} — Row ${i + 1}`,
                    content: chunkText,
                    addedAt: new Date().toISOString()
                };
            });
        }

        // Directly interact with DB
        if (replaceExisting) {
            await PlacementRecord.deleteMany({
                $or: [
                    { sourceFile: req.file.originalname },
                    { file: req.file.originalname }
                ]
            });
        } else {
            // Check for duplicates
            const existingCount = await PlacementRecord.countDocuments({
                $or: [
                    { sourceFile: req.file.originalname },
                    { file: req.file.originalname }
                ]
            });
            if (existingCount > 0) {
                isDuplicate = true;
            }
        }

        if (newRecords.length > 0) {
            await PlacementRecord.insertMany(newRecords);
        }
        
        const totalRecords = await PlacementRecord.countDocuments();

        triggerRagRebuild();

        // Cleanup uploaded file
        await fs.remove(filePath);
        filePath = null;

        const result = {
            message: ext === '.pdf'
                ? `Successfully processed PDF (${newRecords.length} chunks extracted). RAG Engine is rebuilding.`
                : `Successfully imported (${newRecords.length} records). RAG Engine is rebuilding.`,
            totalRecords: totalRecords,
            importedRecords: newRecords.length,
            isDuplicate: typeof isDuplicate !== 'undefined' ? isDuplicate : false,
            replaced: replaceExisting
        };
        if (warning) result.warning = warning;

        res.json(result);
    } catch (error) {
        // Cleanup file on error
        if (filePath) {
            try { await fs.remove(filePath); } catch (e) { /* ignore cleanup error */ }
        }
        console.error('File processing error:', error);
        res.status(500).json({
            error: 'Failed to process file.',
            details: error.message
        });
    }
});

// GET /api/admin/rag-status — current RAG engine rebuild status
router.get('/rag-status', authenticate, requireRole('admin'), (req, res) => {
    try {
        res.json({ status: getRagEngineStatus() });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch RAG status.' });
    }
});

// GET /api/admin/analytics — platform analytics
router.get('/analytics', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalAlumni = await User.countDocuments({ role: 'alumni' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });

        const totalInterviews = await Interview.countDocuments();
        const requestedInterviews = await Interview.countDocuments({ status: 'requested' });
        const acceptedInterviews = await Interview.countDocuments({ status: 'accepted' });
        const completedInterviews = await Interview.countDocuments({ status: 'completed' });
        const declinedInterviews = await Interview.countDocuments({ status: 'declined' });

        const totalMentorships = await MentorshipRequest.countDocuments();
        const pendingMentorships = await MentorshipRequest.countDocuments({ status: 'pending' });
        const acceptedMentorships = await MentorshipRequest.countDocuments({ status: 'accepted' });
        const rejectedMentorships = await MentorshipRequest.countDocuments({ status: 'rejected' });
        
        const totalMessages = await DirectMessage.countDocuments();

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const registrations = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        res.json({
            analytics: {
                users: { total: totalUsers, students: totalStudents, alumni: totalAlumni, admins: totalAdmins },
                interviews: { total: totalInterviews, requested: requestedInterviews, accepted: acceptedInterviews, completed: completedInterviews, declined: declinedInterviews },
                mentorships: { total: totalMentorships, pending: pendingMentorships, accepted: acceptedMentorships, rejected: rejectedMentorships },
                registrationsSeries: registrations,
                messages: { total: totalMessages }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics.' });
    }
});

module.exports = router;
