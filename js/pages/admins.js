import { getAllAdmins, saveAdminMetadata, toggleAdminStatus } from '../api/admins.js';
import { requireAuth, logoutAdmin } from '../api/auth.js';
import { initLogoutModal } from '../ui/renderLogoutModal.js';
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

let currentUserProfile = null;
let adminToToggle = { id: null, email: null, currentStatus: null };

// Firebase Config — used ONLY for creating the isolated Secondary App
const firebaseConfig = {
    apiKey: "AIzaSyDc6__7P-PLVYc-LbkIIT7eodhtIiWDmdY",
    authDomain: "marmoushstore.firebaseapp.com",
    projectId: "marmoushstore",
    storageBucket: "marmoushstore.appspot.com",
    messagingSenderId: "618729148961",
    appId: "1:618729148961:web:8f2d48b52bd039eb5d4960"
};

// Safely create or reuse the Secondary Firebase App (Modular SDK)
const existingSecondary = getApps().find(a => a.name === 'Secondary');
const secondaryApp = existingSecondary || initializeApp(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);

document.addEventListener('DOMContentLoaded', () => {
    requireAuth((user) => {
        currentUserProfile = user;
        if (user.role === 'editor') {
            document.body.classList.add('is-editor');
        }
        loadAdmins();
        setupEventListeners();
    });
});

// Load and Render Admins
async function loadAdmins() {
    const tableBody = document.getElementById('admins-table-body');
    if (!tableBody) return;

    try {
        const admins = await getAllAdmins();
        if (admins.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="py-4 text-muted">لا يوجد مديرين مضافين حالياً</td></tr>';
            return;
        }

        tableBody.innerHTML = admins.map(admin => {
            const initials = admin.name ? admin.name.charAt(0).toUpperCase() : 'A';
            const roleBadge = admin.role === 'admin' ? 
                '<span class="badge bg-primary-subtle text-primary px-3">مدير كامل</span>' : 
                '<span class="badge bg-secondary-subtle text-secondary px-3">مدير محتوى</span>';
            
            const isActive = (!admin.status || admin.status === 'active');
            const statusBadge = isActive ? 
                '<span class="badge bg-success-subtle text-success px-3"><i class="bx bx-check"></i> نشط</span>' : 
                '<span class="badge bg-danger-subtle text-danger px-3"><i class="bx bx-x"></i> معطل</span>';

            const btnIcon = isActive ? 'bx-lock-alt' : 'bx-check-circle';
            const btnTitle = isActive ? 'تعطيل المسؤول' : 'تفعيل المسؤول';
            const btnColorClass = isActive ? 'text-danger' : 'text-success';

            // Check if current user is allowed to perform status actions
            const canToggle = currentUserProfile && currentUserProfile.role === 'admin';

            const toggleBtn = canToggle ? `
                <button class="btn btn-action delete btn-toggle-admin ${btnColorClass}" 
                        data-bs-toggle="modal" 
                        data-bs-target="#statusAdminConfirmModal"
                        data-id="${admin.id}" 
                        data-email="${admin.email}"
                        data-status="${isActive ? 'active' : 'disabled'}"
                        title="${btnTitle}">
                    <i class='bx ${btnIcon}'></i>
                </button>` : `<span class="text-muted">—</span>`;

            const mobileToggleBtn = canToggle ? `
                <button class="amc-delete-btn btn-toggle-admin ${isActive ? '' : 'text-success'}" 
                        data-bs-toggle="modal" 
                        data-bs-target="#statusAdminConfirmModal"
                        data-id="${admin.id}" 
                        data-email="${admin.email}"
                        data-status="${isActive ? 'active' : 'disabled'}">
                    <i class='bx ${btnIcon}'></i> ${btnTitle}
                </button>` : '';

            // Desktop Row
            const desktopRow = `
            <tr class="d-none d-md-table-row">
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center shadow-sm" style="width: 35px; height: 35px;">${initials}</div>
                        <span class="fw-bold">${admin.name}</span>
                    </div>
                </td>
                <td class="text-muted">${admin.email}</td>
                <td>${roleBadge}</td>
                <td>${statusBadge}</td>
                <td>${toggleBtn}</td>
            </tr>`;

            // Mobile Card
            const mobileCard = `
            <tr class="d-md-none mobile-card-row">
                <td colspan="5" style="padding: 4px 0; border: none; background: transparent;">
                    <div class="admin-mobile-card">
                        <div class="amc-header">
                            <div class="amc-info">
                                <div class="amc-avatar">${initials}</div>
                                <div class="amc-details">
                                    <span class="amc-name">${admin.name}</span>
                                    <span class="amc-email">${admin.email}</span>
                                </div>
                            </div>
                            <div class="amc-badges">
                                ${roleBadge}
                                ${statusBadge}
                            </div>
                        </div>
                        <div class="amc-footer">
                            <span class="amc-date"><i class='bx bx-calendar'></i> ${new Date(admin.createdAt).toLocaleDateString('ar-EG')}</span>
                            ${mobileToggleBtn}
                        </div>
                    </div>
                </td>
            </tr>`;

            return desktopRow + mobileCard;
        }).join('');
    } catch (error) {
        console.error("Error loading admins:", error);
        showToast("فشل في تحميل قائمة المديرين", "error");
    }
}

function setupEventListeners() {
    const form = document.getElementById('add-admin-form');
    if (form) {
        form.onsubmit = handleAddAdmin;
    }

    // Modal data binding
    const statusModal = document.getElementById('statusAdminConfirmModal');
    if (statusModal) {
        statusModal.addEventListener('show.bs.modal', function (event) {
            const btn = event.relatedTarget;
            const id = btn.getAttribute('data-id');
            const email = btn.getAttribute('data-email');
            const currentStatus = btn.getAttribute('data-status');
            
            if (currentUserProfile && currentUserProfile.role === 'editor') {
                showToast("ليس لديك صلاحية لتغيير حالة المسؤولين", "error");
                event.preventDefault();
                return;
            }

            adminToToggle = { id, email, currentStatus };
            
            const isActivating = currentStatus === 'disabled';
            
            // Update Modal UI
            document.getElementById('status-modal-title').innerText = isActivating ? 'تأكيد تفعيل المسؤول' : 'تأكيد تعطيل المسؤول';
            document.getElementById('status-modal-desc').innerText = isActivating ? 'هل أنت متأكد من إعادة تفعيل صلاحيات هذا المسؤول؟' : 'هل أنت متأكد من إيقاف صلاحيات هذا المسؤول مؤقتاً؟';
            document.getElementById('target-admin-email-label').innerText = email;
            
            const iconWrapper = document.getElementById('status-modal-icon');
            iconWrapper.style.color = isActivating ? '#198754' : '#ff4d5e';
            iconWrapper.style.background = isActivating ? 'rgba(25, 135, 84, 0.1)' : 'rgba(220, 53, 69, 0.1)';
            iconWrapper.innerHTML = `<i class='bx ${isActivating ? 'bx-check-shield' : 'bx-lock-alt'}'></i>`;
            
            const confirmBtn = document.getElementById('confirmStatusAdminAction');
            confirmBtn.className = `btn w-100 shadow-sm ${isActivating ? 'btn-success' : 'btn-danger'}`;
            confirmBtn.innerText = isActivating ? 'تأكيد التفعيل' : 'تأكيد التعطيل';
        });
    }

    // Handle Status Change Confirmation
    const confirmBtnAction = document.getElementById('confirmStatusAdminAction');
    if (confirmBtnAction) {
        confirmBtnAction.onclick = async () => {
            try {
                const isActivating = adminToToggle.currentStatus === 'disabled';
                const newStatus = isActivating ? 'active' : 'disabled';
                
                confirmBtnAction.innerHTML = '<span class="spinner-border spinner-border-sm"></span> جاري التنفيذ...';
                confirmBtnAction.disabled = true;

                await toggleAdminStatus(adminToToggle.id, newStatus);
                showToast(`تم ${isActivating ? 'تفعيل' : 'تعطيل'} المسؤول بنجاح`);
                
                // Close modal by simulating click on "Cancel" button (Safest way)
                const modalElement = document.getElementById('statusAdminConfirmModal');
                const closeBtn = modalElement.querySelector('[data-bs-dismiss="modal"]');
                if (closeBtn) closeBtn.click();

                // Final cleanup
                setTimeout(() => {
                    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                }, 300);

                if (!isActivating && currentUserProfile && adminToToggle.email === currentUserProfile.email) {
                    showToast("لقد قمت بتعطيل حسابك، سيتم تسجيل خروجك الآن...", "error");
                    setTimeout(() => { logoutAdmin(); window.location.href = 'login.html'; }, 2000);
                } else {
                    loadAdmins();
                }
            } catch (error) {
                console.error(error);
                showToast("فشل في تحديث حالة المسؤول", "error");
            } finally {
                confirmBtnAction.disabled = false;
            }
        };
    }
}

async function handleAddAdmin(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    const name = document.getElementById('admin-name').value.trim();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const role = document.getElementById('admin-role').value;

    if (!name || !email || password.length < 6) {
        showToast("يرجى ملء كافة البيانات (6 أحرف على الأقل)", "error");
        return;
    }

    try {
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> جاري الإضافة...';
        btn.disabled = true;

        console.log("Creating user in secondary auth...");
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const uid = userCredential.user.uid;
        
        console.log("User created, saving metadata...", uid);
        await saveAdminMetadata({ uid, name, email, role });
        
        console.log("Metadata saved, signing out from secondary...");
        await signOut(secondaryAuth);

        showToast("تمت إضافة المدير بنجاح");
        
        // Close modal by simulating click on the close button
        const modalEl = document.getElementById('addAdminModal');
        const closeBtn = modalEl.querySelector('[data-bs-dismiss="modal"]');
        if (closeBtn) closeBtn.click();
        
        // Final cleanup for backdrops
        setTimeout(() => {
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, 300);
        
        e.target.reset();
        await loadAdmins();
        
    } catch (error) {
        console.error("Add Admin Error:", error);
        let msg = "فشل في إضافة المدير";
        if (error.code === 'auth/email-already-in-use') msg = "هذا البريد مستخدم بالفعل";
        showToast(msg, "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function showToast(message, type = "success") {
    const toast = document.getElementById('toast-notification');
    const body = document.getElementById('toast-body');
    if (!toast || !body) return;
    body.className = `custom-toast ${type === 'error' ? 'border-danger' : ''}`;
    body.querySelector('span').innerText = message;
    body.querySelector('i').className = `bx ${type === 'error' ? 'bx-error-circle text-danger' : 'bx-check-circle text-success'} icon`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
