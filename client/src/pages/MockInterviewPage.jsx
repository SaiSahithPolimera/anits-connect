import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    CalendarCheck, Clock, CheckCircle, XCircle,
    Star, Video, Plus, X, ChevronDown,
    CalendarDays, Users, AlertCircle, RefreshCw
} from 'lucide-react';

export default function MockInterviewPage() {
    const { user } = useAuth();
    const [interviews, setInterviews]     = useState([]);
    const [loading, setLoading]           = useState(true);
    const [showForm, setShowForm]         = useState(false);
    const [showFeedback, setShowFeedback] = useState(null);
    const [form, setForm]                 = useState({
        alumniId: '', topic: '', description: '',
        scheduledAt: '', duration: 30
    });
    const [feedbackForm, setFeedbackForm] = useState({
        technical: 3, communication: 3, confidence: 3,
        problemSolving: 3, overallRating: 3, notes: ''
    });
    const [alumni, setAlumni] = useState([]);
    const [showReschedule, setShowReschedule] = useState(null);
    const [rescheduleForm, setRescheduleForm] = useState({ scheduledAt: '', rescheduleNote: '' });
    const [expandedFeedback, setExpandedFeedback] = useState(null);

    useEffect(() => { loadInterviews(); }, []);

    const loadInterviews = async () => {
        try {
            const res = await api.get('/interviews');
            setInterviews(res.data.interviews || []);
        } catch { } finally { setLoading(false); }
    };

    const loadAlumni = async () => {
        try {
            const res = await api.get('/match/alumni?available=true');
            setAlumni(res.data.alumni || []);
        } catch { }
    };

    const createInterview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/interviews', form);
            toast.success('Interview request sent!');
            setShowForm(false);
            setForm({ alumniId: '', topic: '', description: '', scheduledAt: '', duration: 30 });
            loadInterviews();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create request');
        }
    };

    const updateStatus = async (id, status, meetingLink = '') => {
        try {
            await api.put(`/interviews/${id}`, { status, meetingLink });
            toast.success(`Interview ${status}`);
            loadInterviews();
        } catch { toast.error('Failed to update'); }
    };

    const rescheduleInterview = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/interviews/${showReschedule}`, {
                status: 'rescheduled',
                scheduledAt: rescheduleForm.scheduledAt,
                rescheduleNote: rescheduleForm.rescheduleNote
            });
            toast.success('Interview rescheduled!');
            setShowReschedule(null);
            setRescheduleForm({ scheduledAt: '', rescheduleNote: '' });
            loadInterviews();
        } catch { toast.error('Failed to reschedule'); }
    };

    const submitFeedback = async (interviewId) => {
        try {
            await api.post(`/interviews/${interviewId}/feedback`, feedbackForm);
            toast.success('Feedback submitted!');
            setShowFeedback(null);
            loadInterviews();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to submit feedback');
        }
    };

    const statusConfig = {
        requested:   { label: 'Requested',   bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
        accepted:    { label: 'Accepted',     bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
        completed:   { label: 'Completed',    bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
        declined:    { label: 'Declined',     bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
        rescheduled: { label: 'Rescheduled',  bg: '#ffedd5', color: '#9a3412', border: '#fdba74' },
    };

    const getStatus = (s) => statusConfig[s] || { label: s, bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };

    const feedbackFields = [
        { key: 'technical',      label: 'Technical Skills'  },
        { key: 'communication',  label: 'Communication'     },
        { key: 'confidence',     label: 'Confidence'        },
        { key: 'problemSolving', label: 'Problem Solving'   },
        { key: 'overallRating',  label: 'Overall Rating'    },
    ];

    const avatarGradients = [
        'linear-gradient(135deg,#4338ca,#7c3aed)',
        'linear-gradient(135deg,#0891b2,#0284c7)',
        'linear-gradient(135deg,#059669,#0d9488)',
        'linear-gradient(135deg,#dc2626,#db2777)',
        'linear-gradient(135deg,#d97706,#b45309)',
    ];

    const totalInterviews  = interviews.length;
    const pendingCount     = interviews.filter(i => i.status === 'requested').length;
    const completedCount   = interviews.filter(i => i.status === 'completed').length;

    return (
        <>
            <style>{`
                .mi-root {
                    min-height: 100vh;
                    background: #eef0f7;
                    font-family: 'DM Sans', sans-serif;
                    color: #1a1d2e;
                    animation: miFade 0.45s ease both;
                }
                @keyframes miFade {
                    from { opacity:0; transform:translateY(16px); }
                    to   { opacity:1; transform:translateY(0); }
                }

                /* ── Full-width hero ── */
                .mi-hero {
                    padding: 36px 0 72px;
                    background: linear-gradient(135deg,#1e1b4b 0%,#312e81 45%,#4338ca 100%);
                    position: relative;
                    overflow: hidden;
                }
                .mi-hero::before {
                    content:'';
                    position:absolute; inset:0;
                    background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
                    background-size: 28px 28px;
                    pointer-events: none;
                }
                .mi-hero::after {
                    content:'';
                    position:absolute;
                    bottom:-1px; left:0; right:0;
                    height:40px;
                    background:#eef0f7;
                    clip-path: ellipse(55% 100% at 50% 100%);
                }
                .mi-hero-inner {
                    position:relative; z-index:1;
                    max-width:1100px; margin:0 auto; padding:0 32px;
                    display:flex; align-items:center;
                    justify-content:space-between; flex-wrap:wrap; gap:16px;
                }
                .mi-hero-left {
                    display:flex; align-items:center; gap:16px;
                }
                .mi-hero-icon {
                    width:54px; height:54px; border-radius:14px;
                    background:rgba(255,255,255,0.14);
                    border:2px solid rgba(255,255,255,0.25);
                    display:flex; align-items:center; justify-content:center;
                    backdrop-filter:blur(8px); flex-shrink:0;
                }
                .mi-hero-title {
                    font-family:'Sora',sans-serif;
                    font-size:26px; font-weight:700; color:#fff; margin:0 0 4px;
                }
                .mi-hero-sub { font-size:13px; color:rgba(255,255,255,0.65); margin:0; }

                /* request btn in hero */
                .mi-hero-btn {
                    display:flex; align-items:center; gap:8px;
                    padding:10px 20px; border-radius:10px; border:none;
                    background:#fff; color:#4338ca;
                    font-size:13px; font-weight:700;
                    font-family:'DM Sans',sans-serif;
                    cursor:pointer; transition:all 0.18s;
                    box-shadow:0 4px 14px rgba(0,0,0,0.18);
                    white-space:nowrap;
                }
                .mi-hero-btn:hover {
                    background:#eef2ff;
                    box-shadow:0 6px 20px rgba(0,0,0,0.22);
                    transform:translateY(-1px);
                }

                /* ── Stats row ── */
                .mi-stats {
                    max-width:1100px; margin:0 auto;
                    padding:0 32px;
                    display:grid;
                    grid-template-columns:repeat(3,1fr);
                    gap:14px;
                    margin-top:-28px;
                    position:relative; z-index:2;
                    margin-bottom:28px;
                }
                .mi-stat-card {
                    background:#fff; border-radius:14px;
                    border:1.5px solid #eaecf4;
                    padding:18px 20px;
                    box-shadow:0 4px 14px rgba(26,29,46,0.06);
                    display:flex; align-items:center; gap:14px;
                }
                .mi-stat-icon {
                    width:42px; height:42px; border-radius:10px;
                    display:flex; align-items:center; justify-content:center;
                    flex-shrink:0;
                }
                .mi-stat-num {
                    font-family:'Sora',sans-serif;
                    font-size:22px; font-weight:700; color:#1a1d2e; margin:0 0 2px;
                }
                .mi-stat-label { font-size:12px; color:#9ca3af; margin:0; }

                /* ── Content ── */
                .mi-content {
                    max-width:1100px; margin:0 auto;
                    padding:0 32px 60px;
                }

                /* section title */
                .mi-section-title {
                    font-family:'Sora',sans-serif;
                    font-size:11px; font-weight:600;
                    text-transform:uppercase; letter-spacing:0.1em;
                    color:#b0b7c9; margin:0 0 16px;
                    display:flex; align-items:center; gap:10px;
                }
                .mi-section-title::after {
                    content:''; flex:1; height:1px; background:#eaecf4;
                }

                /* ── Interview card ── */
                .mi-card {
                    background:#fff;
                    border:1.5px solid #eaecf4;
                    border-radius:14px; padding:22px;
                    margin-bottom:14px;
                    transition:border-color 0.2s, box-shadow 0.2s;
                    animation:miFade 0.3s ease both;
                }
                .mi-card:hover {
                    border-color:#c7d2fe;
                    box-shadow:0 6px 20px rgba(67,56,202,0.07);
                }
                .mi-card-top {
                    display:flex; align-items:flex-start;
                    justify-content:space-between; gap:12px; margin-bottom:12px;
                }
                .mi-card-topic {
                    font-family:'Sora',sans-serif;
                    font-size:16px; font-weight:700; color:#1a1d2e; margin:0 0 4px;
                }
                .mi-card-person {
                    font-size:13px; color:#6b7280; margin:0;
                    display:flex; align-items:center; gap:5px;
                }
                .mi-status-pill {
                    padding:4px 12px; border-radius:999px;
                    font-size:12px; font-weight:600;
                    border-width:1px; border-style:solid;
                    white-space:nowrap; flex-shrink:0;
                }
                .mi-card-meta {
                    display:flex; align-items:center; gap:18px;
                    margin-bottom:14px; flex-wrap:wrap;
                }
                .mi-meta-item {
                    display:flex; align-items:center; gap:5px;
                    font-size:12.5px; color:#9ca3af;
                }
                .mi-meeting-link {
                    display:inline-flex; align-items:center; gap:6px;
                    padding:6px 14px; border-radius:8px;
                    background:#eef2ff; color:#4338ca;
                    border:1px solid #c7d2fe;
                    font-size:12.5px; font-weight:600;
                    text-decoration:none; margin-bottom:14px;
                    transition:all 0.15s;
                }
                .mi-meeting-link:hover { background:#e0e7ff; }

                /* action buttons */
                .mi-actions { display:flex; gap:8px; flex-wrap:wrap; }
                .mi-btn {
                    display:flex; align-items:center; gap:6px;
                    padding:8px 16px; border-radius:8px; border:none;
                    font-size:12.5px; font-weight:600;
                    font-family:'DM Sans',sans-serif;
                    cursor:pointer; transition:all 0.15s;
                }
                .mi-btn-accept  { background:#d1fae5; color:#065f46; border:1px solid #6ee7b7; }
                .mi-btn-accept:hover  { background:#a7f3d0; }
                .mi-btn-decline { background:#fee2e2; color:#991b1b; border:1px solid #fca5a5; }
                .mi-btn-decline:hover { background:#fecaca; }
                .mi-btn-complete{ background:#dbeafe; color:#1e40af; border:1px solid #93c5fd; }
                .mi-btn-complete:hover{ background:#bfdbfe; }
                .mi-btn-feedback{ background:#fef3c7; color:#92400e; border:1px solid #fde68a; }
                .mi-btn-feedback:hover{ background:#fde68a; }

                /* description */
                .mi-card-desc {
                    font-size:13px; color:#6b7280; line-height:1.55;
                    padding:10px 14px; background:#fafbff;
                    border-radius:8px; border:1px solid #eaecf4;
                    margin-bottom:14px;
                }

                /* ── Feedback on card ── */
                .mi-feedback-box {
                    margin-top:14px; padding:14px 16px;
                    background:#f9fafb; border-radius:10px;
                    border:1px solid #eaecf4;
                }
                .mi-feedback-title {
                    font-size:12px; font-weight:600; color:#374151;
                    margin:0 0 10px; text-transform:uppercase;
                    letter-spacing:0.06em;
                }
                .mi-feedback-row {
                    display:flex; align-items:center;
                    justify-content:space-between; margin-bottom:6px;
                }
                .mi-feedback-label { font-size:12px; color:#6b7280; }
                .mi-stars {
                    display:flex; gap:2px;
                }
                .mi-star { color:#e5e7eb; font-size:14px; }
                .mi-star.filled { color:#f59e0b; }

                /* ── Loading / Empty ── */
                .mi-center {
                    display:flex; flex-direction:column;
                    align-items:center; justify-content:center;
                    padding:64px 24px; gap:14px; color:#9ca3af;
                }
                .mi-spinner {
                    width:36px; height:36px;
                    border:3px solid #eaecf4;
                    border-top-color:#4338ca;
                    border-radius:50%;
                    animation:miSpin 0.75s linear infinite;
                }
                @keyframes miSpin { to { transform:rotate(360deg); } }
                .mi-empty-icon {
                    width:60px; height:60px; border-radius:16px;
                    background:#f0f2f8;
                    display:flex; align-items:center; justify-content:center;
                    color:#c4c9d8;
                }

                /* ════ MODAL OVERLAY ════ */
                .mi-overlay {
                    position:fixed; inset:0;
                    background:rgba(15,17,30,0.5);
                    backdrop-filter:blur(4px);
                    display:flex; align-items:center; justify-content:center;
                    z-index:100; padding:16px;
                    animation:miOvIn 0.2s ease both;
                }
                @keyframes miOvIn { from{opacity:0;} to{opacity:1;} }
                .mi-modal {
                    background:#fff; border-radius:18px;
                    width:100%; max-width:460px;
                    max-height:90vh; overflow-y:auto;
                    box-shadow:0 24px 60px rgba(15,17,30,0.2);
                    animation:miModIn 0.25s cubic-bezier(0.4,0,0.2,1) both;
                }
                @keyframes miModIn {
                    from{opacity:0;transform:scale(0.95) translateY(8px);}
                    to{opacity:1;transform:scale(1) translateY(0);}
                }
                .mi-modal-head {
                    display:flex; align-items:center;
                    justify-content:space-between;
                    padding:20px 24px 0;
                }
                .mi-modal-title {
                    font-family:'Sora',sans-serif;
                    font-size:17px; font-weight:700;
                    color:#1a1d2e; margin:0;
                }
                .mi-modal-close {
                    width:30px; height:30px; border-radius:7px;
                    border:1.5px solid #e5e7eb; background:transparent;
                    color:#6b7280; cursor:pointer;
                    display:flex; align-items:center; justify-content:center;
                    transition:background 0.15s;
                }
                .mi-modal-close:hover { background:#f5f6fa; }
                .mi-modal-body { padding:20px 24px 24px; }

                /* form fields */
                .mi-form-field { margin-bottom:16px; }
                .mi-form-label {
                    font-size:13px; font-weight:600; color:#374151;
                    display:block; margin-bottom:7px;
                    font-family:'DM Sans',sans-serif;
                }
                .mi-input, .mi-select, .mi-textarea {
                    width:100%; padding:11px 14px;
                    border:1.5px solid #e5e7eb; border-radius:10px;
                    font-size:14px; color:#1a1d2e; background:#fafbff;
                    font-family:'DM Sans',sans-serif; outline:none;
                    transition:border-color 0.2s, box-shadow 0.2s;
                    -webkit-appearance:none; appearance:none;
                }
                .mi-input:focus,.mi-select:focus,.mi-textarea:focus {
                    border-color:#4338ca;
                    box-shadow:0 0 0 3px rgba(67,56,202,0.1);
                    background:#fff;
                }
                .mi-input::placeholder,.mi-textarea::placeholder { color:#c4c9d8; }
                .mi-textarea { resize:vertical; min-height:72px; line-height:1.55; }
                .mi-select-wrap { position:relative; }
                .mi-select-wrap svg {
                    position:absolute; right:12px; top:50%;
                    transform:translateY(-50%);
                    pointer-events:none; color:#9ca3af;
                }
                .mi-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

                /* modal footer */
                .mi-modal-footer {
                    display:flex; gap:10px; margin-top:20px;
                }
                .mi-btn-cancel {
                    flex:1; padding:11px;
                    border-radius:10px; border:1.5px solid #e5e7eb;
                    background:transparent; color:#6b7280;
                    font-size:14px; font-weight:600;
                    font-family:'DM Sans',sans-serif; cursor:pointer;
                    transition:background 0.15s;
                }
                .mi-btn-cancel:hover { background:#f9fafb; }
                .mi-btn-submit {
                    flex:1; padding:11px;
                    border-radius:10px; border:none;
                    background:#4338ca; color:#fff;
                    font-size:14px; font-weight:600;
                    font-family:'DM Sans',sans-serif; cursor:pointer;
                    transition:all 0.18s;
                    box-shadow:0 4px 12px rgba(67,56,202,0.28);
                }
                .mi-btn-submit:hover {
                    background:#3730a3;
                    box-shadow:0 6px 18px rgba(67,56,202,0.36);
                }

                /* rating stars in modal */
                .mi-rating-row {
                    display:flex; align-items:center;
                    justify-content:space-between; margin-bottom:12px;
                }
                .mi-rating-label { font-size:13px; color:#374151; font-weight:500; }
                .mi-rating-btns { display:flex; gap:4px; }
                .mi-rating-btn {
                    width:34px; height:34px; border-radius:8px;
                    display:flex; align-items:center; justify-content:center;
                    font-size:13px; font-weight:600; cursor:pointer;
                    transition:all 0.15s; border:1.5px solid #e5e7eb;
                    background:#fafbff; color:#9ca3af;
                    font-family:'DM Sans',sans-serif;
                }
                .mi-rating-btn.active {
                    background:#fef3c7; color:#92400e;
                    border-color:#fde68a;
                }
                .mi-divider { height:1px; background:#eaecf4; margin:16px 0; }

                /* reschedule button */
                .mi-btn-reschedule { background:#ffedd5; color:#9a3412; border:1px solid #fdba74; }
                .mi-btn-reschedule:hover { background:#fed7aa; }
                .mi-reschedule-note {
                    margin-top:8px; padding:10px 14px;
                    background:#fffbeb; border-radius:8px;
                    border:1px solid #fde68a;
                    font-size:12.5px; color:#92400e; line-height:1.5;
                }

                /* ── Responsive ── */
                @media (max-width:700px) {
                    .mi-stats         { grid-template-columns:1fr; margin-top:-16px; padding:0 16px; }
                    .mi-content       { padding:0 16px 48px; }
                    .mi-hero-inner    { padding:0 20px; }
                    .mi-hero-title    { font-size:20px; }
                    .mi-row-2         { grid-template-columns:1fr; }
                }
            `}</style>

            {/* ── Request Interview Modal ── */}
            {showForm && (
                <div className="mi-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <div className="mi-modal">
                        <div className="mi-modal-head">
                            <h3 className="mi-modal-title">Request Mock Interview</h3>
                            <button className="mi-modal-close" onClick={() => setShowForm(false)}>
                                <X size={15} />
                            </button>
                        </div>
                        <div className="mi-modal-body">
                            <form onSubmit={createInterview}>
                                <div className="mi-form-field">
                                    <label className="mi-form-label">Select Alumni</label>
                                    <div className="mi-select-wrap">
                                        <select
                                            className="mi-select"
                                            value={form.alumniId}
                                            onChange={e => setForm({ ...form, alumniId: e.target.value })}
                                            required
                                        >
                                            <option value="">Choose an alumni mentor…</option>
                                            {alumni.map(a => (
                                                <option key={a.userId} value={a.userId}>
                                                    {a.name} — {a.company}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} />
                                    </div>
                                </div>

                                <div className="mi-form-field">
                                    <label className="mi-form-label">Topic</label>
                                    <input
                                        className="mi-input"
                                        placeholder="e.g. DSA, System Design, HR Round…"
                                        value={form.topic}
                                        onChange={e => setForm({ ...form, topic: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="mi-form-field">
                                    <label className="mi-form-label">Description (optional)</label>
                                    <textarea
                                        className="mi-textarea"
                                        placeholder="Any specific areas you want to focus on…"
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        rows={2}
                                    />
                                </div>

                                <div className="mi-row-2">
                                    <div className="mi-form-field">
                                        <label className="mi-form-label">Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            className="mi-input"
                                            value={form.scheduledAt}
                                            onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mi-form-field">
                                        <label className="mi-form-label">Duration</label>
                                        <div className="mi-select-wrap">
                                            <select
                                                className="mi-select"
                                                value={form.duration}
                                                onChange={e => setForm({ ...form, duration: Number(e.target.value) })}
                                            >
                                                {[15, 30, 45, 60, 90].map(d => (
                                                    <option key={d} value={d}>{d} minutes</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>

                                <div className="mi-modal-footer">
                                    <button type="button" className="mi-btn-cancel" onClick={() => setShowForm(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="mi-btn-submit">
                                        Send Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Feedback Modal ── */}
            {showFeedback && (
                <div className="mi-overlay" onClick={e => e.target === e.currentTarget && setShowFeedback(null)}>
                    <div className="mi-modal">
                        <div className="mi-modal-head">
                            <h3 className="mi-modal-title">Give Feedback</h3>
                            <button className="mi-modal-close" onClick={() => setShowFeedback(null)}>
                                <X size={15} />
                            </button>
                        </div>
                        <div className="mi-modal-body">
                            <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 16px' }}>
                                Rate the student's performance across different areas.
                            </p>

                            {feedbackFields.map(({ key, label }) => (
                                <div className="mi-rating-row" key={key}>
                                    <span className="mi-rating-label">{label}</span>
                                    <div className="mi-rating-btns">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                className={`mi-rating-btn${feedbackForm[key] >= n ? ' active' : ''}`}
                                                onClick={() => setFeedbackForm({ ...feedbackForm, [key]: n })}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="mi-divider" />

                            <div className="mi-form-field">
                                <label className="mi-form-label">Additional Notes</label>
                                <textarea
                                    className="mi-textarea"
                                    placeholder="Share specific feedback, strengths, areas to improve…"
                                    value={feedbackForm.notes}
                                    onChange={e => setFeedbackForm({ ...feedbackForm, notes: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="mi-modal-footer">
                                <button className="mi-btn-cancel" onClick={() => setShowFeedback(null)}>
                                    Cancel
                                </button>
                                <button className="mi-btn-submit" onClick={() => submitFeedback(showFeedback)}>
                                    Submit Feedback
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mi-root">

                {/* ── Hero ── */}
                <div className="mi-hero">
                    <div className="mi-hero-inner">
                        <div className="mi-hero-left">
                            <div className="mi-hero-icon">
                                <CalendarCheck size={26} color="#a5b4fc" />
                            </div>
                            <div>
                                <h1 className="mi-hero-title">Mock Interviews</h1>
                                <p className="mi-hero-sub">Schedule and manage your practice interviews</p>
                            </div>
                        </div>
                        {user?.role === 'student' && (
                            <button
                                className="mi-hero-btn"
                                onClick={() => { setShowForm(true); loadAlumni(); }}
                            >
                                <Plus size={15} />
                                Request Interview
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="mi-stats">
                    <div className="mi-stat-card">
                        <div className="mi-stat-icon" style={{ background: '#eef2ff' }}>
                            <CalendarDays size={20} color="#4338ca" />
                        </div>
                        <div>
                            <p className="mi-stat-num">{totalInterviews}</p>
                            <p className="mi-stat-label">Total Interviews</p>
                        </div>
                    </div>
                    <div className="mi-stat-card">
                        <div className="mi-stat-icon" style={{ background: '#fef3c7' }}>
                            <AlertCircle size={20} color="#d97706" />
                        </div>
                        <div>
                            <p className="mi-stat-num">{pendingCount}</p>
                            <p className="mi-stat-label">Pending Requests</p>
                        </div>
                    </div>
                    <div className="mi-stat-card">
                        <div className="mi-stat-icon" style={{ background: '#d1fae5' }}>
                            <CheckCircle size={20} color="#059669" />
                        </div>
                        <div>
                            <p className="mi-stat-num">{completedCount}</p>
                            <p className="mi-stat-label">Completed</p>
                        </div>
                    </div>
                </div>

                {/* ── Interview list ── */}
                <div className="mi-content">
                    {loading ? (
                        <div className="mi-center">
                            <div className="mi-spinner" />
                            <span style={{ fontSize: 14 }}>Loading interviews…</span>
                        </div>
                    ) : interviews.length === 0 ? (
                        <div className="mi-center">
                            <div className="mi-empty-icon">
                                <CalendarCheck size={28} />
                            </div>
                            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>
                                No interviews yet
                            </p>
                            <p style={{ fontSize: 13, margin: 0, textAlign: 'center' }}>
                                {user?.role === 'student'
                                    ? 'Request a mock interview with an alumni mentor to get started'
                                    : 'Interview requests from students will appear here'}
                            </p>
                            {user?.role === 'student' && (
                                <button
                                    className="mi-btn-submit"
                                    style={{ marginTop: 8, padding: '10px 24px', flex: 'none' }}
                                    onClick={() => { setShowForm(true); loadAlumni(); }}
                                >
                                    <Plus size={14} style={{ marginRight: 6 }} />
                                    Request Interview
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <p className="mi-section-title">
                                <CalendarCheck size={12} />
                                {interviews.length} interview{interviews.length !== 1 ? 's' : ''}
                            </p>

                            {interviews.map((iv, i) => {
                                const st = getStatus(iv.status);
                                const personName = user?.role === 'student'
                                    ? `${iv.alumniProfile?.name || 'Alumni'} · ${iv.alumniProfile?.company || ''}`
                                    : `${iv.studentProfile?.name || 'Student'} · ${iv.studentProfile?.branch || ''}`;

                                return (
                                    <div
                                        key={i}
                                        className="mi-card"
                                        style={{ animationDelay: `${i * 0.04}s` }}
                                    >
                                        <div className="mi-card-top">
                                            <div>
                                                <p className="mi-card-topic">{iv.topic}</p>
                                                <p className="mi-card-person">
                                                    <Users size={12} />
                                                    {personName}
                                                </p>
                                            </div>
                                            <span
                                                className="mi-status-pill"
                                                style={{
                                                    background: st.bg,
                                                    color: st.color,
                                                    borderColor: st.border
                                                }}
                                            >
                                                {st.label}
                                            </span>
                                        </div>

                                        <div className="mi-card-meta">
                                            <span className="mi-meta-item">
                                                <Clock size={13} />
                                                {new Date(iv.scheduledAt).toLocaleString('en-IN', {
                                                    dateStyle: 'medium', timeStyle: 'short'
                                                })}
                                            </span>
                                            <span className="mi-meta-item">
                                                <CalendarDays size={13} />
                                                {iv.duration} min
                                            </span>
                                        </div>

                                        {iv.description && (
                                            <p className="mi-card-desc">{iv.description}</p>
                                        )}

                                        {/* ── Time-aware meeting section ── */}
                                        {iv.status === 'accepted' && (() => {
                                            const now = new Date();
                                            const start = new Date(iv.scheduledAt);
                                            const end = new Date(start.getTime() + (iv.duration || 30) * 60 * 1000);
                                            const diffMs = start - now;
                                            const diffHrs = Math.floor(diffMs / 3600000);
                                            const diffMins = Math.floor((diffMs % 3600000) / 60000);

                                            if (now < start) {
                                                // BEFORE meeting
                                                return (
                                                    <div style={{
                                                        padding: '10px 14px', borderRadius: 8,
                                                        background: '#eff6ff', border: '1px solid #bfdbfe',
                                                        fontSize: 12.5, color: '#1e40af', marginBottom: 8,
                                                        display: 'flex', alignItems: 'center', gap: 6
                                                    }}>
                                                        <Clock size={13} />
                                                        Meeting starts {diffHrs > 0 ? `in ${diffHrs}h ${diffMins}m` : diffMins > 0 ? `in ${diffMins} minutes` : 'soon'}
                                                        {' · '}
                                                        {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                );
                                            } else if (now >= start && now <= end) {
                                                // DURING meeting
                                                return (
                                                    <>
                                                        <div style={{
                                                            padding: '10px 14px', borderRadius: 8,
                                                            background: '#d1fae5', border: '1px solid #6ee7b7',
                                                            fontSize: 12.5, color: '#065f46', marginBottom: 8,
                                                            display: 'flex', alignItems: 'center', gap: 6
                                                        }}>
                                                            <span style={{
                                                                width: 8, height: 8, borderRadius: '50%',
                                                                background: '#10b981', display: 'inline-block',
                                                                animation: 'pulse 1.5s infinite'
                                                            }} />
                                                            Meeting in progress
                                                        </div>
                                                        {iv.meetingLink && (
                                                            <a href={iv.meetingLink} target="_blank" rel="noreferrer"
                                                                className="mi-meeting-link">
                                                                <Video size={13} /> Join Meeting
                                                            </a>
                                                        )}
                                                    </>
                                                );
                                            } else {
                                                // AFTER meeting (auto-complete hasn't triggered yet)
                                                return (
                                                    <div style={{
                                                        padding: '10px 14px', borderRadius: 8,
                                                        background: '#fef3c7', border: '1px solid #fde68a',
                                                        fontSize: 12.5, color: '#92400e', marginBottom: 8,
                                                        display: 'flex', alignItems: 'center', gap: 6
                                                    }}>
                                                        <CheckCircle size={13} />
                                                        Meeting time has ended. It will be auto-completed shortly.
                                                    </div>
                                                );
                                            }
                                        })()}

                                        {/* Completed interview message */}
                                        {iv.status === 'completed' && (
                                            <div style={{
                                                padding: '10px 14px', borderRadius: 8,
                                                background: '#f0fdf4', border: '1px solid #bbf7d0',
                                                fontSize: 12.5, color: '#166534', marginBottom: 8,
                                                display: 'flex', alignItems: 'center', gap: 6
                                            }}>
                                                <CheckCircle size={13} />
                                                Interview completed{!iv.hasFeedback && user?.role === 'alumni' ? ' — please provide feedback below.' : '.'}
                                            </div>
                                        )}
                                        {/* Show a message for declined interviews */}
                                        {iv.status === 'declined' && (
                                            <div style={{
                                                padding: '10px 14px', borderRadius: 8,
                                                background: '#fef2f2', border: '1px solid #fecaca',
                                                fontSize: 12.5, color: '#991b1b', marginBottom: 8,
                                                display: 'flex', alignItems: 'center', gap: 6
                                            }}>
                                                <XCircle size={13} />
                                                {user?.role === 'alumni'
                                                    ? 'You declined this interview request.'
                                                    : 'This interview was declined. You can request a new one with a different time.'}
                                            </div>
                                        )}

                                        <div className="mi-actions">
                                            {user?.role === 'alumni' && (iv.status === 'requested' || iv.status === 'rescheduled') && (
                                                <>
                                                    <button
                                                        className="mi-btn mi-btn-accept"
                                                        onClick={() => updateStatus(iv._id, 'accepted')}
                                                    >
                                                        <CheckCircle size={13} /> Accept
                                                    </button>
                                                    <button
                                                        className="mi-btn mi-btn-reschedule"
                                                        onClick={() => { setShowReschedule(iv._id); setRescheduleForm({ scheduledAt: '', rescheduleNote: '' }); }}
                                                    >
                                                        <RefreshCw size={13} /> Reschedule
                                                    </button>
                                                    <button
                                                        className="mi-btn mi-btn-decline"
                                                        onClick={() => updateStatus(iv._id, 'declined')}
                                                    >
                                                        <XCircle size={13} /> Decline
                                                    </button>
                                                </>
                                            )}
                                            {user?.role === 'alumni' && iv.status === 'completed' && !iv.hasFeedback && (
                                                <button
                                                    className="mi-btn mi-btn-feedback"
                                                    onClick={() => setShowFeedback(iv._id)}
                                                >
                                                    <Star size={13} /> Give Feedback
                                                </button>
                                            )}
                                        </div>
                                        {iv.feedback && (
                                            <div style={{ marginTop: 12 }}>
                                                {/* Toggle button */}
                                                <button
                                                    onClick={() => setExpandedFeedback(expandedFeedback === iv._id ? null : iv._id)}
                                                    style={{
                                                        width: '100%', padding: '10px 16px', borderRadius: 10,
                                                        background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%)',
                                                        border: '1px solid #e0e7ff', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: 8,
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <Star size={14} style={{ color: '#f59e0b' }} />
                                                    <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>View Feedback</span>
                                                    <span style={{
                                                        marginLeft: 'auto', fontSize: 14, fontWeight: 700,
                                                        color: iv.feedback.overallRating >= 4 ? '#059669' : iv.feedback.overallRating >= 3 ? '#d97706' : '#dc2626'
                                                    }}>
                                                        {iv.feedback.overallRating}/5 ⭐
                                                    </span>
                                                    <ChevronDown size={14} style={{
                                                        color: '#64748b',
                                                        transform: expandedFeedback === iv._id ? 'rotate(180deg)' : 'rotate(0)',
                                                        transition: 'transform 0.2s ease'
                                                    }} />
                                                </button>

                                                {/* Expandable content */}
                                                {expandedFeedback === iv._id && (
                                                    <div style={{
                                                        padding: 20, borderRadius: '0 0 12px 12px',
                                                        background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%)',
                                                        border: '1px solid #e0e7ff', borderTop: 'none',
                                                        animation: 'fadeIn 0.2s ease'
                                                    }}>
                                                        {/* Rating bars */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                                                            {feedbackFields.filter(f => f.key !== 'overallRating').map(({ key, label }) => (
                                                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                    <span style={{ fontSize: 12, color: '#64748b', width: 110, flexShrink: 0 }}>{label}</span>
                                                                    <div style={{
                                                                        flex: 1, height: 8, background: '#e2e8f0',
                                                                        borderRadius: 4, overflow: 'hidden'
                                                                    }}>
                                                                        <div style={{
                                                                            height: '100%', borderRadius: 4,
                                                                            width: `${(iv.feedback[key] / 5) * 100}%`,
                                                                            background: iv.feedback[key] >= 4 ? 'linear-gradient(90deg, #34d399, #059669)' :
                                                                                       iv.feedback[key] >= 3 ? 'linear-gradient(90deg, #fbbf24, #d97706)' :
                                                                                       'linear-gradient(90deg, #f87171, #dc2626)',
                                                                            transition: 'width 0.6s ease'
                                                                        }} />
                                                                    </div>
                                                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', width: 20, textAlign: 'right' }}>
                                                                        {iv.feedback[key]}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Strengths */}
                                                        {iv.feedback.strengths && iv.feedback.strengths.length > 0 && (
                                                            <div style={{ marginBottom: 12 }}>
                                                                <p style={{ fontSize: 11, fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                                                                    💪 Strengths
                                                                </p>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                                    {iv.feedback.strengths.map((s, idx) => (
                                                                        <span key={idx} style={{
                                                                            padding: '4px 10px', borderRadius: 20,
                                                                            background: '#d1fae5', color: '#065f46',
                                                                            fontSize: 11.5, fontWeight: 500
                                                                        }}>{s}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Improvements */}
                                                        {iv.feedback.improvements && iv.feedback.improvements.length > 0 && (
                                                            <div style={{ marginBottom: 12 }}>
                                                                <p style={{ fontSize: 11, fontWeight: 600, color: '#d97706', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                                                                    📈 Areas to Improve
                                                                </p>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                                    {iv.feedback.improvements.map((s, idx) => (
                                                                        <span key={idx} style={{
                                                                            padding: '4px 10px', borderRadius: 20,
                                                                            background: '#fef3c7', color: '#92400e',
                                                                            fontSize: 11.5, fontWeight: 500
                                                                        }}>{s}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Notes */}
                                                        {iv.feedback.notes && (
                                                            <div style={{
                                                                padding: 14, borderRadius: 8,
                                                                background: '#fff', border: '1px solid #e2e8f0',
                                                                fontSize: 13, color: '#475569', lineHeight: 1.6,
                                                                fontStyle: 'italic'
                                                            }}>
                                                                "{iv.feedback.notes}"
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Show reschedule note */}
                                        {iv.status === 'rescheduled' && iv.rescheduleNote && (
                                            <div className="mi-reschedule-note">
                                                <RefreshCw size={12} style={{ display: 'inline', marginRight: 4 }} />
                                                <strong>Reschedule note:</strong> {iv.rescheduleNote}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>

            {/* ── Reschedule Modal ── */}
            {showReschedule && (
                <div className="mi-overlay" onClick={e => e.target === e.currentTarget && setShowReschedule(null)}>
                    <div className="mi-modal">
                        <div className="mi-modal-head">
                            <h3 className="mi-modal-title">Reschedule Interview</h3>
                            <button className="mi-modal-close" onClick={() => setShowReschedule(null)}>
                                <X size={15} />
                            </button>
                        </div>
                        <div className="mi-modal-body">
                            <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 16px' }}>
                                Propose a new date & time that works better for you.
                            </p>
                            <form onSubmit={rescheduleInterview}>
                                <div className="mi-form-field">
                                    <label className="mi-form-label">New Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        className="mi-input"
                                        value={rescheduleForm.scheduledAt}
                                        onChange={e => setRescheduleForm({ ...rescheduleForm, scheduledAt: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="mi-form-field">
                                    <label className="mi-form-label">Reason / Note (optional)</label>
                                    <textarea
                                        className="mi-textarea"
                                        placeholder="Let the student know why you're rescheduling..."
                                        value={rescheduleForm.rescheduleNote}
                                        onChange={e => setRescheduleForm({ ...rescheduleForm, rescheduleNote: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div className="mi-modal-footer">
                                    <button type="button" className="mi-btn-cancel" onClick={() => setShowReschedule(null)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="mi-btn-submit">
                                        Send Reschedule
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
