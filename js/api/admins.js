/* /js/api/admins.js */
import { db } from '../firebase.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
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

// Save admin metadata to Firestore (Default status: active)
export const saveAdminMetadata = async (adminData) => {
    try {
        const docRef = await addDoc(adminsCollection, {
            ...adminData,
            status: 'active', // 'active' or 'disabled'
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error saving admin metadata:", error);
        throw error;
    }
};

// Toggle admin status (Active <-> Disabled)
export const toggleAdminStatus = async (adminId, newStatus) => {
    try {
        const adminRef = doc(db, "admins", adminId);
        await updateDoc(adminRef, {
            status: newStatus
        });
        return true;
    } catch (error) {
        console.error("Error toggling admin status:", error);
        throw error;
    }
};
