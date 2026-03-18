import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Bell, CheckCheck, Users, CalendarCheck, MessageSquare, Star, Award, Info } from 'lucide-react';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading]             = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications || []);
        } catch { } finally { setLoading(false); }
    };

    const markRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
        } catch { }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch { }
    };

    /* icon + color per type */
    const typeConfig = {
        mentorship_request:  { Icon: Users,          bg: '#eef2ff', color: '#4338ca' },
        mentorship_accepted: { Icon: Users,          bg: '#d1fae5', color: '#059669' },
        mentorship_rejected: { Icon: Users,          bg: '#fee2e2', color: '#dc2626' },
        interview_request:   { Icon: CalendarCheck,  bg: '#fef3c7', color: '#d97706' },
        interview_accepted:  { Icon: CalendarCheck,  bg: '#d1fae5', color: '#059669' },
        interview_declined:  { Icon: CalendarCheck,  bg: '#fee2e2', color: '#dc2626' },
        new_message:         { Icon: MessageSquare,  bg: '#eff6ff', color: '#2563eb' },
        feedback_received:   { Icon: Star,           bg: '#fef3c7', color: '#d97706' },
        badge_earned:        { Icon: Award,          bg: '#f5f3ff', color: '#7c3aed' },
        system:              { Icon: Info,           bg: '#f0f2f8', color: '#6b7280' },
    };

    const getConfig = (type) =>
        typeConfig[type] || { Icon: Bell, bg: '#f0f2f8', color: '#6b7280' };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1)    return 'Just now';
        if (diffMins < 60)   return `${diffMins}m ago`;
        if (diffHours < 24)  return `${diffHours}h ago`;
        if (diffDays < 7)    return `${diffDays}d ago`;
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <>
            <style>{`
                .nf-root {
                    min-height: 100vh;
                    background: #eef0f7;
                    font-family: 'DM Sans', sans-serif;
                    color: #1a1d2e;
                    animation: nfFade 0.45s ease both;
                }
                @keyframes nfFade {
                    from { opacity:0; transform:translateY(16px); }
                    to   { opacity:1; transform:translateY(0); }
                }

                /* ── Full-width hero ── */
                .nf-hero {
                    padding: 36px 0 72px;
                    background: linear-gradient(135deg,#1e1b4b 0%,#312e81 45%,#4338ca 100%);
                    position: relative;
                    overflow: hidden;
                }
                .nf-hero::before {
                    content:'';
                    position:absolute; inset:0;
                    background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
                    background-size: 28px 28px;
                    pointer-events: none;
                }
                .nf-hero::after {
                    content:'';
                    position:absolute;
                    bottom:-1px; left:0; right:0;
                    height:40px;
                    background:#eef0f7;
                    clip-path: ellipse(55% 100% at 50% 100%);
                }
                .nf-hero-inner {
                    position:relative; z-index:1;
                    max-width:720px; margin:0 auto; padding:0 32px;
                    display:flex; align-items:center;
                    justify-content:space-between; flex-wrap:wrap; gap:14px;
                }
                .nf-hero-left {
                    display:flex; align-items:center; gap:16px;
                }
                .nf-hero-icon {
                    width:54px; height:54px; border-radius:14px;
                    background:rgba(255,255,255,0.14);
                    border:2px solid rgba(255,255,255,0.25);
                    display:flex; align-items:center; justify-content:center;
                    backdrop-filter:blur(8px); flex-shrink:0;
                }
                .nf-hero-title {
                    font-family:'Sora',sans-serif;
                    font-size:26px; font-weight:700; color:#fff; margin:0 0 4px;
                }
                .nf-hero-sub { font-size:13px; color:rgba(255,255,255,0.65); margin:0; }
                .nf-unread-badge {
                    display:inline-flex; align-items:center; gap:7px;
                    background:rgba(255,255,255,0.11);
                    border:1px solid rgba(255,255,255,0.2);
                    color:rgba(255,255,255,0.9);
                    padding:8px 16px; border-radius:999px;
                    font-size:13px; font-weight:500;
                    backdrop-filter:blur(8px);
                }

                /* ── Content ── */
                .nf-content {
                    max-width:720px; margin:0 auto;
                    padding:28px 32px 60px;
                }

                /* toolbar */
                .nf-toolbar {
                    display:flex; align-items:center;
                    justify-content:space-between; margin-bottom:20px;
                    flex-wrap:wrap; gap:10px;
                }
                .nf-section-title {
                    font-family:'Sora',sans-serif;
                    font-size:11px; font-weight:600;
                    text-transform:uppercase; letter-spacing:0.1em;
                    color:#b0b7c9; margin:0;
                    display:flex; align-items:center; gap:8px;
                }
                .nf-mark-all-btn {
                    display:flex; align-items:center; gap:6px;
                    padding:7px 14px; border-radius:8px;
                    border:1.5px solid #c7d2fe; background:#eef2ff;
                    color:#4338ca; font-size:12.5px; font-weight:600;
                    font-family:'DM Sans',sans-serif;
                    cursor:pointer; transition:all 0.15s;
                }
                .nf-mark-all-btn:hover { background:#e0e7ff; border-color:#a5b4fc; }

                /* ── Notification item ── */
                .nf-item {
                    display:flex; align-items:flex-start; gap:14px;
                    padding:16px 18px;
                    border-radius:14px;
                    border:1.5px solid #eaecf4;
                    background:#fff;
                    margin-bottom:10px;
                    cursor:pointer;
                    transition:all 0.18s;
                    position:relative;
                    animation:nfFade 0.3s ease both;
                }
                .nf-item:hover {
                    border-color:#c7d2fe;
                    box-shadow:0 4px 16px rgba(67,56,202,0.07);
                    transform:translateX(3px);
                }
                .nf-item.unread {
                    background:#fafbff;
                    border-color:#c7d2fe;
                }
                .nf-item.unread::before {
                    content:'';
                    position:absolute;
                    left:0; top:16px; bottom:16px;
                    width:3px;
                    background:#4338ca;
                    border-radius:0 3px 3px 0;
                }

                /* icon bubble */
                .nf-icon-bubble {
                    width:40px; height:40px; border-radius:10px;
                    display:flex; align-items:center; justify-content:center;
                    flex-shrink:0; margin-top:1px;
                }

                /* text */
                .nf-body { flex:1; min-width:0; }
                .nf-title {
                    font-size:14px; font-weight:600; color:#1a1d2e;
                    margin:0 0 3px; line-height:1.4;
                }
                .nf-title.read { color:#6b7280; font-weight:500; }
                .nf-message {
                    font-size:13px; color:#6b7280;
                    margin:0 0 6px; line-height:1.5;
                }
                .nf-time {
                    font-size:11.5px; color:#b0b7c9;
                    margin:0;
                }

                /* unread dot */
                .nf-dot {
                    width:8px; height:8px; border-radius:50%;
                    background:#4338ca; flex-shrink:0; margin-top:6px;
                    box-shadow:0 0 0 3px rgba(67,56,202,0.15);
                }

                /* ── Loading / Empty ── */
                .nf-center {
                    display:flex; flex-direction:column;
                    align-items:center; justify-content:center;
                    padding:64px 24px; gap:14px; color:#9ca3af;
                    text-align:center;
                }
                .nf-spinner {
                    width:36px; height:36px;
                    border:3px solid #eaecf4;
                    border-top-color:#4338ca;
                    border-radius:50%;
                    animation:nfSpin 0.75s linear infinite;
                }
                @keyframes nfSpin { to { transform:rotate(360deg); } }
                .nf-empty-icon {
                    width:64px; height:64px; border-radius:18px;
                    background:#f0f2f8;
                    display:flex; align-items:center; justify-content:center;
                    color:#c4c9d8;
                }

                /* date group label */
                .nf-date-group {
                    font-size:11px; font-weight:600;
                    text-transform:uppercase; letter-spacing:0.08em;
                    color:#9ca3af; margin:20px 0 10px;
                    padding:0 4px;
                }
                .nf-date-group:first-child { margin-top:0; }

                @media (max-width:580px) {
                    .nf-hero-inner  { padding:0 20px; }
                    .nf-hero-title  { font-size:20px; }
                    .nf-content     { padding:20px 16px 48px; }
                    .nf-unread-badge{ display:none; }
                }
            `}</style>

            <div className="nf-root">

                {/* ── Hero ── */}
                <div className="nf-hero">
                    <div className="nf-hero-inner">
                        <div className="nf-hero-left">
                            <div className="nf-hero-icon">
                                <Bell size={26} color="#fbbf24" />
                            </div>
                            <div>
                                <h1 className="nf-hero-title">Notifications</h1>
                                <p className="nf-hero-sub">
                                    Stay updated on your activity
                                </p>
                            </div>
                        </div>
                        <div className="nf-unread-badge">
                            <Bell size={13} />
                            {unreadCount > 0
                                ? `${unreadCount} unread`
                                : 'All caught up'}
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="nf-content">

                    {loading ? (
                        <div className="nf-center">
                            <div className="nf-spinner" />
                            <span style={{ fontSize: 14 }}>Loading notifications…</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="nf-center">
                            <div className="nf-empty-icon">
                                <Bell size={30} />
                            </div>
                            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>
                                You're all caught up!
                            </p>
                            <p style={{ fontSize: 13, margin: 0 }}>
                                No notifications yet. We'll let you know when something happens.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Toolbar */}
                            <div className="nf-toolbar">
                                <p className="nf-section-title">
                                    <Bell size={12} />
                                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                                </p>
                                {unreadCount > 0 && (
                                    <button className="nf-mark-all-btn" onClick={markAllRead}>
                                        <CheckCheck size={14} />
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* List */}
                            {notifications.map((n, i) => {
                                const cfg = getConfig(n.type);
                                const { Icon } = cfg;
                                return (
                                    <div
                                        key={i}
                                        className={`nf-item${!n.isRead ? ' unread' : ''}`}
                                        onClick={() => !n.isRead && markRead(n._id)}
                                        style={{ animationDelay: `${i * 0.03}s` }}
                                    >
                                        {/* Icon bubble */}
                                        <div
                                            className="nf-icon-bubble"
                                            style={{ background: cfg.bg }}
                                        >
                                            <Icon size={18} color={cfg.color} />
                                        </div>

                                        {/* Text */}
                                        <div className="nf-body">
                                            <p className={`nf-title${n.isRead ? ' read' : ''}`}>
                                                {n.title}
                                            </p>
                                            <p className="nf-message">{n.message}</p>
                                            <p className="nf-time">{formatTime(n.createdAt)}</p>
                                        </div>

                                        {/* Unread dot */}
                                        {!n.isRead && <div className="nf-dot" />}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
