// /js/pages/product.js
// Page controller for Product

import { getProducts } from '../api/products.js';
import { renderProducts } from '../ui/renderProducts.js';
// Add other imports as needed

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Product page initialized');
    
    const contentArea = document.getElementById('content-area');
    
    // Mock page load sequence
    try {
        const data = await getProducts();
        renderProducts(data, contentArea);
    } catch (error) {
        console.error("Error loading Product page:", error);
    }
});
