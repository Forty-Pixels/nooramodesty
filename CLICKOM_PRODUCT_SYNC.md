# Clickom Product Sync

## Purpose

Clickom owns operational product data:

- `product_id`
- `variation_id`
- SKU / sub-SKU
- live stock

Sanity owns storefront content:

- product images
- descriptions
- category/subcategory
- homepage placement
- SEO/display copy
- storefront visibility

The sync links the two systems without replacing Sanity as the storefront CMS.

## Fields In Sanity

Product document:

```txt
sku
clickomProductId
```

Sub variation object:

```txt
size
sku
clickomVariationId
```

`clickomProductId` and `clickomVariationId` are required for orders to push to Clickom. If they are missing or wrong, Clickom rejects the order.

## Matching Rules

Product matching priority:

1. Sanity `sku` exact match to Clickom `sku`.
2. Normalized Sanity `title` match to Clickom `name`.
3. If no unique match exists, the product is listed in the report for manual review.

Variation matching priority:

1. Sanity sub-variation `sku` exact match to Clickom `sub_sku`.
2. Label match using Sanity variation name + size against Clickom variation labels.
3. If no unique match exists, the variation is listed in the report for manual review.

## Commands

Sanity Studio:

1. Open `/studio`.
2. Open the `Clickom Sync` tool.
3. Click `Dry Run`.
4. Review the report inside Studio.
5. Click `Apply Sync` only after the matches look correct.

The Studio tool uses the same matching rules as the terminal sync and requires `NEXT_PUBLIC_ADMIN_SECRET` to be available in the deployed environment.

Dry run:

```bash
npm run sanity:sync-clickom
```

Apply high-confidence matches:

```bash
npm run sanity:sync-clickom:apply
```

Both commands write:

```txt
CLICKOM_PRODUCT_SYNC_REPORT.md
```

## Recommended Workflow

1. Create/update product in Clickom.
2. Ensure Clickom SKU/sub-SKU values are clean and unique.
3. Create/update matching Sanity product with storefront images/content.
4. Add the Clickom product SKU to Sanity when possible.
5. Run dry run:

   ```bash
   npm run sanity:sync-clickom
   ```

6. Review `CLICKOM_PRODUCT_SYNC_REPORT.md`.
7. If matches look correct, run:

   ```bash
   npm run sanity:sync-clickom:apply
   ```

8. Manually fix any unmatched or ambiguous products in Sanity.
9. Re-run dry run until no important gaps remain.

## What Sync Updates

The sync may update:

- `sku` if Sanity product has no SKU and Clickom has one.
- `clickomProductId`
- sub-variation `sku` if missing and Clickom has `sub_sku`
- sub-variation `clickomVariationId`

The sync does not overwrite:

- title
- images
- description
- category
- subcategory
- price
- sale price
- homepage sections
- visibility

## Manual Review Cases

Manual review is expected when:

- Clickom and Sanity product names differ.
- Multiple Clickom products normalize to the same name.
- A product has complex multi-variation labels.
- Sanity has size labels but Clickom uses style/color labels.
- SKU/sub-SKU values are missing.

Best manual fix:

1. Copy Clickom product `sku` into Sanity product `sku`.
2. Copy Clickom `sub_sku` into Sanity sub-variation `sku`.
3. Re-run the sync.

## Order Push Requirement

Every order item must have:

```txt
clickomProductId
clickomVariationId
```

Checkout now blocks products missing these IDs. This prevents broken orders with placeholder IDs like `1`, which Clickom rejects.
