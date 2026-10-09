=== Mcuire Cooking Courses ===
Requires at least: 6.0
Requires PHP: 7.4
Stable tag: 1.7.1

Mcuire African Restaurant's online West African cooking academy, at /cooking-courses/.

== Installation ==
1. WordPress admin → Plugins → Add New → Upload Plugin → choose mcuire-cooking-courses.zip → Install → Activate.
2. Visit yoursite/cooking-courses/ (a "Cooking Courses" link is added to your menu automatically when possible).
3. WordPress admin → Cooking Courses: add your Stripe account(s). Each course chooses which account it pays into
   in the course admin (Courses & prices).
4. Logged-in WordPress administrators manage recipes, prices and photos at yoursite/cooking-courses/#/admin.

Requires "pretty" permalinks (Settings → Permalinks: anything except "Plain").
Emails (receipts and sign-in links) are sent with WordPress's normal email (wp_mail).

Set your timezone in Settings → General (e.g. Toronto) so live-class times in emails are right.

== What you can sell ==
* Single dishes: every finished dish is its own lesson ($20 for quick beginner dishes, $30 for the rest).
  Change prices in bulk in the course admin → Courses & prices → Single dishes.
* Bundles and the full West African Kitchen programme.
* Live cooking classes (online or in person): course admin → Live classes. Set the date, seats, price
  and the Zoom/Meet link or address, then switch the class to Published. Only paying guests see the
  link (in My Kitchen and their ticket email). You get an email for each booking and can see the guest list.

== Updating ==
Upload the new zip (Plugins → Add New → Upload → Replace current). Your recipes, prices, customers and
Stripe settings are kept; new dishes and courses are added. Example live classes arrive as drafts.

== Changelog ==
= 1.7.1 =
* Fix: visitors could see an old saved copy of the Cooking Courses page from the LiteSpeed page cache. That page is now never cached, and every plugin update (and turning the site style on or off) clears saved pages in LiteSpeed and other common cache plugins.

= 1.7.0 =
* Mcuire site style for the whole website (on by default, switch in Settings → Website look): tidy one-line header with the logo and an animated kente edge that shrinks and tucks away while scrolling; full-screen phone menu; Call and Reserve buttons on phones; footer with the logo on a cream badge, round social buttons and kente edge; hover and shine on buttons, gentle photo zoom, hero slow zoom and fade-in, and scroll animations. Respects "reduce motion".

= 1.6.0 =
* Fix: checkout failed with "the product tax code is missing … Managed Payments" on Stripe accounts where Managed Payments is on by default. Checkout now takes these as normal Stripe payments (HST is already added by the plugin).
* Wholesale Drinks page at /wholesale-drinks/: Zobo for event bulk orders and wholesale cases, with a "Request a Bulk Order Quote" form (quantity in bottles or cases, date, delivery location, pickup or delivery, serve or resell). Requests are emailed to the owners and listed under Cooking Courses → Wholesale orders.
* Site menu put in order once: Home, Cooking Courses, Event Catering, Weekday Menu, Weekend Menu, Wholesale Drinks, then any other links. The previous menu is saved so it can be restored.

= 1.5.2 =
* Mcuire logo on the course pages (header and footer), on certificates and in search results; the browser tab uses the site icon.
* Mcuire's own photos for Waakye and White Rice & Stew, shipped with the plugin. Updating replaces the earlier stock photos for these two dishes (photos you uploaded yourself are kept).

= 1.5.1 =
* Same fonts as mcuire.ca everywhere: Playfair Display headings and Roboto text, larger and easier to read, with stronger contrast.
* Buttons, links, menus, dish cards, photos and form fields respond to hover, tap and keyboard focus.

= 1.5.0 =
* Weekend cooking classes in the restaurant: customers pick any Saturday or Sunday, a start time, how many hours and how many people. $75 per hour per person plus 13% HST, paid by Stripe.
* Places are limited per hour (10 by default) so the kitchen is never overbooked.
* Course admin → Live classes → Weekend classes: change the price, days, times, hours, group size, tax and see every weekend booking.

= 1.4.0 =
* Event Catering page at /event-catering/ with past events gallery, quote request form and a menu link.
* Catering requests are emailed to the owners and listed under Cooking Courses → Catering requests.
= 1.3.0 =
* Search engines: every dish, course and live class has its own address with title, description, photo and Recipe/Course/Event data, plus a sitemap at /cooking-courses/sitemap.xml.
* Share buttons (WhatsApp, Facebook, X, copy link) on every dish and after finishing a lesson.
= 1.2.0 =
* Real photos for every dish, plus step-by-step look, smell and sound notes on every step.
* Updating keeps your own photos and edits, and only fills in what is missing.
* Live classes now take place at the restaurant first, with Zoom or Meet as an option.
= 1.1.0 =
* Buy any single dish on its own.
* Live cooking classes with seat limits, tickets, booking emails and a guest list.
= 1.0.0 =
* First release.
