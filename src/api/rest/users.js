import { apiClient } from './client.js';

export const usersService = {
    /**
     * Fetch all users
     */
    async getAll() {
        return apiClient.get('/users');
    },

    /**
     * Get a single user by ID
     * @param {number|string} id 
     */
    async getById(id) {
        return apiClient.get(`/users/${id}`);
    },

    /**
     * Get posts for a specific user
     * @param {number|string} userId 
     */
    async getUserPosts(userId) {
        return apiClient.get(`/users/${userId}/posts`);
    }
};
