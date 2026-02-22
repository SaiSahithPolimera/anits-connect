import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Send, ArrowLeft, Building2 } from 'lucide-react';

export default function ChatPage() {
    const { seniorId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(seniorId || null);
    const [messages, setMessages] = useState([]);
    const [contactProfile, setContactProfile] = useState(null);
    const [newMsg, setNewMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef(null);

    useEffect(() => { loadConversations(); }, []);
    useEffect(() => { if (activeChat) loadMessages(activeChat); }, [activeChat]);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const loadConversations = async () => {
        try {
            const res = await api.get('/messages/conversations');
            setConversations(res.data.conversations || []);

            // If seniorId from URL, also load profiles for display
            if (seniorId && !conversations.find(c => c.contactId === seniorId)) {
                setActiveChat(seniorId);
            }
        } catch (_) { } finally { setLoading(false); }
    };

    const loadMessages = async (userId) => {
        try {
            const res = await api.get(`/messages/${userId}`);
            setMessages(res.data.messages || []);
            setContactProfile(res.data.contactProfile);
        } catch (_) { }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMsg.trim() || sending) return;
        setSending(true);
        try {
            await api.post('/messages', { receiverId: activeChat, text: newMsg.trim() });
            setNewMsg('');
            loadMessages(activeChat);
            loadConversations();
        } catch (_) { } finally { setSending(false); }
    };

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
            {/* Sidebar */}
            <div style={{
                width: 320, borderRight: '1px solid var(--border)', background: '#fff',
                display: activeChat && window.innerWidth < 768 ? 'none' : 'flex',
                flexDirection: 'column', flexShrink: 0
            }}>
                <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600 }}>Messages</h2>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {conversations.length === 0 && !loading ? (
                        <div className="empty-state" style={{ padding: '32px 16px' }}>
                            <p style={{ fontSize: 14 }}>No conversations yet</p>
                            <p style={{ fontSize: 12, marginTop: 4 }}>Message a senior from the home page</p>
                        </div>
                    ) : conversations.map(conv => (
                        <div
                            key={conv.contactId}
                            onClick={() => setActiveChat(conv.contactId)}
                            style={{
                                padding: '14px 16px',
                                display: 'flex', gap: 12, alignItems: 'center',
                                cursor: 'pointer',
                                background: activeChat === conv.contactId ? 'var(--primary-50)' : 'transparent',
                                borderLeft: activeChat === conv.contactId ? '3px solid var(--primary)' : '3px solid transparent',
                                transition: 'all 0.15s'
                            }}
                        >
                            <img
                                src={conv.contactProfile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.contactProfile?.name || 'U')}&background=3b82f6&color=fff`}
                                className="avatar avatar-sm" alt=""
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>{conv.contactProfile?.name || 'User'}</span>
                                    {conv.unreadCount > 0 && (
                                        <span style={{
                                            background: 'var(--primary)', color: '#fff',
                                            borderRadius: 999, padding: '1px 7px',
                                            fontSize: 11, fontWeight: 600
                                        }}>{conv.unreadCount}</span>
                                    )}
                                </div>
                                <p style={{
                                    fontSize: 12, color: 'var(--text-muted)', marginTop: 2,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                }}>
                                    {conv.lastMessage?.text || ''}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
                {!activeChat ? (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)', fontSize: 14
                    }}>
                        Select a conversation or message a senior from the home page
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div style={{
                            padding: '14px 20px', background: '#fff',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', gap: 12
                        }}>
                            <button className="btn btn-ghost btn-icon" onClick={() => setActiveChat(null)} style={{ display: 'none' }}>
                                <ArrowLeft size={18} />
                            </button>
                            {contactProfile && (
                                <>
                                    <img
                                        src={contactProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactProfile.name)}&background=3b82f6&color=fff`}
                                        className="avatar avatar-sm" alt=""
                                    />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{contactProfile.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Building2 size={11} /> {contactProfile.company || contactProfile.role || ''}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Messages */}
                        <div style={{
                            flex: 1, overflowY: 'auto', padding: '16px 20px',
                            display: 'flex', flexDirection: 'column', gap: 10,
                            background: '#f8f9fa'
                        }}>
                            {messages.map((msg, i) => {
                                const myId = String(user?.id || user?._id || '');
                                const senderId = String(msg.senderId?._id || msg.senderId || '');
                                const isMine = myId && senderId && myId === senderId;

                                // Group consecutive messages from same sender
                                const prevMsg = messages[i - 1];
                                const prevSenderId = prevMsg ? String(prevMsg.senderId?._id || prevMsg.senderId || '') : '';
                                const isFirstInGroup = prevSenderId !== senderId;

                                return (
                                    <div key={msg._id || i} className="animate-fade-in"
                                        style={{
                                            display: 'flex',
                                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                                            gap: 8,
                                            marginTop: isFirstInGroup ? 8 : 0
                                        }}>
                                        {/* Avatar for received messages (first in group) */}
                                        {!isMine && (
                                            <div style={{ width: 32, flexShrink: 0, alignSelf: 'flex-end' }}>
                                                {isFirstInGroup && contactProfile && (
                                                    <img
                                                        src={contactProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactProfile.name)}&background=7c3aed&color=fff&size=32`}
                                                        style={{ width: 32, height: 32, borderRadius: '50%' }}
                                                        alt=""
                                                    />
                                                )}
                                            </div>
                                        )}

                                        <div style={{
                                            maxWidth: '65%',
                                            padding: '8px 14px',
                                            borderRadius: isMine
                                                ? (isFirstInGroup ? '18px 18px 4px 18px' : '18px 4px 4px 18px')
                                                : (isFirstInGroup ? '18px 18px 18px 4px' : '4px 18px 18px 4px'),
                                            background: isMine ? '#1a73e8' : '#fff',
                                            color: isMine ? '#fff' : '#202124',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                            fontSize: 14, lineHeight: 1.55
                                        }}>
                                            {/* Sender name for first message in group */}
                                            {isFirstInGroup && !isMine && contactProfile && (
                                                <div style={{
                                                    fontSize: 12, fontWeight: 600,
                                                    color: '#7c3aed',
                                                    marginBottom: 3
                                                }}>
                                                    {contactProfile.name}
                                                </div>
                                            )}

                                            <span style={{ wordBreak: 'break-word' }}>{msg.text}</span>

                                            <div style={{
                                                display: 'flex', justifyContent: 'flex-end',
                                                alignItems: 'center', gap: 4, marginTop: 4
                                            }}>
                                                <span style={{
                                                    fontSize: 10,
                                                    color: isMine ? 'rgba(255,255,255,0.7)' : '#5f6368'
                                                }}>
                                                    {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Avatar for sent messages (first in group) */}
                                        {isMine && (
                                            <div style={{ width: 32, flexShrink: 0, alignSelf: 'flex-end' }}>
                                                {isFirstInGroup && (
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: '50%',
                                                        background: '#1a73e8',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontSize: 13, fontWeight: 600
                                                    }}>
                                                        {(user?.email?.[0] || 'U').toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={sendMessage} style={{
                            padding: '12px 20px', background: '#fff',
                            borderTop: '1px solid var(--border)',
                            display: 'flex', gap: 8
                        }}>
                            <input
                                className="input"
                                placeholder="Type a message..."
                                value={newMsg}
                                onChange={e => setNewMsg(e.target.value)}
                                autoFocus
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="btn btn-primary" disabled={!newMsg.trim() || sending}>
                                <Send size={16} />
                            </button>
                        </form>
                    </>
                )}
            </div>

            <style>{`
        @media (max-width: 768px) {
          div[style*="width: 320"] { width: 100% !important; }
        }
      `}</style>
        </div>
    );
}

