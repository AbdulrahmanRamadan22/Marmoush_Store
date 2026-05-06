export function renderBannersTable(data, tableBody) {
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; 

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="py-4 text-muted">لا توجد بانرات حالياً. أضف بانر جديد.</td></tr>`;
        return;
    }

    data.forEach(banner => {
        const imageUrl = banner.imageUrl || 'https://via.placeholder.com/1200x400';
        
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
        }[banner.page] || banner.page || '—';

        const positionName = {
            'top': 'أعلى الصفحة',
            'middle': 'منتصف الصفحة',
            'bottom': 'أسفل الصفحة'
        }[banner.position] || banner.position || '—';

        // Shared data attributes for edit button
        const editAttrs = `data-id="${banner.id}" data-title="${banner.title || ''}" data-desc="${banner.description || ''}" data-image="${imageUrl}" data-page="${banner.page}" data-position="${banner.position || 'top'}" data-link="${banner.link || ''}" data-active="${isActive}"`;

        // --- Desktop Row ---
        const desktopRow = `
            <tr class="d-none d-md-table-row">
                <td style="width: 180px;">
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
                        <button class="btn-action text-primary btn-edit-banner" ${editAttrs} title="تعديل">
                            <i class='bx bx-edit-alt' style="pointer-events: none;"></i>
                        </button>
                        <button class="btn-action text-danger btn-delete-banner" data-id="${banner.id}" title="حذف">
                            <i class='bx bx-trash' style="pointer-events: none;"></i>
                        </button>
                    </div>
                </td>
            </tr>`;

        // --- Mobile Card ---
        const mobileCard = `
            <tr class="d-md-none mobile-card-row">
                <td colspan="5" style="padding: 8px 0; border: none; background: transparent;">
                    <div class="product-mobile-card">
                        <!-- Banner Image Preview -->
                        <div class="banner-card-img-wrap">
                            <img src="${imageUrl}" alt="Banner" class="banner-card-img">
                            <span class="banner-card-status ${isActive ? 'active' : 'inactive'}">${isActive ? 'نشط' : 'غير نشط'}</span>
                        </div>
                        <!-- Info -->
                        <div class="pmc-title mt-3" style="text-align:right;">
                            <span class="pmc-name">${banner.title || 'بدون عنوان'}</span>
                            <span class="pmc-category">${banner.description || 'لا يوجد وصف'}</span>
                        </div>
                        <!-- Stats Grid -->
                        <div class="pmc-body">
                            <div class="pmc-stat">
                                <span class="pmc-stat-label">الصفحة</span>
                                <span class="pmc-stat-value">${pageName}</span>
                            </div>
                            <div class="pmc-stat">
                                <span class="pmc-stat-label">الموضع</span>
                                <span class="pmc-stat-value">${positionName}</span>
                            </div>
                        </div>
                        <!-- Actions -->
                        <div class="pmc-footer">
                            <button class="pmc-btn edit btn-edit-banner" ${editAttrs}><i class='bx bx-edit-alt'></i> تعديل</button>
                            <button class="pmc-btn danger btn-delete-banner" data-id="${banner.id}"><i class='bx bx-trash'></i> حذف</button>
                        </div>
                    </div>
                </td>
            </tr>`;

        tableBody.innerHTML += desktopRow + mobileCard;
    });
}

