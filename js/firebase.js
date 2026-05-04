// /js/firebase.js
// Firebase initialization and configuration

// 1. استيراد دوال فايربيز الأساسية من الـ CDN الرسمي (الإصدار 10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// 2. إعدادات المشروع (يجب استبدال هذه القيم بالقيم الحقيقية من لوحة تحكم فايربيز الخاصة بك)
const firebaseConfig = {
  apiKey: "AIzaSyDc6__7P-PLVYc-LbkIIT7eodhtIiWDmdY",
  authDomain: "marmoushstore.firebaseapp.com",
  projectId: "marmoushstore",
  storageBucket: "marmoushstore.appspot.com",
  messagingSenderId: "618729148961",
  appId: "1:618729148961:web:8f2d48b52bd039eb5d4960",
  measurementId: "G-M92SKGT8C5"
};

// 3. تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// 4. تصدير الخدمات (قاعدة البيانات، التخزين، والمصادقة) لاستخدامها في باقي ملفات الـ API
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

console.log("Firebase initialized successfully (Waiting for actual keys).");
