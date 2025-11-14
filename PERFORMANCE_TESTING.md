# Performance, Load & Stress Testing Guide

## Overview
This document outlines performance, load, and stress testing procedures for the Shopify Admin Dashboard application. The goal is to ensure the system remains stable, responsive, and error-free under various load conditions.

## Prerequisites

### Environment Setup
- Staging environment that mirrors production (or local with similar DB size)
- Load testing tool installed (k6, JMeter, or Artillery)
- Seed data: 10k+ orders, 1k+ products, 5k+ customers per store
- Monitoring tools configured (Sentry, Winston logs)

### Database Indexes
**IMPORTANT**: Run the performance indexes migration before testing:
```bash
cd backend
npx sequelize-cli db:migrate
```

This creates indexes on:
- `storeId` (all tables) - Critical for tenant isolation queries
- `email` (orders, customers, users) - For search operations
- `createdAt` (orders, customers) - For date range filtering
- Composite indexes for common query patterns (storeId + status, storeId + createdAt, etc.)

## 1. Baseline Metrics

### Measure Current Performance

**Key Endpoints to Test:**
- `GET /api/orders` - Orders list with pagination
- `POST /api/orders` - Order creation
- `PUT /api/products/:id` - Product update
- `GET /api/reports/growth` - Growth report generation
- `GET /api/products/low-stock` - Low stock query with threshold logic
- `GET /api/metrics/overview` - Dashboard metrics

**Baseline Metrics to Collect:**
- Average response time (target: <500ms for simple queries, <2s for complex)
- 95th percentile response time (target: <1s for simple, <3s for complex)
- 99th percentile response time
- Error rate (target: <0.1%)
- Database query time (target: <100ms per query)
- Memory usage (baseline and under load)
- CPU usage (baseline and under load)
- Database connection pool utilization

**Using Performance Metrics Endpoint:**
```bash
# Get performance metrics (admin only)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/performance/metrics
```

This endpoint returns:
- Database connection pool stats
- Query performance for common operations
- Record counts
- Memory and CPU usage

## 2. Load Testing

### Using k6

**Installation:**
```bash
# Windows (via Chocolatey)
choco install k6

# macOS
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Run Load Test:**
```bash
cd backend/scripts
k6 run load-test-k6.js
```

**Test Phases:**
1. **Warm-up**: 10 users for 30s
2. **Load Test**: Ramp to 100 users over 2 minutes
3. **Stress Test**: Ramp to 500 users over 1 minute
4. **Cool Down**: Ramp down to 0 users

**Expected Results:**
- 95% of requests complete in <3 seconds
- Error rate <1%
- No unhandled exceptions
- Database connection pool not exhausted
- Memory usage stable (no leaks)

### Using Artillery

**Installation:**
```bash
npm install -g artillery
```

**Run Load Test:**
```bash
cd backend/scripts
artillery run load-test-artillery.yml
```

**Test Phases:**
1. **Warm-up**: 2 req/s for 30s
2. **Load Test**: Ramp to 50 req/s over 2 minutes
3. **Stress Test**: Ramp to 200 req/s over 1 minute
4. **Spike Test**: Spike to 500 req/s for 30s
5. **Cool Down**: Ramp down to 0 req/s

## 3. Stress Testing

### Test Scenarios

**Scenario 1: Concurrent User Login**
- Simulate 500+ users logging in simultaneously
- Verify: No connection pool exhaustion, response times acceptable

**Scenario 2: Bulk Order Creation**
- Create 1000 orders in rapid succession
- Verify: All orders created, no data corruption, performance degrades gracefully

**Scenario 3: Heavy Reporting**
- Multiple users generating reports simultaneously
- Verify: Reports complete successfully, no timeouts

**Scenario 4: Database Query Stress**
- Heavy pagination queries with filters
- Verify: Response times remain <500ms for first page

**Expected Behavior:**
- System remains stable (no crashes)
- Error rate increases gradually (not spike)
- Response times degrade gracefully
- No memory leaks
- Database connections managed properly
- UI remains responsive (if testing frontend)

## 4. Database Performance & Query Profiling

### Query Performance Targets

**Simple Queries (single table, indexed):**
- Target: <100ms
- Acceptable: <500ms

**Complex Queries (joins, aggregations):**
- Target: <500ms
- Acceptable: <2s

**Report Generation:**
- Target: <2s
- Acceptable: <5s

### Query Profiling

**Enable Slow Query Logging:**
```sql
-- In MySQL
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 0.5; -- Log queries >500ms
SET GLOBAL log_queries_not_using_indexes = 'ON';
```

**Check Query Performance:**
```bash
# View slow query log
tail -f /var/log/mysql/slow-query.log

# Or check via MySQL
SHOW VARIABLES LIKE 'slow_query%';
```

### Index Verification

**Verify indexes exist:**
```sql
SHOW INDEXES FROM orders;
SHOW INDEXES FROM products;
SHOW INDEXES FROM customers;
SHOW INDEXES FROM returns;
SHOW INDEXES FROM users;
```

**Check index usage:**
```sql
EXPLAIN SELECT * FROM orders WHERE storeId = 'xxx' ORDER BY createdAt DESC LIMIT 20;
-- Should show "Using index" or "Using where; Using index"
```

### Common Performance Issues

**Issue: Full table scans**
- **Solution**: Ensure indexes on `storeId` and frequently filtered columns

**Issue: Slow date range queries**
- **Solution**: Composite index on `(storeId, createdAt)`

**Issue: Slow low stock queries**
- **Solution**: Composite index on `(storeId, stockQuantity, reorderThreshold)`

**Issue: Slow search queries**
- **Solution**: Index on `email` column, consider full-text search for large datasets

## 5. Frontend Performance

### Lighthouse Audit

**Run Lighthouse:**
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Performance", "Accessibility", "Best Practices", "SEO"
4. Run audit on:
   - Dashboard (`/`)
   - Orders list (`/orders`)
   - Products list (`/products`)
   - Settings (`/settings`)

**Target Scores:**
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90 (if applicable)

### Frontend Optimizations

**Already Implemented:**
- ✅ Code splitting (React.lazy for all pages)
- ✅ Terser minification
- ✅ Console.log removal in production
- ✅ Gzip/Brotli compression
- ✅ Manual chunks (vendor, mui, charts)

**Additional Optimizations:**
- ✅ Lazy load charts (Recharts)
- ✅ Lazy load date picker (if used)
- ✅ Image optimization (lazy loading, WebP format)
- ✅ Font optimization (preload, subset)

### Mobile Performance

**Test on Actual Devices:**
- iPhone (Safari)
- Android (Chrome)
- iPad (Safari)

**Metrics to Check:**
- First Contentful Paint (FCP): <1.8s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <3.8s
- Cumulative Layout Shift (CLS): <0.1
- First Input Delay (FID): <100ms

**Mobile-Specific Checks:**
- Touch targets ≥44px
- No horizontal scroll
- Smooth scrolling (60 FPS)
- No memory leaks during extended use
- Forms stack vertically
- Tables scroll horizontally

## 6. Monitoring & Logging Under Load

### Server Logs

**Check for Warnings:**
```bash
# Check error logs
tail -f logs/error.log

# Check combined logs
tail -f logs/combined.log

# Check for slow queries
grep "slow" logs/combined.log
```

**What to Look For:**
- Slow query warnings
- Connection pool exhaustion
- Memory warnings
- Unhandled exceptions
- High error rates

### Performance Monitoring

**Health Check Endpoint:**
```bash
curl http://localhost:5000/api/health
```

Returns:
- Database connection status and latency
- Memory usage
- CPU usage
- Connection pool stats
- Server uptime

**Performance Metrics Endpoint (Admin):**
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/performance/metrics
```

Returns:
- Query performance metrics
- Record counts
- Connection pool utilization
- Memory and CPU usage

### Sentry Monitoring

**Verify Sentry Captures:**
- Errors under load
- Performance transactions (10% sampling)
- Slow queries
- Unhandled exceptions

**Check Sentry Dashboard:**
- Error rate should remain low (<0.1%)
- No spike in errors during load test
- Performance metrics show acceptable latency

## 7. Performance Tuning Recommendations

### Database Tuning

**Connection Pool:**
- Current: max 10, min 2 (production)
- Consider increasing if connection pool exhausted:
  ```javascript
  pool: {
    max: 20,  // Increase if needed
    min: 5,
    acquire: 30000,
    idle: 10000,
  }
  ```

**Query Optimization:**
- Use `limit` and `offset` for pagination
- Avoid `SELECT *` - select only needed columns
- Use indexes for all `WHERE` clauses
- Avoid N+1 queries (use `include` in Sequelize)

**Index Maintenance:**
- Monitor index usage
- Remove unused indexes
- Add indexes for slow queries
- Consider partial indexes for large tables

### Backend Tuning

**Caching:**
- Consider Redis for frequently accessed data
- Cache dashboard metrics (refresh every 30s)
- Cache store settings (refresh on update)

**Response Compression:**
- Already enabled (gzip/brotli)
- Threshold: 1KB (only compress larger responses)

**Rate Limiting:**
- Already configured
- Adjust if needed based on load test results

### Frontend Tuning

**Asset Optimization:**
- Minimize bundle size (already done)
- Use CDN for static assets (in production)
- Enable HTTP/2 for parallel requests
- Preload critical resources

**Rendering Optimization:**
- Use React.memo for expensive components
- Virtualize long lists (if needed)
- Debounce search inputs
- Throttle scroll handlers

## 8. Test Execution Checklist

### Pre-Testing
- [ ] Database indexes migration run
- [ ] Seed data loaded (10k+ orders, 1k+ products, 5k+ customers)
- [ ] Load testing tool installed
- [ ] Monitoring tools configured
- [ ] Test accounts created
- [ ] Baseline metrics collected

### During Testing
- [ ] Run baseline metrics collection
- [ ] Execute load test (100 concurrent users)
- [ ] Execute stress test (500 concurrent users)
- [ ] Monitor server logs
- [ ] Monitor database performance
- [ ] Monitor memory/CPU usage
- [ ] Check error rates
- [ ] Verify response times

### Post-Testing
- [ ] Document all metrics
- [ ] Identify bottlenecks
- [ ] Apply optimizations
- [ ] Re-run tests to verify improvements
- [ ] Update documentation with results

## 9. Performance Baseline Targets

### Response Time Targets

| Endpoint | Target (p95) | Acceptable (p95) |
|----------|--------------|------------------|
| GET /api/orders | <500ms | <1s |
| POST /api/orders | <300ms | <500ms |
| GET /api/products | <300ms | <500ms |
| GET /api/products/low-stock | <500ms | <1s |
| GET /api/metrics/overview | <1s | <2s |
| GET /api/reports/growth | <2s | <3s |
| GET /api/health | <100ms | <200ms |

### Resource Usage Targets

| Metric | Target | Warning | Critical |
|--------|--------|---------|---------|
| Memory Usage | <500MB | >1GB | >2GB |
| CPU Usage | <50% | >70% | >90% |
| DB Connection Pool | <70% | >85% | >95% |
| Error Rate | <0.1% | >0.5% | >1% |

## 10. Load Test Results Template

**Test Run Date**: YYYY-MM-DD
**Test Duration**: X minutes
**Peak Concurrent Users**: X
**Total Requests**: X

### Metrics

**Response Times:**
- Average: X ms
- p50: X ms
- p95: X ms
- p99: X ms
- Max: X ms

**Error Rate:**
- Total Errors: X
- Error Rate: X%
- Status Code Breakdown: [200: X, 400: X, 500: X]

**Resource Usage:**
- Peak Memory: X MB
- Peak CPU: X%
- DB Connection Pool Peak: X/X

### Issues Found

1. **Issue**: [Description]
   - **Impact**: [High/Medium/Low]
   - **Fix**: [Solution]
   - **Status**: [Fixed/Pending]

### Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

## 11. Continuous Performance Monitoring

### Production Monitoring

**Metrics to Track:**
- Response times (p50, p95, p99)
- Error rates
- Database query times
- Memory usage
- CPU usage
- Connection pool utilization

**Alerts:**
- Response time p95 > 3s
- Error rate > 1%
- Memory usage > 80%
- CPU usage > 80%
- Connection pool > 90%

**Tools:**
- Sentry (error tracking, performance monitoring)
- Winston logs (structured logging)
- Health check endpoint (uptime monitoring)
- Database slow query log

## 12. Mobile Responsiveness Under Load

### Test Scenarios

**Scenario 1: Rapid Scrolling**
- Scroll through orders/products list rapidly
- Verify: Smooth scrolling, no lag, no memory leaks

**Scenario 2: Rapid Status Updates**
- Update order status multiple times quickly
- Verify: UI remains responsive, updates reflect correctly

**Scenario 3: Form Submission**
- Submit forms rapidly
- Verify: No double submissions, proper loading states

**Expected Results:**
- UI remains smooth (60 FPS)
- No memory leaks
- Touch targets remain accessible
- No UI freezes
- Forms remain usable

## Troubleshooting

### High Response Times

**Check:**
1. Database indexes exist and are used
2. Connection pool not exhausted
3. No N+1 queries
4. Queries use `limit` for pagination
5. No full table scans

**Solutions:**
- Add missing indexes
- Increase connection pool size
- Optimize queries
- Add caching

### High Error Rate

**Check:**
1. Server logs for errors
2. Database connection issues
3. Rate limiting too strict
4. Memory exhaustion

**Solutions:**
- Fix underlying errors
- Increase connection pool
- Adjust rate limits
- Increase server resources

### Memory Leaks

**Check:**
1. Memory usage over time
2. Unclosed database connections
3. Event listeners not cleaned up
4. Large objects in memory

**Solutions:**
- Fix memory leaks
- Close connections properly
- Clean up event listeners
- Optimize data structures

## Next Steps

1. Run baseline metrics collection
2. Execute load tests
3. Execute stress tests
4. Document results
5. Apply optimizations
6. Re-test to verify improvements
7. Set up continuous monitoring

