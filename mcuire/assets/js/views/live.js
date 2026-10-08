// Live cooking classes: schedule, booking, confirmation.
// Routes: #/live, #/live/:id/book, #/live/:id/booked

import { config } from '../config.js';
import { store, apiFetch, setSessionToken } from '../services/store.js';
import { media } from '../components.js';
import { esc, icon, money, minutes, on, toast } from '../lib/dom.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function classWhen(cls, opts = {}) {
  const d = new Date(cls.startsAt);
  const date = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', ...(opts.year ? { year: 'numeric' } : {}) });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  return { date, time, text: `${date} · ${time}` };
}

// Join link opens 30 minutes before class and stays open until it ends.
export function joinWindow(cls) {
  const start = Date.parse(cls.startsAt);
  const now = Date.now();
  return { open: now >= start - 30 * 60000 && now <= start + (cls.durationMinutes || 60) * 60000, ended: now > start + (cls.durationMinutes || 60) * 60000 };
}

// .ics calendar invite, generated on the device.
export function downloadIcs(cls, ticket) {
  const stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = Date.parse(cls.startsAt);
  const where = cls.format === 'in-person' ? (ticket?.location || cls.location || config.brand.name) : (ticket?.joinUrl || `${cls.platform || 'Online'} (link in My Kitchen)`);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mcuire//Cooking Classes//EN', 'BEGIN:VEVENT',
    `UID:${cls.id}@mcuire-kitchen`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(start + (cls.durationMinutes || 60) * 60000)}`,
    `SUMMARY:${config.brand.short} live class: ${cls.title}`.replace(/[,;]/g, ' '),
    `LOCATION:${where}`.replace(/[,;]/g, ' '),
    `DESCRIPTION:${(cls.whatYouNeed || '').replace(/[,;\n]/g, ' ')}`,
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Live cooking class in 1 hour', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  a.download = `${cls.id}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function classCard(cls) {
  const recipe = store.recipe(cls.recipeId);
  const when = classWhen(cls);
  const seats = store.seatsLeft(cls);
  const booked = store.ticket(cls.id);
  return `<article class="course-row">
    ${media(recipe?.hero, { ratio: 'wide', compact: true })}
    <div>
      <span class="eyebrow">${esc(cls.format === 'in-person' ? `In person · ${config.brand.name}` : `Live online${cls.platform ? ` · ${cls.platform}` : ''}`)}</span>
      <h3 style="font-size:1.7rem">${esc(cls.title)}</h3>
      <p class="muted">${esc(cls.description)}</p>
      <ul class="ticks small" style="margin:0 0 14px">
        <li>${icon('clock', 16)} ${esc(when.text)} · ${minutes(cls.durationMinutes)}</li>
        <li>${icon('users', 16)} ${seats > 0 ? `${seats} of ${cls.capacity} seats left` : 'Fully booked'}</li>
        ${cls.host ? `<li>${icon('flame', 16)} With ${esc(cls.host)}</li>` : ''}
      </ul>
      <div class="row">
        ${booked ? `<span class="chip leaf">${icon('check', 14)} You’re booked</span><a class="btn btn-ghost btn-sm" href="#/kitchen">See your ticket</a>`
          : seats > 0 ? `<span class="price" style="font-size:1.6rem">${money(cls.priceCents, cls.currency)}</span><a class="btn btn-primary" href="#/live/${esc(cls.id)}/book">Book a seat</a>`
            : '<span class="chip">Fully booked</span>'}
        ${recipe ? `<a class="link small" href="#/recipes/${esc(recipe.slug)}">See the recipe</a>` : ''}
      </div>
    </div>
  </article>`;
}

function list() {
  const classes = store.liveClasses;
  return {
    title: 'Live cooking classes',
    html: `
    <section class="section-tight">
      <div class="wrap">
        <span class="eyebrow">Live with the ${esc(config.brand.short)} kitchen</span>
        <h1>Live cooking classes</h1>
        <p class="lede">Come into Mcuire African Restaurant and cook alongside our chef. Small hands-on groups, all ingredients and equipment provided, and you eat what you make. Some classes also run online on Zoom or Google Meet.</p>
      </div>
    </section>
    <section class="section-tight" style="padding-top:0">
      <div class="wrap">
        ${classes.length ? classes.map(classCard).join('') : `<div class="empty"><h3>No classes scheduled right now</h3><p>New dates are announced here. In the meantime, every dish is available as a step-by-step Cook With Me lesson.</p><a class="btn btn-primary" href="#/courses">Browse lessons</a></div>`}
      </div>
    </section>`,
  };
}

function book(cls, query) {
  if (!cls || cls.status !== 'published') {
    return { title: 'Class not found', html: '<section class="section wrap empty"><h2>That class isn’t available</h2><a class="btn btn-primary" href="#/live">See live classes</a></section>' };
  }
  const recipe = store.recipe(cls.recipeId);
  const demo = config.payments !== 'stripe';
  const when = classWhen(cls, { year: true });
  let code = '';
  const summary = () => {
    const p = store.priceFor(cls, code);
    return `
      <div class="row" style="flex-wrap:nowrap;align-items:flex-start">
        <div style="width:96px;flex:none">${media(recipe?.hero, { ratio: 'square', compact: true })}</div>
        <div><b style="font-family:var(--display);font-size:1.2rem">${esc(cls.title)}</b><div class="small muted">${esc(when.text)} · ${minutes(cls.durationMinutes)}</div></div>
      </div>
      <div style="margin-top:16px">
        <div class="line"><span>1 seat</span><span>${money(p.subtotal, cls.currency)}</span></div>
        ${p.applied ? `<div class="line" style="color:var(--leaf)"><span>${esc(p.applied.code)} (−${p.applied.percentOff}%)</span><span>−${money(p.discount, cls.currency)}</span></div>` : ''}
        <div class="line total"><span>Total today</span><span>${money(p.total, cls.currency)}</span></div>
      </div>
      <form class="row" data-code style="margin-top:10px;flex-wrap:nowrap">
        <label class="sr-only" for="code">Discount code</label>
        <input id="code" class="input" name="code" placeholder="Discount code" value="${esc(code)}" style="min-height:44px">
        <button class="btn btn-ghost btn-sm" type="submit">Apply</button>
      </form>
      ${cls.whatYouNeed ? `<p class="small" style="margin:16px 0 0"><b>What you’ll need:</b> ${esc(cls.whatYouNeed)}</p>` : ''}`;
  };
  return {
    title: `Book · ${cls.title}`,
    html: `
    <section class="section-tight">
      <div class="wrap checkout">
        <div>
          <a class="small muted" href="#/live" style="text-decoration:none">${icon('back', 14)} All live classes</a>
          <h1 style="font-size:clamp(1.9rem,4vw,2.8rem);margin-top:12px">Book your seat</h1>
          <p class="muted">${cls.format === 'in-person' ? 'Your ticket and the address arrive by email.' : 'Your ticket and join link appear in My Kitchen and arrive by email.'}</p>
          <form data-pay-form novalidate>
            <div class="field"><label for="email">Email</label>
              <input id="email" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@example.com" value="${esc(store.kitchen.account?.email || '')}">
              <small>Your ticket and sign-in link go here.</small></div>
            <div class="paybox">
              ${demo ? '<div class="test-banner"><b>Test mode.</b> No real payment is taken.</div>' : '<p class="small muted" style="margin-top:0">You’ll pay on Stripe’s secure page with card, Apple Pay or Google Pay.</p>'}
              <button class="btn btn-primary btn-lg btn-block" type="submit" data-pay>${icon('lock', 18)} ${demo ? 'Pay and book' : 'Continue to secure payment'}</button>
              <div class="trust"><span>${icon('lock', 14)} Secure payment by Stripe</span><span>${icon('check', 14)} Instant confirmation</span></div>
            </div>
            <p class="small" data-error role="alert" style="color:var(--fix);margin-top:12px"></p>
          </form>
        </div>
        <aside class="summary" data-summary>${summary()}</aside>
      </div>
    </section>`,
    mount(root) {
      const form = root.querySelector('[data-pay-form]');
      const err = root.querySelector('[data-error]');
      const offs = [
        on(root, 'submit', '[data-pay-form]', async (e) => {
          e.preventDefault();
          const email = form.email.value.trim();
          if (!EMAIL.test(email)) { err.textContent = 'Please enter your email so we can send your ticket.'; return; }
          const btn = root.querySelector('[data-pay]');
          btn.disabled = true;
          btn.textContent = demo ? 'Booking…' : 'Opening secure payment…';
          try {
            const result = await store.bookLiveClass(cls.id, email, code);
            if (result.url) { location.href = result.url; return; }
            location.hash = `#/live/${cls.id}/booked`;
          } catch (ex) {
            err.textContent = ex.message || 'Booking could not be started.';
            btn.disabled = false;
            btn.innerHTML = `${icon('lock', 18)} Try again`;
          }
        }),
        on(root, 'submit', '[data-code]', (e, f) => {
          e.preventDefault();
          const v = f.code.value.trim();
          if (v && !store.discount(v)) { toast('That code isn’t valid'); return; }
          code = v;
          root.querySelector('[data-summary]').innerHTML = summary();
        }),
      ];
      return () => offs.forEach((o) => o());
    },
  };
}

async function booked(cls, query) {
  if (query.session_id && config.dataSource === 'api') {
    try {
      const res = await apiFetch(`checkout/confirm?session_id=${encodeURIComponent(query.session_id)}`);
      const data = await res.json().catch(() => ({}));
      if (data.session) setSessionToken(data.session);
      await store.init();
    } catch { /* the emailed ticket still works */ }
  }
  const ticket = cls && store.ticket(cls.id);
  const recipe = cls && store.recipe(cls.recipeId);
  if (!cls || !ticket) {
    return { title: 'Booking', html: '<section class="section wrap narrow empty"><h2>We’re confirming your booking</h2><p>This takes a few seconds. Your ticket will also arrive by email.</p><a class="btn btn-primary" href="#/kitchen">Go to My Kitchen</a></section>' };
  }
  const when = classWhen(cls, { year: true });
  return {
    title: 'You’re booked',
    html: `
    <section class="section">
      <div class="wrap narrow" style="text-align:center">
        <span class="eyebrow">You’re booked</span>
        <h1>See you in the kitchen</h1>
        <p class="lede" style="margin:0 auto 24px"><b>${esc(cls.title)}</b><br>${esc(when.text)}</p>
        <div class="panel" style="text-align:left;max-width:520px;margin:0 auto 24px">
          ${cls.format === 'in-person'
            ? `<p style="margin:0"><b>Where:</b> ${esc(ticket.location || cls.location || config.brand.name)}</p>`
            : `<p style="margin:0"><b>How to join:</b> your ${esc(cls.platform || 'class')} link appears in My Kitchen 30 minutes before class.</p>`}
          ${cls.whatYouNeed ? `<p class="small" style="margin:12px 0 0"><b>What you’ll need:</b> ${esc(cls.whatYouNeed)}</p>` : ''}
        </div>
        <div class="stack" style="max-width:420px;margin:0 auto">
          <button class="btn btn-primary btn-lg btn-block" data-ics>${icon('clock', 18)} Add to my calendar</button>
          ${recipe ? `<a class="btn btn-ghost btn-block" href="#/recipes/${esc(recipe.slug)}">Get ready: ingredients &amp; shopping list</a>` : ''}
          <a class="btn btn-ghost btn-block" href="#/kitchen">Go to My Kitchen</a>
        </div>
      </div>
    </section>`,
    mount(root) {
      return on(root, 'click', '[data-ics]', () => downloadIcs(cls, ticket));
    },
  };
}

export default async function live(params, query, route) {
  const cls = params.id ? store.liveClass(params.id) : null;
  if (route.pattern === '/live/:id/book') return book(cls, query);
  if (route.pattern === '/live/:id/booked') return booked(cls, query);
  return list();
}
