# Rollback Plan

## Overview

This document outlines the rollback procedures for the Shopify Admin Dashboard application in case of critical issues during or after deployment.

## Pre-Deployment Checklist

Before deploying, ensure:
- [ ] Database backups are current and tested
- [ ] Previous version code is tagged in Git
- [ ] Environment variables are documented
- [ ] Rollback scripts are tested in staging
- [ ] Team members know rollback procedures

---

## Rollback Scenarios

### Scenario 1: Application Crash or Critical Errors

**Symptoms:**
- Application fails to start
- 500 errors on all endpoints
- Database connection failures

**Rollback Steps:**

1. **Stop Current Application:**
   ```bash
   pm2 stop shopify-admin-backend
   pm2 stop shopify-admin-frontend  # If running separately
   ```

2. **Revert Code:**
   ```bash
   git checkout <previous-stable-tag>
   # Or
   git revert <commit-hash>
   ```

3. **Restore Dependencies:**
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

4. **Restart Application:**
   ```bash
   pm2 restart shopify-admin-backend
   # Or rebuild frontend if needed
   cd frontend
   npm run build
   ```

5. **Verify:**
   ```bash
   curl https://yourdomain.com/api/health
   ```

**Expected Downtime:** 5-10 minutes

---

### Scenario 2: Database Migration Failure

**Symptoms:**
- Database errors in logs
- Data inconsistencies
- Migration errors

**Rollback Steps:**

1. **Stop Application:**
   ```bash
   pm2 stop shopify-admin-backend
   ```

2. **Rollback Database Migration:**
   ```bash
   cd backend
   npx sequelize-cli db:migrate:undo
   # Or rollback to specific migration
   npx sequelize-cli db:migrate:undo:all --to <migration-timestamp>
   ```

3. **Restore Database Backup (if needed):**
   ```bash
   # Use encrypted backup restore script
   cd backend/scripts
   ./restore-database.sh /backups/db_backup_shopify_admin_YYYYMMDD_HHMMSS.enc.gz
   
   # Script will:
   # - Prompt for encryption key
   # - Decrypt backup
   # - Decompress
   # - Restore database
   # - Provide confirmation
   ```

4. **Revert Code:**
   ```bash
   git checkout <previous-stable-tag>
   ```

5. **Restart Application:**
   ```bash
   pm2 restart shopify-admin-backend
   ```

**Expected Downtime:** 10-15 minutes

---

### Scenario 3: Frontend Build Issues

**Symptoms:**
- Frontend fails to load
- JavaScript errors in browser console
- Broken UI components

**Rollback Steps:**

1. **Revert Frontend Code:**
   ```bash
   cd frontend
   git checkout <previous-stable-tag>
   ```

2. **Rebuild:**
   ```bash
   npm install
   npm run build
   ```

3. **Restart Nginx (if serving static files):**
   ```bash
   sudo systemctl restart nginx
   ```

4. **Clear Browser Cache:**
   - Instruct users to hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
   - Or update cache-busting version in build

**Expected Downtime:** 2-5 minutes

---

### Scenario 4: Security Vulnerability Discovered

**Symptoms:**
- Security breach detected
- Unauthorized access
- Data exposure

**Rollback Steps:**

1. **Immediate Actions:**
   ```bash
   # Stop application immediately
   pm2 stop shopify-admin-backend
   
   # Block suspicious IPs in firewall
   sudo ufw deny from <suspicious-ip>
   ```

2. **Revert to Last Known Secure Version:**
   ```bash
   git checkout <last-secure-tag>
   ```

3. **Rotate Secrets:**
   ```bash
   # Generate new JWT secret
   openssl rand -base64 32
   
   # Update .env file
   # Force all users to re-authenticate
   ```

4. **Review Logs:**
   ```bash
   tail -f logs/error.log
   tail -f logs/combined.log
   ```

5. **Restart with New Secrets:**
   ```bash
   pm2 restart shopify-admin-backend
   ```

**Expected Downtime:** 15-30 minutes

---

### Scenario 5: Performance Degradation

**Symptoms:**
- Slow API responses
- High memory usage
- Database connection pool exhaustion

**Rollback Steps:**

1. **Scale Down (if using multiple instances):**
   ```bash
   pm2 scale shopify-admin-backend 1
   ```

2. **Revert Recent Changes:**
   ```bash
   git checkout <previous-stable-tag>
   ```

3. **Clear Caches:**
   ```bash
   # Clear Node.js cache if needed
   pm2 restart shopify-admin-backend --update-env
   ```

4. **Monitor:**
   ```bash
   pm2 monit
   curl https://yourdomain.com/api/health
   ```

**Expected Downtime:** 5-10 minutes

---

## Database Backup Restoration

### Full Database Restore

```bash
# 1. Stop application
pm2 stop shopify-admin-backend

# 2. Decrypt backup
echo "$ENCRYPTION_KEY" | base64 -d | openssl enc -aes-256-cbc -d -pbkdf2 \
  -in db_backup_shopify_admin_YYYYMMDD_HHMMSS.enc.gz \
  -out backup.sql.gz -pass stdin

# 3. Decompress
gunzip backup.sql.gz

# 4. Restore (WARNING: This will overwrite existing data)
mysql -u shopify_admin -p shopify_admin < backup.sql

# 5. Restart application
pm2 start shopify-admin-backend
```

### Partial Restore (Single Table)

```bash
# Extract specific table from backup
# (requires manual SQL extraction or separate table backups)

mysql -u shopify_admin -p shopify_admin < restore_orders_table.sql
```

---

## Code Rollback Procedures

### Using Git Tags

```bash
# List available tags
git tag -l

# Checkout previous stable version
git checkout v1.0.0

# Create new branch from previous version
git checkout -b hotfix/rollback-v1.0.0 v1.0.0

# Push rollback branch
git push origin hotfix/rollback-v1.0.0
```

### Using Git Revert

```bash
# Revert specific commit
git revert <commit-hash>

# Revert multiple commits
git revert <commit-hash-1> <commit-hash-2>

# Push revert
git push origin main
```

---

## Post-Rollback Verification

After rollback, verify:

1. **Health Check:**
   ```bash
   curl https://yourdomain.com/api/health
   ```

2. **Critical Endpoints:**
   - Login: `POST /api/login`
   - Dashboard: `GET /api/metrics/overview`
   - Orders: `GET /api/orders`

3. **Database Integrity:**
   ```bash
   mysql -u shopify_admin -p shopify_admin -e "SELECT COUNT(*) FROM orders;"
   ```

4. **Frontend Loading:**
   - Visit homepage
   - Test login flow
   - Verify dashboard loads

5. **Monitoring:**
   - Check PM2 logs: `pm2 logs`
   - Check error logs: `tail -f logs/error.log`
   - Check combined logs: `tail -f logs/combined.log`
   - Monitor Sentry dashboard for new errors (if configured)
   - Check System Status card in dashboard (real-time health monitoring)
   - Verify health endpoint: `curl https://yourdomain.com/api/health`

---

## Communication Plan

During rollback:

1. **Notify Team:**
   - Send alert via Slack/Email
   - Update status page (if available)

2. **User Communication:**
   - Display maintenance message
   - Update social media if needed

3. **Post-Rollback:**
   - Document what went wrong
   - Create incident report
   - Schedule post-mortem meeting

---

## Prevention Measures

To minimize rollback needs:

1. **Staging Environment:**
   - Test all changes in staging first
   - Run full test suite before production

2. **Gradual Rollout:**
   - Use feature flags
   - Deploy to subset of users first

3. **Monitoring:**
   - Set up alerts for errors
   - Monitor performance metrics
   - Track error rates

4. **Automated Testing:**
   - Unit tests
   - Integration tests
   - End-to-end tests

5. **Database Migrations:**
   - Test migrations on copy of production data
   - Create rollback scripts for migrations
   - Backup before migrations

---

## Emergency Contacts

- **DevOps Lead:** [Contact Info]
- **Database Admin:** [Contact Info]
- **Security Team:** [Contact Info]
- **Hosting Provider Support:** [Contact Info]

---

## Recovery Time Objectives (RTO)

- **Critical Issues:** < 15 minutes
- **Major Issues:** < 30 minutes
- **Minor Issues:** < 1 hour

## Recovery Point Objectives (RPO)

- **Database Backups:** Daily encrypted backups (AES-256-CBC) with 30-day retention
- **Backup Storage:** Off-site storage supported (S3, SCP, or local)
- **Backup Scripts:** Automated via cron (`backend/scripts/backup-database-encrypted.sh`)
- **Restore Scripts:** Available (`backend/scripts/restore-database.sh`) with confirmation prompts
- **Code Versioning:** Every deployment tagged
- **Configuration:** Version controlled

---

**Last Updated:** December 2024
**Review Frequency:** Quarterly

