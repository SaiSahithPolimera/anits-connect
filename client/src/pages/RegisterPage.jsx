import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, GraduationCap, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from '../components/ui/CustomSelect';

export default function RegisterPage() {
    const [form, setForm] = useState({
        email: '', password: '', confirmPassword: '', role: 'student',
        name: '', branch: '', year: '', company: '', graduationYear: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        if (form.password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }
        setLoading(true);
        try {
            await register({
                email: form.email, password: form.password, role: form.role,
                name: form.name, branch: form.branch,
                year: form.year ? parseInt(form.year) : undefined,
                company: form.company,
                graduationYear: form.graduationYear ? parseInt(form.graduationYear) : undefined
            });
            toast.success('Registration successful!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'CSD', 'CSM'];

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
                width: '100%', maxWidth: 480,
                background: '#fff',
                borderRadius: 20,
                boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '36px 32px 24px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    color: '#fff',
                    borderRadius: '20px 20px 0 0'
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
                    <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Create Account</h1>
                    <p style={{ fontSize: 14, opacity: 0.85 }}>Join the Alumni-Student Network</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '28px 32px 16px' }}>
                    {/* Role Selection */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>I am a</label>
                        <div style={{ display: 'flex', gap: 12 }}>
                            {[
                                { value: 'student', label: '🎓 Student', desc: 'Looking for mentors' },
                                { value: 'alumni', label: '🏢 Alumni', desc: 'Ready to mentor' }
                            ].map((role) => (
                                <button
                                    key={role.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, role: role.value })}
                                    style={{
                                        flex: 1,
                                        padding: '16px 12px',
                                        borderRadius: 12,
                                        border: `2px solid ${form.role === role.value ? 'var(--primary)' : 'var(--border)'}`,
                                        background: form.role === role.value ? 'rgba(59, 130, 246, 0.05)' : '#fff',
                                        color: form.role === role.value ? 'var(--primary)' : 'var(--text-secondary)',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ fontSize: 16, marginBottom: 4 }}>{role.label}</div>
                                    <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>{role.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Full Name</label>
                            <input className="input" name="name" value={form.name} onChange={handleChange} required placeholder="Your full name" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Email</label>
                            <input className="input" type="email" name="email" value={form.email} onChange={handleChange} required placeholder="your@email.com" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input className="input" type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required placeholder="••••••••" style={{ paddingRight: 36 }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input className="input" type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required placeholder="••••••••" style={{ paddingRight: 36 }} />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {form.role === 'student' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Branch</label>
                                <CustomSelect 
                                    value={form.branch} 
                                    onChange={(val) => setForm({ ...form, branch: val })} 
                                    options={branches.map(b => ({ label: b, value: b }))} 
                                    placeholder="Select branch"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Year</label>
                                <CustomSelect 
                                    value={form.year} 
                                    onChange={(val) => setForm({ ...form, year: val })} 
                                options={[1, 2, 3, 4].map(y => ({ label: `${y}${y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year`, value: String(y) }))} 
                                    placeholder="Select year"
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Company</label>
                                <input className="input" name="company" value={form.company} onChange={handleChange} required placeholder="Your company" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Graduation Year</label>
                                <input className="input" type="number" name="graduationYear" value={form.graduationYear} onChange={handleChange} required placeholder="2023" />
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
                        style={{ width: '100%', fontWeight: 600, fontSize: 15, marginBottom: 16 }}>
                        {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><UserPlus size={18} /> Create Account</>}
                    </button>
                </form>

                {/* Sign In Link */}
                <div style={{ padding: '0 32px 28px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                        <a href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                            Sign In
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
