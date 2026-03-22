import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Shield, Users, Upload, BarChart3, UserX, UserCheck, Trash2, Search, Filter, MoreVertical, Eye, Ban, CheckCircle, X, Mail, Phone, Calendar, MapPin, Building2, GraduationCap, Award, ExternalLink, Clock } from 'lucide-react';
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

    // Initial load
    useEffect(() => { loadData(); }, [tab]);

    // Dynamic search filtering
    useEffect(() => {
        if (tab === 'users') loadData();
    }, [search, roleFilter]);

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

    const viewUserDetails = (user) => {
        console.log('Viewing user details:', user);
        setSelectedUser(user);
        setShowUserModal(true);
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
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 24
                    }}>
                        {[
                            { label: 'Total Users', value: analytics.users.total, color: 'var(--primary)', icon: Users },
                            { label: 'Students', value: analytics.users.students, color: 'var(--success)', icon: Users },
                            { label: 'Alumni', value: analytics.users.alumni, color: 'var(--primary)', icon: Users },
                            { label: 'Admins', value: analytics.users.admins, color: 'var(--danger)', icon: Shield },
                            { label: 'Recent Signups', value: analytics.users.recentRegistrations, color: 'var(--accent)', icon: Users },
                            { label: 'Total Interviews', value: analytics.interviews.total, color: 'var(--warning)', icon: Users },
                            { label: 'Completed', value: analytics.interviews.completed, color: 'var(--success)', icon: CheckCircle },
                            { label: 'Mentorships', value: analytics.mentorships.total, color: 'var(--primary)', icon: Users },
                            { label: 'Messages', value: analytics.messages.total, color: 'var(--accent)', icon: Users }
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
                                    {stat.value}
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
                )}

                {/* Upload Tab */}
                {tab === 'data' && (
                    <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                        <div style={{
                            width: 80, height: 80,
                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px',
                            color: '#fff'
                        }}>
                            <Upload size={32} />
                        </div>
                        <h3 style={{
                            fontSize: 24, fontWeight: 600,
                            color: 'var(--text)', marginBottom: 8
                        }}>
                            Upload Placement Data
                        </h3>
                        <p style={{
                            color: 'var(--text-secondary)', fontSize: 16,
                            marginBottom: 32, maxWidth: 400, margin: '0 auto 32px'
                        }}>
                            Upload CSV or Excel files with placement records to update the system
                        </p>
                        <label style={{
                            display: 'inline-flex', alignItems: 'center', gap: 12,
                            padding: '16px 32px',
                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            color: '#fff',
                            borderRadius: 'var(--radius)',
                            fontSize: 16, fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all var(--transition)',
                            boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                        }}>
                            <Upload size={20} />
                            Choose File
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleUpload}
                                style={{ display: 'none' }}
                            />
                        </label>
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
                    {console.log('Rendering modal for user:', selectedUser)}
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
                                            {selectedUser.profile?.linkedinUrl && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
                                                    <div>
                                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>LinkedIn</p>
                                                        <a
                                                            href={selectedUser.profile.linkedinUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                fontSize: 14, color: 'var(--primary)',
                                                                textDecoration: 'none'
                                                            }}
                                                        >
                                                            View Profile
                                                        </a>
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
        </div>
    );
}
