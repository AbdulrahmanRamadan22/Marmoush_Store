// /js/pages/product.js
// Page controller for Premium Product Details

import { getProductById } from '../api/products.js';

let currentProduct = null;
let selectedColor = null;
let selectedSize = null;
let quantity = 1;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get Product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showError("لم يتم العثور على المنتج. يرجى التأكد من الرابط.");
        return;
    }

    try {
        // 2. Fetch Product Data
        currentProduct = await getProductById(productId);
        
        if (!currentProduct) {
            showError("هذا المنتج غير موجود أو تم حذفه.");
            return;
        }

        // 3. Render Product Data
        renderProductDetails(currentProduct);
        setupEventListeners();
        setupMobileStickyCart();

    } catch (error) {
        console.error("Error loading product details:", error);
        showError("حدث خطأ أثناء تحميل بيانات المنتج. يرجى المحاولة لاحقاً.");
    }
});

/**
 * Render the product data into the DOM
 */
function renderProductDetails(product) {
    // Hide loading, show content
    document.getElementById('product-loading').classList.add('d-none');
    document.getElementById('product-content').classList.remove('d-none');

    // Breadcrumb
    document.getElementById('breadcrumb-product-name').innerText = product.name || 'تفاصيل المنتج';

    // Basic Info
    document.getElementById('product-title').innerText = product.name || 'بدون اسم';
    document.getElementById('product-category-badge').innerText = product.category || 'عام';
    document.getElementById('product-description').innerHTML = product.description ? product.description.replace(/\n/g, '<br>') : 'لا يوجد وصف متاح لهذا المنتج.';

    // Pricing
    const priceEl = document.getElementById('product-price');
    const oldPriceEl = document.getElementById('product-old-price');
    const stickyPriceEl = document.querySelector('.m-price-sticky');
    
    priceEl.innerText = `${product.price} ج.م`;
    if(stickyPriceEl) stickyPriceEl.innerText = `${product.price} ج.م`;

    if (product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price) {
        priceEl.innerText = `${product.discountPrice} ج.م`;
        if(stickyPriceEl) stickyPriceEl.innerText = `${product.discountPrice} ج.م`;
        oldPriceEl.innerText = `${product.price} ج.م`;
        oldPriceEl.classList.remove('d-none');
        
        // Add Discount Badge
        const discountPercent = Math.round(((product.price - product.discountPrice) / product.price) * 100);
        document.getElementById('product-badge-container').innerHTML = `
            <span class="position-absolute top-0 end-0 m-3 badge bg-danger fs-6 px-3 py-2 shadow">خصم ${discountPercent}%</span>
        `;
    }

    // Images Gallery
    const mainImgEl = document.getElementById('main-product-image');
    mainImgEl.src = product.mainImage || 'assets/placeholder.png';

    const thumbnailsContainer = document.getElementById('product-thumbnails');
    thumbnailsContainer.innerHTML = ''; // Clear

    // Gather all images (Main + Additional)
    let allImages = [];
    if (product.mainImage) allImages.push(product.mainImage);
    if (product.images && Array.isArray(product.images)) {
        allImages = [...allImages, ...product.images];
    }
    
    // Remove duplicates
    allImages = [...new Set(allImages)];

    if (allImages.length > 0) {
        allImages.forEach((imgSrc, index) => {
            const imgEl = document.createElement('img');
            imgEl.src = imgSrc;
            imgEl.className = `thumbnail-img shadow-sm flex-shrink-0 ${index === 0 ? 'active' : ''}`;
            imgEl.alt = `Thumbnail ${index + 1}`;
            
            imgEl.addEventListener('click', () => {
                // Update Main Image
                mainImgEl.style.opacity = '0.5';
                setTimeout(() => {
                    mainImgEl.src = imgSrc;
                    mainImgEl.style.opacity = '1';
                }, 150);
                
                // Update active state
                document.querySelectorAll('.thumbnail-img').forEach(el => el.classList.remove('active'));
                imgEl.classList.add('active');
            });

            thumbnailsContainer.appendChild(imgEl);
        });
    } else {
        thumbnailsContainer.classList.add('d-none');
    }

    // Colors
    const colorsContainer = document.getElementById('product-colors');
    colorsContainer.innerHTML = '';
    if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
        product.colors.forEach((color, index) => {
            // Support both object {name, code} and simple string arrays
            const colorCode = typeof color === 'object' ? color.code : color;
            const colorName = typeof color === 'object' ? color.name : color;
            
            const wrapper = document.createElement('label');
            wrapper.className = 'color-swatch-wrapper';
            wrapper.title = colorName;
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'product_color';
            input.value = colorName;
            if (index === 0) {
                input.checked = true;
                selectedColor = colorName;
                document.getElementById('selected-color-name').innerText = colorName;
            }
            
            input.addEventListener('change', (e) => {
                if(e.target.checked) {
                    selectedColor = e.target.value;
                    document.getElementById('selected-color-name').innerText = selectedColor;
                }
            });

            const span = document.createElement('span');
            span.className = 'color-swatch shadow-sm';
            // Simple validation if it's a hex code
            span.style.backgroundColor = colorCode.startsWith('#') || colorCode.match(/^[a-zA-Z]+$/) ? colorCode : '#cccccc';

            wrapper.appendChild(input);
            wrapper.appendChild(span);
            colorsContainer.appendChild(wrapper);
        });
    } else {
        document.getElementById('color-selection-container').classList.add('d-none');
    }

    // Sizes
    const sizesContainer = document.getElementById('product-sizes');
    sizesContainer.innerHTML = '';
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        product.sizes.forEach((size, index) => {
            const wrapper = document.createElement('label');
            wrapper.className = 'size-selector-wrapper';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'product_size';
            input.value = size;
            if (index === 0) {
                input.checked = true;
                selectedSize = size;
            }
            
            input.addEventListener('change', (e) => {
                if(e.target.checked) selectedSize = e.target.value;
            });

            const span = document.createElement('span');
            span.className = 'size-selector';
            span.innerText = size;

            wrapper.appendChild(input);
            wrapper.appendChild(span);
            sizesContainer.appendChild(wrapper);
        });
    } else {
        document.getElementById('size-selection-container').classList.add('d-none');
    }

    // Stock
    if (product.stock !== undefined) {
        if (product.stock <= 0) {
            disableAddToCart("نفذت الكمية");
        } else if (product.stock <= 5) {
            const alertEl = document.getElementById('product-stock-alert');
            alertEl.classList.remove('d-none');
            document.getElementById('stock-count').innerText = product.stock;
            alertEl.classList.add('text-danger');
        }
    }
}

/**
 * Setup static event listeners
 */
function setupEventListeners() {
    const qtyInput = document.getElementById('product-quantity');
    const btnInc = document.getElementById('btn-increase-qty');
    const btnDec = document.getElementById('btn-decrease-qty');

    btnInc.addEventListener('click', () => {
        let max = currentProduct.stock || 10;
        if (quantity < max) {
            quantity++;
            qtyInput.value = quantity;
        }
    });

    btnDec.addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            qtyInput.value = quantity;
        }
    });

    // Add to Cart Buttons
    const btnAddDesktop = document.getElementById('btn-add-to-cart');
    const btnAddMobile = document.getElementById('btn-add-to-cart-mobile');

    const handleAddToCart = () => {
        if (!currentProduct) return;
        
        // Basic Cart Logic (To be expanded in future)
        const cartItem = {
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.discountPrice || currentProduct.price,
            image: currentProduct.mainImage,
            color: selectedColor,
            size: selectedSize,
            quantity: quantity
        };

        console.log("Added to cart:", cartItem);
        
        // Visual Feedback
        const originalText = btnAddDesktop.innerHTML;
        btnAddDesktop.innerHTML = `<i class='bx bx-check-double fs-4'></i> تمت الإضافة!`;
        btnAddDesktop.classList.replace('btn-primary', 'btn-success');
        
        if(btnAddMobile) {
            btnAddMobile.innerHTML = `<i class='bx bx-check-double'></i> تمت الإضافة!`;
            btnAddMobile.classList.replace('btn-primary', 'btn-success');
        }

        setTimeout(() => {
            btnAddDesktop.innerHTML = originalText;
            btnAddDesktop.classList.replace('btn-success', 'btn-primary');
            if(btnAddMobile) {
                btnAddMobile.innerHTML = `<i class='bx bx-shopping-bag'></i> إضافة للسلة`;
                btnAddMobile.classList.replace('btn-success', 'btn-primary');
            }
        }, 2000);
    };

    if(btnAddDesktop) btnAddDesktop.addEventListener('click', handleAddToCart);
    if(btnAddMobile) btnAddMobile.addEventListener('click', handleAddToCart);
}

/**
 * Handle mobile sticky cart visibility on scroll
 */
function setupMobileStickyCart() {
    const stickyBar = document.querySelector('.mobile-sticky-cart');
    if (!stickyBar) return;

    window.addEventListener('scroll', () => {
        // Show after scrolling past 300px
        if (window.scrollY > 300) {
            stickyBar.style.transform = 'translateY(0)';
        } else {
            stickyBar.style.transform = 'translateY(100%)';
        }
    });
}

function showError(message) {
    document.getElementById('product-loading').classList.add('d-none');
    document.getElementById('product-content').classList.remove('d-none');
    document.getElementById('product-content').innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="text-danger mb-3" style="font-size: 5rem;">
                <i class='bx bx-error-circle'></i>
            </div>
            <h3 class="text-white fw-bold mb-3">عذراً!</h3>
            <p class="text-muted fs-5">${message}</p>
            <a href="products.html" class="btn btn-primary px-4 py-2 rounded-pill mt-4">عودة لتصفح المنتجات</a>
        </div>
    `;
}

function disableAddToCart(reason) {
    const btnDesktop = document.getElementById('btn-add-to-cart');
    const btnMobile = document.getElementById('btn-add-to-cart-mobile');
    
    if(btnDesktop) {
        btnDesktop.disabled = true;
        btnDesktop.innerHTML = `<i class='bx bx-block fs-4'></i> ${reason}`;
        btnDesktop.classList.replace('btn-primary', 'btn-secondary');
    }
    
    if(btnMobile) {
        btnMobile.disabled = true;
        btnMobile.innerHTML = `<i class='bx bx-block'></i> ${reason}`;
        btnMobile.classList.replace('btn-primary', 'btn-secondary');
    }
}
