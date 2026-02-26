/**
 * Login page with modern dark theme.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                setError(detail.map(d => d.msg).join(', '));
            } else {
                setError(typeof detail === 'string' ? detail : 'Invalid email or password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md animate-slide-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-glow-lg mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
                        Welcome Back
                    </h1>
                    <p className="text-surface-200/60 mt-2">Sign in to your SmartStudy account</p>
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
                            <label className="block text-sm font-medium text-surface-200/80 mb-1.5">Email</label>
                            <input
                                id="login-email"
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
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-200/30
                           focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
                            />
                        </div>

                        <button
                            id="login-submit-btn"
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 
                         text-white font-semibold rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-surface-200/50">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
