# Backend Architecture Guide

## Overview
The backend is a Node.js/Express application that serves as the API for the frontend dashboard. It handles data persistence, authentication, and business logic.

## Core Components

### 1. Server Entry Point (`server.js`)
The `server.js` file is the main entry point. It initializes:
- **Middleware**: CORS, Body Parser, Compression, Rate Limiting.
- **Database**: Connects to the database via Sequelize.
- **Routes**: Defines all API endpoints.
- **Error Handling**: Global error handler and Sentry integration.

### 2. Database Models (`backend/models/`)
The application uses Sequelize ORM. Key models include:

- **Organization**: Top-level entity managing multiple stores.
- **Store**: Represents a distinct shop. Contains products, orders, customers.
- **User**: Admin or staff members. Linked to a Store.
- **Product**: Items for sale. Includes stock tracking (`stockQuantity`, `reorderThreshold`).
- **Order**: Customer orders. Linked to Customer and Store.
- **Customer**: Store customers.
- **Return**: Return requests for orders.

### 3. Authentication & Security
- **JWT**: Used for stateless authentication. Tokens are signed with `JWT_SECRET`.
- **Middleware**:
  - `authenticateToken`: Verifies JWT header.
  - `authorizeRole`: Checks user role (e.g., 'admin', 'superadmin').
  - `checkAccountLockout`: Prevents brute force attacks.
- **Password Hashing**: Bcrypt is used for hashing passwords.

### 4. Smart Import Logic (`backend/utils/columnDetector.js`)
A custom utility for intelligent CSV imports:
- **Fuzzy Matching**: Uses Levenshtein distance to match CSV headers to database fields.
- **Synonyms**: Maps common terms (e.g., "Qty" -> "quantity").
- **Confidence Scoring**: Ensures accurate mapping.

## Key API Endpoints

### Authentication
- `POST /api/login`: Authenticate user.
- `POST /api/signup`: Register new user (disabled publicly).

### Orders
- `GET /api/orders`: List orders (supports filtering).
- `POST /api/orders`: Create new order.
- `POST /api/import/orders`: Bulk import orders from CSV.

### Products
- `GET /api/products`: List products.
- `POST /api/products`: Create product.
- `POST /api/import/products`: Bulk import products.

## Configuration
Environment variables are managed via `.env`:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`: Database credentials.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`: Supabase specific config.
- `JWT_SECRET`: Secret key for tokens.
- `NODE_ENV`: 'development' or 'production'.

## Error Handling
- **Sentry**: Integrated for production error tracking.
- **Winston**: Logger for info and error level logs.
- **Global Handler**: Catches unhandled exceptions and returns standardized JSON responses.
