# Website × ClickOM Flow

## Current Flow

### Step 1: Customer Initiates Contact

Customer browses Instagram, WhatsApp, or comes across an advertisement and initiates a conversation.

### Step 2: Customer Requests an Order

Customer requests to place an order.

### Step 3: Collect Customer Details

Request the following information:

- Name

- Phone Number

- Address

- City

- District

- Colour

- Size

See **Step 3.1** for custom sizing requirements.

#### Step 3.1: Custom Size Requests

If a customer requests a custom size, collect:

- Height (abaya length)

- Bust (full round in inches)

- Hip (full round in inches)

- Sleeve (neck to wrist in inches)

> Note: Not all products support custom sizing.

### Step 4: Create Order in OMS

Enter order details manually into the OMS:

- Create/select customer

- Enter sale date

- Generate invoice number (automatic or manual)

- Select order source:
  - Instagram

  - WhatsApp

- Enter shipping charges manually

### Step 5: Add Products and Discounts

Add requested products to the order.

Apply:

- Product-level discounts (line discounts)

- Order-level discounts (bill discounts)

#### Step 5.1: Discount Types

**Line Discount**

- Applied to an individual product

- Affects the line subtotal

**Final Bill Discount**

- Applied to the overall order total

Both are entered manually during order creation.

#### Step 5.2: Special Requests

Special requests such as:

- Custom sizing

- Colour requests

- Urgent deliveries

are entered into the **Sale Note** field.

> The Sale Note is visible in the Call Centre view, not the main order list.

### Step 6: Payment Handling

#### Cash on Delivery (COD)

- Create the order as normal

- Order status must be set to **Pending**

#### Bank Transfer (Unpaid)

- Initially enter the order as COD

- Update payment details once payment is received

OMS payment statuses:

- Due

- Partial

- Paid

#### Partial Payments

- Any unpaid balance is automatically treated as COD

- Parcel is shipped with remaining balance payable on delivery

#### Important Note

Only mark an order as **Bank Transfer** after payment is received.

Otherwise:

- OMS assumes bank transfer orders are paid

- Unless a payment amount of `0` is manually entered

### Step 7: Production

Print the Call Centre order sheet and provide it to the tailoring team.

### Step 8: Order Confirmation

Once packing is complete and the shipping team receives the items:

- Change order status from **Pending** to **Confirmed**

- OMS generates a waybill through the courier integration

> Throughout stitching, ironing, and packing, orders remain in **Pending** status.

### Step 9: Waybill & Dispatch

#### Print Waybill

Confirmed orders appear in the **Print Waybill** tab.

Shipping team:

1. Selects ready orders

2. Prints waybills

#### Dispatch

After printing:

- Orders appear in the **Dispatch** tab

- Waybills are attached to parcels

- Parcels are scanned and dispatched

Courier updates may include:

- Added to Bag

- Received in Facility

- Out for Delivery

- Delivered

### Step 10: Delivery & Reconciliation

After delivery:

- Weekly payment sheets are received from the courier

- Includes:
  - COD collections

  - Bank transfer payments

  - Delivery deductions

Only after reconciliation is complete is the order considered finalized.

> OMS does not have a "Completed" status.

>

> - **Delivered (Green)** = Completed internally

> - **DELIVERED (Blue)** = Courier delivery status

### Step 11: Payment Received

Business receives payment.

---

# Expected Improved Flow

## Step 1: Customer Browses Website and Places Order

---

### Scenario 1: Standard Size + Preorder Available + COD

Flow:

1. Customer places order

2. Order enters CMS

3. Team reviews order details

4. Order is approved

5. Order is pushed to OMS

**Ideal flow.**

---

### Scenario 2: Custom Size + Preorder Available + COD

Flow:

1. Customer selects custom sizing

2. Custom measurements submitted

3. Order enters CMS

4. Team reviews order

5. Order is approved

6. Order is pushed to OMS

Custom measurements are mapped to a virtual SKU:

```text

Custom Size

```

Measurements are stored in the OMS **Sale Note** field.

---

#### Scenario 2.1: Multiple Products with Custom Sizes

Each product must be linked to its corresponding measurements.

Example:

```text

Haya: Length=56, Bust=40, Hip=42, Sleeve=24

```

All measurement fields are mandatory.

---

#### Scenario 2.2: Same Product with Different Custom Sizes

Example:

```text

Haya: Length=56, Bust=40, Hip=42, Sleeve=24 |

Haya: Length=50, Bust=40, Hip=42, Sleeve=22.5

```

Formatting rules:

| Symbol | Purpose | |

| ------ | ------------------ | ---------------------------- |

| `:` | Start measurements | |

| `=` | Measurement value | |

| `     |` | Separate custom size entries |

Applies to:

- Same product, multiple custom sizes

- Multiple products with custom sizes

---

### Scenario 3: Standard Size + Preorder Available + Bank Transfer

#### Scenario 3.1: Customer Pays Immediately

Flow:

1. Customer uploads payment screenshot

2. Order enters CMS

3. Screenshot verified

4. Payment amount entered manually

5. Order approved

6. Order pushed to OMS

---

#### Scenario 3.2: Customer Pays Later

Requirements:

- Allow payment using:
  - Phone Number

  - Order Number

- Payment accepted only if both match

Rules:

- Customer has **3 days** to complete payment

- Partial payments convert remaining balance to COD

- Customer must be informed of this behavior

---

#### Scenario 3.3: Payment Window Expires

After 3 days:

Option A:

- Automatically convert order to COD

Option B:

- Show ageing dashboard/tab

- Administrator manually approves as COD

Order is then pushed to OMS.

---

### Scenario 4: Preorders Unavailable + Size Unavailable

- Grey out unavailable sizes

### Scenario 5: Preorders Unavailable + Colour Unavailable

- Grey out unavailable colours

### Scenario 6: Preorders Available + Colour Unavailable

- Grey out unavailable colours

---

# Administrator Requirements

## Product Management

Current product management remains largely unchanged.

### Product Structure

#### Parent Variation

```text

Colour

```

#### Child Variation

```text

Size

```

Each size variation:

- Has a unique SKU

- Maps directly to a ClickOM product

---

### Product Labels

Products should support the following toggles:

#### New Arrival

Displays a "New Arrival" badge.

#### Sale Percentage

Displays sale percentage.

#### Low Stock

Manually enter remaining stock quantity.

Reference:

- NoLimit website implementation

---

### Stock Synchronization

#### Preorder Enabled

When preorder toggle is ON:

- Ignore OMS stock levels

#### Preorder Disabled

When preorder toggle is OFF:

- Pull stock from OMS

If an SKU becomes out of stock:

- Grey out the corresponding size

---

### Size Chart

Implementation is flexible.

Preferred approach:

- Reference image

- Easier for customers to understand

---

# Site Additions

## Announcement Bar

Add a global announcement banner at the top of the website.

Examples:

- Free Delivery on Orders Above Rs. 10,000

- Sale Valid Until 24th August

Requirements:

- Editable from CMS

- Visibility toggle

- Similar implementation to Jezza's website

---

# Order Tracking Page

## Features

Customers should be able to:

- View invoices

- Track order status

- View waybill information

- Access exchange/return requests

- Contact support via WhatsApp

---

## Tracking Inputs

Required fields:

- Order Number

- Phone Number

---

## Tracking Results

Display:

- Invoice

- Waybill Number (if available)

- Order Status

Possible statuses:

- Pending

- Confirmed

- Dispatched

- CityPak Status

- Completed

---

## Courier Tracking

Provide a link to the CityPak tracking page.

Customers can use their waybill number for detailed courier tracking.

---

### OMS Status Synchronization

Status updates should come from:

1. OMS manual updates

2. Courier API updates after dispatch

---

Source: Website × ClickOM Flow document.
