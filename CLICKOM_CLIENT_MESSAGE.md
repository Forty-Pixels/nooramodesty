# Clickom Follow-up Message

Hi, we want to clarify the intended website-to-Clickom order flow and what Clickom needs from our side.

Our flow is:

1. Customer places an order on the Noora Modesty website.
2. The order is saved in our Sanity backend/CMS first.
3. Noora admin reviews it in Sanity and clicks Approve.
4. Only after approval, our backend sends the order to Clickom through the Custom API.
5. The approved order must then appear in the Clickom OMS dashboard, ideally in Order Management, so the operations team can fulfill it.

We successfully created a test sale through the Custom API:

- `transaction_id`: `1510`
- `invoice_no`: `NM-20260621-6626`
- `custom_order_id`: `606216626`

The API confirms it exists:

`GET /api/customapi/sales_status/606216626`

But we cannot find it in:

`https://nooramodestynew.clickom.lk/ordermanagement/order`

Also, our dashboard user gets `403 Unauthorized` on:

`https://nooramodestynew.clickom.lk/sells`

We added a technical handoff document with our current flow, Sanity schema fields, backend API routes, Clickom payload, tested API results, and exact questions. Please review it and confirm what fields/permissions/endpoints are needed so API-created website orders appear in Order Management.
