/**
 * Top navigation bar with Dashboard / Profile links and logout.
 */

import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-40 bg-surface-950/80 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo + Nav Links */}
                    <div className="flex items-center gap-6">
                        <Link to="/dashboard" className="flex items-center gap-2 group">
                            <span className="text-xl">📚</span>
                            <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">
                                SmartStudy
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-primary-500/20 text-primary-400 rounded-md font-semibold ml-1">
                                V2
                            </span>
                        </Link>

                        {/* Nav tabs */}
                        <div className="hidden sm:flex items-center gap-1">
                            <NavLink to="/dashboard" active={isActive('/dashboard')} label="Dashboard" icon="📊" />
                            <NavLink to="/profile" active={isActive('/profile')} label="Profile" icon="👤" />
                        </div>
                    </div>

                    {/* Right side: user + logout */}
                    <div className="flex items-center gap-3">
                        {user && (
                            <div className="hidden sm:flex items-center gap-2 text-sm text-surface-200/60">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-xs font-bold text-white">
                                    {user.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <span className="text-surface-200/80">{user.name}</span>
                            </div>
                        )}
                        <button
                            id="logout-btn"
                            onClick={handleLogout}
                            className="px-3 py-1.5 text-xs font-medium text-surface-200/60 hover:text-white bg-white/5 hover:bg-red-500/20 
                         border border-white/10 hover:border-red-500/30 rounded-lg transition-all duration-200"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile nav */}
            <div className="sm:hidden flex items-center justify-center gap-2 pb-2 px-4">
                <NavLink to="/dashboard" active={isActive('/dashboard')} label="Dashboard" icon="📊" />
                <NavLink to="/profile" active={isActive('/profile')} label="Profile" icon="👤" />
            </div>
        </nav>
    );
}

function NavLink({ to, active, label, icon }) {
    return (
        <Link
            to={to}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
                ${active
                    ? 'bg-primary-600/20 text-primary-300'
                    : 'text-surface-200/50 hover:text-white hover:bg-white/5'
                }`}
        >
            <span className="mr-1">{icon}</span>
            {label}
        </Link>
    );
}
