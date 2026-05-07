// /js/api/logs.js
import { db, auth } from '../firebase.js';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const collectionName = 'logs';

/**
 * Log an activity
 * @param {string} action - e.g., 'إضافة منتج', 'حذف تصنيف'
 * @param {string} details - description of the action
 */
export async function logActivity(action, details = '') {
    try {
        const user = auth.currentUser;
        if (!user) return;

        await addDoc(collection(db, collectionName), {
            adminEmail: user.email,
            adminUid: user.uid,
            action: action,
            details: details,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding log:", error);
    }
}

/**
 * Fetch recent logs
 */
export async function getRecentLogs(max = 20) {
    try {
        const q = query(collection(db, collectionName), orderBy('timestamp', 'desc'), limit(max));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
}
