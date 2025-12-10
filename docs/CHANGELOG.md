# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.1.0] - 2025-11-29

### Added
- **Storefront UI/UX Overhaul**:
    - Implemented a modern, responsive design using Tailwind CSS.
    - Added `Navbar` component with cart badge, search, and user icons.
    - Added `Hero` section to the Homepage with dynamic content.
    - Added `ProductCard` component with hover effects and "Add to Cart" functionality.
    - Added `Layout` component to wrap pages with Navbar and Footer.
    - Added `Success` page for order confirmation.
- **Documentation**:
    - Created `CHANGELOG.md` to track project history.
    - Updated `SHOPIFY_REPLACEMENT_TIERS.md` to mark Tier 1 as completed.
    - Updated `STORE_CREDENTIALS_AND_URLS.md` with Storefront URLs.

### Fixed
- **Backend**:
    - Fixed `parseInt` error in `storefrontController.js` that caused "Product not found" for UUIDs.
    - Fixed 500 Internal Server Error in `checkoutController.js` caused by undefined `storeId` in `validateCart`.
    - Fixed `storefrontRoutes.js` to correctly mount public API endpoints.
- **Frontend**:
    - Fixed import errors in `App.tsx` for page components.
    - Fixed `React` import issues in `main.tsx`.

### Changed
- **Configuration**:
    - Updated `tailwind.config.js` with custom colors (primary, secondary) and fonts (Inter, Outfit).
    - Updated `vite.config.ts` to hardcode port 5174 for the storefront.
- **Deployment**:
    - Pushed all changes to `preview` branch for Vercel deployment.

## [1.0.0] - 2025-11-15
- Initial release of the Admin Dashboard and Backend API.
- Complete migration to Supabase Postgres.
- Multi-store support (Client + Demo).
