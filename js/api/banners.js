// /js/api/banners.js
import { db } from '../firebase.js';
import { logActivity } from './logs.js';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const collectionName = "banners";

/**
 * Fetch all Banners from Firestore
 */
export async function getBanners() {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const bannersList = [];
        querySnapshot.forEach((doc) => {
            bannersList.push({ id: doc.id, ...doc.data() });
        });
        return bannersList;
    } catch (error) {
        console.error("Error fetching banners: ", error);
        return [];
    }
}

/**
 * Add a new Banner
 */
export async function addBanner(bannerData) {
    try {
        const data = {
            ...bannerData,
            createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, collectionName), data);
        await logActivity('إضافة بانر', `تم إضافة بانر جديد: ${bannerData.title || 'بدون عنوان'}`);
        return docRef.id;
    } catch (error) {
        console.error("Error adding banner: ", error);
        throw error;
    }
}

/**
 * Update an existing Banner
 */
export async function updateBanner(bannerId, bannerData) {
    try {
        const docRef = doc(db, collectionName, bannerId);
        await updateDoc(docRef, bannerData);
        await logActivity('تعديل بانر', `تم تعديل بيانات البانر: ${bannerData.title || bannerId}`);
        return true;
    } catch (error) {
        console.error("Error updating banner: ", error);
        throw error;
    }
}

/**
 * Delete a Banner
 */
export async function deleteBanner(bannerId) {
    try {
        await deleteDoc(doc(db, collectionName, bannerId));
        await logActivity('حذف بانر', `تم حذف البانر ID: ${bannerId}`);
        return true;
    } catch (error) {
        console.error("Error deleting banner: ", error);
        throw error;
    }
}
