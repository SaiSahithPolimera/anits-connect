import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    Search, Users, Building2, Send,
    GraduationCap, CheckCircle, SlidersHorizontal,
    UserCheck, Sparkles
} from 'lucide-react';
import CustomSelect from '../components/ui/CustomSelect';

export default function MentorListPage() {
    const { user } = useAuth();
    const [alumni, setAlumni]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [filters, setFilters]         = useState({ branch: '', company: '', available: 'true' });
    const [requestedIds, setRequestedIds] = useState(new Set());

    useEffect(() => {
        loadAlumni();
        loadExistingRequests();
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

    const sendRequest = async (alumniUserId) => {
        try {
            await api.post('/match/mentorship/request', { alumniId: alumniUserId });
            toast.success('Mentorship request sent!');
            setRequestedIds(prev => new Set([...prev, alumniUserId]));
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to send request');
        }
    };

    const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'CSBS'];

    /* rotating avatar gradient per index */
    const avatarGradients = [
        'linear-gradient(135deg,#4338ca,#7c3aed)',
        'linear-gradient(135deg,#0891b2,#0284c7)',
        'linear-gradient(135deg,#059669,#0d9488)',
        'linear-gradient(135deg,#dc2626,#db2777)',
        'linear-gradient(135deg,#d97706,#b45309)',
        'linear-gradient(135deg,#7c3aed,#be185d)',
    ];

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
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    align-items: stretch;
                }

                /* ── Mentor card ── */
                .ml-mentor-card {
                    border: 1.5px solid #eaecf4;
                    border-radius: 14px;
                    padding: 20px;
                    background: #fafbff;
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
                    animation: mlFade 0.35s ease both;
                    height: 100%;
                }
                .ml-mentor-card:hover {
                    border-color: #c7d2fe;
                    box-shadow: 0 8px 24px rgba(67,56,202,0.08);
                    transform: translateY(-2px);
                }

                /* card top row */
                .ml-card-top {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 14px;
                }
                .ml-card-avatar {
                    width: 46px; height: 46px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: #fff;
                    font-weight: 700;
                    font-size: 17px;
                    font-family: 'Sora', sans-serif;
                    flex-shrink: 0;
                    border: 2.5px solid rgba(255,255,255,0.85);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
                }
                .ml-card-name {
                    font-family: 'Sora', sans-serif;
                    font-size: 15px;
                    font-weight: 700;
                    color: #1a1d2e;
                    margin: 0 0 3px;
                    overflow-wrap: break-word;
                    word-break: break-word;
                    line-height: 1.3;
                }
                .ml-card-role {
                    font-size: 12.5px;
                    color: #6b7280;
                    margin: 0;
                    display: flex;
                    align-items: flex-start;
                    gap: 4px;
                    overflow-wrap: break-word;
                    word-break: break-word;
                    line-height: 1.4;
                }
                .ml-card-role svg {
                    flex-shrink: 0;
                    margin-top: 2px;
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
                }

                /* meta row */
                .ml-card-meta {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 12px;
                    color: #9ca3af;
                    margin-bottom: 10px;
                }

                /* bio */
                .ml-card-bio {
                    font-size: 12.5px;
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
                    flex: 1;
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

                /* divider inside card */
                .ml-card-divider {
                    height: 1px;
                    background: #eaecf4;
                    margin: auto 0 14px;
                }

                /* action button */
                .ml-btn-request {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    padding: 10px;
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
                .ml-btn-request:hover {
                    background: #3730a3;
                    box-shadow: 0 5px 14px rgba(67,56,202,0.32);
                    transform: translateY(-1px);
                }
                .ml-btn-sent {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    padding: 10px;
                    border-radius: 9px;
                    font-size: 13px;
                    font-weight: 600;
                    font-family: 'DM Sans', sans-serif;
                    background: #f0fdf4;
                    color: #15803d;
                    border: 1.5px solid #bbf7d0;
                    cursor: default;
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
                @media (max-width: 900px) {
                    .ml-grid { grid-template-columns: repeat(2, 1fr); }
                }
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
                                        >
                                            {/* Top: avatar + name + badge */}
                                            <div className="ml-card-top">
                                                <div
                                                    className="ml-card-avatar"
                                                    style={{
                                                        background: avatarGradients[i % avatarGradients.length]
                                                    }}
                                                >
                                                    {a.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p className="ml-card-name">{a.name}</p>
                                                    <p className="ml-card-role">
                                                        <Building2 size={11} />
                                                        {a.role || 'Professional'} at {a.company || 'N/A'}
                                                    </p>
                                                </div>
                                                {a.isAvailableForMentoring && (
                                                    <span className="ml-avail-badge">Available</span>
                                                )}
                                            </div>

                                            {/* Meta */}
                                            <div className="ml-card-meta">
                                                <GraduationCap size={12} />
                                                {a.branch} — Class of {a.graduationYear || 'N/A'}
                                            </div>

                                            {/* Bio */}
                                            {a.placementExperience && (
                                                <p className="ml-card-bio">
                                                    {a.placementExperience}
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

                                            {/* Action */}
                                            {user?.role === 'student' && (
                                                <>
                                                    <div className="ml-card-divider" />
                                                    {requestedIds.has(a.userId?.toString()) ? (
                                                        <button className="ml-btn-sent" disabled>
                                                            <CheckCircle size={14} />
                                                            Request Sent
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="ml-btn-request"
                                                            onClick={() => sendRequest(a.userId)}
                                                        >
                                                            <Send size={13} />
                                                            Request Mentorship
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
            </div>
        </>
    );
}
