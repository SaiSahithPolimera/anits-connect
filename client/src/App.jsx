import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import ProfilePage    from './pages/ProfilePage';
import ChatPage       from './pages/ChatPage';
import AIPage         from './pages/AIPage';
import AdminDashboard from './pages/AdminDashboard';
import LeaderboardPage    from './pages/LeaderboardPage';
import MentorListPage     from './pages/MentorListPage';
import MockInterviewPage  from './pages/MockInterviewPage';
import OpeningsPage       from './pages/OpeningsPage';
import NotificationsPage  from './pages/NotificationsPage';

function AppRoutes() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
                </div>
            </div>
        );
    }

    /* Public routes — no sidebar */
    if (!user) {
        return (
            <Routes>
                <Route path="/login"    element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*"         element={<Navigate to="/login" />} />
            </Routes>
        );
    }

    /* Authenticated routes — sidebar layout */
    return (
        <div className="sb-layout">
            {/* Fixed left sidebar */}
            <Navbar />

            {/* Page content shifts right */}
            <main className="sb-page">
                <Routes>
                    <Route path="/login"    element={<Navigate to={user.role === 'admin' ? '/admin' : '/mentors'} />} />
                    <Route path="/register" element={<Navigate to={user.role === 'admin' ? '/admin' : '/mentors'} />} />

                    <Route path="/"               element={<Navigate to="/mentors" />} />
                    <Route path="/mentors"         element={<ProtectedRoute><MentorListPage /></ProtectedRoute>} />
                    <Route path="/mock-interview"  element={<ProtectedRoute><MockInterviewPage /></ProtectedRoute>} />
                    <Route path="/openings"        element={<ProtectedRoute><OpeningsPage /></ProtectedRoute>} />
                    <Route path="/notifications"   element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                    <Route path="/profile"         element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/chat/:seniorId?" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                    <Route path="/ai"              element={<ProtectedRoute><AIPage /></ProtectedRoute>} />
                    <Route path="/leaderboard"     element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
                    <Route path="/admin"           element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to={user.role === 'admin' ? '/admin' : '/mentors'} />} />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: '#fff',
                            color: '#0f172a',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                            fontSize: '14px'
                        }
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    );
}
