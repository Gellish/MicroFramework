import { supabase } from "../../lib/supabase";

const TABLE_NAME = 'profiles';

export const usersService = {
    /**
     * Fetch all users
     */
    async getAll() {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*');
        if (error) throw error;
        return data;
    },

    /**
     * Get a single user by ID
     * @param {string|number} id 
     */
    async getById(id) {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        if (!data) throw new Error("User not found");
        return data;
    },

    /**
     * Get posts for a specific user
     * @param {string|number} userId 
     */
    async getUserPosts(userId) {
        // Assuming posts table relates to users via userId
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('userId', userId);
        if (error) throw error;
        return data;
    },

    /**
     * Delete a user
     * @param {string|number} id 
     */
    async delete(id) {
        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    /**
     * Update or Create a user profile record
     * @param {string|number} id 
     * @param {object} updates 
     */
    async update(id, updates) {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .upsert({ id, ...updates })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};
