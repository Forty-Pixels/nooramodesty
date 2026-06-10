# Clickom API Reference — Noora Modesty

### Base URL: `https://nooramodesty.com`

**Prepared by:** Forty Pixels · **Version:** 2.0 · **Date:** June 2026

> ⚠ This supersedes the previous endpoint reference. The base URL has changed and authentication now requires a token generation step before any API call.

---

## Authentication — How It Works Now

Authentication is **two-step.** You first call a login endpoint with your credentials to get a token, then use that token on every subsequent request.

### Step 1 — Generate Token

```
POST https://nooramodesty.com/api/customapi/login
Content-Type: multipart/form-data
```

**Credentials:**

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| `client_id`     | `8`                                        |
| `client_secret` | `KIRQ7DQkx31B84PYwTdFgQGF9uyUlRMJ8FzP5fqt` |
| `username`      | `admin`                                    |
| `password`      | `Changeme@0000`                            |

**curl command:**

```bash
curl -X POST 'https://nooramodesty.com/api/customapi/login' \
  -H 'Accept: application/json' \
  -F 'client_id=8' \
  -F 'client_secret=KIRQ7DQkx31B84PYwTdFgQGF9uyUlRMJ8FzP5fqt' \
  -F 'username=admin' \
  -F 'password=Changeme@0000'
```

This returns a token. Store it — you'll use it on every request.

> ⚠ **Unconfirmed:** The exact field name containing the token in the login response (e.g. `access_token`, `token`, `data.token`) has not been documented by Clickom. Confirm before writing the token helper function.

### Step 2 — Use Token on Every Request

Add the token as a header on every API call:

```
x-api-key: {token_from_step_1}
```

> ⚠ Tokens likely expire. When a request returns `401 Unauthenticated`, regenerate the token by repeating Step 1 and update it in your Netlify environment variables.

### Storing the Token in Netlify

Store the credentials as Netlify environment variables, not the token itself. Generate the token at runtime inside each Netlify Function:

```env
CLICKOM_BASE_URL=https://nooramodesty.com
CLICKOM_CLIENT_ID=8
CLICKOM_CLIENT_SECRET=KIRQ7DQkx31B84PYwTdFgQGF9uyUlRMJ8FzP5fqt
CLICKOM_USERNAME=admin
CLICKOM_PASSWORD=Changeme@0000
```

**Token generation helper (use in every Netlify Function):**

```js
async function getClickomToken() {
  const formData = new FormData();
  formData.append("client_id", process.env.CLICKOM_CLIENT_ID);
  formData.append("client_secret", process.env.CLICKOM_CLIENT_SECRET);
  formData.append("username", process.env.CLICKOM_USERNAME);
  formData.append("password", process.env.CLICKOM_PASSWORD);

  const res = await fetch(
    `${process.env.CLICKOM_BASE_URL}/api/customapi/login`,
    { method: "POST", body: formData },
  );
  const data = await res.json();
  return data.access_token; // ⚠ UNCONFIRMED — verify exact field name with Clickom (may be data.token, token, etc.)
}
```

---

## Important — Sync Date

This is new in this version of the API. Clickom has a **sync date** set on the account. Any sale with a `transaction_date` before that sync date will be **silently skipped** with a 422:

```json
{
  "success": false,
  "skipped": true,
  "status_code": 422,
  "message": "Sale skipped: transaction date (2026-05-04) is before sync date (2026-05-07)."
}
```

**Rule:** Always set `transaction_date` to today's date or later. Never backdate orders.

```js
transaction_date: new Date().toISOString().split("T")[0]; // "2026-06-01"
```

---

## Endpoint Reference

---

### 1. Generate Auth Token

**When:** Before any other API call, and whenever you get a 401 response

```
POST https://nooramodesty.com/api/customapi/login
```

---

### 2. Get All Products

**When:** Onboarding — fetch all product and variation IDs to map into Sanity

```
GET https://nooramodesty.com/api/customapi/products
x-api-key: {token}
```

**Key fields to copy into Sanity:**

| Clickom Field                                | Sanity Field                      |
| -------------------------------------------- | --------------------------------- |
| `product_id`                                 | `product.clickomProductId`        |
| `variations[].product_variation_id`          | `variation.clickomVariationId`    |
| `variations[].sub_variations[].variation_id` | `subVariation.clickomVariationId` |

> ⚠ Use `sub_variations[].variation_id` (not `product_variation_id`) in sale payloads.

---

### 3. Get Categories

**When:** Setup reference only

```
GET https://nooramodesty.com/api/customapi/categories
x-api-key: {token}
```

---

### 4. Get Units

**When:** Setup reference only

```
GET https://nooramodesty.com/api/customapi/units
x-api-key: {token}
```

---

### 5. Get Variations

**When:** Onboarding — full variation tree reference

```
GET https://nooramodesty.com/api/customapi/variations
x-api-key: {token}
```

---

### 6. Get All Stock

**When:** Admin stock audit or debugging

```
GET https://nooramodesty.com/api/customapi/stocks
x-api-key: {token}
```

---

### 7. Get Stock by Variation ⭐ Storefront — product page load

**When:** Every product page load, once per size/variation to drive the size selector UI

```
GET https://nooramodesty.com/api/customapi/stocks/{variation_id}
x-api-key: {token}
```

**Example:**

```bash
curl -X GET 'https://nooramodesty.com/api/customapi/stocks/19' \
  -H 'Accept: application/json' \
  -H 'x-api-key: {token}'
```

**Response:**

```json
{
  "product_id": 10,
  "variation_id": 29,
  "variation_name": "Black",
  "sub_sku": "0010-1",
  "qty_available": 1
}
```

> ✅ **Confirmed:** `qty_available` is the stock quantity field, consistent across both the bulk `/stocks` endpoint and `/stocks/{variation_id}` in all versions of the API docs.

**Size selector logic based on `qty_available`:**

```js
if (qty_available > 0)
  → show as available

if (qty_available === 0 && product.enablePreOrders === true)
  → show "Pre-Order Available" label, keep selectable

if (qty_available === 0 && product.enablePreOrders === false)
  → show as greyed out / disabled
```

> Cache this response for 60 seconds minimum to avoid flooding the API on simultaneous page loads.

---

### 8. Create Sale ⭐ Core integration — triggered on order approval

**When:** Admin approves an order in Sanity Studio — never at checkout

```
POST https://nooramodesty.com/api/customapi/sales
x-api-key: {token}
Content-Type: application/json
```

**Full payload for Noora Modesty:**

```json
{
  "invoice_no": "NM-20260601-0042",
  "custom_order_id": "sanity-document-_id",
  "transaction_date": "2026-06-01",
  "mobile": "0771234567",
  "customer_full_name": "Fatima Noor",
  "customer_address_line_1": "No. 12, Galle Road",
  "customer_address_line_2": "Colombo 03",
  "customer_city": "Colombo",
  "customer_country": "Sri Lanka",
  "customer_zip_code": "00300",
  "discount_type": "fixed",
  "discount_amount": 0,
  "products": [
    {
      "product_id": 5,
      "variation_id": 19,
      "quantity": 1,
      "unit_price": 4500.0,
      "unit_price_inc_tax": 4500.0,
      "enable_stock": 0
    }
  ],
  "payment": [
    {
      "amount": 4500.0,
      "method": "cash",
      "note": "COD order via Noora Modesty"
    }
  ]
}
```

**Payment method mapping:**

| Noora Modesty payment | Clickom `method` |
| --------------------- | ---------------- |
| Cash on Delivery      | `cash`           |
| Bank Transfer         | `bank_transfer`  |

**Rules — must always follow:**

- `enable_stock` always `0` — stock management is OFF
- `transaction_date` always today's date or later — never backdate
- `invoice_no` must be unique across all sales
- `custom_order_id` must be unique — use Sanity `_id`

**Success response:**

```json
{
  "success": true,
  "transaction_id": 278,
  "invoice_no": "NM-20260601-0042"
}
```

> ✅ **Confirmed:** `transaction_id` is the primary key of the saved sale in Clickom. Save this back to the Sanity order document as `clickomTransactionId` — this is your OMS reference for all future updates, status syncs, and exchanges on that order.

**Error handling:**

| Code  | Message                                         | Action                                     |
| ----- | ----------------------------------------------- | ------------------------------------------ |
| `422` | Field validation error                          | Log field, surface in Studio, fix mapping  |
| `422` | Sale skipped: transaction date before sync date | Set `transaction_date` to today            |
| `500` | Duplicate Invoice No                            | Append `-R1` to invoice number, retry once |
| `500` | Duplicate Customer order id                     | Do NOT retry — investigate double-click    |
| `500` | Internal server error                           | Log, surface in Studio, manual retry       |

---

### 9. Update Sale

**When:** Exchange initiated, or order correction needed post-approval

```
PUT https://nooramodesty.com/api/customapi/sales/{custom_order_id}
x-api-key: {token}
Content-Type: application/json
```

Payload is the same structure as Create Sale.

**Success response:**

```json
{
  "errorCode": 200,
  "message": "updated successfully."
}
```

---

### 10. Delete Sale

**When:** Post-approval cancellation only — most cancellations happen before OMS push

```
DELETE https://nooramodesty.com/api/customapi/sales/?custom_order_id={id}
x-api-key: {token}
```

After success, update Sanity order:

```js
await sanityClient
  .patch(orderId)
  .set({
    status: "cancelled",
    clickomTransactionId: null,
  })
  .commit();
```

---

### 11. Get Sale

**When:** Duplicate check before retrying a failed approval

```
GET https://nooramodesty.com/api/customapi/sales/?custom_order_id={id}
x-api-key: {token}
```

> Always call this before retrying a failed `POST /sales`. If a sale already exists for this `custom_order_id`, do not push again.

---

### 12. Update Sale Status ⭐ Push status to Clickom

**When:** Cancellation or manual status override from admin panel

> ⚠ Changed from GET to POST in this version of the API.

```
POST https://nooramodesty.com/api/customapi/sales_status?customer_order_id={id}&status={code}
x-api-key: {token}
```

**Status codes:**

| Code | Meaning    | When to use            |
| ---- | ---------- | ---------------------- |
| `pd` | Pending    | Order placed           |
| `pc` | Processing | Approved, being packed |
| `oh` | On Hold    | Awaiting payment       |
| `sp` | Shipped    | Dispatched             |
| `cp` | Completed  | Delivered              |
| `cn` | Cancelled  | Order cancelled        |
| `rf` | Refunded   | Refund processed       |
| `fl` | Failed     | Order failed           |

**Example — mark as cancelled:**

```bash
curl -X POST \
  'https://nooramodesty.com/api/customapi/sales_status?customer_order_id=sanity-id&status=cn' \
  -H 'Accept: application/json' \
  -H 'x-api-key: {token}'
```

---

### 13. Get Sale Status ⭐ Pull status from Clickom into Sanity

**When:** Admin clicks "Sync Status" or scheduled function runs

```
GET https://nooramodesty.com/api/customapi/sales_status?customer_order_id={id}
x-api-key: {token}
```

**Response:**

```json
{
  "data": {
    "customer_order_id": "sanity-doc-id",
    "status": "final",
    "call_status": "",
    "order_status": "",
    "shipping_status": null,
    "payment_status": "paid"
  }
}
```

> ⚠ **Partially confirmed:** The `status` field returns word values (e.g. `"final"`), NOT the shortcode abbreviations (`pd`, `pc`, `sp` etc). Those abbreviations are only used when **pushing** a status update via `POST /sales_status`. The full list of possible return values is unconfirmed — awaiting Clickom clarification.

> ⚠ **Unconfirmed:** Login response token field name (e.g. `access_token`, `token`) — awaiting Clickom confirmation.

> ⚠ **Unconfirmed:** Whether appending `-R1` to duplicate invoice numbers and retrying is acceptable — awaiting Clickom confirmation.

---

## Quick Reference

| #   | Endpoint                                             | Method | Called by        | When                       |
| --- | ---------------------------------------------------- | ------ | ---------------- | -------------------------- |
| 1   | `/api/customapi/login`                               | POST   | Netlify Function | Before every API call      |
| 2   | `/api/customapi/products`                            | GET    | Developer        | Onboarding                 |
| 3   | `/api/customapi/categories`                          | GET    | Developer        | Onboarding (optional)      |
| 4   | `/api/customapi/units`                               | GET    | Developer        | Onboarding (optional)      |
| 5   | `/api/customapi/variations`                          | GET    | Developer        | Onboarding                 |
| 6   | `/api/customapi/stocks`                              | GET    | Admin tool       | Bulk stock audit           |
| 7   | `/api/customapi/stocks/{variation_id}`               | GET    | Storefront       | Every product page load    |
| 8   | `/api/customapi/sales`                               | POST   | Netlify Function | On order approval          |
| 9   | `/api/customapi/sales/{custom_order_id}`             | PUT    | Netlify Function | Exchange / correction      |
| 10  | `/api/customapi/sales/?custom_order_id={id}`         | DELETE | Netlify Function | Post-approval cancellation |
| 11  | `/api/customapi/sales/?custom_order_id={id}`         | GET    | Netlify Function | Duplicate check            |
| 12  | `/api/customapi/sales_status?...&status={code}`      | POST   | Netlify Function | Push status to Clickom     |
| 13  | `/api/customapi/sales_status?customer_order_id={id}` | GET    | Netlify Function | Pull status into Sanity    |

---

## What Changed From v1 (Old Docs)

| Item                      | Old                                  | New                                     |
| ------------------------- | ------------------------------------ | --------------------------------------- |
| Base URL                  | `https://nooramodestynew.clickom.lk` | `https://nooramodesty.com`              |
| Authentication            | Static `x-api-key` JWT               | Login endpoint → dynamic token          |
| Sale status update method | `GET`                                | `POST`                                  |
| Sales response            | Generic success message              | Returns `transaction_id` + `invoice_no` |
| Transaction date          | Not required                         | Required — must not be before sync date |

---

## Environment Variables

```env
CLICKOM_BASE_URL=https://nooramodesty.com
CLICKOM_CLIENT_ID=8
CLICKOM_CLIENT_SECRET=KIRQ7DQkx31B84PYwTdFgQGF9uyUlRMJ8FzP5fqt
CLICKOM_USERNAME=admin
CLICKOM_PASSWORD=Changeme@0000
```

---

## First Test — Verify Everything Works

Run these in order to confirm the integration is live:

**Step 1 — Get token:**

```bash
curl -X POST 'https://nooramodesty.com/api/customapi/login' \
  -F 'client_id=8' \
  -F 'client_secret=KIRQ7DQkx31B84PYwTdFgQGF9uyUlRMJ8FzP5fqt' \
  -F 'username=admin' \
  -F 'password=Changeme@0000'
```

Copy the token from the response, then:

**Step 2 — Test products endpoint:**

```bash
curl -X GET 'https://nooramodesty.com/api/customapi/products' \
  -H 'Accept: application/json' \
  -H 'x-api-key: PASTE_TOKEN_HERE' \
  -L
```

If Step 2 returns product data — you're fully connected. 🟢

---

_Noora Modesty · Clickom API Reference v2.0 · Forty Pixels · [@fortypixelshq](https://instagram.com/fortypixelshq)_
