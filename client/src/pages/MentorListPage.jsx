import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { API_URL } from '../utils/api';
import toast from 'react-hot-toast';
import {
    Search, Users, Building2, Send,
    GraduationCap, CheckCircle, SlidersHorizontal,
    UserCheck, Sparkles, MessageSquare, Video,
    Calendar, Clock, ExternalLink, MapPin, X, RefreshCw, FileText
} from 'lucide-react';
import CustomSelect from '../components/ui/CustomSelect';

export default function MentorListPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [alumni, setAlumni]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [filters, setFilters]         = useState({ branch: '', company: '', available: 'true' });
    const [requestedIds, setRequestedIds] = useState(new Set());

    // Interview-related state (from HomePage)
    const [interviews, setInterviews]       = useState([]);
    const [showModal, setShowModal]         = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(null);
    const [selectedSenior, setSelectedSenior] = useState(null);
    const [seniorResume, setSeniorResume] = useState(null);
    const [interviewForm, setInterviewForm] = useState({ topic: '', description: '', scheduledAt: '' });
    const [rescheduleForm, setRescheduleForm] = { scheduledAt: '', rescheduleNote: '' };

    useEffect(() => {
        loadAlumni();
        loadExistingRequests();
        loadInterviews();
    }, []);

    // Dynamically update search when filters change
    useEffect(() => {
        loadAlumni();
    }, [filters.branch, filters.available]);

    const loadAlumni = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search)           params.append('search',    search);
            if (filters.branch)   params.append('branch',    filters.branch);
            if (filters.company)  params.append('company',   filters.company);
            if (filters.available) params.append('available', filters.available);
            const res = await api.get(`/match/alumni?${params.toString()}`);
            setAlumni(res.data.alumni || []);
        } catch {
            toast.error('Failed to load mentors');
        } finally {
            setLoading(false);
        }
    };

    const loadExistingRequests = async () => {
        try {
            const res = await api.get('/match/mentorship/requests');
            const ids = new Set(
                res.data.requests
                    ?.filter(r => r.status === 'pending')
                    .map(r => r.alumniId.toString()) || []
            );
            setRequestedIds(ids);
        } catch { }
    };

    const loadInterviews = async () => {
        try {
            const res = await api.get('/interviews');
            setInterviews(res.data.interviews || []);
        } catch { }
    };

    const sendRequest = async (alumniUserId) => {
        try {
            await api.post('/match/mentorship/request', { alumniId: alumniUserId });
            toast.success('Mentorship request sent!');
            setRequestedIds(prev => new Set([...prev, alumniUserId]));
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to send request');
        }
    };

    // Interview handlers (from HomePage)
    const openInterviewModal = (senior) => {
        setSelectedSenior(senior);
        setInterviewForm({ topic: '', description: '', scheduledAt: '' });
        setShowModal(true);
    };

    const openProfileModal = async (senior) => {
        setSelectedSenior(senior);
        setSeniorResume(null);
        setShowProfileModal(true);
        try {
            const res = await api.get(`/match/alumni/${senior.userId}/resume`);
            setSeniorResume(res.data);
        } catch {
            // Ignore if no resume exists
        }
    };

    const submitInterview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/interviews', {
                alumniId: selectedSenior.userId,
                topic: interviewForm.topic,
                description: interviewForm.description,
                scheduledAt: interviewForm.scheduledAt
            });
            toast.success('Interview request sent!');
            setShowModal(false);
            loadInterviews();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send request');
        }
    };

    const updateInterview = async (id, status) => {
        try {
            await api.put(`/interviews/${id}`, { status });
            toast.success(`Interview ${status}`);
            loadInterviews();
        } catch {
            toast.error('Failed to update');
        }
    };

    const rescheduleInterview = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/interviews/${showRescheduleModal}`, {
                status: 'rescheduled',
                scheduledAt: rescheduleForm.scheduledAt,
                rescheduleNote: rescheduleForm.rescheduleNote
            });
            toast.success('Interview rescheduled!');
            setShowRescheduleModal(null);
            setRescheduleForm({ scheduledAt: '', rescheduleNote: '' });
            loadInterviews();
        } catch {
            toast.error('Failed to reschedule');
        }
    };

    const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'CSBS'];

    return (
        <>
            <style>{`
                .ml-root {
                    min-height: 100vh;
                    background: #eef0f7;
                    font-family: 'DM Sans', sans-serif;
                    color: #1a1d2e;
                    animation: mlFade 0.45s ease both;
                }
                @keyframes mlFade {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* ── Hero ── full width strip */
                .ml-hero {
                    padding: 36px 0 72px;
                    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4338ca 100%);
                    position: relative;
                    overflow: hidden;
                }
                .ml-hero::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
                    background-size: 28px 28px;
                    pointer-events: none;
                }
                .ml-hero::after {
                    content: '';
                    position: absolute;
                    bottom: -1px; left: 0; right: 0;
                    height: 40px;
                    background: #eef0f7;
                    clip-path: ellipse(55% 100% at 50% 100%);
                }
                .ml-hero-inner {
                    position: relative;
                    z-index: 1;
                    max-width: 1160px;
                    margin: 0 auto;
                    padding: 0 32px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .ml-hero-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .ml-hero-icon {
                    width: 54px; height: 54px;
                    border-radius: 14px;
                    background: rgba(255,255,255,0.14);
                    border: 2px solid rgba(255,255,255,0.25);
                    display: flex; align-items: center; justify-content: center;
                    backdrop-filter: blur(8px);
                    flex-shrink: 0;
                }
                .ml-hero-title {
                    font-family: 'Sora', sans-serif;
                    font-size: 26px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 4px;
                }
                .ml-hero-sub {
                    font-size: 13px;
                    color: rgba(255,255,255,0.65);
                    margin: 0;
                }
                .ml-hero-stat {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    background: rgba(255,255,255,0.11);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: rgba(255,255,255,0.9);
                    padding: 8px 16px;
                    border-radius: 999px;
                    font-size: 13px;
                    font-weight: 500;
                    backdrop-filter: blur(8px);
                }

                /* ── Content area below hero ── */
                .ml-content {
                    max-width: 1160px;
                    margin: 0 auto;
                    padding: 28px 32px 60px;
                }

                /* ── Search card ── */
                .ml-card {
                    background: #fff;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(26,29,46,0.08);
                    border: 1px solid #eaecf4;
                    padding: 20px 20px 24px;
                    margin-bottom: 28px;
                }

                /* ── Search bar ── */
                .ml-search-row {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .ml-search-wrap {
                    flex: 1;
                    min-width: 220px;
                    position: relative;
                }
                .ml-search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9ca3af;
                    pointer-events: none;
                }
                .ml-search-input {
                    width: 100%;
                    padding: 10px 14px 10px 38px;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 10px;
                    font-size: 14px;
                    color: #1a1d2e;
                    background: #fafbff;
                    font-family: 'DM Sans', sans-serif;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .ml-search-input:focus {
                    border-color: #4338ca;
                    box-shadow: 0 0 0 3px rgba(67,56,202,0.1);
                    background: #fff;
                }
                .ml-search-input::placeholder { color: #c4c9d8; }

                .ml-select {
                    padding: 10px 14px;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 10px;
                    font-size: 14px;
                    color: #374151;
                    background: #fafbff;
                    font-family: 'DM Sans', sans-serif;
                    outline: none;
                    cursor: pointer;
                    transition: border-color 0.2s;
                    -webkit-appearance: none;
                    appearance: none;
                    min-width: 140px;
                }
                .ml-select:focus {
                    border-color: #4338ca;
                    box-shadow: 0 0 0 3px rgba(67,56,202,0.1);
                }

                .ml-search-btn {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    padding: 10px 22px;
                    background: #4338ca;
                    color: #fff;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    font-family: 'DM Sans', sans-serif;
                    cursor: pointer;
                    transition: all 0.18s;
                    white-space: nowrap;
                    box-shadow: 0 4px 12px rgba(67,56,202,0.25);
                }
                .ml-search-btn:hover {
                    background: #3730a3;
                    box-shadow: 0 6px 18px rgba(67,56,202,0.35);
                    transform: translateY(-1px);
                }

                /* ── Section title ── */
                .ml-section-title {
                    font-family: 'Sora', sans-serif;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #b0b7c9;
                    margin: 0 0 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .ml-section-title::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #eaecf4;
                }

                /* ── Grid ── */
                .ml-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 16px;
                    align-items: stretch;
                }

                /* ── Mentor card ── */
                .ml-mentor-card {
                    border: 1.5px solid #eaecf4;
                    border-radius: 14px;
                    padding: 24px;
                    background: #fff;
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
                    animation: mlFade 0.35s ease both;
                    height: 100%;
                    cursor: pointer;
                }
                .ml-mentor-card:hover {
                    border-color: #c7d2fe;
                    box-shadow: 0 8px 24px rgba(67,56,202,0.08);
                    transform: translateY(-2px);
                }

                /* card top row */
                .ml-card-top {
                    display: flex;
                    gap: 14px;
                    margin-bottom: 14px;
                }
                .ml-card-avatar {
                    width: 56px; height: 56px;
                    border-radius: 50%;
                    object-fit: cover;
                    flex-shrink: 0;
                    border: 2px solid #e5e7eb;
                }
                .ml-card-name {
                    font-family: 'Sora', sans-serif;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a1d2e;
                    margin: 0 0 2px;
                    overflow-wrap: break-word;
                    word-break: break-word;
                    line-height: 1.3;
                }
                .ml-card-role {
                    font-size: 13px;
                    color: #6b7280;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    line-height: 1.4;
                }
                .ml-card-role svg {
                    flex-shrink: 0;
                }
                .ml-card-branch {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: #9ca3af;
                    font-size: 12px;
                    margin-top: 2px;
                }
                .ml-card-branch svg {
                    flex-shrink: 0;
                }
                .ml-avail-badge {
                    margin-left: auto;
                    flex-shrink: 0;
                    padding: 3px 9px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 600;
                    background: #d1fae5;
                    color: #065f46;
                    border: 1px solid #6ee7b7;
                    white-space: nowrap;
                    align-self: flex-start;
                }

                /* bio */
                .ml-card-bio {
                    font-size: 13px;
                    color: #4b5563;
                    line-height: 1.55;
                    margin-bottom: 12px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* skills */
                .ml-skills {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                    margin-bottom: 16px;
                }
                .ml-skill-tag {
                    padding: 3px 10px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 500;
                    background: #eef2ff;
                    color: #4338ca;
                    border: 1px solid #c7d2fe;
                    font-family: 'DM Sans', sans-serif;
                }
                .ml-skill-more {
                    padding: 3px 10px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 500;
                    background: #f3f4f6;
                    color: #6b7280;
                    border: 1px solid #e5e7eb;
                }

                /* action buttons row */
                .ml-card-actions {
                    margin-top: auto;
                    padding-top: 14px;
                    border-top: 1px solid #eaecf4;
                    display: flex;
                    gap: 8px;
                }

                .ml-btn-message {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 9px;
                    border-radius: 9px;
                    font-size: 13px;
                    font-weight: 600;
                    font-family: 'DM Sans', sans-serif;
                    cursor: pointer;
                    border: none;
                    transition: all 0.18s;
                    background: #4338ca;
                    color: #fff;
                    box-shadow: 0 3px 10px rgba(67,56,202,0.22);
                }
                .ml-btn-message:hover {
                    background: #3730a3;
                    box-shadow: 0 5px 14px rgba(67,56,202,0.32);
                    transform: translateY(-1px);
                }
                .ml-btn-interview {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 9px;
                    border-radius: 9px;
                    font-size: 13px;
                    font-weight: 600;
                    font-family: 'DM Sans', sans-serif;
                    cursor: pointer;
                    border: none;
                    transition: all 0.18s;
                    background: #6366f1;
                    color: #fff;
                    box-shadow: 0 3px 10px rgba(99,102,241,0.22);
                }
                .ml-btn-interview:hover {
                    background: #4f46e5;
                    box-shadow: 0 5px 14px rgba(99,102,241,0.32);
                    transform: translateY(-1px);
                }

                /* ── Interview Requests Section ── */
                .ml-iv-section-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin: 32px 0 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-family: 'Sora', sans-serif;
                    color: #1a1d2e;
                }
                .ml-iv-card {
                    background: #fff;
                    border: 1.5px solid #eaecf4;
                    border-radius: 14px;
                    padding: 20px;
                    margin-bottom: 12px;
                    animation: mlFade 0.35s ease both;
                }
                .ml-iv-card-inner {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .ml-iv-topic {
                    font-size: 15px;
                    font-weight: 600;
                    color: #1a1d2e;
                    margin: 0;
                }
                .ml-iv-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 12px;
                    color: #9ca3af;
                }

                /* ── Loading / Empty ── */
                .ml-center {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 64px 24px;
                    gap: 14px;
                    color: #9ca3af;
                }
                .ml-spinner {
                    width: 36px; height: 36px;
                    border: 3px solid #eaecf4;
                    border-top-color: #4338ca;
                    border-radius: 50%;
                    animation: mlSpin 0.75s linear infinite;
                }
                @keyframes mlSpin { to { transform: rotate(360deg); } }

                .ml-empty-icon {
                    width: 60px; height: 60px;
                    border-radius: 16px;
                    background: #f0f2f8;
                    display: flex; align-items: center; justify-content: center;
                    color: #c4c9d8;
                }
                .ml-empty-title {
                    font-family: 'Sora', sans-serif;
                    font-size: 16px;
                    font-weight: 600;
                    color: #374151;
                    margin: 0;
                }
                .ml-empty-sub {
                    font-size: 13px;
                    color: #9ca3af;
                    margin: 0;
                    text-align: center;
                }

                /* ── Responsive ── */
                @media (max-width: 580px) {
                    .ml-hero-inner        { padding: 0 20px; }
                    .ml-hero-title        { font-size: 20px; }
                    .ml-hero-stat         { display: none; }
                    .ml-content           { padding: 20px 16px 48px; }
                    .ml-grid              { grid-template-columns: 1fr; }
                }
            `}</style>

            <div className="ml-root">

                    {/* ── Hero — full width ── */}
                    <div className="ml-hero">
                        <div className="ml-hero-inner">
                            <div className="ml-hero-left">
                                <div className="ml-hero-icon">
                                    <UserCheck size={26} color="#a5b4fc" />
                                </div>
                                <div>
                                    <h1 className="ml-hero-title">Find Mentors</h1>
                                    <p className="ml-hero-sub">
                                        Connect with experienced alumni for career guidance
                                    </p>
                                </div>
                            </div>
                            <div className="ml-hero-stat">
                                <Users size={14} />
                                <span>{alumni.length} mentors available</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Content ── */}
                    <div className="ml-content">

                        {/* Search & Filter card */}
                        <div className="ml-card">
                            <div className="ml-search-row">
                                <div className="ml-search-wrap">
                                    <span className="ml-search-icon">
                                        <Search size={15} />
                                    </span>
                                    <input
                                        className="ml-search-input"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && loadAlumni()}
                                        placeholder="Search by name, company, role, skills…"
                                    />
                                </div>

                                <div style={{ minWidth: 160 }}>
                                    <CustomSelect
                                        value={filters.branch}
                                        onChange={val => setFilters({ ...filters, branch: val })}
                                        options={branches.map(b => ({ label: b, value: b }))}
                                        placeholder="All Branches"
                                    />
                                </div>

                                <div style={{ minWidth: 160 }}>
                                    <CustomSelect
                                        value={filters.available}
                                        onChange={val => setFilters({ ...filters, available: val })}
                                        options={[{ label: 'Available only', value: 'true' }]}
                                        placeholder="All mentors"
                                    />
                                </div>

                                <button className="ml-search-btn" onClick={loadAlumni}>
                                    <Search size={14} />
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        {loading ? (
                            <div className="ml-center">
                                <div className="ml-spinner" />
                                <span style={{ fontSize: 14 }}>Finding mentors…</span>
                            </div>
                        ) : alumni.length === 0 ? (
                            <div className="ml-center">
                                <div className="ml-empty-icon">
                                    <Users size={28} />
                                </div>
                                <p className="ml-empty-title">No mentors found</p>
                                <p className="ml-empty-sub">
                                    Try adjusting your search or filters
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="ml-section-title">
                                    <Sparkles size={12} />
                                    {alumni.length} mentor{alumni.length !== 1 ? 's' : ''} found
                                </p>

                                <div className="ml-grid">
                                    {alumni.map((a, i) => (
                                        <div
                                            key={i}
                                            className="ml-mentor-card"
                                            style={{ animationDelay: `${i * 0.04}s` }}
                                            onClick={() => openProfileModal(a)}
                                        >
                                            {/* Top: avatar + name + badge */}
                                            <div className="ml-card-top">
                                                <img
                                                    src={a.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=3b82f6&color=fff&size=200`}
                                                    alt={a.name}
                                                    className="ml-card-avatar"
                                                />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p className="ml-card-name">{a.name}</p>
                                                    <p className="ml-card-role">
                                                        <Building2 size={13} />
                                                        <span>{a.role || 'Professional'} at <strong>{a.company || 'N/A'}</strong></span>
                                                    </p>
                                                    <div className="ml-card-branch">
                                                        <MapPin size={12} />
                                                        {a.branch} · Class of {a.graduationYear || 'N/A'}
                                                    </div>
                                                </div>
                                                {a.isAvailableForMentoring && (
                                                    <span className="ml-avail-badge">Available</span>
                                                )}
                                            </div>

                                            {/* Bio */}
                                            {(a.bio || a.placementExperience) && (
                                                <p className="ml-card-bio">
                                                    {a.bio || a.placementExperience}
                                                </p>
                                            )}

                                            {/* Skills */}
                                            {a.skills?.length > 0 && (
                                                <div className="ml-skills">
                                                    {a.skills.slice(0, 4).map((skill, j) => (
                                                        <span key={j} className="ml-skill-tag">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {a.skills.length > 4 && (
                                                        <span className="ml-skill-more">
                                                            +{a.skills.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Action buttons */}
                                            <div className="ml-card-actions">
                                                <button
                                                    className="ml-btn-message"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/chat/${a.userId}`); }}
                                                >
                                                    <MessageSquare size={14} /> Message
                                                </button>
                                                <button
                                                    className="ml-btn-interview"
                                                    onClick={(e) => { e.stopPropagation(); openInterviewModal(a); }}
                                                >
                                                    <Video size={14} /> Interview
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── Interview Requests ── */}
                        {interviews.length > 0 && (
                            <>
                                <h2 className="ml-iv-section-title">
                                    <Calendar size={20} style={{ color: '#6366f1' }} />
                                    Interview Requests
                                </h2>

                                {interviews.map((iv, idx) => (
                                    <div key={iv._id} className="ml-iv-card" style={{ animationDelay: `${idx * 0.04}s` }}>
                                        <div className="ml-iv-card-inner">
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <h3 className="ml-iv-topic">{iv.topic}</h3>
                                                    <span className={`badge badge-${iv.status === 'accepted' ? 'success' : iv.status === 'requested' ? 'warning' : iv.status === 'declined' ? 'danger' : iv.status === 'rescheduled' ? 'warning' : 'neutral'}`}>
                                                        {iv.status}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                                                    {user.role === 'student'
                                                        ? `With ${iv.alumniProfile?.name || 'Alumni'} (${iv.alumniProfile?.company || ''})`
                                                        : `From ${iv.studentProfile?.name || 'Student'} (${iv.studentProfile?.branch || ''})`
                                                    }
                                                </p>
                                                <div className="ml-iv-meta">
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Calendar size={12} />
                                                        {new Date(iv.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Clock size={12} />
                                                        {iv.duration || 30} min
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                                {/* Alumni can accept/reschedule/decline pending */}
                                                {user.role === 'alumni' && (iv.status === 'requested' || iv.status === 'rescheduled') && (
                                                    <>
                                                        <button className="btn btn-success btn-sm" onClick={() => updateInterview(iv._id, 'accepted')}>Accept</button>
                                                        <button className="btn btn-secondary btn-sm" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                                                            onClick={() => { setShowRescheduleModal(iv._id); setRescheduleForm({ scheduledAt: '', rescheduleNote: '' }); }}>
                                                            Reschedule
                                                        </button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => updateInterview(iv._id, 'declined')}>Decline</button>
                                                    </>
                                                )}

                                                {/* Time-aware meeting section */}
                                                {iv.status === 'accepted' && (() => {
                                                    const now = new Date();
                                                    const start = new Date(iv.scheduledAt);
                                                    const end = new Date(start.getTime() + (iv.duration || 30) * 60 * 1000);
                                                    const diffMs = start - now;
                                                    const diffHrs = Math.floor(diffMs / 3600000);
                                                    const diffMins = Math.floor((diffMs % 3600000) / 60000);

                                                    if (now < start) {
                                                        return (
                                                            <span style={{ fontSize: 12, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <Clock size={12} />
                                                                {diffHrs > 0 ? `Starts in ${diffHrs}h ${diffMins}m` : diffMins > 0 ? `Starts in ${diffMins}m` : 'Starting soon'}
                                                            </span>
                                                        );
                                                    } else if (now >= start && now <= end) {
                                                        return (
                                                            <>
                                                                <span style={{ fontSize: 12, color: '#065f46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                                                                    In Progress
                                                                </span>
                                                                {iv.meetingLink && (
                                                                    <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                                                                        <ExternalLink size={14} /> Join Meet
                                                                    </a>
                                                                )}
                                                            </>
                                                        );
                                                    } else {
                                                        return (
                                                            <span style={{ fontSize: 12, color: '#92400e' }}>Auto-completing...</span>
                                                        );
                                                    }
                                                })()}

                                                {iv.status === 'completed' && (
                                                    <span style={{ fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        ✅ Completed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
            </div>

            {/* ── Interview Request Modal ── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Request Interview</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={submitInterview}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-input)', borderRadius: 8 }}>
                                    <img src={selectedSenior?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedSenior?.name)}&background=3b82f6&color=fff`}
                                        className="avatar avatar-sm" alt="" />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedSenior?.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedSenior?.company}</div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Topic *</label>
                                    <input className="input" required placeholder="e.g., DSA Practice, System Design..."
                                        value={interviewForm.topic} onChange={e => setInterviewForm(f => ({ ...f, topic: e.target.value }))} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Description</label>
                                    <textarea className="input" rows={3} placeholder="What would you like to focus on?"
                                        value={interviewForm.description} onChange={e => setInterviewForm(f => ({ ...f, description: e.target.value }))} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Preferred Date & Time *</label>
                                    <input className="input" type="datetime-local" required
                                        value={interviewForm.scheduledAt} onChange={e => setInterviewForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                                </div>

                                <div style={{ padding: 12, background: '#eff6ff', borderRadius: 8, fontSize: 13, color: 'var(--primary-dark)' }}>
                                    📹 A unique video meeting link will be auto-generated when you send the request.
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-accent">Send Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Reschedule Modal ── */}
            {showRescheduleModal && (
                <div className="modal-overlay" onClick={() => setShowRescheduleModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <RefreshCw size={18} style={{ color: 'var(--accent)' }} />
                                Reschedule Interview
                            </h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowRescheduleModal(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={rescheduleInterview}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                                    📅 Propose a new date & time that works better for you.
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>New Date & Time *</label>
                                    <input className="input" type="datetime-local" required
                                        value={rescheduleForm.scheduledAt}
                                        onChange={e => setRescheduleForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Reason / Note (optional)</label>
                                    <textarea className="input" rows={3} placeholder="Let the student know why you're rescheduling..."
                                        value={rescheduleForm.rescheduleNote}
                                        onChange={e => setRescheduleForm(f => ({ ...f, rescheduleNote: e.target.value }))} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRescheduleModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-accent">Send Reschedule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Profile Modal ── */}
            {showProfileModal && selectedSenior && (
                <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Alumni Profile</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowProfileModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: 'grid', gap: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img src={selectedSenior.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedSenior.name)}&background=3b82f6&color=fff`}
                                    className="avatar avatar-lg" alt={selectedSenior.name} />
                                <div>
                                    <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selectedSenior.name}</h4>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>{selectedSenior.role || 'Professional'} at {selectedSenior.company}</p>
                                </div>
                            </div>

                            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                <p><strong>Branch:</strong> {selectedSenior.branch || '—'}</p>
                                <p><strong>Graduation Year:</strong> {selectedSenior.graduationYear || '—'}</p>
                                <p><strong>Bio:</strong> {selectedSenior.bio || selectedSenior.placementExperience || 'No bio yet'}</p>
                                {selectedSenior.skills && selectedSenior.skills.length > 0 && (
                                    <p><strong>Skills:</strong> {selectedSenior.skills.join(', ')}</p>
                                )}
                                
                                {seniorResume?.resumeUrl && (
                                    <div style={{ marginTop: 16 }}>
                                        <a href={seniorResume.resumeUrl.startsWith('data:') ? seniorResume.resumeUrl : `${API_URL}${seniorResume.resumeUrl}`} 
                                           download={seniorResume.resumeOriginalName || 'resume.pdf'} 
                                           target="_blank" rel="noopener noreferrer" 
                                           className="btn btn-primary btn-sm"
                                           style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                                            <FileText size={14} /> View / Download Resume
                                        </a>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
