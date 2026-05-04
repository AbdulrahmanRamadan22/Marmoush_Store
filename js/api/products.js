import { db, storage } from '../firebase.js';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

const collectionName = "products";

/**
 * Fetch all Products from Firestore
 */
export async function getProducts() {
    try {
        console.log("Fetching products from Firestore...");
        const querySnapshot = await getDocs(collection(db, collectionName));
        const productsList = [];
        
        querySnapshot.forEach((doc) => {
            productsList.push({ id: doc.id, ...doc.data() });
        });
        
        return productsList;
    } catch (error) {
        console.error("Error fetching products: ", error);
        return [];
    }
}

/**
 * Add a new Product to Firestore
 */
export async function addProduct(productData) {
    try {
        console.log("Adding Product to Firestore...", productData);
        const docRef = await addDoc(collection(db, collectionName), productData);
        console.log("Document written with ID: ", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding product: ", error);
        throw error;
    }
}

/**
 * Update an existing Product in Firestore
 */
export async function updateProduct(productId, productData) {
    try {
        const docRef = doc(db, collectionName, productId);
        await updateDoc(docRef, productData);
        console.log("Product updated successfully");
        return true;
    } catch (error) {
        console.error("Error updating product: ", error);
        throw error;
    }
}

/**
 * Delete a Product from Firestore by ID
 */
export async function deleteProduct(productId) {
    try {
        await deleteDoc(doc(db, collectionName, productId));
        console.log("Product deleted successfully");
        return true;
    } catch (error) {
        console.error("Error deleting product: ", error);
        throw error;
    }
}

/**
 * Upload an image file to Firebase Storage
 * @param {File} file 
 * @returns {Promise<string>} Download URL
 */
export async function uploadProductImage(file) {
    try {
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `products/${fileName}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image: ", error);
        throw error;
    }
}
