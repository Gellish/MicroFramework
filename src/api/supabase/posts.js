import { supabase } from "../../lib/supabase";

const TABLE_NAME = 'posts';

export const postsService = {
    /**
     * Fetch all posts
     */
    async getAll() {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*');
        if (error) throw error;
        return data;
    },

    /**
     * Get a single post by ID
     * @param {string|number} id 
     */
    async getById(id) {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        if (!data) throw new Error("Post not found");
        return data;
    },

    /**
     * Create a new post
     * @param {object} postData 
     */
    async create(postData) {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert([postData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /**
     * Update an existing post
     * @param {string|number} id 
     * @param {object} postData 
     */
    async update(id, postData) {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update(postData)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id);
        if (error) throw error;
        return { id };
    },

    /**
     * Subscribe to realtime updates
     * @param {function} callback 
     */
    subscribe(callback) {
        return supabase
            .channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: TABLE_NAME },
                (payload) => {
                    callback(payload);
                }
            )
            .subscribe();
    }
};
