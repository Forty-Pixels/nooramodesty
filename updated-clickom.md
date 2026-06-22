# Noora Modesty × Clickom — Integration Reference

**Last updated:** 21 June 2026
**Source:** Clickom Custom Global API doc (latest revision) + live endpoint testing

---

## 1. Architecture (unchanged)

- **Sanity** owns the order lifecycle from placement → admin approval.
- **Clickom OMS** owns it from approval → delivery.
- **Netlify Functions** are the only bridge between the two. Sanity and Clickom never talk directly.
- **Stock** is fetched live from Clickom (`qty_available`), never stored in Sanity.
- **Admin panel** lives inside Sanity Studio via custom tools — no separate dashboard.

---

## 2. Authentication — CONFIRMED

The integration uses the **two-step login flow**, not a static key.

### Step 1 — Get a token

`POST https://nooramodestynew.clickom.lk/api/customapi/login`

Send as **form-data**:

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| `client_id`     | `1`                                        |
| `client_secret` | `vhVOnP0ZirB8rkWWavqG5V3DfZFbEboUdwjGxSjS` |
| `username`      | `developer`                                |
| `password`      | `Changeme@0000`                            |

### Step 2 — Read the token

Response shape (**confirmed via live test**):

```json
{ "success": true, "token": "<jwt>" }
```

- Token field is **`token`**, top-level (not `access_token`, not `data.token`).
- JWT lifetime is **~1 year** (`exp` ≈ mid-2027 on a token issued early 2026).
- It's a Laravel Passport RS256 JWT. `scopes: []` is fine — access is **not** gated by scopes (confirmed: an empty-scope token successfully reads `/products`).

### Step 3 — Use it

Send **two** headers on every subsequent request:

```
Authorization: Bearer <token>
accept: application/json
```

- The auth header is **`Authorization: Bearer <token>`** — **NOT `x-api-key`**. The `x-api-key` note in the Clickom doc is wrong/stale; live testing confirms Bearer works and `x-api-key` returns `401 Unauthenticated`.
- **`accept: application/json` is mandatory.** Without it, auth failures and some errors return a `302` redirect to the web login page instead of a clean JSON `401`/error — which makes debugging misleading. Always force JSON.

> The static `x-api-key` JWT printed in the doc's "Note" section is a sample and uses the wrong header scheme entirely. Build around the login flow + Bearer header. Cache the token, refresh on expiry or on a 401.

---

## 3. Base URL — CONFIRMED

Use **`https://nooramodestynew.clickom.lk`** across dev/staging/production.

The `nooramodesty.com` reference in earlier material was an internal label, not a DNS requirement. The `.clickom.lk` host is live and is the one the doc consistently uses (including the login screenshot). No domain/DNS access was ever requested by Clickom, which is consistent with this.

---

## 4. Endpoints

All paths are relative to `https://nooramodestynew.clickom.lk/api/customapi`.

| Purpose             | Method   | Path                                                 |
| ------------------- | -------- | ---------------------------------------------------- |
| Login               | POST     | `/login`                                             |
| Get products        | GET      | `/products`                                          |
| Get categories      | GET      | `/categories`                                        |
| Get units           | GET      | `/units`                                             |
| Get variations      | GET      | `/variations`                                        |
| Get stock (all)     | GET      | `/stocks`                                            |
| Get stock (one)     | GET      | `/stocks/{id}`                                       |
| Create sale         | POST     | `/sales`                                             |
| Update sale         | PUT      | `/sales/{custom_order_id}`                           |
| Get sale            | GET      | `/sales/?custom_order_id={id}`                       |
| **Set sale status** | **PUT**  | `/sales/{custom_order_id}` with full sale payload + `status` |
| Get sale status     | GET      | `/sales_status/{custom_order_id}`                    |

---

## 5. Key field facts

### Stock

- Quantity field is **`qty_available`**. Fetch live, never persist.

### Pagination & rate limits (confirmed via live test)

- `GET /products` is **paginated**. The real response is `{ "success": true, "data": { "current_page": 1, "data": [ ... ] } }` — NOT the flat array shown in the Clickom doc sample. Walk pages with `?page=2`, `?page=3`… until exhausted.
- **Rate limit is 60 requests/minute** (`x-ratelimit-limit: 60`, `x-ratelimit-remaining` decrements per call). Cache the token, batch reads, and back off near the limit.
- Note: at time of testing, all live products returned `stock: 0`. Confirm real stock exists before relying on stock-gating in dev, or every product reads out-of-stock.

### Sale creation (`POST /sales`)

- Returns **`transaction_id`** — store this in Sanity as the OMS sale reference.
- `custom_order_id` must be an **integer**. Do not send the Sanity document `_id`; store a numeric `clickomCustomOrderId` on the Sanity order and use that for status lookups.
- **Both** `unit_price` (excl. tax) and `unit_price_inc_tax` (incl. tax) are required per product. If no tax, send the same value for both.
- `transaction_date` (`yyyy-mm-dd`) **must not be before Clickom's internal sync date**, or the sale is silently skipped:
  ```json
  {
    "success": false,
    "skipped": true,
    "status_code": 422,
    "message": "Sale skipped: transaction date (...) is before sync date (...)."
  }
  ```
- Do **not** send `shipping_charges` / `delivery_fee`. Clickom auto-appends the delivery fee from the default courier in Custom API Settings. If sending a paid payment, make sure the payment total covers product cost **+** delivery fee, or the invoice shows a balance due.
- Duplicate `invoice_no` or `custom_order_id` → **500** with a "Duplicate ..." message.

### Sale status (set)

The documented `POST /sales_status` route is not registered on the live API. The working status-push workaround is `PUT /sales/{custom_order_id}` with the same full payload as sale creation plus `status`.

| Code | Status     |
| ---- | ---------- |
| `pd` | pending    |
| `pc` | processing |
| `oh` | on-hold    |
| `cp` | completed  |
| `cn` | cancelled  |
| `rf` | refunded   |
| `fl` | failed     |
| `sp` | shipped    |

---

## 6. What changed in this revision

1. **Auth is the login flow + Bearer header.** Earlier assumption (static `x-api-key`) is wrong on two counts: the static key is just a sample, AND the header scheme is wrong. Confirmed via live test: `Authorization: Bearer <token>` works; `x-api-key` returns `401`. Login issues a working ~1-year JWT.
2. **`accept: application/json` is required** on every call. Without it, failures `302`-redirect to the web login page instead of returning clean JSON errors.
3. **Token field name resolved → `token`** (top-level). Scopes being empty is fine — access is not scope-gated.
4. **Products endpoint is paginated** (`data.current_page` / `data.data[]`), not the flat array in the doc sample.
5. **Rate limit is 60/min.**
6. **Sale status read endpoint is `GET /sales_status/{custom_order_id}`.** Status push works through `PUT /sales/{custom_order_id}` with full sale payload + `status`.
7. **`transaction_date` is effectively required** and gated by Clickom's sync date — sales dated before it are silently dropped.
8. **Base URL confirmed** as `nooramodestynew.clickom.lk`.

---

## 7. Still open (needs Clickom)

These cannot be reliably resolved by probing alone:

1. **Full list of returned `sales_status` values.** `GET /sales_status/{custom_order_id}` only shows values observed on test orders, e.g. `"status": "final"` + `payment_status: "paid"`. The returned lifecycle strings aren't enumerated.
2. **Duplicate invoice `-R1` retry.** Whether appending `-R1` to a duplicated invoice and retrying once is an acceptable workaround. Testable but destructive (creates real sales in their DB) — better to ask than to litter.
3. **Clickom's follow-up document** (sent after the last back-and-forth) still hasn't been reviewed — it may resolve the above.

> Auth is fully resolved by live testing — no Clickom confirmation needed there anymore.

---

## 8. How to proceed

1. **Build the token helper** in the Netlify Functions bridge: login → cache `token` + expiry → attach as `Authorization: Bearer` (+ `accept: application/json`) → auto-refresh on 401.
2. **Wire stock reads** to `qty_available`, fetched live per product/variation.
3. **Wire sale creation** with both price fields, a valid `transaction_date` (≥ sync date), no shipping params, and store the returned `transaction_id` back in Sanity.
4. **Handle the skip case** (`skipped: true`) and duplicate-500s explicitly — don't treat them as generic failures.
5. **Push sale status** using `PUT /sales/{clickomCustomOrderId}` with full sale payload + two-letter `status`, and pull status from `GET /sales_status/{clickomCustomOrderId}`.
6. **Send Clickom** the three open questions in section 7, and **review their follow-up doc** before finalising status-read handling.
