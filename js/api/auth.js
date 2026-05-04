// /js/api/auth.js
// Firebase Authentication API Module

import { auth } from '../firebase.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

/**
 * تسجيل الدخول كأدمن
 * @param {string} email 
 * @param {string} password 
 * @param {boolean} rememberMe
 */
export async function loginAdmin(email, password, rememberMe = false) {
    try {
        // تحديد نوع الجلسة (دائمة أم تنتهي بإغلاق المتصفح)
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}

/**
 * إرسال رابط إعادة تعيين كلمة المرور
 * @param {string} email 
 */
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return true;
    } catch (error) {
        throw error;
    }
}

/**
 * تسجيل الخروج
 */
export async function logoutAdmin() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
    }
}

/**
 * التأكد من أن المستخدم مسجل للدخول
 * يتم استخدامها لحماية صفحات الداشبورد
 * @param {function} callback دالة تُنفذ بعد التأكد من الحالة 
 */
export function requireAuth(callback) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // مسجل دخول، قم بتشغيل الكود
            if(callback) callback(user);
        } else {
            // غير مسجل دخول، اطرده لصفحة اللوجن
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
    });
}
