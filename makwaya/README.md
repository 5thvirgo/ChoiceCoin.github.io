# Makwaya Kitchen: West African Cooking Courses

The online cooking academy for **Makwaya African Restaurant**.
Flagship course: *West African Kitchen: Beginner to Confident Cook*.

Architecture, data model and phases: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Run it

**Static demo (no back end).** Everything is stored in the browser, and payments are simulated in clearly labelled test mode:

```bash
cd makwaya && npx http-server -p 8080   # or any static server
# open http://localhost:8080/#/
```

**Full product (API + accounts + Stripe):**

```bash
cd makwaya
ADMIN_EMAILS=you@example.com node server/server.mjs     # Node 22+
# open http://localhost:8787/#/
```

With no `STRIPE_SECRET_KEY`, checkout is simulated (development only).
Sign-in links are printed to the server console.

Admin: `#/admin`. In demo mode the passcode is in `assets/js/config.js`. On the server,
sign in with an email listed in `ADMIN_EMAILS` (prices and customers) or `STAFF_EMAILS` (recipes and media).

## Connecting to mcuire.ca

Recommended: run the academy on a sub-domain, **`kitchen.mcuire.ca`**, and link to it
from the main restaurant site. This works whatever builder mcuire.ca uses
(Wix, Squarespace, WordPress, Shopify…), because nothing on the main site has to change
except one menu link.

1. **Host the server.** Any Node host with a persistent disk works (Render, Railway,
   Fly.io, DigitalOcean App Platform, or a small VPS). Use the `Dockerfile`, mount
   persistent storage at `/data` and `/app/server/uploads`, and set the variables in
   `.env.example` with `BASE_URL=https://kitchen.mcuire.ca`.
2. **DNS.** Where mcuire.ca's DNS is managed, add
   `CNAME  kitchen  →  <the hostname your host gives you>`, then enable HTTPS on the host.
3. **Main site menu.** Add a navigation item, **Cooking Courses**, linking to
   `https://kitchen.mcuire.ca/`.
4. **Stripe.** In the Stripe dashboard:
   - Create a webhook to `https://kitchen.mcuire.ca/api/stripe/webhook` with the events
     `checkout.session.completed` and `charge.refunded`. Put its signing secret in
     `STRIPE_WEBHOOK_SECRET`.
   - Enable Apple Pay and Google Pay under Payment methods, and register the domain
     `kitchen.mcuire.ca` for Apple Pay.
5. **Email.** Connect a provider (Postmark, Resend or SES) in `sendEmail()` in
   `server/server.mjs`, so receipts and sign-in links are actually delivered.

Alternative: serve it at `mcuire.ca/kitchen/` instead. This only works if mcuire.ca's
host can reverse-proxy a path to the Node server, which most website builders can't.
In that case use the sub-domain.

## Replacing placeholder photography

Every photo and video slot shows a labelled placeholder with the photographer's brief.
`#/admin/media` lists every slot that's still empty, recipe by recipe: that's the shot list for the
Makwaya kitchen. Upload a photo or video in the recipe editor and the placeholder disappears.
Set `showMediaBriefs: false` once the photos are in.
