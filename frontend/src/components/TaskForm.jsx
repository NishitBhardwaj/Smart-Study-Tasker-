/**
 * Task creation / edit modal form with category and notes.
 */

import { useState, useEffect } from 'react';

const CATEGORIES = [
    { value: 'study', label: '📚 Study', color: 'text-indigo-400' },
    { value: 'work', label: '💼 Work', color: 'text-amber-400' },
    { value: 'personal', label: '🏠 Personal', color: 'text-emerald-400' },
    { value: 'health', label: '💪 Health', color: 'text-red-400' },
    { value: 'general', label: '📋 General', color: 'text-violet-400' },
    { value: 'other', label: '🔖 Other', color: 'text-slate-400' },
];

export default function TaskForm({ task, onSubmit, onClose }) {
    const isEditing = Boolean(task);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        notes: '',
        category: 'study',
        task_type: 'specific_date',
        due_date: '',
        effort_hours: '',
        complexity_level: 3,
        requires_proof: false,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                notes: task.notes || '',
                category: task.category || 'study',
                task_type: task.task_type || 'specific_date',
                due_date: task.due_date ? task.due_date.slice(0, 16) : '',
                effort_hours: task.effort_hours || '',
                complexity_level: task.complexity_level || 3,
                requires_proof: task.requires_proof || false,
            });
        }
    }, [task]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }
        let finalDueDate = formData.due_date;

        // Auto-calculate dates for daily/weekly
        if (formData.task_type === 'daily') {
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);
            finalDueDate = endOfToday.toISOString();
        } else if (formData.task_type === 'weekly') {
            const endOfWeek = new Date();
            endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay())); // Sunday
            endOfWeek.setHours(23, 59, 59, 999);
            finalDueDate = endOfWeek.toISOString();
        }

        if (!finalDueDate && formData.task_type === 'specific_date') {
            setError('Due date is required for a specific date task');
            return;
        }
        if (!formData.effort_hours || parseFloat(formData.effort_hours) <= 0) {
            setError('Effort hours must be greater than 0');
            return;
        }

        try {
            await onSubmit({
                ...formData,
                effort_hours: parseFloat(formData.effort_hours),
                complexity_level: parseInt(formData.complexity_level),
                due_date: formData.task_type === 'specific_date' ? new Date(finalDueDate).toISOString() : finalDueDate,
            });
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                setError(detail.map(d => d.msg).join(', '));
            } else {
                setError(typeof detail === 'string' ? detail : 'Something went wrong');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative w-full max-w-lg animate-slide-up bg-surface-900 border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">
                        {isEditing ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-surface-200/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-surface-200/80 mb-1.5">Task Title</label>
                        <input
                            id="task-title"
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Study for calculus exam"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-200/30
                         focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-surface-200/80 mb-1.5">Category</label>
                        <div className="grid grid-cols-3 gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200
                                        ${formData.category === cat.value
                                            ? 'bg-primary-600/20 text-primary-300 border-primary-500/30'
                                            : 'bg-white/5 text-surface-200/50 border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Task Type */}
                    <div>
                        <label className="block text-sm font-medium text-surface-200/80 mb-1.5">Task Type</label>
                        <div className="flex gap-3">
                            {['daily', 'weekly', 'specific_date'].map((type) => (
                                <label key={type} className="flex-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="task_type"
                                        value={type}
                                        checked={formData.task_type === type}
                                        onChange={handleChange}
                                        className="peer sr-only"
                                    />
                                    <div className="text-center px-2 py-2 text-xs font-semibold rounded-lg border transition-all duration-200 bg-white/5 border-white/10 text-surface-200/50 peer-checked:bg-primary-600/20 peer-checked:text-primary-300 peer-checked:border-primary-500/30 hover:border-white/20">
                                        {type === 'daily' ? '📅 Daily' : type === 'weekly' ? '⏳ Weekly' : '📌 Specific Date'}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-surface-200/80 mb-1.5">Description</label>
                        <textarea
                            id="task-description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Brief description of the task..."
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-200/30
                         focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all resize-none"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-surface-200/80 mb-1.5">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Additional notes, resources, links..."
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-200/30
                         focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all resize-none"
                        />
                    </div>

                    {/* Due Date + Effort Hours */}
                    <div className="grid grid-cols-2 gap-4">
                        {formData.task_type === 'specific_date' ? (
                            <div>
                                <label className="block text-sm font-medium text-surface-200/80 mb-1.5">Due Date</label>
                                <input
                                    id="task-due-date"
                                    type="datetime-local"
                                    name="due_date"
                                    value={formData.due_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all
                               [color-scheme:dark]"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-surface-200/80 mb-1.5">Due Date</label>
                                <div className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-surface-200/50 cursor-not-allowed text-sm">
                                    Auto-set to end of {formData.task_type === 'daily' ? 'day' : 'week'}
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-surface-200/80 mb-1.5">Effort (hours)</label>
                            <input
                                id="task-effort-hours"
                                type="number"
                                name="effort_hours"
                                value={formData.effort_hours}
                                onChange={handleChange}
                                min="0.5"
                                max="100"
                                step="0.5"
                                placeholder="e.g. 8"
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-200/30
                           focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Complexity Level */}
                    <div>
                        <label className="block text-sm font-medium text-surface-200/80 mb-2">
                            Complexity Level: <span className="text-primary-400 font-bold">{formData.complexity_level}</span>
                        </label>
                        <input
                            id="task-complexity"
                            type="range"
                            name="complexity_level"
                            value={formData.complexity_level}
                            onChange={handleChange}
                            min="1"
                            max="5"
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500
                         [&::-webkit-slider-thumb]:shadow-glow [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-surface-200/40 mt-1 mb-4">
                            <span>Easy</span>
                            <span>Medium</span>
                            <span>Hard</span>
                        </div>

                        {/* Requires Proof Toggle */}
                        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mt-4">
                            <input
                                id="requires-proof-checkbox"
                                type="checkbox"
                                name="requires_proof"
                                checked={formData.requires_proof}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-white/20 bg-surface-950 text-primary-500 focus:ring-primary-500/50 focus:ring-offset-surface-900 transition-colors"
                            />
                            <div>
                                <label htmlFor="requires-proof-checkbox" className="text-sm font-medium text-white cursor-pointer select-none">
                                    Mandatory Proof Image
                                </label>
                                <p className="text-[10px] text-surface-200/50 mt-0.5">Require an image or screenshot to mark this task as complete</p>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        id="task-submit-btn"
                        type="submit"
                        className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 
                       text-white font-semibold rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-300"
                    >
                        {isEditing ? 'Update Task' : 'Create Task'}
                    </button>
                </form>
            </div>
        </div>
    );
}
