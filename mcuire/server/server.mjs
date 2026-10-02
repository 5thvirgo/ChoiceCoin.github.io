#!/usr/bin/env node
// Mcuire Kitchen server: zero dependencies (Node 22+).
//
//   node server/server.mjs
//
// Environment:
//   PORT                   default 8787
//   BASE_URL               this server's public URL, e.g. https://mcuire-kitchen.onrender.com (default http://localhost:PORT)
//   APP_URL                where customers see the pages, e.g. https://mcuire.ca/cooking-courses (default BASE_URL)
//   DATABASE_PATH          default server/data/mcuire.db
//   STRIPE_SECRET_KEY      sk_live_… / sk_test_…  (omit in development → simulated payments)
//   STRIPE_WEBHOOK_SECRET  whsec_…
//   STRIPE_SECRET_KEY_<NAME>, STRIPE_WEBHOOK_SECRET_<NAME>
//                          extra Stripe accounts (e.g. _SOUPS). Each course chooses its
//                          account in Admin → Courses & prices; the default is used otherwise.
//   UPLOAD_DIR             where uploaded photos/videos are stored (default server/uploads)
//   ADMIN_EMAILS           comma-separated emails that become admins on sign-in
//   STAFF_EMAILS           comma-separated emails that become staff (content only)
//   NODE_ENV=production    disables simulated payments and dev email logging of tokens
//
// Serves the static front end from ../ with dataSource:'api', and the REST API under /api.

import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED } from '../assets/js/data/seed.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..');
const PORT = Number(process.env.PORT || 8787);
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const APP_URL = (process.env.APP_URL || BASE_URL).replace(/\/$/, '');
// Pages hosted on another site (e.g. mcuire.ca) may call this server.
const APP_ORIGIN = new URL(APP_URL).origin;
const CROSS_SITE = APP_ORIGIN !== new URL(BASE_URL).origin;
const PROD = process.env.NODE_ENV === 'production';
// Stripe accounts by name: 'default' plus any STRIPE_SECRET_KEY_<NAME>.
// Keys only ever live in the host's environment settings, never in the database.
const STRIPE_ACCOUNTS = new Map();
for (const [k, v] of Object.entries(process.env)) {
  const m = /^STRIPE_SECRET_KEY(?:_([A-Z0-9_]+))?$/.exec(k);
  if (!m || !v) continue;
  const suffix = m[1] || '';
  STRIPE_ACCOUNTS.set(suffix ? suffix.toLowerCase() : 'default', {
    key: v, webhookSecret: process.env[`STRIPE_WEBHOOK_SECRET${suffix ? `_${suffix}` : ''}`] || '',
  });
}
const STRIPE_KEY = STRIPE_ACCOUNTS.size > 0; // payments enabled
const STRIPE_API_BASE = PROD ? 'https://api.stripe.com' : (process.env.STRIPE_API_BASE || 'https://api.stripe.com'); // overridable only for local testing
function stripeAccount(name) {
  return STRIPE_ACCOUNTS.get(name || 'default') || STRIPE_ACCOUNTS.get('default') || [...STRIPE_ACCOUNTS.values()][0];
}
const emails = (v) => new Set((v || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
const ADMIN_EMAILS = emails(process.env.ADMIN_EMAILS);
const STAFF_EMAILS = emails(process.env.STAFF_EMAILS);
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(here, 'uploads'));
const SESSION_DAYS = 30;

if (PROD && !STRIPE_KEY) {
  console.error('STRIPE_SECRET_KEY is required in production.');
  process.exit(1);
}

// ------------------------------------------------------------------ database
const dbPath = process.env.DATABASE_PATH || path.join(here, 'data', 'mcuire.db');
await mkdir(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(readFileSync(path.join(here, 'schema.sql'), 'utf8'));
// Migrations for databases created by earlier versions.
if (!db.prepare("SELECT 1 FROM pragma_table_info('orders') WHERE name = 'stripe_account'").get()) db.exec('ALTER TABLE orders ADD COLUMN stripe_account TEXT');

const q = (sql) => db.prepare(sql);
const now = () => new Date().toISOString();
const json = (v) => JSON.stringify(v);
const parse = (s) => (s ? JSON.parse(s) : null);
function tx(fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
}

function saveCourseRow(c) {
  const { priceCents, compareAtCents, currency, certificateTitle, ...doc } = c;
  q(`INSERT INTO courses (id, slug, kind, status, price_cents, compare_at_cents, currency, certificate_title, doc, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, status=excluded.status, price_cents=excluded.price_cents,
       compare_at_cents=excluded.compare_at_cents, certificate_title=excluded.certificate_title, doc=excluded.doc, updated_at=excluded.updated_at`)
    .run(c.id, c.slug, c.kind, c.status, priceCents, compareAtCents ?? null, currency || 'CAD', certificateTitle ?? null, json(doc), now());
  q('DELETE FROM course_recipes WHERE course_id = ?').run(c.id);
  const ins = q('INSERT OR IGNORE INTO course_recipes (course_id, recipe_id, module_id, sort) VALUES (?,?,?,?)');
  c.modules.forEach((m) => m.recipeIds.forEach((rid, i) => ins.run(c.id, rid, m.id, i)));
}

function saveRecipeRow(r, editedBy = null) {
  const prev = q('SELECT version FROM recipes WHERE id = ?').get(r.id);
  const version = (prev?.version || 0) + 1;
  q(`INSERT INTO recipes (id, slug, status, category_id, preview_steps, version, doc, updated_at) VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, status=excluded.status, category_id=excluded.category_id,
       preview_steps=excluded.preview_steps, version=excluded.version, doc=excluded.doc, updated_at=excluded.updated_at`)
    .run(r.id, r.slug, r.status, r.categoryId, r.previewSteps || 0, version, json(r), now());
  q('INSERT INTO recipe_revisions (recipe_id, version, doc, edited_by) VALUES (?,?,?,?)').run(r.id, version, json(r), editedBy);
}

// Seed an empty database from the same seed file the static demo uses.
if (!q('SELECT 1 FROM courses LIMIT 1').get()) {
  tx(() => {
    SEED.categories.forEach((c) => q('INSERT INTO categories (id, sort, doc) VALUES (?,?,?)').run(c.id, c.sort, json(c)));
    SEED.recipes.forEach((r) => saveRecipeRow(r));
    SEED.courses.forEach(saveCourseRow);
    SEED.discounts.forEach((d) => q('INSERT INTO discounts (code, percent_off, active, note) VALUES (?,?,?,?)').run(d.code, d.percentOff, d.active ? 1 : 0, d.note || ''));
    for (const key of ['achievements', 'challenges', 'freeLesson']) q('INSERT INTO content_meta (key, doc) VALUES (?,?)').run(key, json(SEED[key]));
  });
  console.log('Seeded database from assets/js/data/seed.js');
}

// ------------------------------------------------------------------ content helpers
function courseFromRow(row) {
  return { ...parse(row.doc), id: row.id, slug: row.slug, kind: row.kind, status: row.status, priceCents: row.price_cents, compareAtCents: row.compare_at_cents ?? undefined, currency: row.currency, certificateTitle: row.certificate_title ?? undefined };
}
const allCourses = () => q('SELECT * FROM courses').all().map(courseFromRow);
const getCourse = (id) => { const r = q('SELECT * FROM courses WHERE id = ? OR slug = ?').get(id, id); return r && courseFromRow(r); };
const getRecipe = (idOrSlug) => parse(q('SELECT doc FROM recipes WHERE id = ? OR slug = ?').get(idOrSlug, idOrSlug)?.doc);

function ownsRecipe(userId, recipeId) {
  if (!userId) return false;
  return !!q(`SELECT 1 FROM enrollments e JOIN course_recipes cr ON cr.course_id = e.course_id
              WHERE e.user_id = ? AND cr.recipe_id = ? LIMIT 1`).get(userId, recipeId);
}

// Paid steps never leave the server for visitors who don't own the recipe.
// Locked steps are reduced to a stub (title, phase, timer) so the outline is still visible.
function gateRecipe(recipe, userId) {
  if (recipe.status !== 'complete' || ownsRecipe(userId, recipe.id)) return recipe;
  const free = recipe.previewSteps || 0;
  return {
    ...recipe,
    locked: true,
    steps: recipe.steps.map((s, i) => (i < free ? s : { id: s.id, title: s.title, phase: s.phase, timer: s.timer, locked: true })),
  };
}

// ------------------------------------------------------------------ auth
const hash = (t) => createHash('sha256').update(t).digest('hex');
const token = () => randomBytes(32).toString('base64url');

function roleFor(email) {
  const e = email.toLowerCase();
  if (ADMIN_EMAILS.has(e)) return 'admin';
  if (STAFF_EMAILS.has(e)) return 'staff';
  return null;
}

function upsertUser(email, name = '') {
  const e = String(email).trim().toLowerCase();
  let user = q('SELECT * FROM users WHERE email = ?').get(e);
  if (!user) {
    q('INSERT INTO users (email, name, role) VALUES (?,?,?)').run(e, name, roleFor(e) || 'customer');
    user = q('SELECT * FROM users WHERE email = ?').get(e);
  } else if (roleFor(e) && user.role !== roleFor(e)) {
    q('UPDATE users SET role = ? WHERE id = ?').run(roleFor(e), user.id);
    user.role = roleFor(e);
  }
  return user;
}

function createSession(res, userId) {
  const t = token();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  q('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)').run(hash(t), userId, expires.toISOString());
  res.setHeader('Set-Cookie', `mk_session=${t}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}${BASE_URL.startsWith('https') ? '; Secure' : ''}`);
  return t;
}

// Session token from the Authorization header (pages on another site) or the cookie (same site).
function sessionTokenFrom(req) {
  const bearer = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '')?.[1];
  return bearer || /(?:^|;\s*)mk_session=([^;]+)/.exec(req.headers.cookie || '')?.[1] || null;
}

function currentUser(req) {
  const t = sessionTokenFrom(req);
  if (!t) return null;
  return q(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`).get(hash(t), now()) || null;
}

// Email delivery is pluggable. Development logs the message; production should
// replace this with Postmark / Resend / SES.
async function sendEmail(to, subject, text) {
  if (!PROD) console.log(`\n--- EMAIL to ${to}\nSubject: ${subject}\n${text}\n---\n`);
  else console.log(`[email] ${subject} → ${to} (configure a provider in sendEmail)`);
}

async function sendMagicLink(user) {
  const t = token();
  q('INSERT INTO magic_links (token_hash, user_id, expires_at) VALUES (?,?,?)').run(hash(t), user.id, new Date(Date.now() + 15 * 60e3).toISOString());
  await sendEmail(user.email, 'Your Mcuire Kitchen sign-in link', `Tap to open your kitchen (valid 15 minutes):\n${BASE_URL}/api/auth/verify?token=${t}`);
}

// ------------------------------------------------------------------ commerce
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function certificateNumber() {
  const body = Array.from(randomBytes(6), (b) => ALPHABET[b % 32]).join('');
  let sum = 0;
  [...body].forEach((ch, i) => { sum += (ALPHABET.indexOf(ch) + 1) * (i + 1); });
  return `MCU-${new Date().getFullYear()}-${body}-${ALPHABET[sum % 31]}`;
}

function priceFor(course, code) {
  const d = code ? q('SELECT * FROM discounts WHERE code = ? AND active = 1').get(code) : null;
  const valid = d && (!d.expires_at || d.expires_at > now()) && (d.max_redemptions == null || d.redemptions < d.max_redemptions);
  const off = valid ? Math.round((course.priceCents * d.percent_off) / 100) : 0;
  return { total: course.priceCents - off, code: valid ? d.code : null };
}

// Idempotent: safe to call from both the webhook and the success-page confirm.
function fulfill({ sessionId, email, paymentIntent }) {
  return tx(() => {
    const order = q('SELECT * FROM orders WHERE stripe_session_id = ?').get(sessionId);
    if (!order) throw new Error(`Unknown checkout session ${sessionId}`);
    const user = upsertUser(email || order.email);
    if (order.status !== 'paid') {
      q('UPDATE orders SET status = ?, user_id = ?, email = ?, payment_intent = ?, paid_at = ? WHERE id = ?').run('paid', user.id, user.email, paymentIntent || null, now(), order.id);
      if (order.discount_code) q('UPDATE discounts SET redemptions = redemptions + 1 WHERE code = ?').run(order.discount_code);
      const course = getCourse(order.course_id);
      const grant = course.kind === 'flagship' ? allCourses().map((c) => c.id) : [course.id];
      const ins = q('INSERT OR IGNORE INTO enrollments (user_id, course_id, order_id) VALUES (?,?,?)');
      grant.forEach((cid) => ins.run(user.id, cid, order.id));
    }
    return { user, order: { ...order, status: 'paid' }, firstTime: order.status !== 'paid' };
  });
}

async function stripe(account, method, pathname, form) {
  const res = await fetch(`${STRIPE_API_BASE}/v1/${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${account.key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form ? new URLSearchParams(form) : undefined,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error?.message || 'Stripe request failed');
  return body;
}

function verifyStripeSignature(raw, header, secret) {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=')));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex');
  const sigs = header.split(',').filter((kv) => kv.startsWith('v1=')).map((kv) => kv.slice(3));
  return sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

// ------------------------------------------------------------------ HTTP plumbing
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(body === undefined ? '' : JSON.stringify(body));
};
async function readBody(req, limit = 1e6) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new HttpError(413, 'Request too large');
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}
const readJson = async (req) => { try { return JSON.parse((await readBody(req)).toString() || '{}'); } catch { throw new HttpError(400, 'Invalid JSON'); } };
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function requireRole(user, ...roles) {
  if (!user) throw new HttpError(401, 'Please sign in');
  if (!roles.includes(user.role)) throw new HttpError(403, 'Not allowed');
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8' };
const UPLOAD_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif', 'video/mp4': '.mp4', 'video/webm': '.webm' };

async function serveStatic(req, res, pathname) {
  if (pathname === '/' || pathname === '/index.html') {
    const html = (await readFile(path.join(ROOT, 'index.html'), 'utf8')).replace(
      '<script type="module"',
      `<script>window.MCUIRE_CONFIG=${JSON.stringify({ dataSource: 'api', payments: 'stripe', showMediaBriefs: !PROD })}</script>\n  <script type="module"`,
    );
    res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
    return res.end(html);
  }
  const isUpload = pathname.startsWith('/uploads/');
  const file = isUpload
    ? path.normalize(path.join(UPLOAD_DIR, decodeURIComponent(pathname.slice('/uploads'.length))))
    : path.normalize(path.join(ROOT, decodeURIComponent(pathname)));
  const allowed = isUpload ? file.startsWith(UPLOAD_DIR + path.sep) : file.startsWith(path.join(ROOT, 'assets') + path.sep);
  if (!allowed || !existsSync(file) || !(await stat(file)).isFile()) return send(res, 404, { error: 'Not found' });
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': isUpload ? 'public, max-age=31536000, immutable' : 'no-cache' });
  res.end(await readFile(file));
}

// ------------------------------------------------------------------ routes
function meResponse(user) {
  if (!user) return { account: null };
  const state = parse(q('SELECT doc FROM kitchen_state WHERE user_id = ?').get(user.id)?.doc) || {};
  return {
    ...state,
    account: { email: user.email, name: user.name, role: user.role, createdAt: user.created_at },
    enrollments: q('SELECT course_id AS courseId, order_id AS orderId, granted_at AS grantedAt FROM enrollments WHERE user_id = ?').all(user.id),
    orders: q("SELECT id, course_id AS courseId, email, amount_cents AS amountCents, currency, discount_code AS discountCode, status, created_at AS createdAt FROM orders WHERE user_id = ? AND status != 'pending'").all(user.id),
    certificates: q('SELECT number, course_id AS courseId, name, issued_at AS issuedAt FROM certificates WHERE user_id = ? AND revoked_at IS NULL').all(user.id),
  };
}

async function api(req, res, url, user) {
  const p = url.pathname.replace(/^\/api/, '');
  const m = (method, rx) => req.method === method && rx.exec(p);
  let r;

  // Mutating requests (except the Stripe webhook) must carry X-Mcuire: a cheap,
  // effective CSRF guard on top of SameSite=Lax cookies.
  if (req.method !== 'GET' && !p.startsWith('/stripe/webhook') && req.headers['x-mcuire'] !== '1') throw new HttpError(403, 'Missing request header');

  // ---- public content
  if (m('GET', /^\/catalog$/)) {
    const recipes = q('SELECT doc FROM recipes').all().map((row) => gateRecipe(parse(row.doc), user?.id));
    const meta = Object.fromEntries(q('SELECT key, doc FROM content_meta').all().map((x) => [x.key, parse(x.doc)]));
    const discounts = q('SELECT code, percent_off AS percentOff, active, note FROM discounts WHERE active = 1').all().map((d) => ({ ...d, active: !!d.active }));
    return send(res, 200, {
      version: SEED.version,
      categories: q('SELECT doc FROM categories ORDER BY sort').all().map((x) => parse(x.doc)),
      courses: allCourses().filter((c) => c.status !== 'hidden' || ['staff', 'admin'].includes(user?.role)),
      recipes,
      discounts: user && ['admin'].includes(user.role) ? q('SELECT code, percent_off AS percentOff, active, note FROM discounts').all().map((d) => ({ ...d, active: !!d.active })) : discounts,
      ...meta,
    });
  }
  if ((r = m('GET', /^\/recipes\/([\w-]+)$/))) {
    const recipe = getRecipe(r[1]);
    if (!recipe) throw new HttpError(404, 'Recipe not found');
    return send(res, 200, gateRecipe(recipe, user?.id));
  }
  if ((r = m('GET', /^\/certificates\/([\w-]+)$/))) {
    const c = q('SELECT number, name, course_id AS courseId, issued_at AS issuedAt FROM certificates WHERE number = ? AND revoked_at IS NULL').get(r[1].toUpperCase());
    return c ? send(res, 200, c) : send(res, 404, { error: 'Not found' });
  }

  // ---- auth
  if (m('POST', /^\/auth\/magic-link$/)) {
    const { email } = await readJson(req);
    if (!EMAIL_RX.test(email || '')) throw new HttpError(400, 'Please enter a valid email');
    const existing = q('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    const user2 = existing || (roleFor(email) ? upsertUser(email) : null);
    if (user2) await sendMagicLink(user2);
    return send(res, 204); // same response either way: no account enumeration
  }
  if (m('GET', /^\/auth\/verify$/)) {
    const link = q('SELECT * FROM magic_links WHERE token_hash = ?').get(hash(url.searchParams.get('token') || ''));
    if (!link || link.used_at || link.expires_at < now()) {
      res.writeHead(302, { Location: `${APP_URL}/#/kitchen?signin=expired` });
      return res.end();
    }
    q('UPDATE magic_links SET used_at = ? WHERE token_hash = ?').run(now(), link.token_hash);
    const u = q('SELECT * FROM users WHERE id = ?').get(link.user_id);
    upsertUser(u.email); // refresh role from ADMIN_EMAILS/STAFF_EMAILS
    const session = createSession(res, link.user_id);
    res.writeHead(302, { Location: CROSS_SITE ? `${APP_URL}/#/kitchen?session=${session}` : `${APP_URL}/#/kitchen` });
    return res.end();
  }
  if (m('POST', /^\/auth\/logout$/)) {
    const t = sessionTokenFrom(req);
    if (t) q('DELETE FROM sessions WHERE token_hash = ?').run(hash(t));
    return send(res, 204, undefined, { 'Set-Cookie': 'mk_session=; Path=/; Max-Age=0' });
  }

  // ---- checkout
  if (m('POST', /^\/checkout\/session$/)) {
    const { courseId, email, discountCode, resume } = await readJson(req);
    const course = getCourse(courseId);
    if (!course || course.status !== 'published') throw new HttpError(404, 'Course not available');
    if (email && !EMAIL_RX.test(email)) throw new HttpError(400, 'Please enter a valid email');
    const { total, code } = priceFor(course, discountCode); // price always from the database
    const orderId = `ord_${randomBytes(8).toString('hex')}`;
    const resumeParam = /^[a-z0-9-]{1,80}$/.test(resume || '') ? `&resume=${resume}` : '';
    const successUrl = `${APP_URL}/#/welcome/${course.slug}?session_id={CHECKOUT_SESSION_ID}${resumeParam}`;

    if (!STRIPE_KEY) {
      // Development only: simulate an instantly-paid Checkout Session.
      const sessionId = `cs_dev_${randomBytes(8).toString('hex')}`;
      q('INSERT INTO orders (id, email, course_id, amount_cents, currency, discount_code, stripe_session_id, status) VALUES (?,?,?,?,?,?,?,?)')
        .run(orderId, (email || 'dev@mcuire.test').toLowerCase(), course.id, total, course.currency, code, sessionId, 'pending');
      return send(res, 200, { url: successUrl.replace('{CHECKOUT_SESSION_ID}', sessionId), simulated: true });
    }
    const accountName = STRIPE_ACCOUNTS.has(course.stripeAccount) ? course.stripeAccount : 'default';
    const session = await stripe(stripeAccount(accountName), 'POST', 'checkout/sessions', {
      mode: 'payment',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': course.currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(total),
      'line_items[0][price_data][product_data][name]': `${course.title}${course.kind === 'flagship' ? `: ${course.subtitle}` : ''}`,
      'line_items[0][price_data][product_data][description]': 'Mcuire Kitchen online cooking course. Lifetime access.',
      ...(email ? { customer_email: email } : {}),
      customer_creation: 'if_required',
      success_url: successUrl,
      cancel_url: `${APP_URL}/#/courses/${course.slug}`,
      'metadata[course_id]': course.id,
      'metadata[order_id]': orderId,
      ...(code ? { 'metadata[discount_code]': code } : {}),
    });
    q('INSERT INTO orders (id, email, course_id, amount_cents, currency, discount_code, stripe_session_id, status, stripe_account) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(orderId, (email || '').toLowerCase(), course.id, total, course.currency, code, session.id, 'pending', accountName);
    return send(res, 200, { url: session.url });
  }

  // Success page: verify payment with Stripe, unlock, and sign the buyer in on this device.
  if (m('GET', /^\/checkout\/confirm$/)) {
    const sessionId = url.searchParams.get('session_id') || '';
    const order = q('SELECT * FROM orders WHERE stripe_session_id = ?').get(sessionId);
    if (!order) throw new HttpError(404, 'Unknown session');
    if (Date.now() - Date.parse(order.created_at.endsWith('Z') ? order.created_at : `${order.created_at}Z`) > 3600e3) throw new HttpError(410, 'Link expired, use the emailed sign-in link');
    let email = order.email;
    let paymentIntent = null;
    if (STRIPE_KEY) {
      const s = await stripe(stripeAccount(order.stripe_account), 'GET', `checkout/sessions/${encodeURIComponent(sessionId)}`);
      if (s.payment_status !== 'paid') return send(res, 202, { status: 'pending' });
      email = s.customer_details?.email || email;
      paymentIntent = s.payment_intent;
    } else if (PROD) throw new HttpError(400, 'Payments not configured');
    const { user: buyer, firstTime } = fulfill({ sessionId, email, paymentIntent });
    if (firstTime) await sendMagicLink(buyer);
    const session = createSession(res, buyer.id);
    return send(res, 200, { status: 'paid', session });
  }

  // One webhook URL per Stripe account: /api/stripe/webhook (default) or /api/stripe/webhook/<name>.
  if ((r = m('POST', /^\/stripe\/webhook(?:\/([a-z0-9_]+))?$/))) {
    const raw = (await readBody(req)).toString();
    const account = STRIPE_ACCOUNTS.get(r[1] || 'default');
    if (!account || !verifyStripeSignature(raw, req.headers['stripe-signature'], account.webhookSecret)) throw new HttpError(400, 'Bad signature');
    const event = JSON.parse(raw);
    const obj = event.data?.object || {};
    if (event.type === 'checkout.session.completed' && obj.payment_status === 'paid') {
      const { user: buyer, firstTime } = fulfill({ sessionId: obj.id, email: obj.customer_details?.email || obj.customer_email, paymentIntent: obj.payment_intent });
      if (firstTime) await sendMagicLink(buyer);
    }
    if (event.type === 'charge.refunded' && obj.refunded) {
      const order = q('SELECT * FROM orders WHERE payment_intent = ?').get(obj.payment_intent);
      if (order) tx(() => {
        q("UPDATE orders SET status = 'refunded' WHERE id = ?").run(order.id);
        q('DELETE FROM enrollments WHERE order_id = ?').run(order.id);
      });
    }
    return send(res, 200, { received: true });
  }

  // ---- signed-in customer
  if (m('GET', /^\/me$/)) return send(res, 200, meResponse(user));
  if (m('PUT', /^\/me\/state$/)) {
    requireRole(user, 'customer', 'staff', 'admin');
    const body = await readJson(req);
    const { name, ...state } = body;
    const doc = json({ progress: state.progress || {}, cookLog: state.cookLog || [], saved: state.saved || [], recent: state.recent || [], shopping: state.shopping || {} });
    if (doc.length > 256e3) throw new HttpError(413, 'Kitchen state too large');
    q(`INSERT INTO kitchen_state (user_id, doc, updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET doc = excluded.doc, updated_at = excluded.updated_at`).run(user.id, doc, now());
    if (typeof name === 'string') q('UPDATE users SET name = ? WHERE id = ?').run(name.slice(0, 80), user.id);
    return send(res, 204);
  }
  if (m('POST', /^\/me\/certificates$/)) {
    requireRole(user, 'customer', 'staff', 'admin');
    const { courseId, name } = await readJson(req);
    const course = getCourse(courseId);
    if (!course || !q('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?').get(user.id, course.id)) throw new HttpError(403, 'You don’t own this course');
    const existing = q('SELECT number, course_id AS courseId, name, issued_at AS issuedAt FROM certificates WHERE user_id = ? AND course_id = ? AND revoked_at IS NULL').get(user.id, course.id);
    if (existing) return send(res, 200, existing);
    const state = parse(q('SELECT doc FROM kitchen_state WHERE user_id = ?').get(user.id)?.doc) || {};
    const cooked = new Set((state.cookLog || []).map((l) => l.recipeId));
    const required = course.requiredRecipeIds || course.modules.flatMap((x) => x.recipeIds);
    const missing = required.filter((id) => !cooked.has(id));
    if (missing.length) throw new HttpError(400, `Cook ${missing.length} more dishes to earn this certificate`);
    const cleanName = String(name || user.name || '').trim().slice(0, 40);
    if (!cleanName) throw new HttpError(400, 'Name required');
    const cert = { number: certificateNumber(), courseId: course.id, name: cleanName, issuedAt: now() };
    q('INSERT INTO certificates (number, user_id, course_id, name, issued_at) VALUES (?,?,?,?,?)').run(cert.number, user.id, course.id, cert.name, cert.issuedAt);
    return send(res, 201, cert);
  }

  // ---- admin / staff
  if ((r = m('PUT', /^\/admin\/recipes\/([\w-]+)$/))) {
    requireRole(user, 'staff', 'admin');
    const recipe = await readJson(req);
    if (recipe.id !== r[1] || !recipe.title || !/^[a-z0-9-]+$/.test(recipe.slug || '')) throw new HttpError(400, 'Recipe needs a title and a valid web address');
    if (!Array.isArray(recipe.steps) || !Array.isArray(recipe.ingredients)) throw new HttpError(400, 'Malformed recipe');
    const clash = q('SELECT id FROM recipes WHERE slug = ? AND id != ?').get(recipe.slug, recipe.id);
    if (clash) throw new HttpError(409, 'Another recipe uses that web address');
    tx(() => saveRecipeRow(recipe, user.id));
    return send(res, 200, { ok: true });
  }
  if ((r = m('DELETE', /^\/admin\/recipes\/([\w-]+)$/))) {
    requireRole(user, 'admin');
    tx(() => {
      q('DELETE FROM recipes WHERE id = ?').run(r[1]);
      for (const c of allCourses()) {
        c.modules.forEach((mod) => { mod.recipeIds = mod.recipeIds.filter((x) => x !== r[1]); });
        saveCourseRow(c);
      }
    });
    return send(res, 204);
  }
  if ((r = m('PUT', /^\/admin\/courses\/([\w-]+)$/))) {
    requireRole(user, 'admin'); // prices are admin-only
    const c = await readJson(req);
    if (c.id !== r[1] || !getCourse(c.id)) throw new HttpError(404, 'Course not found');
    if (!Number.isInteger(c.priceCents) || c.priceCents < 0) throw new HttpError(400, 'Invalid price');
    if (!['CAD', 'USD'].includes(c.currency)) throw new HttpError(400, 'Unsupported currency');
    if (c.stripeAccount && !STRIPE_ACCOUNTS.has(c.stripeAccount) && STRIPE_ACCOUNTS.size) throw new HttpError(400, 'Unknown Stripe account');
    tx(() => saveCourseRow(c));
    return send(res, 200, { ok: true });
  }
  if (m('PUT', /^\/admin\/discounts$/)) {
    requireRole(user, 'admin');
    const list = await readJson(req);
    tx(() => {
      const keep = list.map((d) => String(d.code).toUpperCase());
      q(`DELETE FROM discounts WHERE code NOT IN (${keep.map(() => '?').join(',') || "''"})`).run(...keep);
      for (const d of list) {
        q(`INSERT INTO discounts (code, percent_off, active, note) VALUES (?,?,?,?)
           ON CONFLICT(code) DO UPDATE SET percent_off = excluded.percent_off, active = excluded.active, note = excluded.note`)
          .run(String(d.code).toUpperCase(), Math.max(1, Math.min(100, d.percentOff | 0)), d.active ? 1 : 0, d.note || '');
      }
    });
    return send(res, 200, { ok: true });
  }
  if (m('PUT', /^\/admin\/categories$/)) {
    requireRole(user, 'staff', 'admin');
    const list = await readJson(req);
    if (!Array.isArray(list) || list.some((c) => !/^[a-z0-9-]+$/.test(c.id || '') || !c.name)) throw new HttpError(400, 'Each category needs a name');
    tx(() => {
      const keep = list.map((c) => c.id);
      const inUse = q('SELECT DISTINCT category_id AS id FROM recipes').all().map((x) => x.id);
      const removing = q('SELECT id FROM categories').all().map((x) => x.id).filter((id) => !keep.includes(id));
      if (removing.some((id) => inUse.includes(id))) throw new HttpError(409, 'Move recipes out of a category before deleting it');
      removing.forEach((id) => q('DELETE FROM categories WHERE id = ?').run(id));
      list.forEach((c) => q('INSERT INTO categories (id, sort, doc) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET sort = excluded.sort, doc = excluded.doc').run(c.id, c.sort | 0, json(c)));
    });
    return send(res, 200, { ok: true });
  }
  if (m('PUT', /^\/admin\/challenges$/)) {
    requireRole(user, 'staff', 'admin');
    const list = await readJson(req);
    if (!Array.isArray(list)) throw new HttpError(400, 'Malformed challenges');
    q('INSERT INTO content_meta (key, doc) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET doc = excluded.doc').run('challenges', json(list));
    return send(res, 200, { ok: true });
  }
  if (m('POST', /^\/admin\/media$/)) {
    requireRole(user, 'staff', 'admin');
    const mime = (req.headers['content-type'] || '').split(';')[0];
    const ext = UPLOAD_TYPES[mime];
    if (!ext) throw new HttpError(415, 'Upload a JPG, PNG, WebP, AVIF, MP4 or WebM file');
    const data = await readBody(req, 80e6);
    const id = randomBytes(12).toString('hex');
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, id + ext), data);
    const mediaUrl = `${BASE_URL}/uploads/${id}${ext}`;
    q('INSERT INTO media (id, kind, url, mime, size_bytes, uploaded_by) VALUES (?,?,?,?,?,?)').run(id, mime.startsWith('video') ? 'video' : 'photo', mediaUrl, mime, data.length, user.id);
    return send(res, 201, { id, url: mediaUrl });
  }
  if (m('GET', /^\/admin\/customers$/)) {
    requireRole(user, 'admin');
    const rows = q('SELECT id, email, name, role, created_at AS createdAt FROM users ORDER BY created_at DESC LIMIT 500').all();
    return send(res, 200, rows.map((u) => {
      const st = parse(q('SELECT doc FROM kitchen_state WHERE user_id = ?').get(u.id)?.doc) || {};
      const courses = q('SELECT c.id FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ?').all(u.id).map((x) => getCourse(x.id).title);
      return { ...u, courses, cooked: new Set((st.cookLog || []).map((l) => l.recipeId)).size };
    }));
  }
  // Names only (never keys), for the "Pay into Stripe account" dropdown.
  if (m('GET', /^\/admin\/stripe-accounts$/)) {
    requireRole(user, 'admin');
    return send(res, 200, [...STRIPE_ACCOUNTS.entries()].map(([name, a]) => ({ name, webhook: `${BASE_URL}/api/stripe/webhook${name === 'default' ? '' : `/${name}`}`, webhookReady: !!a.webhookSecret, live: a.key.startsWith('sk_live') })));
  }
  if (m('GET', /^\/admin\/orders$/)) {
    requireRole(user, 'admin');
    return send(res, 200, q('SELECT id, email, course_id AS courseId, amount_cents AS amountCents, currency, discount_code AS discountCode, status, stripe_account AS stripeAccount, created_at AS createdAt FROM orders ORDER BY created_at').all());
  }
  if (m('GET', /^\/admin\/certificates$/)) {
    requireRole(user, 'staff', 'admin');
    return send(res, 200, q('SELECT number, name, course_id AS courseId, issued_at AS issuedAt FROM certificates WHERE revoked_at IS NULL ORDER BY issued_at DESC').all());
  }

  throw new HttpError(404, 'Not found');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, BASE_URL);
  if (CROSS_SITE && url.pathname.startsWith('/api/') && req.headers.origin === APP_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', APP_ORIGIN);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Mcuire');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  }
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url, currentUser(req));
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed');
    return await serveStatic(req, res, url.pathname);
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    if (!res.headersSent) send(res, status, { error: status >= 500 ? 'Something went wrong' : err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Mcuire Kitchen server on ${BASE_URL}, pages at ${APP_URL}  (${STRIPE_KEY ? `Stripe accounts: ${[...STRIPE_ACCOUNTS.keys()].join(', ')}` : 'SIMULATED payments, development only'})`);
});
