// /js/pages/login.js
// Page controller for Login

import { loginAdmin, requireAuth, resetPassword } from '../api/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // إذا كان مسجل دخول بالفعل، اطرده من صفحة اللوجن إلى الداشبورد
    requireAuth((user) => {
        window.location.href = 'index.html'; // التوجه للرئيسية بدل صفحة المنتجات
    });

    const loginForm = document.getElementById('login-form');
    const errorAlert = document.getElementById('login-error');
    const forgotPasswordLink = document.querySelector('a[href="#"].text-primary');

    // --- ميزة استرجاع البريد المحفوظ ---
    const savedEmail = localStorage.getItem('marmoush_admin_email');
    const emailInput = document.getElementById('login-email');
    const rememberCheckbox = document.getElementById('rememberMe');

    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    // 0. ميزة إظهار وإخفاء كلمة المرور
    const toggleLoginPass = document.getElementById('toggle-login-password');
    if (toggleLoginPass) {
        toggleLoginPass.addEventListener('click', () => {
            const passInput = document.getElementById('login-password');
            const icon = toggleLoginPass.querySelector('i');
            if (passInput.type === 'password') {
                passInput.type = 'text';
                icon.className = 'bx bx-hide fs-5';
            } else {
                passInput.type = 'password';
                icon.className = 'bx bx-show fs-5';
            }
        });
    }

    // 1. معالجة تسجيل الدخول
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "جاري التحقق...";
            submitBtn.disabled = true;
            errorAlert.classList.add('d-none');

            const email = emailInput.value;
            const password = document.getElementById('login-password').value;
            const rememberMe = rememberCheckbox ? rememberCheckbox.checked : false;

            try {
                // حفظ أو مسح الإيميل من الذاكرة بناءً على اختيار "تذكرني"
                if (rememberMe) {
                    localStorage.setItem('marmoush_admin_email', email);
                } else {
                    localStorage.removeItem('marmoush_admin_email');
                }

                await loginAdmin(email, password, rememberMe);
                // توجيه صريح بعد النجاح
                window.location.href = 'index.html';
            } catch (error) {
                console.error("Login failed:", error);
                errorAlert.classList.remove('d-none');
                showToast("بيانات الدخول غير صحيحة", "error");
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // 2. معالجة نسيان كلمة المرور
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            if (!email) {
                showToast("يرجى إدخال بريدك الإلكتروني أولاً", "error");
                return;
            }
            const modalEmail = document.querySelector('#resetPasswordModal .text-primary');
            if (modalEmail) modalEmail.innerText = email + "؟";
        });
    }

    const confirmResetBtn = document.getElementById('confirmResetBtn');
    if (confirmResetBtn) {
        confirmResetBtn.addEventListener('click', async () => {
            const email = document.getElementById('login-email').value;
            const resetModal = bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal'));
            try {
                confirmResetBtn.disabled = true;
                confirmResetBtn.innerHTML = 'جاري الإرسال...';
                await resetPassword(email);
                if (resetModal) resetModal.hide();
                showToast("تم إرسال رابط إعادة التعيين بنجاح", "success");
            } catch (error) {
                showToast("خطأ في الإرسال", "error");
            } finally {
                confirmResetBtn.disabled = false;
                confirmResetBtn.innerHTML = 'تأكيد الإرسال';
            }
        });
    }

    // دالة مساعدة لعرض التنبيهات
    function showToast(message, type = "success") {
        const toast = document.getElementById('toast-body');
        const toastMsg = document.getElementById('toast-msg');
        const toastIcon = document.getElementById('toast-icon');

        if (toast && toastMsg) {
            toastMsg.innerText = message;
            
            // تغيير الأيقونة بناءً على النوع
            if (type === "error") {
                toastIcon.className = 'bx bx-error-circle icon text-danger';
            } else {
                toastIcon.className = 'bx bx-check-circle icon text-success';
            }

            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 4000);
        }
    }
});
