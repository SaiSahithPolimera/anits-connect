import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ReactMarkdown from 'react-markdown';
import {
    Send, Sparkles, User, Eye, MessageSquare, Video, Loader,
    Plus, Trash2, MessageCircle, PanelLeftClose, PanelLeft, X, History
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
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Track screen resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        handleResize(); // initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        if (isMobile) setSidebarOpen(false);
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

    const handleSelectChat = (chatId) => {
        setActiveChatId(chatId);
        if (isMobile) setSidebarOpen(false);
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
        <div className="ai-chat-layout">
            {/* ── Mobile overlay backdrop ── */}
            {isMobile && sidebarOpen && (
                <div className="ai-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── History Sidebar ────────────────────────────── */}
            <div className={`ai-sidebar ${sidebarOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
                {/* Sidebar Header with Close Button */}
                <div className="ai-sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <History size={16} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Chat History</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ai-sidebar-close"
                        title="Close history"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* New Chat Button */}
                <div style={{ padding: '8px 12px' }}>
                    <button onClick={handleNewChat} className="btn btn-primary"
                        style={{ width: '100%', gap: 8, fontWeight: 600 }}>
                        <Plus size={16} /> New Chat
                    </button>
                </div>

                {/* Chat List */}
                <div className="ai-sidebar-list">
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => handleSelectChat(chat.id)}
                            className={`ai-chat-item ${chat.id === activeChatId ? 'active' : ''}`}
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
                            <span className="ai-chat-item-title">
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
            <div className="ai-main">
                {/* Header */}
                <div className="ai-chat-header">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="ai-history-toggle"
                        title={sidebarOpen ? 'Close history' : 'Open history'}>
                        <PanelLeft size={18} />
                    </button>
                    <div style={{
                        width: 32, height: 32,
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Sparkles size={16} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h1 className="ai-chat-title">{activeChat?.title || 'New Chat'}</h1>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Powered by ANITS placement data</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="ai-messages-area">
                    {messages.map((msg, i) => (
                        <div key={i} className="animate-fade-in"
                            style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
                            {msg.role === 'ai' && (
                                <div className="ai-avatar-icon">
                                    <Sparkles size={13} color="#fff" />
                                </div>
                            )}
                            <div className={`ai-message-bubble ${msg.role}`}>
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
                                <div className="ai-avatar-icon user">
                                    <User size={13} color="var(--primary)" />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="animate-fade-in" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div className="ai-avatar-icon">
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
                    <div className="ai-quick-queries">
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
                <form onSubmit={handleSubmit} className="ai-input-area">
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

            <style>{`
                .ai-chat-layout {
                    display: flex;
                    height: calc(100vh - 60px);
                    overflow: hidden;
                    position: relative;
                }

                /* ── Sidebar ── */
                .ai-sidebar {
                    display: flex;
                    flex-direction: column;
                    background: #fff;
                    border-right: 1px solid var(--border);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: hidden;
                    z-index: 20;
                }

                .ai-sidebar.open:not(.mobile) {
                    width: 280px;
                    min-width: 280px;
                }

                .ai-sidebar.closed:not(.mobile) {
                    width: 0;
                    min-width: 0;
                    border-right: none;
                }

                /* Mobile sidebar = full-screen overlay drawer */
                .ai-sidebar.mobile {
                    position: fixed;
                    top: 56px;
                    left: 0;
                    bottom: 0;
                    width: 300px;
                    max-width: 85vw;
                    transform: translateX(-100%);
                    box-shadow: none;
                    z-index: 60;
                }

                .ai-sidebar.mobile.open {
                    transform: translateX(0);
                    box-shadow: 8px 0 30px rgba(0,0,0,0.15);
                    border-radius: 0 16px 16px 0;
                }

                .ai-sidebar-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(4px);
                    z-index: 55;
                    animation: fadeIn 0.2s ease-out;
                }

                .ai-sidebar-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 14px 12px;
                    border-bottom: 1px solid var(--border);
                    flex-shrink: 0;
                }

                .ai-sidebar-close {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    background: var(--bg-hover);
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s;
                    flex-shrink: 0;
                }

                .ai-sidebar-close:hover {
                    background: #fee2e2;
                    color: #ef4444;
                    border-color: #fecaca;
                }

                .ai-sidebar-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px;
                }

                .ai-chat-item {
                    padding: 10px 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-secondary);
                    transition: all 0.15s;
                    margin-bottom: 2px;
                    position: relative;
                }

                .ai-chat-item:hover {
                    background: var(--bg-hover);
                }

                .ai-chat-item.active {
                    background: var(--primary-50);
                    color: var(--primary);
                    font-weight: 600;
                }

                .ai-chat-item-title {
                    flex: 1;
                    font-size: 13px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .ai-chat-item.active .ai-chat-item-title {
                    font-weight: 600;
                }

                /* ── Main Chat Area ── */
                .ai-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg);
                    min-width: 0;
                }

                .ai-chat-header {
                    padding: 12px 16px;
                    background: #fff;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-shrink: 0;
                }

                .ai-chat-title {
                    font-size: 15px;
                    font-weight: 600;
                    margin: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .ai-messages-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .ai-avatar-icon {
                    width: 28px;
                    height: 28px;
                    flex-shrink: 0;
                    background: linear-gradient(135deg, var(--primary), var(--accent));
                    border-radius: 7px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 2px;
                }

                .ai-avatar-icon.user {
                    background: var(--primary-100);
                }

                .ai-message-bubble {
                    max-width: 78%;
                    box-shadow: var(--shadow-sm);
                    font-size: 14px;
                }

                .ai-message-bubble.user {
                    padding: 10px 16px;
                    border-radius: 16px 16px 4px 16px;
                    background: var(--primary);
                    color: #fff;
                }

                .ai-message-bubble.ai {
                    padding: 14px 18px;
                    border-radius: 16px 16px 16px 4px;
                    background: #fff;
                    color: var(--text);
                }

                .ai-quick-queries {
                    padding: 0 16px 8px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }

                .ai-input-area {
                    padding: 12px 16px 16px;
                    background: #fff;
                    border-top: 1px solid var(--border);
                    display: flex;
                    gap: 8px;
                    flex-shrink: 0;
                }

                .ai-history-toggle {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    border: 1.5px solid var(--border);
                    background: var(--bg-hover);
                    color: var(--primary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: all 0.15s;
                }

                .ai-history-toggle:hover {
                    background: var(--primary-50);
                    border-color: var(--primary-100);
                    color: var(--primary-dark);
                }

                /* ── Responsive adjustments ── */
                @media (max-width: 768px) {
                    .ai-chat-layout {
                        height: calc(100vh - 56px);
                    }

                    .ai-messages-area {
                        padding: 16px 12px;
                    }

                    .ai-message-bubble {
                        max-width: 88%;
                    }

                    .ai-message-bubble.ai {
                        padding: 12px 14px;
                    }

                    .ai-message-bubble.user {
                        padding: 8px 14px;
                    }

                    .ai-input-area {
                        padding: 10px 12px 14px;
                    }

                    .ai-chat-header {
                        padding: 10px 12px;
                    }

                    .ai-chat-title {
                        font-size: 14px;
                    }

                    .ai-quick-queries {
                        padding: 0 12px 6px;
                    }

                    .ai-avatar-icon {
                        width: 24px;
                        height: 24px;
                        border-radius: 6px;
                    }
                }

                @media (max-width: 480px) {
                    .ai-message-bubble {
                        max-width: 92%;
                        font-size: 13px;
                    }

                    .ai-message-bubble.ai {
                        padding: 10px 12px;
                    }

                    .ai-message-bubble.user {
                        padding: 8px 12px;
                    }
                }
            `}</style>
        </div>
    );
}
