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

import { 
    getFirestore, 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { db } from '../firebase.js';

/**
 * التأكد من أن المستخدم مسجل للدخول وجلب صلاحياته
 * @param {function} callback دالة تُنفذ بعد التأكد من الحالة 
 */
export function requireAuth(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // جلب بيانات الأدمن من Firestore بناءً على البريد الإلكتروني
                const q = query(collection(db, "admins"), where("email", "==", user.email));
                const querySnapshot = await getDocs(q);
                
                let adminData = null;
                let docId = null;
                
                if (!querySnapshot.empty) {
                    docId = querySnapshot.docs[0].id;
                    adminData = querySnapshot.docs[0].data();
                }
                
                if (!adminData) {
                    console.error("Access Denied: User not found in Firestore admins list.");
                    await signOut(auth);
                    if (!window.location.pathname.includes('login.html')) {
                        window.location.href = 'login.html';
                    }
                    return;
                }

                if (adminData.status === 'disabled') {
                    console.warn("Access Denied: User account is disabled.");
                    
                    // تجميد الشاشة
                    document.body.style.overflow = 'hidden';
                    
                    // حقن واجهة الحظر الاحترافية (Premium Block UI)
                    const blockHTML = `
                    <div style="position: fixed; inset: 0; z-index: 999999; background: rgba(6, 9, 19, 0.97); backdrop-filter: blur(24px); display: flex; align-items: center; justify-content: center; font-family: 'Tajawal', 'Inter', sans-serif;" dir="rtl">
                        <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid rgba(239, 68, 68, 0.25); border-top: 3px solid #ef4444; border-radius: 24px; padding: 40px 36px; text-align: center; max-width: 460px; width: 90%; box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(239, 68, 68, 0.08); animation: zoomIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);">
                            <style>
                                @keyframes zoomIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }
                                @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 70% { box-shadow: 0 0 0 14px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }
                                #btn-return-login:hover { background: #dc2626 !important; transform: translateY(-2px); box-shadow: 0 15px 25px -5px rgba(239, 68, 68, 0.45) !important; }
                            </style>
                            <div style="width: 84px; height: 84px; background: rgba(239, 68, 68, 0.12); color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.8rem; margin: 0 auto 24px; border: 2px solid rgba(239, 68, 68, 0.3); animation: pulse-ring 2s ease-out infinite;">
                                <i class='bx bx-shield-x'></i>
                            </div>
                            <h2 style="color: #f8fafc; font-size: 1.5rem; font-weight: 800; margin-bottom: 10px; letter-spacing: -0.01em;">تم إيقاف صلاحياتك</h2>
                            <p style="color: #94a3b8; font-size: 0.95rem; line-height: 1.8; margin-bottom: 28px;">
                                عذراً، لا يمكنك الوصول إلى لوحة التحكم في الوقت الحالي.<br>
                                حسابك <strong style="color: #fca5a5; font-weight: 700;">مُعطَّل</strong> حالياً — يرجى التواصل مع الإدارة العليا لإعادة التفعيل.
                            </p>
                            <div style="background: rgba(239, 68, 68, 0.07); border: 1px dashed rgba(239,68,68,0.25); border-radius: 12px; padding: 12px 16px; margin-bottom: 28px;">
                                <p style="color: #f87171; font-size: 0.82rem; margin: 0; font-weight: 600;">
                                    <i class='bx bx-info-circle' style="vertical-align: middle; margin-left: 4px;"></i>
                                    إذا كنت تعتقد أن هذا خطأ، تواصل مع مدير النظام فوراً.
                                </p>
                            </div>
                            <button id="btn-return-login" style="background: #ef4444; color: white; border: none; border-radius: 14px; padding: 14px 24px; width: 100%; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.35); display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <i class='bx bx-log-out'></i> تسجيل الخروج والعودة
                            </button>
                        </div>
                    </div>
                    `;
                    
                    document.body.insertAdjacentHTML('beforeend', blockHTML);
                    
                    document.getElementById('btn-return-login').onclick = async () => {
                        const btn = document.getElementById('btn-return-login');
                        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> جاري الخروج...';
                        btn.style.opacity = '0.7';
                        await signOut(auth);
                        window.location.href = 'login.html';
                    };
                    
                    return;
                }
                
                // إذا لم يكن هناك دور (Role) معرف، نفترض أنه Admin (للحسابات القديمة) ونحدث البيانات
                if (!adminData.role) {
                    adminData.role = 'admin';
                    if (docId) await updateDoc(doc(db, "admins", docId), { role: 'admin' });
                }
                
                // إضافة البيانات للكائن المسترجع
                const userWithRole = { ...user, ...adminData };

                // تحديث الواجهة العلوية (Top Header Profile Info) في كل صفحات لوحة التحكم
                const nameStr = adminData.name || 'مدير';
                const initialStr = nameStr.charAt(0).toUpperCase();
                const roleStr = adminData.role === 'admin' ? 'مدير كامل' : 'مدير محتوى';

                const headerNameEl = document.getElementById('header-user-name');
                const headerRoleEl = document.getElementById('header-user-role');
                const desktopAvatarEl = document.getElementById('desktop-user-avatar');
                const mobileAvatarEl = document.getElementById('mobile-user-avatar');

                if (headerNameEl) headerNameEl.innerText = nameStr;
                if (headerRoleEl) headerRoleEl.innerText = roleStr;
                if (desktopAvatarEl) desktopAvatarEl.innerText = initialStr;
                if (mobileAvatarEl) mobileAvatarEl.innerText = initialStr;
                if(callback) callback(userWithRole);
            } catch (err) {
                console.error("Error fetching admin role:", err);
                if(callback) callback(user);
            }
        } else {
            // غير مسجل دخول، اطرده لصفحة اللوجن
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
    });
}
