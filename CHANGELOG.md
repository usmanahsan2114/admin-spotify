# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-12-XX

### Fixed
- Fixed logger initialization order (logger now defined before Sentry to prevent ReferenceError)
- Fixed undefined `users` array reference in `findUserByEmail` (converted to async Sequelize query)
- Fixed undefined `stores[0]` references (replaced with `Store.findOne()` queries)
- Fixed undefined `ADMIN_USER_ID` constant references
- Fixed missing await on async functions in customer serialization
- Fixed order creation endpoint to use Sequelize instead of in-memory array

### Changed
- Migrated signup endpoint (`POST /api/signup`) to use Sequelize `User.create()`
- Migrated user management endpoints to use Sequelize queries
- Migrated order creation endpoint (`POST /api/orders`) to use Sequelize
- Converted `getOrdersForCustomer` and `serializeCustomer` to async functions
- Database migration progress increased from 30% to 35%

### Added
- System Status card component for real-time health monitoring
- Encrypted database backup scripts with off-site storage support
- Comprehensive rollback plan documentation
- Enhanced health check endpoint with performance metrics
- Sentry error tracking integration
- Enhanced security headers (CSP, HSTS, X-Frame-Options)

## [Previous] - 2025-XX-XX

## [Unreleased] - Production Migration Phase

### Added
- ✅ Sequelize ORM integration
- ✅ MySQL database support
- ✅ Database models (Store, User, Product, Customer, Order, Return, Setting)
- ✅ Database migrations for all tables
- ✅ Database seeder for initial data
- ✅ Auto-seeding on server start (development mode)
- ✅ Environment variable configuration (`.env` support)
- ✅ CORS security configuration (restricted to allowed origins)
- ✅ Database initialization script (`db/init.js`)
- ✅ Password change flag in login response (`needsPasswordChange`)

### Changed
- ✅ Server initialization now includes database connection
- ✅ Authentication middleware updated to use Sequelize
- ✅ Stores endpoint updated to use database queries
- ✅ Login endpoint updated to use database queries
- ✅ Helper functions updated to use Sequelize (findStoreById, findCustomerByContact, etc.)
- ✅ CORS configuration now uses environment variables

### In Progress
- ⚠️ ~40+ API endpoints still need Sequelize migration
- ⚠️ Helper functions need async/await updates
- ⚠️ Password change endpoint needs implementation

### Documentation
- ✅ Created `PRODUCTION_MIGRATION_STATUS.md` - Detailed migration status
- ✅ Created `PRODUCTION_READINESS_ANALYSIS.md` - Production readiness analysis
- ✅ Created `CRITICAL_CHANGES_REQUIRED.md` - Critical changes checklist
- ✅ Updated `DATABASE_MIGRATION_GUIDE.md` - Migration guide with current status
- ✅ Updated `DEPLOYMENT_PLAN.md` - Deployment plan with database setup
- ✅ Updated `QUICK_DEPLOYMENT_GUIDE.md` - Quick guide with database steps
- ✅ Updated `README.md` - Updated tech stack and status

## Previous Versions

See `history.md` for previous changelog entries.

