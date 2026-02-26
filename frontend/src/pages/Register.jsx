/**
 * Registration page.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await register(name, email, password);
            navigate('/dashboard');
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                setError(detail.map(d => d.msg).join(', '));
            } else {
                setError(typeof detail === 'string' ? detail : 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/3 -left-40 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md animate-slide-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl shadow-glow-lg mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
                        Create Account
                    </h1>
                    <p className="text-surface-200/60 mt-2">Join SmartStudy and start studying smarter</p>
                </div>

                {/* Card */}
                <div className="bg-surface-900/80 border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-surface-200/80 mb-1.5">Full Name</label>
                            <input
                                id="register-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-200/30
                           focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-200/80 mb-1.5">Email</label>
                            <input
                                id="register-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@university.edu"
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-200/30
                           focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-200/80 mb-1.5">Password</label>
                            <input
                                id="register-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-200/30
                           focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-200/80 mb-1.5">Confirm Password</label>
                            <input
                                id="register-confirm"
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Repeat password"
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-200/30
                           focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
                            />
                        </div>

                        <button
                            id="register-submit-btn"
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-500 hover:to-accent-400 
                         text-white font-semibold rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-surface-200/50">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
