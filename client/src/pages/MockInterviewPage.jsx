import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { CalendarCheck, Clock, CheckCircle, XCircle, Star, MessageSquare, Video } from 'lucide-react';

export default function MockInterviewPage() {
    const { user } = useAuth();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showFeedback, setShowFeedback] = useState(null);
    const [form, setForm] = useState({ alumniId: '', topic: '', description: '', scheduledAt: '', duration: 30 });
    const [feedbackForm, setFeedbackForm] = useState({ technical: 3, communication: 3, confidence: 3, problemSolving: 3, overallRating: 3, notes: '' });
    const [alumni, setAlumni] = useState([]);

    useEffect(() => { loadInterviews(); }, []);

    const loadInterviews = async () => {
        try {
            const res = await api.get('/interviews');
            setInterviews(res.data.interviews || []);
        } catch (e) { } finally { setLoading(false); }
    };

    const loadAlumni = async () => {
        try {
            const res = await api.get('/match/alumni?available=true');
            setAlumni(res.data.alumni || []);
        } catch (e) { }
    };

    const createInterview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/interviews', form);
            toast.success('Interview request sent!');
            setShowForm(false);
            setForm({ alumniId: '', topic: '', description: '', scheduledAt: '', duration: 30 });
            loadInterviews();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create request');
        }
    };

    const updateStatus = async (id, status, meetingLink = '') => {
        try {
            await api.put(`/interviews/${id}`, { status, meetingLink });
            toast.success(`Interview ${status}`);
            loadInterviews();
        } catch (e) { toast.error('Failed to update'); }
    };

    const submitFeedback = async (interviewId) => {
        try {
            await api.post(`/interviews/${interviewId}/feedback`, feedbackForm);
            toast.success('Feedback submitted!');
            setShowFeedback(null);
            loadInterviews();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to submit feedback');
        }
    };

    const getStatusColor = (s) => {
        const map = { requested: 'text-yellow-400 bg-yellow-500/10', accepted: 'text-emerald-400 bg-emerald-500/10', completed: 'text-blue-400 bg-blue-500/10', declined: 'text-red-400 bg-red-500/10', rescheduled: 'text-orange-400 bg-orange-500/10' };
        return map[s] || 'text-gray-400 bg-gray-500/10';
    };

    return (
        <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <CalendarCheck size={24} className="text-emerald-400" /> Mock Interviews
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Schedule and manage mock interviews</p>
                    </div>
                    {user?.role === 'student' && (
                        <button onClick={() => { setShowForm(true); loadAlumni(); }}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium">
                            + Request Interview
                        </button>
                    )}
                </div>

                {/* Request Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-white mb-4">Request Mock Interview</h3>
                            <form onSubmit={createInterview} className="space-y-4">
                                <select value={form.alumniId} onChange={e => setForm({ ...form, alumniId: e.target.value })} required
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500">
                                    <option value="">Select Alumni</option>
                                    {alumni.map(a => <option key={a.userId} value={a.userId}>{a.name} — {a.company}</option>)}
                                </select>
                                <input placeholder="Topic (e.g., DSA, System Design)" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} required
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
                                <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none" />
                                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} required
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500" />
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm">Cancel</button>
                                    <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium">Send Request</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Feedback Modal */}
                {showFeedback && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-white mb-4">Submit Feedback</h3>
                            <div className="space-y-3">
                                {['technical', 'communication', 'confidence', 'problemSolving', 'overallRating'].map(field => (
                                    <div key={field} className="flex items-center justify-between">
                                        <label className="text-sm text-gray-300 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <button key={n} onClick={() => setFeedbackForm({ ...feedbackForm, [field]: n })}
                                                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${feedbackForm[field] >= n ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <textarea placeholder="Additional notes..." value={feedbackForm.notes} onChange={e => setFeedbackForm({ ...feedbackForm, notes: e.target.value })} rows={3}
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none" />
                                <div className="flex gap-3">
                                    <button onClick={() => setShowFeedback(null)} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm">Cancel</button>
                                    <button onClick={() => submitFeedback(showFeedback)} className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium">Submit</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Interview List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"></div>
                    </div>
                ) : interviews.length === 0 ? (
                    <div className="text-center py-20">
                        <CalendarCheck size={48} className="mx-auto text-gray-700 mb-4" />
                        <p className="text-gray-400">No interviews scheduled yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {interviews.map((iv, i) => (
                            <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-white font-semibold">{iv.topic}</h3>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {user?.role === 'student' ? `With ${iv.alumniProfile?.name || 'Alumni'} (${iv.alumniProfile?.company || ''})` : `With ${iv.studentProfile?.name || 'Student'} (${iv.studentProfile?.branch || ''})`}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(iv.status)}`}>{iv.status}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(iv.scheduledAt).toLocaleString()}</span>
                                    <span>{iv.duration} min</span>
                                </div>
                                {iv.meetingLink && (
                                    <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mb-3">
                                        <Video size={12} /> Join Meeting
                                    </a>
                                )}
                                <div className="flex gap-2">
                                    {user?.role === 'alumni' && iv.status === 'requested' && (
                                        <>
                                            <button onClick={() => { const link = prompt('Enter meeting link (optional):'); updateStatus(iv._id, 'accepted', link || ''); }}
                                                className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30">Accept</button>
                                            <button onClick={() => updateStatus(iv._id, 'declined')}
                                                className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30">Decline</button>
                                        </>
                                    )}
                                    {iv.status === 'accepted' && (
                                        <button onClick={() => updateStatus(iv._id, 'completed')}
                                            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30">Mark Complete</button>
                                    )}
                                    {user?.role === 'alumni' && iv.status === 'completed' && !iv.hasFeedback && (
                                        <button onClick={() => setShowFeedback(iv._id)}
                                            className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium hover:bg-yellow-500/30 flex items-center gap-1">
                                            <Star size={12} /> Give Feedback
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
