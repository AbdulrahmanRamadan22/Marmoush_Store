// /js/pages/product-details.js
import { getProductById, deleteProduct, updateProduct } from '../api/products.js';
import { showToast } from '../ui/renderProducts.js';
import { db } from '../firebase.js';
import { doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showError("لم يتم العثور على معرف المنتج");
        return;
    }

    try {
        // Increment views counter silently
        await updateDoc(doc(db, 'products', productId), { views: increment(1) })
            .catch(() => {}); // Silent fail — don't block if field doesn't exist

        const product = await getProductById(productId);
        if (!product) {
            showError("المنتج غير موجود في قاعدة البيانات");
            return;
        }

        renderProductDetails(product);
    } catch (error) {
        console.error(error);
        showError("حدث خطأ أثناء تحميل بيانات المنتج");
    }
});

function renderProductDetails(product) {
    const container = document.getElementById('product-details-content');
    
    // Pricing logic
    const originalPrice = parseFloat(product.originalPrice || 0);
    const discountPercentage = parseFloat(product.discountPercentage || 0);
    const hasDiscount = discountPercentage > 0;
    const finalPrice = hasDiscount 
        ? (originalPrice - (originalPrice * (discountPercentage / 100))).toFixed(2) 
        : originalPrice;

    const isAvailable = product.isAvailable !== false;

    // --- 1. Gallery Carousel Logic ---
    const allImages = [product.image].concat(product.gallery || []).filter(url => url);
    let galleryHtml = '';
    
    if (allImages.length > 1) {
        let indicators = '';
        let innerItems = '';
        allImages.forEach((img, index) => {
            indicators += `<button type="button" data-bs-target="#productGallery" data-bs-slide-to="${index}" class="${index === 0 ? 'active' : ''}"></button>`;
            innerItems += `
                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                    <img src="${img}" class="d-block w-100 product-main-img shadow-lg" alt="Product Image" style="object-fit: cover; aspect-ratio: 1/1;">
                </div>
            `;
        });
        
        galleryHtml = `
            <div id="productGallery" class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-indicators">${indicators}</div>
                <div class="carousel-inner rounded-4 overflow-hidden">${innerItems}</div>
                <button class="carousel-control-prev" type="button" data-bs-target="#productGallery" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon bg-dark rounded-circle p-3" aria-hidden="true"></span>
                    <span class="visually-hidden">Previous</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#productGallery" data-bs-slide="next">
                    <span class="carousel-control-next-icon bg-dark rounded-circle p-3" aria-hidden="true"></span>
                    <span class="visually-hidden">Next</span>
                </button>
            </div>
        `;
    } else {
        // Fallback to single image
        galleryHtml = `<img src="${product.image || 'https://via.placeholder.com/600'}" alt="${product.name}" class="product-main-img shadow-lg w-100 rounded-4" style="object-fit: cover; aspect-ratio: 1/1;">`;
    }

    // --- 2. Sizes & Colors HTML ---
    let sizesHtml = '';
    if (product.sizes && product.sizes.length > 0) {
        const badges = product.sizes.map(s => `<span class="badge bg-secondary text-white px-3 py-2 fs-6 me-1">${s}</span>`).join('');
        sizesHtml = `
            <div class="mb-4">
                <h6 class="text-muted fw-bold mb-2">المقاسات المتوفرة:</h6>
                <div>${badges}</div>
            </div>
        `;
    }

    let colorsHtml = '';
    if (product.colors && product.colors.length > 0) {
        const colorBadges = product.colors.map(c => `<span class="badge border border-secondary text-primary bg-dark bg-opacity-50 px-3 py-2 fs-6 me-1">${c}</span>`).join('');
        colorsHtml = `
            <div class="mb-4">
                <h6 class="text-muted fw-bold mb-2">الألوان المتوفرة:</h6>
                <div>${colorBadges}</div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="detail-card">
            <div class="row g-4">
                <!-- Image Section -->
                <div class="col-md-5">
                    <div class="product-hero-img-wrap">
                        ${galleryHtml}
                    </div>
                </div>
                
                <!-- Info Section -->
                <div class="col-md-7">
                    <!-- Meta Strip -->
                    <div class="product-meta-strip">
                        <span class="category-badge"><i class='bx bx-category-alt me-1'></i>${product.category || 'عام'}</span>
                        <span class="status-badge ${isAvailable ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' : 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'}">
                            <i class='bx ${isAvailable ? 'bx-check-circle' : 'bx-x-circle'} me-1'></i>
                            ${isAvailable ? 'متوفر بالمخزن' : 'غير متوفر'}
                        </span>
                    </div>

                    <!-- Name -->
                    <h1 class="fw-bold mb-1 text-white fs-3">${product.name}</h1>
                    ${product.sku ? `<p class="mb-3"><span class="info-chip"><i class='bx bx-barcode'></i> SKU: ${product.sku}</span></p>` : ''}

                    <!-- Price -->
                    <div class="price-block">
                        <span class="price-tag">${finalPrice} <small style="font-size:0.95rem;font-weight:600;">ج.م</small></span>
                        ${hasDiscount ? `
                            <span class="old-price-tag">${originalPrice} ج.م</span>
                            <span class="badge bg-danger rounded-pill px-3 py-2">خصم ${discountPercentage}%</span>
                        ` : ''}
                    </div>

                    <!-- Sizes -->
                    ${product.sizes && product.sizes.length > 0 ? `
                    <div class="mb-4">
                        <p class="text-muted small fw-bold mb-2"><i class='bx bx-ruler me-1'></i>المقاسات المتوفرة</p>
                        <div class="pill-group">
                            ${product.sizes.map(s => `<span class="size-pill">${s}</span>`).join('')}
                        </div>
                    </div>` : ''}

                    <!-- Colors -->
                    ${product.colors && product.colors.length > 0 ? `
                    <div class="mb-4">
                        <p class="text-muted small fw-bold mb-2"><i class='bx bx-palette me-1'></i>الألوان المتوفرة</p>
                        <div class="pill-group">
                            ${product.colors.map(c => `<span class="color-pill">${c}</span>`).join('')}
                        </div>
                    </div>` : ''}

                    <!-- Description -->
                    <div class="mb-4">
                        <p class="text-muted small fw-bold mb-2"><i class='bx bx-file-blank me-1'></i>وصف المنتج</p>
                        <div class="desc-box">${product.description || 'لا يوجد وصف متاح لهذا المنتج.'}</div>
                    </div>

                    <!-- Desktop Action Buttons -->
                    <div class="d-flex gap-3 desktop-actions mt-4">
                        <button class="btn btn-outline-danger px-4 py-2 flex-grow-1" id="btn-delete-product">
                            <i class='bx bx-trash'></i> حذف المنتج
                        </button>
                        <button class="btn btn-primary px-4 py-2 flex-grow-1 btn-edit-product" data-id="${product.id}">
                            <i class='bx bx-edit'></i> تعديل البيانات
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-chip">
                    <span class="label">تاريخ الإضافة</span>
                    <span class="value">${product.createdAt ? new Date(product.createdAt).toLocaleDateString('ar-EG') : 'غير متوفر'}</span>
                </div>
                <div class="stat-chip">
                    <span class="label">المشاهدات</span>
                    <span class="value">${(product.views || 0).toLocaleString('ar-EG')} 👁</span>
                </div>
                <div class="stat-chip">
                    <span class="label">حالة العرض</span>
                    <span class="value ${isAvailable ? 'text-success' : 'text-danger'}">${isAvailable ? 'نشط ✓' : 'متوقف ✗'}</span>
                </div>
            </div>
        </div>

        <!-- Mobile Sticky Action Bar -->
        <div class="mobile-action-bar">
            <button class="btn btn-outline-danger" id="btn-delete-product-mobile">
                <i class='bx bx-trash'></i> حذف
            </button>
            <button class="btn btn-outline-secondary" onclick="history.back()">
                <i class='bx bx-arrow-back'></i> رجوع
            </button>
            <button class="btn btn-primary btn-edit-product" data-id="${product.id}" id="btn-edit-mobile">
                <i class='bx bx-edit'></i> تعديل
            </button>
        </div>
    `;

    // Handle Delete (desktop)
    const deleteHandler = () => {
        if (window.requestDelete) {
            window.requestDelete(async () => {
                await deleteProduct(product.id);
                showToast("تم حذف المنتج بنجاح");
                setTimeout(() => window.location.href = 'products.html', 1000);
            });
        } else {
            if (confirm("هل أنت متأكد من الحذف؟")) {
                deleteProduct(product.id).then(() => {
                    showToast("تم حذف المنتج بنجاح");
                    window.location.href = 'products.html';
                });
            }
        }
    };

    const deleteBtn = document.getElementById('btn-delete-product');
    if (deleteBtn) deleteBtn.onclick = deleteHandler;

    // Handle Delete (mobile sticky bar)
    const deleteBtnMobile = document.getElementById('btn-delete-product-mobile');
    if (deleteBtnMobile) deleteBtnMobile.onclick = deleteHandler;

    // Handle Edit from top header
    const editBtn = document.getElementById('btn-edit-current');
    if (editBtn) {
        editBtn.classList.add('btn-edit-product');
        editBtn.dataset.id = product.id;
    }
}

function showError(message) {
    const container = document.getElementById('product-details-content');
    container.innerHTML = `
        <div class="text-center py-5">
            <i class='bx bx-error-circle text-danger' style="font-size: 4rem;"></i>
            <h4 class="mt-3">${message}</h4>
            <button class="btn btn-primary mt-3" onclick="window.location.href='products.html'">العودة للمنتجات</button>
        </div>
    `;
}
