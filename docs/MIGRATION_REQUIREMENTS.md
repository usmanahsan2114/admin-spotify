# Migration Requirements

## ✅ Migration Status: COMPLETED

The migration to the new Supabase instance has been successfully completed.

## Configuration Details
- **Database Host**: `aws-1-ap-northeast-2.pooler.supabase.com`
- **Database Port**: `6543` (Transaction pooler)
- **Database User**: `postgres.yqzwfbufcmxzeqfbdlpf`
- **Database Name**: `postgres`
- **Supabase Project URL**: `https://yqzwfbufcmxzeqfbdlpf.supabase.co`

## Updates Applied

### Backend (`backend/.env`)
- Configured with new Supabase credentials and TestSprite API key.

### Frontend (`frontend/.env`)
- Configured with new Supabase URL and Anon Key.

### Backend Config (`backend/config/config.json`)
- Updated to use new database credentials.

## Migration Steps Completed
1. ✅ Update backend/.env with TestSprite key + new Supabase credentials
2. ✅ Update frontend/.env with TestSprite key + new Supabase credentials
3. ✅ Update backend/config/config.json
4. ✅ Test connection to new database
5. ✅ Run migrations
6. ✅ Seed database with 6 stores + users
7. ✅ Restart servers and verify
