# agents.md

## Project Overview

Marmoush Store is a sportswear e-commerce web application with two main parts: a public client-facing website and an admin dashboard.
The client displays products, categories, and banners dynamically, while the dashboard allows full CRUD management using Firebase.

---

## Architecture

### Structure

* Client (Public Website)
* Dashboard (Admin Panel)
* Shared Firebase Layer

### Folder Structure

/project-root
│
├── index.html
├── product.html
├── category.html
│
├── dashboard/
│ ├── index.html
│ ├── products.html
│ ├── categories.html
│ ├── banners.html
│ ├── settings.html
│
├── css/
├── js/
│ ├── firebase.js
│ ├── api/
│ │ ├── products.js
│ │ ├── categories.js
│ │ ├── banners.js
│ │ ├── settings.js
│ │
│ ├── ui/
│ │ ├── renderProducts.js
│ │ ├── renderCategories.js
│ │ ├── renderBanners.js
│ │
│ ├── pages/
│ │ ├── home.js
│ │ ├── product.js
│ │ ├── category.js
│ │ ├── dashboard.js
│
├── assets/

---

## Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript (ES6+)
* Bootstrap 5

### Backend (BaaS)

* Firebase Firestore (Database)
* Firebase Storage (Images)
* Firebase Authentication (Admin Login)

---

## Conventions

### Naming

* Files: kebab-case (example: render-products.js)
* Variables: camelCase (example: productList)
* Constants: UPPER\_CASE

### Code Style

* Use async/await instead of then()
* Separate API logic from UI rendering
* Each feature must have:
  * API file
  * UI renderer
  * Page controller

### HTML

* Use semantic elements
* Add alt attributes to images
* Use RTL support for Arabic layout

---

## Do

* Follow the existing folder structure strictly
* Separate logic into api / ui / pages
* Always use async/await with Firebase
* Validate inputs before sending data
* Use reusable UI components (cards, tables, modals)
* Make all pages responsive using Bootstrap
* Store only necessary data in Firestore
* Use dynamic rendering instead of hardcoded HTML
* Keep dashboard and client logic separated
* Use clean and readable code

---

## Don't

* Don't write all code in one file
* Don't hardcode products or data
* Don't mix UI logic with Firebase calls
* Don't reload the page after every action
* Don't expose Firebase config in unsafe way
* Don't use inline CSS unless necessary
* Don't duplicate logic between dashboard and client
* Don't use global variables unnecessarily
* Don't skip error handling
* Don't leave unused code

---

## Do / Don’t Examples

### Do

* Follow modular structure (api / ui / pages)
* Add file path comment at top of every code block
* Use async functions for all Firebase operations
* Use reusable components for UI
* Keep functions small and focused

---

### Don’t

* Don't add new libraries without approval
* Don't manipulate DOM randomly — use structured rendering
* Don't use alert() for production UI
* Don't fetch all data repeatedly without need
* Don't store unnecessary duplicated data in Firebase

---

## Notes

* Banner system must support:
  * type (category / product / external)
  * value (slug or link)
  * active state
* Links should be generated dynamically, not stored as raw URLs
* Project should be optimized for:
  * performance
  * SEO basics
  * mobile responsiveness

---

## Design & UI Rules

* Theme: Strictly follow the premium Dark Mode theme colors provided in reference screenshots (Navy/Dark Blue backgrounds, vibrant accents).
* Language: The entire website (Client and Dashboard) MUST be in Arabic language (RTL).
* Responsiveness: All pages and components MUST be 100% mobile responsive using Bootstrap 5 grid and utilities.
* Typography & Colors: DO NOT use dull or faded gray colors (like standard muted text). Use a bright, premium gray (e.g., #cbd5e1) for secondary text and white for primary text to maintain high contrast against the dark background.

---

## Future Improvements

* Add pagination for products
* Add search functionality
* Add caching layer
* Convert to SPA or React in future if needed
