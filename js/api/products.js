import { db, storage } from '../firebase.js';
import { 
    collection, getDocs, addDoc, doc, deleteDoc, updateDoc, getDoc, 
    query, where, limit, startAfter, orderBy, getCountFromServer 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

const collectionName = "products";

/**
 * Fetch Products from Firestore with Pagination and Soft Delete support
 * @param {Object} options - { pageSize, lastDoc, includeDeleted }
 */
export async function getProducts(options = {}) {
    const { pageSize = 100, lastDoc = null, includeDeleted = false } = options;
    
    try {
        let q;
        const constraints = [orderBy("createdAt", "desc")];
        
        if (includeDeleted) {
            constraints.push(where("isDeleted", "==", true));
        }

        if (pageSize !== "all") {
            constraints.push(limit(pageSize));
        }

        if (lastDoc) {
            constraints.push(startAfter(lastDoc));
        }

        q = query(collection(db, collectionName), ...constraints);
        
        const querySnapshot = await getDocs(q);
        const productsList = [];
        
        querySnapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };
            // Support legacy data: if not includeDeleted, skip only if explicitly true
            if (!includeDeleted && data.isDeleted === true) return;
            productsList.push(data);
        });
        
        return {
            products: productsList,
            lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
        };
    } catch (error) {
        console.error("Error fetching products: ", error);
        return { products: [], lastVisible: null };
    }
}

/**
 * Get Total Products Count
 */
export async function getProductsCount(includeDeleted = false) {
    try {
        let q;
        if (includeDeleted) {
            q = query(collection(db, collectionName), where("isDeleted", "==", true));
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        } else {
            // Count all and subtract deleted if needed, or just return total for now
            // To be accurate with legacy data:
            const allSnapshot = await getCountFromServer(collection(db, collectionName));
            const deletedSnapshot = await getCountFromServer(query(collection(db, collectionName), where("isDeleted", "==", true)));
            return allSnapshot.data().count - deletedSnapshot.data().count;
        }
    } catch (error) {
        console.error("Error getting count:", error);
        return 0;
    }
}

/**
 * Fetch a single Product from Firestore by ID
 */
export async function getProductById(productId) {
    try {
        const docRef = doc(db, collectionName, productId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.log("No such product!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching product: ", error);
        throw error;
    }
}

/**
 * Add a new Product to Firestore
 */
export async function addProduct(productData) {
    try {
        const data = {
            ...productData,
            isDeleted: false,
            createdAt: productData.createdAt || new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, collectionName), data);
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
        return true;
    } catch (error) {
        console.error("Error updating product: ", error);
        throw error;
    }
}

/**
 * Soft Delete (Archive) a Product
 */
export async function deleteProduct(productId) {
    try {
        const docRef = doc(db, collectionName, productId);
        await updateDoc(docRef, { isDeleted: true, deletedAt: new Date().toISOString() });
        return true;
    } catch (error) {
        console.error("Error archiving product: ", error);
        throw error;
    }
}

/**
 * Restore an Archived Product
 */
export async function restoreProduct(productId) {
    try {
        const docRef = doc(db, collectionName, productId);
        await updateDoc(docRef, { isDeleted: false, deletedAt: null });
        return true;
    } catch (error) {
        console.error("Error restoring product: ", error);
        throw error;
    }
}

/**
 * Permanent Delete a Product
 */
export async function permanentDeleteProduct(productId) {
    try {
        await deleteDoc(doc(db, collectionName, productId));
        return true;
    } catch (error) {
        console.error("Error permanent deleting product: ", error);
        throw error;
    }
}

/**
 * Upload an image file to Firebase Storage
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
