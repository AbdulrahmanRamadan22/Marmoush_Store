import { getProducts, addProduct, deleteProduct } from '../api/products.js';
import { getCategories, addCategory, updateCategory, deleteCategory, checkCategoryExists } from '../api/categories.js';
import { getBanners, addBanner, updateBanner, deleteBanner } from '../api/banners.js';
import { getSettings, saveSettings } from '../api/settings.js';
import { renderProductsTable, showToast } from '../ui/renderProducts.js';
import { renderCategoriesTable } from '../ui/renderCategories.js';
import { renderBannersTable } from '../ui/renderBanners.js';
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
    const isHomePage = path.includes('index.html') || path === '/' || path.endsWith('/dashboard') || path.endsWith('/dashboard/');
    const isProductsPage = path.includes('products.html') || path.endsWith('/products') || path.endsWith('/products/');
    const isCategoriesPage = path.includes('categories.html') || path.endsWith('/categories') || path.endsWith('/categories/');
    const isBannersPage = path.includes('banners.html') || path.endsWith('/banners') || path.endsWith('/banners/');
    const isSettingsPage = path.includes('settings.html') || path.endsWith('/settings') || path.endsWith('/settings/');

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
        const searchInput = document.getElementById('product-search');
        const catFilter = document.getElementById('category-filter');
        
        let allProducts = []; // Local cache for filtering

        async function loadProducts() {
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-muted">جاري تحميل المنتجات...</td></tr>`;
            try {
                console.log("Fetching products from Firestore...");
                allProducts = await getProducts();
                console.log("Products fetched successfully:", allProducts.length);
                
                if(tableBody) {
                    renderProductsTable(allProducts, tableBody);
                    attachProductActions();
                }

                // Populate Category Filter if exists
                if (catFilter) {
                    const categories = await getCategories();
                    catFilter.innerHTML = '<option value="all">كل الأقسام</option>';
                    categories.forEach(cat => {
                        catFilter.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
                    });
                }

                // Update stats if on home page
                if (isHomePage) {
                    const cats = await getCategories();
                    if (document.getElementById('stat-products')) document.getElementById('stat-products').innerText = allProducts.length;
                    if (document.getElementById('stat-categories')) document.getElementById('stat-categories').innerText = cats.length;
                    if (document.getElementById('stat-discounts')) document.getElementById('stat-discounts').innerText = allProducts.filter(p => (p.discountPercentage || 0) > 0).length;
                }
            } catch (error) { 
                console.error("Firestore Fetch Error:", error);
                if(tableBody) tableBody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-danger">فشل في تحميل البيانات. تأكد من إعدادات Firebase (Authorized Domains).</td></tr>`;
            }
        }

        function applyFilters() {
            if (!tableBody) return;
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            const selectedCat = catFilter ? catFilter.value : 'all';
            
            // Advanced Filters
            const sortPrice = document.getElementById('sort-price')?.value || 'none';
            const onlyOffers = document.getElementById('filter-offers')?.checked || false;
            const availability = document.getElementById('filter-availability')?.value || 'all';

            let filtered = allProducts.filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(searchTerm);
                const matchesCat = selectedCat === 'all' || p.category === selectedCat;
                
                // Price Calculation for filtering logic
                const originalPrice = parseFloat(p.originalPrice || 0);
                const discountPercentage = parseFloat(p.discountPercentage || 0);
                const pHasDiscount = discountPercentage > 0;
                const pFinalPrice = pHasDiscount ? (originalPrice - (originalPrice * (discountPercentage / 100))) : originalPrice;

                const matchesOffers = !onlyOffers || pHasDiscount;
                
                const isAvailable = p.isAvailable !== false;
                const matchesAvailability = availability === 'all' || 
                                           (availability === 'available' && isAvailable) || 
                                           (availability === 'out' && !isAvailable);

                return matchesSearch && matchesCat && matchesOffers && matchesAvailability;
            });

            // Sorting Logic
            if (sortPrice === 'low') {
                filtered.sort((a, b) => {
                    const priceA = (a.originalPrice * (1 - (a.discountPercentage || 0) / 100));
                    const priceB = (b.originalPrice * (1 - (b.discountPercentage || 0) / 100));
                    return priceA - priceB;
                });
            } else if (sortPrice === 'high') {
                filtered.sort((a, b) => {
                    const priceA = (a.originalPrice * (1 - (a.discountPercentage || 0) / 100));
                    const priceB = (b.originalPrice * (1 - (b.discountPercentage || 0) / 100));
                    return priceB - priceA;
                });
            }

            renderProductsTable(filtered, tableBody);
            attachProductActions();
        }

        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (catFilter) catFilter.addEventListener('change', applyFilters);

        // Advanced Filter Button Listeners
        const applyAdvBtn = document.getElementById('apply-advanced-filters');
        if (applyAdvBtn) applyAdvBtn.onclick = applyFilters;

        const clearAdvBtn = document.getElementById('clear-all-filters');
        if (clearAdvBtn) {
            clearAdvBtn.onclick = () => {
                if (searchInput) searchInput.value = '';
                if (catFilter) catFilter.value = 'all';
                if (document.getElementById('sort-price')) document.getElementById('sort-price').value = 'none';
                if (document.getElementById('filter-offers')) document.getElementById('filter-offers').checked = false;
                if (document.getElementById('filter-availability')) document.getElementById('filter-availability').value = 'all';
                applyFilters();
            };
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

        // Add Product Form
        if (addProductForm) {
            addProductForm.setAttribute('novalidate', true);
            addProductForm.onsubmit = async (e) => {
                e.preventDefault();
                if (!addProductForm.checkValidity()) {
                    showToast('يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
                    return;
                }
                const btn = addProductForm.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> جاري الإضافة...';
                try {
                    const productData = {
                        name: document.getElementById('product-name').value,
                        category: document.getElementById('product-category').value,
                        originalPrice: parseFloat(document.getElementById('product-price').value),
                        discountPercentage: parseFloat(document.getElementById('product-discount').value || 0),
                        image: document.getElementById('product-image-url').value,
                        description: document.getElementById('product-description').value,
                        isAvailable: document.getElementById('product-availability').checked,
                        createdAt: new Date().toISOString()
                    };
                    await addProduct(productData);
                    showToast('تم إضافة المنتج بنجاح');
                    addProductForm.reset();
                    bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
                    loadProducts();
                } catch (error) { showToast('خطأ في الإضافة', 'error'); } finally {
                    btn.disabled = false;
                    btn.innerHTML = 'إضافة المنتج';
                }
            };
        }

        // Edit Product Form
        if (editProductForm) {
            editProductForm.setAttribute('novalidate', true);
            editProductForm.onsubmit = async (e) => {
                e.preventDefault();
                if (!editProductForm.checkValidity()) {
                    showToast('يرجى ملء البيانات المطلوبة', 'error');
                    return;
                }
                const id = document.getElementById('edit-product-id').value;
                const btn = editProductForm.querySelector('button[type="submit"]');
                btn.disabled = true;
                try {
                    const productData = {
                        name: document.getElementById('edit-product-name').value,
                        category: document.getElementById('edit-product-category').value,
                        originalPrice: parseFloat(document.getElementById('edit-product-price').value),
                        discountPercentage: parseFloat(document.getElementById('edit-product-discount').value || 0),
                        image: document.getElementById('edit-product-image-url').value,
                        description: document.getElementById('edit-product-description').value,
                        isAvailable: document.getElementById('edit-product-availability').checked
                    };
                    await updateDoc(doc(db, 'products', id), productData);
                    showToast('تم تحديث المنتج بنجاح');
                    bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
                    loadProducts();
                } catch (error) { showToast('خطأ في التعديل', 'error'); } finally { btn.disabled = false; }
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

        // Add Category Form
        if (addCatForm) {
            addCatForm.setAttribute('novalidate', true);
            addCatForm.onsubmit = async (e) => {
                e.preventDefault();
                if (!addCatForm.checkValidity()) {
                    showToast('يرجى إدخال اسم التصنيف', 'error');
                    return;
                }
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

        // Edit Category Form
        if (editCatForm) {
            editCatForm.setAttribute('novalidate', true);
            editCatForm.onsubmit = async (e) => {
                e.preventDefault();
                if (!editCatForm.checkValidity()) {
                    showToast('يرجى ملء الحقول المطلوبة', 'error');
                    return;
                }
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

    // ----- Banners Page Logic -----
    if (isBannersPage) {
        const tableBody = document.getElementById('banners-table-body');
        const addBannerForm = document.getElementById('add-banner-form');
        const editBannerForm = document.getElementById('edit-banner-form');

        async function loadBanners() {
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-muted">جاري تحميل البانرات...</td></tr>`;
            try {
                const banners = await getBanners();
                if(tableBody) {
                    renderBannersTable(banners, tableBody);
                    attachBannerActions();
                }
            } catch (error) {
                console.error("Error loading banners:", error);
            }
        }

        function attachBannerActions() {
            // Delete
            document.querySelectorAll('.btn-delete-banner').forEach(btn => {
                btn.onclick = () => {
                    const id = btn.dataset.id;
                    deleteAction = async () => {
                        await deleteBanner(id);
                        showToast('تم حذف البانر بنجاح');
                        loadBanners();
                    };
                    deleteModal.show();
                };
            });

            // Edit
            document.querySelectorAll('.btn-edit-banner').forEach(btn => {
                btn.onclick = () => {
                    const data = btn.dataset;
                    document.getElementById('edit-banner-id').value = data.id;
                    document.getElementById('edit-banner-image').value = data.image;
                    document.getElementById('edit-banner-preview').src = data.image;
                    document.getElementById('edit-banner-title').value = data.title;
                    document.getElementById('edit-banner-desc').value = data.desc;
                    document.getElementById('edit-banner-page').value = data.page;
                    document.getElementById('edit-banner-position').value = data.position;
                    document.getElementById('edit-banner-link').value = data.link;
                    document.getElementById('edit-banner-active').checked = data.active === 'true';
                    
                    const editModal = new bootstrap.Modal(document.getElementById('editBannerModal'));
                    editModal.show();
                };
            });
        }

        // Add Banner Form
        if (addBannerForm) {
            addBannerForm.setAttribute('novalidate', true);
            addBannerForm.onsubmit = async (e) => {
                e.preventDefault();
                if (!addBannerForm.checkValidity()) {
                    showToast('يرجى اختيار صورة البانر وتحديد الصفحة', 'error');
                    return;
                }
                const btn = addBannerForm.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> جاري الإضافة...';

                try {
                    const bannerData = {
                        imageUrl: document.getElementById('banner-image').value,
                        title: document.getElementById('banner-title').value,
                        description: document.getElementById('banner-desc').value,
                        page: document.getElementById('banner-page').value,
                        position: document.getElementById('banner-position').value,
                        link: document.getElementById('banner-link').value,
                        isActive: document.getElementById('banner-active').checked
                    };

                    await addBanner(bannerData);
                    showToast('تم إضافة البانر بنجاح');
                    addBannerForm.reset();
                    bootstrap.Modal.getInstance(document.getElementById('addBannerModal')).hide();
                    loadBanners();
                } catch (error) {
                    showToast('خطأ في الإضافة', 'error');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = 'إضافة البانر';
                }
            };
        }

        // Edit Banner Form
        if (editBannerForm) {
            editBannerForm.setAttribute('novalidate', true);
            editBannerForm.onsubmit = async (e) => {
                e.preventDefault();
                if (!editBannerForm.checkValidity()) {
                    showToast('يرجى ملء البيانات المطلوبة للبانر', 'error');
                    return;
                }
                const id = document.getElementById('edit-banner-id').value;
                const btn = editBannerForm.querySelector('button[type="submit"]');
                btn.disabled = true;

                try {
                    const bannerData = {
                        imageUrl: document.getElementById('edit-banner-image').value,
                        title: document.getElementById('edit-banner-title').value,
                        description: document.getElementById('edit-banner-desc').value,
                        page: document.getElementById('edit-banner-page').value,
                        position: document.getElementById('edit-banner-position').value,
                        link: document.getElementById('edit-banner-link').value,
                        isActive: document.getElementById('edit-banner-active').checked
                    };

                    await updateBanner(id, bannerData);
                    showToast('تم تحديث البانر بنجاح');
                    bootstrap.Modal.getInstance(document.getElementById('editBannerModal')).hide();
                    loadBanners();
                } catch (error) {
                    showToast('خطأ في التعديل', 'error');
                } finally {
                    btn.disabled = false;
                }
            };
        }

        loadBanners();
    }

    // ----- Settings Page Logic -----
    if (isSettingsPage) {
        const faqsContainer = document.getElementById('faqs-list-container');
        const addFaqBtn = document.getElementById('add-faq-item');
        const saveBtn = document.getElementById('save-settings-btn');

        function createFaqItem(question = '', answer = '') {
            const div = document.createElement('div');
            div.className = 'faq-edit-item mb-3 p-3 border border-secondary rounded position-relative';
            div.innerHTML = `
                <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-2 remove-faq" style="font-size: 0.7rem;"></button>
                <div class="mb-2">
                    <input type="text" class="form-control bg-dark text-white border-secondary faq-q" placeholder="السؤال" value="${question}">
                </div>
                <div>
                    <textarea class="form-control bg-dark text-white border-secondary faq-a" rows="2" placeholder="الإجابة">${answer}</textarea>
                </div>
            `;
            div.querySelector('.remove-faq').onclick = () => div.remove();
            faqsContainer.appendChild(div);
        }

        async function loadSettings() {
            const settings = await getSettings();
            if (!settings) return;

            // Basic Info
            if (settings.contact) {
                document.getElementById('set-phone').value = settings.contact.phone || '';
                document.getElementById('set-email').value = settings.contact.email || '';
                document.getElementById('set-whatsapp').value = settings.contact.whatsapp || '';
                document.getElementById('set-hours').value = settings.contact.workingHours || '';
                document.getElementById('set-address').value = settings.contact.address || '';
            }

            // Social
            if (settings.social) {
                document.getElementById('set-facebook').value = settings.social.facebook || '';
                document.getElementById('set-twitter').value = settings.social.twitter || '';
                document.getElementById('set-instagram').value = settings.social.instagram || '';
                document.getElementById('set-tiktok').value = settings.social.tiktok || '';
                document.getElementById('set-youtube').value = settings.social.youtube || '';
                document.getElementById('set-snapchat').value = settings.social.snapchat || '';
            }

            // FAQs
            if (faqsContainer && settings.faqs) {
                faqsContainer.innerHTML = '';
                settings.faqs.forEach(faq => createFaqItem(faq.question, faq.answer));
            }
        }

        if (addFaqBtn) addFaqBtn.onclick = () => createFaqItem();

        if (saveBtn) {
            saveBtn.onclick = async () => {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> جاري الحفظ...';

                try {
                    const faqs = [];
                    document.querySelectorAll('.faq-edit-item').forEach(item => {
                        const q = item.querySelector('.faq-q').value;
                        const a = item.querySelector('.faq-a').value;
                        if (q && a) faqs.push({ question: q, answer: a });
                    });

                    const data = {
                        contact: {
                            phone: document.getElementById('set-phone').value,
                            email: document.getElementById('set-email').value,
                            whatsapp: document.getElementById('set-whatsapp').value,
                            workingHours: document.getElementById('set-hours').value,
                            address: document.getElementById('set-address').value
                        },
                        social: {
                            facebook: document.getElementById('set-facebook').value,
                            twitter: document.getElementById('set-twitter').value,
                            instagram: document.getElementById('set-instagram').value,
                            tiktok: document.getElementById('set-tiktok').value,
                            youtube: document.getElementById('set-youtube').value,
                            snapchat: document.getElementById('set-snapchat').value
                        },
                        faqs: faqs
                    };

                    await saveSettings(data);
                    showToast('تم حفظ كافة الإعدادات بنجاح');
                } catch (error) {
                    showToast('خطأ في حفظ الإعدادات', 'error');
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="bx bx-save"></i> حفظ كافة التغييرات';
                }
            };
        }

        loadSettings();
    }
});
