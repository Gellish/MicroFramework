import { apiClient } from './client.js';

export const authService = {
    /**
     * Login user with credentials
     * @param {string} email 
     * @param {string} password 
     */
    async login(email, password) {
        // Note: This is an example endpoint. Adjust according to real backend.
        const response = await apiClient.post('/auth/login', { email, password });
        if (response && response.token) {
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }
        return response;
    },

    /**
     * Logout user and clear local storage
     */
    async logout() {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.warn('Logout failed on server, cleaning up locally anyway.');
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            // window.location.href = '/login'; // Redirect if needed
        }
    },

    /**
     * Get current authenticated user details
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    }
};
