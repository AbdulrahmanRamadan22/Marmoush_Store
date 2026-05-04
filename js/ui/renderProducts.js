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
        const discountPrice = product.discountPrice ? `${product.discountPrice} ج.م` : '-';
        const discountBadge = product.discountPercentage ? `<span class="badge bg-danger">-${product.discountPercentage}%</span>` : '-';
        
        // Status logic
        const isAvailable = product.isAvailable !== false; // Default to true
        const statusBadge = isAvailable 
            ? '<span class="badge bg-success-subtle text-success p-2 px-3" style="border-radius: 20px;">متوفر</span>' 
            : '<span class="badge bg-danger-subtle text-danger p-2 px-3" style="border-radius: 20px;">غير متوفر</span>';

        const row = `
            <tr>
                <td>
                    <img src="${imageUrl}" alt="${product.name}" class="rounded shadow-sm" style="width: 60px; height: 60px; object-fit: cover; border: 1px solid var(--border-color);">
                </td>
                <td class="fw-bold text-white text-end">${product.name}</td>
                <td><span class="badge bg-dark border border-secondary text-muted">${product.category || 'عام'}</span></td>
                <td class="fw-bold">${originalPrice} ج.م</td>
                <td>${discountBadge}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons justify-content-center">
                        <button class="btn-action text-primary btn-edit-product" 
                                data-id="${product.id}" 
                                data-name="${product.name}"
                                data-category="${product.category}"
                                data-price="${originalPrice}"
                                data-discount="${product.discountPercentage || 0}"
                                data-image="${imageUrl}"
                                data-available="${isAvailable}"
                                data-desc="${product.description || ''}"
                                title="تعديل">
                            <i class='bx bx-edit-alt' style="pointer-events: none;"></i>
                        </button>
                        <button class="btn-action text-danger btn-delete-product" data-id="${product.id}" title="حذف">
                            <i class='bx bx-trash' style="pointer-events: none;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

/**
 * Show a success toast notification
 * @param {string} message 
 */
export function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const toastBody = document.getElementById('toast-body');
    if(toast && toastBody) {
        toastBody.querySelector('span').innerText = message;
        toastBody.classList.add('show');
        setTimeout(() => {
            toastBody.classList.remove('show');
        }, 3000);
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
