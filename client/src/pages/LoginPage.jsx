import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = (em, pw) => {
        setEmail(em);
        setPassword(pw);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #f0f9ff 100%)',
            padding: 24
        }}>
            <div className="animate-scale-in" style={{
                width: '100%', maxWidth: 420,
                background: '#fff',
                borderRadius: 20,
                boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '36px 32px 24px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    color: '#fff'
                }}>
                    <div style={{
                        width: 52, height: 52,
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <GraduationCap size={28} />
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>ANITS Connect</h1>
                    <p style={{ fontSize: 14, opacity: 0.85 }}>Alumni-Student Mentoring Platform</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '28px 32px 16px' }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Email</label>
                        <input className="input" type="email" required placeholder="Enter your email"
                            value={email} onChange={e => setEmail(e.target.value)} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input className="input" type={showPass ? 'text' : 'password'} required placeholder="Enter password"
                                value={password} onChange={e => setPassword(e.target.value)}
                                style={{ paddingRight: 40 }} />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                style={{
                                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4
                                }}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
                        style={{ width: '100%', fontWeight: 600, fontSize: 15 }}>
                        {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><LogIn size={18} /> Sign In</>}
                    </button>
                </form>

                {/* Sign Up Link */}
                <div style={{ padding: '0 32px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                        Don't have an account?{' '}
                        <a href="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                            Sign Up
                        </a>
                    </p>
                </div>

                {/* Demo Credentials */}
                <div style={{ padding: '0 32px 28px' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 12 }}>
                        Quick login with demo accounts
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[
                            { label: '👨‍🎓 Student', email: 'saisahithpolimera769@gmail.com', pw: 'Sai@360.', color: '#3b82f6' },
                            { label: '👩‍💼 Alumni', email: 'tejesk916@gmail.com', pw: 'Infosys123', color: '#8b5cf6' },
                        ].map(d => (
                            <button key={d.email} type="button" className="btn btn-secondary btn-sm"
                                onClick={() => quickLogin(d.email, d.pw)}
                                style={{ width: '100%', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ fontWeight: 600, color: d.color }}>{d.label}</span>
                                <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11 }}>{d.email}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
