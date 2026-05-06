import { getAllAdmins, saveAdminMetadata, deleteAdminMetadata } from '../api/admins.js';
import { initLogoutModal } from '../ui/renderLogoutModal.js';

// Firebase Config for Secondary App (to create users without logout)
const firebaseConfig = {
    apiKey: "AIzaSyDc6__7P-PLVYc-LbkIIT7eodhtIiWDmdY",
    authDomain: "marmoushstore.firebaseapp.com",
    projectId: "marmoushstore",
    storageBucket: "marmoushstore.appspot.com",
    messagingSenderId: "618729148961",
    appId: "1:618729148961:web:8f2d48b52bd039eb5d4960"
};

// Initialize Secondary App (if not already done)
let secondaryApp;
try {
    secondaryApp = firebase.app("Secondary");
} catch (e) {
    secondaryApp = firebase.initializeApp(firebaseConfig, "Secondary");
}
const secondaryAuth = secondaryApp.auth();

document.addEventListener('DOMContentLoaded', () => {
    loadAdmins();
    setupEventListeners();
});

// Load and Render Admins Table
async function loadAdmins() {
    const tableBody = document.getElementById('admins-table-body');
    if (!tableBody) return;

    try {
        const admins = await getAllAdmins();
        if (admins.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="py-4 text-muted">لا يوجد مديرين مضافين حالياً</td></tr>';
            return;
        }

        tableBody.innerHTML = admins.map(admin => `
            <tr>
                <td data-label="الاسم">
                    <div class="d-flex align-items-center gap-2 justify-content-center">
                        <div class="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center shadow-sm" style="width: 35px; height: 35px;">
                            ${admin.name.charAt(0).toUpperCase()}
                        </div>
                        <span class="fw-bold">${admin.name}</span>
                    </div>
                </td>
                <td data-label="البريد" class="text-muted">${admin.email}</td>
                <td data-label="تاريخ الإضافة" class="text-muted font-sm">${new Date(admin.createdAt).toLocaleDateString('ar-EG')}</td>
                <td data-label="الإجراءات">
                    <button class="btn btn-action delete" onclick="confirmDeleteAdmin('${admin.id}')" title="حذف">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast("فشل في تحميل قائمة المديرين", "error");
    }
}

// Setup Form and Buttons
function setupEventListeners() {
    const form = document.getElementById('add-admin-form');
    if (form) {
        form.addEventListener('submit', handleAddAdmin);
    }
}

// Handle Add Admin Form
async function handleAddAdmin(e) {
    e.preventDefault();
    console.log("Add Admin attempt started");
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    const name = document.getElementById('admin-name').value.trim();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;

    console.log("Input data:", { name, email, passLength: password.length });

    if (!name || !email || password.length < 6) {
        showToast("يرجى ملء كافة البيانات (كلمة المرور 6 أحرف على الأقل)", "error");
        return;
    }

    try {
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> جاري الإضافة...';
        btn.disabled = true;

        // 1. Create User in Firebase Auth using Secondary App
        const userCredential = await secondaryAuth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        // 2. Save Metadata to Firestore
        await saveAdminMetadata({
            uid: uid,
            name: name,
            email: email
        });

        // 3. Sign out from secondary app (important!)
        await secondaryAuth.signOut();

        showToast("تمت إضافة المدير بنجاح");
        bootstrap.Modal.getInstance(document.getElementById('addAdminModal')).hide();
        e.target.reset();
        loadAdmins();

    } catch (error) {
        console.error(error);
        let msg = "فشل في إضافة المدير";
        if (error.code === 'auth/email-already-in-use') msg = "هذا البريد الإلكتروني مستخدم بالفعل";
        showToast(msg, "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}


// --- logic for delete modal ---
let adminToDelete = { id: null, email: null };

window.confirmDeleteAdmin = (id) => {
    // Find admin email from table or state
    const tableBody = document.getElementById('admins-table-body');
    const rows = tableBody.querySelectorAll('tr');
    let email = '';
    
    rows.forEach(row => {
        const deleteBtn = row.querySelector('.delete');
        if (deleteBtn && deleteBtn.getAttribute('onclick').includes(id)) {
            email = row.querySelector('td[data-label="البريد"]').innerText;
        }
    });

    adminToDelete = { id, email };
    
    // Setup Modal
    const modal = new bootstrap.Modal(document.getElementById('deleteAdminConfirmModal'));
    const label = document.getElementById('target-admin-email-label');
    const input = document.getElementById('confirm-delete-email');
    const btn = document.getElementById('confirmDeleteAdminAction');

    label.innerText = email;
    input.value = '';
    btn.disabled = true;

    modal.show();

    // Input Validation
    input.oninput = (e) => {
        btn.disabled = e.target.value.trim() !== email;
    };

    // Handle Delete Action
    btn.onclick = async () => {
        try {
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> جاري الحذف...';
            btn.disabled = true;

            await deleteAdminMetadata(adminToDelete.id);
            
            showToast("تم حذف المسؤول بنجاح");
            modal.hide();
            loadAdmins();
        } catch (error) {
            console.error(error);
            showToast("فشل في حذف المسؤول", "error");
        } finally {
            btn.innerHTML = 'تأكيد الحذف النهائي';
        }
    };
};

// Helper: Toast
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
