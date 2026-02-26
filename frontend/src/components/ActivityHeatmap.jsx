/**
 * Activity Heatmap — GitHub-style contribution grid.
 * Shows 365 days of task completion activity with color intensity.
 */

import { useState } from 'react';

const LEVEL_COLORS = [
    'bg-white/5',           // level 0 — no activity
    'bg-emerald-900/60',    // level 1 — light
    'bg-emerald-700/70',    // level 2 — medium
    'bg-emerald-500/80',    // level 3 — high
    'bg-emerald-400',       // level 4 — max
];

export default function ActivityHeatmap({ data = null }) {
    const [tooltip, setTooltip] = useState(null);

    if (!data || !data.days || data.days.length === 0) {
        return (
            <div className="rounded-2xl border border-white/10 bg-surface-900/80 p-6">
                <h3 className="text-sm font-medium text-surface-200/60 mb-4">Activity</h3>
                <div className="flex items-center justify-center h-24 text-surface-200/30 text-sm">
                    No activity data yet
                </div>
            </div>
        );
    }

    const { days, total_contributions, current_streak, longest_streak } = data;

    // Group days into weeks (columns)
    // Each column = 7 days (Mon-Sun)
    const weeks = [];
    let currentWeek = [];

    // Pad the first week so it starts on Monday
    if (days.length > 0) {
        const firstDate = new Date(days[0].date + 'T00:00:00');
        const firstDayOfWeek = (firstDate.getDay() + 6) % 7; // 0=Mon, 6=Sun
        for (let i = 0; i < firstDayOfWeek; i++) {
            currentWeek.push(null); // empty cells
        }
    }

    for (const day of days) {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }
    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }

    // Month labels
    const monthLabels = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
        const validDay = week.find(d => d !== null);
        if (validDay) {
            const month = new Date(validDay.date + 'T00:00:00').getMonth();
            if (month !== lastMonth) {
                monthLabels.push({ index: wi, label: new Date(validDay.date + 'T00:00:00').toLocaleDateString('en', { month: 'short' }) });
                lastMonth = month;
            }
        }
    });

    return (
        <div className="rounded-2xl border border-white/10 bg-surface-900/80 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-medium text-surface-200/60">Activity</h3>
                    <p className="text-lg font-bold text-white mt-0.5">
                        {total_contributions} <span className="text-sm text-surface-200/40 font-normal">contributions</span>
                    </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-surface-200/50">
                    <span>🔥 {current_streak}d streak</span>
                    <span>🏆 {longest_streak}d best</span>
                </div>
            </div>

            {/* Month labels */}
            <div className="flex ml-8 mb-1">
                {monthLabels.map((m, i) => (
                    <span
                        key={i}
                        className="text-[10px] text-surface-200/40"
                        style={{
                            position: 'relative',
                            left: `${(m.index / weeks.length) * 100}%`,
                            marginLeft: i === 0 ? 0 : '-20px',
                        }}
                    >
                        {m.label}
                    </span>
                ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-0.5 overflow-x-auto pb-2 relative">
                {/* Day labels */}
                <div className="flex flex-col gap-0.5 mr-1 shrink-0">
                    {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
                        <div key={i} className="h-[13px] flex items-center">
                            <span className="text-[9px] text-surface-200/30 w-6 text-right">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Weeks */}
                {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-0.5">
                        {Array.from({ length: 7 }, (_, di) => {
                            const day = week[di] || null;
                            if (!day) {
                                return <div key={di} className="w-[13px] h-[13px]"></div>;
                            }
                            return (
                                <div
                                    key={di}
                                    className={`w-[13px] h-[13px] rounded-sm ${LEVEL_COLORS[day.level]} 
                                        cursor-pointer hover:ring-1 hover:ring-white/30 transition-all`}
                                    onMouseEnter={() => setTooltip({ x: wi, y: di, ...day })}
                                    onMouseLeave={() => setTooltip(null)}
                                    title={`${day.date}: ${day.count} task${day.count !== 1 ? 's' : ''}`}
                                ></div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-1 mt-2">
                <span className="text-[10px] text-surface-200/30 mr-1">Less</span>
                {LEVEL_COLORS.map((color, i) => (
                    <div key={i} className={`w-[11px] h-[11px] rounded-sm ${color}`}></div>
                ))}
                <span className="text-[10px] text-surface-200/30 ml-1">More</span>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div className="fixed z-50 bg-surface-800 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white shadow-xl pointer-events-none"
                    style={{
                        bottom: '20px',
                        right: '20px',
                    }}
                >
                    <span className="font-semibold">{tooltip.count} task{tooltip.count !== 1 ? 's' : ''}</span>
                    <span className="text-surface-200/50 ml-2">{new Date(tooltip.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
            )}
        </div>
    );
}
