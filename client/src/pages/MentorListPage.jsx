import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Search, Filter, Users, Building2, Send, MapPin, GraduationCap, CheckCircle } from 'lucide-react';

export default function MentorListPage() {
    const { user } = useAuth();
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ branch: '', company: '', available: 'true' });
    const [requestedIds, setRequestedIds] = useState(new Set());

    useEffect(() => {
        loadAlumni();
        loadExistingRequests();
    }, []);

    const loadAlumni = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filters.branch) params.append('branch', filters.branch);
            if (filters.company) params.append('company', filters.company);
            if (filters.available) params.append('available', filters.available);

            const res = await api.get(`/match/alumni?${params.toString()}`);
            setAlumni(res.data.alumni || []);
        } catch (error) {
            toast.error('Failed to load mentors');
        } finally {
            setLoading(false);
        }
    };

    const loadExistingRequests = async () => {
        try {
            const res = await api.get('/match/mentorship/requests');
            const ids = new Set(res.data.requests?.filter(r => r.status === 'pending').map(r => r.alumniId.toString()) || []);
            setRequestedIds(ids);
        } catch (e) { }
    };

    const sendRequest = async (alumniUserId) => {
        try {
            await api.post('/match/mentorship/request', { alumniId: alumniUserId });
            toast.success('Mentorship request sent!');
            setRequestedIds(prev => new Set([...prev, alumniUserId]));
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to send request');
        }
    };

    const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'CSBS'];

    return (
        <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users size={24} className="text-purple-400" /> Find Mentors
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Connect with experienced alumni for guidance</p>
                </div>

                {/* Search & Filters */}
                <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && loadAlumni()}
                                placeholder="Search by name, company, role, skills..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
                            />
                        </div>
                        <select value={filters.branch} onChange={e => setFilters({ ...filters, branch: e.target.value })}
                            className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500">
                            <option value="">All Branches</option>
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <button onClick={loadAlumni}
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all">
                            Search
                        </button>
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"></div>
                    </div>
                ) : alumni.length === 0 ? (
                    <div className="text-center py-20">
                        <Users size={48} className="mx-auto text-gray-700 mb-4" />
                        <p className="text-gray-400">No mentors found. Try adjusting your search.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alumni.map((a, i) => (
                            <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 hover:border-gray-700/50 transition-all">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                        {a.name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-semibold truncate">{a.name}</h3>
                                        <p className="text-sm text-gray-400 flex items-center gap-1 truncate">
                                            <Building2 size={12} /> {a.role || 'Professional'} at {a.company || 'N/A'}
                                        </p>
                                    </div>
                                    {a.isAvailableForMentoring && (
                                        <span className="flex-shrink-0 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">Available</span>
                                    )}
                                </div>

                                <div className="space-y-2 mb-4">
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                        <GraduationCap size={12} /> {a.branch} — Class of {a.graduationYear || 'N/A'}
                                    </p>
                                    {a.placementExperience && (
                                        <p className="text-xs text-gray-300 line-clamp-2">{a.placementExperience}</p>
                                    )}
                                </div>

                                {/* Skills */}
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {a.skills?.slice(0, 4).map((skill, j) => (
                                        <span key={j} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 text-xs rounded-full">{skill}</span>
                                    ))}
                                    {a.skills?.length > 4 && (
                                        <span className="px-2 py-0.5 bg-gray-700/50 text-gray-400 text-xs rounded-full">+{a.skills.length - 4}</span>
                                    )}
                                </div>

                                {/* Action */}
                                {user?.role === 'student' && (
                                    requestedIds.has(a.userId?.toString()) ? (
                                        <button disabled className="w-full py-2 bg-gray-800/50 text-gray-400 rounded-lg text-sm flex items-center justify-center gap-1">
                                            <CheckCircle size={14} /> Request Sent
                                        </button>
                                    ) : (
                                        <button onClick={() => sendRequest(a.userId)}
                                            className="w-full py-2 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-500/30 transition-colors flex items-center justify-center gap-1">
                                            <Send size={14} /> Request Mentorship
                                        </button>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
