import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
    MessageSquare, Video, Building2, GraduationCap,
    Calendar, Clock, ExternalLink, Plus, X, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

const MEET_LINK = 'https://meet.google.com/rpq-oeit-ces';

export default function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [seniors, setSeniors] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedSenior, setSelectedSenior] = useState(null);
    const [interviewForm, setInterviewForm] = useState({ topic: '', description: '', scheduledAt: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profilesRes, interviewsRes] = await Promise.all([
                api.get('/profiles?role=alumni'),
                api.get('/interviews')
            ]);
            setSeniors(profilesRes.data.profiles || profilesRes.data || []);
            setInterviews(interviewsRes.data.interviews || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openInterviewModal = (senior) => {
        setSelectedSenior(senior);
        setInterviewForm({ topic: '', description: '', scheduledAt: '' });
        setShowModal(true);
    };

    const openProfileModal = (senior) => {
        setSelectedSenior(senior);
        setShowProfileModal(true);
    };

    const submitInterview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/interviews', {
                alumniId: selectedSenior.userId,
                topic: interviewForm.topic,
                description: interviewForm.description,
                scheduledAt: interviewForm.scheduledAt,
                meetingLink: MEET_LINK
            });
            toast.success('Interview request sent!');
            setShowModal(false);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send request');
        }
    };

    const updateInterview = async (id, status) => {
        try {
            await api.put(`/interviews/${id}`, { status, meetingLink: MEET_LINK });
            toast.success(`Interview ${status}`);
            loadData();
        } catch (err) {
            toast.error('Failed to update');
        }
    };

    if (loading) return (
        <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div className="spinner" />
        </div>
    );

    return (
        <div className="page">
            {/* Header */}
            <div className="animate-fade-in" style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
                    Welcome back{user?.profile?.name ? `, ${user.profile.name.split(' ')[0]}` : ''} 👋
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                    Connect with alumni mentors and schedule mock interviews
                </p>
            </div>

            {/* Seniors Grid */}
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={20} style={{ color: 'var(--primary)' }} />
                Alumni Mentors
            </h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 16,
                marginBottom: 40
            }}>
                {seniors.map((senior, idx) => (
                    <div
                        key={senior._id}
                        className={`card card-interactive animate-fade-in-up stagger-${idx + 1}`}
                        style={{ padding: 24, cursor: 'pointer' }}
                        onClick={() => openProfileModal(senior)}
                    >
                        {/* Senior Header */}
                        <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                            <img
                                src={senior.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senior.name)}&background=3b82f6&color=fff&size=200`}
                                alt={senior.name}
                                className="avatar avatar-lg"
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{senior.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 13 }}>
                                    <Building2 size={13} />
                                    <span>{senior.role} at <strong>{senior.company}</strong></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                                    <MapPin size={12} />
                                    {senior.branch} · Class of {senior.graduationYear}
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        {senior.bio && (
                            <p style={{
                                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
                                marginBottom: 12,
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                            }}>
                                {senior.bio}
                            </p>
                        )}

                        {/* Skills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
                            {(senior.skills || []).slice(0, 4).map(skill => (
                                <span key={skill} className="tag">{skill}</span>
                            ))}
                            {(senior.skills || []).length > 4 && (
                                <span className="tag" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                    +{senior.skills.length - 4}
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                className="btn btn-primary btn-sm"
                                style={{ flex: 1 }}
                                onClick={(e) => { e.stopPropagation(); navigate(`/chat/${senior.userId}`); }}
                            >
                                <MessageSquare size={15} /> Message
                            </button>
                            <button
                                className="btn btn-accent btn-sm"
                                style={{ flex: 1 }}
                                onClick={(e) => { e.stopPropagation(); openInterviewModal(senior); }}
                            >
                                <Video size={15} /> Interview
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Interview Requests */}
            {interviews.length > 0 && (
                <>
                    <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={20} style={{ color: 'var(--accent)' }} />
                        Interview Requests
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                        {interviews.map((iv, idx) => (
                            <div key={iv._id} className={`card animate-fade-in stagger-${idx + 1}`} style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <h3 style={{ fontSize: 15, fontWeight: 600 }}>{iv.topic}</h3>
                                            <span className={`badge badge-${iv.status === 'accepted' ? 'success' : iv.status === 'requested' ? 'warning' : iv.status === 'declined' ? 'danger' : 'neutral'}`}>
                                                {iv.status}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                            {user.role === 'student'
                                                ? `With ${iv.alumniProfile?.name || 'Alumni'} (${iv.alumniProfile?.company || ''})`
                                                : `From ${iv.studentProfile?.name || 'Student'} (${iv.studentProfile?.branch || ''})`
                                            }
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
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

                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        {/* Alumni can accept/decline pending */}
                                        {user.role === 'alumni' && iv.status === 'requested' && (
                                            <>
                                                <button className="btn btn-success btn-sm" onClick={() => updateInterview(iv._id, 'accepted')}>Accept</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => updateInterview(iv._id, 'declined')}>Decline</button>
                                            </>
                                        )}
                                        {/* Join link for accepted */}
                                        {iv.status === 'accepted' && (
                                            <a href={iv.meetingLink || MEET_LINK} target="_blank" rel="noreferrer"
                                                className="btn btn-primary btn-sm">
                                                <ExternalLink size={14} /> Join Meet
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Interview Request Modal */}
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
                                    📹 Google Meet: <a href={MEET_LINK} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{MEET_LINK}</a>
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
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>{selectedSenior.role} at {selectedSenior.company}</p>
                                </div>
                            </div>

                            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                <p><strong>Branch:</strong> {selectedSenior.branch || '—'}</p>
                                <p><strong>Graduation Year:</strong> {selectedSenior.graduationYear || '—'}</p>
                                <p><strong>Bio:</strong> {selectedSenior.bio || 'No bio yet'}</p>
                                {selectedSenior.skills && selectedSenior.skills.length > 0 && (
                                    <p><strong>Skills:</strong> {selectedSenior.skills.join(', ')}</p>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
