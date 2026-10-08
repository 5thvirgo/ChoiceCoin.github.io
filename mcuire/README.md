# Mcuire Kitchen: West African Cooking Courses

The online cooking academy for **Mcuire African Restaurant**.
Flagship course: *West African Kitchen: Beginner to Confident Cook*.

Architecture, data model and phases: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

**What customers can buy**
- **Single dishes:** each of the 37 finished dishes is its own Cook With Me lesson: $20 CAD for quick
  beginner dishes, $30 for the rest. Prices are set in **Admin → Courses & prices → Single dishes**
  (there is also a "set every dish to" bulk price).
- **Bundles** and the full **West African Kitchen** programme (which unlocks everything).
- **Live cooking classes** (`#/live`): hands-on classes in the restaurant, or online on Zoom/Google Meet, with a seat
  limit. Manage them in **Admin → Live classes**. The join link or address is only shown to people who
  paid (in My Kitchen, from 30 minutes before the class, and in their ticket email). The three example
  classes are installed as drafts on WordPress. Set real dates and links, then publish.
  Live classes are supported by the WordPress plugin; the stand-alone Node server does not have them yet.

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

## Going live at mcuire.ca/cooking-courses (WHC.ca + WordPress)

Customers only ever see **mcuire.ca/cooking-courses**. It has two parts:

| Part | Where | What it does |
|---|---|---|
| The pages | A `cooking-courses` folder in your WHC.ca hosting, next to WordPress | Everything customers see and click |
| The background server | Render (app host, about US$7–8/month) | Accounts, Stripe payments, admin, photo uploads |

WordPress itself is not changed. Its own rules leave real folders alone, so
`mcuire.ca/cooking-courses/` serves the academy.

**1. Put the code on GitHub (5 min).** Create a private repository `mcuire-kitchen` and
upload the contents of this folder, so `render.yaml` is at the top level.

**2. Start the background server on Render (10 min).**
render.com → **New → Blueprint** → choose `mcuire-kitchen`. Enter:
- `ADMIN_EMAILS`: the owner’s email (full admin: prices, Stripe accounts, customers)
- `STAFF_EMAILS`: kitchen staff (recipes and photos)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`: from step 4 (you can add them later)

When it’s live you’ll have an address like `https://mcuire-kitchen.onrender.com`.
If Render gives a different name, update `BASE_URL` in Render to match.

**3. Upload the pages to WHC.ca (5 min).**
- On a computer with this folder: `API_BASE=https://mcuire-kitchen.onrender.com tools/build-page.sh`.
  That creates `dist/cooking-courses/index.html`. (A ready-built copy is in the package under
  `upload-to-WHC/`; it already points to `https://mcuire-kitchen.onrender.com`.)
- WHC.ca client area → **cPanel → File Manager** → `public_html` → **+ Folder** `cooking-courses`
  → open it → **Upload** `index.html`.
- Visit `https://mcuire.ca/cooking-courses/` to check that it loads.

**4. Stripe: one account or several (15 min per account).**
Each course can pay into its own Stripe account (Canadian accounts, CAD).
- **Main account:** in Stripe, go to Developers → API keys and copy the **Secret key** into Render as
  `STRIPE_SECRET_KEY`. Then Developers → Webhooks → **Add endpoint**
  `https://mcuire-kitchen.onrender.com/api/stripe/webhook`, with events
  `checkout.session.completed` and `charge.refunded`. Copy the signing secret into Render as
  `STRIPE_WEBHOOK_SECRET`.
- **Each extra account:** pick a short name, e.g. `SOUPS`. In Render → Environment add
  `STRIPE_SECRET_KEY_SOUPS` and `STRIPE_WEBHOOK_SECRET_SOUPS`. In that Stripe account, the webhook
  endpoint is `https://mcuire-kitchen.onrender.com/api/stripe/webhook/soups`.
- Then in the academy: **Admin → Courses & prices → “Pay into Stripe account”** and choose which
  account each course pays into. **Admin → Purchases** shows which account each sale went to.
- Card, Apple Pay and Google Pay appear automatically on Stripe’s secure payment page.
  Turn them on under Settings → Payment methods.
- Test first with Stripe’s **test** keys (card 4242 4242 4242 4242), then switch to live keys.
- **Never email or message secret keys.** Paste them only into Render.

**5. Add “Cooking Courses” to the WordPress menu (2 min).**
WordPress admin → **Appearance → Menus** (block themes: **Appearance → Editor → Navigation**)
→ **Custom Links** → URL `https://mcuire.ca/cooking-courses/`, text `Cooking Courses` → Add → Save.

**6. Email delivery.** Receipts and sign-in links are sent by `sendEmail()` in
`server/server.mjs`. Connect Postmark or Resend before launch. Until then, sign-in links appear
only in Render’s logs.

**Timezone:** WordPress → Settings → General → Timezone → *Toronto* (or your city), so live-class
times in emails are correct.

**Before the first sale:** have the chef review each recipe (**Admin → Recipes**) and upload your
own photos and videos (**Admin → Media to shoot**).

## Replacing placeholder photography

Every photo and video slot shows a labelled placeholder with the photographer's brief.
`#/admin/media` lists every slot that's still empty, recipe by recipe: that's the shot list for the
Mcuire kitchen. Upload a photo or video in the recipe editor and the placeholder disappears.
Set `showMediaBriefs: false` once the photos are in.
