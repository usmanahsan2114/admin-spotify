# Deployment Guide

This guide covers deploying the Shopify Admin Dashboard to production, including frontend deployment on Vercel and backend configuration with Supabase Postgres.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Backend Database Setup (Supabase)](#backend-database-setup-supabase)
- [Backend Deployment](#backend-deployment)
- [CORS Configuration](#cors-configuration)
- [Environment Variables Summary](#environment-variables-summary)

## Prerequisites

- GitHub repository connected to Vercel
- Supabase account and project created
- Backend hosting service (VM, PaaS, or container platform)
- Domain names (optional, for custom domains)

## Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Production build succeeds (`npm --prefix frontend run build`)
- [ ] Environment variables documented and ready
- [ ] Database migrations tested against production dialect (Postgres)
- [ ] CORS origins configured for production domains
- [ ] `VITE_API_BASE_URL` set correctly for production frontend

## Frontend Deployment (Vercel)

### Step 1: Connect Repository to Vercel

1. Log in to [Vercel](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the repository and click "Import"

### Step 2: Configure Build Settings

In the Vercel project settings:

- **Framework Preset**: Vite
- **Root Directory**: `./` (project root)
- **Build Command**: `npm run build --prefix frontend`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm install && npm --prefix backend install && npm --prefix frontend install`

### Step 3: Configure Environment Variables

In Vercel dashboard → Project Settings → Environment Variables, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `https://api.yourdomain.com` | Production, Preview, Development |

**Important**: Replace `https://api.yourdomain.com` with your actual backend API URL.

### Step 4: Deploy

1. Click "Deploy" (or push to your main branch if auto-deploy is enabled)
2. Wait for build to complete
3. Note your Vercel deployment URL (e.g., `https://your-project.vercel.app`)

### Step 5: Update CORS in Backend

Once you have your Vercel URL, update `CORS_ORIGIN` in your backend environment:

```env
CORS_ORIGIN=https://your-project.vercel.app,https://admin.yourdomain.com
```

Replace with your actual Vercel domain and custom domain (if applicable).

### Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain (e.g., `admin.yourdomain.com`)
3. Follow DNS configuration instructions
4. Update `CORS_ORIGIN` in backend to include custom domain

## Backend Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Log in to [Supabase](https://supabase.com)
2. Create a new project (e.g., `shopify-admin-db`)
3. Note your database password (you'll need it for connection string)

### Step 2: Get Database Credentials

From Supabase project settings → Database:

- **Host**: `db.yqzwfbufcmxzeqfbdlpf.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `7!tR/HubhpWc!SF`
- **Connection String**: `postgresql://postgres:7!tR/HubhpWc!SF@db.yqzwfbufcmxzeqfbdlpf.supabase.co:5432/postgres`

### Step 3: Configure Backend Environment

Create `backend/.env.production`:

```env
# Server
PORT=5000
JWT_SECRET=your-production-jwt-secret-change-this

# Production - Supabase Postgres
DB_DIALECT=postgres
DB_HOST=db.yqzwfbufcmxzeqfbdlpf.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=7!tR/HubhpWc!SF

# CORS
CORS_ORIGIN=https://your-vercel-domain.vercel.app,https://admin.yourdomain.com

# SSL (required for Supabase)
DB_SSL=true
```

### Step 4: Run Migrations

```bash
cd backend
npx sequelize-cli db:migrate
```

This creates all tables in your Supabase database.

### Step 5: Seed Production Data (Optional)

For production, use a light seed:

```bash
DB_DIALECT=postgres SEED_MODE=production npm run seed
```

This creates:
- Superadmin user
- One demo store
- Minimal test data

**Note**: `SEED_MODE=development` should only be used for local/dev databases as it creates extensive test data.

### Step 6: Verify Connection

Test the database connection:

```bash
curl https://your-backend-api.com/api/health
```

Should return database status and dialect.

## Backend Deployment

Deploy your backend to your preferred hosting service (VM, Railway, Render, DigitalOcean, etc.).

### Example: Railway Deployment

1. Connect your GitHub repository to Railway
2. Set root directory to `backend/`
3. Configure environment variables (from `backend/.env.production`)
4. Deploy

### Example: DigitalOcean App Platform

1. Create new app from GitHub
2. Set build command: `npm install`
3. Set run command: `npm start`
4. Configure environment variables
5. Deploy

### Important Backend Environment Variables

```env
PORT=5000
JWT_SECRET=<strong-production-secret>
DB_DIALECT=postgres
DB_HOST=db.yqzwfbufcmxzeqfbdlpf.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=7!tR/HubhpWc!SF
DB_SSL=true
CORS_ORIGIN=<vercel-frontend-url>,<custom-domain>
```

## CORS Configuration

The backend CORS configuration must allow requests from:

1. Local development: `http://localhost:5173`
2. Vercel deployment: `https://your-project.vercel.app`
3. Custom domain (if used): `https://admin.yourdomain.com`

Example `CORS_ORIGIN`:

```env
CORS_ORIGIN=http://localhost:5173,https://your-project.vercel.app,https://admin.yourdomain.com
```

## Environment Variables Summary

### Frontend (Vercel)

| Variable | Production Value | Notes |
|----------|-----------------|-------|
| `VITE_API_BASE_URL` | `https://api.yourdomain.com` | Backend API URL |

### Backend (Production Server)

| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | `5000` | Server port |
| `JWT_SECRET` | `<secret>` | Strong random string |
| `DB_DIALECT` | `postgres` | Database dialect |
| `DB_HOST` | `db.yqzwfbufcmxzeqfbdlpf.supabase.co` | Supabase database host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_NAME` | `postgres` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `7!tR/HubhpWc!SF` | Supabase password |
| `DB_SSL` | `true` | Required for Supabase |
| `CORS_ORIGIN` | `<frontend-urls>` | Comma-separated allowed origins |

## Post-Deployment Verification

1. **Frontend**: Visit Vercel URL, confirm dashboard loads
2. **Backend Health**: `curl https://your-api.com/api/health`
3. **Database**: Check Supabase dashboard → Table Editor to confirm tables exist
4. **Login**: Test login with seeded admin account
5. **API Calls**: Verify API requests from frontend succeed
6. **CORS**: Confirm no CORS errors in browser console

## Troubleshooting

### CORS Errors

- Verify `CORS_ORIGIN` includes exact frontend URL (no trailing slashes)
- Check backend logs for CORS configuration
- Ensure backend is reading environment variables correctly

### Database Connection Issues

- Verify Supabase credentials are correct
- Check Supabase project is active (not paused)
- Ensure `DB_SSL=true` for Supabase connections
- Test connection string directly with `psql` or pgAdmin

### Frontend API Errors

- Verify `VITE_API_BASE_URL` is set correctly in Vercel
- Check network tab for actual API calls being made
- Confirm backend is deployed and accessible

### Build Failures

- Check Vercel build logs for errors
- Verify all dependencies are in `package.json`
- Ensure build command matches project structure

---

For development setup, see [DEVELOPMENT.md](./DEVELOPMENT.md).  
For testing procedures, see [TESTING.md](./TESTING.md).

