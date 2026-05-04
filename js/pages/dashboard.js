import { getProducts, addProduct, deleteProduct } from '../api/products.js';
import { getCategories, addCategory, updateCategory, deleteCategory, checkCategoryExists } from '../api/categories.js';
import { renderProductsTable, showToast } from '../ui/renderProducts.js';
import { renderCategoriesTable } from '../ui/renderCategories.js';
import { requireAuth, logoutAdmin } from '../api/auth.js';
import { db } from '../firebase.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Preloader handling for a premium experience
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('fade-out');
        }, 1800);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard page initialized');
    
    // 1. Auth Guard
    requireAuth((user) => {
        console.log("Logged in as:", user.email);
    });

    // 2. Logout
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            await logoutAdmin();
        });
    });

    const path = window.location.pathname;
    const isHomePage = path.includes('index.html') || path === '/' || path.endsWith('/dashboard/');
    const isProductsPage = path.includes('products.html');
    const isCategoriesPage = path.includes('categories.html');

    // --- Custom Delete Confirmation Logic ---
    let deleteAction = null;
    const deleteModalEl = document.getElementById('deleteConfirmModal');
    const deleteModal = deleteModalEl ? new bootstrap.Modal(deleteModalEl) : null;
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (deleteAction) {
                confirmDeleteBtn.disabled = true;
                const originalText = confirmDeleteBtn.innerText;
                confirmDeleteBtn.innerText = "جاري الحذف...";
                await deleteAction();
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.innerText = originalText;
                deleteModal.hide();
                deleteAction = null;
            }
        });
    }

    function requestDelete(callback) {
        if (deleteModal) {
            deleteAction = callback;
            deleteModal.show();
        } else {
            // Fallback if modal not found
            if (confirm("هل أنت متأكد من الحذف؟")) callback();
        }
    }

    // --- Helper: Custom Category Dropdowns (With Images) ---
    async function populateCategorySelects() {
        const categories = await getCategories();
        const containers = document.querySelectorAll('.category-dropdown');
        
        containers.forEach(container => {
            const selectedDiv = container.querySelector('.dropdown-selected');
            const optionsDiv = container.querySelector('.dropdown-options');
            const hiddenInput = container.querySelector('input[type="hidden"]');
            const selectedText = selectedDiv.querySelector('.selected-text');

            // Toggle Dropdown
            selectedDiv.onclick = (e) => {
                e.stopPropagation();
                // Close others
                document.querySelectorAll('.dropdown-options').forEach(opt => {
                    if (opt !== optionsDiv) opt.classList.add('d-none');
                });
                optionsDiv.classList.toggle('d-none');
            };

            // Render Options
            optionsDiv.innerHTML = '';
            if (categories.length === 0) {
                optionsDiv.innerHTML = `
                    <div class="p-3 text-center text-muted">
                        <i class='bx bx-error-circle d-block mb-1' style="font-size: 1.5rem;"></i>
                        <span>لا توجد تصنيفات حالياً</span>
                        <a href="categories.html" class="d-block mt-2 btn btn-sm btn-outline-primary">إضافة تصنيف أولاً</a>
                    </div>
                `;
                return;
            }

            categories.forEach(cat => {
                const option = document.createElement('div');
                option.className = 'dropdown-option';
                option.innerHTML = `
                    <img src="${cat.image || 'https://cdn-icons-png.flaticon.com/512/716/716784.png'}" alt="">
                    <span>${cat.name}</span>
                `;
                option.onclick = () => {
                    hiddenInput.value = cat.name;
                    selectedText.innerHTML = `
                        <img src="${cat.image || 'https://cdn-icons-png.flaticon.com/512/716/716784.png'}" alt="" style="width:20px; height:20px; margin-right:8px;">
                        ${cat.name}
                    `;
                    selectedDiv.classList.add('has-value');
                    optionsDiv.classList.add('d-none');
                };
                optionsDiv.appendChild(option);
            });
        });
    }

    // Close dropdowns on click outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-options').forEach(opt => opt.classList.add('d-none'));
    });

    // ----- Products & Home Page Logic (Shared Product Table) -----
    if (isProductsPage || isHomePage) {
        const tableBody = document.getElementById('products-table-body');
        const addProductForm = document.getElementById('add-product-form');
        const editProductForm = document.getElementById('edit-product-form');

        async function loadProducts() {
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-muted">جاري تحميل المنتجات...</td></tr>`;
            try {
                const products = await getProducts();
                if(tableBody) {
                    renderProductsTable(products, tableBody);
                    attachProductActions();
                }
                // Update stats if on home page
                if (isHomePage) {
                    const cats = await getCategories();
                    if (document.getElementById('stat-products')) document.getElementById('stat-products').innerText = products.length;
                    if (document.getElementById('stat-categories')) document.getElementById('stat-categories').innerText = cats.length;
                    if (document.getElementById('stat-discounts')) document.getElementById('stat-discounts').innerText = products.filter(p => (p.discountPercentage || 0) > 0).length;
                }
            } catch (error) { console.error(error); }
        }

        function attachProductActions() {
            document.querySelectorAll('.btn-delete-product').forEach(btn => {
                btn.onclick = () => {
                    const id = btn.dataset.id;
                    requestDelete(async () => {
                        try {
                            await deleteProduct(id);
                            showToast("تم حذف المنتج بنجاح");
                            loadProducts();
                        } catch (error) { showToast("خطأ في الحذف"); }
                    });
                };
            });
            document.querySelectorAll('.btn-edit-product').forEach(btn => {
                btn.onclick = async (e) => {
                    const ds = btn.dataset;
                    const categories = await getCategories();
                    const currentCat = categories.find(c => c.name === ds.category);
                    
                    document.getElementById('edit-product-id').value = ds.id;
                    document.getElementById('edit-product-name').value = ds.name;
                    document.getElementById('edit-product-price').value = ds.price;
                    document.getElementById('edit-product-discount').value = ds.discount;
                    document.getElementById('edit-product-description').value = ds.desc;
                    document.getElementById('edit-product-availability').checked = ds.available === 'true';
                    document.getElementById('edit-img-preview').innerHTML = `<img src="${ds.image}" class="rounded mb-2" style="width:80px">`;
                    document.getElementById('edit-product-image-url').value = ds.image;

                    // Update Custom Dropdown UI for Edit with dynamic image
                    const catContainer = document.getElementById('edit-category-dropdown-container');
                    const hiddenInput = document.getElementById('edit-product-category');
                    const selectedText = catContainer.querySelector('.selected-text');
                    hiddenInput.value = ds.category;
                    
                    const catImg = currentCat ? (currentCat.image || 'https://cdn-icons-png.flaticon.com/512/716/716784.png') : 'https://cdn-icons-png.flaticon.com/512/716/716784.png';
                    
                    selectedText.innerHTML = ds.category ? `
                        <img src="${catImg}" style="width:20px; height:20px; margin-right:8px;">
                        <span>${ds.category}</span>
                    ` : 'اختر التصنيف';
                    
                    new bootstrap.Modal(document.getElementById('editProductModal')).show();
                };
            });
        }

        if (addProductForm) {
            addProductForm.onsubmit = async (e) => {
                e.preventDefault();
                const btn = addProductForm.querySelector('button[type="submit"]');
                btn.disabled = true;
                try {
                    const originalPrice = parseFloat(document.getElementById('product-price').value);
                    const discountPercent = parseFloat(document.getElementById('product-discount').value || 0);
                    const discountPrice = discountPercent > 0 ? (originalPrice * (1 - discountPercent/100)).toFixed(2) : null;
                    
                    const data = {
                        name: document.getElementById('product-name').value,
                        category: document.getElementById('product-category').value,
                        originalPrice, discountPercentage: discountPercent, discountPrice,
                        image: document.getElementById('product-image-url').value,
                        isAvailable: document.getElementById('product-availability').checked,
                        description: document.getElementById('product-description').value,
                        createdAt: new Date().toISOString()
                    };
                    await addProduct(data);
                    addProductForm.reset();
                    bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
                    showToast("تم الإضافة بنجاح");
                    loadProducts();
                } catch (err) { showToast("خطأ"); } finally { btn.disabled = false; }
            };
        }

        if (editProductForm) {
            editProductForm.onsubmit = async (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-product-id').value;
                const btn = editProductForm.querySelector('button[type="submit"]');
                btn.disabled = true;
                try {
                    const originalPrice = parseFloat(document.getElementById('edit-product-price').value);
                    const discountPercent = parseFloat(document.getElementById('edit-product-discount').value || 0);
                    const discountPrice = discountPercent > 0 ? (originalPrice * (1 - discountPercent/100)).toFixed(2) : null;
                    
                    const data = {
                        name: document.getElementById('edit-product-name').value,
                        category: document.getElementById('edit-product-category').value,
                        originalPrice, discountPercentage: discountPercent, discountPrice,
                        image: document.getElementById('edit-product-image-url').value,
                        isAvailable: document.getElementById('edit-product-availability').checked,
                        description: document.getElementById('edit-product-description').value
                    };
                    await updateDoc(doc(db, 'products', id), data);
                    bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
                    showToast("تم التحديث بنجاح");
                    loadProducts();
                } catch (err) { showToast("خطأ"); } finally { btn.disabled = false; }
            };
        }

        populateCategorySelects();
        loadProducts();
    }

    // ----- Categories Page Logic -----
    if (isCategoriesPage) {
        const tableBody = document.getElementById('categories-table-body');
        const addCatForm = document.getElementById('add-category-form');
        const editCatForm = document.getElementById('edit-category-form');
        const DEFAULT_CAT_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3502/3502601.png';

        async function loadCategories() {
            tableBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-muted">جاري تحميل التصنيفات...</td></tr>`;
            try {
                const categories = await getCategories();
                renderCategoriesTable(categories, tableBody);
                attachCategoryActions();
            } catch (err) { showToast("خطأ في التحميل"); }
        }

        function attachCategoryActions() {
            document.querySelectorAll('.btn-delete-category').forEach(btn => {
                btn.onclick = () => {
                    const id = btn.dataset.id;
                    requestDelete(async () => {
                        try {
                            await deleteCategory(id);
                            showToast("تم حذف التصنيف بنجاح");
                            loadCategories();
                        } catch (err) { showToast("خطأ في الحذف"); }
                    });
                };
            });
            document.querySelectorAll('.btn-edit-category').forEach(btn => {
                btn.onclick = (e) => {
                    const ds = e.target.dataset;
                    document.getElementById('edit-cat-id').value = ds.id;
                    document.getElementById('edit-cat-name').value = ds.name;
                    document.getElementById('edit-cat-slug').value = ds.slug;
                    document.getElementById('edit-cat-image').value = ds.image;
                    new bootstrap.Modal(document.getElementById('editCategoryModal')).show();
                };
            });
        }

        if (addCatForm) {
            addCatForm.onsubmit = async (e) => {
                e.preventDefault();
                const btn = addCatForm.querySelector('button[type="submit"]');
                btn.disabled = true;
                try {
                    const name = document.getElementById('cat-name').value.trim();
                    const exists = await checkCategoryExists(name);
                    if (exists) {
                        showToast("هذا التصنيف موجود بالفعل!");
                        btn.disabled = false;
                        return;
                    }

                    const data = {
                        name: name,
                        slug: document.getElementById('cat-slug').value || name.toLowerCase().replace(/ /g, '-'),
                        image: document.getElementById('cat-image').value || DEFAULT_CAT_IMAGE,
                        createdAt: new Date().toISOString()
                    };
                    await addCategory(data);
                    addCatForm.reset();
                    bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
                    showToast("تم الإضافة بنجاح");
                    loadCategories();
                } catch (err) { showToast("خطأ"); } finally { btn.disabled = false; }
            };
        }

        if (editCatForm) {
            editCatForm.onsubmit = async (e) => {
                e.preventDefault();
                const btn = editCatForm.querySelector('button[type="submit"]');
                btn.disabled = true;
                try {
                    const id = document.getElementById('edit-cat-id').value;
                    const data = {
                        name: document.getElementById('edit-cat-name').value,
                        slug: document.getElementById('edit-cat-slug').value,
                        image: document.getElementById('edit-cat-image').value || DEFAULT_CAT_IMAGE
                    };
                    await updateCategory(id, data);
                    bootstrap.Modal.getInstance(document.getElementById('editCategoryModal')).hide();
                    showToast("تم التحديث بنجاح");
                    loadCategories();
                } catch (err) { showToast("خطأ"); } finally { btn.disabled = false; }
            };
        }

        // Add Default Categories logic
        const addDefaultBtn = document.getElementById('add-default-cats-btn');
        if (addDefaultBtn) {
            addDefaultBtn.onclick = async () => {
                const defaults = [
                    { name: 'تيشرتات', image: 'https://cdn-icons-png.flaticon.com/512/2503/2503380.png' },
                    { name: 'أحذية', image: 'https://cdn-icons-png.flaticon.com/512/2742/2742687.png' },
                    { name: 'بناطيل', image: 'https://cdn-icons-png.flaticon.com/512/2293/2293026.png' },
                    { name: 'إكسسوارات', image: 'https://cdn-icons-png.flaticon.com/512/862/862856.png' }
                ];
                addDefaultBtn.disabled = true;
                addDefaultBtn.innerText = "جاري الإضافة...";
                try {
                    for (const cat of defaults) {
                        const exists = await checkCategoryExists(cat.name);
                        if (!exists) {
                            await addCategory({
                                ...cat,
                                slug: cat.name.toLowerCase().replace(/ /g, '-'),
                                createdAt: new Date().toISOString()
                            });
                        }
                    }
                    showToast("تم إضافة التصنيفات الافتراضية");
                    loadCategories();
                } catch (err) { showToast("خطأ في الإضافة"); } finally {
                    addDefaultBtn.disabled = false;
                    addDefaultBtn.innerHTML = "<i class='bx bx-list-plus'></i> إضافة تصنيفات افتراضية";
                }
            };
        }

        loadCategories();
    }

    // Logic for Home page handled inside product block for efficiency
});
