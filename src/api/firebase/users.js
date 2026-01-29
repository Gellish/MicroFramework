import {
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    where
} from "firebase/firestore";
import { db } from "../../lib/firebase";

const COLLECTION_NAME = "users";

export const usersService = {
    /**
     * Fetch all users
     */
    async getAll() {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Get a single user by ID
     * @param {string} id 
     */
    async getById(id) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error("User not found");
        }
    },

    /**
     * Get posts for a specific user
     * @param {string} userId 
     */
    async getUserPosts(userId) {
        // Assuming posts are in a root 'posts' collection and have a 'userId' field
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Update a user record
     * @param {string} id 
     * @param {object} updates 
     */
    async update(id, updates) {
        const { updateDoc } = await import("firebase/firestore");
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, updates);
        return { id, ...updates };
    },

    /**
     * Delete a user
     * @param {string} id 
     */
    async delete(id) {
        const { deleteDoc } = await import("firebase/firestore");
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
        return true;
    }
};
