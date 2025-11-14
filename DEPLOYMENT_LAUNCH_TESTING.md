# Deployment & Production Launch Testing Guide

## Overview

This document outlines comprehensive testing procedures for deployment readiness and production launch verification. The goal is to ensure a flawless production launch with proper staging verification, backup/rollback procedures, monitoring, and client onboarding readiness.

## Prerequisites

- Staging environment matching production (same DB size, domain mapping)
- CI/CD pipeline or manual build steps ready
- Production build of frontend and backend configured
- SSL certificates configured
- Monitoring tools configured (Sentry, uptime monitoring)
- Backup/restore scripts tested

## Test Cases

### 1. Production Build Verification

#### TC-DEPLOY-1.1: Frontend Production Build
**Objective**: Verify frontend builds correctly for production.

**Test Steps**:
1. Run `cd frontend && npm run build`
2. Verify build completes without errors
3. Check `frontend/dist` directory exists
4. Verify `VITE_API_BASE_URL` points to production backend domain
5. Check build output size (should be optimized)
6. Verify no source maps in production build
7. Verify console.log statements removed (check minified files)

**Expected Results**:
- ✅ Build completes successfully
- ✅ `dist` directory contains optimized files
- ✅ `VITE_API_BASE_URL` set correctly
- ✅ No source maps in production
- ✅ Console.log statements removed
- ✅ Build size optimized (< 2MB for initial bundle)

#### TC-DEPLOY-1.2: Backend Production Mode
**Objective**: Verify backend runs correctly in production mode.

**Test Steps**:
1. Set `NODE_ENV=production`
2. Start backend: `node backend/server.js`
3. Check logs show no warnings
4. Verify health endpoint returns OK: `GET /api/health`
5. Check `.env` variables loaded correctly
6. Verify no debug mode logging
7. Verify no development middleware active (hot reload off)

**Expected Results**:
- ✅ Backend starts without errors
- ✅ No warnings in logs
- ✅ Health endpoint returns `200 OK`
- ✅ Environment variables loaded
- ✅ No debug logging
- ✅ Production mode active

### 2. Staging Environment Check

#### TC-DEPLOY-2.1: Staging Deployment
**Objective**: Verify staging deployment matches production.

**Test Steps**:
1. Deploy to staging environment
2. Point to same services as production (DB, API)
3. Run smoke tests:
   - Access login page
   - Login as admin
   - Access dashboard
   - View orders list
   - Create product
4. Check browser console for errors
5. Check network tab for failed requests
6. Monitor server logs for warnings or memory leaks

**Expected Results**:
- ✅ Staging deployment successful
- ✅ All smoke tests pass
- ✅ No console errors
- ✅ No network errors
- ✅ No warnings in server logs
- ✅ No memory leaks detected

#### TC-DEPLOY-2.2: Staging Performance
**Objective**: Verify performance on staging matches expectations.

**Test Steps**:
1. Measure response times for key endpoints
2. Check database query performance
3. Verify frontend load time
4. Test with production-like data volume
5. Monitor resource usage (CPU, memory)

**Expected Results**:
- ✅ Response times < 500ms (p95)
- ✅ Database queries optimized
- ✅ Frontend load time < 3s
- ✅ Resource usage within limits
- ✅ No performance degradation

### 3. Backup/Rollback & Monitoring

#### TC-DEPLOY-3.1: Database Backup & Restore
**Objective**: Verify backup and restore procedures work correctly.

**Test Steps**:
1. Create a test backup using backup script
2. Make changes to database (add test data)
3. Restore from backup
4. Verify system recovers correctly
5. Verify data integrity maintained
6. Check all tables restored correctly

**Expected Results**:
- ✅ Backup created successfully
- ✅ Restore completes without errors
- ✅ System recovers correctly
- ✅ Data integrity verified
- ✅ All tables restored

#### TC-DEPLOY-3.2: Error Tracking (Sentry)
**Objective**: Verify Sentry error tracking works in production.

**Test Steps**:
1. Trigger a test error (invalid endpoint)
2. Verify error appears in Sentry dashboard
3. Check error context (user, request details)
4. Verify sensitive data filtered (no passwords/tokens)
5. Test alerting (email/Slack if configured)

**Expected Results**:
- ✅ Error captured in Sentry
- ✅ Error context included
- ✅ Sensitive data filtered
- ✅ Alerts triggered (if configured)

#### TC-DEPLOY-3.3: Uptime Monitoring
**Objective**: Verify uptime monitoring configured correctly.

**Test Steps**:
1. Configure uptime monitoring (ping `/api/health` every minute)
2. Simulate downtime (stop backend)
3. Verify alert triggered
4. Restore service
5. Verify alert cleared

**Expected Results**:
- ✅ Monitoring configured
- ✅ Alert triggered on downtime
- ✅ Alert cleared on recovery
- ✅ Monitoring tool receives health checks

### 4. Domain, SSL, DNS & Caching

#### TC-DEPLOY-4.1: SSL Certificate Verification
**Objective**: Verify SSL certificates are valid and configured correctly.

**Test Steps**:
1. Access production domain via HTTPS
2. Verify SSL certificate valid (no browser warnings)
3. Check HSTS header present
4. Test HTTP → HTTPS redirection
5. Verify certificate expiration date
6. Test certificate renewal process

**Expected Results**:
- ✅ SSL certificate valid
- ✅ No browser warnings
- ✅ HSTS header present
- ✅ HTTP redirects to HTTPS
- ✅ Certificate expiration date acceptable (> 30 days)
- ✅ Renewal process works

#### TC-DEPLOY-4.2: CORS Configuration
**Objective**: Verify CORS configured correctly for production.

**Test Steps**:
1. Test API requests from production domain
2. Test API requests from invalid origin
3. Verify CORS headers in response
4. Check `CORS_ORIGIN` environment variable
5. Test from browser console with invalid origin

**Expected Results**:
- ✅ Requests from production domain allowed
- ✅ Requests from invalid origin blocked
- ✅ CORS headers present
- ✅ `CORS_ORIGIN` configured correctly

#### TC-DEPLOY-4.3: Caching Headers
**Objective**: Verify caching headers configured correctly.

**Test Steps**:
1. Check static assets (JS, CSS, images) have cache headers
2. Verify API responses have no-cache headers (unless intended)
3. Test cache behavior in browser
4. Verify cache invalidation works

**Expected Results**:
- ✅ Static assets cached (1 year)
- ✅ API responses not cached (unless intended)
- ✅ Cache headers correct
- ✅ Cache invalidation works

### 5. Go-Live Readiness

#### TC-DEPLOY-5.1: Client Onboarding Checklist
**Objective**: Verify client onboarding process is ready.

**Checklist**:
- [ ] Store setup complete (6 stores: 5 clients + 1 demo)
- [ ] User creation process documented
- [ ] Branding applied (logo, brand color)
- [ ] Demo store verified and functional
- [ ] Client access credentials prepared
- [ ] Client onboarding guide created (`CLIENT_ACCESS_GUIDE.md`)

**Expected Results**:
- ✅ All stores configured
- ✅ User creation process ready
- ✅ Branding applied
- ✅ Demo store functional
- ✅ Credentials prepared
- ✅ Onboarding guide complete

#### TC-DEPLOY-5.2: Rollback Procedure
**Objective**: Verify rollback procedure documented and tested.

**Test Steps**:
1. Review `ROLLBACK_PLAN.md`
2. Test rollback procedure:
   - Revert to previous build
   - Restore database from backup
   - Switch traffic (if blue-green deployment)
3. Verify system recovers correctly
4. Document rollback time (RTO)

**Expected Results**:
- ✅ Rollback plan documented
- ✅ Rollback procedure tested
- ✅ System recovers correctly
- ✅ RTO documented (< 30 minutes)

#### TC-DEPLOY-5.3: Production Readiness Declaration
**Objective**: Verify all readiness criteria met.

**Readiness Criteria**:
- [ ] All smoke tests pass
- [ ] Performance targets met
- [ ] Security verified
- [ ] Monitoring configured
- [ ] Backups tested
- [ ] Rollback procedure tested
- [ ] Client onboarding ready
- [ ] Documentation complete

**Expected Results**:
- ✅ All criteria met
- ✅ Production ready
- ✅ Clients can be invited

## Testing Checklist

### Pre-Deployment
- [ ] Staging environment matches production
- [ ] Production build tested locally
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Monitoring tools configured
- [ ] Backup scripts tested

### During Deployment
- [ ] Production build created
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Database migrations run
- [ ] Health checks pass
- [ ] Smoke tests pass

### Post-Deployment
- [ ] All endpoints accessible
- [ ] No console errors
- [ ] No server errors
- [ ] Performance acceptable
- [ ] Monitoring active
- [ ] Backups scheduled

## Deployment Scripts

### Production Build Script
```bash
#!/bin/bash
# Build frontend and backend for production

echo "Building frontend..."
cd frontend
npm run build

echo "Building backend..."
cd ../backend
npm install --production

echo "Build complete!"
```

### Deployment Verification Script
```bash
#!/bin/bash
# Verify deployment health

echo "Checking health endpoint..."
curl -f https://admin.yourdomain.com/api/health || exit 1

echo "Checking frontend..."
curl -f https://admin.yourdomain.com/ || exit 1

echo "Deployment verified!"
```

## Rollback Procedure

### Quick Rollback (Code Only)
```bash
# 1. Stop current deployment
pm2 stop shopify-admin-backend

# 2. Revert to previous version
git checkout <previous-commit>
cd frontend && npm run build
cd ../backend && npm install --production

# 3. Restart
pm2 restart shopify-admin-backend
```

### Full Rollback (Code + Database)
```bash
# 1. Stop application
pm2 stop shopify-admin-backend

# 2. Restore database
./backend/scripts/restore-database.sh <backup-file>

# 3. Revert code (as above)

# 4. Restart
pm2 restart shopify-admin-backend
```

## Client Onboarding Checklist

### For Each Client Store:
- [ ] Store created in database
- [ ] Admin user created with strong password
- [ ] Staff users created (if needed)
- [ ] Store branding configured (logo, color)
- [ ] Default currency set
- [ ] Store domain/subdomain configured
- [ ] SSL certificate obtained
- [ ] Client credentials provided securely
- [ ] Onboarding guide shared

### Demo Store:
- [ ] Demo store created
- [ ] Demo user created with limited permissions
- [ ] Demo reset endpoint tested
- [ ] Demo credentials displayed on login page
- [ ] Demo mode banner functional

## Monitoring Setup

### Health Check Monitoring
- Configure uptime monitoring to ping `/api/health` every minute
- Set up alerts for:
  - Health check failures
  - High response times (> 1s)
  - Database connection failures
  - High error rates (> 1%)

### Error Monitoring
- Sentry configured for error tracking
- Alerts configured for:
  - Critical errors
  - High error rates
  - Unhandled exceptions

### Performance Monitoring
- Monitor key metrics:
  - API response times
  - Database query times
  - Memory usage
  - CPU usage
  - Connection pool usage

## Post-Launch Monitoring (First 24-48 Hours)

### Hourly Checks
- [ ] Health endpoint status
- [ ] Error logs review
- [ ] Performance metrics
- [ ] Resource usage

### Daily Checks
- [ ] Backup verification
- [ ] Error rate analysis
- [ ] Performance trends
- [ ] User activity

## Troubleshooting

### Common Issues

**Issue**: Health endpoint returns 503
- **Cause**: Database connection failed
- **Fix**: Check database status, verify credentials

**Issue**: Frontend not loading
- **Cause**: Nginx configuration issue
- **Fix**: Check Nginx logs, verify static files exist

**Issue**: SSL certificate warnings
- **Cause**: Certificate expired or misconfigured
- **Fix**: Renew certificate, verify Nginx config

**Issue**: High error rate
- **Cause**: Application bug or resource exhaustion
- **Fix**: Check error logs, review recent changes, scale resources

## Reporting Template

**Deployment Date**: YYYY-MM-DD
**Deployed By**: [Name]
**Environment**: Production

### Build Verification
- [ ] Frontend build: ✅ / ❌
- [ ] Backend production mode: ✅ / ❌
- [ ] Environment variables: ✅ / ❌

### Staging Verification
- [ ] Smoke tests: ✅ / ❌
- [ ] Performance: ✅ / ❌
- [ ] No errors: ✅ / ❌

### Monitoring & Backup
- [ ] Sentry configured: ✅ / ❌
- [ ] Uptime monitoring: ✅ / ❌
- [ ] Backup tested: ✅ / ❌

### SSL & CORS
- [ ] SSL certificate: ✅ / ❌
- [ ] CORS configured: ✅ / ❌
- [ ] Caching headers: ✅ / ❌

### Go-Live Readiness
- [ ] Client onboarding: ✅ / ❌
- [ ] Rollback tested: ✅ / ❌
- [ ] Production ready: ✅ / ❌

### Issues Found
1. [Issue description]
   - **Severity**: [Critical/High/Medium/Low]
   - **Fix**: [Solution]
   - **Status**: [Fixed/Pending]

## Next Steps

1. Execute production build verification
2. Deploy to staging and run smoke tests
3. Test backup/restore procedures
4. Configure monitoring and alerts
5. Verify SSL, CORS, and caching
6. Complete client onboarding checklist
7. Test rollback procedure
8. Declare production readiness
9. Invite clients and monitor first 24-48 hours

