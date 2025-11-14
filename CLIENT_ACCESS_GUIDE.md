# 👥 Client Access Guide

## Overview

This guide provides information for giving your 5 clients access to their respective stores on the deployed Hostinger platform.

---

## Store Access Information

### Store 1: TechHub Electronics

**Dashboard Access:**
- **URL:** `https://techhub.yourdomain.com` OR `https://admin.yourdomain.com`
- **Admin Email:** `admin@techhub.com`
- **Admin Password:** `admin123` ⚠️ **MUST CHANGE ON FIRST LOGIN**

**Staff Accounts:**
- `staff1@techhub.com` / `staff123`
- `staff2@techhub.com` / `staff123`
- `staff3@techhub.com` / `staff123`
- `staff4@techhub.com` / `staff123`
- `staff5@techhub.com` / `staff123`

**Public Pages:**
- Order Tracking: `https://techhub.yourdomain.com/store/{storeId}/track-order`
- Test Order Form: `https://techhub.yourdomain.com/store/{storeId}/test-order`

**Store ID:** (Get from database or backend logs)

---

### Store 2: Fashion Forward

**Dashboard Access:**
- **URL:** `https://fashion.yourdomain.com` OR `https://admin.yourdomain.com`
- **Admin Email:** `admin@fashionforward.com`
- **Admin Password:** `admin123` ⚠️ **MUST CHANGE ON FIRST LOGIN**

**Staff Accounts:**
- `staff1@fashionforward.com` / `staff123`
- `staff2@fashionforward.com` / `staff123`
- `staff3@fashionforward.com` / `staff123`
- `staff4@fashionforward.com` / `staff123`

**Public Pages:**
- Order Tracking: `https://fashion.yourdomain.com/store/{storeId}/track-order`
- Test Order Form: `https://fashion.yourdomain.com/store/{storeId}/test-order`

**Store ID:** (Get from database or backend logs)

---

### Store 3: Home & Living Store

**Dashboard Access:**
- **URL:** `https://homeliving.yourdomain.com` OR `https://admin.yourdomain.com`
- **Admin Email:** `admin@homeliving.com`
- **Admin Password:** `admin123` ⚠️ **MUST CHANGE ON FIRST LOGIN**

**Staff Accounts:**
- `staff1@homeliving.com` / `staff123`
- `staff2@homeliving.com` / `staff123`
- `staff3@homeliving.com` / `staff123`
- `staff4@homeliving.com` / `staff123`

**Public Pages:**
- Order Tracking: `https://homeliving.yourdomain.com/store/{storeId}/track-order`
- Test Order Form: `https://homeliving.yourdomain.com/store/{storeId}/test-order`

**Store ID:** (Get from database or backend logs)

---

### Store 4: Fitness Gear Pro

**Dashboard Access:**
- **URL:** `https://fitness.yourdomain.com` OR `https://admin.yourdomain.com`
- **Admin Email:** `admin@fitnessgear.com`
- **Admin Password:** `admin123` ⚠️ **MUST CHANGE ON FIRST LOGIN**

**Staff Accounts:**
- `staff1@fitnessgear.com` / `staff123`
- `staff2@fitnessgear.com` / `staff123`
- `staff3@fitnessgear.com` / `staff123`
- `staff4@fitnessgear.com` / `staff123`

**Public Pages:**
- Order Tracking: `https://fitness.yourdomain.com/store/{storeId}/track-order`
- Test Order Form: `https://fitness.yourdomain.com/store/{storeId}/test-order`

**Store ID:** (Get from database or backend logs)

---

### Store 5: Beauty Essentials

**Dashboard Access:**
- **URL:** `https://beauty.yourdomain.com` OR `https://admin.yourdomain.com`
- **Admin Email:** `admin@beautyessentials.com`
- **Admin Password:** `admin123` ⚠️ **MUST CHANGE ON FIRST LOGIN**

**Staff Accounts:**
- `staff1@beautyessentials.com` / `staff123`
- `staff2@beautyessentials.com` / `staff123`
- `staff3@beautyessentials.com` / `staff123`
- `staff4@beautyessentials.com` / `staff123`

**Public Pages:**
- Order Tracking: `https://beauty.yourdomain.com/store/{storeId}/track-order`
- Test Order Form: `https://beauty.yourdomain.com/store/{storeId}/test-order`

**Store ID:** (Get from database or backend logs)

---

## Client Onboarding Checklist

For each client, provide:

### ✅ Email Template

**Subject:** Your Shopify Admin Dashboard Access

**Body:**
```
Dear [Client Name],

Your admin dashboard is now live! Here's how to access it:

🔐 Login Credentials:
- Dashboard URL: [STORE_URL]
- Email: [ADMIN_EMAIL]
- Temporary Password: admin123

⚠️ IMPORTANT: Please change your password immediately after first login.

📚 User Guide:
Please review the attached user guide (USER_GUIDE.md) for complete instructions on using the dashboard.

🌐 Public Pages:
- Order Tracking: [TRACK_ORDER_URL]
- Test Order Form: [TEST_ORDER_URL]

📞 Support:
If you have any questions or need assistance, please contact [YOUR_SUPPORT_EMAIL].

Best regards,
[Your Name]
```

### ✅ Documents to Send

1. **Login credentials** (as shown above)
2. **USER_GUIDE.md** - Complete user guide
3. **Dashboard URL** - Direct link to their dashboard
4. **Public page URLs** - Order tracking and test order form
5. **Support contact** - Your email/phone for assistance

### ✅ First Login Instructions

1. Visit dashboard URL
2. Click "Login"
3. Enter admin email and temporary password
4. **IMMEDIATELY change password** in Settings → My Profile
5. Explore dashboard features
6. Review user guide

---

## Security Recommendations

### ⚠️ Before Giving Access:

1. **Change all default passwords** - Force password change on first login
2. **Enable 2FA** (if implemented) - Add two-factor authentication
3. **Review permissions** - Ensure staff accounts have appropriate permissions
4. **Test access** - Verify each client can only see their own data
5. **Document store IDs** - Keep track of which store ID belongs to which client

### 🔒 Password Requirements

Recommend clients use:
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, special characters
- Not a dictionary word
- Unique password (not used elsewhere)

---

## Store ID Lookup

To find store IDs for public URLs:

**Option 1: Database Query**
```sql
SELECT id, name, domain FROM stores;
```

**Option 2: Backend Logs**
Check server logs when stores are created

**Option 3: API Endpoint**
Create a public endpoint: `GET /api/stores` that returns store list with IDs

---

## Custom Domain Setup (Optional)

If clients want to use their own domains:

1. **Client provides domain** (e.g., `admin.clientdomain.com`)
2. **Add DNS A record** pointing to your VPS IP
3. **Add domain to Nginx config**
4. **Generate SSL certificate** for new domain
5. **Update CORS_ORIGIN** in backend `.env`
6. **Update frontend** `.env.production` if needed

---

## Support & Maintenance

### Regular Tasks:

- [ ] Monitor client access logs
- [ ] Check for failed login attempts
- [ ] Review database backups
- [ ] Update software regularly
- [ ] Respond to client support requests

### Client Communication:

- **Weekly:** Check-in email (optional)
- **Monthly:** Usage report (optional)
- **As needed:** Support requests

---

## Troubleshooting

### Client Can't Login:
1. Verify email is correct
2. Check if account is active
3. Verify password (case-sensitive)
4. Check server logs for errors
5. Verify storeId matches

### Client Sees Wrong Data:
1. Verify storeId in JWT token
2. Check database queries filter by storeId
3. Verify client is logging in with correct account
4. Check backend logs for storeId filtering

### Public Pages Not Working:
1. Verify storeId in URL is correct
2. Check API endpoint accepts storeId parameter
3. Verify CORS allows public domain
4. Check Nginx configuration

---

## Quick Reference

**All Stores Default Settings:**
- Currency: PKR (Pakistani Rupee)
- Country: Pakistan (PK)
- Default Admin Password: `admin123` (MUST CHANGE)
- Default Staff Password: `staff123` (MUST CHANGE)

**Data Per Store:**
- 250-300 customers
- 500-700 orders (last 1 year)
- 30-40 products
- 1 admin + 3-5 staff accounts

---

**Last Updated:** December 2024

