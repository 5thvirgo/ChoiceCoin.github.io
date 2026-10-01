// Store: the single data interface used by every view.
// Two adapters implement persistence:
//   LocalAdapter: localStorage, for the static demo / GitHub Pages / offline review
//   ApiAdapter:   server/server.mjs (content gated + commerce enforced server-side)
//
// Views never touch localStorage or fetch directly. Swapping the adapter
// is a config change.

import { config } from '../config.js';
import { SEED } from '../data/seed.js';
import { uid } from '../lib/dom.js';

const CONTENT_KEY = 'mcuire.content.v1';
const USER_KEY = 'mcuire.kitchen.v1';
const GUEST_KEY = 'mcuire.guest.v1';

const clone = (v) => JSON.parse(JSON.stringify(v));

function emptyKitchen() {
  return {
    account: null, // { email, name, createdAt }
    enrollments: [], // { courseId, orderId, grantedAt }
    orders: [], // { id, courseId, email, amountCents, currency, discountCode, status, createdAt }
    certificates: [], // { number, courseId, name, issuedAt }
    progress: {}, // recipeId -> { step, servings, checkpoints, startedAt, updatedAt, completedAt }
    cookLog: [], // { recipeId, servings, cookedAt }
    saved: [], // recipeIds
    recent: [], // recipeIds, newest first
    shopping: { selections: [], checked: {}, extras: [] },
  };
}

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked; state stays in memory for this visit */
  }
}

// ---------------------------------------------------------------------------
class LocalAdapter {
  async loadContent() {
    const stored = read(CONTENT_KEY);
    // A newer seed replaces untouched content; admin-edited content is kept.
    if (stored && (stored.edited || stored.version === SEED.version)) return stored;
    return clone(SEED);
  }
  async saveContent(content) {
    write(CONTENT_KEY, { ...content, edited: true });
  }
  async resetContent() {
    try { localStorage.removeItem(CONTENT_KEY); } catch { /* ignore */ }
    return clone(SEED);
  }
  async loadKitchen() {
    return { ...emptyKitchen(), ...(read(USER_KEY) || {}) };
  }
  async saveKitchen(kitchen) {
    write(USER_KEY, kitchen);
  }
  async checkout({ course, email, discountCode, amountCents }) {
    // Demo only: mirrors what the Stripe webhook does on the server.
    const order = {
      id: uid('ord'), courseId: course.id, email, amountCents, currency: course.currency,
      discountCode: discountCode || null, status: 'paid', createdAt: new Date().toISOString(),
    };
    return { order };
  }
}

// ---------------------------------------------------------------------------
class ApiAdapter {
  async request(path, options = {}) {
    const res = await fetch(`api/${path}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Mcuire': '1' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    return res.status === 204 ? null : res.json();
  }
  async loadContent() {
    return this.request('catalog');
  }
  async loadRecipe(slug) {
    return this.request(`recipes/${encodeURIComponent(slug)}`);
  }
  async saveContent(content, changed) {
    if (changed?.recipe) await this.request(`admin/recipes/${changed.recipe.id}`, { method: 'PUT', body: changed.recipe });
    if (changed?.course) await this.request(`admin/courses/${changed.course.id}`, { method: 'PUT', body: changed.course });
    if (changed?.discounts) await this.request('admin/discounts', { method: 'PUT', body: changed.discounts });
    if (changed?.deleteRecipe) await this.request(`admin/recipes/${changed.deleteRecipe}`, { method: 'DELETE' });
  }
  async resetContent() {
    return this.loadContent();
  }
  // Visitors cook the free preview before they have an account. Their progress
  // is kept on this device and merged into the account after purchase / sign-in.
  async loadKitchen() {
    const guest = read(GUEST_KEY);
    let me;
    try {
      me = await this.request('me');
    } catch {
      me = {};
    }
    const kitchen = { ...emptyKitchen(), ...me };
    if (!kitchen.account) return guest ? { ...kitchen, ...guest, account: null } : kitchen;
    if (guest) {
      for (const [id, p] of Object.entries(guest.progress || {})) {
        const mine = kitchen.progress[id];
        if (!mine || (p.updatedAt || '') > (mine.updatedAt || '')) kitchen.progress[id] = p;
      }
      kitchen.cookLog = [...kitchen.cookLog, ...(guest.cookLog || [])];
      kitchen.saved = [...new Set([...kitchen.saved, ...(guest.saved || [])])];
      kitchen.recent = [...new Set([...(guest.recent || []), ...kitchen.recent])].slice(0, 8);
      if (!kitchen.shopping?.selections?.length && guest.shopping) kitchen.shopping = guest.shopping;
      try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
      await this.saveKitchen(kitchen);
    }
    return kitchen;
  }
  async saveKitchen(kitchen) {
    if (!kitchen.account) {
      const { progress, cookLog, saved, recent, shopping } = kitchen;
      write(GUEST_KEY, { progress, cookLog, saved, recent, shopping });
      return;
    }
    const { progress, cookLog, saved, recent, shopping, account } = kitchen;
    await this.request('me/state', { method: 'PUT', body: { progress, cookLog, saved, recent, shopping, name: account.name } });
  }
  async checkout({ course, email, discountCode, resume }) {
    // Server creates a Stripe Checkout Session using the database price.
    return this.request('checkout/session', { method: 'POST', body: { courseId: course.id, email, discountCode, resume } });
  }
  async issueCertificate(courseId, name) {
    return this.request('me/certificates', { method: 'POST', body: { courseId, name } });
  }
  async requestSignIn(email) {
    await this.request('auth/magic-link', { method: 'POST', body: { email } });
  }
  async signOut() {
    await this.request('auth/logout', { method: 'POST' }).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
class Store {
  constructor(adapter) {
    this.adapter = adapter;
    this.content = null;
    this.kitchen = null;
    this.listeners = new Set();
    this.saveTimer = null;
  }

  async init() {
    [this.content, this.kitchen] = await Promise.all([this.adapter.loadContent(), this.adapter.loadKitchen()]);
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit() {
    this.listeners.forEach((fn) => fn());
  }

  // ---- Content queries --------------------------------------------------
  get categories() { return [...this.content.categories].sort((a, b) => a.sort - b.sort); }
  get courses() { return this.content.courses; }
  get recipes() { return this.content.recipes; }
  category(id) { return this.content.categories.find((c) => c.id === id || c.slug === id); }
  course(idOrSlug) { return this.content.courses.find((c) => c.id === idOrSlug || c.slug === idOrSlug); }
  recipe(idOrSlug) { return this.content.recipes.find((r) => r.id === idOrSlug || r.slug === idOrSlug); }
  recipesIn(categoryId) { return this.content.recipes.filter((r) => r.categoryId === categoryId); }
  courseRecipeIds(course) { return course.modules.flatMap((m) => m.recipeIds); }
  get flagship() { return this.content.courses.find((c) => c.kind === 'flagship'); }
  get freeRecipe() { return this.recipe(this.content.freeLesson?.recipeId); }

  // In API mode the catalogue ships recipe summaries only; full steps are
  // fetched (and entitlement-gated) per recipe.
  async fullRecipe(slug) {
    const local = this.recipe(slug);
    if (!this.adapter.loadRecipe) return local;
    const full = await this.adapter.loadRecipe(slug);
    Object.assign(local || {}, full);
    return local || full;
  }

  // ---- Entitlements ----------------------------------------------------
  owns(courseId) {
    return this.kitchen.enrollments.some((e) => e.courseId === courseId);
  }
  ownsRecipe(recipeId) {
    return this.content.courses.some((c) => this.owns(c.id) && this.courseRecipeIds(c).includes(recipeId));
  }
  coursesContaining(recipeId) {
    return this.content.courses.filter((c) => this.courseRecipeIds(c).includes(recipeId));
  }
  canCookStep(recipe, index) {
    return this.ownsRecipe(recipe.id) || index < (recipe.previewSteps || 0);
  }
  get ownedCourses() {
    return this.content.courses.filter((c) => this.owns(c.id));
  }

  // ---- Kitchen state (user) -------------------------------------------
  persist() {
    this.emit();
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.adapter.saveKitchen(this.kitchen).catch(() => {}), 300);
  }

  progress(recipeId) {
    return this.kitchen.progress[recipeId] || null;
  }
  setProgress(recipeId, patch) {
    const now = new Date().toISOString();
    const current = this.kitchen.progress[recipeId] || { step: 0, servings: null, checkpoints: {}, startedAt: now };
    this.kitchen.progress[recipeId] = { ...current, ...patch, updatedAt: now };
    this.touchRecent(recipeId, false);
    this.persist();
  }
  setCheckpoint(recipeId, stepId, optionId) {
    const p = this.progress(recipeId) || { checkpoints: {} };
    this.setProgress(recipeId, { checkpoints: { ...(p.checkpoints || {}), [stepId]: optionId } });
  }
  completeRecipe(recipeId, servings) {
    const now = new Date().toISOString();
    this.kitchen.cookLog.push({ recipeId, servings, cookedAt: now });
    this.kitchen.progress[recipeId] = { ...(this.kitchen.progress[recipeId] || {}), completedAt: now, step: 0, updatedAt: now, active: false };
    this.persist();
  }
  completedRecipeIds() {
    return [...new Set(this.kitchen.cookLog.map((l) => l.recipeId))];
  }
  inProgress() {
    return Object.entries(this.kitchen.progress)
      .filter(([, p]) => p.active)
      .map(([id, p]) => ({ recipe: this.recipe(id), progress: p }))
      .filter((x) => x.recipe)
      .sort((a, b) => (b.progress.updatedAt || '').localeCompare(a.progress.updatedAt || ''));
  }

  isSaved(recipeId) { return this.kitchen.saved.includes(recipeId); }
  toggleSaved(recipeId) {
    const s = this.kitchen.saved;
    this.kitchen.saved = s.includes(recipeId) ? s.filter((x) => x !== recipeId) : [recipeId, ...s];
    this.persist();
    return this.isSaved(recipeId);
  }
  touchRecent(recipeId, persist = true) {
    this.kitchen.recent = [recipeId, ...this.kitchen.recent.filter((x) => x !== recipeId)].slice(0, 8);
    if (persist) this.persist();
  }

  get shopping() { return this.kitchen.shopping; }
  saveShopping(shopping) {
    this.kitchen.shopping = shopping;
    this.persist();
  }

  // ---- Commerce --------------------------------------------------------
  discount(code) {
    if (!code) return null;
    return this.content.discounts.find((d) => d.active && d.code.toUpperCase() === code.trim().toUpperCase()) || null;
  }
  priceFor(course, code) {
    const d = this.discount(code);
    const off = d ? Math.round((course.priceCents * d.percentOff) / 100) : 0;
    return { subtotal: course.priceCents, discount: off, total: course.priceCents - off, applied: d };
  }

  // Returns { order } (demo, unlocked immediately) or { url } (Stripe redirect).
  async checkout(courseId, email, discountCode, resume) {
    const course = this.course(courseId);
    const { total, applied } = this.priceFor(course, discountCode);
    const result = await this.adapter.checkout({ course, email, discountCode: applied?.code, amountCents: total, resume });
    if (result.order) this.grant(result.order);
    return result;
  }
  grant(order) {
    const k = this.kitchen;
    if (!k.account) k.account = { email: order.email, name: '', createdAt: order.createdAt };
    if (!k.orders.some((o) => o.id === order.id)) k.orders.push(order);
    const course = this.course(order.courseId);
    // The flagship includes every mini course.
    const grantIds = course.kind === 'flagship' ? this.content.courses.map((c) => c.id) : [course.id];
    for (const courseId of grantIds) {
      if (!this.owns(courseId)) k.enrollments.push({ courseId, orderId: order.id, grantedAt: order.createdAt });
    }
    this.persist();
  }
  setAccountName(name) {
    if (this.kitchen.account) this.kitchen.account.name = name;
    this.persist();
  }
  async signOut() {
    if (this.adapter.signOut) await this.adapter.signOut();
    else await this.adapter.saveKitchen(emptyKitchen());
    this.kitchen = emptyKitchen();
    this.emit();
  }
  get canSignIn() {
    return !!this.adapter.requestSignIn;
  }
  requestSignIn(email) {
    return this.adapter.requestSignIn(email);
  }

  // ---- Certificates ----------------------------------------------------
  certificateProgress(course = this.flagship) {
    const required = course.requiredRecipeIds || this.courseRecipeIds(course);
    const done = new Set(this.completedRecipeIds());
    const completed = required.filter((id) => done.has(id));
    return { required, completed, ratio: required.length ? completed.length / required.length : 0 };
  }
  certificate(courseId) {
    return this.kitchen.certificates.find((c) => c.courseId === courseId) || null;
  }
  async issueCertificate(courseId, name) {
    let cert;
    if (this.adapter.issueCertificate) {
      cert = await this.adapter.issueCertificate(courseId, name);
    } else {
      cert = { number: certificateNumber(), courseId, name, issuedAt: new Date().toISOString() };
    }
    this.kitchen.certificates = [...this.kitchen.certificates.filter((c) => c.courseId !== courseId), cert];
    this.persist();
    return cert;
  }

  // ---- Admin -----------------------------------------------------------
  async saveRecipe(recipe) {
    const list = this.content.recipes;
    const i = list.findIndex((r) => r.id === recipe.id);
    if (i >= 0) list[i] = recipe; else list.push(recipe);
    await this.adapter.saveContent(this.content, { recipe });
    this.emit();
  }
  async deleteRecipe(id) {
    this.content.recipes = this.content.recipes.filter((r) => r.id !== id);
    for (const c of this.content.courses) for (const m of c.modules) m.recipeIds = m.recipeIds.filter((x) => x !== id);
    await this.adapter.saveContent(this.content, { deleteRecipe: id });
    this.emit();
  }
  async saveCourse(course) {
    const i = this.content.courses.findIndex((c) => c.id === course.id);
    this.content.courses[i] = course;
    await this.adapter.saveContent(this.content, { course });
    this.emit();
  }
  async saveDiscounts(discounts) {
    this.content.discounts = discounts;
    await this.adapter.saveContent(this.content, { discounts });
    this.emit();
  }
  async resetContent() {
    this.content = await this.adapter.resetContent();
    this.emit();
  }
}

// MCU-YYYY-XXXXXX-C : random base32 body + mod-31 check character (catches typos when verifying).
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export function certificateNumber(date = new Date()) {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const body = Array.from(bytes, (b) => ALPHABET[b % 32]).join('');
  return `MCU-${date.getFullYear()}-${body}-${checkChar(body)}`;
}
export function checkChar(body) {
  let sum = 0;
  for (const [i, ch] of [...body].entries()) sum += (ALPHABET.indexOf(ch) + 1) * (i + 1);
  return ALPHABET[sum % 31];
}
export function isValidCertificateNumber(number) {
  const m = /^MCU-\d{4}-([2-9A-HJ-NP-Z]{6})-([2-9A-HJ-NP-Z])$/.exec(String(number).toUpperCase());
  return !!m && checkChar(m[1]) === m[2];
}

export const store = new Store(config.dataSource === 'api' ? new ApiAdapter() : new LocalAdapter());
