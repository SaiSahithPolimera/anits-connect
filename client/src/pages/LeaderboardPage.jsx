import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Trophy, Medal, Star, TrendingUp } from 'lucide-react';

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/engagement/leaderboard')
            .then(res => setLeaderboard(res.data.leaderboard || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    /* Top-3 medal config */
    const medals = [
        {
            label: '1st Place',
            bg: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            border: '#fbbf24',
            iconBg: '#f59e0b',
            textColor: '#92400e',
            scoreColor: '#b45309',
            icon: <Trophy size={20} color="#fff" />,
        },
        {
            label: '2nd Place',
            bg: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
            border: '#cbd5e1',
            iconBg: '#94a3b8',
            textColor: '#475569',
            scoreColor: '#334155',
            icon: <Medal size={20} color="#fff" />,
        },
        {
            label: '3rd Place',
            bg: 'linear-gradient(135deg, #fef3e2, #fed7aa)',
            border: '#fb923c',
            iconBg: '#ea580c',
            textColor: '#9a3412',
            scoreColor: '#c2410c',
            icon: <Medal size={20} color="#fff" />,
        },
    ];

    const avatarColors = [
        'linear-gradient(135deg,#4338ca,#7c3aed)',
        'linear-gradient(135deg,#0891b2,#0284c7)',
        'linear-gradient(135deg,#059669,#0d9488)',
        'linear-gradient(135deg,#dc2626,#db2777)',
        'linear-gradient(135deg,#d97706,#b45309)',
        'linear-gradient(135deg,#7c3aed,#be185d)',
    ];

    return (
        <>
            <style>{`
                .lb-root {
                    min-height: 100vh;
                    background: #eef0f7;
                    padding: 80px 16px 60px;
                    font-family: 'DM Sans', sans-serif;
                    color: #1a1d2e;
                }
                .lb-wrap {
                    max-width: 680px;
                    margin: 0 auto;
                    animation: lbFade 0.45s ease both;
                }
                @keyframes lbFade {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* ── Hero ── */
                .lb-hero {
                    border-radius: 20px 20px 0 0;
                    padding: 36px 36px 80px;
                    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4338ca 100%);
                    position: relative;
                    overflow: hidden;
                }
                .lb-hero::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
                    background-size: 28px 28px;
                    pointer-events: none;
                }
                .lb-hero::after {
                    content: '';
                    position: absolute;
                    bottom: -1px; left: 0; right: 0;
                    height: 48px;
                    background: #fff;
                    border-radius: 20px 20px 0 0;
                }
                .lb-hero-inner {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .lb-hero-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .lb-hero-icon {
                    width: 56px; height: 56px;
                    border-radius: 14px;
                    background: rgba(255,255,255,0.14);
                    border: 2px solid rgba(255,255,255,0.25);
                    display: flex; align-items: center; justify-content: center;
                    backdrop-filter: blur(8px);
                }
                .lb-hero-title {
                    font-family: 'Sora', sans-serif;
                    font-size: 24px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 4px;
                }
                .lb-hero-sub {
                    font-size: 13px;
                    color: rgba(255,255,255,0.65);
                    margin: 0;
                }
                .lb-hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    background: rgba(255,255,255,0.11);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: rgba(255,255,255,0.9);
                    padding: 8px 16px;
                    border-radius: 999px;
                    font-size: 13px;
                    font-weight: 500;
                    backdrop-filter: blur(8px);
                }

                /* ── Card ── */
                .lb-card {
                    background: #fff;
                    border-radius: 0 0 20px 20px;
                    box-shadow: 0 20px 50px rgba(26,29,46,0.12);
                    position: relative;
                    z-index: 1;
                    padding: 0 0 32px;
                }

                /* ── Tabs strip ── */
                .lb-tab-strip {
                    display: flex;
                    padding: 0 32px;
                    border-bottom: 1px solid #eaecf4;
                    margin-bottom: 32px;
                }
                .lb-tab {
                    padding: 16px 20px 14px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #4338ca;
                    border-bottom: 2px solid #4338ca;
                    font-family: 'DM Sans', sans-serif;
                    user-select: none;
                }

                /* ── Top 3 podium ── */
                .lb-podium {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 12px;
                    padding: 0 24px;
                    margin-bottom: 28px;
                }
                .lb-podium-card {
                    border-radius: 14px;
                    border-width: 1.5px;
                    border-style: solid;
                    padding: 18px 14px;
                    text-align: center;
                    position: relative;
                    transition: transform 0.2s;
                }
                .lb-podium-card:hover { transform: translateY(-3px); }
                .lb-podium-rank {
                    position: absolute;
                    top: -11px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 32px; height: 32px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.18);
                }
                .lb-podium-avatar {
                    width: 44px; height: 44px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: #fff;
                    font-weight: 700;
                    font-size: 16px;
                    margin: 12px auto 8px;
                    border: 2.5px solid rgba(255,255,255,0.8);
                    box-shadow: 0 3px 10px rgba(0,0,0,0.12);
                }
                .lb-podium-name {
                    font-size: 13px;
                    font-weight: 600;
                    margin: 0 0 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .lb-podium-sub {
                    font-size: 11px;
                    color: #9ca3af;
                    margin: 0 0 8px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .lb-podium-score {
                    font-family: 'Sora', sans-serif;
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0;
                }
                .lb-podium-pts {
                    font-size: 10px;
                    color: #9ca3af;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }

                /* ── Section title ── */
                .lb-section-title {
                    font-family: 'Sora', sans-serif;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #b0b7c9;
                    margin: 0 24px 14px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .lb-section-title::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #eaecf4;
                }

                /* ── List rows ── */
                .lb-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding: 0 24px;
                }
                .lb-row {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 13px 16px;
                    border-radius: 12px;
                    border: 1.5px solid #eaecf4;
                    background: #fafbff;
                    transition: all 0.18s;
                    animation: lbFade 0.35s ease both;
                }
                .lb-row:hover {
                    border-color: #c7d2fe;
                    background: #f5f3ff;
                    transform: translateX(3px);
                }
                .lb-row-rank {
                    width: 28px;
                    text-align: center;
                    font-size: 13px;
                    font-weight: 600;
                    color: #9ca3af;
                    flex-shrink: 0;
                }
                .lb-row-avatar {
                    width: 40px; height: 40px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: #fff;
                    font-weight: 600;
                    font-size: 15px;
                    flex-shrink: 0;
                    border: 2px solid rgba(255,255,255,0.9);
                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                }
                .lb-row-info { flex: 1; min-width: 0; }
                .lb-row-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1a1d2e;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin: 0 0 2px;
                }
                .lb-row-sub {
                    font-size: 12px;
                    color: #9ca3af;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin: 0;
                }
                .lb-row-score {
                    text-align: right;
                    flex-shrink: 0;
                }
                .lb-row-pts {
                    font-family: 'Sora', sans-serif;
                    font-size: 18px;
                    font-weight: 700;
                    color: #4338ca;
                    display: block;
                    line-height: 1;
                }
                .lb-row-label {
                    font-size: 10px;
                    color: #9ca3af;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }

                /* ── Empty / Loading ── */
                .lb-center {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 24px;
                    gap: 14px;
                    color: #9ca3af;
                }
                .lb-spinner {
                    width: 36px; height: 36px;
                    border: 3px solid #eaecf4;
                    border-top-color: #4338ca;
                    border-radius: 50%;
                    animation: lbSpin 0.75s linear infinite;
                }
                @keyframes lbSpin { to { transform: rotate(360deg); } }

                @media (max-width: 520px) {
                    .lb-hero          { padding: 24px 20px 70px; }
                    .lb-hero-title    { font-size: 20px; }
                    .lb-hero-badge    { display: none; }
                    .lb-podium        { padding: 0 16px; gap: 8px; }
                    .lb-list          { padding: 0 16px; }
                    .lb-section-title { margin: 0 16px 12px; }
                    .lb-tab-strip     { padding: 0 16px; }
                    .lb-podium-score  { font-size: 16px; }
                }
            `}</style>

            <div className="lb-root">
                <div className="lb-wrap">

                    {/* ── Hero ── */}
                    <div className="lb-hero">
                        <div className="lb-hero-inner">
                            <div className="lb-hero-left">
                                <div className="lb-hero-icon">
                                    <Trophy size={26} color="#fbbf24" />
                                </div>
                                <div>
                                    <h1 className="lb-hero-title">Leaderboard</h1>
                                    <p className="lb-hero-sub">Top contributors on the platform</p>
                                </div>
                            </div>
                            <div className="lb-hero-badge">
                                <TrendingUp size={14} />
                                <span>{leaderboard.length} contributors</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Card ── */}
                    <div className="lb-card">

                        {/* Tab strip */}
                        <div className="lb-tab-strip">
                            <div className="lb-tab">All Time Rankings</div>
                        </div>

                        {loading ? (
                            <div className="lb-center">
                                <div className="lb-spinner" />
                                <span style={{ fontSize: 14 }}>Loading rankings…</span>
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <div className="lb-center">
                                <Trophy size={40} color="#e5e7eb" />
                                <p style={{ fontSize: 15, fontWeight: 600, color: '#6b7280' }}>
                                    No rankings yet
                                </p>
                                <p style={{ fontSize: 13 }}>
                                    Contribute to the platform to appear here
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* ── Top 3 Podium ── */}
                                {leaderboard.length >= 1 && (
                                    <div className="lb-podium">
                                        {leaderboard.slice(0, 3).map((entry, i) => {
                                            const m = medals[i];
                                            return (
                                                <div
                                                    key={i}
                                                    className="lb-podium-card"
                                                    style={{
                                                        background: m.bg,
                                                        borderColor: m.border,
                                                    }}
                                                >
                                                    <div
                                                        className="lb-podium-rank"
                                                        style={{ background: m.iconBg }}
                                                    >
                                                        {m.icon}
                                                    </div>
                                                    <div
                                                        className="lb-podium-avatar"
                                                        style={{
                                                            background: avatarColors[i % avatarColors.length]
                                                        }}
                                                    >
                                                        {entry.profile?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <p
                                                        className="lb-podium-name"
                                                        style={{ color: m.textColor }}
                                                    >
                                                        {entry.profile?.name || 'Unknown'}
                                                    </p>
                                                    <p className="lb-podium-sub">
                                                        {entry.profile?.company || entry.profile?.branch || '—'}
                                                    </p>
                                                    <p
                                                        className="lb-podium-score"
                                                        style={{ color: m.scoreColor }}
                                                    >
                                                        {entry.contributionScore}
                                                    </p>
                                                    <p className="lb-podium-pts">pts</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* ── Rest of the list ── */}
                                {leaderboard.length > 3 && (
                                    <>
                                        <p className="lb-section-title">Rankings</p>
                                        <div className="lb-list">
                                            {leaderboard.slice(3).map((entry, i) => (
                                                <div
                                                    key={i + 3}
                                                    className="lb-row"
                                                    style={{ animationDelay: `${i * 0.04}s` }}
                                                >
                                                    <div className="lb-row-rank">
                                                        {i + 4}
                                                    </div>
                                                    <div
                                                        className="lb-row-avatar"
                                                        style={{
                                                            background: avatarColors[(i + 3) % avatarColors.length]
                                                        }}
                                                    >
                                                        {entry.profile?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="lb-row-info">
                                                        <p className="lb-row-name">
                                                            {entry.profile?.name || 'Unknown'}
                                                        </p>
                                                        <p className="lb-row-sub">
                                                            {entry.profile?.company || entry.profile?.branch || '—'}
                                                        </p>
                                                    </div>
                                                    <div className="lb-row-score">
                                                        <span className="lb-row-pts">
                                                            {entry.contributionScore}
                                                        </span>
                                                        <span className="lb-row-label">pts</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
