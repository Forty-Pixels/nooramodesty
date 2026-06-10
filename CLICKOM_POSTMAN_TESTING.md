# Clickom Postman Testing Checklist

Use this file only to verify Clickom API response shapes before final integration.

## Safety

- Do not commit real tokens, passwords, or API responses with secrets.
- Redact `x-api-key`, login tokens, passwords, customer phone numbers, and addresses before sharing.
- Do not intentionally create duplicate orders or duplicate invoice numbers unless Clickom confirms it is safe.

## Environment

Base URL:

```txt
https://nooramodesty.com
```

Postman environment variables:

```txt
CLICKOM_BASE_URL=https://nooramodesty.com
CLICKOM_TOKEN=
```

## 1. Get Login Token

Request:

```txt
POST {{CLICKOM_BASE_URL}}/api/customapi/login
```

Headers:

```txt
Accept: application/json
```

Body type: `form-data`

Fields:

```txt
client_id
client_secret
username
password
```

Need to confirm:

```txt
Which response field contains the token?
Examples: access_token, token, data.token
```

Save token into Postman variable:

```txt
CLICKOM_TOKEN
```

Share response shape with token redacted.

## 2. Test Products Endpoint

Request:

```txt
GET {{CLICKOM_BASE_URL}}/api/customapi/products
```

Headers:

```txt
Accept: application/json
x-api-key: {{CLICKOM_TOKEN}}
```

Need to confirm one product shape, especially:

```txt
product_id
variations[].product_variation_id
variations[].sub_variations[].variation_id
```

These IDs must be copied into Sanity.

## 3. Test Stock By Variation

Request:

```txt
GET {{CLICKOM_BASE_URL}}/api/customapi/stocks/{variation_id}
```

Example:

```txt
GET {{CLICKOM_BASE_URL}}/api/customapi/stocks/19
```

Headers:

```txt
Accept: application/json
x-api-key: {{CLICKOM_TOKEN}}
```

Need to confirm:

```txt
qty_available
```

Expected shape:

```json
{
  "product_id": 10,
  "variation_id": 29,
  "variation_name": "Black",
  "sub_sku": "0010-1",
  "qty_available": 1
}
```

If possible, test one in-stock and one out-of-stock variation.

## 4. Test Existing Sale Lookup

Use only if a real Clickom sale already exists.

Request:

```txt
GET {{CLICKOM_BASE_URL}}/api/customapi/sales/?custom_order_id={sanity_order_id}
```

Headers:

```txt
Accept: application/json
x-api-key: {{CLICKOM_TOKEN}}
```

Need to confirm:

```txt
Response shape when sale exists
Response shape when sale does not exist
```

This is needed for duplicate approval protection.

## 5. Test Sale Status Pull

Use only if a real approved order/sale exists.

Request:

```txt
GET {{CLICKOM_BASE_URL}}/api/customapi/sales_status?customer_order_id={sanity_order_id}
```

Headers:

```txt
Accept: application/json
x-api-key: {{CLICKOM_TOKEN}}
```

Need to confirm returned `status` values.

Example shape from docs:

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

Need final mapping:

```txt
final = ?
pending = ?
processing = ?
cancelled = ?
refunded = ?
```

## 6. Do Not Test Yet

Do not test these until Clickom confirms safe test data/process:

```txt
POST /api/customapi/sales
PUT /api/customapi/sales/{custom_order_id}
DELETE /api/customapi/sales/?custom_order_id={id}
POST /api/customapi/sales_status?customer_order_id={id}&status={code}
```

These can mutate OMS records.

## What To Send Back

Send redacted JSON for:

```txt
1. Login response
2. One product with variations/sub-variations
3. One stock response
4. Existing sale lookup response, if available
5. Sale status response, if available
```

