/**
 * Weekly Bar Chart — Shows tasks completed per day for the last 7 days.
 * Pure CSS/SVG chart, no external dependencies.
 */

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyChart({ data = [] }) {
    // data = [{date: "2026-02-25", count: 3}, ...]
    const maxCount = Math.max(...data.map(d => d.count), 1);
    const total = data.reduce((sum, d) => sum + d.count, 0);

    return (
        <div className="rounded-2xl border border-white/10 bg-surface-900/80 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-medium text-surface-200/60">Weekly Activity</h3>
                    <p className="text-2xl font-bold text-white mt-0.5">
                        {total} <span className="text-sm text-surface-200/40 font-normal">tasks this week</span>
                    </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary-500/10 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                    <span className="text-xs text-primary-400 font-medium">Last 7 days</span>
                </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-2 h-32 mt-2">
                {data.map((day, i) => {
                    const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });
                    const isToday = i === data.length - 1;

                    return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                            {/* Count label */}
                            <span className={`text-[10px] font-medium ${day.count > 0 ? 'text-white' : 'text-surface-200/30'}`}>
                                {day.count > 0 ? day.count : ''}
                            </span>

                            {/* Bar */}
                            <div className="w-full flex justify-center" style={{ height: '100px' }}>
                                <div className="w-full max-w-[32px] flex flex-col justify-end">
                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-500 ${isToday
                                                ? 'bg-gradient-to-t from-primary-600 to-primary-400 shadow-glow'
                                                : day.count > 0
                                                    ? 'bg-gradient-to-t from-primary-700 to-primary-500'
                                                    : 'bg-white/5'
                                            }`}
                                        style={{
                                            height: `${Math.max(height, day.count > 0 ? 8 : 4)}%`,
                                            minHeight: '4px',
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* Day label */}
                            <span className={`text-[10px] font-medium ${isToday ? 'text-primary-400' : 'text-surface-200/40'}`}>
                                {dayLabel}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
