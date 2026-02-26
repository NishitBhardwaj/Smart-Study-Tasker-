/**
 * Profile page with user info, activity heatmap, and settings.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, statsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import ActivityHeatmap from '../components/ActivityHeatmap';

export default function Profile() {
    const { user, setUser } = useAuth();
    const [heatmap, setHeatmap] = useState(null);
    const [stats, setStats] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', timezone: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [heatmapRes, statsRes] = await Promise.all([
                    statsAPI.getHeatmap(),
                    statsAPI.getSummary(),
                ]);
                setHeatmap(heatmapRes.data);
                setStats(statsRes.data);
                setForm({ name: user?.name || '', timezone: user?.timezone || 'UTC' });
            } catch (err) {
                console.error('Profile load failed:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await authAPI.updateProfile(form);
            if (setUser) setUser(res.data);
            setEditing(false);
        } catch (err) {
            console.error('Profile update failed:', err);
        } finally {
            setSaving(false);
        }
    };

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

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header */}
                <div className="rounded-2xl border border-white/10 bg-surface-900/80 p-6 mb-6">
                    <div className="flex items-center gap-5">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-2xl font-bold text-white shadow-glow">
                            {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>

                        <div className="flex-1">
                            {editing ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                                 focus:outline-none focus:border-primary-500/50"
                                    />
                                    <select
                                        value={form.timezone}
                                        onChange={(e) => setForm(prev => ({ ...prev, timezone: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                                 focus:outline-none focus:border-primary-500/50 [color-scheme:dark]"
                                    >
                                        <option value="UTC">UTC</option>
                                        <option value="America/New_York">US Eastern</option>
                                        <option value="America/Chicago">US Central</option>
                                        <option value="America/Los_Angeles">US Pacific</option>
                                        <option value="Europe/London">London</option>
                                        <option value="Europe/Berlin">Berlin</option>
                                        <option value="Asia/Kolkata">India</option>
                                        <option value="Asia/Tokyo">Tokyo</option>
                                    </select>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-500 transition-colors"
                                        >
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setEditing(false)}
                                            className="px-4 py-1.5 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
                                        <button
                                            onClick={() => setEditing(true)}
                                            className="p-1.5 text-surface-200/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-surface-200/50 text-sm mt-0.5">{user?.email}</p>
                                    <p className="text-surface-200/40 text-xs mt-0.5">🌍 {user?.timezone || 'UTC'}</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <ProfileStat label="Total Completed" value={stats.total_completed} icon="✅" />
                        <ProfileStat label="Current Streak" value={`${stats.streak}d`} icon="🔥" />
                        <ProfileStat label="Best Streak" value={`${stats.best_streak}d`} icon="🏆" />
                        <ProfileStat label="Completion Rate" value={`${(stats.completion_rate * 100).toFixed(0)}%`} icon="📈" />
                    </div>
                )}

                {/* Activity Heatmap */}
                <ActivityHeatmap data={heatmap} />

                {/* Account Info */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-surface-900/80 p-6">
                    <h3 className="text-sm font-medium text-surface-200/60 mb-4">Account Details</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-surface-200/50">Member since</span>
                            <span className="text-white">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-surface-200/50">Email</span>
                            <span className="text-white">{user?.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-surface-200/50">Timezone</span>
                            <span className="text-white">{user?.timezone || 'UTC'}</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ProfileStat({ label, value, icon }) {
    return (
        <div className="rounded-xl border border-white/10 bg-surface-900/60 p-4 text-center">
            <span className="text-xl">{icon}</span>
            <p className="text-lg font-bold text-white mt-1">{value}</p>
            <p className="text-[10px] text-surface-200/40">{label}</p>
        </div>
    );
}
