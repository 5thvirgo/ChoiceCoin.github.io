// Mcuire staff admin.
// Built so kitchen staff can add or change a recipe without a developer:
// Basics → Ingredients → Equipment → Steps → Photos & video → Publishing.

import { config } from '../config.js';
import { store, apiFetch } from '../services/store.js';
import { SHOP_CATEGORIES, AVAILABILITY, TIP_KINDS } from '../data/seed.js';
import { media, signInForm, bindSignIn } from '../components.js';
import { parseSlotId, formatTime, formatDate as slotDate } from '../lib/slots.js';
import { esc, icon, money, formatDate, on, toast, uid } from '../lib/dom.js';

const TONES = ['jollof', 'rice', 'egusi', 'suya', 'plantain', 'leaf', 'onion'];
const clone = (v) => JSON.parse(JSON.stringify(v));

// ------------------------------------------------------------------ access
const GATE_KEY = 'mcuire.admin';
async function hasAccess() {
  if (config.dataSource === 'api') {
    try {
      const me = await (await apiFetch('me')).json();
      return ['staff', 'admin'].includes(me?.account?.role);
    } catch { return false; }
  }
  try { return sessionStorage.getItem(GATE_KEY) === '1'; } catch { return false; }
}

function gate() {
  const api = config.dataSource === 'api';
  return {
    title: 'Staff sign in',
    html: `<section class="section"><div class="wrap narrow">
      <span class="eyebrow">Mcuire staff</span><h1 style="font-size:2.4rem">Kitchen admin</h1>
      ${api
        ? `<p class="lede">Sign in with your staff email. We’ll email you a link. Then come back to this page.</p>${signInForm()}`
        : `<p class="lede">This demo stores everything in this browser. Enter the demo passcode to continue. Real staff access is role-based on the server.</p>
           <form class="panel" data-gate style="max-width:420px"><div class="field"><label for="pc">Passcode</label><input id="pc" name="pc" type="password" autocomplete="off"><small>Demo passcode: <code>${esc(config.demoAdminPasscode)}</code></small></div><button class="btn btn-primary">Enter admin</button></form>`}
    </div></section>`,
    mount(root) {
      if (api) return bindSignIn(root);
      return on(root, 'submit', '[data-gate]', (e, f) => {
        e.preventDefault();
        if (f.pc.value === config.demoAdminPasscode) {
          try { sessionStorage.setItem(GATE_KEY, '1'); } catch { /* ignore */ }
          location.hash = '#/admin';
          dispatchEvent(new HashChangeEvent('hashchange'));
        } else toast('Wrong passcode');
      });
    },
  };
}

// ------------------------------------------------------------------ layout
const SECTIONS = [
  ['', 'Overview'], ['recipes', 'Recipes'], ['categories', 'Categories'], ['courses', 'Courses & prices'], ['live', 'Live classes'], ['challenges', 'Challenges'], ['discounts', 'Discounts'],
  ['customers', 'Customers'], ['orders', 'Purchases'], ['certificates', 'Certificates'], ['media', 'Media to shoot'], ['tools', 'Demo tools'],
];

function layout(active, body) {
  return `<div class="admin">
    <nav class="admin-nav" aria-label="Admin"><span class="eyebrow">Mcuire admin</span>
      ${SECTIONS.filter(([k]) => k !== 'tools' || config.dataSource === 'local').map(([k, label]) => `<a href="#/admin${k ? `/${k}` : ''}" class="${active === k ? 'active' : ''}">${label}</a>`).join('')}
      <a href="#/">← Back to site</a>
    </nav>
    <div class="admin-main">${body}</div>
  </div>`;
}

function mediaSlots(recipe) {
  const slots = [];
  const push = (ref, where) => ref && slots.push({ ref, where });
  push(recipe.hero, 'Hero');
  (recipe.gallery || []).forEach((m, i) => push(m, `Gallery ${i + 1}`));
  recipe.steps.forEach((s, i) => {
    (s.media || []).forEach((m) => push(m, `Step ${i + 1}`));
    (s.checkpoint?.options || []).forEach((o) => push(o.media, `Step ${i + 1} checkpoint: ${o.label}`));
  });
  return slots;
}

async function loadServerList(path) {
  if (config.dataSource !== 'api') return null;
  try { return await (await apiFetch(`admin/${path}`)).json(); } catch { return []; }
}

// ------------------------------------------------------------------ sections
function overview() {
  const recipes = store.recipes;
  const complete = recipes.filter((r) => r.status === 'complete');
  const slots = complete.flatMap(mediaSlots);
  const filled = slots.filter((s) => s.ref.src).length;
  const orders = store.kitchen.orders;
  return `<h1 style="font-size:2.2rem">Good day, chef</h1>
    <div class="grid-4" style="margin:20px 0">
      ${[[recipes.length, 'Recipes'], [complete.length, 'Cook With Me ready'], [`${filled}/${slots.length}`, 'Photos & videos in'], [store.courses.length, 'Courses']].map(([n, l]) => `<div class="panel"><b style="font-family:var(--display);font-size:2rem">${n}</b><div class="small muted">${l}</div></div>`).join('')}
    </div>
    <div class="grid-2">
      <div class="panel"><h3>Quick actions</h3><div class="stack">
        <a class="btn btn-primary btn-block" href="#/admin/recipes/new">${icon('plus', 18)} Add a new recipe</a>
        <a class="btn btn-ghost btn-block" href="#/admin/courses">Change prices</a>
        <a class="btn btn-ghost btn-block" href="#/admin/media">See which photos are still needed</a>
      </div></div>
      <div class="panel"><h3>Latest purchases</h3>${orders.length ? `<ul class="mini-list">${orders.slice(-5).reverse().map((o) => `<li><div style="flex:1"><b>${esc(orderItem(o))}</b><div class="small muted">${esc(o.email)} · ${formatDate(o.createdAt)}</div></div><b>${money(o.amountCents, o.currency)}</b></li>`).join('')}</ul>` : '<p class="muted">No purchases yet.</p>'}</div>
    </div>`;
}

function recipesList() {
  return `<div class="spread"><h1 style="font-size:2.2rem;margin:0">Recipes</h1><a class="btn btn-primary" href="#/admin/recipes/new">${icon('plus', 18)} New recipe</a></div>
    <div class="table-wrap panel" style="margin-top:18px"><table class="table">
      <thead><tr><th>Recipe</th><th>Category</th><th>Status</th><th>Steps</th><th>Media</th><th></th></tr></thead>
      <tbody>${store.categories.map((c) => store.recipesIn(c.id).map((r) => {
        const slots = mediaSlots(r);
        const filled = slots.filter((s) => s.ref.src).length;
        return `<tr><td><b>${esc(r.title)}</b><div class="small muted">${esc(r.region || '')}</div></td><td>${esc(c.name)}</td>
          <td><span class="status-dot ${r.status === 'complete' ? 'ok' : ''}"></span>${r.status === 'complete' ? 'Live' : 'Outline'}</td>
          <td>${r.steps.length}</td><td>${filled}/${slots.length}</td>
          <td><a class="btn btn-ghost btn-sm" href="#/admin/recipes/${esc(r.id)}">Edit</a></td></tr>`;
      }).join('')).join('')}</tbody></table></div>`;
}

async function customersList() {
  const server = await loadServerList('customers');
  const rows = server || (store.kitchen.account ? [{ ...store.kitchen.account, courses: store.ownedCourses.map((c) => c.title), cooked: store.completedRecipeIds().length }] : []);
  return `<h1 style="font-size:2.2rem">Customers</h1>
    ${server ? '' : '<p class="muted">Demo mode only knows the customer in this browser. The live server lists every account.</p>'}
    <div class="table-wrap panel"><table class="table"><thead><tr><th>Email</th><th>Name</th><th>Courses</th><th>Dishes cooked</th><th>Since</th></tr></thead>
    <tbody>${rows.map((c) => `<tr><td>${esc(c.email)}</td><td>${esc(c.name || '—')}</td><td>${esc((c.courses || []).join(', ') || '—')}</td><td>${c.cooked ?? '—'}</td><td>${c.createdAt ? formatDate(c.createdAt) : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">No customers yet.</td></tr>'}</tbody></table></div>`;
}

// What an order bought: a course, or a seat in a live class.
function orderItem(o) {
  if (o.liveClassId) return `Live class: ${store.liveClass(o.liveClassId)?.title || o.liveClassId}`;
  return store.course(o.courseId)?.title || o.courseId;
}

async function ordersList() {
  const rows = (await loadServerList('orders')) || store.kitchen.orders;
  const total = rows.filter((o) => o.status === 'paid').reduce((s, o) => s + o.amountCents, 0);
  return `<h1 style="font-size:2.2rem">Purchases</h1><p class="muted">${rows.length} orders · ${money(total)} paid</p>
    <div class="table-wrap panel"><table class="table"><thead><tr><th>Date</th><th>Customer</th><th>Course</th><th>Code</th><th>Amount</th><th>Paid into</th><th>Status</th></tr></thead>
    <tbody>${rows.slice().reverse().map((o) => `<tr><td>${formatDate(o.createdAt)}</td><td>${esc(o.email)}</td><td>${esc(orderItem(o))}</td><td>${esc(o.discountCode || '—')}</td><td>${money(o.amountCents, o.currency)}</td><td>${esc(o.stripeAccount || '—')}</td><td>${esc(o.status)}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">No purchases yet.</td></tr>'}</tbody></table></div>`;
}

async function certificatesList() {
  const rows = (await loadServerList('certificates')) || store.kitchen.certificates;
  return `<h1 style="font-size:2.2rem">Certificates</h1>
    <div class="table-wrap panel"><table class="table"><thead><tr><th>Number</th><th>Name</th><th>Programme</th><th>Issued</th><th></th></tr></thead>
    <tbody>${rows.map((c) => `<tr><td><code>${esc(c.number)}</code></td><td>${esc(c.name)}</td><td>${esc(store.course(c.courseId)?.certificateTitle || c.courseId)}</td><td>${formatDate(c.issuedAt)}</td><td><a class="btn btn-ghost btn-sm" href="#/verify/${esc(c.number)}">Verify</a></td></tr>`).join('') || '<tr><td colspan="5" class="muted">No certificates issued yet.</td></tr>'}</tbody></table></div>`;
}

function mediaReport() {
  const live = store.recipes.filter((r) => r.status === 'complete');
  return `<h1 style="font-size:2.2rem">Media to shoot</h1>
    <p class="lede">The shot list for the Mcuire kitchen. Every empty slot shows a placeholder on the site until a real photo or clip is uploaded in the recipe editor.</p>
    ${live.map((r) => {
      const missing = mediaSlots(r).filter((s) => !s.ref.src);
      return `<div class="panel"><div class="spread"><h3 style="margin:0">${esc(r.title)}</h3><a class="btn btn-ghost btn-sm" href="#/admin/recipes/${esc(r.id)}?tab=media">Upload</a></div>
        <p class="small muted">${missing.length} still needed</p>
        <ol style="padding-left:20px;margin:0">${missing.map((s) => `<li style="margin-bottom:8px"><b>${esc(s.where)}</b> · ${s.ref.kind === 'video' ? '<span class="chip">Video</span>' : '<span class="chip">Photo</span>'}<br><span class="small">${esc(s.ref.brief)}</span></li>`).join('')}</ol></div>`;
    }).join('')}`;
}

function tools() {
  return `<h1 style="font-size:2.2rem">Demo tools</h1>
    <p class="lede">Shortcuts for reviewing the prototype. They only affect this browser.</p>
    <div class="panel"><h3>Simulate a finished programme</h3><p class="muted small">Marks every dish in the flagship as cooked so you can test the certificate flow.</p><button class="btn btn-dark" data-tool="complete">Mark all dishes cooked</button></div>
    <div class="panel"><h3>Give me the flagship course</h3><p class="muted small">Unlocks every course without going through checkout.</p><button class="btn btn-dark" data-tool="grant">Unlock all courses</button></div>
    <div class="panel"><h3>Reset content</h3><p class="muted small">Discards admin edits to recipes, courses and prices.</p><button class="btn btn-ghost" data-tool="reset-content">Reset content to defaults</button></div>
    <div class="panel"><h3>Reset my kitchen</h3><p class="muted small">Clears purchases, progress, certificates and shopping list in this browser.</p><button class="btn btn-ghost" data-tool="reset-kitchen">Reset my kitchen</button></div>`;
}

// ------------------------------------------------------------------ courses
function coursesEditor(accounts = null) {
  const accountField = (c) => {
    if (!accounts) return `<div class="field"><label>Pay into Stripe account</label><input name="stripeAccount" value="${esc(c.stripeAccount || 'default')}"><small>On the live site this is a dropdown of the Stripe accounts set up on your host.</small></div>`;
    if (!accounts.length) return '<div class="field"><label>Pay into Stripe account</label><p class="small muted" style="margin:0">No Stripe account is connected yet. Payments are in test mode.</p></div>';
    return `<div class="field"><label>Pay into Stripe account</label><select name="stripeAccount">${accounts.map((a) => `<option value="${esc(a.name)}" ${(c.stripeAccount || 'default') === a.name ? 'selected' : ''}>${esc(a.name)}${a.live ? '' : ' (test mode)'}${a.webhookReady ? '' : ' (webhook not set up)'}</option>`).join('')}</select><small>Money from this course goes to this account.</small></div>`;
  };
  const singles = store.courses.filter((c) => c.kind === 'single');
  const accountSelect = (c) => (accounts?.length
    ? `<select class="input" name="acct-${esc(c.id)}" style="min-height:42px">${accounts.map((a) => `<option value="${esc(a.name)}" ${(c.stripeAccount || 'default') === a.name ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>`
    : `<input class="input" name="acct-${esc(c.id)}" value="${esc(c.stripeAccount || 'default')}" style="min-height:42px;width:120px">`);
  return `<h1 style="font-size:2.2rem">Courses & prices</h1>
    <p class="muted">Prices are read from here everywhere on the site and at checkout. Nothing is hard-coded.</p>
    ${singles.length ? `<form class="panel" data-singles>
      <div class="spread"><h3 style="margin:0">Single dishes (${singles.length})</h3><span class="chip">Buy one dish</span></div>
      <p class="small muted">Each finished dish can be bought on its own. Change any price, hide a dish from sale, or send its money to a different Stripe account.</p>
      <div class="row" style="align-items:end;margin-bottom:10px">
        <div class="field" style="margin:0"><label>Set every single dish to</label><input class="input" name="bulk" type="number" step="0.01" min="0" placeholder="e.g. 25.00" style="min-height:42px;width:140px"></div>
        <button type="button" class="btn btn-ghost btn-sm" data-bulk-price>Apply to all</button>
      </div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Dish</th><th>Price (CAD)</th><th>On sale</th>${accounts && !accounts.length ? '' : '<th>Pay into</th>'}</tr></thead><tbody>
      ${singles.map((c) => `<tr><td><b>${esc(c.title)}</b></td>
        <td><input class="input" name="price-${esc(c.id)}" type="number" step="0.01" min="0" value="${(c.priceCents / 100).toFixed(2)}" style="min-height:42px;width:110px"></td>
        <td><input type="checkbox" name="on-${esc(c.id)}" ${c.status === 'published' ? 'checked' : ''} style="width:22px;height:22px"></td>
        ${accounts && !accounts.length ? '' : `<td>${accountSelect(c)}</td>`}</tr>`).join('')}
      </tbody></table></div>
      <div class="row" style="margin-top:14px"><button class="btn btn-primary btn-sm">Save single-dish prices</button></div>
    </form>` : ''}
    ${store.courses.filter((c) => c.kind !== 'single').map((c) => `<form class="panel" data-course="${esc(c.id)}">
      <div class="spread"><h3 style="margin:0">${esc(c.title)}</h3><span class="chip">${esc(c.kind)}</span></div>
      <div class="grid-3" style="margin-top:14px">
        <div class="field"><label>Title</label><input name="title" value="${esc(c.title)}"></div>
        <div class="field"><label>Price</label><input name="price" type="number" step="0.01" min="0" value="${(c.priceCents / 100).toFixed(2)}"></div>
        <div class="field"><label>Compare-at price</label><input name="compare" type="number" step="0.01" min="0" value="${c.compareAtCents ? (c.compareAtCents / 100).toFixed(2) : ''}" placeholder="optional"></div>
      </div>
      <div class="grid-3">
        <div class="field"><label>Currency</label><select name="currency">${['CAD', 'USD'].map((x) => `<option ${c.currency === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="field"><label>Status</label><select name="status">${['published', 'coming_soon', 'hidden'].map((s) => `<option ${c.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
        ${c.kind === 'flagship' ? `<div class="field"><label>Name printed on certificate</label><input name="certificateTitle" value="${esc(c.certificateTitle || '')}"></div>` : '<div></div>'}
      </div>
      ${accountField(c)}
      <div class="field"><label>Description</label><textarea name="blurb">${esc(c.blurb)}</textarea></div>
      <details><summary class="link" style="cursor:pointer">Modules & recipes (${c.modules.length})</summary>
        ${c.modules.map((m, mi) => `<div class="repeat" style="margin-top:10px"><div class="field"><label>Module ${mi + 1} title</label><input name="module-${mi}" value="${esc(m.title)}"></div>
          <div class="row">${store.recipes.map((r) => `<label class="chip" style="cursor:pointer"><input type="checkbox" name="mod-${mi}" value="${esc(r.id)}" ${m.recipeIds.includes(r.id) ? 'checked' : ''}> ${esc(r.title)}</label>`).join('')}</div></div>`).join('')}
      </details>
      <div class="row" style="margin-top:14px"><button class="btn btn-primary btn-sm">Save ${esc(c.title)}</button></div>
    </form>`).join('')}`;
}

// ------------------------------------------------------------------ live classes
const toLocalInput = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const blankLiveClass = () => {
  const start = new Date(Date.now() + 14 * 864e5);
  start.setHours(18, 0, 0, 0);
  return {
    id: `live-${Date.now().toString(36)}`, title: 'New live class', recipeId: '', status: 'draft', description: '',
    startsAt: start.toISOString(), durationMinutes: 120, priceCents: 3500, currency: 'CAD', capacity: 12,
    format: 'in-person', platform: '', joinUrl: '', location: config.brand.name, host: 'Mcuire Head Chef', whatYouNeed: 'Just yourself. Aprons, ingredients and equipment are provided.',
  };
};

async function loadLiveAdmin() {
  if (config.dataSource !== 'api') {
    const attendees = (store.kitchen.tickets || []).map((t) => ({ classId: t.classId, email: t.email, name: store.kitchen.account?.name || '', bookedAt: t.bookedAt }));
    return { classes: clone(store.content.liveClasses || []), attendees };
  }
  const [classes, attendees] = await Promise.all([loadServerList('live-classes'), loadServerList('live-attendees')]);
  return { classes: Array.isArray(classes) ? classes : [], attendees: Array.isArray(attendees) ? attendees : [] };
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function weekendSettings(attendees) {
  const s = store.liveBooking;
  const bookings = attendees.map((a) => ({ ...a, slot: parseSlotId(a.classId) })).filter((a) => a.slot).sort((a, b) => (a.slot.date + a.slot.time).localeCompare(b.slot.date + b.slot.time));
  return `<form class="panel" data-live-booking>
    <div class="spread"><h3 style="margin:0">Weekend classes (customers pick the day and time)</h3><label class="row" style="gap:6px"><input type="checkbox" name="enabled" ${s.enabled ? 'checked' : ''} style="width:20px;height:20px"> Taking bookings</label></div>
    <div class="grid-3" style="margin-top:12px">
      <div class="field"><label>Price per hour (CAD)</label><input name="price" type="number" step="0.01" min="0" value="${(s.pricePerHourCents / 100).toFixed(2)}"></div>
      <div class="field"><label>Charge</label><select name="perPerson"><option value="1" ${s.perPerson ? 'selected' : ''}>Per person</option><option value="0" ${s.perPerson ? '' : 'selected'}>Per group (whole booking)</option></select></div>
      <div class="field"><label>Tax</label><div class="row" style="flex-wrap:nowrap;gap:6px"><input name="taxLabel" value="${esc(s.taxLabel)}" style="max-width:90px"><input name="taxRate" type="number" step="0.01" min="0" max="30" value="${Math.round(s.taxRate * 10000) / 100}" style="max-width:90px"><span>%</span></div></div>
    </div>
    <div class="field"><label>Days</label><div class="row">${DAY_NAMES.map((d, i) => `<label class="chip" style="cursor:pointer"><input type="checkbox" name="day" value="${i}" ${s.days.includes(i) ? 'checked' : ''}> ${d}</label>`).join('')}</div></div>
    <div class="grid-3">
      <div class="field"><label>Start times</label><input name="times" value="${esc(s.times.join(', '))}"><small>24-hour clock, comma-separated, e.g. 10:00, 12:00, 14:00</small></div>
      <div class="field"><label>Hours per class</label><div class="row" style="flex-wrap:nowrap;gap:6px"><input name="minHours" type="number" min="1" value="${s.minHours}" style="max-width:80px"> to <input name="maxHours" type="number" min="1" value="${s.maxHours}" style="max-width:80px"></div></div>
      <div class="field"><label>Must finish by</label><input name="latestEnd" value="${esc(s.latestEnd)}"></div>
    </div>
    <div class="grid-3">
      <div class="field"><label>Most people at one time</label><input name="maxPeople" type="number" min="1" value="${s.maxPeople}"></div>
      <div class="field"><label>Book at least (days ahead)</label><input name="leadDays" type="number" min="0" value="${s.leadDays}"></div>
      <div class="field"><label>Show dates up to (weeks ahead)</label><input name="weeksAhead" type="number" min="1" max="52" value="${s.weeksAhead}"></div>
    </div>
    <div class="field"><label>Description</label><textarea name="description" rows="2">${esc(s.description)}</textarea></div>
    <div class="field"><label>Where</label><input name="location" value="${esc(s.location)}"></div>
    <div class="row"><button class="btn btn-primary btn-sm">Save weekend classes</button></div>
    <details style="margin-top:14px" ${bookings.length ? 'open' : ''}><summary class="link" style="cursor:pointer">Weekend bookings (${bookings.length})</summary>
      ${bookings.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Time</th><th>Hours</th><th>People</th><th>Customer</th><th>Booked</th></tr></thead><tbody>${bookings.map((b) => `<tr><td>${esc(slotDate(b.slot.date, { year: 'numeric' }))}</td><td>${esc(formatTime(b.slot.time))}</td><td>${b.slot.hours}</td><td>${b.slot.people}</td><td>${esc(b.name || '')} ${esc(b.email)}</td><td>${esc(String(b.bookedAt || '').slice(0, 10))}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small muted">No weekend bookings yet.</p>'}
    </details>
  </form>`;
}

function liveEditor({ classes, attendees }) {
  const sorted = classes.map((c, i) => [c, i]).sort(([a], [b]) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
  const recipeOpts = (v) => `<option value="">None</option>${store.recipes.filter((r) => r.status === 'complete').map((r) => `<option value="${esc(r.id)}" ${v === r.id ? 'selected' : ''}>${esc(r.title)}</option>`).join('')}`;
  return `<h1 style="font-size:2.2rem;margin:0 0 12px">Live classes</h1>
    ${weekendSettings(attendees)}
    <div class="spread" style="margin-top:28px"><h2 style="margin:0">Special dated classes</h2><button type="button" class="btn btn-primary" data-add-live>${icon('plus', 18)} New live class</button></div>
    <p class="muted">Hands-on classes at the restaurant, or online on Zoom / Google Meet. Online join links are only shown to people who paid, in My Kitchen and in their booking email.</p>
    <form data-live>${sorted.map(([c, i]) => {
      const people = attendees.filter((a) => a.classId === c.id);
      const past = Date.parse(c.startsAt) + (c.durationMinutes || 60) * 60000 < Date.now();
      return `<div class="repeat" data-live-row="${i}">
      <div class="repeat-head"><b>${esc(c.title)} <span class="chip">${past ? 'finished' : esc(c.status)}</span> <span class="chip">${people.length}/${c.capacity} booked</span></b>
        <button type="button" class="icon-btn" data-del-live="${i}" aria-label="Delete">${icon('trash', 16)}</button></div>
      <input type="hidden" name="id-${i}" value="${esc(c.id)}">
      <div class="grid-2"><div class="field"><label>Title</label><input name="title-${i}" value="${esc(c.title)}"></div>
        <div class="field"><label>Status</label><select name="status-${i}">${[['draft', 'Draft (hidden)'], ['published', 'Published (on sale)'], ['cancelled', 'Cancelled']].map(([v, l]) => `<option value="${v}" ${c.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
      <div class="grid-3"><div class="field"><label>Date &amp; start time</label><input type="datetime-local" name="start-${i}" value="${toLocalInput(c.startsAt)}"></div>
        <div class="field"><label>Length (minutes)</label><input type="number" min="15" step="15" name="dur-${i}" value="${c.durationMinutes}"></div>
        <div class="field"><label>Dish (links to its lesson)</label><select name="recipe-${i}">${recipeOpts(c.recipeId)}</select></div></div>
      <div class="grid-3"><div class="field"><label>Price per seat (CAD)</label><input type="number" min="0" step="0.01" name="price-${i}" value="${(c.priceCents / 100).toFixed(2)}"></div>
        <div class="field"><label>Seats</label><input type="number" min="1" name="cap-${i}" value="${c.capacity}"></div>
        <div class="field"><label>Where</label><select name="format-${i}">${[['in-person', 'In person at the restaurant'], ['online', 'Online (Zoom or Google Meet)']].map(([v, l]) => `<option value="${v}" ${c.format === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
      <div class="grid-2"><div class="field"><label>Video platform (online classes)</label><input name="platform-${i}" value="${esc(c.platform || '')}" placeholder="Zoom, Google Meet…"></div>
        <div class="field"><label>Zoom / Meet link (online classes, paid guests only)</label><input name="join-${i}" value="${esc(c.joinUrl || '')}" placeholder="https://zoom.us/j/…"></div></div>
      <div class="grid-2"><div class="field"><label>Where (in-person classes)</label><input name="loc-${i}" value="${esc(c.location || '')}"></div>
        <div class="field"><label>Host</label><input name="host-${i}" value="${esc(c.host || '')}"></div></div>
      <div class="field"><label>Description</label><textarea name="desc-${i}" rows="2">${esc(c.description || '')}</textarea></div>
      <div class="field"><label>What guests need</label><textarea name="need-${i}" rows="2">${esc(c.whatYouNeed || '')}</textarea></div>
      <details><summary class="link" style="cursor:pointer">Guest list (${people.length})</summary>
        ${people.length ? `<ul class="mini-list">${people.map((a) => `<li><div style="flex:1"><b>${esc(a.name || a.email)}</b><div class="small muted">${esc(a.email)} · booked ${formatDate(a.bookedAt)}</div></div></li>`).join('')}</ul>
          <button type="button" class="btn btn-ghost btn-sm" data-copy-emails="${esc(c.id)}">Copy guest emails</button>` : '<p class="small muted">No bookings yet.</p>'}
      </details></div>`;
    }).join('') || '<p class="muted">No live classes yet.</p>'}
    ${classes.length ? '<div class="row"><button class="btn btn-primary">Save live classes</button></div>' : ''}</form>`;
}

function categoriesEditor() {
  const cats = store.categories;
  return `<h1 style="font-size:2.2rem">Categories</h1>
    <p class="muted">The sections of the catalogue (Rice &amp; Classics, Soups &amp; Swallows…). Add new ones, e.g. Ghanaian Cooking or African Baking.</p>
    <form data-categories>${cats.map((c, i) => `<div class="repeat"><div class="repeat-head"><b>${esc(c.name)}</b>
      <button type="button" class="icon-btn" data-del-category="${i}" aria-label="Delete">${icon('trash', 16)}</button></div>
      <input type="hidden" name="id-${i}" value="${esc(c.id)}">
      <div class="grid-3"><div class="field"><label>Name</label><input name="name-${i}" value="${esc(c.name)}"></div>
        <div class="field"><label>Order</label><input type="number" name="sort-${i}" value="${c.sort}"></div>
        <div class="field"><label>Placeholder colour</label><select name="tone-${i}">${TONES.map((t) => `<option ${c.tone === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>
      <div class="field"><label>Tagline</label><input name="tagline-${i}" value="${esc(c.tagline)}"></div>
      <p class="small muted" style="margin:0">${store.recipesIn(c.id).length} recipes</p></div>`).join('')}
    <div class="row"><button type="button" class="btn btn-ghost" data-add-category>${icon('plus', 16)} Add category</button><button class="btn btn-primary">Save categories</button></div></form>`;
}

function challengesEditor() {
  const recipeOpts = (v) => store.recipes.map((r) => `<option value="${esc(r.id)}" ${v === r.id ? 'selected' : ''}>${esc(r.title)}</option>`).join('');
  const catOpts = (v) => store.categories.map((c) => `<option value="${esc(c.id)}" ${v === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  return `<h1 style="font-size:2.2rem">Challenges</h1>
    <p class="muted">Shown in My Kitchen. Progress is counted automatically from the dishes each customer finishes.</p>
    <form data-challenges>${store.content.challenges.map((c, i) => `<div class="repeat">
      <div class="repeat-head"><b>${esc(c.title)}</b><button type="button" class="icon-btn" data-del-challenge="${i}" aria-label="Delete">${icon('trash', 16)}</button></div>
      <input type="hidden" name="id-${i}" value="${esc(c.id)}">
      <div class="field"><label>Title</label><input name="title-${i}" value="${esc(c.title)}"></div>
      <div class="field"><label>Description</label><textarea name="desc-${i}" rows="2">${esc(c.description)}</textarea></div>
      <b class="small">Goals</b>
      ${c.goals.map((g, j) => {
        const type = g.categoryId ? 'distinct' : g.minServings ? 'servings' : 'times';
        return `<div class="grid-3" style="align-items:end">
          <div class="field"><label>Goal</label><select name="gtype-${i}-${j}">${[['times', 'Cook a recipe N times'], ['servings', 'Cook a recipe for N+ people'], ['distinct', 'Cook N different dishes from a category']].map(([v, l]) => `<option value="${v}" ${type === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="field"><label>Recipe or category</label><select name="gtarget-${i}-${j}"><optgroup label="Recipes">${recipeOpts(g.recipeId)}</optgroup><optgroup label="Categories">${catOpts(g.categoryId)}</optgroup></select></div>
          <div class="field"><label>N</label><input type="number" min="1" name="gn-${i}-${j}" value="${g.times || g.minServings || g.distinct || 1}"></div></div>`;
      }).join('')}
      <button type="button" class="btn btn-ghost btn-sm" data-add-goal="${i}">${icon('plus', 14)} Add goal</button></div>`).join('')}
    <div class="row"><button type="button" class="btn btn-ghost" data-add-challenge>${icon('plus', 16)} Add challenge</button><button class="btn btn-primary">Save challenges</button></div></form>`;
}

function discountsEditor() {
  const ds = store.content.discounts;
  return `<h1 style="font-size:2.2rem">Discount codes</h1>
    <form data-discounts><div class="panel table-wrap"><table class="table"><thead><tr><th>Code</th><th>% off</th><th>Active</th><th>Note</th><th></th></tr></thead><tbody>
    ${ds.map((d, i) => `<tr><td><input class="input" name="code-${i}" value="${esc(d.code)}" style="min-height:42px"></td><td><input class="input" type="number" min="1" max="100" name="pct-${i}" value="${d.percentOff}" style="min-height:42px;width:90px"></td>
      <td><input type="checkbox" name="act-${i}" ${d.active ? 'checked' : ''} style="width:22px;height:22px"></td><td><input class="input" name="note-${i}" value="${esc(d.note || '')}" style="min-height:42px"></td>
      <td><button type="button" class="icon-btn" data-del-discount="${i}" aria-label="Delete">${icon('trash', 16)}</button></td></tr>`).join('')}
    </tbody></table></div>
    <div class="row"><button type="button" class="btn btn-ghost" data-add-discount>${icon('plus', 16)} Add code</button><button class="btn btn-primary">Save codes</button></div></form>`;
}

// ------------------------------------------------------------------ recipe editor
function blankRecipe() {
  const id = `recipe-${Date.now().toString(36)}`;
  return {
    id, slug: id, status: 'outline', title: '', subtitle: '', categoryId: store.categories[0].id, region: '', story: '',
    prepMinutes: 15, cookMinutes: 30, difficulty: 'Beginner friendly', baseServings: 4, servingOptions: [2, 4, 6, 10, 15, 20],
    previewSteps: 0, allergens: [], dietary: [], hero: { kind: 'photo', src: null, alt: '', brief: 'Finished dish, plated Mcuire style.', tone: 'jollof' },
    gallery: [], serveWith: [], equipment: [], ingredients: [], steps: [],
  };
}

const TEMPLATES = {
  ingredients: () => ({ id: uid('ing'), group: '', name: '', qty: 1, unit: '', scale: 'linear', shopCategory: 'Other', availability: ['mainstream'], substitutes: [] }),
  equipment: () => ({ name: '', note: '' }),
  steps: () => ({ id: uid('s'), phase: 'cook', title: '', body: '', about: '', cues: {}, media: [], ingredientIds: [], tips: [], troubleshooting: [] }),
  tips: () => ({ kind: 'mcuire', text: '' }),
  troubleshooting: () => ({ problem: '', fix: '' }),
  substitutes: () => ({ name: '', note: '' }),
  options: () => ({ id: uid('o'), label: '', verdict: 'good', guidance: '', media: { kind: 'photo', src: null, alt: '', brief: '', tone: 'jollof' } }),
  media: () => ({ kind: 'photo', src: null, alt: '', brief: '', tone: 'jollof' }),
  gallery: () => ({ kind: 'photo', src: null, alt: '', brief: '', tone: 'jollof' }),
};

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] ??= {}), obj);
  target[last] = value;
}

// Field helpers --------------------------------------------------------------
const f = {
  text: (path, label, value, opts = {}) => `<div class="field"><label>${label}</label><input data-bind="${path}" value="${esc(value ?? '')}" ${opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : ''}>${opts.help ? `<small>${opts.help}</small>` : ''}</div>`,
  num: (path, label, value, opts = {}) => `<div class="field"><label>${label}</label><input type="number" step="${opts.step || 'any'}" min="0" data-bind="${path}" data-type="number" value="${value ?? ''}">${opts.help ? `<small>${opts.help}</small>` : ''}</div>`,
  area: (path, label, value, opts = {}) => `<div class="field"><label>${label}</label><textarea data-bind="${path}" ${opts.rows ? `rows="${opts.rows}"` : ''}>${esc(value ?? '')}</textarea>${opts.help ? `<small>${opts.help}</small>` : ''}</div>`,
  list: (path, label, value, help) => `<div class="field"><label>${label}</label><textarea data-bind="${path}" data-type="lines" rows="3">${esc((value || []).join('\n'))}</textarea><small>${help || 'One per line.'}</small></div>`,
  select: (path, label, value, options) => `<div class="field"><label>${label}</label><select data-bind="${path}">${options.map((o) => {
    const [v, l] = Array.isArray(o) ? o : [o, o];
    return `<option value="${esc(v)}" ${String(value) === String(v) ? 'selected' : ''}>${esc(l)}</option>`;
  }).join('')}</select></div>`,
};

function repeatHead(path, i, title) {
  return `<div class="repeat-head"><b>${title}</b><div class="row">
    <button type="button" class="icon-btn" data-move="${path}" data-i="${i}" data-dir="-1" aria-label="Move up">${icon('up', 16)}</button>
    <button type="button" class="icon-btn" data-move="${path}" data-i="${i}" data-dir="1" aria-label="Move down">${icon('down', 16)}</button>
    <button type="button" class="icon-btn" data-del="${path}" data-i="${i}" aria-label="Delete">${icon('trash', 16)}</button></div></div>`;
}

function mediaField(path, ref, label) {
  const r = ref || {};
  return `<div class="media-field">
    ${media(r, { ratio: null, compact: true })}
    <div>
      <b class="small">${esc(label)}</b>
      <div class="grid-2" style="margin-top:6px">
        ${f.select(`${path}.kind`, 'Type', r.kind || 'photo', [['photo', 'Photo'], ['video', 'Short video']])}
        ${f.select(`${path}.tone`, 'Placeholder colour', r.tone || 'jollof', TONES)}
      </div>
      ${f.text(`${path}.src`, r.kind === 'video' ? 'Video URL (MP4, under 30 s)' : 'Photo URL', r.src || '', { placeholder: 'https://… or upload' })}
      <div class="field"><label>…or upload a file</label><input type="file" accept="${r.kind === 'video' ? 'video/mp4,video/webm' : 'image/*'}" data-upload="${path}"></div>
      ${r.kind === 'video' ? f.text(`${path}.poster`, 'Poster image URL', r.poster || '') : ''}
      ${f.text(`${path}.alt`, 'Description (for screen readers)', r.alt || '')}
      ${f.area(`${path}.brief`, 'Photographer’s brief', r.brief || '', { rows: 2 })}
    </div></div>`;
}

const TABS = [['basics', 'Basics'], ['ingredients', 'Ingredients'], ['equipment', 'Equipment'], ['steps', 'Steps'], ['media', 'Photos & video'], ['publish', 'Publishing']];

function editorTab(d, tab, openSteps) {
  switch (tab) {
    case 'basics': return `
      <div class="panel"><div class="grid-2">
        ${f.text('title', 'Recipe name', d.title, { placeholder: 'e.g. Nigerian Fried Rice' })}
        ${f.text('slug', 'Web address', d.slug, { help: `mcuire…/#/recipes/<b>${esc(d.slug)}</b>` })}
      </div>
      ${f.text('subtitle', 'One-line description', d.subtitle)}
      ${f.area('story', 'The story (shown at the top of the lesson)', d.story, { rows: 3 })}
      <div class="grid-3">
        ${f.select('categoryId', 'Category', d.categoryId, store.categories.map((c) => [c.id, c.name]))}
        ${f.text('region', 'Region', d.region)}
        ${f.select('difficulty', 'Difficulty', d.difficulty, ['Beginner friendly', 'Intermediate', 'Confident cook'])}
      </div>
      <div class="grid-3">
        ${f.num('prepMinutes', 'Prep time (min)', d.prepMinutes)}
        ${f.num('cookMinutes', 'Cook time (min)', d.cookMinutes)}
        ${f.num('baseServings', 'Recipe serves', d.baseServings, { help: 'Quantities you enter are for this many people.' })}
      </div>
      <div class="grid-2">
        ${f.list('allergens', 'Allergens', d.allergens)}
        ${f.list('dietary', 'Dietary notes', d.dietary)}
      </div>
      ${f.list('serveWith', 'Serve with', d.serveWith)}
      </div>`;

    case 'ingredients': return `
      <p class="muted">Enter quantities for <b>${d.baseServings} people</b>. The serving calculator scales them. Use <i>Group</i> to split the list (e.g. “For the pepper base”).</p>
      ${d.ingredients.map((ing, i) => `<div class="repeat">${repeatHead('ingredients', i, ing.name || `Ingredient ${i + 1}`)}
        <div class="grid-3">${f.text(`ingredients.${i}.name`, 'Name', ing.name)}${f.text(`ingredients.${i}.prep`, 'Preparation', ing.prep, { placeholder: 'e.g. thinly sliced' })}${f.text(`ingredients.${i}.group`, 'Group', ing.group)}</div>
        <div class="grid-4">${f.num(`ingredients.${i}.qty`, 'Quantity', ing.qty)}${f.select(`ingredients.${i}.unit`, 'Unit', ing.unit || '', [['', '(count)'], 'g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'cube', 'leaf', 'clove', 'pinch', 'tin', 'piece'])}
          ${f.num(`ingredients.${i}.altQty`, 'Also shown as', ing.altQty)}${f.select(`ingredients.${i}.altUnit`, 'Alt unit', ing.altUnit || '', [['', '—'], 'g', 'kg', 'ml', 'l', 'cup'])}</div>
        <div class="grid-3">${f.select(`ingredients.${i}.scale`, 'When servings change', ing.scale || 'linear', [['linear', 'Scale exactly'], ['whole', 'Scale, round to whole'], ['taste', 'Scale, “adjust to taste”'], ['fixed', 'Don’t scale']])}
          ${f.select(`ingredients.${i}.shopCategory`, 'Shopping aisle', ing.shopCategory || 'Other', SHOP_CATEGORIES)}
          <div class="field"><label>Optional?</label><select data-bind="ingredients.${i}.optional" data-type="bool"><option value="">Required</option><option value="1" ${ing.optional ? 'selected' : ''}>Optional</option></select></div></div>
        ${f.text(`ingredients.${i}.note`, 'Note for beginners', ing.note)}
        ${ing.photo ? `${mediaField(`ingredients.${i}.photo`, ing.photo, 'Ingredient photo (shown under “Can’t find this?”)')}<button type="button" class="btn btn-ghost btn-sm" data-ingphoto="${i}" data-remove="1">Remove ingredient photo</button>`
          : `<button type="button" class="btn btn-ghost btn-sm" data-ingphoto="${i}">${icon('camera', 14)} Add ingredient photo</button>`}
        <div class="field"><label>Where to buy</label><div class="row">${Object.entries(AVAILABILITY).map(([k, l]) => `<label class="chip" style="cursor:pointer"><input type="checkbox" data-toggle="ingredients.${i}.availability" value="${k}" ${(ing.availability || []).includes(k) ? 'checked' : ''}> ${l}</label>`).join('')}</div></div>
        <b class="small">“Can’t find this?” substitutes</b>
        ${(ing.substitutes || []).map((s, j) => `<div class="grid-2" style="align-items:end">${f.text(`ingredients.${i}.substitutes.${j}.name`, 'Use instead', s.name)}<div class="row" style="flex-wrap:nowrap;align-items:end"><div style="flex:1">${f.text(`ingredients.${i}.substitutes.${j}.note`, 'How', s.note)}</div><button type="button" class="icon-btn" style="margin-bottom:16px" data-del="ingredients.${i}.substitutes" data-i="${j}" aria-label="Remove">${icon('trash', 16)}</button></div></div>`).join('')}
        <button type="button" class="btn btn-ghost btn-sm" data-add="ingredients.${i}.substitutes" data-tpl="substitutes">${icon('plus', 14)} Add substitute</button>
      </div>`).join('')}
      <button type="button" class="btn btn-dark" data-add="ingredients" data-tpl="ingredients">${icon('plus', 18)} Add ingredient</button>`;

    case 'equipment': return `${d.equipment.map((e, i) => `<div class="repeat">${repeatHead('equipment', i, e.name || `Item ${i + 1}`)}<div class="grid-2">${f.text(`equipment.${i}.name`, 'Equipment', e.name)}${f.text(`equipment.${i}.note`, 'Why / alternative', e.note)}</div></div>`).join('')}
      <button type="button" class="btn btn-dark" data-add="equipment" data-tpl="equipment">${icon('plus', 18)} Add equipment</button>`;

    case 'steps': return `
      <p class="muted">Write each step as if the cook has never made this before. Say what they should <b>see, smell, hear and feel</b>, how long it takes, and how they know it’s ready.</p>
      ${d.steps.map((s, i) => `<details class="repeat" data-step="${i}" ${openSteps.has(i) ? 'open' : ''}>
        <summary style="cursor:pointer;list-style:none"><div class="spread"><b>Step ${i + 1}: ${esc(s.title || 'Untitled')}</b><span class="small muted">${s.timer ? `${icon('timer', 14)} ${s.timer.minutes} min · ` : ''}${s.checkpoint ? 'checkpoint · ' : ''}${(s.media || []).length} media</span></div></summary>
        <div style="margin-top:12px">${repeatHead('steps', i, '')}
        <div class="grid-2">${f.text(`steps.${i}.title`, 'Step title', s.title)}${f.select(`steps.${i}.phase`, 'Phase', s.phase, [['prep', 'Get ready'], ['cook', 'Cooking'], ['finish', 'Finishing']])}</div>
        ${f.area(`steps.${i}.body`, 'Instruction (plain language)', s.body, { rows: 4 })}
        ${f.area(`steps.${i}.why`, 'Why this matters (optional)', s.why, { rows: 2 })}
        <div class="grid-2">${f.text(`steps.${i}.about`, 'Roughly how long', s.about, { placeholder: 'About 10–15 minutes' })}
          <div class="field"><label>Timer</label><div class="row" style="flex-wrap:nowrap"><input type="number" min="0" step="0.5" placeholder="minutes" data-timer="${i}" value="${s.timer?.minutes ?? ''}" style="width:110px"><input placeholder="Timer label" data-bind="steps.${i}.timer.label" value="${esc(s.timer?.label || '')}" ${s.timer ? '' : 'disabled'}></div><small>Leave empty for no timer.</small></div></div>
        <div class="grid-2">
          ${f.area(`steps.${i}.cues.see`, 'What they should see', s.cues?.see, { rows: 2 })}${f.area(`steps.${i}.cues.smell`, 'What they should smell', s.cues?.smell, { rows: 2 })}
          ${f.area(`steps.${i}.cues.hear`, 'What they should hear', s.cues?.hear, { rows: 2 })}${f.area(`steps.${i}.cues.texture`, 'Texture / feel', s.cues?.texture, { rows: 2 })}
        </div>
        ${d.kind === 'meal' ? `<div class="field"><label>“Open the lesson” buttons on this step</label><div class="row">${(d.components || []).map((id) => store.recipe(id)).filter(Boolean).map((r) => `<label class="chip" style="cursor:pointer"><input type="checkbox" data-toggle="steps.${i}.links" value="${esc(r.id)}" ${(s.links || []).includes(r.id) ? 'checked' : ''}> ${esc(r.title)}</label>`).join('') || '<span class="small muted">Choose the meal’s dishes under Publishing first.</span>'}</div></div>` : ''}
        <div class="field"><label>Ingredients used in this step (shown scaled)</label><div class="row">${d.ingredients.map((ing) => `<label class="chip" style="cursor:pointer"><input type="checkbox" data-toggle="steps.${i}.ingredientIds" value="${esc(ing.id)}" ${(s.ingredientIds || []).includes(ing.id) ? 'checked' : ''}> ${esc(ing.name)}</label>`).join('') || '<span class="small muted">Add ingredients first.</span>'}</div></div>

        <b>Tips</b>
        ${(s.tips || []).map((t, j) => `<div class="grid-2" style="align-items:end">${f.select(`steps.${i}.tips.${j}.kind`, 'Type', t.kind, Object.entries(TIP_KINDS))}<div class="row" style="flex-wrap:nowrap;align-items:end"><div style="flex:1">${f.area(`steps.${i}.tips.${j}.text`, 'Tip', t.text, { rows: 2 })}</div><button type="button" class="icon-btn" style="margin-bottom:16px" data-del="steps.${i}.tips" data-i="${j}" aria-label="Remove tip">${icon('trash', 16)}</button></div></div>`).join('')}
        <button type="button" class="btn btn-ghost btn-sm" data-add="steps.${i}.tips" data-tpl="tips">${icon('plus', 14)} Add tip</button>

        <div style="margin-top:16px"><b>Something not right? (troubleshooting)</b></div>
        ${(s.troubleshooting || []).map((t, j) => `<div class="grid-2" style="align-items:end">${f.text(`steps.${i}.troubleshooting.${j}.problem`, 'Problem', t.problem)}<div class="row" style="flex-wrap:nowrap;align-items:end"><div style="flex:1">${f.text(`steps.${i}.troubleshooting.${j}.fix`, 'Fix', t.fix)}</div><button type="button" class="icon-btn" style="margin-bottom:16px" data-del="steps.${i}.troubleshooting" data-i="${j}" aria-label="Remove">${icon('trash', 16)}</button></div></div>`).join('')}
        <button type="button" class="btn btn-ghost btn-sm" data-add="steps.${i}.troubleshooting" data-tpl="troubleshooting">${icon('plus', 14)} Add problem & fix</button>

        <div style="margin-top:16px"><b>Visual checkpoint: “Does yours look like this?”</b></div>
        ${s.checkpoint ? `${f.text(`steps.${i}.checkpoint.question`, 'Question', s.checkpoint.question)}
          ${s.checkpoint.options.map((o, j) => `<div class="repeat" style="background:var(--paper)">${repeatHead(`steps.${i}.checkpoint.options`, j, o.label || `Option ${j + 1}`)}
            <div class="grid-2">${f.text(`steps.${i}.checkpoint.options.${j}.label`, 'Label', o.label, { placeholder: 'Too watery / Correct…' })}${f.select(`steps.${i}.checkpoint.options.${j}.verdict`, 'Meaning', o.verdict, [['good', 'Correct, move on'], ['wait', 'Not yet, keep going'], ['fix', 'Needs fixing']])}</div>
            ${f.area(`steps.${i}.checkpoint.options.${j}.guidance`, 'What to do', o.guidance, { rows: 2 })}
            ${mediaField(`steps.${i}.checkpoint.options.${j}.media`, o.media, 'Comparison photo')}</div>`).join('')}
          <div class="row"><button type="button" class="btn btn-ghost btn-sm" data-add="steps.${i}.checkpoint.options" data-tpl="options">${icon('plus', 14)} Add option</button><button type="button" class="btn btn-ghost btn-sm" data-checkpoint="${i}" data-remove="1">Remove checkpoint</button></div>`
          : `<button type="button" class="btn btn-ghost btn-sm" data-checkpoint="${i}">${icon('plus', 14)} Add checkpoint</button>`}

        <div style="margin-top:16px"><b>Step photos & short videos</b></div>
        ${(s.media || []).map((m, j) => `<div>${mediaField(`steps.${i}.media.${j}`, m, `Media ${j + 1}`)}<button type="button" class="btn btn-ghost btn-sm" data-del="steps.${i}.media" data-i="${j}">Remove media</button></div>`).join('')}
        <button type="button" class="btn btn-ghost btn-sm" data-add="steps.${i}.media" data-tpl="media">${icon('plus', 14)} Add photo or video</button>
        </div>
      </details>`).join('')}
      <button type="button" class="btn btn-dark" data-add="steps" data-tpl="steps">${icon('plus', 18)} Add step</button>`;

    case 'media': return `
      <p class="muted">Upload Mcuire’s own photography. Until a slot has a photo, the site shows a labelled placeholder with the brief below.</p>
      ${mediaField('hero', d.hero, 'Hero: finished dish')}
      ${(d.gallery || []).map((m, j) => `<div>${mediaField(`gallery.${j}`, m, `Gallery ${j + 1}`)}<button type="button" class="btn btn-ghost btn-sm" data-del="gallery" data-i="${j}">Remove</button></div>`).join('')}
      <button type="button" class="btn btn-ghost btn-sm" data-add="gallery" data-tpl="gallery">${icon('plus', 14)} Add gallery photo</button>
      <p class="small muted" style="margin-top:16px">Step and checkpoint photos are edited inside each step.</p>`;

    case 'publish': {
      const inCourses = store.courses.filter((c) => store.courseRecipeIds(c).includes(d.id));
      return `<div class="panel">
        ${f.select('status', 'Status', d.status, [['outline', 'Outline: listed as “filming soon”'], ['complete', 'Live: Cook With Me available']])}
        ${f.select('kind', 'Type', d.kind || '', [['', 'Single dish'], ['meal', 'Complete meal (a timeline that combines several dishes)']])}
        ${d.kind === 'meal' ? `<div class="field"><label>Dishes in this meal</label><div class="row">${store.recipes.filter((r) => r.id !== d.id && !r.components).map((r) => `<label class="chip" style="cursor:pointer"><input type="checkbox" data-toggle="components" value="${esc(r.id)}" ${(d.components || []).includes(r.id) ? 'checked' : ''}> ${esc(r.title)}</label>`).join('')}</div><small>The shopping list and serving calculator include every dish you tick.</small></div>` : ''}
        ${f.num('previewSteps', 'Free preview steps', d.previewSteps, { step: 1, help: 'How many steps visitors can cook before buying. 0 = no free preview.' })}
        ${f.list('servingOptions', 'Serving buttons', (d.servingOptions || []).map(String), 'One number per line, e.g. 2, 4, 6, 10.')}
        <p><b>In courses:</b> ${inCourses.map((c) => esc(c.title)).join(', ') || 'none yet. Add it under Courses & prices.'}</p>
        ${d.status === 'complete' && !d.steps.length ? '<div class="notice">A live recipe needs at least one step.</div>' : ''}
      </div>
      <div class="panel"><h3>Delete recipe</h3><p class="small muted">Removes it from every course. Can’t be undone in demo mode.</p><button type="button" class="btn btn-ghost" data-delete-recipe>Delete ${esc(d.title || 'recipe')}</button></div>`;
    }
    default: return '';
  }
}

function recipeEditor(id, query) {
  const existing = id === 'new' ? null : store.recipe(id);
  if (id !== 'new' && !existing) return '<p>Recipe not found.</p>';
  const draft = existing ? clone(existing) : blankRecipe();
  const state = { tab: query.tab || 'basics', dirty: false, openSteps: new Set([0]) };

  const html = () => `
    <a class="small muted" href="#/admin/recipes" style="text-decoration:none">${icon('back', 14)} All recipes</a>
    <div class="spread" style="margin-top:8px"><h1 style="font-size:2rem;margin:0">${esc(draft.title || 'New recipe')}</h1>
      ${draft.status === 'complete' ? `<a class="btn btn-ghost btn-sm" href="#/recipes/${esc(draft.slug)}" target="_blank">Preview on site</a>` : ''}</div>
    <div class="editor-tabs" role="tablist">${TABS.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${state.tab === k}">${l}${k === 'steps' ? ` (${draft.steps.length})` : k === 'ingredients' ? ` (${draft.ingredients.length})` : ''}</button>`).join('')}</div>
    <form data-editor onsubmit="return false">${editorTab(draft, state.tab, state.openSteps)}</form>
    <div class="save-bar"><span class="small muted" data-dirty style="margin-right:auto;align-self:center">${state.dirty ? 'Unsaved changes' : 'All changes saved'}</span>
      <button type="button" class="btn btn-primary" data-save>Save recipe</button></div>`;

  return {
    html: html(),
    mount(main) {
      const rerender = () => {
        const y = scrollY;
        main.innerHTML = html();
        scrollTo(0, y);
      };
      const dirty = () => {
        state.dirty = true;
        const el = main.querySelector('[data-dirty]');
        if (el) el.textContent = 'Unsaved changes';
      };
      const coerce = (el) => {
        const t = el.dataset.type;
        if (t === 'number') return el.value === '' ? undefined : Number(el.value);
        if (t === 'lines') {
          const lines = el.value.split('\n').map((s) => s.trim()).filter(Boolean);
          return el.dataset.bind === 'servingOptions' ? lines.map(Number).filter((n) => n > 0) : lines;
        }
        if (t === 'bool') return !!el.value;
        if (el.dataset.bind.endsWith('.src') && !el.value) return null;
        return el.value;
      };
      const structural = (fn) => { fn(); dirty(); rerender(); };
      const offs = [
        on(main, 'input', '[data-bind]', (_, el) => { setPath(draft, el.dataset.bind, coerce(el)); dirty(); }),
        on(main, 'change', 'select[data-bind]', (_, el) => {
          setPath(draft, el.dataset.bind, coerce(el));
          dirty();
          if (/\.kind$|\.tone$|^status$|^kind$/.test(el.dataset.bind)) rerender();
        }),
        // Refresh just the preview, never the whole form: a full re-render here
        // would swallow a click on "Save" made straight after pasting a URL.
        on(main, 'change', '[data-bind$=".src"]', (_, el) => {
          const box = el.closest('.media-field');
          const ref = getPath(draft, el.dataset.bind.replace(/\.src$/, ''));
          if (box && ref) box.firstElementChild.outerHTML = media(ref, { ratio: null, compact: true });
        }),
        on(main, 'click', '[data-tab]', (_, b) => { state.tab = b.dataset.tab; rerender(); }),
        on(main, 'click', 'details[data-step] > summary', (_, s) => {
          const i = Number(s.parentElement.dataset.step);
          setTimeout(() => (s.parentElement.open ? state.openSteps.add(i) : state.openSteps.delete(i)));
        }),
        on(main, 'change', '[data-toggle]', (_, el) => {
          const list = getPath(draft, el.dataset.toggle) || [];
          setPath(draft, el.dataset.toggle, el.checked ? [...new Set([...list, el.value])] : list.filter((x) => x !== el.value));
          dirty();
        }),
        on(main, 'input', '[data-timer]', (_, el) => {
          const s = draft.steps[Number(el.dataset.timer)];
          const n = Number(el.value);
          if (!el.value || !n) delete s.timer;
          else s.timer = { minutes: n, label: s.timer?.label || s.title || 'Timer' };
          const label = el.nextElementSibling;
          label.disabled = !s.timer;
          if (s.timer && !label.value) label.value = s.timer.label;
          dirty();
        }),
        on(main, 'click', '[data-add]', (_, b) => structural(() => {
          const list = getPath(draft, b.dataset.add) || [];
          list.push(TEMPLATES[b.dataset.tpl]());
          setPath(draft, b.dataset.add, list);
          if (b.dataset.add === 'steps') state.openSteps.add(list.length - 1);
        })),
        on(main, 'click', '[data-del]', (_, b) => {
          if (!confirm('Delete this item?')) return;
          structural(() => getPath(draft, b.dataset.del).splice(Number(b.dataset.i), 1));
        }),
        on(main, 'click', '[data-move]', (_, b) => structural(() => {
          const list = getPath(draft, b.dataset.move);
          const i = Number(b.dataset.i);
          const j = i + Number(b.dataset.dir);
          if (j < 0 || j >= list.length) return;
          [list[i], list[j]] = [list[j], list[i]];
        })),
        on(main, 'click', '[data-ingphoto]', (_, b) => structural(() => {
          const ing = draft.ingredients[Number(b.dataset.ingphoto)];
          if (b.dataset.remove) delete ing.photo;
          else ing.photo = { kind: 'photo', src: null, alt: ing.name, brief: `${ing.name}: whole and prepared, on the Mcuire counter.`, tone: 'onion' };
        })),
        on(main, 'click', '[data-checkpoint]', (_, b) => structural(() => {
          const s = draft.steps[Number(b.dataset.checkpoint)];
          if (b.dataset.remove) delete s.checkpoint;
          else s.checkpoint = { question: 'Does yours look like this?', options: [TEMPLATES.options(), TEMPLATES.options()] };
        })),
        on(main, 'change', '[data-upload]', async (_, input) => {
          const file = input.files[0];
          if (!file) return;
          const path = input.dataset.upload;
          let url;
          if (config.dataSource === 'api') {
            const res = await apiFetch('admin/media', { method: 'POST', body: file, headers: { 'Content-Type': file.type } });
            if (!res.ok) { toast('Upload failed'); return; }
            url = (await res.json()).url;
          } else {
            if (file.size > 1.5 * 1024 * 1024) toast('Large file: in demo mode it’s stored in this browser only.');
            url = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); });
          }
          setPath(draft, `${path}.src`, url);
          if (file.type.startsWith('video')) setPath(draft, `${path}.kind`, 'video');
          structural(() => {});
        }),
        on(main, 'click', '[data-save]', async () => {
          if (!draft.title.trim()) { toast('Give the recipe a name first'); state.tab = 'basics'; rerender(); return; }
          if (draft.kind === 'meal') draft.components = draft.components || [];
          else { delete draft.kind; delete draft.components; }
          draft.slug = (draft.slug || draft.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          if (store.recipes.some((r) => r.slug === draft.slug && r.id !== draft.id)) { toast('Another recipe already uses that web address'); return; }
          try {
            await store.saveRecipe(clone(draft));
            state.dirty = false;
            toast('Recipe saved');
            if (id === 'new') { location.hash = `#/admin/recipes/${draft.id}`; return; }
            rerender();
          } catch (e) { toast(e.message || 'Could not save (storage may be full)'); }
        }),
        on(main, 'click', '[data-delete-recipe]', async () => {
          if (!confirm(`Delete “${draft.title}” permanently?`)) return;
          await store.deleteRecipe(draft.id);
          toast('Recipe deleted');
          location.hash = '#/admin/recipes';
        }),
      ];
      const beforeUnload = (e) => { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } };
      addEventListener('beforeunload', beforeUnload);
      return () => { offs.forEach((o) => o()); removeEventListener('beforeunload', beforeUnload); };
    },
  };
}

// ------------------------------------------------------------------ entry
export default async function admin({ section = '', id }, query) {
  if (!(await hasAccess())) return gate();

  let body;
  let mountSection = null;
  let liveData = null;
  if (section === 'recipes' && id) {
    const ed = recipeEditor(id, query);
    body = typeof ed === 'string' ? ed : ed.html;
    mountSection = ed.mount;
  } else {
    body = {
      '': overview,
      recipes: recipesList,
      courses: async () => coursesEditor(config.dataSource === 'api' ? await loadServerList('stripe-accounts') : null),
      live: async () => { liveData = await loadLiveAdmin(); return liveEditor(liveData); },
      discounts: discountsEditor,
      categories: categoriesEditor,
      challenges: challengesEditor,
      customers: customersList,
      orders: ordersList,
      certificates: certificatesList,
      media: mediaReport,
      tools,
    }[section]?.();
    body = await body;
    if (body == null) body = '<p>Unknown section.</p>';
  }

  return {
    title: 'Admin',
    html: layout(section, body),
    mount(root) {
      const main = root.querySelector('.admin-main');
      const offs = [];
      if (mountSection) offs.push(mountSection(main));

      offs.push(on(main, 'submit', '[data-course]', async (e, form) => {
        e.preventDefault();
        const c = clone(store.course(form.dataset.course));
        const data = new FormData(form);
        c.title = data.get('title').trim() || c.title;
        c.priceCents = Math.round(Number(data.get('price')) * 100);
        c.compareAtCents = data.get('compare') ? Math.round(Number(data.get('compare')) * 100) : undefined;
        c.status = data.get('status');
        c.currency = data.get('currency') || 'CAD';
        if (data.has('stripeAccount')) c.stripeAccount = String(data.get('stripeAccount')).trim().toLowerCase() || 'default';
        c.blurb = data.get('blurb');
        if (data.has('certificateTitle')) c.certificateTitle = data.get('certificateTitle');
        c.modules.forEach((m, mi) => {
          m.title = data.get(`module-${mi}`) || m.title;
          m.recipeIds = data.getAll(`mod-${mi}`);
        });
        try {
          await store.saveCourse(c);
          toast(`${c.title} saved: ${money(c.priceCents, c.currency)}`);
        } catch (err) { toast(err.message); }
      }));

      offs.push(on(main, 'click', '[data-bulk-price]', (_, b) => {
        const v = b.form.bulk.value;
        if (v === '' || Number(v) < 0) { toast('Type a price first'); return; }
        b.form.querySelectorAll('input[name^="price-"]').forEach((el) => { el.value = Number(v).toFixed(2); });
        toast('Prices filled in. Press “Save single-dish prices” to keep them.');
      }));
      offs.push(on(main, 'submit', '[data-singles]', async (e, form) => {
        e.preventDefault();
        const data = new FormData(form);
        const changed = [];
        for (const c of store.courses.filter((x) => x.kind === 'single')) {
          const next = clone(c);
          next.priceCents = Math.round(Number(data.get(`price-${c.id}`)) * 100) || 0;
          next.status = data.get(`on-${c.id}`) === 'on' ? 'published' : 'hidden';
          if (data.has(`acct-${c.id}`)) next.stripeAccount = String(data.get(`acct-${c.id}`)).trim().toLowerCase() || 'default';
          if (next.priceCents !== c.priceCents || next.status !== c.status || (next.stripeAccount || 'default') !== (c.stripeAccount || 'default')) changed.push(next);
        }
        if (!changed.length) { toast('Nothing changed'); return; }
        try {
          for (const c of changed) await store.saveCourse(c);
          toast(`${changed.length} dish${changed.length === 1 ? '' : 'es'} updated`);
        } catch (err) { toast(err.message); }
      }));

      const readLive = (form) => {
        const data = new FormData(form);
        return liveData.classes.map((c, i) => {
          const start = data.get(`start-${i}`);
          return {
            ...c,
            title: String(data.get(`title-${i}`) || '').trim() || c.title,
            status: data.get(`status-${i}`) || c.status,
            startsAt: start ? new Date(start).toISOString() : c.startsAt,
            durationMinutes: Math.max(15, Number(data.get(`dur-${i}`)) || 60),
            recipeId: data.get(`recipe-${i}`) || '',
            priceCents: Math.max(0, Math.round(Number(data.get(`price-${i}`)) * 100) || 0),
            capacity: Math.max(1, Number(data.get(`cap-${i}`)) || 1),
            format: data.get(`format-${i}`) || 'online',
            platform: String(data.get(`platform-${i}`) || '').trim(),
            joinUrl: String(data.get(`join-${i}`) || '').trim(),
            location: String(data.get(`loc-${i}`) || '').trim(),
            host: String(data.get(`host-${i}`) || '').trim(),
            description: data.get(`desc-${i}`) || '',
            whatYouNeed: data.get(`need-${i}`) || '',
          };
        });
      };
      const saveLive = async (list, msg) => {
        const bad = list.find((c) => c.status === 'published' && c.joinUrl && !/^https:\/\//.test(c.joinUrl));
        if (bad) { toast(`“${bad.title}”: the join link should start with https://`); return; }
        try {
          await store.saveLiveClasses(list);
          liveData = await loadLiveAdmin();
          main.innerHTML = liveEditor(liveData);
          if (msg) toast(msg);
        } catch (err) { toast(err.message); }
      };
      offs.push(on(main, 'submit', '[data-live-booking]', async (e, f) => {
        e.preventDefault();
        const d = new FormData(f);
        const times = String(d.get('times') || '').split(',').map((t) => t.trim()).filter((t) => /^\d{1,2}:\d{2}$/.test(t)).map((t) => t.padStart(5, '0'));
        const days = d.getAll('day').map(Number);
        if (!times.length || !days.length) { toast('Choose at least one day and one start time'); return; }
        const next = {
          ...store.liveBooking,
          enabled: d.get('enabled') === 'on',
          pricePerHourCents: Math.max(0, Math.round(Number(d.get('price')) * 100) || 0),
          perPerson: d.get('perPerson') === '1',
          taxLabel: String(d.get('taxLabel') || 'HST').trim(),
          taxRate: Math.max(0, Number(d.get('taxRate')) || 0) / 100,
          days, times: [...new Set(times)].sort(),
          minHours: Math.max(1, Number(d.get('minHours')) || 1),
          maxHours: Math.max(1, Number(d.get('maxHours')) || 1),
          latestEnd: /^\d{1,2}:\d{2}$/.test(String(d.get('latestEnd'))) ? String(d.get('latestEnd')).padStart(5, '0') : '20:00',
          maxPeople: Math.max(1, Number(d.get('maxPeople')) || 1),
          leadDays: Math.max(0, Number(d.get('leadDays')) || 0),
          weeksAhead: Math.min(52, Math.max(1, Number(d.get('weeksAhead')) || 12)),
          description: String(d.get('description') || ''),
          location: String(d.get('location') || '').trim() || 'Mcuire African Restaurant',
        };
        if (next.maxHours < next.minHours) next.maxHours = next.minHours;
        try { await store.saveLiveBooking(next); toast('Weekend classes saved'); } catch (err) { toast(err.message); }
      }));
      offs.push(on(main, 'submit', '[data-live]', async (e, form) => { e.preventDefault(); await saveLive(readLive(form), 'Live classes saved'); }));
      offs.push(on(main, 'click', '[data-add-live]', async () => {
        const form = main.querySelector('[data-live]');
        const list = form && liveData.classes.length ? readLive(form) : liveData.classes.slice();
        await saveLive([...list, blankLiveClass()], 'Draft class added. Fill it in, set it to Published and save.');
      }));
      offs.push(on(main, 'click', '[data-del-live]', async (_, b) => {
        const list = readLive(b.form);
        const i = Number(b.dataset.delLive);
        const booked = liveData.attendees.filter((a) => a.classId === list[i].id).length;
        if (booked) { toast('People have booked this class. Set it to Cancelled instead, and refund them in Stripe.'); return; }
        if (!confirm(`Delete “${list[i].title}”?`)) return;
        list.splice(i, 1);
        await saveLive(list, 'Class deleted');
      }));
      offs.push(on(main, 'click', '[data-copy-emails]', async (_, b) => {
        const emails = liveData.attendees.filter((a) => a.classId === b.dataset.copyEmails).map((a) => a.email).join(', ');
        try { await navigator.clipboard.writeText(emails); toast('Emails copied'); } catch { prompt('Guest emails', emails); }
      }));

      const readCategories = (form) => {
        const data = new FormData(form);
        return store.categories.map((c, i) => ({
          ...c,
          name: String(data.get(`name-${i}`) || c.name).trim(),
          sort: Number(data.get(`sort-${i}`)) || 0,
          tone: data.get(`tone-${i}`) || c.tone,
          tagline: data.get(`tagline-${i}`) || '',
        }));
      };
      const saveCats = async (list) => {
        try { await store.saveCategories(list); main.innerHTML = categoriesEditor(); return true; } catch (e) { toast(e.message); return false; }
      };
      offs.push(on(main, 'submit', '[data-categories]', async (e, form) => {
        e.preventDefault();
        if (await saveCats(readCategories(form))) toast('Categories saved');
      }));
      offs.push(on(main, 'click', '[data-add-category]', async (_, b) => {
        const name = prompt('Name of the new category (e.g. Ghanaian Cooking)');
        if (!name) return;
        const id = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (store.category(id)) { toast('That category already exists'); return; }
        const list = readCategories(b.form);
        await saveCats([...list, { id, slug: id, name: name.trim(), tagline: '', tone: 'jollof', sort: list.length + 1 }]);
      }));
      offs.push(on(main, 'click', '[data-del-category]', async (_, b) => {
        const list = readCategories(b.form);
        const cat = list[Number(b.dataset.delCategory)];
        if (store.recipesIn(cat.id).length) { toast('Move its recipes to another category first'); return; }
        if (!confirm(`Delete “${cat.name}”?`)) return;
        list.splice(Number(b.dataset.delCategory), 1);
        await saveCats(list);
      }));

      const readChallenges = (form) => {
        const data = new FormData(form);
        return store.content.challenges.map((c, i) => ({
          id: c.id,
          title: String(data.get(`title-${i}`) || '').trim() || c.title,
          description: data.get(`desc-${i}`) || '',
          goals: c.goals.map((_, j) => {
            const type = data.get(`gtype-${i}-${j}`);
            const target = data.get(`gtarget-${i}-${j}`);
            const n = Math.max(1, Number(data.get(`gn-${i}-${j}`)) || 1);
            const isCat = !!store.content.categories.find((x) => x.id === target);
            if (type === 'distinct' || isCat) return { categoryId: isCat ? target : store.recipe(target)?.categoryId, distinct: n };
            return type === 'servings' ? { recipeId: target, minServings: n } : { recipeId: target, times: n };
          }),
        }));
      };
      const saveChals = async (list, msg) => {
        await store.saveChallenges(list);
        main.innerHTML = challengesEditor();
        if (msg) toast(msg);
      };
      offs.push(on(main, 'submit', '[data-challenges]', async (e, form) => { e.preventDefault(); await saveChals(readChallenges(form), 'Challenges saved'); }));
      offs.push(on(main, 'click', '[data-add-challenge]', async (_, b) => {
        await saveChals([...readChallenges(b.form), { id: `ch-${Date.now().toString(36)}`, title: 'New challenge', description: '', goals: [{ recipeId: store.freeRecipe.id, times: 1 }] }]);
      }));
      offs.push(on(main, 'click', '[data-add-goal]', async (_, b) => {
        const list = readChallenges(b.form);
        list[Number(b.dataset.addGoal)].goals.push({ recipeId: store.freeRecipe.id, times: 1 });
        await saveChals(list);
      }));
      offs.push(on(main, 'click', '[data-del-challenge]', async (_, b) => {
        if (!confirm('Delete this challenge?')) return;
        const list = readChallenges(b.form);
        list.splice(Number(b.dataset.delChallenge), 1);
        await saveChals(list);
      }));

      const readDiscounts = (form) => {
        const data = new FormData(form);
        return store.content.discounts.map((_, i) => ({
          code: String(data.get(`code-${i}`) || '').trim().toUpperCase(),
          percentOff: Math.max(1, Math.min(100, Number(data.get(`pct-${i}`)) || 0)),
          active: data.get(`act-${i}`) === 'on',
          note: data.get(`note-${i}`) || '',
        }));
      };
      offs.push(on(main, 'submit', '[data-discounts]', async (e, form) => {
        e.preventDefault();
        await store.saveDiscounts(readDiscounts(form).filter((d) => d.code));
        toast('Discount codes saved');
      }));
      offs.push(on(main, 'click', '[data-add-discount]', async (_, b) => {
        await store.saveDiscounts([...readDiscounts(b.form), { code: 'NEWCODE', percentOff: 10, active: false, note: '' }]);
        main.innerHTML = discountsEditor();
      }));
      offs.push(on(main, 'click', '[data-del-discount]', async (_, b) => {
        const list = readDiscounts(b.form);
        list.splice(Number(b.dataset.delDiscount), 1);
        await store.saveDiscounts(list);
        main.innerHTML = discountsEditor();
      }));

      offs.push(on(main, 'click', '[data-tool]', async (_, b) => {
        const tool = b.dataset.tool;
        if (tool === 'complete') {
          const ids = store.flagship.requiredRecipeIds;
          ids.forEach((rid) => { if (!store.completedRecipeIds().includes(rid)) store.kitchen.cookLog.push({ recipeId: rid, servings: 4, cookedAt: new Date().toISOString() }); });
          store.persist();
          toast(`${ids.length} dishes marked cooked. Open My Kitchen → Certificate.`);
        }
        if (tool === 'grant') {
          store.grant({ id: `demo_${Date.now()}`, courseId: store.flagship.id, email: store.kitchen.account?.email || 'demo@mcuire.test', amountCents: 0, currency: 'CAD', status: 'paid', createdAt: new Date().toISOString() });
          toast('All courses unlocked');
        }
        if (tool === 'reset-content' && confirm('Discard all content edits?')) { await store.resetContent(); toast('Content reset'); }
        if (tool === 'reset-kitchen' && confirm('Clear your purchases and progress in this browser?')) { await store.signOut(); toast('Kitchen reset'); }
      }));
      return () => offs.forEach((o) => o?.());
    },
  };
}
