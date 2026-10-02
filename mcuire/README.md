# Mcuire Kitchen: West African Cooking Courses

The online cooking academy for **Mcuire African Restaurant**.
Flagship course: *West African Kitchen: Beginner to Confident Cook*.

Architecture, data model and phases: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Run it

**Static demo (no back end).** Everything is stored in the browser, and payments are simulated in clearly labelled test mode:

```bash
cd mcuire && npx http-server -p 8080   # or any static server
# open http://localhost:8080/#/
```

**Full product (API + accounts + Stripe):**

```bash
cd mcuire
ADMIN_EMAILS=you@example.com node server/server.mjs     # Node 22+
# open http://localhost:8787/#/
```

With no `STRIPE_SECRET_KEY`, checkout is simulated (development only).
Sign-in links are printed to the server console.

Admin: `#/admin`. In demo mode the passcode is in `assets/js/config.js`. On the server,
sign in with an email listed in `ADMIN_EMAILS` (prices and customers) or `STAFF_EMAILS` (recipes and media).

## Going live at kitchen.mcuire.ca (WHC.ca + WordPress)

mcuire.ca stays your WordPress site on WHC.ca, untouched. The academy runs at
**kitchen.mcuire.ca** on Render (an app host), and WordPress links to it.

**1. Put the code on GitHub (5 min).** Create a private repository called
`mcuire-kitchen` and upload the contents of this folder, so `render.yaml` is at the top level.

**2. Create the app on Render (10 min).**
render.com → sign up → **New → Blueprint** → choose `mcuire-kitchen`. Render reads
`render.yaml` and asks for:
- `ADMIN_EMAILS`: the owner's email (gets full admin: prices, customers)
- `STAFF_EMAILS`: kitchen staff emails (can edit recipes and photos)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`: from step 4 (you can add them later)

Plan: Starter + 2 GB disk (roughly US$7–8/month). When it finishes you’ll have an address like
`mcuire-kitchen.onrender.com`. Open it to check that the academy loads.

**3. Point kitchen.mcuire.ca at it (10 min).**
- Render → your service → **Settings → Custom Domains → Add** `kitchen.mcuire.ca`.
  Render shows the target hostname.
- WHC.ca client area → **cPanel → Zone Editor** → mcuire.ca → **+ CNAME Record**:
  Name `kitchen` → Record `mcuire-kitchen.onrender.com` (the target Render showed). Save.
- Wait 5–60 minutes. Render issues the HTTPS certificate automatically.

**4. Turn on real payments in CAD (15 min).**
- Create a **Stripe account registered in Canada** (stripe.com) and complete verification.
- Developers → API keys → copy the **Secret key** into Render as `STRIPE_SECRET_KEY`.
- Developers → Webhooks → **Add endpoint** `https://kitchen.mcuire.ca/api/stripe/webhook`,
  events `checkout.session.completed` and `charge.refunded` → copy the signing secret into
  Render as `STRIPE_WEBHOOK_SECRET`.
- Settings → Payment methods → turn on **Apple Pay** and **Google Pay**, and add the domain
  `kitchen.mcuire.ca` under Apple Pay.
- Test first with Stripe’s test keys (card 4242 4242 4242 4242), then switch to live keys.

**5. Add “Cooking Courses” to the WordPress menu (2 min).**
WordPress admin → **Appearance → Menus** (or **Appearance → Editor → Navigation** on block
themes) → **Custom Links** → URL `https://kitchen.mcuire.ca`, text `Cooking Courses` → Add → Save.

**6. Email delivery.** Receipts and sign-in links are sent by `sendEmail()` in
`server/server.mjs`. Connect an email service (Postmark or Resend; both have free tiers)
before launch. Until then, sign-in links appear only in Render’s logs.

**Before the first sale:** have the chef review each recipe in **Admin → Recipes**, and upload
your own photos and videos from **Admin → Media to shoot**.

Alternative: if your WHC plan offers **“Setup Node.js App” with Node 22 or newer** in cPanel,
the academy can run on WHC directly. Ask WHC support. Otherwise use Render as above.

## Replacing placeholder photography

Every photo and video slot shows a labelled placeholder with the photographer's brief.
`#/admin/media` lists every slot that's still empty, recipe by recipe: that's the shot list for the
Mcuire kitchen. Upload a photo or video in the recipe editor and the placeholder disappears.
Set `showMediaBriefs: false` once the photos are in.
