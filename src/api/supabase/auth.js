import { supabase } from "../../lib/supabase";

export const authService = {
    /**
     * Login user with email and password
     * @param {string} email 
     * @param {string} password 
     */
    async login(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data.user;
    },

    /**
     * Sign up a new user
     * @param {string} email 
     * @param {string} password 
     * @param {object} metadata - e.g. { full_name: 'John Doe' }
     */
    async signup(email, password, metadata = {}) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        if (error) throw error;
        return data.user;
    },

    /**
     * Logout user
     */
    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * Get current authenticated user
     */
    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    /**
     * Update user profile
     * @param {object} updates - { email, password, data: { ... } }
     */
    async updateProfile(updates) {
        const { data, error } = await supabase.auth.updateUser(updates);
        if (error) throw error;
        return data.user;
    }
};
