import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
    Users, Brain, CalendarCheck, MessageCircle, TrendingUp,
    Award, ArrowRight, Building2, GraduationCap, Sparkles
} from 'lucide-react';

export default function DashboardPage() {
    const { user, profile } = useAuth();
    const [stats, setStats] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [trending, setTrending] = useState([]);
    const [engagement, setEngagement] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [engRes, trendRes] = await Promise.all([
                api.get('/engagement/me'),
                api.get('/rag/trending')
            ]);
            setEngagement(engRes.data.engagement);
            setTrending(trendRes.data.trending?.slice(0, 5) || []);

            if (user?.role === 'student') {
                try {
                    const sugRes = await api.get('/match/suggestions');
                    setSuggestions(sugRes.data.suggestions?.slice(0, 4) || []);
                } catch (e) { }
            }

            if (user?.role === 'admin') {
                try {
                    const statsRes = await api.get('/admin/analytics');
                    setStats(statsRes.data.analytics);
                } catch (e) { }
            }
        } catch (error) {
            console.error('Dashboard error:', error);
        }
    };

    const QuickAction = ({ to, icon: Icon, label, color }) => (
        <Link to={to} className={`group p-4 rounded-xl border border-gray-800/50 bg-gray-900/50 hover:bg-gray-800/50 transition-all hover:border-${color}-500/30`}>
            <div className={`w-10 h-10 rounded-lg bg-${color}-500/10 flex items-center justify-center mb-3`}>
                <Icon size={20} className={`text-${color}-400`} />
            </div>
            <p className="text-white font-medium text-sm">{label}</p>
            <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-400 mt-2 transition-colors" />
        </Link>
    );

    return (
        <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-8">
            <div className="max-w-6xl mx-auto">
                {/* Welcome Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles size={24} className="text-indigo-400" />
                        <h1 className="text-2xl font-bold text-white">
                            Welcome back, {profile?.name || 'User'}
                        </h1>
                    </div>
                    <p className="text-gray-400">
                        {user?.role === 'student' && '🎓 Student Dashboard — Find mentors, prepare for placements'}
                        {user?.role === 'alumni' && '🏢 Alumni Dashboard — Help students, share your experience'}
                        {user?.role === 'admin' && '🛡️ Admin Dashboard — Manage the platform'}
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <QuickAction to="/ai-query" icon={Brain} label="AI Query" color="indigo" />
                    <QuickAction to="/mentors" icon={Users} label="Find Mentors" color="purple" />
                    <QuickAction to="/interviews" icon={CalendarCheck} label="Interviews" color="emerald" />
                    <QuickAction to="/chat" icon={MessageCircle} label="Messages" color="blue" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Engagement Card */}
                    {engagement && (
                        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Award size={20} className="text-yellow-400" /> Your Activity
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {user?.role === 'student' ? (
                                    <>
                                        <div className="p-3 bg-gray-800/30 rounded-lg">
                                            <p className="text-2xl font-bold text-indigo-400">{engagement.interviewsCompleted || 0}</p>
                                            <p className="text-xs text-gray-400">Interviews Done</p>
                                        </div>
                                        <div className="p-3 bg-gray-800/30 rounded-lg">
                                            <p className="text-2xl font-bold text-purple-400">{engagement.queriesAsked || 0}</p>
                                            <p className="text-xs text-gray-400">AI Queries</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-3 bg-gray-800/30 rounded-lg">
                                            <p className="text-2xl font-bold text-yellow-400">{engagement.contributionScore || 0}</p>
                                            <p className="text-xs text-gray-400">Contribution Score</p>
                                        </div>
                                        <div className="p-3 bg-gray-800/30 rounded-lg">
                                            <p className="text-2xl font-bold text-emerald-400">{engagement.mockInterviewsConducted || 0}</p>
                                            <p className="text-xs text-gray-400">Mock Interviews</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Trending Companies */}
                    {trending.length > 0 && (
                        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingUp size={20} className="text-emerald-400" /> Top Companies
                            </h2>
                            <div className="space-y-3">
                                {trending.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                                <Building2 size={14} className="text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white font-medium">{c.name}</p>
                                                <p className="text-xs text-gray-500">{c.totalPlacements} placements</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-emerald-400 font-medium">{c.averagePackage} LPA</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mentor Suggestions (Students only) */}
                    {user?.role === 'student' && suggestions.length > 0 && (
                        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 md:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <GraduationCap size={20} className="text-purple-400" /> Recommended Mentors
                                </h2>
                                <Link to="/mentors" className="text-sm text-indigo-400 hover:text-indigo-300">View All →</Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {suggestions.map((s, i) => (
                                    <div key={i} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                                                {s.name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">{s.name}</p>
                                                <p className="text-xs text-gray-400">{s.role} at {s.company}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {s.skills?.slice(0, 3).map((skill, j) => (
                                                <span key={j} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 text-xs rounded-full">{skill}</span>
                                            ))}
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Match: {s.matchScore}%</span>
                                            <Link to="/mentors" className="text-xs text-indigo-400 hover:text-indigo-300">Connect →</Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin Stats */}
                    {user?.role === 'admin' && stats && (
                        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 md:col-span-2">
                            <h2 className="text-lg font-semibold text-white mb-4">Platform Overview</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-800/30 rounded-lg text-center">
                                    <p className="text-3xl font-bold text-indigo-400">{stats.users.total}</p>
                                    <p className="text-xs text-gray-400 mt-1">Total Users</p>
                                </div>
                                <div className="p-4 bg-gray-800/30 rounded-lg text-center">
                                    <p className="text-3xl font-bold text-purple-400">{stats.users.students}</p>
                                    <p className="text-xs text-gray-400 mt-1">Students</p>
                                </div>
                                <div className="p-4 bg-gray-800/30 rounded-lg text-center">
                                    <p className="text-3xl font-bold text-emerald-400">{stats.users.alumni}</p>
                                    <p className="text-xs text-gray-400 mt-1">Alumni</p>
                                </div>
                                <div className="p-4 bg-gray-800/30 rounded-lg text-center">
                                    <p className="text-3xl font-bold text-yellow-400">{stats.interviews.completed}</p>
                                    <p className="text-xs text-gray-400 mt-1">Interviews</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
