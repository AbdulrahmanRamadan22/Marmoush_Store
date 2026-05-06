/* /js/api/admins.js */
import { db } from '../firebase.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    deleteDoc, 
    doc, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const adminsCollection = collection(db, "admins");

// Fetch all admins from Firestore
export const getAllAdmins = async () => {
    try {
        const q = query(adminsCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching admins:", error);
        throw error;
    }
};

// Save admin metadata to Firestore
export const saveAdminMetadata = async (adminData) => {
    try {
        const docRef = await addDoc(adminsCollection, {
            ...adminData,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error saving admin metadata:", error);
        throw error;
    }
};

// Delete admin metadata (Note: This doesn't delete the Auth account, which requires Admin SDK)
export const deleteAdminMetadata = async (adminId) => {
    try {
        await deleteDoc(doc(db, "admins", adminId));
        return true;
    } catch (error) {
        console.error("Error deleting admin metadata:", error);
        throw error;
    }
};
