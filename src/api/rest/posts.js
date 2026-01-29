import { apiClient } from './client.js';

export const postsService = {
    /**
     * Fetch all posts
     */
    async getAll() {
        return apiClient.get('/posts');
    },

    /**
     * Get a single post by ID
     * @param {number|string} id 
     */
    async getById(id) {
        return apiClient.get(`/posts/${id}`);
    },

    /**
     * Create a new post
     * @param {object} postData 
     */
    async create(postData) {
        return apiClient.post('/posts', postData);
    },

    /**
     * Update an existing post
     * @param {number|string} id 
     * @param {object} postData 
     */
    async update(id, postData) {
        return apiClient.put(`/posts/${id}`, postData);
    },

    /**
     * Delete a post
     * @param {number|string} id 
     */
    async delete(id) {
        return apiClient.delete(`/posts/${id}`);
    }
};
