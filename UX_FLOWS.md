# Noora Modesty UX Flows

## Customer Flows

### Browse Homepage

1. Customer opens the homepage.
2. Hero, product sections, and `#InNoora` images load from Sanity.
3. Product section cards link to product detail pages.
4. No local fallback images are shown if Sanity content is missing.

### Browse Category

1. Customer opens a category or subcategory page.
2. Products load from Sanity.
3. Customer filters/searches from available storefront metadata.
4. Product cards link to product detail pages.

### Product Detail

1. Customer opens a product.
2. Product images, description, material specs, size guide image, variations, and pricing load from Sanity.
3. Color/style options come from Sanity product variations.
4. Color swatches use Sanity `colorHex`; if no hex exists, the variation name is shown as a text option.
5. Size/style options come from Sanity sub-variations.
6. Clickom variation IDs are used only for stock checks and order push.
7. Stock is checked against Clickom in one batch request for the product.
8. Out-of-stock or unmapped sizes cannot be purchased.
9. Customer can add to cart, buy now, wishlist, or open WhatsApp.

### Custom Size

1. Custom size option appears only if `enableCustomSizes` is enabled on the Sanity product.
2. Customer enters measurements.
3. Custom size charge comes from Sanity `siteSettings.customSizeCharge`.
4. Cart item keeps the chosen base Clickom variation ID plus the custom measurement note.

### Cart

1. Customer reviews cart items.
2. Shipping estimate is calculated from Sanity site settings.
3. Each product counts as the configured product weight, currently 700g.
4. Base shipping covers first billable kg.
5. Every extra billable kg adds the configured extra fee.
6. Same product with the same color, size, and custom measurement key is merged into one cart line and quantity increases.
7. Same product with a different size, color, or custom measurement key stays as a separate cart line.

### Checkout

1. Customer enters contact and delivery details.
2. Customer chooses COD or bank transfer.
3. Bank details come from Sanity site settings.
4. Customer may upload a payment slip for bank transfer.
5. Coupon validation uses server-side Sanity pricing and shipping totals.
6. Order is saved to Sanity with `pending_approval` admin status.
7. Confirmation email is attempted if `RESEND_API_KEY` is configured.

## Admin Flows

### Product Setup In Clickom

1. Admin creates product in Clickom.
2. Admin creates size/style variations in Clickom.
3. Admin notes product SKU and variation sub-SKUs, for example `0068` and `0068-1`.
4. Clickom remains the source for product IDs, variation IDs, and stock.

### Product Setup In Sanity

1. Admin creates matching Sanity product.
2. Admin adds storefront images, copy, category, price, and visibility.
3. Admin enters the Clickom product SKU on the product.
4. Admin creates storefront variations with display labels and optional color hex values.
5. Admin enters Clickom variation SKUs on each sub-variation.
6. Admin uploads a product-specific size guide image if needed.

### Clickom Product Sync

1. Admin opens Sanity Studio.
2. Admin opens `Clickom Sync`.
3. Admin runs `Dry Run`.
4. Admin reviews product/variation matches.
5. Admin fixes missing or ambiguous SKUs in Sanity.
6. Admin runs `Apply Sync`.
7. Sync fills Sanity `clickomProductId` and `clickomVariationId`.

### Order Approval

1. Customer places order.
2. Order appears in Sanity Orders tool as `pending_approval`.
3. Admin reviews customer details, items, totals, and payment slip if present.
4. Admin approves order.
5. Approved order is pushed to Clickom OMS Orders through the live OMS order form route.
6. Each Sanity order item becomes its own Clickom product row with its own product ID, variation ID, SKU, quantity, and unit price.
7. Same product in two different sizes becomes two Clickom rows because each size has a different Clickom variation ID.
8. Different products or different colors also become separate Clickom rows when their cart keys differ.
9. Clickom sell notes are only sent for custom-size rows. Standard size/color/pre-order rows do not create sell notes.
10. Sanity stores Clickom transaction/custom order IDs.
11. Admin can reject order if it should not go to Clickom.

### Order Status Management

1. Admin updates order status in Sanity Orders tool.
2. Status push updates Clickom using the confirmed Clickom sale update endpoint.
3. Status sync can pull Clickom status back into Sanity for approved orders.

## Current Data Ownership

- Sanity owns storefront display: images, product copy, category, price, color swatches, size labels, size guide images, homepage, `#InNoora`, site settings.
- Clickom owns operations: product IDs, variation IDs, variation SKUs, stock, OMS sale records.
- Sync connects the two systems by product SKU and variation SKU.

## Remaining Gaps

- Stock lookup is still a hard dependency on Clickom. If the stock API fails, the current product page treats the affected sizes as unavailable, which can block purchase even when the product exists.
- Color swatches are functional, but only products with `colorHex` render as true swatches. Variations without a hex value fall back to text labels.
- Every purchasable size must already have a synced Clickom variation ID. If a size is missing its ID, the storefront blocks checkout for that item.
- Custom size is functional, but it still depends on a valid base variation selection. It does not remove the need for a mapped Clickom variation.
- Custom-size measurements are preserved in Sanity and sent to Clickom as sell notes only for the affected custom-size rows.
- OMS approval now uses the live Clickom web order form. That works, but it is coupled to Clickom's current page structure and field names, so it is a maintenance dependency if they change the dashboard markup.
- If Sanity content is incomplete, there is no image fallback or placeholder path on the homepage. Missing content will stay missing rather than degrading to a local asset.

## Functional Status

- Core storefront flow is now functional end to end.
- The main remaining risk is content and integration hygiene, not the purchase flow itself.
