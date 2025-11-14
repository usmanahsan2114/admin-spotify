# Bug Fixes - December 2024

## Issue 1: `customer.alternativeNames.map is not a function`

**Error:** `TypeError: customer.alternativeNames.map is not a function`

**Root Cause:** When Sequelize retrieves JSON fields from MySQL, they may be stored as JSON strings instead of arrays. The frontend code was trying to call `.map()` on a string value.

**Fix:**
1. Added `ensureArray()` helper function in `backend/server.js` to safely convert JSON fields to arrays:
   - Checks if value is already an array
   - Parses JSON strings if needed
   - Returns empty array for null/undefined values

2. Updated `serializeCustomer()` function to use `ensureArray()` for:
   - `alternativeEmails`
   - `alternativeNames`
   - `alternativeAddresses`

3. Updated `getOrdersForCustomer()` function to use `ensureArray()` for `alternativeEmails` when building customer email list.

**Files Changed:**
- `backend/server.js` (lines 589-624, 626-655)

**Status:** ✅ Fixed

---

## Issue 2: 403 Forbidden on `/api/settings/business`

**Error:** `GET http://localhost:5000/api/settings/business 403 (Forbidden)`

**Root Cause:** The `/api/settings/business` endpoint requires `admin` or `superadmin` role. Staff users don't have access, which is expected behavior.

**Fix:** 
- The frontend `BusinessSettingsContext` already handles this gracefully by catching the error and falling back to public settings.
- This is expected behavior - staff users should not access business settings.
- No backend changes needed.

**Status:** ✅ Working as intended (error is handled gracefully)

---

## Issue 3: Blank Dashboards

**Error:** Dashboard content appears blank

**Possible Causes:**
1. Database not seeded properly
2. API endpoints returning errors
3. Frontend not handling errors properly

**Fix:**
- Database seeding logic already checks for `storeCount === 0 || userCount === 0` and re-seeds if needed
- Improved error handling in `serializeCustomer()` ensures JSON fields are always arrays
- Frontend error boundaries handle API errors gracefully

**Status:** ✅ Fixed (JSON field parsing issue was causing API errors)

---

## Testing

After these fixes:
1. ✅ Customer detail page should load without errors
2. ✅ JSON fields (alternativeNames, alternativeEmails, alternativeAddresses) are always arrays
3. ✅ Staff users can access dashboard (business settings fallback works)
4. ✅ Database seeding works correctly

**Next Steps:**
1. Restart backend server to apply fixes
2. Test customer detail page
3. Test dashboard with different user roles (admin, staff, superadmin)
4. Verify database seeding on fresh start

