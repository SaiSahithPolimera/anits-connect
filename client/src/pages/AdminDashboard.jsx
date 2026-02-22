import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Shield, Users, Upload, BarChart3, UserX, UserCheck, Trash2, Search } from 'lucide-react';

export default function AdminDashboard() {
    const [tab, setTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    useEffect(() => { loadData(); }, [tab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (tab === 'users') {
                const params = new URLSearchParams();
                if (search) params.append('search', search);
                if (roleFilter) params.append('role', roleFilter);
                const res = await api.get(`/admin/users?${params.toString()}`);
                setUsers(res.data.users || []);
            } else if (tab === 'analytics') {
                const res = await api.get('/admin/analytics');
                setAnalytics(res.data.analytics);
            }
        } catch (e) { toast.error('Failed to load data'); }
        finally { setLoading(false); }
    };

    const toggleBlock = async (userId, isBlocked) => {
        try {
            await api.put(`/admin/users/${userId}`, { isBlocked: !isBlocked });
            toast.success(isBlocked ? 'User unblocked' : 'User blocked');
            loadData();
        } catch (e) { toast.error('Failed'); }
    };

    const deleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success('User deleted');
            loadData();
        } catch (e) { toast.error('Failed to delete'); }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/admin/placement-data', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Upload failed');
        }
    };

    const tabs = [
        { id: 'users', icon: Users, label: 'Users' },
        { id: 'analytics', icon: BarChart3, label: 'Analytics' },
        { id: 'data', icon: Upload, label: 'Upload Data' }
    ];

    return (
        <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                    <Shield size={24} className="text-red-400" /> Admin Panel
                </h1>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all ${tab === t.id ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-gray-400 bg-gray-900/50 border border-gray-800/50 hover:text-white'
                                }`}>
                            <t.icon size={16} /> {t.label}
                        </button>
                    ))}
                </div>

                {/* Users Tab */}
                {tab === 'users' && (
                    <>
                        <div className="flex gap-3 mb-4">
                            <div className="flex-1 relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadData()}
                                    placeholder="Search by email..." className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500" />
                            </div>
                            <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); }}
                                className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500">
                                <option value="">All Roles</option>
                                <option value="student">Students</option>
                                <option value="alumni">Alumni</option>
                                <option value="admin">Admins</option>
                            </select>
                            <button onClick={loadData} className="px-4 py-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl text-sm hover:bg-indigo-500/30">Filter</button>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-800/50">
                                        <th className="text-left p-4 text-xs text-gray-500 font-medium">User</th>
                                        <th className="text-left p-4 text-xs text-gray-500 font-medium">Role</th>
                                        <th className="text-left p-4 text-xs text-gray-500 font-medium">Status</th>
                                        <th className="text-right p-4 text-xs text-gray-500 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u, i) => (
                                        <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                                            <td className="p-4">
                                                <p className="text-sm text-white">{u.profile?.name || 'No Name'}</p>
                                                <p className="text-xs text-gray-500">{u.email}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === 'admin' ? 'bg-red-500/10 text-red-400' : u.role === 'alumni' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                                                    }`}>{u.role}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs ${u.isBlocked ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {u.isBlocked ? 'Blocked' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <button onClick={() => toggleBlock(u._id, u.isBlocked)}
                                                        className={`p-1.5 rounded-lg text-xs ${u.isBlocked ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'}`}
                                                        title={u.isBlocked ? 'Unblock' : 'Block'}>
                                                        {u.isBlocked ? <UserCheck size={14} /> : <UserX size={14} />}
                                                    </button>
                                                    {u.role !== 'admin' && (
                                                        <button onClick={() => deleteUser(u._id)}
                                                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20" title="Delete">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Analytics Tab */}
                {tab === 'analytics' && analytics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Users', value: analytics.users.total, color: 'indigo' },
                            { label: 'Students', value: analytics.users.students, color: 'blue' },
                            { label: 'Alumni', value: analytics.users.alumni, color: 'purple' },
                            { label: 'Recent Signups', value: analytics.users.recentRegistrations, color: 'emerald' },
                            { label: 'Total Interviews', value: analytics.interviews.total, color: 'yellow' },
                            { label: 'Completed', value: analytics.interviews.completed, color: 'teal' },
                            { label: 'Mentorships', value: analytics.mentorships.total, color: 'pink' },
                            { label: 'Messages', value: analytics.messages.total, color: 'orange' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 text-center">
                                <p className={`text-3xl font-bold text-${stat.color}-400`}>{stat.value}</p>
                                <p className="text-xs text-gray-400 mt-2">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload Tab */}
                {tab === 'data' && (
                    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-8 text-center">
                        <Upload size={48} className="mx-auto text-gray-600 mb-4" />
                        <h3 className="text-lg text-white font-medium mb-2">Upload Placement Data</h3>
                        <p className="text-gray-400 text-sm mb-6">Upload CSV or Excel files with placement records</p>
                        <label className="inline-flex px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium cursor-pointer hover:from-indigo-600 hover:to-purple-700 transition-all">
                            <Upload size={18} className="mr-2" /> Choose File
                            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} className="hidden" />
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}
