// /js/api/settings.js
import { db } from '../firebase.js';
import { logActivity } from './logs.js';
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const SETTINGS_DOC_ID = "contact_settings";
const collectionName = "settings";

/**
 * Fetch all Store Settings
 */
export async function getSettings() {
    try {
        const docRef = doc(db, collectionName, SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            // Return default structure if doesn't exist
            return {
                contact: {
                    phone: "+966 50 123 4567",
                    email: "info@marmoushstore.com",
                    whatsapp: "+966 50 123 4567",
                    address: "المملكة العربية السعودية - الرياض",
                    workingHours: "من السبت إلى الخميس: 9:00 ص - 11:00 م"
                },
                social: {
                    facebook: "",
                    twitter: "",
                    instagram: "",
                    youtube: "",
                    snapchat: "",
                    tiktok: ""
                },
                faqs: [
                    { question: "ما هي طرق الدفع المتاحة؟", answer: "نقبل جميع البطاقات الائتمانية والدفع عند الاستلام." }
                ]
            };
        }
    } catch (error) {
        console.error("Error fetching settings: ", error);
        return null;
    }
}

/**
 * Save or Update Settings
 */
export async function saveSettings(settingsData) {
    try {
        const docRef = doc(db, collectionName, SETTINGS_DOC_ID);
        await setDoc(docRef, settingsData, { merge: true });
        await logActivity('تعديل الإعدادات', 'تم تحديث إعدادات المتجر والتواصل');
        return true;
    } catch (error) {
        console.error("Error saving settings: ", error);
        throw error;
    }
}
