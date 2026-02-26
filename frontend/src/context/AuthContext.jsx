/**
 * Authentication context — manages JWT token, user state, login/logout.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        const token = localStorage.getItem('smartstudy_token');
        if (token) {
            authAPI.getMe()
                .then((res) => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem('smartstudy_token');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await authAPI.login({ email, password });
        localStorage.setItem('smartstudy_token', res.data.access_token);
        const userRes = await authAPI.getMe();
        setUser(userRes.data);
        return userRes.data;
    };

    const register = async (name, email, password) => {
        await authAPI.register({ name, email, password });
        return login(email, password);
    };

    const logout = () => {
        localStorage.removeItem('smartstudy_token');
        setUser(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-surface-950">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
