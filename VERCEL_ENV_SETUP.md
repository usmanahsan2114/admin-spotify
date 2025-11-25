# Vercel Environment Variables Setup Guide

## Required Environment Variables

Add these environment variables in your Vercel project dashboard:
**Settings → Environment Variables**

### 🔐 Security & Authentication

```bash
NODE_ENV=production
JWT_SECRET=<GENERATE_STRONG_SECRET_32_CHARS_MINIMUM>
```

> **⚠️ IMPORTANT:** Generate a strong JWT_SECRET using:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

### 🗄️ Database Configuration (Supabase)

```bash
DB_HOST=aws-1-ap-northeast-2.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.yqzwfbufcmxzeqfbdlpf
DB_PASSWORD=7!tR/HubhpWc!SF
DB_DIALECT=postgres
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

---

### 🔧 Connection Pool (Optimized for Serverless)

```bash
DB_POOL_MAX=3
DB_POOL_MIN=0
DB_POOL_IDLE=10000
DB_POOL_ACQUIRE=30000
```

> **Note:** These values are optimized for Vercel's serverless environment.
> Lower pool sizes prevent connection exhaustion.

---

### 🌐 CORS Configuration

```bash
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

> **⚠️ IMPORTANT:** Replace with your actual frontend Vercel URL.
> You can add multiple origins separated by commas:
> ```bash
> CORS_ORIGIN=https://app.example.com,https://www.example.com
> ```

---

### 📊 Optional: Error Tracking (Sentry)

```bash
SENTRY_DSN=<your-sentry-dsn>
```

> Only add if you're using Sentry for error tracking.

---

## Environment Variable Scopes

For each variable, select the appropriate environments:

- ✅ **Production** - Always required
- ⚠️ **Preview** - Recommended for testing
- ❌ **Development** - Not needed (use local `.env` file)

---

## Quick Setup Checklist

- [ ] Generate strong JWT_SECRET (minimum 32 characters)
- [ ] Add all database credentials from Supabase
- [ ] Update CORS_ORIGIN with your frontend URL
- [ ] Set connection pool values (use defaults above)
- [ ] Verify NODE_ENV is set to "production"
- [ ] Deploy and test `/api/health` endpoint
- [ ] Check Vercel logs for any errors

---

## Testing Database Connection

After deployment, test your database connection:

```bash
curl https://your-backend-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": {
    "status": "connected",
    "dialect": "postgres",
    "latency": 50
  }
}
```

---

## Common Issues

### Issue: "Cannot find module 'pg-hstore'"
**Solution:** Already fixed in code. Ensure `pg` and `pg-hstore` are in `dependencies` (not `devDependencies`).

### Issue: "ENOENT: no such file or directory, mkdir 'logs'"
**Solution:** Already fixed. Logger now detects Vercel environment and skips file logging.

### Issue: Database connection timeout
**Solution:** 
1. Verify all DB_* environment variables are set correctly
2. Check Supabase connection pooler is enabled
3. Ensure DB_SSL=true and DB_SSL_REJECT_UNAUTHORIZED=false

### Issue: CORS errors
**Solution:** Update CORS_ORIGIN to match your frontend domain exactly (including https://).

---

## Vercel Deployment Commands

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# Check environment variables
vercel env ls
```

---

## Security Notes

⚠️ **Never commit `.env` files to Git**
✅ **Use Vercel dashboard for production secrets**
✅ **Rotate JWT_SECRET periodically**
✅ **Use different secrets for production vs preview**
