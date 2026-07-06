# Noora Modesty Email + Domain Setup

This guide covers the manual work needed outside the codebase for production email.

## What The Code Expects

Add these environment variables in Netlify:

```env
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM="Noora Modesty <orders@nooramodesty.com>"
EMAIL_ADMIN_TO="hello@nooramodesty.com"
NEXT_PUBLIC_SITE_URL=https://nooramodesty.com
```

`RESEND_API_KEY` enables sending. Without it, the app still creates Sanity records but skips emails.

`EMAIL_FROM` must use a domain verified in Resend.

`EMAIL_ADMIN_TO` receives inquiry, suggestion, newsletter, and return/exchange admin notifications.

## Recommended Resend Domain

Use the root sending address:

```txt
orders@nooramodesty.com
```

In Resend, add:

```txt
nooramodesty.com
```

Resend recommends sending from domains or subdomains you own, and recommends subdomains for reputation separation. For this storefront, root-domain sending is acceptable if `nooramodesty.com` is mainly used for Noora Modesty transactional email.

Official docs:
- https://resend.com/docs/dashboard/domains/introduction
- https://resend.com/docs/knowledge-base/cloudflare
- https://resend.com/docs/send-with-nextjs

## Cloudflare DNS Setup

In Resend:

1. Go to Domains.
2. Add `nooramodesty.com`.
3. Choose Cloudflare automatic setup if available.
4. If doing manual setup, copy every DNS record Resend gives you into Cloudflare.

In Cloudflare:

1. Open `nooramodesty.com`.
2. Go to DNS > Records.
3. Add the MX/TXT/DKIM records exactly as Resend shows them.
4. Keep email/DKIM-related records as DNS only. Do not proxy them.
5. Return to Resend and click Verify DNS Records.

Resend says verification can take up to 72 hours, but Cloudflare usually propagates much faster.

## If You Do Not Have A Mailbox Yet

Resend can send from `orders@nooramodesty.com` after domain verification, but that does not automatically create an inbox you can log into.

For receiving mail at `hello@nooramodesty.com`, choose one:

1. Cloudflare Email Routing to forward `hello@nooramodesty.com` to an existing Gmail/account.
2. Google Workspace / Zoho Mail / similar hosted mailbox.
3. Resend inbound email webhooks later, if you want emails processed by the app.

Fastest launch setup:

```txt
orders@nooramodesty.com -> used only for sending transactional emails
hello@nooramodesty.com -> Cloudflare Email Routing forwards to client's existing inbox
```

## Netlify Domain Update

When the storefront is ready for the real domain:

1. In Netlify, add `nooramodesty.com` as the production domain.
2. Follow Netlify's Cloudflare DNS instructions.
3. Set `NEXT_PUBLIC_SITE_URL=https://nooramodesty.com`.
4. Redeploy after env changes.
5. Place a test checkout order and confirm:
   - Sanity order is created.
   - Customer confirmation email arrives.
   - Admin notification emails arrive where expected.
   - Links in the emails point to `https://nooramodesty.com`.

## Email Flows Implemented

Checkout:

1. Customer places order.
2. Sanity order is created.
3. Customer receives order confirmation.
4. Bank transfer orders include bank details from Site Settings.

Admin approval:

1. Admin approves order in Sanity.
2. Order pushes to Clickom.
3. Customer receives approval/receipt-style email.

Admin rejection:

1. Admin rejects order in Sanity.
2. Customer receives cancellation/update email.

Return/exchange:

1. Customer submits request.
2. Sanity return/exchange request is created.
3. Admin receives request email.
4. Customer receives request received email.

Lead capture:

1. Newsletter footer signup creates a Sanity lead.
2. Suggestions/feedback form creates a Sanity lead.
3. Admin receives the lead email.
4. Customer receives an acknowledgement email.
