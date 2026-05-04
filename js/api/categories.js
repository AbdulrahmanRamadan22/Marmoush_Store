import { db } from '../firebase.js';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const collectionName = "categories";

/**
 * Fetch all Categories from Firestore
 */
export async function getCategories() {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const categoriesList = [];
        querySnapshot.forEach((doc) => {
            categoriesList.push({ id: doc.id, ...doc.data() });
        });
        return categoriesList;
    } catch (error) {
        console.error("Error fetching categories: ", error);
        return [];
    }
}

/**
 * Add a new Category
 */
export async function addCategory(categoryData) {
    try {
        const docRef = await addDoc(collection(db, collectionName), categoryData);
        return docRef.id;
    } catch (error) {
        console.error("Error adding category: ", error);
        throw error;
    }
}

/**
 * Update an existing Category
 */
export async function updateCategory(categoryId, categoryData) {
    try {
        const docRef = doc(db, collectionName, categoryId);
        await updateDoc(docRef, categoryData);
        return true;
    } catch (error) {
        console.error("Error updating category: ", error);
        throw error;
    }
}

/**
 * Delete a Category
 */
export async function deleteCategory(categoryId) {
    try {
        await deleteDoc(doc(db, collectionName, categoryId));
        return true;
    } catch (error) {
        console.error("Error deleting category: ", error);
        throw error;
    }
}
/**
 * Check if a category name already exists
 * @param {string} name 
 * @returns {Promise<boolean>}
 */
export async function checkCategoryExists(name) {
    try {
        const q = query(collection(db, collectionName), where("name", "==", name));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Error checking category existence: ", error);
        return false;
    }
}
