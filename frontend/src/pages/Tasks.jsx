/**
 * Dedicated Tasks page — full interactive list with filters.
 */

import { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters & Modals
    const [activeFilter, setActiveFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editTask, setEditTask] = useState(null);

    // Fetch tasks
    const loadTasks = async () => {
        try {
            const res = await taskAPI.getAll(activeFilter !== 'all' ? activeFilter : null);
            setTasks(res.data);
        } catch (err) {
            console.error('Failed to load tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [activeFilter]);

    // CRUD Ops
    const handleCreate = async (data) => {
        await taskAPI.create(data);
        setShowForm(false);
        loadTasks();
    };

    const handleUpdate = async (data) => {
        await taskAPI.update(editTask.id, data);
        setEditTask(null);
        loadTasks();
    };

    const handleComplete = async (id) => {
        await taskAPI.complete(id);
        loadTasks();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this task?')) {
            await taskAPI.delete(id);
            loadTasks();
        }
    };

    const filterTabs = [
        { key: 'all', label: 'All Tasks', icon: '📋' },
        { key: 'today', label: 'Today', icon: '📅' },
        { key: 'upcoming', label: 'Upcoming', icon: '⏳' },
        { key: 'completed', label: 'Completed', icon: '✅' },
    ];

    return (
        <div className="min-h-screen bg-surface-950">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Your Tasks</h1>
                        <p className="text-surface-200/50 mt-1">Manage, filter, and track your daily progress</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400
                            text-white font-semibold rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        New Task
                    </button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
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
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.length === 0 ? (
                            <div className="text-center py-16 text-surface-200/30 bg-white/5 border border-white/10 rounded-2xl">
                                <p className="text-4xl mb-3">📝</p>
                                <p className="text-lg text-surface-200/80">No tasks found</p>
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
                )}
            </main>

            {/* Modals */}
            {(showForm || editTask) && (
                <TaskForm
                    task={editTask}
                    onSubmit={editTask ? handleUpdate : handleCreate}
                    onClose={() => {
                        setShowForm(false);
                        setEditTask(null);
                    }}
                />
            )}
        </div>
    );
}
