# Migration Requirements

To migrate to the new Supabase instance and configure TestSprite, I need the following information:

## ✅ Information Provided
- **TestSprite API Key**: `sk-user-KSwe4kRTSEnfo1hfMFE0rlFVuNmbchYAPgCulj5EX6R9RGL3pLmnMZhChSSgoEDWqX3Jj77gJ3ZGBc-_aK9mZ_XjIvbev64eCUD6K6djgBH8IQ3LqLGue0tR-2RfhsUu69o`
- **New Database Host**: `aws-1-ap-northeast-2.pooler.supabase.com`
- **New Database Port**: `6543` (Transaction pooler)
- **New Database User**: `postgres.yqzwfbufcmxzeqfbdlpf`
- **New Database Name**: `postgres`

## ❌ Missing Information Required
Please provide the following to complete the migration:

1. **Database Password** - Required for database connection
2. **Supabase Project URL** - Format: `https://yqzwfbufcmxzeqfbdlpf.supabase.co`
3. **Supabase Anon Key** - For frontend authentication
4. **Supabase Service Role Key** - For backend admin operations (optional)

## What Will Be Updated

### Backend (`backend/.env`)
```env
# TestSprite
TESTSPRITE_API_KEY=sk-user-KSwe...

# New Supabase
SUPABASE_URL=https://yqzwfbufcmxzeqfbdlpf.supabase.co
SUPABASE_ANON_KEY=[NEEDED]
SUPABASE_SERVICE_ROLE_KEY=[NEEDED]

# New Database
DB_HOST=aws-1-ap-northeast-2.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.yqzwfbufcmxzeqfbdlpf
DB_PASSWORD=[NEEDED]
```

### Frontend (`frontend/.env`)
```env
# TestSprite
VITE_TESTSPRITE_API_KEY=sk-user-KSwe...

# New Supabase
VITE_SUPABASE_URL=https://yqzwfbufcmxzeqfbdlpf.supabase.co
VITE_SUPABASE_ANON_KEY=[NEEDED]
VITE_API_BASE_URL=http://localhost:5000
```

### Backend Config (`backend/config/config.json`)
- Update to use new database credentials

## Migration Steps (Once Info Provided)
1. ✅ Update backend/.env with TestSprite key + new Supabase credentials
2. ✅ Update frontend/.env with TestSprite key + new Supabase credentials
3. ✅ Update backend/config/config.json
4. ✅ Test connection to new database
5. ✅ Run migrations
6. ✅ Seed database with 6 stores + users
7. ✅ Restart servers and verify
