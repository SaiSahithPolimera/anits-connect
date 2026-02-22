import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const [form, setForm] = useState({
        email: '', password: '', confirmPassword: '', role: 'student',
        name: '', branch: '', year: '', company: '', graduationYear: ''
    });
    const [loading, setLoading] = useState(false);
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
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'CSBS'];

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-lg">
                <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 p-8 shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
                            <UserPlus className="text-white" size={28} />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Create Account</h1>
                        <p className="text-gray-400 mt-1">Join the Alumni-Student Network</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Role Selection */}
                        <div className="flex gap-3">
                            {['student', 'alumni'].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setForm({ ...form, role })}
                                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${form.role === role
                                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                                            : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    {role === 'student' ? '🎓 Student' : '🏢 Alumni'}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                                <input name="name" value={form.name} onChange={handleChange} required
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="Enter your full name" />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                <input name="email" type="email" value={form.email} onChange={handleChange} required
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="your@email.com" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                                <input name="password" type="password" value={form.password} onChange={handleChange} required
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="••••••••" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Confirm</label>
                                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="••••••••" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Branch</label>
                                <select name="branch" value={form.branch} onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors">
                                    <option value="">Select Branch</option>
                                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>

                            {form.role === 'student' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Year</label>
                                    <select name="year" value={form.year} onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors">
                                        <option value="">Select Year</option>
                                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Graduation Year</label>
                                        <input name="graduationYear" type="number" value={form.graduationYear} onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                            placeholder="2023" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Company</label>
                                        <input name="company" value={form.company} onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                            placeholder="Current company" />
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                            ) : (
                                <><UserPlus size={18} /> Create Account</>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-gray-400 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
