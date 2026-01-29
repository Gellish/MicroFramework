import {
    collection,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    getDoc
} from "firebase/firestore";
import { db } from "../../lib/firebase";

const COLLECTION_NAME = "posts";

export const postsService = {
    /**
     * Fetch all posts
     */
    async getAll() {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Get a single post by ID
     * @param {string} id 
     */
    async getById(id) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error("Post not found");
        }
    },

    /**
     * Create a new post
     * @param {object} postData 
     */
    async create(postData) {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), postData);
        return { id: docRef.id, ...postData };
    },

    /**
     * Update an existing post
     * @param {string} id 
     * @param {object} postData 
     */
    async update(id, postData) {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, postData);
        return { id, ...postData };
    },

    /**
     * Delete a post
     * @param {string} id 
     */
    async delete(id) {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
        return { id };
    }
};
