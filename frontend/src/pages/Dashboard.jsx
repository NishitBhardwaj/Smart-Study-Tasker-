/**
 * Dashboard — Main view with charts, stats, and task list.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI, statsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import StreakCard from '../components/StreakCard';
import WeeklyChart from '../components/WeeklyChart';
import CategoryChart from '../components/CategoryChart';

export default function Dashboard() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState(null);
    const [weekly, setWeekly] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal & filter state
    const [showForm, setShowForm] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');

    // Fetch all data
    const loadData = async () => {
        try {
            const [tasksRes, statsRes, weeklyRes, catRes] = await Promise.all([
                taskAPI.getAll(activeFilter !== 'all' ? activeFilter : null),
                statsAPI.getSummary(),
                statsAPI.getWeekly(),
                statsAPI.getCategories(),
            ]);
            setTasks(tasksRes.data);
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
    }, [activeFilter]);

    // Task CRUD handlers
    const handleCreate = async (data) => {
        await taskAPI.create(data);
        setShowForm(false);
        loadData();
    };

    const handleUpdate = async (data) => {
        await taskAPI.update(editTask.id, data);
        setEditTask(null);
        loadData();
    };

    const handleComplete = async (id) => {
        await taskAPI.complete(id);
        loadData();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this task?')) {
            await taskAPI.delete(id);
            loadData();
        }
    };

    const filterTabs = [
        { key: 'all', label: 'All Tasks', icon: '📋' },
        { key: 'today', label: 'Today', icon: '📅' },
        { key: 'upcoming', label: 'Upcoming', icon: '⏳' },
        { key: 'completed', label: 'Completed', icon: '✅' },
    ];

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
                {/* Welcome + Create Button */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">
                            Welcome back, <span className="bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">{user?.name}</span>
                        </h1>
                        <p className="text-surface-200/50 mt-1">Here's your productivity overview</p>
                    </div>
                    <button
                        id="create-task-btn"
                        onClick={() => setShowForm(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400
                            text-white font-semibold rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-300 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        New Task
                    </button>
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

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveFilter(tab.key)}
                            className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-200 whitespace-nowrap
                                ${activeFilter === tab.key
                                    ? 'bg-primary-600/20 text-primary-300 border-primary-500/30'
                                    : 'bg-white/5 text-surface-200/50 border-white/10 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            <span className="mr-1.5">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Task List */}
                <div className="space-y-3">
                    {tasks.length === 0 ? (
                        <div className="text-center py-16 text-surface-200/30">
                            <p className="text-4xl mb-3">📝</p>
                            <p className="text-lg">No tasks found</p>
                            <p className="text-sm mt-1">Create your first task to get started!</p>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={(t) => setEditTask(t)}
                                onDelete={handleDelete}
                                onComplete={handleComplete}
                            />
                        ))
                    )}
                </div>
            </main>

            {/* Create/Edit Modal */}
            {(showForm || editTask) && (
                <TaskForm
                    task={editTask}
                    onSubmit={editTask ? handleUpdate : handleCreate}
                    onClose={() => { setShowForm(false); setEditTask(null); }}
                />
            )}
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
