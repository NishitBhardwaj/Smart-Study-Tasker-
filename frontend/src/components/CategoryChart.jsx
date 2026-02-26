/**
 * Category Donut Chart — Shows task distribution by category.
 * Pure SVG donut, no external dependencies.
 */

const CATEGORY_COLORS = {
    study: { color: '#6366f1', label: 'Study' },      // indigo
    work: { color: '#f59e0b', label: 'Work' },         // amber
    personal: { color: '#10b981', label: 'Personal' },  // emerald
    health: { color: '#ef4444', label: 'Health' },      // red
    general: { color: '#8b5cf6', label: 'General' },    // violet
    other: { color: '#64748b', label: 'Other' },        // slate
};

export default function CategoryChart({ data = [] }) {
    const total = data.reduce((sum, c) => sum + c.count, 0);

    if (total === 0) {
        return (
            <div className="rounded-2xl border border-white/10 bg-surface-900/80 p-6">
                <h3 className="text-sm font-medium text-surface-200/60 mb-4">Categories</h3>
                <div className="flex items-center justify-center h-32 text-surface-200/30 text-sm">
                    No tasks yet
                </div>
            </div>
        );
    }

    // Calculate SVG arcs
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    const arcs = data.map((cat) => {
        const percentage = cat.count / total;
        const strokeDash = percentage * circumference;
        const arc = {
            ...cat,
            strokeDash,
            strokeOffset: offset,
            color: CATEGORY_COLORS[cat.category]?.color || '#64748b',
            label: CATEGORY_COLORS[cat.category]?.label || cat.category,
        };
        offset += strokeDash;
        return arc;
    });

    return (
        <div className="rounded-2xl border border-white/10 bg-surface-900/80 p-6">
            <h3 className="text-sm font-medium text-surface-200/60 mb-4">Categories</h3>

            <div className="flex items-center gap-6">
                {/* Donut SVG */}
                <div className="relative w-28 h-28 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {/* Background ring */}
                        <circle
                            cx="50" cy="50" r={radius}
                            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"
                        />
                        {/* Data arcs */}
                        {arcs.map((arc, i) => (
                            <circle
                                key={i}
                                cx="50" cy="50" r={radius}
                                fill="none"
                                stroke={arc.color}
                                strokeWidth="10"
                                strokeDasharray={`${arc.strokeDash} ${circumference - arc.strokeDash}`}
                                strokeDashoffset={-arc.strokeOffset}
                                strokeLinecap="round"
                                className="transition-all duration-500"
                            />
                        ))}
                    </svg>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-white">{total}</span>
                        <span className="text-[10px] text-surface-200/40">tasks</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {arcs.map((arc, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: arc.color }}></div>
                            <span className="text-xs text-surface-200/70 truncate">{arc.label}</span>
                            <span className="text-xs text-surface-200/40 ml-auto">{arc.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
