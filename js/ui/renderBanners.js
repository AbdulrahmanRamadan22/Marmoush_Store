// /js/ui/renderBanners.js
// UI rendering module for banners

/**
 * Render Banners Table to the DOM
 * @param {Array} data - The banners data
 * @param {HTMLElement} tableBody - The target element
 */
export function renderBannersTable(data, tableBody) {
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; 

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="py-4 text-muted">لا توجد بانرات حالياً. أضف بانر جديد.</td></tr>`;
        return;
    }

    data.forEach(banner => {
        const imageUrl = banner.imageUrl || 'https://via.placeholder.com/1200x400';
        
        // Status logic
        const isActive = banner.isActive !== false;
        const statusBadge = isActive 
            ? '<span class="badge bg-success-subtle text-success p-2 px-3" style="border-radius: 20px;">نشط</span>' 
            : '<span class="badge bg-secondary-subtle text-muted p-2 px-3" style="border-radius: 20px;">غير نشط</span>';

        const pageName = {
            'home': 'الرئيسية',
            'products': 'كل المنتجات',
            'product_details': 'تفاصيل المنتج',
            'offers': 'العروض',
            'contact': 'تواصل معنا'
        }[banner.page] || banner.page;

        const positionName = {
            'top': 'أعلى',
            'middle': 'منتصف',
            'bottom': 'أسفل'
        }[banner.position] || banner.position;

        const row = `
            <tr>
                <td style="width: 200px;">
                    <img src="${imageUrl}" alt="Banner" class="rounded shadow-sm border border-secondary" style="width: 100%; height: 60px; object-fit: cover;">
                </td>
                <td class="text-end">
                    <div class="fw-bold text-white">${banner.title || 'بدون عنوان'}</div>
                    <div class="text-muted small text-truncate" style="max-width: 250px;">${banner.description || 'لا يوجد وصف'}</div>
                </td>
                <td>
                    <div class="badge bg-dark border border-secondary text-muted px-3 mb-1">${pageName}</div>
                    <div class="small text-info">${positionName}</div>
                </td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons justify-content-center">
                        <button class="btn-action text-primary btn-edit-banner" 
                                data-id="${banner.id}" 
                                data-title="${banner.title || ''}"
                                data-desc="${banner.description || ''}"
                                data-image="${imageUrl}"
                                data-page="${banner.page}"
                                data-position="${banner.position || 'top'}"
                                data-link="${banner.link || ''}"
                                data-active="${isActive}"
                                title="تعديل">
                            <i class='bx bx-edit-alt' style="pointer-events: none;"></i>
                        </button>
                        <button class="btn-action text-danger btn-delete-banner" data-id="${banner.id}" title="حذف">
                            <i class='bx bx-trash' style="pointer-events: none;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}
