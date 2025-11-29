# Headless Storefront API Documentation

**Base URL:** `/api/public/v1`

This API is designed for public access from your React storefront. It does not require authentication tokens, but it is read-only and filters out sensitive internal data (like cost price, supplier info).

## Endpoints

### 1. Get Products
Fetch a paginated list of products with optional filtering.

- **Endpoint:** `GET /products`
- **Query Parameters:**
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 20)
  - `storeId` (string): Filter by Store ID (Recommended for multi-tenant)
  - `category` (string): Filter by category name
  - `minPrice` (number): Minimum price
  - `maxPrice` (number): Maximum price
  - `sort` (string): `newest`, `price_asc`, `price_desc`, `name_asc`, `name_desc`
  - `search` (string): Search by product name

**Example Request:**
```http
GET /api/public/v1/products?storeId=123&category=Electronics&sort=price_asc
```

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Description...",
      "price": 1000,
      "category": "Electronics",
      "imageUrl": "https://...",
      "stockQuantity": 50,
      "storeId": "123",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "totalPages": 1,
  "currentPage": 1
}
```

### 2. Get Product Details
Fetch details for a single product.

- **Endpoint:** `GET /products/:id`

**Example Request:**
```http
GET /api/public/v1/products/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Product Name",
  "description": "Full description...",
  "price": 1000,
  "category": "Electronics",
  "imageUrl": "https://...",
  "stockQuantity": 50,
  "storeId": "123",
  "variants": [...]
}
```

### 3. Get Categories
Fetch a list of all unique product categories.

- **Endpoint:** `GET /categories`
- **Query Parameters:**
  - `storeId` (string): Filter by Store ID

**Example Request:**
```http
GET /api/public/v1/categories?storeId=123
```

**Response:**
```json
[
  "Electronics",
  "Fashion",
  "Home & Living"
]
```

### 4. Validate Cart
Validate items in the cart before checkout. Checks stock availability and calculates totals.

- **Endpoint:** `POST /checkout/validate`
- **Body:**
```json
{
  "storeId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ]
}
```

**Response:**
```json
{
  "valid": true,
  "items": [...],
  "subtotal": 2000,
  "total": 2000
}
```

### 5. Submit Order
Submit a new order from the storefront.

- **Endpoint:** `POST /orders`
- **Body:**
```json
{
  "storeId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 1,
      "price": 1000
    }
  ],
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": "123 Main St"
  },
  "paymentMethod": "cod"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "orderId": "uuid"
}
```
