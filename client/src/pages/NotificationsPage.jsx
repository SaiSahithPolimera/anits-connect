import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Bell, Check, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications || []);
        } catch (e) { } finally { setLoading(false); }
    };

    const markRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (e) { }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (e) { }
    };

    const getIcon = (type) => {
        const map = {
            mentorship_request: '🤝', mentorship_accepted: '✅', mentorship_rejected: '❌',
            interview_request: '📋', interview_accepted: '👍', interview_declined: '👎',
            new_message: '💬', feedback_received: '⭐', badge_earned: '🏅', system: '🔔'
        };
        return map[type] || '🔔';
    };

    return (
        <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Bell size={24} className="text-yellow-400" /> Notifications
                    </h1>
                    <button onClick={markAllRead} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        <CheckCheck size={16} /> Mark all read
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20">
                        <Bell size={48} className="mx-auto text-gray-700 mb-4" />
                        <p className="text-gray-400">No notifications</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((n, i) => (
                            <div key={i} onClick={() => !n.isRead && markRead(n._id)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${n.isRead
                                        ? 'bg-gray-900/30 border-gray-800/30'
                                        : 'bg-gray-900/60 border-indigo-500/20 hover:border-indigo-500/40'
                                    }`}>
                                <div className="flex items-start gap-3">
                                    <span className="text-lg">{getIcon(n.type)}</span>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${n.isRead ? 'text-gray-400' : 'text-white'}`}>{n.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                                        <p className="text-xs text-gray-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                    </div>
                                    {!n.isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
