/**
 * Streak Card — Displays current streak with fire animation and best streak.
 */

export default function StreakCard({ streak = 0, bestStreak = 0 }) {
    const fireSize = Math.min(streak * 4, 60); // Scale fire with streak

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/10 via-surface-900/80 to-red-500/10 p-6">
            {/* Background glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>

            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-surface-200/60 mb-1">Current Streak</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white">{streak}</span>
                        <span className="text-lg text-surface-200/50">days</span>
                    </div>
                    <p className="text-xs text-surface-200/40 mt-2">
                        Best: <span className="text-orange-400 font-semibold">{bestStreak} days</span>
                    </p>
                </div>

                {/* Animated fire icon */}
                <div className="relative flex items-center justify-center">
                    <div
                        className="animate-pulse"
                        style={{ fontSize: `${Math.max(fireSize, 36)}px` }}
                    >
                        {streak > 0 ? '🔥' : '❄️'}
                    </div>
                    {streak >= 7 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black shadow-lg">
                            ⚡
                        </div>
                    )}
                </div>
            </div>

            {/* Streak milestones */}
            {streak > 0 && (
                <div className="mt-4 flex gap-1">
                    {Array.from({ length: Math.min(streak, 7) }, (_, i) => (
                        <div
                            key={i}
                            className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                            style={{ opacity: 0.4 + (i / 7) * 0.6 }}
                        ></div>
                    ))}
                    {streak < 7 && Array.from({ length: 7 - streak }, (_, i) => (
                        <div key={`e-${i}`} className="h-1.5 flex-1 rounded-full bg-white/5"></div>
                    ))}
                </div>
            )}
        </div>
    );
}
