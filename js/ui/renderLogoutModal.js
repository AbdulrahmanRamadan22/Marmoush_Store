/* /js/ui/renderLogoutModal.js */
import { logoutAdmin } from '../api/auth.js';

export function initLogoutModal() {
    // 1. حقن هيكل المودال في الصفحة إذا لم يكن موجوداً
    if (!document.getElementById('logoutConfirmModal')) {
        const modalHTML = `
            <div class="modal fade modal-confirm-premium" id="logoutConfirmModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-sm" style="max-width: 380px;">
                    <div class="modal-content border-0">
                        <div class="modal-header">
                            <div class="logout-icon-wrapper">
                                <i class='bx bx-log-out-circle'></i>
                            </div>
                        </div>
                        <div class="modal-body text-center">
                            <h4 class="fw-bold text-white mb-2">تسجيل الخروج</h4>
                            <p class="text-muted">هل أنت متأكد من رغبتك في الخروج من لوحة التحكم؟</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-cancel-logout" data-bs-dismiss="modal">إلغاء</button>
                            <button type="button" class="btn-confirm-logout" id="confirmLogoutAction">خروج</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 2. ربط جميع أزرار الخروج بالمودال
    const logoutBtns = document.querySelectorAll('.logout-btn');
    const logoutModal = new bootstrap.Modal(document.getElementById('logoutConfirmModal'));

    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutModal.show();
        });
    });

    // 3. تنفيذ الخروج الفعلي عند التأكيد
    const confirmBtn = document.getElementById('confirmLogoutAction');
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            try {
                await logoutAdmin();
                window.location.href = 'login.html';
            } catch (error) {
                console.error("Logout failed:", error);
            }
        };
    }
}
