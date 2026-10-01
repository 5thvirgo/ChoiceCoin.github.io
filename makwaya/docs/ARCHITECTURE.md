# Makwaya Kitchen — Architecture & Delivery Plan

Cooking academy for **Makwaya African Restaurant**.
Flagship course: **West African Kitchen — Beginner to Confident Cook**.

> Product principle: we sell *confidence*, not recipes. Every screen answers
> "what do I do now, what should it look like, and how do I know it's right?"

---

## 0. What exists today (inspection result)

This repository is the **Choice Coin** public website (static HTML + Tailwind CDN,
GitHub Pages, `CNAME → choice-coin.com`). It contains **no Makwaya restaurant
website**. To preserve the working Choice Coin site, the academy lives in a
self-contained folder:

```
makwaya/                  ← the cooking academy (static front end, runs anywhere)
  index.html              ← single entry point, hash router
  assets/css/makwaya.css  ← design system
  assets/js/config.js     ← brand name, data source, payment mode (ONE place)
  assets/js/data/seed.js  ← categories, courses, prices, recipes (seed content)
  assets/js/lib/*         ← DOM helpers, unit scaling
  assets/js/services/*    ← store (local/API adapters), timers, payments,
                            achievements, wake lock, certificates
  assets/js/views/*       ← one module per page
  server/                 ← production reference back end (Node 22, zero deps)
    server.mjs            ← static hosting + REST API + Stripe Checkout + webhook
    schema.sql            ← relational schema (SQLite now, Postgres-compatible)
  docs/ARCHITECTURE.md    ← this file
```

**Adding it to the restaurant site (mcuire.ca)** takes one navigation link once it is
deployed at `kitchen.mcuire.ca` (see `README.md` → *Connecting to mcuire.ca*):

```html
<a href="https://kitchen.mcuire.ca/">Cooking Courses</a>
```

> ⚠️ While it lives in this repo, GitHub Pages will publish it at
> `choice-coin.com/makwaya/`. Move it to a Makwaya-owned repository and domain
> before launch. It needs no changes for that: all paths are relative.

---

## 1. Proposed architecture

```
┌──────────────────────────── Browser (mobile-first SPA) ────────────────────────────┐
│ Views: Landing · Catalogue · Course · Recipe · Cook With Me · Checkout · My Kitchen │
│        Shopping list · Certificate · Admin                                          │
│ Services: Store (adapter) · Timers · Wake Lock · Achievements · Payments            │
│                 │                                                                   │
│        ┌────────┴─────────┐                                                         │
│   LocalAdapter        ApiAdapter  ◄── chosen in config.js (`dataSource`)            │
│ (localStorage,       (fetch /api/*)                                                 │
│  demo / offline)                                                                    │
└──────────────────────────────────────┬──────────────────────────────────────────────┘
                                       │ HTTPS, session cookie
┌──────────────────────────────────────▼──────────────────────────────────────────────┐
│ server.mjs  (Node 22, no framework)                                                  │
│  /api/catalog, /api/recipes/:slug  ← entitlement-gated content (preview vs full)    │
│  /api/checkout/session             ← creates Stripe Checkout Session (server price) │
│  /api/stripe/webhook               ← signature-verified; creates account + unlocks  │
│  /api/auth/*                       ← passwordless magic link                        │
│  /api/me/*                         ← progress, saved, shopping list, certificates   │
│  /api/admin/*                      ← role = staff/admin; CRUD content, prices, media│
│ SQLite (node:sqlite) → swap for Postgres in production                              │
│ Media: /uploads (local) → S3/R2 + CDN in production                                 │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

Decisions:

* **Content is document-shaped, commerce is relational.** A recipe (ingredients,
  steps, checkpoints, tips, media) is edited and read as one unit, so it is stored as
  a versioned JSON document. Users, courses, prices, orders, enrollments and
  certificates are relational because they need integrity and reporting.
* **One adapter interface** (`store.js`) means the same UI runs as a static demo
  (GitHub Pages, no back end) and as the real product (API + Stripe).
* **Prices never live in UI code.** They come from the `courses` table (admin
  editable). The checkout endpoint reads the price server-side, so a client
  cannot change what it pays.
* **Paid content is enforced server-side.** In API mode, `/api/recipes/:slug`
  returns only the preview steps unless the user owns a course that contains the
  recipe. (In static demo mode everything ships to the browser. Fine for a demo,
  not for launch.)
* **No framework, no build step.** Plain ES modules load fast on phones, deploy
  anywhere, and are easy to hand over. If the team later wants React/Next.js,
  the data model and API carry over unchanged.

## 2. Pages / routes

| Route | Purpose |
|---|---|
| `#/` | Cooking Courses landing (Makwaya brand, free lesson CTA) |
| `#/courses` | Catalogue: categories, mini courses, flagship |
| `#/courses/:slug` | Course details: modules, outcomes, price, buy |
| `#/recipes/:slug` | Recipe overview: hero, times, servings calculator, ingredients, equipment, allergens, substitutions |
| `#/cook/:slug` | **Cook With Me**: full-screen step-by-step mode |
| `#/try` | Free lesson (Jollof preview, real Cook With Me steps) |
| `#/checkout/:courseSlug` | Checkout: email + pay (Stripe Checkout in production) |
| `#/welcome/:courseSlug` | Purchase confirmed → course unlocked |
| `#/kitchen` | **My Kitchen** dashboard |
| `#/kitchen/shopping` | Shopping list builder + in-store checklist |
| `#/kitchen/certificate` | Certificate (preview until earned, then download/share) |
| `#/verify/:number` | Public certificate verification |
| `#/admin` … | Admin: recipes, recipe editor, courses & prices, discounts, customers, orders, certificates, media |

## 3. Database schema

See `server/schema.sql` (runnable). Summary:

* `users` (id, email ⟂ unique, name, role: customer|staff|admin, created_at)
* `sessions`, `magic_links` (token hash, expiry, used_at)
* `categories` (slug, name, tagline, sort)
* `courses` (slug, title, kind: free|mini|flagship, price_cents, compare_at_cents,
  currency, status, certificate_title, doc JSON for modules & outcomes)
* `course_recipes` (course_id, recipe_id, module, sort)
* `recipes` (slug, title, category_id, status, preview_steps, doc JSON, version)
* `recipe_revisions` (recipe_id, version, doc, edited_by, created_at). Every save is reversible.
* `media` (id, kind photo|video, url, poster_url, alt, width, height, credit, uploaded_by)
* `discounts` (code, percent_off | amount_off_cents, active, expires_at, max_redemptions)
* `orders` (user_id, course_id, amount_cents, currency, discount_code,
  stripe_session_id ⟂ unique, status)
* `enrollments` (user_id, course_id ⟂ unique pair, order_id, granted_at)
* `kitchen_state` (user_id, doc JSON: progress per recipe, cook log, saved, recent, shopping list).
  This is one document per user because it is always read and written together. Visitors' free-lesson
  progress is kept on their device and merged into the account at purchase or sign-in.
* `certificates` (number ⟂ unique, user_id, course_id, name_on_certificate, issued_at)
* Achievements and challenges are computed from the cook log (rules in `content_meta`), so rules can change without migrations.
* `photo_feedback` (future: user upload + guidance, see §9)

## 4. Course & recipe data model

```text
Category 1─* Recipe *─* Course (via modules)
Recipe {
  slug, title, subtitle, categoryId, region, story, status: complete|outline
  prepMinutes, cookMinutes, difficulty, baseServings, servingOptions[]
  allergens[], dietary[], hero: MediaRef, previewSteps
  equipment[]: { name, note }
  ingredients[]: {
    id, name, qty, unit, altQty?, altUnit?, prep?, group, shopCategory,
    scale: linear | taste | fixed | whole, optional?, note?
    availability[]: african-grocery | international | mainstream | online
    substitutes[]: { name, note }            ← "Can't find this?"
  }
  steps[]: {
    id, phase: prep|cook|finish, title, body (plain language),
    cues: { see, smell, hear, texture }, about: "≈ 15 minutes",
    timer?: { minutes, label }
    media[]: MediaRef (photo | video), shot brief for the photographer
    ingredientIds[]                          ← shown scaled inside the step
    tips[]: { kind: makwaya|chef|kitchen|watch|ready, text }
    checkpoint?: { question, options[]: { label, verdict: good|wait|fix, media, guidance } }
    troubleshooting[]: { problem, fix }
  }
}
MediaRef { kind, src|null, poster?, alt, brief, tone }   ← src null ⇒ placeholder
```

Quantities are stored for `baseServings` and scaled at render time. `scale`
controls behaviour: `linear` (rice, oil), `whole` (round to whole items: bay
leaves, peppers), `taste` (scotch bonnet, salt: scaled but flagged "adjust to
taste"), `fixed` (doesn't scale). Large batches (>10 servings) show a cooking
time and pot-size warning.

## 5. Media architecture

* Every image or video position is a **MediaRef** with a `brief` (what the
  photographer must capture) and a warm placeholder. Nothing is AI-generated.
  Placeholders are clearly labelled and the admin lists which slots are still missing.
* Admin can paste a URL or upload a file per slot (hero, ingredient, step,
  checkpoint comparison, video + poster).
* Production: upload to object storage (S3/Cloudflare R2) via pre-signed URL →
  CDN; generate 480/960/1600 px WebP/AVIF variants; videos as short (5–30 s) H.264
  MP4 + poster, `muted playsinline loop` so they autoplay inline on phones.
* Local server stores uploads under `server/uploads/` (development only).

## 6. Authentication

* **No registration before payment.** Checkout asks only for email (Stripe
  collects it). The webhook creates or activates the account and grants the
  enrollment, then emails a **magic sign-in link**. The success page also signs
  the buyer in immediately using the verified Checkout Session id.
* Passwordless magic links (single-use, 15 min, stored hashed) + HTTP-only,
  `Secure`, `SameSite=Lax` session cookie (30 days).
* Roles: `customer`, `staff` (content), `admin` (content + prices + customers).
* Later: Google / Apple sign-in as alternative login methods on the same `users` row.

## 7. Payment architecture

* **Stripe Checkout (hosted)**. It handles cards, Apple Pay and Google Pay
  automatically (enable them in the Stripe dashboard + verify the domain for
  Apple Pay), plus SCA/3-D Secure, receipts and tax.
* Flow: `Buy` → `POST /api/checkout/session {courseSlug, discountCode, email?}` →
  server loads price from DB, applies discount → Stripe session (metadata:
  course_id) → redirect → Stripe → `success_url` (`#/welcome/:slug?session_id=`) →
  webhook `checkout.session.completed` (signature-verified) → order `paid`,
  user upserted, enrollment granted (idempotent on `stripe_session_id`).
* Refunds (`charge.refunded`) revoke the enrollment.
* Demo mode (`payments: "demo"`) simulates the same flow locally, clearly
  labelled as test mode, so the UX can be reviewed without keys.

## 8. Admin architecture

* `#/admin` behind role check (server) / passcode (static demo only).
* Recipe editor organised the way a chef thinks: **Basics → Ingredients →
  Equipment → Steps → Media → Publishing**. Each step card holds text, cues,
  timer, tips, checkpoint options and media slots. Steps can be added,
  duplicated, reordered and deleted.
* Courses & pricing: price, compare-at price, status, modules → recipes.
* Discounts, customers, orders, certificates (list + revoke), media gaps report.
* Every recipe save creates a revision (server), so a bad edit can be rolled back.

## 9. MVP vs future

**MVP (this build):** landing, catalogue, course page, checkout (demo + Stripe
endpoints), My Kitchen, full Party Jollof Cook With Me (timers, checkpoints,
tips, troubleshooting, servings, progress, wake lock, completion), shopping
list, achievements & challenges, certificate with download/share/verify, admin
recipe editor + pricing + discounts, outlines for the remaining curriculum.

**Next:** write and photograph the remaining recipes in the same format,
transactional email (Postmark/Resend), production DB/media storage, analytics
(step drop-off to see where cooks struggle), PWA offline caching of owned recipes.

**Future (architected, not built):**
* *"Does this look ready?"* photo feedback: the checkpoint already defines the
  reference states (`too watery / almost / correct / too dry`) and their reference
  photos. A vision model classifies a user photo against **those Makwaya
  reference states** and returns the matching option's guidance, reviewed by
  Makwaya. Stored in `photo_feedback` and labelled as guidance, not a guarantee.
* Quiet assistance: substitution suggestions, troubleshooting search, recommendations.
  Shown in Makwaya's voice, never branded "AI".
* New course lines (Ghanaian Cooking, Meal Prep, Baking, Catering…) are just new
  `courses` rows + recipes. One account owns many courses through `enrollments`.

## 10. Implementation phases

1. **Foundation**: design system, router, data model, seed content, store adapters. ✅
2. **Cook With Me**: Party Jollof end-to-end on mobile. ✅
3. **Commerce**: catalogue, course page, checkout, unlock, My Kitchen. ✅
4. **Retention**: shopping list, achievements, challenges, certificate. ✅
5. **Admin**: recipe editor, prices, discounts, customers/orders/certificates. ✅
6. **Back end**: schema, API, Stripe Checkout + webhook, magic link. ✅ (reference; needs keys + hosting)
7. **Content production**: photograph Jollof using the shot list, then write and
   shoot the remaining recipes. *(Makwaya kitchen)*
8. **Launch hardening**: Postgres, object storage, email, monitoring, legal pages,
   accessibility audit, Apple Pay domain verification.
