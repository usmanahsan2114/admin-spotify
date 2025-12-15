[ ] Security - HTTP Parameter Pollution

Target File: backend/server.js

The Issue: The middleware configuration lists `Body Parser` and `CORS` but omits HPP protection, allowing array injection into string-expecting logic (DoS risk).

The Fix: Install `hpp` and register it as `app.use(hpp())` immediately after the body parser middleware to sanitize repeated query parameters.

[ ] Security - Operator Injection

Target File: backend/middleware/validation.js

The Issue: Request bodies passed directly to Sequelize `where` clauses without sanitization allow attackers to inject operators (e.g., `$ne`) to bypass authentication.

The Fix: Implement a sanitizer middleware that recursively strips keys starting with `$` or containing Sequelize operator aliases from `req.body` and `req.query` before controller execution.

[ ] Security - Prototype Pollution

Target File: backend/utils/columnDetector.js

The Issue: The "Smart Import Logic" uses fuzzy matching to map CSV headers to objects, posing a risk of modifying `Object.prototype` if malicious headers (e.g., `__proto__`) are uploaded.

The Fix: Implement a check to strictly reject or skip keys named `__proto__`, `constructor`, or `prototype` during the header mapping iteration.

[ ] Edge Case - Checkout Race Condition (TOCTOU)

Target File: backend/controllers/orderController.js

The Issue: Checkout validation and order submission are separate endpoints, creating a latency gap where stock can be depleted by another user between the check and the write.

The Fix: Wrap the stock deduction in a database transaction with a row-level lock (`transaction.LOCK.UPDATE`) on the `Products` table inside the `submitOrder` handler.

[ ] Logic - Cumulative Partial Refund Validation

Target File: backend/controllers/returnController.js

The Issue: Returns are tracked separately, but `Orders` store items as a JSON blob, making it difficult to enforce that the sum of multiple partial returns does not exceed the original ordered quantity.

The Fix: Parse all existing `Returns` for the target `orderId`, sum the previously returned quantities per SKU, and validate `(new_return_qty + total_returned) <= ordered_qty` before creation.

[ ] Edge Case - Return Approval Idempotency

Target File: backend/controllers/returnController.js

The Issue: Concurrent requests to the `approveReturn` endpoint can trigger the restock logic multiple times for the same return ID, inflating inventory.

The Fix: Execute the status update inside a transaction that explicitly checks `if (return.status === 'Approved') throw Error` *before* incrementing the product stock.

[ ] Logic - Status Transition Conflict

Target File: backend/controllers/orderController.js

The Issue: Race conditions between "Shipped" and "Cancelled" updates can result in a state where items are physically shipped but stock is refunded/restocked.

The Fix: Implement a state machine check inside the update transaction that prevents transitioning to 'Cancelled' if the current status is already 'Shipped' or 'Delivered'.

[ ] Scalability - Schema Normalization

Target File: backend/models/Product.js

The Issue: The current schema uses a flat catalog strategy where variants are separate rows or implicit JSON, preventing atomic inventory locking for specific attribute combinations (Size/Color).

The Fix: Refactor the schema to introduce a `ProductVariants` table with its own `stockQuantity` column to allow precise locking and inventory management.

[ ] Security - JWT Secret Enforcement

Target File: backend/middleware/authMiddleware.js

The Issue: Deployment documentation suggests generating a secret but does not strictly enforce a minimum length or existence at runtime, risking weak signatures in production.

The Fix: Add a startup check in `server.js` that throws a hard error if `NODE_ENV === 'production'` and `JWT_SECRET` is missing or shorter than 32 characters.

Based on the architecture summary and common pitfalls in Node.js/Sequelize commerce implementations, I have generated the strict `REFACTOR_TASKS.md` below.

**Architectural Note:** The most critical "Junior Dev" vulnerability detected is the handling of **Webhooks** and **Inventory Concurrency**. Your current reliance on simple CRUD (Sequelize `update`) for inventory will lead to overselling during high-traffic events, and standard JSON parsing will break Shopify HMAC verification.

-----

# REFACTOR\_TASKS.md

## 1\. Inventory Concurrency & Race Conditions

**Severity:** 🔴 **Critical**
**Component:** `controllers/inventoryController.js`

  * **The Vulnerability:** A standard Sequelize update (`product.update({ stockQuantity: 5 })`) is not atomic. If two customers buy the last item simultaneously, both threads read `stock: 1`, decrease it to `0`, and save. The database records `0` but **two** orders are processed for one item.
  * **The Fix:** You must move from "Read-Modify-Write" logic to "Atomic Delta" logic using SQL increment/decrement.
  * **Task:**
      * [ ] Refactor `decrementStock` function to use Sequelize `increment`:
        ```javascript
        // BAD:
        // product.stockQuantity -= 1;
        // await product.save();

        // GOOD (Atomic):
        await Product.decrement('stockQuantity', {
          by: 1,
          where: { id: productId, stockQuantity: { [Op.gt]: 0 } }
        });
        ```
      * [ ] Verify the return value. If the row was not affected (quantity was 0), immediately throw `OutOfStockError`.

## 2\. Webhook Security: The "Raw Body" Trap

**Severity:** 🔴 **Critical**
**Component:** `middleware/webhookVerifier.js`

  * **The Vulnerability:** Most Express apps use `app.use(express.json())` globally. This parses the request body *before* your verification middleware runs. Shopify's HMAC signature is generated from the **raw buffer**. If you verify against the parsed JSON, the signature will mismatch due to whitespace/formatting differences, causing you to either reject valid webhooks or (worse) disable verification to "make it work."
  * **The Fix:**
      * [ ] Create a custom middleware that preserves the `rawBody` buffer only for webhook routes *before* standard JSON parsing.
      * [ ] Implement **Replay Attack Protection**: Check the `X-Shopify-Hmac-Sha256` header AND compare the current timestamp against a 5-minute window to prevent attackers from re-sending old captured packets.
      * [ ] Implement **Idempotency**: Store `X-Shopify-Webhook-Id` in Redis/DB with a 24h TTL. If a webhook ID is seen again, return `200 OK` immediately without processing.

## 3\. Multi-Tenant Isolation (BOLA/IDOR Prevention)

**Severity:** 🟠 **High**
**Component:** `middleware/auth.js` & `models/index.js`

  * **The Vulnerability:** Relying on the frontend to send `storeId` or checking it only once at login is insufficient. A Junior Dev often writes: `Order.findOne({ where: { id: req.params.id } })`. This allows Store A to view Store B's order simply by guessing the ID (Broken Object Level Authorization).
  * **The Fix:**
      * [ ] Implement **Scoped Models**. Never use `Order.findOne`. Create a wrapper or Sequelize Scope that *automatically* injects the `storeId` from the authenticated session into every query.
      * [ ] Refactor code to: `Order.findOne({ where: { id: req.params.id, storeId: req.user.storeId } })`.

## 4\. Financial Precision & Rounding Errors

**Severity:** 🟠 **High**
**Component:** `models/Order.js` & `utils/currency.js`

  * **The Vulnerability:** Using standard JavaScript `Number` (floating point) for currency (e.g., `19.99 * 3 = 59.96999999999`). This causes penny discrepancies in tax and refund calculations that will fail reconciliation against Shopify's API.
  * **The Fix:**
      * [ ] Refactor all Database Schema definitions for currency fields from `FLOAT` to `DECIMAL(10,2)` (or `BIGINT` storing cents).
      * [ ] Adopt a library like `dinero.js` or `currency.js` for all backend math. Never perform raw math operators (`*`, `/`, `+`) on prices.

## 5\. Idempotency Key Implementation (POST Requests)

**Severity:** 🟡 **Medium**
**Component:** `controllers/checkoutController.js`

  * **The Vulnerability:** If a user clicks "Pay" twice, or if the network hangs and the client retries, your API will create two orders and charge the card twice.
  * **The Fix:**
      * [ ] Add `idempotencyKey` column to `Orders` table (unique constraint).
      * [ ] Middleware logic:
        1.  Check headers for `Idempotency-Key`.
        2.  Query DB: Does this key exist?
        3.  If YES: Return the *previous* response immediately (do not re-process).
        4.  If NO: Process order, save key, return response.