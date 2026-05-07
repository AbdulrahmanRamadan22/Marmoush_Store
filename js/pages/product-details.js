// /js/pages/product-details.js
import { getProductById, deleteProduct, updateProduct } from '../api/products.js';
import { showToast } from '../ui/renderProducts.js';
import { db } from '../firebase.js';
import { doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ─── State ───────────────────────────────────────────────────────────────────
let currentProduct = null;
const editModal = () => bootstrap.Modal.getOrCreateInstance(document.getElementById('editProductModal'));
const deleteModal = () => bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal'));

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const productId = new URLSearchParams(window.location.search).get('id');
    if (!productId) return showError("لم يتم العثور على معرف المنتج");

    // Silent view counter increment
    updateDoc(doc(db, 'products', productId), { views: increment(1) }).catch(() => {});

    try {
        currentProduct = await getProductById(productId);
        if (!currentProduct) return showError("المنتج غير موجود في قاعدة البيانات");
        renderProductDetails(currentProduct);
        setupGlobalListeners();
    } catch (err) {
        console.error(err);
        showError("حدث خطأ أثناء تحميل بيانات المنتج");
    }
});

// ─── Render ───────────────────────────────────────────────────────────────────
function renderProductDetails(product) {
    const container = document.getElementById('product-details-content');
    const isAvailable = product.isAvailable !== false;
    const originalPrice = parseFloat(product.originalPrice || 0);
    const discount = parseFloat(product.discountPercentage || 0);
    const hasDiscount = discount > 0;
    const finalPrice = hasDiscount
        ? (originalPrice - originalPrice * discount / 100).toFixed(2)
        : originalPrice.toFixed(2);

    // ── Gallery HTML ──
    const allImages = [product.image, ...(product.gallery || [])].filter(Boolean);
    let galleryHtml;
    if (allImages.length > 1) {
        const indicators = allImages.map((_, i) =>
            `<button type="button" data-bs-target="#pdCarousel" data-bs-slide-to="${i}" ${i === 0 ? 'class="active"' : ''}></button>`
        ).join('');
        const items = allImages.map((img, i) => `
            <div class="carousel-item ${i === 0 ? 'active' : ''}">
                <img src="${img}" alt="صورة ${i + 1}">
            </div>`
        ).join('');
        galleryHtml = `
            <div id="pdCarousel" class="carousel slide pd-carousel" data-bs-ride="carousel">
                <div class="carousel-indicators">${indicators}</div>
                <div class="carousel-inner">${items}</div>
                <button class="carousel-control-prev" type="button" data-bs-target="#pdCarousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon"></span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#pdCarousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon"></span>
                </button>
            </div>`;
    } else {
        galleryHtml = `<img src="${product.image || '../assets/placeholder.png'}" class="pd-main-img" alt="${product.name}">`;
    }

    // ── Pills ──
    const sizes = (product.sizes || []).map(s => `<span class="size-pill">${s}</span>`).join('');
    const colors = (product.colors || []).map(c => `<span class="color-pill">${c}</span>`).join('');

    container.innerHTML = `
        <div class="pd-glass-card">
            <div class="row g-0">
                <!-- Image Panel -->
                <div class="col-lg-5">
                    <div class="pd-image-panel">
                        <div class="pd-status-badge">
                            <span class="pulse ${isAvailable ? 'green' : 'red'}"></span>
                            <span>${isAvailable ? 'متوفر بالمخزن' : 'غير متوفر'}</span>
                        </div>
                        ${galleryHtml}
                    </div>
                </div>

                <!-- Info Panel -->
                <div class="col-lg-7">
                    <div class="pd-info-panel">

                        <!-- Category -->
                        <span class="pd-category-tag">
                            <i class='bx bx-purchase-tag-alt'></i>
                            ${product.category || 'عام'}
                        </span>

                        <!-- Title -->
                        <h1 class="pd-title">${product.name}</h1>

                        <!-- Price -->
                        <div class="pd-price-box">
                            <span class="pd-price">${finalPrice} <small style="font-size:1rem;font-weight:600;">ج.م</small></span>
                            ${hasDiscount ? `
                                <span class="pd-old-price">${originalPrice} ج.م</span>
                                <span class="pd-discount-badge">خصم ${discount}%</span>
                            ` : ''}
                        </div>

                        <!-- Sizes -->
                        ${sizes ? `
                        <div>
                            <div class="pd-section-label"><i class='bx bx-ruler'></i> المقاسات</div>
                            <div class="pill-wrap">${sizes}</div>
                        </div>` : ''}

                        <!-- Colors -->
                        ${colors ? `
                        <div>
                            <div class="pd-section-label"><i class='bx bx-palette'></i> الألوان</div>
                            <div class="pill-wrap">${colors}</div>
                        </div>` : ''}

                        <!-- Description -->
                        <div>
                            <div class="pd-section-label"><i class='bx bx-align-right'></i> وصف المنتج</div>
                            <div class="pd-desc">${product.description ? product.description.replace(/\n/g, '<br>') : 'لا يوجد وصف متاح.'}</div>
                        </div>

                        <!-- Stats -->
                        <div class="pd-stats">
                            <div class="pd-stat">
                                <span class="s-label">تاريخ الإضافة</span>
                                <span class="s-value">${product.createdAt ? new Date(product.createdAt).toLocaleDateString('ar-EG') : '-'}</span>
                            </div>
                            <div class="pd-stat">
                                <span class="s-label">المشاهدات</span>
                                <span class="s-value">${(product.views || 0).toLocaleString('ar-EG')} 👁</span>
                            </div>
                            <div class="pd-stat">
                                <span class="s-label">حالة العرض</span>
                                <span class="s-value ${isAvailable ? 'text-success' : 'text-danger'}">${isAvailable ? 'نشط ✓' : 'متوقف ✗'}</span>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="pd-actions">
                            <button class="btn-pd-edit" id="btn-open-edit-inline">
                                <i class='bx bx-edit-alt fs-5'></i> تعديل البيانات
                            </button>
                            <button class="btn-pd-delete" id="btn-open-delete">
                                <i class='bx bx-trash fs-5'></i>
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    `;

    // Bind inline buttons after render
    document.getElementById('btn-open-edit-inline')?.addEventListener('click', openEditModal);
    document.getElementById('btn-open-delete')?.addEventListener('click', openDeleteModal);
}

// ─── Global Listeners (for static header buttons) ─────────────────────────────
function setupGlobalListeners() {
    // Header edit button (desktop)
    document.getElementById('btn-open-edit')?.addEventListener('click', openEditModal);

    // Edit form submit
    document.getElementById('edit-product-form').addEventListener('submit', handleEditSubmit);

    // Delete confirm button
    document.getElementById('confirm-delete-btn').addEventListener('click', handleConfirmDelete);
}

// ─── Open Edit Modal ──────────────────────────────────────────────────────────
function openEditModal() {
    if (!currentProduct) return;

    document.getElementById('edit-product-id').value          = currentProduct.id;
    document.getElementById('edit-product-name').value        = currentProduct.name || '';
    document.getElementById('edit-product-category').value    = currentProduct.category || '';
    document.getElementById('edit-product-price').value       = currentProduct.originalPrice || '';
    document.getElementById('edit-product-discount').value    = currentProduct.discountPercentage || '';
    document.getElementById('edit-product-colors').value      = (currentProduct.colors || []).join(', ');
    document.getElementById('edit-product-sizes').value       = (currentProduct.sizes || []).join(', ');
    document.getElementById('edit-product-image').value       = currentProduct.image || '';
    document.getElementById('edit-product-description').value = currentProduct.description || '';
    document.getElementById('edit-product-availability').checked = currentProduct.isAvailable !== false;

    editModal().show();
}

// ─── Handle Edit Submit ───────────────────────────────────────────────────────
async function handleEditSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('edit-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>جاري الحفظ...';

    const sizesRaw = document.getElementById('edit-product-sizes').value;
    const colorsRaw = document.getElementById('edit-product-colors').value;

    const updatedData = {
        name:               document.getElementById('edit-product-name').value.trim(),
        category:           document.getElementById('edit-product-category').value.trim(),
        originalPrice:      parseFloat(document.getElementById('edit-product-price').value) || 0,
        discountPercentage: parseFloat(document.getElementById('edit-product-discount').value) || 0,
        image:              document.getElementById('edit-product-image').value.trim(),
        description:        document.getElementById('edit-product-description').value.trim(),
        isAvailable:        document.getElementById('edit-product-availability').checked,
        sizes:  sizesRaw  ? sizesRaw.split(',').map(s => s.trim()).filter(Boolean)  : [],
        colors: colorsRaw ? colorsRaw.split(',').map(c => c.trim()).filter(Boolean) : [],
        updatedAt: new Date().toISOString()
    };

    try {
        await updateProduct(currentProduct.id, updatedData);
        showToast("✅ تم تحديث بيانات المنتج بنجاح");
        editModal().hide();
        // Refresh data and re-render
        currentProduct = await getProductById(currentProduct.id);
        renderProductDetails(currentProduct);
        // Re-bind inline buttons
        document.getElementById('btn-open-edit-inline')?.addEventListener('click', openEditModal);
        document.getElementById('btn-open-delete')?.addEventListener('click', openDeleteModal);
    } catch (err) {
        console.error(err);
        showToast("❌ فشل التحديث، حاول مرة أخرى");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bx bx-save me-1"></i> حفظ التغييرات';
    }
}

// ─── Open Delete Modal ────────────────────────────────────────────────────────
function openDeleteModal() {
    deleteModal().show();
}

// ─── Handle Confirm Delete ────────────────────────────────────────────────────
async function handleConfirmDelete() {
    const btn = document.getElementById('confirm-delete-btn');
    btn.disabled = true;
    btn.innerText = 'جاري الحذف...';
    try {
        await deleteProduct(currentProduct.id);
        deleteModal().hide();
        showToast("تم أرشفة المنتج بنجاح");
        setTimeout(() => window.location.href = 'products.html', 1200);
    } catch (err) {
        console.error(err);
        showToast("❌ فشل الحذف، حاول مرة أخرى");
        btn.disabled = false;
        btn.innerText = 'حذف';
    }
}

// ─── Error View ───────────────────────────────────────────────────────────────
function showError(message) {
    document.getElementById('product-details-content').innerHTML = `
        <div class="text-center py-5">
            <i class='bx bx-error-circle text-danger' style="font-size:4rem;"></i>
            <h4 class="mt-3">${message}</h4>
            <a href="products.html" class="btn btn-primary mt-3 px-4 rounded-3">العودة للمنتجات</a>
        </div>`;
}
