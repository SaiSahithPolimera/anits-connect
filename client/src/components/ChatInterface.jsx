import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [chats, setChats] = useState([]);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    // Load chats on mount
    useEffect(() => {
        loadChats();
    }, []);

    const loadChats = async () => {
        try {
            setIsLoadingChats(true);
            const response = await fetch('/api/chats');
            const data = await response.json();
            setChats(data.chats || []);

            // Auto-select most recent chat if exists
            if (data.chats && data.chats.length > 0) {
                await selectChat(data.chats[0]._id);
            }
        } catch (error) {
            console.error('Error loading chats:', error);
        } finally {
            setIsLoadingChats(false);
        }
    };

    const selectChat = async (chatId) => {
        try {
            setCurrentChatId(chatId);
            const response = await fetch(`/api/chats/${chatId}`);
            const data = await response.json();

            if (data.messages) {
                setMessages(data.messages.map(msg => ({
                    id: msg.id,
                    text: msg.text,
                    sender: msg.sender
                })));
            }
        } catch (error) {
            console.error('Error loading chat:', error);
        }
    };

    const createNewChat = () => {
        setCurrentChatId(null);
        setMessages([]);
        setInput('');
    };

    const deleteChat = async (chatId, e) => {
        e.stopPropagation();
        try {
            await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
            await loadChats();
            if (chatId === currentChatId) {
                createNewChat();
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    const handleSend = async (text = input) => {
        if (!text.trim() || isLoading) return;

        const userMessage = { id: Date.now(), text: text, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.text,
                    chatId: currentChatId
                }),
            });

            const data = await response.json();

            if (data.chatId && !currentChatId) {
                setCurrentChatId(data.chatId);
                loadChats();
            }

            const botMessage = { id: Date.now() + 1, text: data.response, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Error:", error);
            const errorMessage = { id: Date.now() + 1, text: "Sorry, I encountered an error. Please check your connection.", sender: 'bot' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const suggestions = [
        "What is the highest package offered?",
        "Tell me about CSE placements",
        "Which companies visited in 2023?",
        "Placement policy details"
    ];

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Sidebar - Enhanced */}
            <div className="hidden md:flex w-[300px] flex-col bg-white shadow-xl border-r border-gray-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-11 w-11 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-bold text-xl text-gray-900">Alumni GPT</h1>
                            <p className="text-xs text-gray-500">ANITS Assistant</p>
                        </div>
                    </div>
                    <button
                        onClick={createNewChat}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3.5 rounded-xl transition-all w-full font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        New Chat
                    </button>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto px-3 py-4">
                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Recent Conversations
                    </div>
                    {isLoadingChats ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">No conversations yet</p>
                            <p className="text-xs text-gray-400 mt-1">Start chatting to see history</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {chats.map((chat) => (
                                <div
                                    key={chat._id}
                                    className={`group relative px-4 py-3.5 rounded-xl transition-all cursor-pointer ${currentChatId === chat._id
                                        ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                                        : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-200'
                                        }`}
                                    onClick={() => selectChat(chat._id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${currentChatId === chat._id ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-50'
                                            }`}>
                                            <svg className={`h-4 w-4 ${currentChatId === chat._id ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm text-gray-900 truncate mb-1">{chat.title}</div>
                                            <div className="text-xs text-gray-500">{formatDate(chat.updatedAt)}</div>
                                        </div>
                                        <button
                                            onClick={(e) => deleteChat(chat._id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                                            title="Delete chat"
                                        >
                                            <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div className="mt-auto p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3 p-3 hover:bg-white rounded-xl transition-all cursor-pointer">
                        <div className="h-11 w-11 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shadow-sm text-lg">
                            A
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm">Alumni</div>
                            <div className="text-xs text-gray-500">ANITS Student</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative bg-white">
                {/* Top Bar - Mobile */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200 shadow-sm md:hidden">
                    <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            </svg>
                        </div>
                        <span className="font-bold text-gray-900 text-lg">Alumni GPT</span>
                    </div>
                    <button
                        onClick={createNewChat}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
                            {/* Hero Section */}
                            <div className="mb-10">
                                <div className="h-24 w-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl mx-auto mb-8 transform transition-transform hover:scale-105">
                                    <svg className="h-14 w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                    </svg>
                                </div>
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Alumni GPT</h2>
                            <p className="text-lg text-gray-600 mb-14 max-w-lg leading-relaxed">Your intelligent ANITS placement assistant. Ask me anything about placements, companies, or policies!</p>

                            {/* Suggestion Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(s)}
                                        className="group text-left p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-500 bg-white hover:bg-blue-50 transition-all text-sm font-medium text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="mt-0.5 p-2.5 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                                                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                            <span className="flex-1 leading-relaxed">{s}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col pb-40 pt-6">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`w-full px-6 py-8 ${msg.sender === 'bot' ? 'bg-white' : 'bg-gray-50'}`}
                                >
                                    <div className="mx-auto flex max-w-4xl gap-5">
                                        <div className="flex-shrink-0">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-md ${msg.sender === 'bot'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-purple-600 text-white'
                                                }`}>
                                                {msg.sender === 'bot' ? (
                                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                                    </svg>
                                                ) : (
                                                    <span className="text-base font-bold">A</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm mb-3 text-gray-900">
                                                {msg.sender === 'bot' ? 'Alumni GPT' : 'You'}
                                            </div>
                                            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                                                {msg.sender === 'bot' ? (
                                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                ) : (
                                                    <p className="whitespace-pre-wrap text-base">{msg.text}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="w-full px-6 py-8 bg-white">
                                    <div className="mx-auto flex max-w-4xl gap-5">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-600 text-white shadow-md">
                                                <svg className="h-6 w-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1 pt-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce"></span>
                                                <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                                                <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area - Enhanced */}
                <div className="sticky bottom-0 left-0 w-full bg-white border-t border-gray-200 pt-6 pb-8 px-6 shadow-2xl">
                    <div className="mx-auto max-w-4xl">
                        <div className="relative flex items-end w-full rounded-2xl bg-white border-2 border-gray-300 hover:border-blue-500 focus-within:border-blue-600 transition-all px-6 py-4 shadow-lg">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Alumni GPT anything..."
                                className="flex-1 resize-none border-0 bg-transparent p-0 pr-14 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus-visible:ring-0 max-h-[200px] overflow-y-auto outline-none text-base"
                                style={{ height: '28px', maxHeight: '200px' }}
                                rows={1}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={isLoading || !input.trim()}
                                className={`absolute bottom-3 right-3 rounded-xl p-3 transition-all transform hover:scale-110 active:scale-95 ${input.trim()
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9-7-9-7-9 7 9 7z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5" />
                                </svg>
                            </button>
                        </div>
                        <div className="text-center text-xs text-gray-500 mt-4 font-medium">
                            Alumni GPT is powered by AI. Always verify important information.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
