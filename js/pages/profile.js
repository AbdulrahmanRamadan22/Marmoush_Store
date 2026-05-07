/* /js/pages/profile.js */
import { auth, db } from '../firebase.js';
import { requireAuth, logoutAdmin } from '../api/auth.js';
import { initLogoutModal } from '../ui/renderLogoutModal.js';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { doc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let currentUserProfile = null;
let currentAdminDocId = null;

// Global Toast Function (Nuclear Fallback)
function showToast(message, type = "success") {
    console.log("Toast Triggered:", message, type);
    const toast = document.getElementById('toast-notification');
    const body = document.getElementById('toast-body');
    
    if (!toast || !body) {
        alert(message);
        return;
    }

    // Apply Chic Classes
    body.className = `chic-card ${type === 'error' ? 'error' : ''}`;
    const span = body.querySelector('span');
    const icon = body.querySelector('i');
    
    if (span) span.innerText = message;
    if (icon) icon.className = `bx ${type === 'error' ? 'bx-error-circle text-danger' : 'bx-check-circle text-success'}`;

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("=== Profile JS: System Starting ===");
    
    // Initialize Logout
    initLogoutModal(logoutAdmin);
    
    setupEventListeners();

    requireAuth(async (user) => {
        console.log("Profile JS: Identity Verified", user?.email);
        currentUserProfile = user;
        window.auth = auth; // For debug script
        
        try {
            const q = query(collection(db, "admins"), where("email", "==", user.email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                currentAdminDocId = querySnapshot.docs[0].id;
                console.log("Profile JS: Profile Metadata Loaded");
            }
        } catch (error) {
            console.warn("Profile JS: Firestore blocked, proceeding with cached auth data.");
        }
        populateProfileData();
    });
});

function populateProfileData() {
    if (!currentUserProfile) return;
    try {
        const { name, email, role, status } = currentUserProfile;
        const initial = name ? name.charAt(0).toUpperCase() : 'A';
        
        const map = {
            'header-user-name': name || 'مدير',
            'header-user-role': role === 'admin' ? 'مدير كامل' : 'مدير محتوى',
            'desktop-user-avatar': initial,
            'mobile-user-avatar': initial,
            'main-avatar': initial,
            'profile-name': name || 'لا يوجد اسم',
            'profile-email': email,
            'edit-name': name || '',
            'edit-email': email
        };

        Object.keys(map).forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (el.tagName === 'INPUT') el.value = map[id];
            else el.innerText = map[id];
        });

        // Badges
        const rBadge = document.getElementById('profile-role-badge');
        if (rBadge) {
            rBadge.innerHTML = role === 'admin' ? "<i class='bx bx-shield'></i> مدير كامل" : "<i class='bx bx-edit'></i> مدير محتوى";
            rBadge.className = `badge px-3 py-2 ${role === 'admin' ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'}`;
        }
    } catch (e) { console.error("UI Populate Error", e); }
}

function setupEventListeners() {
    // 1. Profile Info Form
    const editForm = document.getElementById('edit-profile-form');
    if (editForm) {
        editForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-update-profile');
            const name = document.getElementById('edit-name')?.value.trim();
            if (!name) return showToast("الاسم مطلوب", "error");
            if (!currentAdminDocId) return showToast("خطأ في الاتصال بقاعدة البيانات", "error");

            try {
                btn.innerHTML = 'جاري الحفظ...';
                btn.disabled = true;
                await updateDoc(doc(db, "admins", currentAdminDocId), { name });
                showToast("تم التحديث بنجاح");
                setTimeout(() => location.reload(), 1000);
            } catch (error) { showToast("فشل الحفظ", "error"); }
            finally { btn.innerHTML = 'حفظ التغييرات'; btn.disabled = false; }
        };
    }

    // 2. Password Form
    const passForm = document.getElementById('change-password-form');
    const passBtn = document.getElementById('btn-change-password');
    
    if (passForm) {
        passForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("=== Starting Password Flow ===");
            
            const curr = document.getElementById('current-password')?.value;
            const newP = document.getElementById('new-password')?.value;
            const conf = document.getElementById('confirm-password')?.value;

            if (!curr || !newP || !conf) {
                showToast("يرجى ملء جميع الخانات", "error");
                return;
            }

            if (newP !== conf) {
                showToast("كلمتا المرور غير متطابقتين", "error");
                return;
            }

            const user = auth.currentUser;
            if (!user) {
                showToast("جلسة العمل منتهية", "error");
                return;
            }

            try {
                passBtn.innerHTML = 'جاري المعالجة...';
                passBtn.disabled = true;

                const cred = EmailAuthProvider.credential(user.email, curr);
                await reauthenticateWithCredential(user, cred);
                await updatePassword(user, newP);

                showToast("تم تغيير كلمة المرور بنجاح ✅");
                passForm.reset();
            } catch (error) {
                console.error("Auth Error:", error.code);
                let msg = "خطأ: " + error.code;
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = "الباسورد الحالي خطأ";
                showToast(msg, "error");
            } finally {
                passBtn.innerHTML = 'تغيير كلمة المرور';
                passBtn.disabled = false;
            }
        });
    }

    // 3. Toggles
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            const input = document.getElementById(this.getAttribute('data-target'));
            const icon = this.querySelector('i');
            if (!input) return;
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            icon.classList.replace(isPass ? 'bx-show' : 'bx-hide', isPass ? 'bx-hide' : 'bx-show');
        };
    });
}




