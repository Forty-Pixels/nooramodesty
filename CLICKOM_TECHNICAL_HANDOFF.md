# Noora Modesty x Clickom Technical Handoff

Last updated: 21 June 2026

## Goal

Website orders should move through this flow:

1. Customer places order on Noora Modesty website.
2. Website stores order in Sanity CMS/backend.
3. Order appears in Sanity admin as pending approval.
4. Noora admin reviews customer details, items, payment method, and payment slip.
5. Admin clicks Approve.
6. Our backend pushes the approved order to Clickom Custom API.
7. The order should appear in Clickom OMS dashboard, ideally in Order Management.
8. Clickom operations team fulfills/manages the order.

No order is pushed to Clickom at checkout. Clickom push only happens after Noora admin approval.

## Current Clickom API Config

Base URL:

```txt
https://nooramodestynew.clickom.lk
```

Auth flow:

```txt
POST /api/customapi/login
```

Request body type: `form-data`

Fields:

```txt
client_id
client_secret
username
password
```

Login response shape:

```json
{
  "success": true,
  "token": "<jwt>"
}
```

Protected request headers:

```txt
Accept: application/json
Authorization: Bearer <token>
Content-Type: application/json
```

Important: `x-api-key` did not work for this API user. Bearer token works.

## Confirmed Working Clickom Reads

These were tested successfully:

```txt
GET /api/customapi/products
GET /api/customapi/stocks
GET /api/customapi/categories
GET /api/customapi/variations
GET /api/customapi/sales_status/{custom_order_id}
```

Observed:

- `/products` is paginated.
- `/stocks` returns `qty_available`.
- API rate limit appears to be 60 requests/minute.

## Confirmed Working Clickom Sale Create

Endpoint:

```txt
POST /api/customapi/sales
```

Test sale created:

```txt
transaction_id: 1510
invoice_no: NM-20260621-6626
custom_order_id: 606216626
customer: TERMINAL TEST DO NOT FULFILL
phone: 0700000000
```

Success response:

```json
{
  "success": true,
  "transaction_id": 1510,
  "invoice_no": "NM-20260621-6626"
}
```

Status read confirms it exists:

```txt
GET /api/customapi/sales_status/606216626
```

Response:

```json
{
  "success": true,
  "data": {
    "customer_order_id": "606216626",
    "status": "sp",
    "call_status": "pending",
    "order_status": "pending",
    "shipping_status": "ordered",
    "payment_status": "paid"
  }
}
```

## Important API Findings

### `custom_order_id`

`custom_order_id` must be an integer.

This fails:

```txt
custom_order_id = Sanity document _id
```

Clickom response:

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": {
    "custom_order_id": ["The custom order id must be an integer."]
  }
}
```

Our workaround:

- Generate numeric `clickomCustomOrderId`.
- Store it on Sanity order.
- Use it for Clickom sale create, sale update, and status lookup.

Example:

```txt
Sanity order _id: y2MFYERGQO0IvWXX5XNjhG
orderNumber: NM-20260621-6626
clickomCustomOrderId: 606216626
```

### Status Push

The documented status push endpoint did not work:

```txt
POST /api/customapi/sales_status?customer_order_id={id}&status=sp
```

Observed:

```txt
404 route not found
```

This also did not work:

```txt
POST /api/customapi/sales_status/{id}?status=sp
```

Observed:

```txt
405 method not allowed, supported methods: GET, HEAD
```

Working workaround:

```txt
PUT /api/customapi/sales/{custom_order_id}
```

with the full sale payload plus:

```json
{
  "status": "sp"
}
```

Result:

- `PUT` returned `200`.
- Follow-up `GET /sales_status/606216626` showed `status: "sp"`.

## Sanity Order Schema

Sanity document type:

```txt
order
```

Main fields:

```txt
_id
orderNumber
customer
items
paymentMethod
paymentSlip
paymentSlipUrl
paymentSlipUploadedAt
adminStatus
status
clickomCustomOrderId
clickomSaleId
clickomTransactionId
clickomInvoiceNo
placedAt
approvedAt
couponCode
discountAmount
totalAmount
```

Customer fields:

```txt
fullName
mobile
email
addressLine1
addressLine2
city
zipCode
```

Order item fields:

```txt
productId
title
slug
image
clickomProductId
clickomVariationId
quantity
unitPrice
selectedColor
selectedSize
customSize
customNote
```

Admin statuses:

```txt
pending_approval
approved
rejected
```

Website order statuses:

```txt
pending
processing
shipped
completed
cancelled
```

Payment methods:

```txt
cod
bank_transfer
```

Mapped to Clickom:

```txt
cod -> method: cash, payment_status: due, amount: 0
bank_transfer -> method: bank_transfer, payment_status: paid, amount: order total
```

## Backend API Routes On Our Side

Customer checkout:

```txt
POST /api/orders/create
```

Creates Sanity order only. Does not call Clickom.

Admin approve:

```txt
POST /api/orders/approve
```

Flow:

1. Validate admin secret.
2. Fetch pending Sanity order.
3. Build Clickom sale payload.
4. `POST /api/customapi/sales`.
5. Store Clickom IDs in Sanity.
6. Set Sanity `adminStatus: approved`.
7. Set Sanity `status: processing`.

Admin reject:

```txt
POST /api/orders/reject
```

Updates Sanity only.

Admin status sync:

```txt
POST /api/orders/status-sync
```

Pulls:

```txt
GET /api/customapi/sales_status/{clickomCustomOrderId}
```

Then updates Sanity order status.

Admin status push:

```txt
POST /api/orders/status
```

Uses workaround:

```txt
PUT /api/customapi/sales/{clickomCustomOrderId}
```

with full sale payload plus `status`.

Stock:

```txt
GET /api/stocks/{variationId}
```

Pulls Clickom stock and returns:

```json
{
  "variationId": "6",
  "inStock": true,
  "stock": 1
}
```

## Clickom Sale Payload We Send

Example shape:

```json
{
  "invoice_no": "NM-20260621-6626",
  "custom_order_id": 606216626,
  "transaction_date": "2026-06-21",
  "mobile": "0700000000",
  "customer_full_name": "TERMINAL TEST DO NOT FULFILL",
  "customer_address_line_1": "Terminal test address",
  "customer_address_line_2": "Do not ship",
  "customer_city": "Colombo",
  "customer_zip_code": "00000",
  "customer_country": "Sri Lanka",
  "discount_type": "fixed",
  "discount_amount": 0,
  "payment_status": "due",
  "products": [
    {
      "product_id": 6,
      "variation_id": 6,
      "quantity": 1,
      "unit_price": 100,
      "unit_price_inc_tax": 100,
      "enable_stock": 0
    }
  ],
  "payment": [
    {
      "amount": 0,
      "method": "cash",
      "note": "COD order via Noora Modesty"
    }
  ]
}
```

Payment status handling:

```txt
COD orders are pushed as payment_status: due.
Bank transfer orders are pushed as payment_status: paid after Sanity admin approval.
Clickom also supports partial, but Noora does not currently collect partial payments on the website.
```

For status push workaround, same payload plus:

```json
{
  "status": "sp"
}
```

## What We Need From Clickom

### Dashboard Visibility

The test sale exists by API but is not visible to our dashboard user in:

```txt
https://nooramodestynew.clickom.lk/ordermanagement/order
```

Also:

```txt
https://nooramodestynew.clickom.lk/sells
```

returns:

```txt
403 Unauthorized
```

We need confirmation/access for:

```txt
Order Management
Sales/Sells
All relevant Business Locations
Custom API-created sales/orders
```

### Exact Dashboard Location

Please confirm where API-created sales should appear:

```txt
Order Management
Sales/Sells
Another dashboard screen
```

### Required Fields For Order Management

If API-created sales should appear in Order Management, please confirm whether any of these fields must be sent:

```txt
call_status
order_status
shipping_status
delivery_status
payment_status
resource
business_location
location_id
created_user
created_by
waybill_no
delivery_partner
courier
dispatch_date
sale_date
```

If a field is optional, we can leave it blank. If required, we can wire it from our side.

### Endpoint Clarification

Please confirm:

1. Does `POST /api/customapi/sales` create an Order Management row?
2. If not, which endpoint creates an Order Management order?
3. Is `PUT /api/customapi/sales/{custom_order_id}` with full payload + `status` the intended way to update status?
4. Is there a separate status-write endpoint that should work?
5. Which dashboard role/permission is required to view `transaction_id: 1510`?

## Exact Test Record To Check

Please search on Clickom side:

```txt
transaction_id: 1510
invoice_no: NM-20260621-6626
custom_order_id: 606216626
customer: TERMINAL TEST DO NOT FULFILL
phone: 0700000000
```

This is a test order. Do not fulfill it.
