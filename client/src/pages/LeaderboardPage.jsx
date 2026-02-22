import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Trophy, Medal, Award } from 'lucide-react';

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/engagement/leaderboard').then(res => {
            setLeaderboard(res.data.leaderboard || []);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const getRankIcon = (i) => {
        if (i === 0) return <Trophy size={20} className="text-yellow-400" />;
        if (i === 1) return <Medal size={20} className="text-gray-300" />;
        if (i === 2) return <Medal size={20} className="text-amber-600" />;
        return <span className="text-gray-500 text-sm font-medium w-5 text-center">{i + 1}</span>;
    };

    return (
        <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                    <Trophy size={24} className="text-yellow-400" /> Leaderboard
                </h1>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"></div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {leaderboard.map((entry, i) => (
                            <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${i < 3 ? 'bg-gray-900/60 border-yellow-500/20' : 'bg-gray-900/30 border-gray-800/50'
                                }`}>
                                <div className="w-8 flex justify-center">{getRankIcon(i)}</div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                    {entry.profile?.name?.[0] || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm truncate">{entry.profile?.name}</p>
                                    <p className="text-xs text-gray-500">{entry.profile?.company || entry.profile?.branch}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-yellow-400">{entry.contributionScore}</p>
                                    <p className="text-xs text-gray-500">points</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
