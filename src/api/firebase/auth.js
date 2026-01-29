import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { auth } from "../../lib/firebase";

export const authService = {
    /**
     * Login user with credentials
     * @param {string} email 
     * @param {string} password 
     */
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error("Firebase Login Error", error);
            throw error;
        }
    },

    /**
     * Logout user
     */
    async logout() {
        return signOut(auth);
    },

    /**
     * Get current authenticated user details
     * Note: Firebase is async, relying on listeners is better. 
     * This is a simple wrapper for the current synchronous state if initialized.
     */
    getCurrentUser() {
        return auth.currentUser;
    },

    /**
     * Subscribe to auth state changes
     * @param {function} callback 
     */
    onAuthStateChanged(callback) {
        return onAuthStateChanged(auth, callback);
    }
};
