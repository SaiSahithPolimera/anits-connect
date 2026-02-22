import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';
import { Send, Brain, Sparkles, Filter, Building2, Briefcase, Calendar } from 'lucide-react';

export default function AIQueryPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ company: '', role: '', year: '', branch: '' });
    const [trending, setTrending] = useState([]);
    const [stats, setStats] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadData = async () => {
        try {
            const [trendRes, statsRes] = await Promise.all([
                api.get('/rag/trending'),
                api.get('/rag/stats')
            ]);
            setTrending(trendRes.data.trending?.slice(0, 8) || []);
            setStats(statsRes.data.stats);
        } catch (e) { }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
        setLoading(true);

        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v)
            );
            const res = await api.post('/rag/query', {
                message: userMsg,
                filters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined
            });
            setMessages(prev => [...prev, { text: res.data.response, sender: 'bot' }]);
        } catch (error) {
            setMessages(prev => [...prev, { text: 'Sorry, something went wrong. Please try again.', sender: 'bot' }]);
        } finally {
            setLoading(false);
        }
    };

    const quickQueries = [
        'Which companies offer the highest packages?',
        'How to prepare for TCS NQT?',
        'CSE placement statistics',
        'Top recruiters at ANITS',
        'Average package trends over the years'
    ];

    return (
        <div className="min-h-screen bg-gray-950 pt-20 px-4 pb-4">
            <div className="max-w-5xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 6rem)' }}>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6">
                                <Brain size={36} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">AI Placement Assistant</h2>
                            <p className="text-gray-400 max-w-md mb-6">Ask anything about placements, companies, interview experiences, and preparation tips</p>

                            {/* Stats */}
                            {stats && (
                                <div className="flex gap-4 mb-8">
                                    <div className="px-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-xl text-center">
                                        <p className="text-lg font-bold text-indigo-400">{stats.totalPlacements}</p>
                                        <p className="text-xs text-gray-500">Records</p>
                                    </div>
                                    <div className="px-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-xl text-center">
                                        <p className="text-lg font-bold text-emerald-400">{stats.uniqueCompanies}</p>
                                        <p className="text-xs text-gray-500">Companies</p>
                                    </div>
                                    <div className="px-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-xl text-center">
                                        <p className="text-lg font-bold text-purple-400">{stats.highestPackage} LPA</p>
                                        <p className="text-xs text-gray-500">Highest</p>
                                    </div>
                                </div>
                            )}

                            {/* Quick Queries */}
                            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                                {quickQueries.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setInput(q); }}
                                        className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 rounded-full text-xs text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
                                    >
                                        <Sparkles size={12} className="inline mr-1" />{q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.sender === 'user'
                                        ? 'bg-indigo-500/20 border border-indigo-500/30 text-white'
                                        : 'bg-gray-900/80 border border-gray-800/50 text-gray-200'
                                    }`}>
                                    {msg.sender === 'bot' ? (
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-sm">{msg.text}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-900/80 border border-gray-800/50 rounded-2xl px-4 py-3">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="p-3 bg-gray-900/50 border border-gray-800/50 rounded-xl mb-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <input placeholder="Company" value={filters.company} onChange={e => setFilters({ ...filters, company: e.target.value })}
                            className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
                        <input placeholder="Role" value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value })}
                            className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
                        <input placeholder="Year" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}
                            className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
                        <input placeholder="Branch" value={filters.branch} onChange={e => setFilters({ ...filters, branch: e.target.value })}
                            className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
                    </div>
                )}

                {/* Input Bar */}
                <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-800/50 rounded-xl p-2">
                    <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                        <Filter size={18} />
                    </button>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about placements, companies, interview tips..."
                        className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm px-2"
                    />
                    <button onClick={handleSend} disabled={loading || !input.trim()}
                        className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white disabled:opacity-50 hover:from-indigo-600 hover:to-purple-700 transition-all">
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
