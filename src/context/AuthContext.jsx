import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. REHYDRATE: Check local storage on mount
        const storedUser = localStorage.getItem('dashboard_user_data');
        if (storedUser) {
            try { setUser(JSON.parse(storedUser)); } catch (e) { console.error(e); }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        // 2. BACKDOOR (Mock): Instant Admin Access
        if (username === 'admin' && password === 'admin') {
            const mockUser = {
                id: 'admin-1',
                email: 'admin@pucho.ai',
                role: 'admin',      // Critical for routing
                full_name: 'Pucho Admin'
            };
            setUser(mockUser);
            localStorage.setItem('dashboard_user_data', JSON.stringify(mockUser));
            return { success: true };
        }

        // 3. REAL AUTH (Supabase) - Mocked in this version
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: username, // Assuming username is email
                password: password,
            });
            if (error) throw error;

            // Get Role from 'profiles' table
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            const fullUser = { ...data.user, ...profile };
            setUser(fullUser);
            localStorage.setItem('dashboard_user_data', JSON.stringify(fullUser));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const logout = async () => {
        setUser(null);
        localStorage.removeItem('dashboard_user_data');
        await supabase.auth.signOut();
    };

    const updateUser = (updates) => {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('dashboard_user_data', JSON.stringify(updatedUser));
        return true;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
