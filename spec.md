# Noora Modesty — Technical Specification

### Website Flow, Architecture & Developer Reference

**Version:** 1.0 · **Prepared by:** Forty Pixels · **Date:** May 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Data Layer — What Lives Where](#3-data-layer--what-lives-where)
4. [Sanity Schema Definitions](#4-sanity-schema-definitions)
5. [Netlify Functions — Serverless Logic](#5-netlify-functions--serverless-logic)
6. [Clickom OMS Integration](#6-clickom-oms-integration)
7. [Storefront — Page & Feature Specifications](#7-storefront--page--feature-specifications)
8. [Checkout Flow](#8-checkout-flow)
9. [Admin Panel — Sanity Studio Custom Tools](#9-admin-panel--sanity-studio-custom-tools)
10. [Returns, Exchanges & Refunds](#10-returns-exchanges--refunds)
11. [Homepage & Category Logic](#11-homepage--category-logic)
12. [Edge Cases & Empty States](#12-edge-cases--empty-states)
13. [Environment Variables & Configuration](#13-environment-variables--configuration)
14. [Build Checklist](#14-build-checklist)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER STOREFRONT                       │
│              Next.js · Hosted on Netlify                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
┌─────────────────┐      ┌──────────────────────┐
│   Sanity CMS    │      │  Netlify Functions   │
│                 │      │  (Serverless Logic)  │
│  • Products     │      │                      │
│  • Content      │      │  • POST order        │
│  • Orders       │      │  • Push to Clickom   │
│  • Returns      │      │  • Email confirm     │
│  • Admin UI     │      │  • Slip upload       │
│    (Studio)     │      │  • COD auto-convert  │
└────────┬────────┘      └──────────┬───────────┘
         │                          │
         │                          ▼
         │               ┌──────────────────────┐
         │               │    Clickom OMS API   │
         │               │                      │
         │               │  • Sales (CRUD)      │
         │               │  • Stock sync        │
         │               │  • Status updates    │
         │               │  • Exchanges         │
         │               └──────────────────────┘
         │
         ▼
┌─────────────────┐
│     NeonDB      │
│   (Standby)     │
│                 │
│  Activated if   │
│  Sanity API     │
│  limits hit or  │
│  relational     │
│  queries needed │
└─────────────────┘
```

### Key Principles

- **Serverless-first.** No persistent backend server. All logic runs in Netlify Functions (Lambda).
- **Sanity as the source of truth.** Content, products, orders, and admin UI all live in Sanity.
- **Clickom is the OMS only.** It handles fulfilment, stock, and exchange processing. It does not own the order lifecycle — Sanity does.
- **NeonDB is on standby.** Not used at launch unless Sanity API limits are reached or complex relational queries are required.

---

## 2. Tech Stack

| Layer              | Technology                  | Purpose                                          |
| ------------------ | --------------------------- | ------------------------------------------------ |
| Frontend           | Next.js (App Router)        | Storefront, pages, routing                       |
| CMS & Admin        | Sanity (Studio v3)          | Products, content, orders, custom admin tools    |
| Serverless         | Netlify Functions           | OMS integration, emails, uploads, scheduled jobs |
| Hosting            | Netlify                     | Frontend deployment, CDN                         |
| Database (standby) | NeonDB (PostgreSQL)         | Overflow/relational data if Sanity limits hit    |
| OMS                | Clickom Custom API          | Fulfilment, stock, sales, exchanges              |
| Email              | Resend (recommended)        | Transactional emails (order confirmation)        |
| File Storage       | Sanity Assets or Cloudinary | Payment slip uploads                             |
| Styling            | Tailwind CSS                | UI styling                                       |

---

## 3. Data Layer — What Lives Where

This is the most important architectural decision. Everything possible lives in Sanity.

### Lives in Sanity

| Data                | Sanity Document Type | Notes                                           |
| ------------------- | -------------------- | ----------------------------------------------- |
| Products            | `product`            | Name, images, description, variations, toggles  |
| Categories          | `category`           | Name, slug, homepage visibility                 |
| Homepage content    | `homepage`           | Carousel items, featured products, banners      |
| Orders              | `order`              | Full order object, status, payment method, slip |
| Returns / Exchanges | `return`             | Linked to order, type, status, refund flag      |
| Site settings       | `siteSettings`       | WhatsApp number, bank details, disclaimers      |
| Page content        | `page`               | About, static pages                             |

### Lives in Netlify Functions (ephemeral — no storage)

- Clickom API calls (push order, update status, trigger exchange)
- Payment slip upload handler
- Order confirmation email trigger
- Scheduled function: 3-day bank transfer → COD auto-convert

### NeonDB (standby schema — activate if needed)

```sql
-- Only activate if Sanity API rate limits are hit at scale
orders (id, sanity_order_id, clickom_sale_id, status, created_at)
returns (id, order_id, type, status, refund_amount, created_at)
```

---

## 4. Sanity Schema Definitions

### 4.1 `product`

```js
{
  name: 'product',
  fields: [
    { name: 'name', type: 'string' },
    { name: 'slug', type: 'slug' },
    { name: 'sku', type: 'string' },
    { name: 'description', type: 'blockContent' },
    { name: 'images', type: 'array', of: [{ type: 'image' }] },
    { name: 'category', type: 'reference', to: [{ type: 'category' }] },
    { name: 'price', type: 'number' },
    { name: 'variations', type: 'array', of: [{ type: 'variation' }] },
    // Per-product toggles
    { name: 'enablePreOrders', type: 'boolean', initialValue: false },
    { name: 'enableCustomSizes', type: 'boolean', initialValue: false },
    { name: 'isVisible', type: 'boolean', initialValue: true },
    // Clickom reference
    { name: 'clickomProductId', type: 'number' },
  ]
}
```

### 4.2 `variation` (embedded object)

```js
{
  name: 'variation',
  fields: [
    { name: 'name', type: 'string' },           // e.g. "Black"
    { name: 'clickomVariationId', type: 'number' },
    { name: 'subVariations', type: 'array', of: [{ type: 'subVariation' }] }
  ]
}

// subVariation
{
  name: 'subVariation',
  fields: [
    { name: 'size', type: 'string' },            // e.g. "XS", "S", "54", "56"
    { name: 'clickomVariationId', type: 'number' },
    { name: 'sku', type: 'string' },
  ]
}
```

> Stock levels are NOT stored in Sanity. They are fetched live from Clickom `GET /stocks` at page load.

### 4.3 `order`

```js
{
  name: 'order',
  fields: [
    { name: 'orderNumber', type: 'string' },      // server-generated
    { name: 'customer', type: 'object', fields: [
      { name: 'fullName', type: 'string' },
      { name: 'mobile', type: 'string' },
      { name: 'email', type: 'string' },
      { name: 'addressLine1', type: 'string' },
      { name: 'addressLine2', type: 'string' },
      { name: 'city', type: 'string' },
      { name: 'zipCode', type: 'string' },
    ]},
    { name: 'items', type: 'array', of: [{ type: 'orderItem' }] },
    { name: 'paymentMethod', type: 'string' },    // 'cod' | 'bank_transfer'
    { name: 'paymentSlip', type: 'image' },       // bank transfer only
    { name: 'paymentSlipUploadedAt', type: 'datetime' },
    { name: 'status', type: 'string' },
    // 'pending' | 'approved' | 'rejected' | 'shipped' | 'completed' | 'cancelled'
    { name: 'adminStatus', type: 'string' },      // 'pending_approval' | 'approved' | 'rejected'
    { name: 'clickomSaleId', type: 'string' },    // set after OMS push
    { name: 'clickomInvoiceNo', type: 'string' },
    { name: 'placedAt', type: 'datetime' },
    { name: 'approvedAt', type: 'datetime' },
    { name: 'notes', type: 'text' },
  ]
}
```

### 4.4 `return`

```js
{
  name: 'return',
  fields: [
    { name: 'order', type: 'reference', to: [{ type: 'order' }] },
    { name: 'type', type: 'string' },             // 'exchange' | 'refund'
    { name: 'status', type: 'string' },
    // 'initiated' | 'accepted' | 'completed' | 'refunded'
    { name: 'reason', type: 'text' },
    { name: 'refundAmount', type: 'number' },
    { name: 'clickomExchangeRef', type: 'string' },
    { name: 'processedAt', type: 'datetime' },
  ]
}
```

### 4.5 `siteSettings`

```js
{
  name: 'siteSettings',
  fields: [
    { name: 'whatsappNumber', type: 'string' },
    { name: 'bankName', type: 'string' },
    { name: 'bankAccountName', type: 'string' },
    { name: 'bankAccountNumber', type: 'string' },
    { name: 'bankBranch', type: 'string' },
    { name: 'customSizeCharge', type: 'number', initialValue: 850 },
    { name: 'customSizeDispatchDays', type: 'number', initialValue: 14 },
    { name: 'bankTransferDeadlineDays', type: 'number', initialValue: 3 },
  ]
}
```

---

## 5. Netlify Functions — Serverless Logic

All server-side logic runs as Netlify Functions inside the Next.js repo under `/netlify/functions/` or as Next.js API routes under `/app/api/`.

### 5.1 `POST /api/orders/create`

**Trigger:** Customer completes checkout

**Flow:**

1. Validate order payload
2. Generate unique order number (`NM-YYYYMMDD-XXXX`)
3. Write order document to Sanity with `adminStatus: 'pending_approval'`
4. If bank transfer: store payment slip to Sanity assets
5. Send confirmation email via Resend
6. Return order number to frontend

**Does NOT push to Clickom yet.** That happens only after admin approval.

---

### 5.2 `POST /api/orders/approve`

**Trigger:** Admin clicks Approve in Sanity Studio custom tool

**Flow:**

1. Fetch order from Sanity by order ID
2. Build Clickom sale payload from order data
3. `POST /api/customapi/sales` to Clickom
4. On success: update Sanity order with `clickomSaleId`, `adminStatus: 'approved'`
5. Return success to Studio UI

**Clickom payload mapping:**

```js
{
  invoice_no: order.orderNumber,
  custom_order_id: order._id,
  mobile: order.customer.mobile,
  customer_full_name: order.customer.fullName,
  customer_address_line_1: order.customer.addressLine1,
  customer_address_line_2: order.customer.addressLine2,
  customer_city: order.customer.city,
  customer_zip_code: order.customer.zipCode,
  customer_country: "Sri Lanka",
  products: order.items.map(item => ({
    product_id: item.clickomProductId,
    variation_id: item.clickomVariationId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    unit_price_inc_tax: item.unitPrice,
    enable_stock: 0   // stock management OFF per flow spec
  })),
  payment: [{
    amount: order.totalAmount,
    method: order.paymentMethod === 'cod' ? 'cash' : 'bank_transfer'
  }]
}
```

---

### 5.3 `POST /api/orders/reject`

**Trigger:** Admin clicks Reject

**Flow:**

1. Update Sanity order `adminStatus: 'rejected'`
2. Optionally trigger rejection email to customer

---

### 5.4 `POST /api/orders/status-sync`

**Trigger:** Called on demand or via scheduled function

**Flow:**

1. Fetch all approved orders from Sanity with non-terminal status
2. For each: `GET /api/customapi/sales_status?customer_order_id={id}` from Clickom
3. Update Sanity order status to match OMS status

---

### 5.5 `POST /api/slip/upload`

**Trigger:** Customer uploads payment slip at checkout

**Flow:**

1. Receive file from frontend (multipart)
2. Upload to Sanity assets via Sanity client
3. Return asset reference ID
4. Frontend attaches reference ID to order payload on submission

---

### 5.6 Scheduled Function — Bank Transfer Auto-Convert (every 6 hours)

**Trigger:** Netlify scheduled function (cron)

**Flow:**

1. Query Sanity for all orders where:
   - `paymentMethod === 'bank_transfer'`
   - `adminStatus === 'pending_approval'`
   - `paymentSlip` is null or not uploaded
   - `placedAt` is older than 3 days
2. For each matching order: update `paymentMethod` to `'cod'`
3. Log conversion with timestamp

---

### 5.7 `POST /api/email/confirmation`

**Trigger:** Called internally by order create function

**Payload:** Order number, customer name, items, total, payment method

**Template includes:**

- Order number (prominent, with screenshot prompt)
- Full order summary
- Payment instructions (if bank transfer)
- WhatsApp support link

---

## 6. Clickom OMS Integration

### Authentication

Every request must include the API key in the header:

```
x-api-key: {CLICKOM_API_KEY}
```

Store in Netlify environment variable: `CLICKOM_API_KEY`

### Endpoint Reference

| Function                 | Method | Endpoint                                                       |
| ------------------------ | ------ | -------------------------------------------------------------- |
| Get all products         | GET    | `/customapi/products`                                          |
| Get categories           | GET    | `/customapi/categories`                                        |
| Get stock (all)          | GET    | `/customapi/stocks`                                            |
| Get stock (by variation) | GET    | `/customapi/stocks/{variation_id}`                             |
| Create sale              | POST   | `/customapi/sales`                                             |
| Update sale              | PUT    | `/customapi/sales/{id}`                                        |
| Delete sale              | DELETE | `/customapi/sales/{id}`                                        |
| Get sale                 | GET    | `/customapi/sales?custom_order_id={id}`                        |
| Update sale status       | GET    | `/customapi/sales_status?customer_order_id={id}&status={code}` |
| Get sale status          | GET    | `/customapi/sales_status?customer_order_id={id}`               |

### Status Code Mapping

| Clickom Code | Meaning    | When Used                         |
| ------------ | ---------- | --------------------------------- |
| `pd`         | Pending    | Order placed, awaiting processing |
| `pc`         | Processing | Admin approved, being packed      |
| `sp`         | Shipped    | Dispatched                        |
| `cp`         | Completed  | Delivered                         |
| `cn`         | Cancelled  | Rejected or cancelled             |
| `rf`         | Refunded   | Refund processed                  |
| `oh`         | On Hold    | Awaiting payment confirmation     |

### Important Notes

- `enable_stock` must always be `0` for all products (per flow spec — stock toggle OFF)
- `invoice_no` must be unique — use the generated order number
- `custom_order_id` must be unique — use the Sanity document `_id`
- Clickom's base URL: `https://rcholdings.clickom.lk`

---

## 7. Storefront — Page & Feature Specifications

### 7.1 Pages

| Page               | Route                  | Key Features                                                        |
| ------------------ | ---------------------- | ------------------------------------------------------------------- |
| Homepage           | `/`                    | Hero, featured abayas carousel, "In Noora" carousel, category links |
| Shop / Collection  | `/shop`                | Product grid, filter by category, size, availability                |
| Product Detail     | `/products/[slug]`     | Images, size selector, pre-order logic, custom size, add to cart    |
| Cart               | `/cart`                | Items, quantities, totals, discount codes, proceed to checkout      |
| Checkout           | `/checkout`            | Customer details, payment method, slip upload, order review         |
| Order Confirmation | `/order/[orderNumber]` | Order number, summary, screenshot prompt                            |
| About              | `/about`               | Brand story, CMS-managed                                            |
| Pay Later          | `/pay-later`           | Form: order number + phone + slip upload                            |
| 404                | `/404`                 | Custom error page with nav back to home                             |
| 500                | `/500`                 | Custom error page with support contact                              |

---

### 7.2 Product Detail — Size Selector Logic

This is the most complex UI component. Full logic:

```
For each size/sub-variation:

  Fetch stock from Clickom GET /stocks/{variation_id}

  IF stock > 0:
    → Show size as normal, selectable

  IF stock === 0 AND product.enablePreOrders === true:
    → Show size as selectable
    → Show "Pre-Order Available" label above size selector

  IF stock === 0 AND product.enablePreOrders === false:
    → Show size as disabled/greyed out, not selectable
```

**Custom Size logic (runs independently of stock):**

```
IF product.enableCustomSizes === true:
  → Show "+" button or "Custom Size" option in size selector
  → Show disclaimer above selector:
    "Custom sizes take approximately 2 weeks to dispatch.
     An additional charge of LKR 850 applies."
  → If custom size is selected, add LKR 850 to order total
  → Flag order item as customSize: true

IF product.enableCustomSizes === false:
  → Hide "+" button entirely
```

**Pre-order label + custom size disclaimer can appear simultaneously** if both toggles are ON.

---

### 7.3 Discount / Coupon Codes

- Managed in Sanity (`coupon` document type)
- Validated client-side via Sanity query at checkout
- Applied as `discount_type: 'fixed'` or `'percentage'` in Clickom sale payload

---

## 8. Checkout Flow

### 8.1 Payment Methods

**Cash on Delivery (COD)**

```
Customer fills details → Selects COD → Places order
→ Netlify Function creates Sanity order (adminStatus: pending_approval)
→ Confirmation email sent
→ Order appears in admin approval queue
```

**Bank Transfer**

```
Customer fills details → Selects Bank Transfer
→ Bank details shown (pulled from siteSettings in Sanity)
→ Customer uploads payment slip (optional at this stage)
→ "Pay Later?" link available → opens modal with instructions
→ Places order
→ Netlify Function creates Sanity order, stores slip asset reference
→ Confirmation email sent with bank details
→ Order appears in admin approval queue

⚠ Disclaimer shown at checkout:
"Payment slips not received within 3 days will automatically convert this order to Cash on Delivery."

Scheduled function checks every 6 hours and converts overdue unpaid bank transfer
orders to COD automatically.
```

**Pay Later flow (via footer link `/pay-later`):**

Customer submits: order number + phone number + payment slip
→ Netlify function matches order in Sanity by order number + mobile
→ Attaches slip to existing order document
→ Notifies admin (optional email/Sanity notification)

---

### 8.2 Order Confirmation Screen

- Display server-generated order number prominently
- Message: _"Please screenshot your order number for future reference."_
- Full order summary
- Confirmation email sent automatically

---

## 9. Admin Panel — Sanity Studio Custom Tools

All admin functionality lives inside Sanity Studio as custom React tools. No separate dashboard. No additional hosting cost.

### 9.1 Pending Orders Queue

**Sanity Studio Custom Tool: "Orders"**

Displays all orders where `adminStatus === 'pending_approval'`

Columns:

- Order Number
- Customer Name
- Payment Method (COD / Bank Transfer)
- Order Summary (expandable)
- Ageing (time since `placedAt`)
- Payment Slip (view button — bank transfer only)
- Actions: **Approve** / **Reject**

**Approve button flow:**

1. Calls `POST /api/orders/approve`
2. Netlify function pushes to Clickom
3. On success: order moves to Approved Orders table
4. On failure: error shown in Studio, order stays in queue

**Reject button flow:**

1. Calls `POST /api/orders/reject`
2. Order moves to Rejected table
3. Optional: rejection reason input

---

### 9.2 Approved Orders Table

Separate view in the Studio tool showing all orders with `adminStatus === 'approved'`

Columns: Order Number, Customer, Items, Payment Method, Clickom Sale ID, Current Status, Placed At, Approved At

Status is synced from Clickom on demand via "Sync Status" button.

---

### 9.3 Returns & Exchanges Table

Separate Studio tool view: "Returns"

Displays all `return` documents

Columns: Order Number, Customer, Return Type, Status, Reason, Action Buttons

**Action buttons per return:**

| Button            | When Shown                           | Action                                                          |
| ----------------- | ------------------------------------ | --------------------------------------------------------------- |
| **Exchange**      | type = exchange, status = initiated  | Triggers Clickom exchange process, updates status to 'accepted' |
| **Refund**        | type = refund OR exchange accepted   | Marks status as 'refunded', logs refund amount and timestamp    |
| **Mark Refunded** | After refund is processed externally | Confirms refund is complete in records                          |

**Client requirement (from texts):** After an exchange is initiated or accepted, admin can choose Exchange or Refund. If exchange → OMS process. If refund → track via Refunded button.

---

### 9.4 Product Management

Handled entirely through standard Sanity Studio document editing. No custom UI needed.

Admin can:

- Create / edit / delete products
- Toggle Pre-Orders ON/OFF per product
- Toggle Custom Sizes ON/OFF per product
- Toggle Product Visibility ON/OFF per product
- Upload product images
- Set category, price, variations

> When a product is saved in Sanity, it does **not** automatically sync to Clickom. Products must be created in Clickom separately (or via a manual sync button — optional enhancement). The `clickomProductId` and `clickomVariationId` fields must be filled in manually in Sanity after creation in Clickom.

---

## 10. Returns, Exchanges & Refunds

### Flow

```
Customer contacts support → Admin creates return document in Sanity
→ Links to original order
→ Sets type: 'exchange' or 'refund'
→ Status: 'initiated'

IF exchange:
  → Admin clicks Exchange button in Studio
  → Netlify function calls Clickom exchange process
  → Status updated to 'accepted'
  → If exchange can't be fulfilled → Admin clicks Refund
  → Status updated to 'refunded'

IF refund:
  → Admin clicks Refund button
  → Processes refund externally (bank transfer back to customer)
  → Admin clicks Mark Refunded
  → Status updated to 'refunded', timestamp logged
```

---

## 11. Homepage & Category Logic

### 11.1 Current State (Single Category)

Homepage carousels are **manually curated in Sanity** — not dynamically driven by category data. This means:

- Adding a new category does **not** automatically update the homepage
- Admin must manually update carousel items and featured sections in Sanity Studio
- This is intentional — gives full editorial control

### 11.2 When New Categories Are Added

The homepage `siteSettings` or `homepage` document in Sanity includes a `categories` array. Admin adds the new category here when they want it featured. The navigation and shop filter automatically reflects all active categories from the `category` collection.

**Recommendation to client:** When you add a new category, update the homepage manually in Sanity Studio to feature it. The shop page and navigation update automatically.

### 11.3 Carousel CMS Structure

**Featured Abayas Carousel**
Each slide: image + linked product (reference to `product` document) + optional label

**"In Noora" Lifestyle Carousel**
Each slide: image + linked product (reference to `product` document) + model name (optional)

Both carousels are managed entirely in Sanity. No code changes needed to update them.

---

## 12. Edge Cases & Empty States

| State                                    | Page/Component     | Required Behaviour                                                         |
| ---------------------------------------- | ------------------ | -------------------------------------------------------------------------- |
| 404 Not Found                            | `/404`             | Custom page, friendly message, link back to homepage                       |
| 500 Server Error                         | `/500`             | Custom page, support contact (WhatsApp)                                    |
| Empty category                           | `/shop?category=X` | "No products in this category yet. Check back soon."                       |
| Empty search                             | `/shop?search=X`   | No-results message + "Browse all products" link                            |
| Out of stock, no pre-order               | Product page       | Size greyed out, clearly labelled unavailable                              |
| Out of stock, pre-order on               | Product page       | "Pre-Order Available" label, size selectable                               |
| No payment slip uploaded (bank transfer) | Admin queue        | Disclaimer shown: "Slip not yet uploaded. Auto-converts to COD in X days." |
| Clickom API failure on approve           | Admin Studio       | Error message shown, order stays in queue, no duplicate push               |
| Duplicate invoice number                 | Netlify function   | Catch Clickom 500 error, regenerate invoice number and retry once          |

---

## 13. Environment Variables & Configuration

```env
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=                    # write access for Netlify functions

# Clickom OMS
CLICKOM_API_KEY=                     # x-api-key JWT token
CLICKOM_BASE_URL=https://rcholdings.clickom.lk

# Email (Resend)
RESEND_API_KEY=

# NeonDB (standby — leave empty until activated)
DATABASE_URL=

# App
NEXT_PUBLIC_SITE_URL=https://nooramodesty.com
ORDER_NUMBER_PREFIX=NM
```

---

## 14. Build Checklist

### ✅ Standard E-Commerce — Every Store Should Have This

**Product & Catalogue**

- [ ] Product listing page with grid layout
- [ ] Product detail page with image gallery
- [ ] Product search
- [ ] Category / collection filtering
- [ ] Sort by (price, newest, popularity)
- [ ] Stock availability shown on product page
- [ ] Mobile responsive across all pages

**Cart & Checkout**

- [ ] Add to cart
- [ ] Update quantity in cart
- [ ] Remove item from cart
- [ ] Cart persists across sessions (localStorage or cookie)
- [ ] Coupon / discount code input
- [ ] Order summary before payment
- [ ] Customer details form (name, address, phone, email)
- [ ] Payment method selection
- [ ] Order confirmation screen with order number
- [ ] Confirmation email sent to customer

**Customer Accounts**

- [ ] Account creation and login
- [ ] Saved addresses
- [ ] Wishlist / saved products
- [ ] Order history
- [ ] Order status tracking

**Admin**

- [ ] Product CRUD (create, read, update, delete)
- [ ] Order management
- [ ] Basic order status updates
- [ ] Inventory / stock management

**SEO & Performance**

- [ ] Meta titles and descriptions per page
- [ ] Open Graph tags for social sharing
- [ ] Sitemap.xml
- [ ] Robots.txt
- [ ] Image optimisation (Next.js Image component)
- [ ] Page speed baseline (Core Web Vitals)

**Legal & Trust**

- [ ] Privacy policy page
- [ ] Terms and conditions page
- [ ] Return / refund policy page
- [ ] SSL / HTTPS
- [ ] Secure checkout indicators

**UX**

- [ ] 404 page
- [ ] 500 page
- [ ] Empty states for all list views
- [ ] Loading states on async actions
- [ ] Error messages on form validation

---

### ✅ Noora Modesty Specific — This Project

**Product Features**

- [ ] Per-product Pre-Orders toggle (Sanity)
- [ ] Per-product Custom Sizes toggle (Sanity)
- [ ] Per-product Visibility toggle (Sanity)
- [ ] Size selector with live stock from Clickom
- [ ] Pre-order label shown when stock = 0 and toggle is ON
- [ ] Disabled size state when stock = 0 and toggle is OFF
- [ ] Custom size "+" button shown/hidden based on toggle
- [ ] Custom size disclaimer: "~2 weeks dispatch, LKR 850 surcharge"
- [ ] LKR 850 auto-added to cart when custom size selected
- [ ] Pre-order label and custom size disclaimer shown simultaneously if both active

**Checkout**

- [ ] COD payment method
- [ ] Bank Transfer payment method
- [ ] Bank details displayed on bank transfer selection (from Sanity siteSettings)
- [ ] Payment slip upload at checkout
- [ ] "Pay Later?" link with modal instructions
- [ ] Pay Later page in footer (`/pay-later`) — order no + phone + slip
- [ ] 3-day bank transfer disclaimer shown at checkout
- [ ] Server-generated order number (NM-YYYYMMDD-XXXX format)
- [ ] Screenshot prompt on confirmation screen
- [ ] WhatsApp support prompt at checkout (NOT on product page)
- [ ] Remove WhatsApp button from product page

**OMS Integration**

- [ ] Clickom API key stored in env variable
- [ ] `GET /stocks` called at product page load for live stock
- [ ] `POST /sales` called only after admin approval
- [ ] `enable_stock: 0` on all Clickom sale line items
- [ ] Unique `invoice_no` per order
- [ ] Unique `custom_order_id` per order
- [ ] Duplicate invoice error handled gracefully
- [ ] `GET /sales_status` sync for approved orders
- [ ] Clickom sale ID stored back in Sanity order document

**Admin Panel (Sanity Studio Custom Tools)**

- [ ] Pending Orders queue with ageing column
- [ ] View order summary in queue
- [ ] View payment slip in queue (bank transfer orders)
- [ ] Approve button → triggers Clickom push
- [ ] Reject button → moves to rejected table
- [ ] Bank transfer slip-not-uploaded disclaimer in queue
- [ ] Approved Orders table (permanent record)
- [ ] Status sync button for approved orders
- [ ] Returns & Exchanges table
- [ ] Exchange button → triggers Clickom exchange process
- [ ] Refund button → logs refund, updates status
- [ ] Mark Refunded button for confirmation

**Scheduled / Background Jobs**

- [ ] Netlify scheduled function: auto-convert unpaid bank transfers to COD after 3 days
- [ ] Runs every 6 hours minimum

**Homepage & Navigation**

- [ ] Featured Abayas carousel — each slide links to product page
- [ ] "In Noora" lifestyle carousel — each image links to product page
- [ ] Both carousels CMS-managed in Sanity
- [ ] Navigation auto-reflects active categories
- [ ] Homepage category sections updated manually in Sanity when new categories added

**Edge Cases**

- [ ] 404 page with homepage navigation
- [ ] 500 page with WhatsApp support link
- [ ] Empty category page with friendly message
- [ ] Empty search results with browse-all link
- [ ] Out-of-stock product page with clear unavailability state
- [ ] Clickom API failure on order approve handled gracefully (no duplicate push)

**Hosting & Config**

- [ ] All env variables set in Netlify dashboard
- [ ] Sanity write token scoped correctly
- [ ] Netlify Functions deployed and tested
- [ ] Sanity Studio deployed (`sanity deploy`)
- [ ] Custom domain connected and SSL active
- [ ] NeonDB connection string ready (even if not active at launch)

---

_Noora Modesty Technical Specification v1.0 · Forty Pixels · [@fortypixelshq](https://instagram.com/fortypixelshq)_
