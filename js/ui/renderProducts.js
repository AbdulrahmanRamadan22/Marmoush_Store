// /js/ui/renderProducts.js
// UI rendering module for products

/**
 * Render Products Table to the DOM for Dashboard
 * @param {Array} data - The products data to render
 * @param {HTMLElement} tableBody - The DOM element to render into
 */
export function renderProductsTable(data, tableBody) {
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; 

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="py-4 text-muted">لا توجد منتجات حالياً. أضف منتج جديد.</td></tr>`;
        return;
    }

    data.forEach(product => {
        const imageUrl = product.image || 'https://via.placeholder.com/150';
        
        // Pricing logic
        const originalPrice = parseFloat(product.originalPrice || 0);
        const discountPercentage = parseFloat(product.discountPercentage || 0);
        const hasDiscount = discountPercentage > 0;
        const finalPrice = hasDiscount 
            ? (originalPrice - (originalPrice * (discountPercentage / 100))).toFixed(2) 
            : originalPrice;

        const discountBadge = hasDiscount ? `<span class="badge bg-danger">-${discountPercentage}%</span>` : '-';
        
        // Status logic
        const isAvailable = product.isAvailable !== false; // Default to true
        const statusBadge = isAvailable 
            ? '<span class="badge bg-success-subtle text-success p-2 px-3" style="border-radius: 20px;">متوفر</span>' 
            : '<span class="badge bg-danger-subtle text-danger p-2 px-3" style="border-radius: 20px;">غير متوفر</span>';

        // --- Desktop: Standard Table Row ---
        const desktopRow = `
            <tr class="d-none d-md-table-row">
                <td><img src="${imageUrl}" alt="${product.name}" class="rounded shadow-sm" style="width: 50px; height: 50px; object-fit: cover; border: 1px solid var(--border-color);"></td>
                <td class="fw-bold text-white" style="font-size: 0.9rem;">${product.name}</td>
                <td><span class="badge bg-dark border border-secondary text-muted">${product.category || 'عام'}</span></td>
                <td>
                    <div class="fw-bold text-primary">${finalPrice} <small>ج.م</small></div>
                    ${hasDiscount ? `<div class="text-muted text-decoration-line-through small" style="font-size: 0.75rem;">${originalPrice} ج.م</div>` : ''}
                </td>
                <td>${discountBadge}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons justify-content-center">
                        <a href="product-details.html?id=${product.id}" class="btn-action text-info" title="عرض التفاصيل"><i class='bx bx-show'></i></a>
                        <button class="btn-action text-primary btn-edit-product" data-id="${product.id}" data-name="${product.name}" data-category="${product.category}" data-price="${originalPrice}" data-discount="${product.discountPercentage || 0}" data-image="${imageUrl}" data-available="${isAvailable}" data-desc="${product.description || ''}" title="تعديل"><i class='bx bx-edit-alt' style="pointer-events: none;"></i></button>
                        <button class="btn-action text-danger btn-delete-product" data-id="${product.id}" title="حذف"><i class='bx bx-trash' style="pointer-events: none;"></i></button>
                    </div>
                </td>
            </tr>`;

        // --- Mobile: Premium Div Card (injected as a tr > td wrapper to keep valid HTML) ---
        const mobileCard = `
            <tr class="d-md-none mobile-card-row">
                <td colspan="7" style="padding: 0; border: none; background: transparent;">
                    <div class="product-mobile-card">
                        <div class="pmc-header">
                            <img src="${imageUrl}" alt="${product.name}" class="pmc-img">
                            <div class="pmc-title">
                                <span class="pmc-name">${product.name}</span>
                                <span class="pmc-category">${product.category || 'عام'}</span>
                            </div>
                            <span class="pmc-status ${isAvailable ? 'available' : 'unavailable'}">${isAvailable ? 'متوفر' : 'غير متوفر'}</span>
                        </div>
                        <div class="pmc-body">
                            <div class="pmc-stat">
                                <span class="pmc-stat-label">السعر</span>
                                <span class="pmc-stat-value price">${finalPrice} ج.م</span>
                                ${hasDiscount ? `<span class="pmc-stat-old">${originalPrice} ج.م</span>` : ''}
                            </div>
                            <div class="pmc-stat">
                                <span class="pmc-stat-label">الخصم</span>
                                <span class="pmc-stat-value">${hasDiscount ? `-${discountPercentage}%` : 'لا يوجد'}</span>
                            </div>
                        </div>
                        <div class="pmc-footer">
                            <a href="product-details.html?id=${product.id}" class="pmc-btn info" title="عرض"><i class='bx bx-show'></i> عرض</a>
                            <button class="pmc-btn edit btn-edit-product" data-id="${product.id}" data-name="${product.name}" data-category="${product.category}" data-price="${originalPrice}" data-discount="${product.discountPercentage || 0}" data-image="${imageUrl}" data-available="${isAvailable}" data-desc="${product.description || ''}"><i class='bx bx-edit-alt'></i> تعديل</button>
                            <button class="pmc-btn danger btn-delete-product" data-id="${product.id}"><i class='bx bx-trash'></i> حذف</button>
                        </div>
                    </div>
                </td>
            </tr>`;

        tableBody.innerHTML += desktopRow + mobileCard;
    });
}

/**
 * Show a premium chic toast notification
 * @param {string} message 
 * @param {string} type - 'success', 'error', 'warning'
 */
export function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-notification');
    const toastBody = document.getElementById('toast-body');
    const icon = toastBody ? toastBody.querySelector('.icon i') : null;
    
    if(toast && toastBody) {
        // Reset classes
        toastBody.className = 'custom-toast';
        toastBody.classList.add(type);
        
        // Set message
        toastBody.querySelector('span').innerText = message;
        
        // Set icon
        if (icon) {
            icon.className = 'bx ' + {
                'success': 'bx-check-circle',
                'error': 'bx-error-circle',
                'warning': 'bx-info-circle'
            }[type];
        }

        toastBody.classList.add('show');
        setTimeout(() => {
            toastBody.classList.remove('show');
        }, 4000);
    }
}

/**
 * Render Product Cards to the DOM for Client Website
 * @param {Array} data - The products data
 * @param {HTMLElement} container - The grid container
 */
export function renderProducts(data, container) {
    // ... (Client code remains unchanged for now)
}
