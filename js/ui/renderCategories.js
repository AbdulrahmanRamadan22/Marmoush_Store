// /js/ui/renderCategories.js
// UI rendering module for categories

/**
 * Render Categories Table to the DOM for Dashboard
 * @param {Array} data - The categories data
 * @param {HTMLElement} tableBody - The target element
 */
export function renderCategoriesTable(data, tableBody) {
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; 

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="py-4 text-muted">لا توجد تصنيفات حالياً.</td></tr>`;
        return;
    }

    data.forEach(category => {
        const imageUrl = category.image || 'https://via.placeholder.com/100';
        
        const row = `
            <tr>
                <td>
                    <img src="${imageUrl}" alt="${category.name}" class="rounded shadow-sm" style="width: 40px; height: 40px; object-fit: cover; border: 1px solid var(--border-color);">
                </td>
                <td class="fw-bold text-white text-end" style="font-size: 0.9rem;">${category.name}</td>
                <td class="text-muted d-none d-md-table-cell">${category.slug || '-'}</td>
                <td>
                    <div class="action-buttons justify-content-center">
                        <button class="btn-action text-primary btn-edit-category" 
                                data-id="${category.id}" 
                                data-name="${category.name}"
                                data-slug="${category.slug}"
                                data-image="${imageUrl}"
                                title="تعديل">
                            <i class='bx bx-edit-alt' style="pointer-events: none;"></i>
                        </button>
                        <button class="btn-action text-danger btn-delete-category" data-id="${category.id}" title="حذف">
                            <i class='bx bx-trash' style="pointer-events: none;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}
