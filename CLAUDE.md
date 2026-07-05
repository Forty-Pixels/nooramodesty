# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start Next.js dev server (http://localhost:3000)
npm run build        # production build
npm run lint         # ESLint

# Sanity CMS scripts (require .env.local)
npm run sanity:seed-categories           # seed category documents
npm run sanity:sync-clickom              # dry-run Clickom → Sanity product sync
npm run sanity:sync-clickom:apply        # apply the sync
```

No test suite exists yet. Lint is the only automated check.

## Environment Variables

Required in `.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset (default: `production`) |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Sanity API version (default: `2026-03-01`) |
| `SANITY_API_TOKEN` | Sanity write token (server-only) |
| `NEXT_PUBLIC_ADMIN_SECRET` | Protects admin-only API routes |
| `CLICKOM_BASE_URL` | Clickom ERP base URL |
| `CLICKOM_USERNAME` / `CLICKOM_PASSWORD` | Clickom auth credentials |
| `CLICKOM_CLIENT_ID` / `CLICKOM_CLIENT_SECRET` | Clickom OAuth client |
| `RESEND_API_KEY` | Order confirmation emails via Resend |
| `ORDER_NUMBER_PREFIX` | Prefix for generated order numbers |

## Architecture

**Stack:** Next.js 16 (App Router) · Sanity v5 CMS · Tailwind CSS v4 · Zustand · Deployed on Netlify.

### Data flow

```
Clickom ERP (inventory/orders)
       ↕  (lib/server/clickom.ts — token-cached REST client)
Sanity CMS  ←→  Next.js server components / API routes  →  React UI
```

Products live in Sanity with `clickomProductId` / `clickomVariationId` fields linking them to Clickom ERP. Orders are written to Sanity first, then pushed to Clickom via `lib/server/clickomOrderPayload.ts`.

### Key directories

| Path | What lives here |
|---|---|
| `app/` | Next.js App Router pages and API routes |
| `app/studio/` | Embedded Sanity Studio at `/studio` |
| `app/api/` | Server-side API routes (orders, stocks, clickom sync, coupons) |
| `components/<PageName>/` | All JSX for a page, split into section files |
| `components/ui/` | Shared primitives (buttons, cards, etc.) |
| `lib/sanity/` | Sanity client, GROQ queries, image helpers |
| `lib/server/` | Server-only logic: Clickom client, order validation, email, order numbers |
| `sanity/schemas/` | Sanity document/field type definitions |
| `sanity/plugins/` | Custom Sanity Studio tools (orders dashboard, Clickom sync UI) |
| `store/index.ts` | Zustand store: cart, wishlist, buy-now (persisted to localStorage) |
| `types/` | TypeScript interfaces matching Sanity and Clickom shapes |
| `data/` | Static fallback/mock data mirroring Sanity schemas |
| `utils/` | Pure utilities; `featureFlags.ts` contains feature toggles |

### API routes

| Route | Purpose |
|---|---|
| `POST /api/orders/create` | Place order → Sanity → Clickom |
| `POST /api/orders/approve` / `reject` | Admin approval flow |
| `GET /api/orders/status` | Fetch order status |
| `POST /api/orders/status-sync` | Pull status updates from Clickom |
| `GET /api/stocks/[variationId]` | Live stock check from Clickom |
| `POST /api/clickom/product-sync` | Trigger product sync from Sanity |
| `POST /api/coupons/validate` | Validate coupon codes |

Admin routes check `NEXT_PUBLIC_ADMIN_SECRET` via `lib/server/adminAuth.ts`.

### Sanity Studio

Accessed at `/studio`. Custom plugins:
- **ordersTool** — orders management dashboard inside Studio
- **clickomSyncTool** — UI to trigger the Clickom product sync

### Clickom integration

`lib/server/clickom.ts` manages OAuth token caching (10-min TTL, 1-min refresh buffer). Product sync (`sanity/lib/syncClickomProducts.mjs`) maps Clickom catalog → Sanity `product` documents by matching `sku` to `clickomProductId`. Orders are submitted via `buildClickomSalePayload` in `lib/server/clickomOrderPayload.ts`.

## Code Conventions

- **Tailwind only** — no CSS modules or external stylesheets
- **One component per file**, named exports (except Next.js route files)
- **No raw `<img>`** — always `<Image />` from `next/image`
- **Props only** — no hardcoded copy or images inside components; all content flows from `data/` or Sanity through props
- **`types/`** — interfaces for every component prop; no `any`
- **600-line component limit** — split before hitting it
- **`lib/server/`** files use `import "server-only"` — never import in client components
- **Feature flags** live in `utils/featureFlags.ts`
