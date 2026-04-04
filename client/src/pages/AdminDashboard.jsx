import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Shield, Users, Upload, BarChart3, UserX, UserCheck, Trash2, Search, Filter, MoreVertical, Eye, Ban, CheckCircle, X, Mail, Phone, Calendar, MapPin, Building2, GraduationCap, Award, ExternalLink, Clock, FileText, Database, RefreshCw, AlertTriangle, FileUp, Layers, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import CustomSelect from '../components/ui/CustomSelect';

export default function AdminDashboard() {
    const [tab, setTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [ragStatus, setRagStatus] = useState(null);
    const [ragStatusLoading, setRagStatusLoading] = useState(false);
    const [kbDocuments, setKbDocuments] = useState([]);
    const [kbStats, setKbStats] = useState({ totalRecords: 0, totalDocuments: 0 });
    const [kbLoading, setKbLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const [expandedDoc, setExpandedDoc] = useState(null);
    const [duplicateDialog, setDuplicateDialog] = useState({ isOpen: false, file: null });
    const fileInputRef = useRef(null);

    // Initial load
    useEffect(() => { loadData(); }, [tab]);

    // Dynamic search filtering
    useEffect(() => {
        if (tab === 'users') loadData();
    }, [search, roleFilter]);

    useEffect(() => {
        if (tab !== 'data') return;

        loadRagStatus(true);
        loadKnowledgeBase();
        const intervalId = setInterval(() => loadRagStatus(), 5000);
        return () => clearInterval(intervalId);
    }, [tab]);

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

    const changeRole = async (userId, newRole) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Confirm Role Change',
            message: `Are you sure you want to change this user's role to ${newRole}?`,
            onConfirm: async () => {
                try {
                    await api.put(`/admin/users/${userId}`, { role: newRole });
                    toast.success(`Role changed to ${newRole}`);
                    loadData();
                } catch (e) { toast.error('Failed to change role'); }
            }
        });
    };

    const deleteUser = async (userId) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete User',
            message: 'Are you sure you want to delete this user? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/users/${userId}`);
                    toast.success('User deleted');
                    loadData();
                } catch (e) { toast.error('Failed to delete'); }
            }
        });
    };

    const viewUserDetails = (user) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    const loadRagStatus = async (showLoader = false) => {
        if (showLoader) setRagStatusLoading(true);
        try {
            const res = await api.get('/admin/rag-status');
            setRagStatus(res.data.status || null);
        } catch (e) {
            if (showLoader) toast.error('Failed to fetch RAG status');
        } finally {
            if (showLoader) setRagStatusLoading(false);
        }
    };

    const loadKnowledgeBase = async () => {
        setKbLoading(true);
        try {
            const res = await api.get('/admin/knowledge-base');
            setKbDocuments(res.data.documents || []);
            setKbStats({ totalRecords: res.data.totalRecords, totalDocuments: res.data.totalDocuments });
        } catch (e) { /* silent fail, will show empty */ }
        finally { setKbLoading(false); }
    };

    const uploadFile = async (file, replaceExisting = false) => {
        if (!file) return;
        const allowed = ['.pdf', '.csv', '.xlsx', '.xls'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowed.includes(ext)) {
            toast.error('Only PDF, CSV, and Excel files are allowed.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size exceeds 10MB limit.');
            return;
        }
        if (file.size === 0) {
            toast.error('The file is empty (0 bytes).');
            return;
        }

        // Check for duplicate
        if (!replaceExisting) {
            const existing = kbDocuments.find(d => d.sourceFile === file.name);
            if (existing) {
                setDuplicateDialog({ isOpen: true, file });
                return;
            }
        }

        setUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('replaceExisting', replaceExisting ? 'true' : 'false');
        try {
            const res = await api.post('/admin/placement-data', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
                }
            });
            toast.success(res.data.message);
            if (res.data.warning) toast(res.data.warning, { icon: '⚠️', duration: 8000 });
            loadKnowledgeBase();
            loadRagStatus(true);
        } catch (error) {
            const errMsg = error.response?.data?.details || error.response?.data?.error || 'Upload failed';
            toast.error(errMsg, { duration: 8000 });
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUpload = (e) => uploadFile(e.target.files[0]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) uploadFile(file);
    }, [kbDocuments]);

    const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
    const handleDragLeave = useCallback(() => setDragOver(false), []);

    const deleteDocument = (sourceFile) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Document',
            message: `Remove all indexed data from "${sourceFile}"? This will delete all chunks from this file and trigger a RAG rebuild.`,
            onConfirm: async () => {
                try {
                    const res = await api.delete(`/admin/knowledge-base/${encodeURIComponent(sourceFile)}`);
                    toast.success(res.data.message);
                    loadKnowledgeBase();
                    loadRagStatus(true);
                } catch (e) { toast.error('Failed to delete document.'); }
            }
        });
    };

    const triggerRebuild = async () => {
        try {
            const res = await api.post('/admin/rag-rebuild');
            toast.success(res.data.message);
            loadRagStatus(true);
        } catch (e) { toast.error('Failed to trigger rebuild.'); }
    };

    const getRagStateColor = (state) => {
        if (state === 'running') return 'var(--warning)';
        if (state === 'queued') return 'var(--accent)';
        if (state === 'error') return 'var(--danger)';
        return 'var(--success)';
    };

    const formatDateTime = (value) => {
        if (!value) return 'N/A';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return 'N/A';
        return d.toLocaleString();
    };

    const formatDuration = (value) => {
        if (typeof value !== 'number') return 'N/A';
        return `${(value / 1000).toFixed(1)}s`;
    };

    const tabs = [
        { id: 'users', icon: Users, label: 'Users' },
        { id: 'analytics', icon: BarChart3, label: 'Analytics' },
        { id: 'data', icon: Database, label: 'Knowledge Base' }
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80, paddingBottom: 40 }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{
                            width: 48, height: 48,
                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            borderRadius: 'var(--radius)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff'
                        }}>
                            <Shield size={24} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                                Admin Panel
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                                Manage users, view analytics, and upload data
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex', gap: 8, marginBottom: 32,
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: 8
                }}>
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '12px 20px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 14, fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all var(--transition)',
                                background: tab === t.id ? 'var(--primary)' : 'transparent',
                                color: tab === t.id ? '#fff' : 'var(--text-secondary)',
                                boxShadow: tab === t.id ? '0 2px 8px rgba(37,99,235,0.2)' : 'none'
                            }}
                        >
                            <t.icon size={18} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Users Tab */}
                {tab === 'users' && (
                    <div className="card" style={{ padding: 0 }}>
                        {/* Search and Filter */}
                        <div style={{
                            padding: 24,
                            borderBottom: '1px solid var(--border)',
                            display: 'flex', gap: 16, alignItems: 'center'
                        }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search size={16} style={{
                                    position: 'absolute', left: 12, top: '50%',
                                    transform: 'translateY(-50%)', color: 'var(--text-muted)'
                                }} />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && loadData()}
                                    placeholder="Search by name or email..."
                                    style={{
                                        width: '100%', padding: '12px 12px 12px 40px',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: 14,
                                        background: 'var(--bg-input)',
                                        color: 'var(--text)'
                                    }}
                                />
                            </div>
                            <div style={{ minWidth: 160 }}>
                                <CustomSelect
                                    value={roleFilter}
                                    onChange={val => setRoleFilter(val)}
                                    options={[
                                        { label: 'Students', value: 'student' },
                                        { label: 'Alumni', value: 'alumni' },
                                        { label: 'Admins', value: 'admin' }
                                    ]}
                                    placeholder="All Roles"
                                />
                            </div>
                            <button
                                onClick={loadData}
                                className="btn btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <Filter size={16} />
                                Filter
                            </button>
                        </div>

                        {/* Users Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <th style={{
                                            textAlign: 'left', padding: '16px 24px',
                                            fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                                            textTransform: 'uppercase', letterSpacing: 0.5
                                        }}>User</th>
                                        <th style={{
                                            textAlign: 'left', padding: '16px 24px',
                                            fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                                            textTransform: 'uppercase', letterSpacing: 0.5
                                        }}>Role</th>
                                        <th style={{
                                            textAlign: 'left', padding: '16px 24px',
                                            fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                                            textTransform: 'uppercase', letterSpacing: 0.5
                                        }}>Status</th>
                                        <th style={{
                                            textAlign: 'right', padding: '16px 24px',
                                            fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                                            textTransform: 'uppercase', letterSpacing: 0.5
                                        }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u, i) => (
                                        <tr key={i} style={{
                                            borderBottom: '1px solid var(--border-light)',
                                            transition: 'background var(--transition)'
                                        }}
                                            onMouseEnter={(e) => e.target.closest('tr').style.background = 'var(--bg-hover)'}
                                            onMouseLeave={(e) => e.target.closest('tr').style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '20px 24px' }}>
                                                <div
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 12,
                                                        cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                                                        padding: '4px', transition: 'background var(--transition)'
                                                    }}
                                                    onClick={() => viewUserDetails(u)}
                                                    onMouseEnter={(e) => e.target.closest('div').style.background = 'var(--bg-hover)'}
                                                    onMouseLeave={(e) => e.target.closest('div').style.background = 'transparent'}
                                                    title="Click to view details"
                                                >
                                                    <img
                                                        src={u.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.profile?.name || u.email)}&background=3b82f6&color=fff&size=200`}
                                                        alt={u.profile?.name || u.email}
                                                        style={{
                                                            width: 40, height: 40, borderRadius: '50%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                    <div>
                                                        <p style={{
                                                            fontSize: 14, fontWeight: 600,
                                                            color: 'var(--text)', marginBottom: 2
                                                        }}>
                                                            {u.profile?.name || 'No Name'}
                                                        </p>
                                                        <p style={{
                                                            fontSize: 12, color: 'var(--text-muted)'
                                                        }}>
                                                            {u.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center',
                                                    padding: '4px 12px',
                                                    borderRadius: 20,
                                                    fontSize: 12, fontWeight: 500,
                                                    background: u.role === 'admin' ? 'var(--danger)' :
                                                        u.role === 'alumni' ? 'var(--primary)' : 'var(--success)',
                                                    color: '#fff'
                                                }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {u.isBlocked ? (
                                                        <>
                                                            <Ban size={16} style={{ color: 'var(--danger)' }} />
                                                            <span style={{ color: 'var(--danger)', fontSize: 14, fontWeight: 500 }}>
                                                                Blocked
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                                                            <span style={{ color: 'var(--success)', fontSize: 14, fontWeight: 500 }}>
                                                                Active
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => viewUserDetails(u)}
                                                        className="btn btn-ghost btn-sm"
                                                        style={{ color: 'var(--primary)', padding: '8px' }}
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleBlock(u._id, u.isBlocked)}
                                                        className="btn btn-ghost btn-sm"
                                                        style={{
                                                            color: u.isBlocked ? 'var(--success)' : 'var(--warning)',
                                                            padding: '8px'
                                                        }}
                                                        title={u.isBlocked ? 'Unblock' : 'Block'}
                                                    >
                                                        {u.isBlocked ? <UserCheck size={16} /> : <UserX size={16} />}
                                                    </button>
                                                    {u.role !== 'admin' && (
                                                        <button
                                                            onClick={() => changeRole(u._id, 'admin')}
                                                            className="btn btn-ghost btn-sm"
                                                            style={{ color: 'var(--accent)', padding: '8px' }}
                                                            title="Make Admin"
                                                        >
                                                            <Shield size={16} />
                                                        </button>
                                                    )}
                                                    {u.role === 'admin' && (
                                                        <button
                                                            onClick={() => changeRole(u._id, 'alumni')}
                                                            className="btn btn-ghost btn-sm"
                                                            style={{ color: 'var(--warning)', padding: '8px' }}
                                                            title="Remove Admin (Set as Alumni)"
                                                        >
                                                            <Shield size={16} />
                                                        </button>
                                                    )}
                                                    {u.role !== 'admin' && (
                                                        <button
                                                            onClick={() => deleteUser(u._id)}
                                                            className="btn btn-ghost btn-sm"
                                                            style={{ color: 'var(--danger)', padding: '8px' }}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {users.length === 0 && !loading && (
                            <div style={{
                                padding: 48, textAlign: 'center',
                                color: 'var(--text-muted)'
                            }}>
                                <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                                <p>No users found</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Analytics Tab */}
                {tab === 'analytics' && analytics && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* 4 Stat Cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 24
                        }}>
                            {[
                                { label: 'Total Users', value: analytics.users.total, color: 'var(--primary)', icon: Users },
                                { label: 'Students', value: analytics.users.students, color: 'var(--success)', icon: GraduationCap },
                                { label: 'Alumni', value: analytics.users.alumni, color: 'var(--accent)', icon: Award },
                                { label: 'Total Interviews', value: analytics.interviews.total, color: 'var(--warning)', icon: Calendar }
                            ].map((stat, i) => (
                                <div key={i} className="card" style={{
                                    padding: 24, textAlign: 'center',
                                    background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}08)`
                                }}>
                                    <div style={{
                                        width: 56, height: 56,
                                        background: stat.color,
                                        borderRadius: 'var(--radius)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 16px',
                                        color: '#fff'
                                    }}>
                                        <stat.icon size={24} />
                                    </div>
                                    <p style={{
                                        fontSize: 32, fontWeight: 700,
                                        color: stat.color, marginBottom: 8
                                    }}>
                                        {stat.value !== undefined ? stat.value : '...'}
                                    </p>
                                    <p style={{
                                        fontSize: 14, color: 'var(--text-secondary)',
                                        fontWeight: 500
                                    }}>
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Top Chart: User Registrations */}
                        <div className="card" style={{ padding: 24 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>User Registrations (Last 2 Months)</h3>
                            <div style={{ height: 300 }}>
                                {(() => {
                                    const lastMonths = [];
                                    for (let i = 1; i >= 0; i--) {
                                        const d = new Date();
                                        d.setMonth(d.getMonth() - i);
                                        lastMonths.push({
                                            year: d.getFullYear(),
                                            month: d.getMonth() + 1,
                                            label: d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear()
                                        });
                                    }
                                    const regData = lastMonths.map(m => {
                                        const found = analytics.registrationsSeries?.find(r => r._id.year === m.year && r._id.month === m.month);
                                        return found ? found.count : 0;
                                    });
                                    
                                    return (
                                        <ChartComponent 
                                            type="line"
                                            data={{
                                                labels: lastMonths.map(m => m.label),
                                                datasets: [{
                                                    label: 'New Users',
                                                    data: regData,
                                                    borderColor: '#3b82f6',
                                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                    tension: 0.4,
                                                    fill: true
                                                }]
                                            }}
                                            options={{ 
                                                maintainAspectRatio: false, 
                                                plugins: { legend: { display: false } },
                                                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                                            }}
                                        />
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Middle Row: Donut & Bar */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <div className="card" style={{ padding: 24 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>Users by Role</h3>
                                <div style={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                                    <ChartComponent 
                                        type="doughnut"
                                        data={{
                                            labels: ['Students', 'Alumni', 'Admins'],
                                            datasets: [{
                                                data: [analytics.users.students || 0, analytics.users.alumni || 0, analytics.users.admins || 0],
                                                backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
                                                borderWidth: 0
                                            }]
                                        }}
                                        options={{ maintainAspectRatio: false }}
                                    />
                                </div>
                            </div>

                            <div className="card" style={{ padding: 24 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>Interview Status</h3>
                                <div style={{ height: 300 }}>
                                    <ChartComponent 
                                        type="bar"
                                        data={{
                                            labels: ['Requested', 'Accepted', 'Completed', 'Declined'],
                                            datasets: [{
                                                label: 'Interviews',
                                                data: [
                                                    analytics.interviews.requested || 0, 
                                                    analytics.interviews.accepted || 0, 
                                                    analytics.interviews.completed || 0, 
                                                    analytics.interviews.declined || 0
                                                ],
                                                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
                                                borderRadius: 6
                                            }]
                                        }}
                                        options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Chart: Mentorship Requests */}
                        <div className="card" style={{ padding: 24 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>Mentorship Requests Breakdown</h3>
                            <div style={{ height: 300 }}>
                                <ChartComponent 
                                    type="bar"
                                    data={{
                                        labels: ['Total', 'Pending', 'Accepted', 'Rejected'],
                                        datasets: [{
                                            label: 'Mentorship Requests',
                                            data: [
                                                analytics.mentorships.total || 0, 
                                                analytics.mentorships.pending || 0, 
                                                analytics.mentorships.accepted || 0, 
                                                analytics.mentorships.rejected || 0
                                            ],
                                            backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ef4444'],
                                            borderRadius: 6
                                        }]
                                    }}
                                    options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Knowledge Base Tab */}
                {tab === 'data' && (
                    <div style={{ display: 'grid', gap: 24 }}>
                        {/* Top Stats Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                            {[
                                { label: 'Indexed Documents', value: kbStats.totalDocuments, icon: FileText, color: 'var(--primary)' },
                                { label: 'Total Chunks', value: kbStats.totalRecords, icon: Layers, color: 'var(--accent)' },
                                { label: 'Embeddings', value: ragStatus?.currentEmbeddingCount ?? '—', icon: Zap, color: 'var(--success)' }
                            ].map((s, i) => (
                                <div key={i} className="card" style={{
                                    padding: 20, display: 'flex', alignItems: 'center', gap: 16,
                                    background: `linear-gradient(135deg, ${s.color}10, ${s.color}05)`
                                }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 'var(--radius)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', background: s.color, color: '#fff'
                                    }}>
                                        <s.icon size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{s.value}</p>
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Upload Zone */}
                        <div
                            className="card"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            style={{
                                padding: uploading ? 32 : 48, textAlign: 'center', position: 'relative', overflow: 'hidden',
                                border: dragOver ? '2px dashed var(--primary)' : '2px dashed transparent',
                                background: dragOver ? 'rgba(59,130,246,0.04)' : undefined,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {uploading ? (
                                <div>
                                    <div style={{ width: 48, height: 48, margin: '0 auto 16px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                                    <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Processing file...</p>
                                    <div style={{ maxWidth: 300, margin: '0 auto', height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, var(--primary), var(--accent))', width: `${uploadProgress}%`, transition: 'width 0.3s ease' }} />
                                    </div>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>{uploadProgress}% uploaded</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{
                                        width: 72, height: 72, margin: '0 auto 20px', borderRadius: 'var(--radius-lg)',
                                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                                    }}>
                                        <FileUp size={32} />
                                    </div>
                                    <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                                        Upload to Knowledge Base
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, maxWidth: 420, margin: '0 auto 24px' }}>
                                        Drag & drop a PDF, CSV, or Excel file here, or click to browse. Data will be chunked and indexed for the AI assistant.
                                    </p>
                                    <label style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px',
                                        background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: '#fff',
                                        borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                                        boxShadow: '0 4px 14px rgba(37,99,235,0.25)', transition: 'all 0.2s ease'
                                    }}>
                                        <Upload size={18} />
                                        Choose File
                                        <input ref={fileInputRef} type="file" accept=".pdf,.csv,.xlsx,.xls" onChange={handleUpload} style={{ display: 'none' }} />
                                    </label>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>Max 10MB • PDF, CSV, XLSX</p>
                                </>
                            )}
                        </div>

                        {/* Indexed Documents List */}
                        <div className="card" style={{ padding: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Database size={18} style={{ color: 'var(--primary)' }} />
                                    <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Indexed Documents</h4>
                                </div>
                                <button onClick={loadKnowledgeBase} className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            </div>
                            {kbLoading && !kbDocuments.length ? (
                                <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <div className="spinner" style={{ marginRight: 8 }} /> Loading...
                                </div>
                            ) : kbDocuments.length === 0 ? (
                                <div style={{ padding: 48, textAlign: 'center' }}>
                                    <FileText size={48} style={{ color: 'var(--text-muted)', opacity: 0.4, margin: '0 auto 12px', display: 'block' }} />
                                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No documents indexed yet. Upload a file to get started.</p>
                                </div>
                            ) : (
                                <div>
                                    {kbDocuments.map((doc, i) => {
                                        const isExpanded = expandedDoc === doc.sourceFile;
                                        const ext = (doc.sourceFile || '').split('.').pop().toLowerCase();
                                        const isPdf = ext === 'pdf';
                                        return (
                                            <div key={i} style={{ borderBottom: i < kbDocuments.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '16px 24px', cursor: 'pointer', transition: 'background 0.15s'
                                                }}
                                                    onClick={() => setExpandedDoc(isExpanded ? null : doc.sourceFile)}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                                                            background: isPdf ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: isPdf ? '#ef4444' : '#10b981', flexShrink: 0
                                                        }}>
                                                            <FileText size={20} />
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {doc.sourceFile}
                                                            </p>
                                                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                                {doc.chunkCount} chunks • {doc.recordTypes.join(', ')}
                                                                {doc.addedAt ? ` • ${new Date(doc.addedAt).toLocaleDateString()}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteDocument(doc.sourceFile); }}
                                                            className="btn btn-ghost btn-sm"
                                                            style={{ color: 'var(--danger)', padding: 8 }}
                                                            title="Delete document"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                                                    </div>
                                                </div>
                                                {isExpanded && (
                                                    <div style={{ padding: '0 24px 16px 78px', fontSize: 13 }}>
                                                        {doc.years.length > 0 && (
                                                            <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                                                <strong>Years:</strong> {doc.years.join(', ')}
                                                            </p>
                                                        )}
                                                        {doc.branches.length > 0 && (
                                                            <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                                                <strong>Branches:</strong> {doc.branches.join(', ')}
                                                            </p>
                                                        )}
                                                        {doc.companies.length > 0 && (
                                                            <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                                                <strong>Companies:</strong> {doc.companies.join(', ')}{doc.companies.length >= 10 ? '...' : ''}
                                                            </p>
                                                        )}
                                                        {doc.sampleContent && (
                                                            <p style={{ color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                                                                "{doc.sampleContent}..."
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* RAG Engine Panel */}
                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Zap size={18} style={{ color: 'var(--warning)' }} />
                                    <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>RAG Engine</h4>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={triggerRebuild} className="btn btn-ghost btn-sm" style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6 }}
                                        disabled={ragStatus?.isRunning}
                                    >
                                        <RefreshCw size={14} style={ragStatus?.isRunning ? { animation: 'spin 1s linear infinite' } : {}} />
                                        {ragStatus?.isRunning ? 'Rebuilding...' : 'Rebuild'}
                                    </button>
                                    <button onClick={() => loadRagStatus(true)} className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>Refresh</button>
                                </div>
                            </div>
                            {ragStatus && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
                                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>State</p>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20,
                                            background: getRagStateColor(ragStatus.state), color: '#fff', fontSize: 11, fontWeight: 600, textTransform: 'capitalize'
                                        }}>{ragStatus.state || 'idle'}</span>
                                    </div>
                                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
                                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Records</p>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{ragStatus.currentRecordCount ?? 0}</p>
                                    </div>
                                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
                                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Embeddings</p>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{ragStatus.currentEmbeddingCount ?? 0}</p>
                                    </div>
                                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
                                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Last Rebuild</p>
                                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{formatDateTime(ragStatus.finishedAt)}</p>
                                    </div>
                                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
                                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Duration</p>
                                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{formatDuration(ragStatus.lastRunDurationMs)}</p>
                                    </div>
                                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
                                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Queue</p>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{ragStatus.queuedJobs ?? 0}</p>
                                    </div>
                                </div>
                            )}
                            {ragStatus?.lastError && (
                                <div style={{ marginTop: 12, padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                                    <span>{ragStatus.lastError}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {loading && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 48, color: 'var(--text-muted)'
                    }}>
                        <div className="spinner" style={{ marginRight: 12 }} />
                        Loading...
                    </div>
                )}
            </div>

            {/* User Details Modal */}
            {showUserModal && selectedUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000, padding: 20
                }}>
                    <div className="card" style={{
                        maxWidth: 600, width: '100%', maxHeight: '90vh',
                        overflow: 'auto', position: 'relative'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: 24, borderBottom: '1px solid var(--border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <img
                                    src={selectedUser.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.profile?.name || selectedUser.email)}&background=3b82f6&color=fff&size=200`}
                                    alt={selectedUser.profile?.name || selectedUser.email}
                                    style={{
                                        width: 64, height: 64, borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <div>
                                    <h2 style={{
                                        fontSize: 24, fontWeight: 700,
                                        color: 'var(--text)', marginBottom: 4
                                    }}>
                                        {selectedUser.profile?.name || 'No Name'}
                                    </h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
                                        {selectedUser.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowUserModal(false)}
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{ padding: 24 }}>
                            {/* Status Badges */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center',
                                    padding: '6px 12px', borderRadius: 20,
                                    fontSize: 12, fontWeight: 500,
                                    background: selectedUser.role === 'admin' ? 'var(--danger)' :
                                        selectedUser.role === 'alumni' ? 'var(--primary)' : 'var(--success)',
                                    color: '#fff'
                                }}>
                                    {selectedUser.role}
                                </span>
                                {selectedUser.isBlocked ? (
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        padding: '6px 12px', borderRadius: 20,
                                        fontSize: 12, fontWeight: 500,
                                        background: 'var(--danger)', color: '#fff'
                                    }}>
                                        <Ban size={12} />
                                        Blocked
                                    </span>
                                ) : (
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        padding: '6px 12px', borderRadius: 20,
                                        fontSize: 12, fontWeight: 500,
                                        background: 'var(--success)', color: '#fff'
                                    }}>
                                        <CheckCircle size={12} />
                                        Active
                                    </span>
                                )}
                                {selectedUser.isVerified && (
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        padding: '6px 12px', borderRadius: 20,
                                        fontSize: 12, fontWeight: 500,
                                        background: 'var(--primary)', color: '#fff'
                                    }}>
                                        <CheckCircle size={12} />
                                        Verified
                                    </span>
                                )}
                            </div>

                            {/* User Information Grid */}
                            <div style={{ display: 'grid', gap: 20 }}>
                                {/* Basic Information */}
                                <div>
                                    <h3 style={{
                                        fontSize: 18, fontWeight: 600,
                                        color: 'var(--text)', marginBottom: 16
                                    }}>
                                        Basic Information
                                    </h3>
                                    <div style={{ display: 'grid', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                                            <div>
                                                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Email</p>
                                                <p style={{ fontSize: 14, color: 'var(--text)' }}>{selectedUser.email}</p>
                                            </div>
                                        </div>
                                        {selectedUser.profile?.phone && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                                                <div>
                                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Phone</p>
                                                    <p style={{ fontSize: 14, color: 'var(--text)' }}>{selectedUser.profile.phone}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                                            <div>
                                                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Joined</p>
                                                <p style={{ fontSize: 14, color: 'var(--text)' }}>
                                                    {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric', month: 'long', day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedUser.lastLogin && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                                                <div>
                                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Last Login</p>
                                                    <p style={{ fontSize: 14, color: 'var(--text)' }}>
                                                        {new Date(selectedUser.lastLogin).toLocaleDateString('en-US', {
                                                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Academic Information */}
                                {(selectedUser.profile?.branch || selectedUser.profile?.year || selectedUser.profile?.cgpa) && (
                                    <div>
                                        <h3 style={{
                                            fontSize: 18, fontWeight: 600,
                                            color: 'var(--text)', marginBottom: 16
                                        }}>
                                            Academic Information
                                        </h3>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {selectedUser.profile?.branch && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                                                    <div>
                                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Branch</p>
                                                        <p style={{ fontSize: 14, color: 'var(--text)' }}>{selectedUser.profile.branch}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedUser.profile?.year && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <GraduationCap size={16} style={{ color: 'var(--text-muted)' }} />
                                                    <div>
                                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                                                            {selectedUser.role === 'alumni' ? 'Graduation Year' : 'Current Year'}
                                                        </p>
                                                        <p style={{ fontSize: 14, color: 'var(--text)' }}>
                                                            {selectedUser.role === 'alumni' ? selectedUser.profile.graduationYear : selectedUser.profile.year}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedUser.profile?.cgpa && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <Award size={16} style={{ color: 'var(--text-muted)' }} />
                                                    <div>
                                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>CGPA</p>
                                                        <p style={{ fontSize: 14, color: 'var(--text)' }}>{selectedUser.profile.cgpa}/10</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Professional Information (Alumni) */}
                                {selectedUser.role === 'alumni' && (selectedUser.profile?.company || selectedUser.profile?.role) && (
                                    <div>
                                        <h3 style={{
                                            fontSize: 18, fontWeight: 600,
                                            color: 'var(--text)', marginBottom: 16
                                        }}>
                                            Professional Information
                                        </h3>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {selectedUser.profile?.company && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <Building2 size={16} style={{ color: 'var(--text-muted)' }} />
                                                    <div>
                                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Company</p>
                                                        <p style={{ fontSize: 14, color: 'var(--text)' }}>{selectedUser.profile.company}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedUser.profile?.role && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <Award size={16} style={{ color: 'var(--text-muted)' }} />
                                                    <div>
                                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Role</p>
                                                        <p style={{ fontSize: 14, color: 'var(--text)' }}>{selectedUser.profile.role}</p>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                )}

                                {/* Skills */}
                                {selectedUser.profile?.skills && selectedUser.profile.skills.length > 0 && (
                                    <div>
                                        <h3 style={{
                                            fontSize: 18, fontWeight: 600,
                                            color: 'var(--text)', marginBottom: 16
                                        }}>
                                            Skills
                                        </h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {selectedUser.profile.skills.map((skill, index) => (
                                                <span key={index} className="tag">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Bio */}
                                {selectedUser.profile?.bio && (
                                    <div>
                                        <h3 style={{
                                            fontSize: 18, fontWeight: 600,
                                            color: 'var(--text)', marginBottom: 16
                                        }}>
                                            Bio
                                        </h3>
                                        <p style={{
                                            fontSize: 14, color: 'var(--text-secondary)',
                                            lineHeight: 1.6
                                        }}>
                                            {selectedUser.profile.bio}
                                        </p>
                                    </div>
                                )}

                                {/* Placement Experience (Alumni) */}
                                {selectedUser.role === 'alumni' && selectedUser.profile?.placementExperience && (
                                    <div>
                                        <h3 style={{
                                            fontSize: 18, fontWeight: 600,
                                            color: 'var(--text)', marginBottom: 16
                                        }}>
                                            Placement Experience
                                        </h3>
                                        <p style={{
                                            fontSize: 14, color: 'var(--text-secondary)',
                                            lineHeight: 1.6
                                        }}>
                                            {selectedUser.profile.placementExperience}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirm Dialog Modal */}
            {confirmDialog.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1100, padding: 20
                }}>
                    <div className="card" style={{ maxWidth: 400, width: '100%', padding: 24, background: 'var(--bg)', borderRadius: 'var(--radius)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                            {confirmDialog.title}
                        </h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
                            {confirmDialog.message}
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                                className="btn btn-ghost"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirmDialog.onConfirm) await confirmDialog.onConfirm();
                                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                                }}
                                className="btn btn-primary"
                                style={{
                                    background: confirmDialog.title.includes('Delete') ? 'var(--danger)' : 'var(--primary)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer'
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Duplicate File Dialog */}
            {duplicateDialog.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1200, padding: 20
                }}>
                    <div className="card" style={{ maxWidth: 440, width: '100%', padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                                <AlertTriangle size={20} />
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>Duplicate File</h3>
                        </div>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
                            <strong>"{duplicateDialog.file?.name}"</strong> already exists in the knowledge base. What would you like to do?
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => { setDuplicateDialog({ isOpen: false, file: null }); }}
                                className="btn btn-ghost"
                                style={{ flex: 1, color: 'var(--text-secondary)' }}
                            >Cancel</button>
                            <button
                                onClick={() => { const f = duplicateDialog.file; setDuplicateDialog({ isOpen: false, file: null }); uploadFile(f, false); }}
                                className="btn" style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 16px', cursor: 'pointer' }}
                            >Append</button>
                            <button
                                onClick={() => { const f = duplicateDialog.file; setDuplicateDialog({ isOpen: false, file: null }); uploadFile(f, true); }}
                                className="btn" style={{ flex: 1, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 16px', cursor: 'pointer' }}
                            >Replace</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const ChartComponent = ({ type, data, options }) => {
    const chartRef = React.useRef(null);
    const chartInstance = React.useRef(null);

    // Deep compare to prevent infinite re-renders since inline objects change reference on every render
    const dataString = JSON.stringify(data);
    const optionsString = JSON.stringify(options);

    React.useEffect(() => {
        let isMounted = true;

        const initChart = () => {
            if (!isMounted) return;
            
            // Wait for Chart.js to load via CDN if it's not immediately available
            if (!window.Chart) {
                setTimeout(initChart, 50);
                return;
            }
            
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            
            if (chartRef.current) {
                chartInstance.current = new window.Chart(chartRef.current, {
                    type,
                    data: JSON.parse(dataString),
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        ...JSON.parse(optionsString || '{}')
                    }
                });
            }
        };

        initChart();

        return () => {
            isMounted = false;
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [dataString, optionsString, type]);

    return <canvas ref={chartRef} />;
};
