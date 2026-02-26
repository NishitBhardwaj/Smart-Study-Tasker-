/**
 * Individual task card with priority badge, category tag, status, and action buttons.
 */

const CATEGORY_BADGES = {
    study: { emoji: '📚', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    work: { emoji: '💼', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    personal: { emoji: '🏠', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    health: { emoji: '💪', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    general: { emoji: '📋', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
    other: { emoji: '🔖', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

export default function TaskCard({ task, onEdit, onDelete, onComplete }) {
    // Calculate days remaining
    const daysRemaining = Math.ceil(
        (new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    // Priority color mapping
    const getPriorityConfig = (score) => {
        if (score >= 0.75) return { label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-400' };
        if (score >= 0.5) return { label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', dot: 'bg-orange-400' };
        if (score >= 0.25) return { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-400' };
        return { label: 'Low', color: 'bg-green-500/20 text-green-400 border-green-500/30', dot: 'bg-green-400' };
    };

    const priority = getPriorityConfig(task.priority_score);
    const isCompleted = task.status === 'completed';
    const isOverdue = daysRemaining < 0 && !isCompleted;
    const categoryBadge = CATEGORY_BADGES[task.category] || CATEGORY_BADGES.general;

    // Complexity stars
    const complexityStars = '★'.repeat(task.complexity_level) + '☆'.repeat(5 - task.complexity_level);

    // Format due time
    const dueDate = new Date(task.due_date);
    const formattedDue = dueDate.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    const formattedTime = dueDate.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });

    return (
        <div
            className={`group animate-fade-in rounded-2xl border transition-all duration-300 hover:shadow-glow
        ${isCompleted
                    ? 'bg-surface-900/50 border-white/5 opacity-70'
                    : 'bg-surface-900/80 border-white/10 hover:border-primary-500/30'
                }`}
        >
            <div className="p-5">
                {/* Header: Title + Badges */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {/* Category badge */}
                            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${categoryBadge.color}`}>
                                <span className="mr-1">{categoryBadge.emoji}</span>
                                {task.category}
                            </span>
                        </div>
                        <h3 className={`font-semibold text-lg leading-tight ${isCompleted ? 'line-through text-surface-200/50' : 'text-white'}`}>
                            {task.title}
                        </h3>
                    </div>
                    <span className={`shrink-0 px-3 py-1 text-xs font-semibold rounded-full border ${priority.color}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${priority.dot} mr-1.5`}></span>
                        {priority.label}
                    </span>
                </div>

                {/* Description */}
                {task.description && (
                    <p className="text-sm text-surface-200/60 mb-3 line-clamp-2">{task.description}</p>
                )}

                {/* Notes preview */}
                {task.notes && (
                    <p className="text-xs text-surface-200/40 mb-3 italic line-clamp-1">📝 {task.notes}</p>
                )}

                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
                    {/* Due date + time */}
                    <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : 'text-surface-200/70'}`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {isOverdue
                            ? `${Math.abs(daysRemaining)}d overdue`
                            : isCompleted
                                ? 'Completed'
                                : `${formattedDue} ${formattedTime}`
                        }
                    </div>

                    {/* Days remaining */}
                    {!isCompleted && !isOverdue && (
                        <div className="flex items-center gap-1.5 text-surface-200/50">
                            ({daysRemaining}d left)
                        </div>
                    )}

                    {/* Effort */}
                    <div className="flex items-center gap-1.5 text-surface-200/70">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {task.effort_hours}h effort
                    </div>

                    {/* Complexity */}
                    <div className="flex items-center gap-1.5 text-yellow-500/80">
                        <span className="tracking-wider">{complexityStars}</span>
                    </div>

                    {/* Priority score */}
                    <div className="flex items-center gap-1.5 text-primary-400/80">
                        <span className="font-mono">{(task.priority_score * 100).toFixed(0)}%</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <button
                        id={`complete-task-${task.id}`}
                        onClick={() => onComplete(task.id)}
                        className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all duration-200
              ${isCompleted
                                ? 'bg-accent-500/20 text-accent-400 hover:bg-accent-500/30'
                                : 'bg-primary-600/20 text-primary-300 hover:bg-primary-600/30'
                            }`}
                    >
                        {isCompleted ? '↩ Reopen' : '✓ Complete'}
                    </button>
                    <button
                        id={`edit-task-${task.id}`}
                        onClick={() => onEdit(task)}
                        className="py-2 px-3 text-xs font-medium text-surface-200/70 bg-white/5 hover:bg-white/10 
                       rounded-lg transition-all duration-200"
                    >
                        Edit
                    </button>
                    <button
                        id={`delete-task-${task.id}`}
                        onClick={() => onDelete(task.id)}
                        className="py-2 px-3 text-xs font-medium text-red-400/70 bg-red-500/10 hover:bg-red-500/20 
                       rounded-lg transition-all duration-200"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
