# Email & Domain Setup Guide

Covers three things you need to do outside the codebase before transactional emails go live:

1. Verify `nooramodesty.com` in Resend so emails send from `orders@nooramodesty.com`.
2. Point `nooramodesty.com` at Netlify (replacing the `*.netlify.app` URL).
3. Set the required environment variables in Netlify and locally.

---

## 1. Resend account + domain verification

1. Sign up / log in at [resend.com](https://resend.com).
2. **API key**: Dashboard → API Keys → Create API Key. Name it something like `noora-production`. Copy the key immediately (shown once) — this is `RESEND_API_KEY`.
3. **Add domain**: Dashboard → Domains → Add Domain → enter `nooramodesty.com`.
4. Resend will show you a set of DNS records to add — typically:
   - **SPF**: a `TXT` record on `send` (or root, depends on Resend's current UI) with a value like `v=spf1 include:amazonses.com ~all`
   - **DKIM**: one or more `CNAME` or `TXT` records, usually named like `resend._domainkey`
   - **DMARC** (optional but recommended): `TXT` record on `_dmarc` with a value like `v=DMARC1; p=none;`

   Copy the exact host/type/value Resend shows you — don't use the example values above, they change per account.

5. **Add those records at your domain registrar** (wherever `nooramodesty.com` is registered — GoDaddy, Namecheap, Cloudflare, etc.):
   - Go to DNS management for the domain.
   - Add each record exactly as Resend specifies (host, type, value/priority).
   - DNS propagation can take a few minutes to a few hours.
6. Back in Resend, click **Verify** on the domain. Once all records show green, the domain is verified and you can send from any `@nooramodesty.com` address (the code uses `orders@nooramodesty.com`).
7. Until verification is done, `RESEND_API_KEY` can still be set and the app will work — but emails will fail to send from an unverified domain (Resend rejects the send). You can temporarily test with Resend's shared sandbox domain (`onboarding@resend.dev`) if you want to confirm the email code works before DNS finishes propagating — ask me to swap `FROM_ADDRESS` in `lib/server/email.ts` temporarily for that.

---

## 2. Point the domain at Netlify

Right now the live site is only reachable at the `*.netlify.app` URL. To serve it from `nooramodesty.com`:

1. In **Netlify** → your site → **Domain management** → **Add a domain** → enter `nooramodesty.com` (and `www.nooramodesty.com` if you want both).
2. Netlify will tell you to either:
   - **Use Netlify DNS** (they become your DNS host — simplest, they auto-configure everything), or
   - **Keep your current DNS provider** and manually add the records Netlify gives you (usually an `A` record pointing to Netlify's load balancer IP, plus a `CNAME` for `www`).
3. Add whichever records Netlify specifies at your registrar (same place you added the Resend records).
4. Netlify auto-provisions an SSL certificate (Let's Encrypt) once DNS resolves correctly — this can take up to a few hours after DNS propagates.
5. Once the custom domain is verified in Netlify, set it as the **primary domain** so canonical URLs and redirects use `nooramodesty.com` instead of the `.netlify.app` address.

You can do steps 1 and 2 in parallel — they're independent DNS records on the same domain (Resend needs TXT/CNAME records for mail, Netlify needs an A/CNAME for the web traffic).

---

## 3. Environment variables

Once the domain is verified in both places, set these in **Netlify → Site settings → Environment variables** (and in your local `.env.local` for dev):

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | The API key from step 1 |
| `NEXT_PUBLIC_SITE_URL` | `https://nooramodesty.com` (used for the logo image and CTA links inside emails) |

After adding/changing env vars in Netlify, trigger a new deploy for them to take effect.

---

## 4. Test it

Once both are verified and env vars are set:

1. Place a test order on the live site (or locally with `RESEND_API_KEY` set) and confirm the confirmation email arrives from `orders@nooramodesty.com`.
2. Approve/reject that order from Sanity Studio's orders dashboard and confirm the follow-up email arrives.
3. Submit a return/exchange request and confirm both the admin copy (`hello@nooramodesty.com`) and customer copy arrive.

If an email doesn't arrive, check the Netlify function logs for `"...Skipping email..."` (means `RESEND_API_KEY` isn't set in that environment) or a Resend API error (usually means the domain isn't verified yet).
