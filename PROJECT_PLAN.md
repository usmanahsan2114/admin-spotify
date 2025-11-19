# Project Plan

Original plan and requirements for building the Shopify-Like E-commerce Admin Dashboard.

## Objective

Develop a full-featured React-based admin dashboard (as a Shopify alternative) for managing e-commerce orders, products, and more. This dashboard displays all order submissions from the portfolio website (currently sent via email) and provides rich management features: multi-user access with permissions, order tracking/status updates, product catalog management, analytics charts, and a modern UI with dark mode, search, filters, and sorting.

## Key Features and Requirements

### Order Management

- List incoming orders with details (product name, customer name, email, phone, quantity, comments, etc.)
- Update order status (e.g. Pending, Accepted, Paid, Shipped, Refunded)
- Support tracking order status changes and possibly returns
- View order details and edit (mark as paid, record a refund, update status notes, etc.)

### Product Management

- Maintain a catalog of products
- Admin users can add new products, edit details (name, description, price, images)
- Update inventory stock or mark items as out-of-stock
- Products listed in a table with search and sorted by name, price, etc.

### User Accounts & Roles

- Implement authentication (login/logout) for multiple users
- Role-Based Access Control (RBAC) so the client (admin) can create other user accounts with limited permissions
- Admin role: can manage users and all data
- Staff role: might only view orders or update statuses
- Enhances security and reduces clutter by showing each user only relevant tools

### Dashboard Overview

- Home page displaying key performance indicators (KPIs) and analytics
- Summary stats: total orders, pending orders, total sales, etc.
- Visual charts: sales over time, order volume by day
- Interactive filtering by date range
- Use React chart library (Recharts or Chart.js) for common chart types (line, bar, pie)

### Filtering, Search, and Sorting

- Search bar for keywords (e.g. search by customer name or product)
- Filters (e.g. filter orders by status)
- Sortable columns (e.g. sort orders by date or amount)
- Improves efficiency by allowing administrators to quickly locate specific records

### UI/UX Design

- Modern, professional design with emphasis on clarity
- Clean, uncluttered layout utilizing white space, clear typography, and coherent color palette
- Logical hierarchy (important stats and navigation readily visible)
- Sidebar or header navigation for major sections (Dashboard overview, Orders, Products, Users, etc.)
- Recognizable icons and labels for menu items
- **Dark Mode**: Theme toggle with preference persistence
- Responsive for different screen sizes (desktop and mobile)

### Optional Features

#### Notifications (Optional)

- Indicate new incoming orders (highlight or badge on Orders menu)
- Real-time update when a new order is received for immediate awareness

#### Data Integration

- Modify portfolio website's order form to send data to dashboard backend (in addition to email)
- For development/testing: create dummy form or endpoint to simulate order submissions

#### Multi-user Management

- Admin user can create and manage other user accounts via the dashboard
- Invite team member or set user's role
- Default admin account and functionality to add/edit users and assign roles (admin or limited access)
- Basic security best practices: hashed passwords and input validation

#### Activity Log (Advanced/Optional)

- Keep an audit log of important actions (order status changes, refunds, user account changes)
- History section on order detail page noting time and user of each status update
- Aids accountability and debugging

## Technology Stack

### Frontend

- **Framework**: React (Vite + TypeScript recommended)
- **UI Framework**: Material-UI (MUI) or Tailwind CSS
- **Chart Library**: Recharts for data visualizations
- **Routing**: React Router for multi-page navigation
- **State Management**: React Context API or Redux (for larger apps)

### Backend

- **Server**: Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Database**: Initially in-memory, ready for SQL/NoSQL swap
- **ORM**: Sequelize (for database abstraction)

## Development Workflow Overview

1. **Project Initialization**: Set up Vite + React, Express backend, install dependencies
2. **Basic Backend API**: Create endpoints for orders, products, users, authentication
3. **Dummy Order Form**: Test order intake form for marketing-site integration
4. **Frontend Layout**: Implement navigation, sidebar, dark mode toggle
5. **Orders Page**: Table with search, filter, sort, status updates
6. **Order Details**: Detailed view with editing capabilities
7. **Products Page**: Catalog management with CRUD operations
8. **User Management**: Admin interface for managing users and roles
9. **Authentication Flow**: Login/signup, route protection, token management
10. **Dashboard Analytics**: Summary cards, charts, final polish

## Success Criteria

The dashboard should cover the "doable things like Shopify" for a small e-commerce operation:
- Managing orders with status tracking
- Product catalog management
- Multi-user support with roles
- Analytics and insights
- Modern, responsive UI with dark mode

---

**Note**: This is the original project plan. For current implementation status and features, see [DEVELOPMENT.md](./DEVELOPMENT.md).

