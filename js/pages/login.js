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

    // 1. معالجة تسجيل الدخول
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "جاري التحقق...";
            submitBtn.disabled = true;
            errorAlert.classList.add('d-none');

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            try {
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
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            
            if (!email) {
                showToast("يرجى إدخال بريدك الإلكتروني أولاً", "error");
                return;
            }

            if (confirm(`هل تريد إرسال رابط إعادة تعيين كلمة المرور إلى ${email}؟`)) {
                try {
                    await resetPassword(email);
                    showToast("تم إرسال الرابط! تفقد بريدك الإلكتروني", "success");
                } catch (error) {
                    showToast("خطأ: " + error.message, "error");
                }
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
