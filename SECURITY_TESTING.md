# Security & Compliance Testing Guide

## Overview
This document outlines comprehensive security and compliance testing procedures for the Shopify Admin Dashboard application. The goal is to ensure the system is secure, compliant, and production-ready.

## Prerequisites

### Security Scanning Tools
- **Snyk**: `npm install -g snyk` (for dependency vulnerability scanning)
- **OWASP ZAP**: Download from https://www.zaproxy.org/ (for API security scanning)
- **npm audit**: Built-in npm command for vulnerability scanning

### Test Environment Setup
- TLS/SSL enabled (HTTPS)
- Test accounts for different roles (Admin, Staff, Demo)
- Network inspector tools (Chrome DevTools, Burp Suite)

## 1. API Security & Access Control Testing

### Test Cases

#### TC-SEC-1.1: Store Isolation (Tenant Isolation)
**Objective**: Verify users cannot access data from other stores.

**Test Steps**:
1. Login as Admin of Store A (`admin@techhub.com`)
2. Note Store A's storeId from JWT token
3. Attempt to access Store B's orders by modifying request:
   - Try `GET /api/orders` with modified `storeId` in token
   - Try `GET /api/products` with modified `storeId` in token
   - Try `GET /api/customers` with modified `storeId` in token

**Expected Results**:
- ✅ All queries automatically filtered by `req.storeId` from JWT token
- ✅ Cannot access other store's data even with modified token
- ✅ Backend validates `storeId` from token, not from request body/query
- ✅ Returns empty results or 403 for unauthorized access

**Verification**:
```bash
# Test with curl
curl -H "Authorization: Bearer TOKEN_STORE_A" http://localhost:5000/api/orders
# Should only return Store A orders

# Try to access Store B data (should fail)
curl -H "Authorization: Bearer TOKEN_STORE_A" \
  -H "X-Store-Id: STORE_B_ID" \
  http://localhost:5000/api/orders
# Should still return Store A orders (storeId from token, not header)
```

#### TC-SEC-1.2: Broken Object-Level Authorization (BOLA)
**Objective**: Verify users cannot modify other users' data.

**Test Steps**:
1. Login as Staff user (`staff1@techhub.com`)
2. Get another user's ID (from `/api/users` if accessible)
3. Attempt to update another user's profile:
   - `PUT /api/users/OTHER_USER_ID` with modified data
4. Attempt to delete another user:
   - `DELETE /api/users/OTHER_USER_ID`

**Expected Results**:
- ✅ Staff users cannot update other users (403 Forbidden)
- ✅ Staff users cannot delete users (403 Forbidden)
- ✅ Only Admin can manage users
- ✅ Users cannot modify their own role/permissions

**Verification**:
- Check `authorizeRole('admin')` middleware on user management endpoints
- Verify `PUT /api/users/:id` checks permissions
- Verify `DELETE /api/users/:id` checks permissions

#### TC-SEC-1.3: JWT Token Expiry & Refresh
**Objective**: Verify JWT tokens expire correctly and refresh logic works.

**Test Steps**:
1. Login and get JWT token
2. Wait for token expiry (or use expired token)
3. Attempt API call with expired token
4. Verify logout invalidates token

**Expected Results**:
- ✅ Expired tokens rejected (401 Unauthorized)
- ✅ Error message: "Token expired" or "Invalid token"
- ✅ Logout clears token from localStorage
- ✅ Logout endpoint invalidates token (if server-side invalidation implemented)

**Current Implementation**:
- JWT tokens expire after 7 days (`expiresIn: '7d'`)
- No refresh token mechanism (tokens are long-lived)
- Logout clears client-side token only

**Recommendations**:
- Consider shorter token expiry (e.g., 1 hour) with refresh tokens
- Implement token blacklist for logout (Redis or database)

#### TC-SEC-1.4: Password Reset & Force Change
**Objective**: Verify password reset and forced password change on first login.

**Test Steps**:
1. Login with user that has `passwordChangedAt: null`
2. Verify redirect to `/change-password`
3. Change password via `POST /api/users/me/change-password`
4. Verify can login with new password
5. Verify `passwordChangedAt` updated

**Expected Results**:
- ✅ Users with `passwordChangedAt: null` redirected to change password
- ✅ Cannot access dashboard until password changed
- ✅ Password change endpoint validates current password
- ✅ New password hashed with bcrypt
- ✅ `passwordChangedAt` timestamp updated

**Verification**:
- Check `needsPasswordChange` flag in login response
- Verify frontend redirect logic in `PrivateRoute`
- Verify password hashing in backend (`bcrypt.hash`)

### Authorization Checks Summary

**Protected Endpoints**:
- ✅ `/api/users` - Admin only (`authorizeRole('admin')`)
- ✅ `/api/users/:id` - Admin only
- ✅ `/api/settings/business` - Admin only
- ✅ `/api/demo/reset-data` - Admin only
- ✅ `/api/stores/admin` - Admin only

**Store-Scoped Endpoints** (all use `req.storeId` from token):
- ✅ `/api/orders` - Filtered by `storeId`
- ✅ `/api/products` - Filtered by `storeId`
- ✅ `/api/customers` - Filtered by `storeId`
- ✅ `/api/returns` - Filtered by `storeId`
- ✅ `/api/metrics/*` - Filtered by `storeId`

## 2. Input Validation & Injection Protection

### Test Cases

#### TC-SEC-2.1: SQL Injection Protection
**Objective**: Verify Sequelize ORM prevents SQL injection.

**Test Steps**:
1. Attempt SQL injection in search fields:
   - Orders search: `email=admin@test.com' OR '1'='1`
   - Products search: `name=test' OR '1'='1`
   - Customer search: `email=test' UNION SELECT * FROM users--`
2. Attempt SQL injection in numeric fields:
   - Order ID: `id=1' OR '1'='1`
   - Quantity: `quantity=1' OR '1'='1`

**Expected Results**:
- ✅ Sequelize parameterized queries prevent SQL injection
- ✅ Input sanitized/escaped automatically
- ✅ No raw SQL queries executed with user input
- ✅ Error messages don't expose SQL structure

**Current Implementation**:
- ✅ All queries use Sequelize ORM (no raw SQL)
- ✅ Sequelize uses parameterized queries automatically
- ✅ `Op.like` used for search (parameterized)
- ✅ No `sequelize.query()` with user input

**Verification**:
```javascript
// All queries use Sequelize ORM
Order.findAll({ where: { storeId: req.storeId } }) // Safe
Order.findAll({ where: { email: { [Op.like]: userInput } } }) // Safe (parameterized)
// No raw SQL: sequelize.query(`SELECT * FROM orders WHERE id = ${userInput}`) // NEVER
```

#### TC-SEC-2.2: XSS (Cross-Site Scripting) Protection
**Objective**: Verify XSS attacks are prevented.

**Test Steps**:
1. Attempt XSS in text fields:
   - Product name: `<script>alert('XSS')</script>`
   - Customer name: `<img src=x onerror=alert('XSS')>`
   - Order notes: `<svg onload=alert('XSS')>`
2. Check if scripts execute in frontend
3. Check if scripts stored in database

**Expected Results**:
- ✅ Frontend escapes HTML (React does this by default)
- ✅ Backend validates input (no script tags)
- ✅ Content Security Policy (CSP) headers prevent script execution
- ✅ No `dangerouslySetInnerHTML` used in frontend

**Current Implementation**:
- ✅ React escapes HTML by default
- ✅ Helmet CSP headers configured
- ✅ Input validation via `express-validator`
- ✅ No `dangerouslySetInnerHTML` in codebase

**Verification**:
- Check CSP headers: `Content-Security-Policy: default-src 'self'`
- Verify React components don't use `dangerouslySetInnerHTML`
- Test with browser console: `<script>alert('test')</script>` in input

#### TC-SEC-2.3: Input Size Limits
**Objective**: Verify large inputs are rejected.

**Test Steps**:
1. Attempt very large inputs:
   - Product name: 10,000+ characters
   - Order notes: 100,000+ characters
   - Email: 10,000+ characters
2. Check body parser limits

**Expected Results**:
- ✅ Body parser limits: `limit: '10mb'`
- ✅ Validation rejects oversized inputs
- ✅ Database column limits enforced
- ✅ Error messages don't expose limits

**Current Implementation**:
- ✅ `bodyParser.json({ limit: '10mb' })`
- ✅ `bodyParser.urlencoded({ limit: '10mb' })`
- ✅ Database column limits (VARCHAR, TEXT)
- ✅ Frontend validation (maxLength)

#### TC-SEC-2.4: Error Message Security
**Objective**: Verify error messages don't expose sensitive information.

**Test Steps**:
1. Trigger various errors:
   - Invalid login credentials
   - Database connection error
   - Validation errors
   - 500 errors
2. Check error messages in responses
3. Check error messages in logs

**Expected Results**:
- ✅ Production errors: Generic messages ("An error occurred")
- ✅ Development errors: Detailed messages (for debugging)
- ✅ No stack traces in production responses
- ✅ No database structure exposed
- ✅ No sensitive data in error messages

**Current Implementation**:
- ✅ Error handler checks `NODE_ENV`
- ✅ Production: Generic error messages
- ✅ Development: Detailed error messages
- ✅ Stack traces only in logs (not responses)

## 3. Dependency & Supply-Chain Vulnerabilities

### Test Cases

#### TC-SEC-3.1: npm Audit Scan
**Objective**: Scan for vulnerable npm packages.

**Test Steps**:
```bash
# Backend
cd backend
npm audit

# Frontend
cd frontend
npm audit

# Fix vulnerabilities
npm audit fix
npm audit fix --force  # (if needed, test after)
```

**Expected Results**:
- ✅ No critical vulnerabilities
- ✅ No high-severity vulnerabilities
- ✅ Medium/low vulnerabilities documented and assessed
- ✅ All dependencies up to date

**Current Status**:
- Run `npm audit` to check current vulnerabilities
- Update dependencies regularly
- Use `npm audit fix` for automatic fixes

#### TC-SEC-3.2: Snyk Scan
**Objective**: Use Snyk for comprehensive vulnerability scanning.

**Test Steps**:
```bash
# Install Snyk
npm install -g snyk

# Authenticate
snyk auth

# Scan backend
cd backend
snyk test

# Scan frontend
cd frontend
snyk test

# Monitor for vulnerabilities
snyk monitor
```

**Expected Results**:
- ✅ No critical vulnerabilities
- ✅ High-severity vulnerabilities fixed or documented
- ✅ Snyk monitoring enabled for continuous scanning

**Recommendations**:
- Set up Snyk monitoring in CI/CD pipeline
- Configure alerts for new vulnerabilities
- Review and fix vulnerabilities regularly

### Dependency Security Checklist

**Backend Dependencies**:
- ✅ `express` - Latest version (5.1.0)
- ✅ `jsonwebtoken` - Latest version (9.0.2)
- ✅ `bcryptjs` - Latest version (3.0.3)
- ✅ `helmet` - Latest version (8.1.0)
- ✅ `sequelize` - Latest version (6.37.7)
- ✅ `winston` - Latest version (3.18.3)

**Frontend Dependencies**:
- ✅ `react` - Latest version (19.2.0)
- ✅ `react-router-dom` - Latest version (7.9.5)
- ✅ `@mui/material` - Latest version (7.3.5)
- ✅ `recharts` - Latest version (3.4.1)

**Action Items**:
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Set up Snyk monitoring
- [ ] Configure automated dependency updates (Dependabot)

## 4. Secure Headers & Cookies

### Test Cases

#### TC-SEC-4.1: Security Headers Verification
**Objective**: Verify all security headers are present.

**Test Steps**:
```bash
# Check headers
curl -I http://localhost:5000/api/health

# Or use browser DevTools → Network → Headers
```

**Expected Headers** (Production):
- ✅ `Content-Security-Policy`: `default-src 'self'; style-src 'self' 'unsafe-inline'; ...`
- ✅ `X-Frame-Options`: `DENY`
- ✅ `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload`
- ✅ `X-Content-Type-Options`: `nosniff`
- ✅ `X-XSS-Protection`: `1; mode=block`
- ✅ `Referrer-Policy`: `strict-origin-when-cross-origin`

**Current Implementation**:
- ✅ Helmet configured with all security headers
- ✅ CSP configured for production
- ✅ HSTS enabled for production
- ✅ X-Frame-Options: DENY

**Verification**:
```bash
curl -I https://yourdomain.com/api/health | grep -i "content-security\|x-frame\|strict-transport\|x-content-type\|x-xss\|referrer"
```

#### TC-SEC-4.2: Cookie Security
**Objective**: Verify cookies are secure (if used).

**Test Steps**:
1. Check if cookies are used (JWT stored in localStorage, not cookies)
2. If cookies used, verify:
   - `HttpOnly` flag
   - `Secure` flag (HTTPS only)
   - `SameSite` attribute

**Current Implementation**:
- ✅ JWT tokens stored in localStorage (not cookies)
- ✅ No cookies used for authentication
- ✅ If cookies added later, ensure secure flags

**Recommendations**:
- Consider using httpOnly cookies for JWT (more secure than localStorage)
- Implement refresh tokens in httpOnly cookies
- Use `SameSite=Strict` for CSRF protection

## 5. TLS/SSL & CORS Configuration

### Test Cases

#### TC-SEC-5.1: HTTPS Enforcement
**Objective**: Verify HTTPS is enforced in production.

**Test Steps**:
1. Attempt HTTP access: `http://yourdomain.com`
2. Verify redirect to HTTPS
3. Check HSTS header present

**Expected Results**:
- ✅ HTTP requests redirect to HTTPS (301/302)
- ✅ HSTS header present: `Strict-Transport-Security`
- ✅ No mixed content warnings
- ✅ SSL certificate valid

**Current Implementation**:
- ✅ Helmet HSTS configured for production
- ✅ Reverse proxy (Nginx) should handle HTTP→HTTPS redirect
- ✅ Express `trust proxy` enabled for production

**Verification**:
```bash
# Check redirect
curl -I http://yourdomain.com
# Should return 301/302 redirect to https://

# Check HSTS
curl -I https://yourdomain.com | grep -i "strict-transport"
```

#### TC-SEC-5.2: CORS Configuration
**Objective**: Verify CORS only allows trusted origins.

**Test Steps**:
1. Attempt request from unauthorized origin:
   ```javascript
   // In browser console on different domain
   fetch('https://yourdomain.com/api/orders', {
     headers: { 'Authorization': 'Bearer TOKEN' }
   })
   ```
2. Check CORS headers in response
3. Verify only allowed origins can access API

**Expected Results**:
- ✅ CORS headers present: `Access-Control-Allow-Origin`
- ✅ Only allowed origins in `CORS_ORIGIN` env var
- ✅ Unauthorized origins rejected
- ✅ Credentials handled correctly

**Current Implementation**:
- ✅ CORS configured with `allowedOrigins` from `CORS_ORIGIN` env var
- ✅ Default: `http://localhost:5173` (development)
- ✅ Production: Set `CORS_ORIGIN` to production frontend URL

**Verification**:
```bash
# Check CORS headers
curl -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  http://localhost:5000/api/orders
# Should reject unauthorized origin
```

## 6. Production Readiness Checks

### Test Cases

#### TC-SEC-6.1: Debug Logs Removal
**Objective**: Verify no debug logs in production build.

**Test Steps**:
1. Build frontend: `npm run build`
2. Check built files for:
   - `console.log` statements
   - `console.debug` statements
   - `console.warn` statements (non-critical)
3. Check backend for debug logs

**Expected Results**:
- ✅ No `console.log` in production build
- ✅ Terser removes console statements
- ✅ Backend uses Winston logger (not console.log)
- ✅ No debug endpoints exposed

**Current Implementation**:
- ✅ Terser configured to remove console.log
- ✅ Frontend console statements removed
- ✅ Backend uses Winston logger
- ✅ `NODE_ENV=production` disables debug logs

**Verification**:
```bash
# Check built files
grep -r "console.log" frontend/dist/
# Should return no results

# Check backend
grep -r "console.log" backend/server.js
# Should only find Winston logger usage
```

#### TC-SEC-6.2: Environment Variables Exposure
**Objective**: Verify environment variables not exposed in frontend.

**Test Steps**:
1. Build frontend: `npm run build`
2. Check built files for:
   - `process.env.JWT_SECRET`
   - `process.env.DB_PASSWORD`
   - `process.env.SENTRY_DSN`
   - Any sensitive environment variables

**Expected Results**:
- ✅ Only `VITE_*` variables exposed to frontend
- ✅ No backend secrets in frontend build
- ✅ No database credentials in frontend
- ✅ No API keys in frontend

**Current Implementation**:
- ✅ Only `VITE_API_BASE_URL` used in frontend
- ✅ Backend secrets not exposed
- ✅ Vite only exposes `VITE_*` prefixed variables

**Verification**:
```bash
# Check built files
grep -r "JWT_SECRET\|DB_PASSWORD\|SENTRY_DSN" frontend/dist/
# Should return no results
```

#### TC-SEC-6.3: Minification & Source Maps
**Objective**: Verify production build is minified and source maps disabled.

**Test Steps**:
1. Build frontend: `npm run build`
2. Check built files:
   - JavaScript minified
   - CSS minified
   - No source maps (or source maps not publicly accessible)

**Expected Results**:
- ✅ JavaScript minified (Terser)
- ✅ CSS minified
- ✅ Source maps disabled or not publicly accessible
- ✅ File sizes optimized

**Current Implementation**:
- ✅ Terser minification enabled
- ✅ Source maps disabled in production
- ✅ Code splitting enabled
- ✅ Compression (gzip/brotli) enabled

## 7. Compliance & Privacy

### Test Cases

#### TC-SEC-7.1: Password Storage
**Objective**: Verify passwords are hashed, not stored in plaintext.

**Test Steps**:
1. Create new user with password
2. Check database: `SELECT passwordHash FROM users WHERE email = 'test@example.com'`
3. Verify password is hashed (bcrypt format: `$2a$10$...`)

**Expected Results**:
- ✅ Passwords hashed with bcrypt
- ✅ No plaintext passwords in database
- ✅ Password hashes not exposed in API responses
- ✅ `passwordHash` field excluded from user serialization

**Current Implementation**:
- ✅ Passwords hashed with `bcrypt.hash(password, 10)`
- ✅ `sanitizeUser` function removes `passwordHash` from responses
- ✅ Password comparison uses `bcrypt.compare`

**Verification**:
```sql
-- Check password hash format
SELECT email, passwordHash FROM users LIMIT 1;
-- Should show: $2a$10$... (bcrypt format)
```

#### TC-SEC-7.2: Sensitive Data in Logs
**Objective**: Verify sensitive data not logged.

**Test Steps**:
1. Perform operations that log data:
   - Login (check if password logged)
   - Create order (check if credit card info logged)
   - Update user (check if password logged)
2. Check log files: `logs/combined.log`, `logs/error.log`

**Expected Results**:
- ✅ Passwords never logged
- ✅ Credit card info never logged (if applicable)
- ✅ JWT tokens filtered from logs
- ✅ Sensitive data filtered in Sentry

**Current Implementation**:
- ✅ Sentry filters sensitive data (passwords, tokens)
- ✅ Winston logs don't include request body with passwords
- ✅ Error logs sanitized

**Verification**:
```bash
# Check logs
grep -i "password\|jwt\|token" logs/combined.log
# Should not show actual passwords or tokens
```

#### TC-SEC-7.3: Demo Account Isolation
**Objective**: Verify demo account data is isolated and sandboxed.

**Test Steps**:
1. Login as demo user
2. Verify can only see demo store data
3. Verify cannot access client store data
4. Verify demo data reset works

**Expected Results**:
- ✅ Demo store has `isDemo: true` flag
- ✅ Demo users scoped to demo store only
- ✅ Demo data isolated from client stores
- ✅ Demo reset endpoint works (`POST /api/demo/reset-data`)

**Current Implementation**:
- ✅ Demo store seeded with `isDemo: true`
- ✅ All queries filtered by `storeId` (tenant isolation)
- ✅ Demo reset endpoint clears and re-seeds demo data
- ✅ Demo users have limited permissions

**Verification**:
- Check database: `SELECT * FROM stores WHERE isDemo = true`
- Verify demo store has separate data
- Test demo reset endpoint

## 8. Security Testing Checklist

### Pre-Testing
- [ ] Security scanning tools installed (Snyk, OWASP ZAP)
- [ ] Test accounts created (Admin, Staff, Demo)
- [ ] TLS/SSL configured in test environment
- [ ] Network inspector tools ready

### During Testing
- [ ] API security & access control tested
- [ ] Input validation & injection protection tested
- [ ] Dependency vulnerabilities scanned
- [ ] Security headers verified
- [ ] CORS configuration tested
- [ ] Production readiness checked
- [ ] Compliance & privacy verified

### Post-Testing
- [ ] Security scan results reviewed
- [ ] Vulnerabilities fixed or documented
- [ ] Penetration testing attempted
- [ ] Mobile security verified
- [ ] Documentation updated with findings

## 9. Security Findings Template

**Test Date**: YYYY-MM-DD
**Tester**: [Name]
**Environment**: [Development/Staging/Production]

### Vulnerabilities Found

#### Critical
1. **Issue**: [Description]
   - **Severity**: Critical
   - **Impact**: [Description]
   - **Fix**: [Solution]
   - **Status**: [Fixed/Pending]

#### High
1. **Issue**: [Description]
   - **Severity**: High
   - **Impact**: [Description]
   - **Fix**: [Solution]
   - **Status**: [Fixed/Pending]

### Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

### Residual Risk

- [Risk 1]: [Description] - [Mitigation]
- [Risk 2]: [Description] - [Mitigation]

## 10. Continuous Security Monitoring

### Automated Scanning
- [ ] Snyk monitoring enabled
- [ ] npm audit in CI/CD pipeline
- [ ] OWASP ZAP automated scans
- [ ] Dependency update automation (Dependabot)

### Manual Reviews
- [ ] Quarterly security audits
- [ ] Penetration testing (annual)
- [ ] Code security reviews
- [ ] Dependency updates review

## 11. Security Best Practices

### Development
- ✅ Never commit secrets to git
- ✅ Use environment variables for sensitive data
- ✅ Validate all user input
- ✅ Use parameterized queries (Sequelize)
- ✅ Hash passwords (bcrypt)
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Log security events

### Production
- ✅ Enable security headers (Helmet)
- ✅ Enforce HTTPS (HSTS)
- ✅ Configure CORS properly
- ✅ Monitor for vulnerabilities
- ✅ Regular security updates
- ✅ Encrypted backups
- ✅ Access logging
- ✅ Error tracking (Sentry)

## Next Steps

1. Run security scans (npm audit, Snyk)
2. Fix identified vulnerabilities
3. Execute security test cases
4. Document findings
5. Implement recommendations
6. Set up continuous monitoring

