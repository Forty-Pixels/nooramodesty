# Clickom Remaining Gaps

Last checked: 21 June 2026

These are the only Clickom-side gaps still worth confirming after `updated-clickom.md`.

## Confirmed No Longer Blocking

- Auth is login flow + `Authorization: Bearer <token>`.
- `accept: application/json` is required on every Clickom request.
- `x-api-key` is stale/wrong for this integration.
- `/products` is paginated and rate-limited to 60 requests/minute.
- Live read smoke test passes:
  - `/login` -> `200` with token
  - `/products` -> `200`, paginated response with rows
  - `/stocks` -> `200`, rows include `qty_available`
- Live sale create smoke test passes when `custom_order_id` is an integer:
  - test Sanity order `NM-20260621-6626`
  - Clickom sale response `201`, `transaction_id: 1510`
  - Sanity order patched approved with the Clickom transaction ID
- `custom_order_id` must be numeric. The earlier Sanity `_id` mapping fails with `422`.

## 1. Returned Sale Status Values

`GET /api/customapi/sales_status?customer_order_id={id}` has only been observed returning values like:

```json
{
  "data": {
    "status": "final",
    "payment_status": "paid"
  }
}
```

The code currently maps known returned values defensively:

- `final`, `completed`, `complete`, `delivered`, `cp` -> `completed`
- `shipped`, `dispatched`, `sp` -> `shipped`
- `cancelled`, `canceled`, `failed`, `refunded`, `cn`, `fl`, `rf` -> `cancelled`
- `processing`, `approved`, `pc` -> `processing`
- `pending`, `on hold`, `on_hold`, `pd`, `oh` -> `pending`

Need Clickom to confirm the full list of strings returned by the GET endpoint.

## 2. Status Push Workaround

The documented status push route is not available live:

- `POST /api/customapi/sales_status?customer_order_id={id}&status=sp` -> `404 route not found`
- `POST /api/customapi/sales_status/{id}?status=sp` -> `405`, supported methods are only `GET, HEAD`
- `GET /api/customapi/sales_status/{id}` works and returns status data

Working workaround:

- `PUT /api/customapi/sales/{custom_order_id}` with the full sale payload plus `status: "sp"` returned `200`.
- A follow-up `GET /api/customapi/sales_status/{custom_order_id}` showed `status: "sp"`.
- Admin status push now uses this full-payload PUT workaround.

## 3. Duplicate Sale Handling

Clickom returns a 500 for duplicate `invoice_no` or duplicate `custom_order_id`.

The code now does not auto-create a retry invoice like `-R1`, because that can create extra real OMS sales. Need Clickom/client confirmation before adding any automatic retry behavior.

## 4. Payment Amount vs Auto Delivery Fee

Clickom auto-appends delivery fee from Custom API Settings. The current approval payload sends payment amount as the Sanity order total and does not send `shipping_charges`.

Need one real test order checked in Clickom to confirm invoices show no unpaid balance when delivery is auto-added.

## 5. Test Sale Permission

User confirmed test sales are allowed, but these still mutate the real Clickom instance:

- `POST /api/customapi/sales`
- `POST /api/customapi/sales_status?customer_order_id={id}&status={code}`
- `PUT /api/customapi/sales/{custom_order_id}`

Use obvious test customer/order names and clean them up from Clickom if the OMS supports cleanup.
