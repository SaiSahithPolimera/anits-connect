import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Users, User, MessageSquare, Sparkles,
    LogOut, Menu, X, Shield, Trophy,
    CalendarCheck, Bell, GraduationCap
} from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/mentors',        icon: GraduationCap, label: 'Mentors'        },
        { to: '/mock-interview', icon: CalendarCheck, label: 'Mock Interview' },
        { to: '/notifications',  icon: Bell,          label: 'Notifications'  },
        { to: '/profile',        icon: User,          label: 'Profile'        },
        { to: '/chat',           icon: MessageSquare, label: 'Messages'       },
        { to: '/ai',             icon: Sparkles,      label: 'Ask AI'         },
        { to: '/leaderboard',    icon: Trophy,        label: 'Leaderboard'    },
        ...(user.role === 'admin'
            ? [{ to: '/admin', icon: Shield, label: 'Admin' }]
            : [])
    ];

    const avatarLetter = user?.email?.[0]?.toUpperCase() || 'U';

    return (
        <>
            {/* ── Mobile top bar ── */}
            <div className="sb-mobile-bar">
                <NavLink to="/" className="sb-mobile-logo">
                    <div className="sb-logo-mark" style={{ width: 30, height: 30, fontSize: 13 }}>A</div>
                    <span className="sb-logo-text" style={{ fontSize: 14 }}>
                        ANITS <em>Connect</em>
                    </span>
                </NavLink>
                <button
                    className="sb-hamburger"
                    onClick={() => setOpen(true)}
                    aria-label="Open menu"
                >
                    <Menu size={18} />
                </button>
            </div>

            {/* ── Mobile overlay ── */}
            {open && (
                <div className="sb-overlay" onClick={() => setOpen(false)} />
            )}

            {/* ── Sidebar ── */}
            <nav className={`sb-root${open ? ' open' : ''}`}>

                {/* Logo */}
                <NavLink to="/" className="sb-logo-wrap" onClick={() => setOpen(false)}>
                    <div className="sb-logo-mark">A</div>
                    <span className="sb-logo-text">
                        ANITS <em>Connect</em>
                    </span>
                </NavLink>

                {/* User card */}
                <div className="sb-user">
                    <div className="sb-user-avatar">{avatarLetter}</div>
                    <div className="sb-user-info">
                        <p className="sb-user-email">{user.email}</p>
                        <span className="sb-user-role">{user.role}</span>
                    </div>
                </div>

                {/* Section label */}
                <p className="sb-section-label">Navigation</p>

                {/* Links */}
                <div className="sb-links">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            onClick={() => setOpen(false)}
                            className={({ isActive }) =>
                                `sb-link${isActive ? ' active' : ''}${item.label === 'Admin' ? ' sb-admin' : ''}`
                            }
                        >
                            <span className="sb-link-icon">
                                <item.icon size={16} />
                            </span>
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                {/* Sign out */}
                <div className="sb-footer">
                    <button className="sb-logout" onClick={handleLogout}>
                        <span className="sb-logout-icon">
                            <LogOut size={15} />
                        </span>
                        Sign out
                    </button>
                </div>

            </nav>
        </>
    );
}
