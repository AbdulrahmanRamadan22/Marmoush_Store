import { getProducts, addProduct, updateProduct, deleteProduct, getProductsCount, restoreProduct } from '../api/products.js';
import { getRecentLogs } from '../api/logs.js';
import { getCategories, addCategory, updateCategory, deleteCategory, checkCategoryExists } from '../api/categories.js';
import { getBanners, addBanner, updateBanner, deleteBanner } from '../api/banners.js';
import { getSettings, saveSettings } from '../api/settings.js';
import { renderProductsTable, showToast } from '../ui/renderProducts.js';
import { renderCategoriesTable } from '../ui/renderCategories.js';
import { renderBannersTable } from '../ui/renderBanners.js';
import { requireAuth, logoutAdmin } from '../api/auth.js';
import { db } from '../firebase.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import { initLogoutModal } from '../ui/renderLogoutModal.js';

// Preloader handling
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('fade-out');
        }, 1200); // Reduced delay for better feel
    }
});

// Fallback: If preloader still exists after 5 seconds, remove it
setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader && !preloader.classList.contains('fade-out')) {
        preloader.classList.add('fade-out');
    }
}, 5000);

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard page initialized');
    
    // 1. Auth Guard
    let currentUserProfile = null;

    // 1. Auth Guard
    requireAuth(async (user) => {
        currentUserProfile = user;
        console.log('User role:', user.role);

        // UI Adjustments based on role
        if (user.role === 'editor') {
            document.body.classList.add('is-editor');
        }
        console.log("Logged in as:", user.email);
    });

    // 2. Initialize Global Logout Modal
    initLogoutModal();

    const path = window.location.pathname;
    const isHomePage = path.includes('index.html') || path === '/' || path.endsWith('/dashboard') || path.endsWith('/dashboard/');
    const isProductsPage = path.includes('products.html') || path.endsWith('/products') || path.endsWith('/products/');
    const isCategoriesPage = path.includes('categories.html') || path.endsWith('/categories') || path.endsWith('/categories/');
    const isBannersPage = path.includes('banners.html') || path.endsWith('/banners') || path.endsWith('/banners/');
    const isSettingsPage = path.includes('settings.html') || path.endsWith('/settings') || path.endsWith('/settings/');
    const isDetailsPage = path.includes('product-details.html');

    // --- Global Search Implementation ---
    const searchInputs = document.querySelectorAll('.global-search-input');
    const searchModalEl = document.getElementById('searchResultModal');
    let searchModal = null;
    if (searchModalEl) searchModal = new bootstrap.Modal(searchModalEl);

    searchInputs.forEach(input => {
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim().toLowerCase();
                if (query.length < 2) {
                    showToast("يرجى كتابة حرفين على الأقل للبحث", "warning");
                    return;
                }
                performGlobalSearch(query);
            }
        });
    });

    async function performGlobalSearch(queryText) {
        if (!searchModal) return;
        searchModal.show();
        const resultsContainer = document.getElementById('search-results-content');
        resultsContainer.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary mb-3"></div><p>جاري البحث في المتجر...</p></div>`;

        try {
            // Fetch all data for client-side filtering (simplest for "search all")
            const [productsData, categories, banners] = await Promise.all([
                getProducts({ pageSize: "all" }),
                getCategories(),
                getBanners()
            ]);

            const products = productsData.products;

            const filteredProducts = products.filter(p => p.name.toLowerCase().includes(queryText) || (p.description && p.description.toLowerCase().includes(queryText)));
            const filteredCats = categories.filter(c => c.name.toLowerCase().includes(queryText));
            const filteredBanners = banners.filter(b => (b.title && b.title.toLowerCase().includes(queryText)) || (b.description && b.description.toLowerCase().includes(queryText)));

            renderSearchResults(filteredProducts, filteredCats, filteredBanners);
        } catch (error) {
            console.error("Search error:", error);
            resultsContainer.innerHTML = `<div class="alert alert-danger">حدث خطأ أثناء البحث.</div>`;
        }
    }

    function renderSearchResults(products, cats, banners) {
        const resultsContainer = document.getElementById('search-results-content');
        if (products.length === 0 && cats.length === 0 && banners.length === 0) {
            resultsContainer.innerHTML = `<div class="text-center py-5"><i class='bx bx-search-alt fs-1 text-muted mb-3'></i><p>لا توجد نتائج مطابقة لبحثك.</p></div>`;
            return;
        }

        let html = '';

        if (products.length > 0) {
            html += `<h6 class="text-primary mb-3 mt-2 border-bottom border-secondary pb-2"><i class='bx bx-t-shirt'></i> المنتجات (${products.length})</h6>
                     <div class="list-group list-group-flush mb-4">`;
            products.forEach(p => {
                html += `<a href="product-details.html?id=${p.id}" class="list-group-item list-group-item-action bg-transparent text-white border-secondary d-flex align-items-center gap-3">
                            <img src="${p.image || 'https://via.placeholder.com/50'}" class="rounded" style="width:40px; height:40px; object-fit:cover;">
                            <div><div class="fw-bold">${p.name}</div><small class="text-muted">${p.category || 'عام'}</small></div>
                         </a>`;
            });
            html += `</div>`;
        }

        if (cats.length > 0) {
            html += `<h6 class="text-success mb-3 border-bottom border-secondary pb-2"><i class='bx bx-category'></i> التصنيفات (${cats.length})</h6>
                     <div class="list-group list-group-flush mb-4">`;
            cats.forEach(c => {
                html += `<a href="categories.html" class="list-group-item list-group-item-action bg-transparent text-white border-secondary d-flex align-items-center gap-3">
                            <img src="${c.image || 'https://via.placeholder.com/50'}" class="rounded" style="width:40px; height:40px; object-fit:cover;">
                            <div class="fw-bold">${c.name}</div>
                         </a>`;
            });
            html += `</div>`;
        }

        if (banners.length > 0) {
            html += `<h6 class="text-info mb-3 border-bottom border-secondary pb-2"><i class='bx bx-image'></i> البانرات (${banners.length})</h6>
                     <div class="list-group list-group-flush">`;
            banners.forEach(b => {
                html += `<a href="banners.html" class="list-group-item list-group-item-action bg-transparent text-white border-secondary d-flex align-items-center gap-3">
                            <img src="${b.imageUrl || 'https://via.placeholder.com/50'}" class="rounded" style="width:40px; height:40px; object-fit:cover;">
                            <div class="fw-bold">${b.title || 'بدون عنوان'}</div>
                         </a>`;
            });
            html += `</div>`;
        }

        resultsContainer.innerHTML = html;
    }

    // --- Custom Delete Confirmation Logic ---
    let deleteAction = null;
    
    window.requestDelete = function(callback) {
        deleteAction = callback;
        const modalEl = document.getElementById('deleteConfirmModal');
        if (modalEl) {
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        } else {
            if (confirm("هل أنت متأكد من الحذف؟")) callback();
        }
    };

    const confirmBtn = document.getElementById('confirm-delete-btn');
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            if (deleteAction) {
                confirmBtn.disabled = true;
                const originalText = confirmBtn.innerText;
                confirmBtn.innerText = "جاري الحذف...";
                try {
                    await deleteAction();
                } catch (err) {
                    console.error(err);
                } finally {
                    confirmBtn.disabled = false;
                    confirmBtn.innerText = originalText;
                    const modalEl = document.getElementById('deleteConfirmModal');
                    if (modalEl) {
                        const modal = bootstrap.Modal.getInstance(modalEl);
                        if (modal) modal.hide();
                    }
                    deleteAction = null;
                }
            }
        };
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
    if (isProductsPage || isHomePage || isDetailsPage) {
        const tableBody = document.getElementById('products-table-body');
        const addProductForm = document.getElementById('add-product-form');
        const editProductForm = document.getElementById('edit-product-form');
        const searchInput = document.getElementById('product-search');
        const catFilter = document.getElementById('category-filter');
        
        let allProducts = [];
        let currentPage = 1;
        let pageSize = 20;
        let lastVisible = null;
        let totalProducts = 0;
        let includeDeleted = false;
        let pageHistory = [null]; // Page 1 starts with no startAfter document

        // --- Gallery Management Helper ---
        function createGalleryField(value = '', containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            const div = document.createElement('div');
            div.className = 'd-flex gap-2 mb-2 gallery-field-row';
            div.innerHTML = `
                <input type="url" class="form-control bg-dark text-white border-secondary gallery-input" value="${value}" placeholder="رابط الصورة">
                <button type="button" class="btn btn-outline-danger btn-sm remove-gallery-field">
                    <i class='bx bx-trash'></i>
                </button>
            `;
            
            div.querySelector('.remove-gallery-field').onclick = () => div.remove();
            container.appendChild(div);
        }

        const addGalleryBtn = document.getElementById('add-gallery-field');
        if (addGalleryBtn) {
            addGalleryBtn.onclick = () => createGalleryField('', 'gallery-inputs-container');
        }

        const editAddGalleryBtn = document.getElementById('edit-add-gallery-field');
        if (editAddGalleryBtn) {
            editAddGalleryBtn.onclick = () => createGalleryField('', 'edit-gallery-inputs-container');
        }

        async function loadProducts(page = 1) {
            if (!tableBody && !isHomePage) return;
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div> جاري تحميل المنتجات...</td></tr>`;
            
            try {
                // Update total count
                totalProducts = await getProductsCount(includeDeleted);
                if (document.getElementById('total-count')) document.getElementById('total-count').innerText = totalProducts;

                const result = await getProducts({ 
                    pageSize: isHomePage ? 5 : pageSize, 
                    lastDoc: pageHistory[page - 1],
                    includeDeleted: includeDeleted
                });

                allProducts = result.products;
                lastVisible = result.lastVisible;

                if (page > currentPage && lastVisible) {
                    pageHistory[page] = lastVisible;
                }

                currentPage = page;
                updatePaginationUI();
                
                if(tableBody) {
                    renderProductsTable(allProducts, tableBody);
                    attachProductActions();
                    populateCategorySelects();
                    checkUrlParams();
                }

                if (isHomePage) {
                    try {
                        const cats = await getCategories();
                        if (document.getElementById('stat-products')) document.getElementById('stat-products').innerText = totalProducts;
                        if (document.getElementById('stat-categories')) document.getElementById('stat-categories').innerText = cats.length;
                        
                        const available = allProducts.filter(p => p.isAvailable !== false).length;
                        if (document.getElementById('stat-available')) document.getElementById('stat-available').innerText = available;

                        const totalViews = allProducts.reduce((sum, p) => sum + (p.views || 0), 0);
                        if (document.getElementById('stat-views')) document.getElementById('stat-views').innerText = totalViews.toLocaleString('ar-EG');

                        const sorted = [...allProducts].sort((a, b) => (b.views || 0) - (a.views || 0));
                        
                        // Defensive checks for Chart and Most Viewed
                        if (typeof renderCharts === 'function') renderCharts(allProducts);
                        if (typeof renderMostViewedTable === 'function') renderMostViewedTable(sorted.slice(0, 5));
                        
                        // Render Activity Log
                        renderActivityLog();
                    } catch (homeErr) {
                        console.error("Home stats rendering error:", homeErr);
                    }
                }
            } catch (error) { 
                console.error("Firestore Fetch Error:", error);
                if(tableBody) tableBody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-danger">فشل في تحميل البيانات.</td></tr>`;
            }
        }

        function updatePaginationUI() {
            const prevBtn = document.getElementById('prev-page-btn');
            const nextBtn = document.getElementById('next-page-btn');
            const showingCount = document.getElementById('showing-count');
            if (prevBtn) prevBtn.disabled = currentPage === 1;
            if (nextBtn) nextBtn.disabled = (currentPage * pageSize) >= totalProducts;
            if (showingCount) showingCount.innerText = (Math.min(currentPage * pageSize, totalProducts));
        }

        const prevBtnEl = document.getElementById('prev-page-btn');
        const nextBtnEl = document.getElementById('next-page-btn');
        if (prevBtnEl) prevBtnEl.onclick = () => loadProducts(currentPage - 1);
        if (nextBtnEl) {
            nextBtnEl.onclick = () => {
                if (!pageHistory[currentPage]) pageHistory[currentPage] = lastVisible;
                loadProducts(currentPage + 1);
            };
        }

        const archiveToggle = document.getElementById('archive-toggle');
        if (archiveToggle) {
            archiveToggle.onchange = (e) => {
                includeDeleted = e.target.checked;
                pageHistory = [null];
                loadProducts(1);
            };
        }

        async function checkUrlParams() {
            const params = new URLSearchParams(window.location.search);
            const editId = params.get('edit');
            if (editId && isProductsPage) {
                const product = allProducts.find(p => p.id === editId);
                if (product) {
                    setTimeout(() => {
                        const editBtn = document.querySelector(`.btn-edit-product[data-id="${editId}"]`);
                        if (editBtn) editBtn.click();
                    }, 500);
                }
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
                btn.onclick = (e) => {
                    const id = btn.dataset.id;
                    const isRestore = includeDeleted;
                    requestDelete(async () => {
                        try {
                            if (isRestore) {
                                await restoreProduct(id);
                                showToast("تم استعادة المنتج بنجاح");
                            } else {
                                await deleteProduct(id);
                                showToast("تم نقل المنتج للأرشيف");
                            }
                            loadProducts(currentPage);
                        } catch (error) { showToast("حدث خطأ في العملية"); }
                    });
                };
            });

            // Update UI for archive mode
            if (includeDeleted) {
                document.querySelectorAll('.btn-delete-product').forEach(btn => {
                    btn.innerHTML = "<i class='bx bx-undo'></i>";
                    btn.className = "btn-action text-success btn-delete-product";
                    btn.title = "استعادة";
                });
            }
        }

        // --- Excel Export & Import ---
        async function initExcelOperations() {
            const exportBtn = document.getElementById('export-excel-btn');
            const importInput = document.getElementById('import-excel-input');

            if (exportBtn) {
                exportBtn.onclick = async () => {
                    showToast("جاري تحضير ملف الإكسيل...", "info");
                    try {
                        // Load SheetJS if not loaded
                        if (typeof XLSX === 'undefined') {
                            await loadScript("https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js");
                        }

                        // Fetch all products for export
                        const result = await getProducts({ pageSize: "all" });
                        const data = result.products.map(p => ({
                            "اسم المنتج": p.name,
                            "التصنيف": p.category,
                            "السعر": p.originalPrice,
                            "الخصم %": p.discountPercentage,
                            "الوصف": p.description,
                            "رابط الصورة": p.image,
                            "متوفر": p.isAvailable !== false ? "نعم" : "لا"
                        }));

                        const worksheet = XLSX.utils.json_to_sheet(data);
                        const workbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(workbook, worksheet, "المنتجات");
                        XLSX.writeFile(workbook, "Marmoush_Store_Products.xlsx");
                        showToast("تم تصدير الملف بنجاح");
                    } catch (err) {
                        console.error(err);
                        showToast("فشل تصدير الملف", "error");
                    }
                };
            }

            if (importInput) {
                importInput.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    showToast("جاري قراءة الملف...", "info");
                    try {
                        if (typeof XLSX === 'undefined') {
                            await loadScript("https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js");
                        }

                        const reader = new FileReader();
                        reader.onload = async (event) => {
                            const data = new Uint8Array(event.target.result);
                            const workbook = XLSX.read(data, { type: 'array' });
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const jsonData = XLSX.utils.sheet_to_json(worksheet);

                            if (jsonData.length === 0) {
                                showToast("الملف فارغ!", "warning");
                                return;
                            }

                            showToast(`جاري استيراد ${jsonData.length} منتج...`, "info");
                            
                            let successCount = 0;
                            for (const row of jsonData) {
                                try {
                                    const product = {
                                        name: row["اسم المنتج"] || row["Name"],
                                        category: row["التصنيف"] || row["Category"] || "عام",
                                        originalPrice: parseFloat(row["السعر"] || row["Price"] || 0),
                                        discountPercentage: parseFloat(row["الخصم %"] || row["Discount"] || 0),
                                        description: row["الوصف"] || row["Description"] || "",
                                        image: row["رابط الصورة"] || row["Image URL"] || "",
                                        isAvailable: (row["متوفر"] || row["Available"]) === "لا" ? false : true,
                                        createdAt: new Date().toISOString()
                                    };
                                    await addProduct(product);
                                    successCount++;
                                } catch (err) { console.error("Error importing row:", row, err); }
                            }

                            showToast(`تم استيراد ${successCount} منتج بنجاح`);
                            loadProducts(1);
                        };
                        reader.readAsArrayBuffer(file);
                    } catch (err) {
                        console.error(err);
                        showToast("فشل استيراد الملف", "error");
                    }
                };
            }
        }

        function loadScript(url) {
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = url;
                script.onload = resolve;
                document.head.appendChild(script);
            });
        }

        initExcelOperations();
            // Use Event Delegation for Edit Buttons (Supports dynamically added buttons)
            document.addEventListener('click', async (e) => {
                const btn = e.target.closest('.btn-edit-product');
                if (!btn) return;
                
                e.preventDefault();
                
                try {
                    const ds = btn.dataset;
                    
                    const product = allProducts.find(p => String(p.id) === String(ds.id));
                    if (!product) return;

                    // Ensure we have categories for the dropdown
                    const categories = await getCategories();
                    const currentCat = categories.find(c => c.name === product.category);
                    
                    const safeSetValue = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
                    const safeSetChecked = (id, checked) => { const el = document.getElementById(id); if (el) el.checked = checked; };
                    const safeSetHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

                    safeSetValue('edit-product-id', product.id);
                    safeSetValue('edit-product-name', product.name || '');
                    safeSetValue('edit-product-price', product.originalPrice || '');
                    safeSetValue('edit-product-discount', product.discountPercentage || '');
                    safeSetValue('edit-product-description', product.description || '');
                    safeSetChecked('edit-product-availability', product.isAvailable !== false);
                    safeSetHtml('edit-img-preview', `<img src="${product.image || ''}" class="rounded mb-2" style="width:80px">`);
                    safeSetValue('edit-product-image-url', product.image || '');

                    // New Fields (Safely handled if missing in some pages)
                    safeSetValue('edit-product-sku', product.sku || '');
                    safeSetValue('edit-product-colors', (product.colors || []).join(', '));
                    // Gallery Management
                    const editGalleryContainer = document.getElementById('edit-gallery-inputs-container');
                    if (editGalleryContainer) {
                        editGalleryContainer.innerHTML = '';
                        (product.gallery || []).forEach(url => createGalleryField(url, 'edit-gallery-inputs-container'));
                    }
                    
                    // Sizes
                    document.querySelectorAll('.edit-size-checkbox').forEach(cb => {
                        cb.checked = (product.sizes || []).includes(cb.value);
                    });

                    // Update Custom Dropdown UI for Edit with dynamic image
                    const catContainer = document.getElementById('edit-category-dropdown-container');
                    if (catContainer) {
                        const hiddenInput = document.getElementById('edit-product-category');
                        const selectedText = catContainer.querySelector('.selected-text');
                        if (hiddenInput) hiddenInput.value = product.category || '';
                        
                        const catImg = currentCat ? (currentCat.image || 'https://cdn-icons-png.flaticon.com/512/716/716784.png') : 'https://cdn-icons-png.flaticon.com/512/716/716784.png';
                        
                        if (selectedText) {
                            selectedText.innerHTML = product.category ? `
                                <img src="${catImg}" style="width:20px; height:20px; margin-right:8px;">
                                <span>${product.category}</span>
                            ` : 'اختر التصنيف';
                        }
                    }
                    
                    const modalEl = document.getElementById('editProductModal');
                    if (modalEl) {
                        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                        modal.show();
                    }
                } catch (err) {
                    console.error("Error showing edit modal:", err);
                }
            });

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
                        originalPrice: parseFloat(document.getElementById('product-price').value || 0),
                        discountPercentage: parseFloat(document.getElementById('product-discount').value || 0),
                        image: document.getElementById('product-image-url').value,
                        description: document.getElementById('product-description').value,
                        isAvailable: document.getElementById('product-availability').checked,
                        sku: document.getElementById('product-sku').value.trim(),
                        colors: document.getElementById('product-colors').value.split(',').map(c => c.trim()).filter(c => c),
                        gallery: Array.from(document.querySelectorAll('#gallery-inputs-container .gallery-input')).map(input => input.value.trim()).filter(url => url),
                        sizes: Array.from(document.querySelectorAll('.size-checkbox:checked')).map(cb => cb.value),
                        createdAt: new Date().toISOString()
                    };
                    await addProduct(productData);
                    showToast('تم إضافة المنتج بنجاح');
                    addProductForm.reset();
                    const gCon = document.getElementById('gallery-inputs-container');
                    if(gCon) gCon.innerHTML = ''; // Reset dynamic fields
                    bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
                    loadProducts(1);
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
                const productId = document.getElementById('edit-product-id').value;
                const btn = editProductForm.querySelector('button[type="submit"]');
                btn.disabled = true;
                try {
                    const productData = {
                        name: document.getElementById('edit-product-name').value,
                        category: document.getElementById('edit-product-category').value,
                        originalPrice: parseFloat(document.getElementById('edit-product-price').value || 0),
                        discountPercentage: parseFloat(document.getElementById('edit-product-discount').value || 0),
                        image: document.getElementById('edit-product-image-url').value,
                        description: document.getElementById('edit-product-description').value,
                        isAvailable: document.getElementById('edit-product-availability').checked,
                        sku: document.getElementById('edit-product-sku').value.trim(),
                        colors: document.getElementById('edit-product-colors').value.split(',').map(c => c.trim()).filter(c => c),
                        gallery: Array.from(document.querySelectorAll('#edit-gallery-inputs-container .gallery-input')).map(input => input.value.trim()).filter(url => url),
                        sizes: Array.from(document.querySelectorAll('.edit-size-checkbox:checked')).map(cb => cb.value)
                    };
                    
                    await updateProduct(productId, productData);
                    showToast('تم التعديل بنجاح');
                    
                    bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
                    
                    if (isDetailsPage) {
                        setTimeout(() => window.location.reload(), 1000);
                    } else {
                        loadProducts(currentPage);
                    }
                } catch (error) { 
                    console.error("Update error:", error);
                    showToast('خطأ في التعديل', 'error'); 
                } finally { 
                    btn.disabled = false; 
                }
            };
        }

        populateCategorySelects();
        loadProducts(1);
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

// =============================================
// CHARTS - Category Distribution & Availability
// =============================================
let categoryChartInstance = null;
let availabilityChartInstance = null;

function renderCharts(products) {
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js is not loaded. Skipping charts.");
        return;
    }
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';

    const catCounts = {};
    products.forEach(p => {
        const cat = p.category || 'غير مصنف';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
    const catLabels = Object.keys(catCounts);
    const catData   = Object.values(catCounts);
    const palette = ['#6366f1','#22c55e','#f59e0b','#ef4444','#a78bfa','#38bdf8','#fb923c','#f472b6','#34d399','#facc15'];

    const catCanvas = document.getElementById('categoryChart');
    if (catCanvas) {
        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(catCanvas, {
            type: 'bar',
            data: {
                labels: catLabels,
                datasets: [{
                    label: 'عدد المنتجات',
                    data: catData,
                    backgroundColor: catLabels.map((_, i) => palette[i % palette.length]),
                    borderRadius: 10,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => ` ${ctx.raw} منتج` } }
                },
                scales: {
                    x: { ticks: { color: textColor, font: { family: 'Cairo' } }, grid: { color: gridColor } },
                    y: { ticks: { color: textColor, stepSize: 1, font: { family: 'Cairo' } }, grid: { color: gridColor }, beginAtZero: true }
                }
            }
        });
    }

    const available   = products.filter(p => p.isAvailable !== false).length;
    const unavailable = products.length - available;
    const avCanvas = document.getElementById('availabilityChart');
    if (avCanvas) {
        if (availabilityChartInstance) availabilityChartInstance.destroy();
        availabilityChartInstance = new Chart(avCanvas, {
            type: 'doughnut',
            data: {
                labels: ['متوفر', 'غير متوفر'],
                datasets: [{
                    data: [available, unavailable],
                    backgroundColor: ['#22c55e', '#ef4444'],
                    borderColor: isDark ? '#111827' : '#ffffff',
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.raw} منتج (${products.length ? Math.round(ctx.raw / products.length * 100) : 0}%)`
                        }
                    }
                }
            }
        });
    }

    // Re-render on theme toggle to update colors
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.addEventListener('click', () => setTimeout(() => renderCharts(products), 350), { once: true });
    });
}

// =============================================
// MOST VIEWED TABLE
// =============================================
function renderMostViewedTable(products) {
    const tbody = document.getElementById('most-viewed-table-body');
    if (!tbody) return;

    if (!products.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-4 text-muted">لا يوجد منتجات لعرضها حالياً.</td></tr>`;
        return;
    }

    const medals = ['🥇','🥈','🥉'];
    tbody.innerHTML = products.map((p, i) => {
        const price = parseFloat(p.originalPrice || 0);
        const disc  = parseFloat(p.discountPercentage || 0);
        const final = disc > 0 ? (price - price * disc / 100).toFixed(2) : price;
        const views = p.views || 0;
        const desktopRow = `
        <tr class="d-none d-md-table-row">
            <td class="fw-bold" style="font-size:1.1rem;">${medals[i] || (i + 1)}</td>
            <td><img src="${p.image || 'https://via.placeholder.com/50'}" alt="${p.name}" class="rounded shadow-sm" style="width:44px;height:44px;object-fit:cover;border:1px solid var(--border-color);"></td>
            <td class="fw-bold">${p.name}</td>
            <td><span class="badge bg-dark border border-secondary text-muted">${p.category || 'عام'}</span></td>
            <td>
                <span class="badge rounded-pill px-3 py-2" style="background:rgba(167,139,250,0.15);color:#a78bfa;">
                    <i class='bx bx-show'></i> ${views.toLocaleString('ar-EG')}
                </span>
            </td>
            <td class="fw-bold text-primary">${final} <small>ج.م</small></td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-edit-product" data-id="${p.id}">
                    <i class='bx bx-edit'></i> تعديل
                </button>
            </td>
        </tr>`;

        const mobileCard = `
        <tr class="d-md-none mobile-card-row">
            <td colspan="7" style="padding: 0; border: none; background: transparent;">
                <div class="product-mobile-card">
                    <div class="pmc-header">
                        <span class="pmc-rank">${medals[i] || '#' + (i + 1)}</span>
                        <img src="${p.image || 'https://via.placeholder.com/50'}" alt="${p.name}" class="pmc-img">
                        <div class="pmc-title">
                            <span class="pmc-name">${p.name}</span>
                            <span class="pmc-category">${p.category || 'عام'}</span>
                        </div>
                    </div>
                    <div class="pmc-body">
                        <div class="pmc-stat">
                            <span class="pmc-stat-label">السعر</span>
                            <span class="pmc-stat-value price">${final} ج.م</span>
                        </div>
                        <div class="pmc-stat">
                            <span class="pmc-stat-label">المشاهدات</span>
                            <span class="pmc-stat-value views">${views.toLocaleString('ar-EG')}</span>
                        </div>
                    </div>
                    <div class="pmc-footer">
                        <button class="pmc-btn edit btn-edit-product" data-id="${p.id}"><i class='bx bx-edit-alt'></i> تعديل</button>
                    </div>
                </div>
            </td>
        </tr>`;

        return desktopRow + mobileCard;
    }).join('');
}
async function renderActivityLog() {
    const tableBody = document.getElementById('activity-log-table-body');
    if (!tableBody) return;

    try {
        const logs = await getRecentLogs(10);
        if (logs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">لا يوجد نشاط مسجل بعد</td></tr>';
            return;
        }

        tableBody.innerHTML = logs.map(log => {
            const date = log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString('ar-EG') : '...';
            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white" style="width: 25px; height: 25px; font-size: 0.7rem;">${log.adminEmail ? log.adminEmail[0].toUpperCase() : 'A'}</div>
                            <span class="font-sm">${log.adminEmail || 'Unknown'}</span>
                        </div>
                    </td>
                    <td><span class="badge bg-info-subtle text-info font-sm">${log.action}</span></td>
                    <td class="text-muted font-sm">${log.details}</td>
                    <td class="text-muted font-sm" dir="ltr">${date}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Error rendering logs:", error);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">خطأ في تحميل السجل</td></tr>';
    }
}

// Global scope check for Editor
function isUserEditor() {
    return currentUserProfile && currentUserProfile.role === 'editor';
}
