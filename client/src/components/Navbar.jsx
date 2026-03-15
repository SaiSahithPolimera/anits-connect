import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, User, MessageSquare, Sparkles, LogOut, Menu, X, Shield } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/', icon: Users, label: 'Seniors' },
        { to: '/profile', icon: User, label: 'Profile' },
        { to: '/chat', icon: MessageSquare, label: 'Messages' },
        { to: '/ai', icon: Sparkles, label: 'Ask' },
        ...(user.role === 'admin' ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : [])
    ];

    return (
        <nav style={{
            background: '#fff',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{
                maxWidth: 1200,
                margin: '0 auto',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 60
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32,
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 14
                    }}>A</div>
                    <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
                        ANITS <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Connect</span>
                    </span>
                </div>

                {/* Desktop Nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px',
                                borderRadius: 8,
                                fontSize: 14, fontWeight: 500,
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                background: isActive ? 'var(--primary-50)' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all 0.2s'
                            })}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                {/* Right side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'none' }} className="desktop-only">
                        {user.email}
                    </span>
                    <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Logout"
                        style={{ color: 'var(--text-muted)' }}>
                        <LogOut size={18} />
                    </button>

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="btn btn-ghost btn-icon mobile-only"
                        style={{ display: 'none' }}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div style={{
                    borderTop: '1px solid var(--border)',
                    padding: '8px 16px',
                    background: '#fff'
                }} className="animate-fade-in">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            onClick={() => setMobileOpen(false)}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '12px 16px',
                                borderRadius: 8,
                                fontSize: 14, fontWeight: 500,
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                background: isActive ? 'var(--primary-50)' : 'transparent',
                                textDecoration: 'none'
                            })}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            )}

            <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
          .desktop-only { display: block !important; }
        }
      `}</style>
        </nav>
    );
}
