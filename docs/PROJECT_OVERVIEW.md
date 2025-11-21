# Project Overview

## Introduction
This project is a comprehensive **Shopify-style Admin Dashboard** designed for managing multiple stores, products, orders, customers, and returns. It features a robust backend API and a modern React-based frontend.

## Architecture
The application follows a standard **Client-Server** architecture:

- **Frontend**: Single Page Application (SPA) built with React, TypeScript, and Material UI.
- **Backend**: RESTful API built with Node.js, Express, and Sequelize ORM.
- **Database**: Relational database (PostgreSQL for production/Supabase, MySQL for local dev).

## Tech Stack

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **UI Library**: Material UI (MUI) v5
- **State Management**: React Context API (AuthContext, etc.)
- **Routing**: React Router v6
- **Build Tool**: Vite
- **HTTP Client**: Axios (implied)
- **Forms**: React Hook Form + Yup

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: PostgreSQL (Supabase) / MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Logging**: Winston + Sentry
- **Security**: Helmet, CORS, Rate Limiting

## Directory Structure

```
shopify-admin/
├── backend/                # Node.js API Server
│   ├── config/             # Database configuration
│   ├── middleware/         # Auth, Error handling, Rate limiting
│   ├── migrations/         # Sequelize migrations
│   ├── models/             # Database models (User, Product, Order, etc.)
│   ├── utils/              # Helper functions (e.g., columnDetector.js)
│   └── server.js           # Main entry point
│
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Global state (Auth)
│   │   ├── pages/          # Page components (Orders, Products, etc.)
│   │   ├── services/       # API service calls
│   │   └── App.tsx         # Main component & Routing
│   └── vite.config.ts      # Vite configuration
│
└── docs/                   # Project Documentation
```

## Key Features
- **Multi-Store Support**: Single admin can manage multiple distinct stores.
- **Order Management**: Create, update, track orders. Smart CSV import.
- **Product Management**: Inventory tracking, variants, categories.
- **Customer Management**: CRM features, order history.
- **Returns Management**: Handle return requests and refunds.
- **Role-Based Access**: Super Admin, Store Admin, User roles.
