# Software Workflow & Testing Guide

This guide provides a step-by-step workflow for a layman to test all features of the application, from the public storefront to the admin dashboard.

**Prerequisites:**
- Application is running on `https://apexdashboard-eta.vercel.app` (Dashboard) and `[YOUR_STOREFRONT_URL]` (Storefront).
- You have the credentials from `STORE_CREDENTIALS_AND_URLS.md`.

---

## Phase 1: The Customer Experience (Public Storefront)

**Goal:** Simulate a real customer browsing and buying products.

1.  **Visit the Storefront:**
    -   Go to `[YOUR_STOREFRONT_URL]` (or `http://localhost:5174` locally).
    -   *What to check:* You should see the Home page with a Hero section and Featured Products.

2.  **Browse Products:**
    -   Click on "Shop" or scroll down to products.
    -   Use the search bar to find a product (e.g., "Headphones").
    -   Filter by category (e.g., "Electronics").
    -   *What to check:* The product list updates based on your search and filters.

3.  **View Product Details:**
    -   Click on any product card.
    -   *What to check:* You see the product image, description, price, and "Add to Cart" button.

4.  **Add to Cart:**
    -   Click "Add to Cart".
    -   *What to check:* A notification confirms the addition, and the cart icon shows the item count.

5.  **Checkout:**
    -   Click the Cart icon in the top right.
    -   Review your items.
    -   Click "Checkout".
    -   Fill in the form:
        -   **Name:** John Doe
        -   **Email:** john@example.com
        -   **Address:** 123 Main St
    -   Click "Place Order".
    -   *What to check:* You see an "Order Success" page with an Order ID. **Copy this Order ID.**

---

## Phase 2: The Admin Experience (Dashboard)

**Goal:** Process the order you just placed and manage the store.

6.  **Login as Admin:**
    -   Go to `https://apexdashboard-eta.vercel.app/login` (or `http://localhost:5173/login`).
    -   **Email:** `admin@techhub.pk`
    -   **Password:** `admin123`
    -   Click "Sign In".
    -   *What to check:* You are redirected to the Dashboard Home.

7.  **Verify Dashboard Stats:**
    -   Look at the "Pending Orders" card.
    -   *What to check:* The count should have increased by 1 (from your test order).

8.  **Process the Order:**
    -   Click "Orders" in the left sidebar.
    -   Find the order with the Order ID you copied (or look for "John Doe").
    -   Click on the order row to view details.
    -   Change Status from "Pending" to "Processing", then "Shipped", then "Delivered".
    -   *What to check:* The status updates instantly, and the timeline logs each change.

9.  **Manage Products:**
    -   Click "Products" in the sidebar.
    -   Click "Add Product".
    -   Fill in details:
        -   **Name:** Test Gadget
        -   **Price:** 5000
        -   **Stock:** 10
        -   **Category:** Electronics
    -   Click "Save".
    -   *What to check:* The new product appears in the list.

10. **Check Inventory Alerts:**
    -   Go to "Inventory Alerts".
    -   *What to check:* If you set stock low (e.g., 2), the product appears here.

11. **Manage Customers:**
    -   Click "Customers".
    -   Search for "John Doe".
    -   Click on his name.
    -   *What to check:* You see his profile and the order he just placed.

12. **Process a Return (Optional):**
    -   Go to "Returns".
    -   Click "Create Return".
    -   Select the order you placed.
    -   Select the item and reason.
    -   Click "Submit".
    -   *What to check:* A new return request is created.

---

## Phase 3: The Superadmin Experience (Global Management)

**Goal:** Manage multiple stores and system-wide settings.

13. **Login as Superadmin:**
    -   Logout from the Admin account.
    -   Login with:
        -   **Email:** `superadmin@shopifyadmin.pk`
        -   **Password:** `superadmin123`

14. **View All Stores:**
    -   Click "All Stores" in the sidebar.
    -   *What to check:* You see a list of all client stores (TechHub, Fashion Forward, etc.).

15. **Manage Users:**
    -   Click "Users".
    -   *What to check:* You can see and edit users from *any* store.

---

## Phase 4: Public Tracking (No Login)

**Goal:** Verify customers can track orders without logging in.

16. **Track Order:**
    -   Go to `https://apexdashboard-eta.vercel.app/track-order` (or `http://localhost:5173/track-order`).
    -   Select "TechHub Electronics".
    -   Enter the Order ID from Phase 1.
    -   Click "Track".
    -   *What to check:* You see the current status of the order (e.g., "Delivered").

---

**End of Workflow Test.**
If all steps pass, the application is fully functional.
