/**
 * Home — Default landing view. Displays active tasks with completion checkboxes.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI } from '../services/api';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import ProofUploadModal from '../components/ProofUploadModal';

export default function Home() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completingTask, setCompletingTask] = useState(null); // The task currently being checked off

    const loadTasks = async () => {
        try {
            setLoading(true);
            const res = await taskAPI.getAll();
            // In Home view, we only care about 'active' tasks
            const activeTasks = res.data.filter(t => t.status === 'active');

            // Sort by priority (highest first) and then by due date
            activeTasks.sort((a, b) => {
                if (b.priority_score !== a.priority_score) {
                    return b.priority_score - a.priority_score;
                }
                return new Date(a.due_date) - new Date(b.due_date);
            });

            setTasks(activeTasks);
        } catch (err) {
            console.error('Failed to load active tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    // Triggered when the large checkbox is clicked on the Home view
    const handleCheck = (task) => {
        setCompletingTask(task);
    };

    // Triggered when ProofUploadModal finishes (either via upload or skip)
    const handleCompleteSuccess = () => {
        setCompletingTask(null);
        loadTasks();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-950 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-950 flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                        Let's get things done, <span className="bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">{user?.name}</span>
                    </h1>
                    <p className="text-surface-200/50 mt-1">Here are your active priorities.</p>
                </div>

                {/* Active Task List */}
                <div className="space-y-4">
                    {tasks.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 border border-white/5 rounded-3xl">
                            <p className="text-5xl mb-4">✨</p>
                            <h3 className="text-xl font-medium text-white mb-2">You're all caught up!</h3>
                            <p className="text-surface-200/50">No active tasks at the moment.</p>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                isHomeView={true}
                                onCheck={handleCheck}
                                // Dummy handlers, actions are hidden anyway
                                onEdit={() => { }}
                                onDelete={() => { }}
                                onComplete={() => { }}
                            />
                        ))
                    )}
                </div>
            </main>

            {/* Proof Upload Modal Flow */}
            {completingTask && (
                <ProofUploadModal
                    task={completingTask}
                    onClose={() => setCompletingTask(null)}
                    onComplete={handleCompleteSuccess}
                />
            )}
        </div>
    );
}
