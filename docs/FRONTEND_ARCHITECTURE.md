# Frontend Architecture Guide

## Overview
The frontend is a modern Single Page Application (SPA) built with React and TypeScript. It uses Material UI for a consistent, professional design.

## Core Structure

### 1. Routing (`App.tsx`)
- **React Router v6**: Handles navigation.
- **Lazy Loading**: Pages are imported dynamically using `React.lazy` and `Suspense` for performance.
- **Private Routes**: Protected routes require authentication (`PrivateRoute` component).
- **Public Routes**: Login, Order Tracking.

### 2. State Management
- **Context API**: Used for global state.
  - `AuthContext`: Manages user session, login/logout, and user profile.
- **Local State**: `useState` and `useReducer` used within components.

### 3. Key Pages (`src/pages/`)
- **Dashboard**: Overview of sales and stats.
- **OrdersPage**: List of orders with filtering, export, and import.
  - *Features*: Smart CSV import, inline customer creation, stock validation.
- **ProductsPage**: Product management.
- **CustomersPage**: Customer CRM.

### 4. Components (`src/components/`)
- **Layout**: `DashboardLayout` provides the sidebar and header structure.
- **Common**: Reusable UI elements (Dialogs, Cards, Loaders).

## Key Features Implementation

### Order Creation
- **Validation**: Yup schema validation ensures data integrity.
- **Stock Check**: Real-time validation against available product stock.
- **Inline Customer**: Allows creating new customers directly within the order form.

### Smart Import UI
- **File Upload**: Accepts CSV files.
- **Feedback**: Shows mapping summary and error reports after import.

## Styling
- **Material UI (MUI)**: Uses the `sx` prop for styling and the robust theming system.
- **Responsive Design**: Layout adapts to mobile and desktop screens.

## Build & Deploy
- **Vite**: Used for fast development and optimized production builds.
- **Scripts**:
  - `npm run dev`: Start local dev server.
  - `npm run build`: Build for production.
