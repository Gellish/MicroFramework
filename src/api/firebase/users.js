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
    }
};
