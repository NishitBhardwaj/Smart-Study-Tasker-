/**
 * Dashboard — Main view with charts and stats.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { statsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StreakCard from '../components/StreakCard';
import WeeklyChart from '../components/WeeklyChart';
import CategoryChart from '../components/CategoryChart';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [weekly, setWeekly] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch stats data
    const loadData = async () => {
        try {
            const [statsRes, weeklyRes, catRes] = await Promise.all([
                statsAPI.getSummary(),
                statsAPI.getWeekly(),
                statsAPI.getCategories(),
            ]);
            setStats(statsRes.data);
            setWeekly(weeklyRes.data);
            setCategories(catRes.data);
        } catch (err) {
            console.error('Load failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-950">
                <Navbar />
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-950">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome + View Tasks Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">
                            Welcome back, <span className="bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">{user?.name}</span>
                        </h1>
                        <p className="text-surface-200/50 mt-1">Here's your productivity overview</p>
                    </div>
                    <Link
                        to="/tasks"
                        className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400
                            text-white font-semibold rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Manage Tasks
                    </Link>
                </div>

                {/* Stats Cards Row */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <StatCard label="Today" value={stats.today_completed} icon="📅" color="text-blue-400" />
                        <StatCard label="This Week" value={stats.week_completed} icon="📊" color="text-purple-400" />
                        <StatCard label="Completed" value={stats.total_completed} icon="✅" color="text-emerald-400" />
                        <StatCard label="Active" value={stats.active_tasks} icon="🎯" color="text-amber-400" />
                    </div>
                )}

                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {/* Streak Card */}
                    <StreakCard
                        streak={stats?.streak || 0}
                        bestStreak={stats?.best_streak || 0}
                    />

                    {/* Weekly Bar Chart */}
                    <WeeklyChart data={weekly?.days || []} />

                    {/* Category Donut */}
                    <CategoryChart data={categories} />
                </div>

                {/* Consistency + Priority Row */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                        <MiniStat label="7-Day Consistency" value={`${(stats.consistency_7d * 100).toFixed(0)}%`} sublabel="of days active" />
                        <MiniStat label="30-Day Consistency" value={`${(stats.consistency_30d * 100).toFixed(0)}%`} sublabel="of days active" />
                        <MiniStat label="Avg Priority" value={`${(stats.avg_priority * 100).toFixed(0)}%`} sublabel="priority score" />
                        <MiniStat label="Completion Rate" value={`${(stats.completion_rate * 100).toFixed(0)}%`} sublabel="finished tasks" />
                    </div>
                )}
            </main>
        </div>
    );
}

// ── Helper Components ────────────────────────────────────────

function StatCard({ label, value, icon, color }) {
    return (
        <div className="rounded-xl border border-white/10 bg-surface-900/60 p-4 flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-surface-200/40">{label}</p>
            </div>
        </div>
    );
}

function MiniStat({ label, value, sublabel }) {
    return (
        <div className="rounded-xl border border-white/10 bg-surface-900/60 p-4">
            <p className="text-xs text-surface-200/50 mb-1">{label}</p>
            <p className="text-lg font-bold text-white">{value}</p>
            <p className="text-[10px] text-surface-200/30">{sublabel}</p>
        </div>
    );
}
