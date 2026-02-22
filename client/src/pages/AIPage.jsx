import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ReactMarkdown from 'react-markdown';
import {
    Send, Sparkles, User, Eye, MessageSquare, Video, Loader,
    Plus, Trash2, MessageCircle, PanelLeftClose, PanelLeft
} from 'lucide-react';

const STORAGE_KEY = 'anits_ai_chats';
const ACTIVE_KEY = 'anits_ai_active_chat';

const WELCOME_MSG = {
    role: 'ai',
    text: "Hi! I'm your ANITS Placement AI Assistant. I can help you with:\n\n• **Placement data** — packages, companies, branch-wise stats\n• **Interview experiences** — tips from seniors who got placed\n• **Senior recommendations** — connect with alumni mentors\n\nTry asking: *\"Who got placed in Amazon?\"* or *\"Which seniors can help with TCS prep?\"*",
    toolActions: []
};

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function createNewChat() {
    return {
        id: generateId(),
        title: 'New Chat',
        messages: [WELCOME_MSG],
        createdAt: Date.now()
    };
}

function autoTitle(text) {
    // Generate title from first user message (first 40 chars)
    const clean = text.replace(/[#*_`\n]/g, '').trim();
    return clean.length > 40 ? clean.slice(0, 40) + '…' : clean;
}

export default function AIPage() {
    const navigate = useNavigate();
    const bottomRef = useRef(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Load all chats from localStorage
    const [chats, setChats] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (_) { }
        return [createNewChat()];
    });

    const [activeChatId, setActiveChatId] = useState(() => {
        return localStorage.getItem(ACTIVE_KEY) || chats[0]?.id;
    });

    const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
    const messages = activeChat?.messages || [WELCOME_MSG];

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Persist chats
    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); } catch (_) { }
    }, [chats]);

    useEffect(() => {
        try { localStorage.setItem(ACTIVE_KEY, activeChatId); } catch (_) { }
    }, [activeChatId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const updateActiveChat = useCallback((updater) => {
        setChats(prev => prev.map(c => c.id === activeChatId ? updater(c) : c));
    }, [activeChatId]);

    const handleNewChat = () => {
        const newChat = createNewChat();
        setChats(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        setInput('');
    };

    const handleDeleteChat = (chatId, e) => {
        e.stopPropagation();
        setChats(prev => {
            const filtered = prev.filter(c => c.id !== chatId);
            if (filtered.length === 0) {
                const fresh = createNewChat();
                setActiveChatId(fresh.id);
                return [fresh];
            }
            if (activeChatId === chatId) setActiveChatId(filtered[0].id);
            return filtered;
        });
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        const query = input.trim();
        if (!query || loading) return;

        const userMsg = { role: 'user', text: query };

        // Auto-title on first user message
        const isFirstUserMsg = !messages.some(m => m.role === 'user');
        if (isFirstUserMsg) {
            updateActiveChat(c => ({ ...c, title: autoTitle(query), messages: [...c.messages, userMsg] }));
        } else {
            updateActiveChat(c => ({ ...c, messages: [...c.messages, userMsg] }));
        }

        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/rag/query', { message: query });
            updateActiveChat(c => ({
                ...c,
                messages: [...c.messages, {
                    role: 'ai',
                    text: res.data.response,
                    toolActions: res.data.toolActions || []
                }]
            }));
        } catch (err) {
            updateActiveChat(c => ({
                ...c,
                messages: [...c.messages, {
                    role: 'ai',
                    text: 'Sorry, I encountered an error. Please try again.',
                    toolActions: []
                }]
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleQuickQuery = (q) => {
        setInput(q);
        setTimeout(() => {
            const userMsg = { role: 'user', text: q };
            const isFirstUserMsg = !messages.some(m => m.role === 'user');
            if (isFirstUserMsg) {
                updateActiveChat(c => ({ ...c, title: autoTitle(q), messages: [...c.messages, userMsg] }));
            } else {
                updateActiveChat(c => ({ ...c, messages: [...c.messages, userMsg] }));
            }
            setInput('');
            setLoading(true);
            api.post('/rag/query', { message: q })
                .then(res => {
                    updateActiveChat(c => ({
                        ...c,
                        messages: [...c.messages, {
                            role: 'ai', text: res.data.response,
                            toolActions: res.data.toolActions || []
                        }]
                    }));
                })
                .catch(() => {
                    updateActiveChat(c => ({
                        ...c,
                        messages: [...c.messages, {
                            role: 'ai', text: 'Error processing query. Please try again.',
                            toolActions: []
                        }]
                    }));
                })
                .finally(() => setLoading(false));
        }, 100);
    };

    const handleToolAction = (action) => {
        switch (action.type) {
            case 'VIEW_PROFILE':
            case 'SEND_MESSAGE':
                navigate(`/chat/${action.userId}`);
                break;
            case 'REQUEST_INTERVIEW':
                navigate(`/?interview=${action.userId}`);
                break;
            default: break;
        }
    };

    const ToolActionButton = ({ action }) => {
        const config = {
            VIEW_PROFILE: { icon: Eye, label: `View ${action.seniorName}'s Profile`, cls: 'tool-action-view' },
            SEND_MESSAGE: { icon: MessageSquare, label: `Message ${action.seniorName}`, cls: 'tool-action-message' },
            REQUEST_INTERVIEW: { icon: Video, label: `Interview with ${action.seniorName}`, cls: 'tool-action-interview' }
        };
        const c = config[action.type] || config.VIEW_PROFILE;
        return (
            <button onClick={() => handleToolAction(action)} className={`tool-action-btn ${c.cls}`}>
                <c.icon size={14} /> {c.label}
            </button>
        );
    };

    const quickQueries = [
        'What is the highest package in 2020-24 batch?',
        'Which seniors can help with Amazon interview prep?',
        'How many students got placed in TCS?',
        'Show me CSE branch placement stats',
    ];

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
            {/* ── Sidebar ────────────────────────────── */}
            <div style={{
                width: sidebarOpen ? 260 : 0,
                minWidth: sidebarOpen ? 260 : 0,
                background: '#fff',
                borderRight: sidebarOpen ? '1px solid var(--border)' : 'none',
                display: 'flex', flexDirection: 'column',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                overflow: 'hidden'
            }}>
                {/* New Chat Button */}
                <div style={{ padding: '12px' }}>
                    <button onClick={handleNewChat} className="btn btn-primary"
                        style={{ width: '100%', gap: 8, fontWeight: 600 }}>
                        <Plus size={16} /> New Chat
                    </button>
                </div>

                {/* Chat List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setActiveChatId(chat.id)}
                            style={{
                                padding: '10px 12px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: chat.id === activeChatId ? 'var(--primary-50)' : 'transparent',
                                color: chat.id === activeChatId ? 'var(--primary)' : 'var(--text-secondary)',
                                transition: 'all 0.15s',
                                marginBottom: 2,
                                position: 'relative',
                                group: 'chat-item'
                            }}
                            onMouseEnter={e => {
                                const del = e.currentTarget.querySelector('.del-btn');
                                if (del) del.style.opacity = '1';
                            }}
                            onMouseLeave={e => {
                                const del = e.currentTarget.querySelector('.del-btn');
                                if (del) del.style.opacity = '0';
                            }}
                        >
                            <MessageCircle size={14} style={{ flexShrink: 0 }} />
                            <span style={{
                                flex: 1, fontSize: 13, fontWeight: chat.id === activeChatId ? 600 : 400,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }}>
                                {chat.title}
                            </span>
                            <button
                                className="del-btn"
                                onClick={(e) => handleDeleteChat(chat.id, e)}
                                style={{
                                    opacity: 0, transition: 'opacity 0.15s',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: 4, color: 'var(--text-muted)', borderRadius: 4,
                                    display: 'flex', alignItems: 'center'
                                }}
                                title="Delete chat"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Main Chat Area ─────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
                {/* Header */}
                <div style={{
                    padding: '12px 20px', background: '#fff',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 10
                }}>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="btn btn-ghost btn-icon"
                        style={{ color: 'var(--text-muted)' }}
                        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}>
                        {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                    </button>
                    <div style={{
                        width: 32, height: 32,
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Sparkles size={16} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: 15, fontWeight: 600 }}>{activeChat?.title || 'New Chat'}</h1>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Powered by ANITS placement data</p>
                    </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {messages.map((msg, i) => (
                        <div key={i} className="animate-fade-in"
                            style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
                            {msg.role === 'ai' && (
                                <div style={{
                                    width: 28, height: 28, flexShrink: 0,
                                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                    borderRadius: 7,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2
                                }}>
                                    <Sparkles size={13} color="#fff" />
                                </div>
                            )}
                            <div style={{
                                maxWidth: '78%',
                                padding: msg.role === 'user' ? '10px 16px' : '14px 18px',
                                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                background: msg.role === 'user' ? 'var(--primary)' : '#fff',
                                color: msg.role === 'user' ? '#fff' : 'var(--text)',
                                boxShadow: 'var(--shadow-sm)',
                                fontSize: 14
                            }}>
                                {msg.role === 'ai' ? (
                                    <div className="prose">
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </div>
                                ) : msg.text}

                                {msg.toolActions && msg.toolActions.length > 0 && (
                                    <div className="tool-actions">
                                        {msg.toolActions.filter((a, i, arr) =>
                                            arr.findIndex(x => x.type === a.type && x.userId === a.userId) === i
                                        ).map((action, j) => (
                                            <ToolActionButton key={j} action={action} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            {msg.role === 'user' && (
                                <div style={{
                                    width: 28, height: 28, flexShrink: 0,
                                    background: 'var(--primary-100)',
                                    borderRadius: 7,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2
                                }}>
                                    <User size={13} color="var(--primary)" />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="animate-fade-in" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{
                                width: 28, height: 28,
                                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Sparkles size={13} color="#fff" />
                            </div>
                            <div style={{
                                padding: '12px 18px', background: '#fff',
                                borderRadius: '16px 16px 16px 4px', boxShadow: 'var(--shadow-sm)',
                                display: 'flex', alignItems: 'center', gap: 8,
                                color: 'var(--text-muted)', fontSize: 14
                            }}>
                                <Loader size={14} className="animate-spin" /> Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Quick Queries — only for fresh chats */}
                {!messages.some(m => m.role === 'user') && (
                    <div style={{ padding: '0 24px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {quickQueries.map(q => (
                            <button key={q} className="btn btn-secondary btn-sm"
                                onClick={() => handleQuickQuery(q)}
                                style={{ fontSize: 12 }}>
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <form onSubmit={handleSubmit} style={{
                    padding: '12px 24px 16px', background: '#fff',
                    borderTop: '1px solid var(--border)',
                    display: 'flex', gap: 8
                }}>
                    <input
                        className="input"
                        placeholder="Ask about placements, companies, or interview tips..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={loading}
                        autoFocus
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!input.trim() || loading}>
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}
