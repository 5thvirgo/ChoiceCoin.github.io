// Live cooking classes: schedule, booking, confirmation.
// Routes: #/live, #/live/:id/book, #/live/:id/booked

import { config } from '../config.js';
import { store, apiFetch, setSessionToken } from '../services/store.js';
import { media } from '../components.js';
import { esc, icon, money, minutes, on, toast } from '../lib/dom.js';
import { slotDates, slotId, slotProblem, taxOn, formatTime, formatDate, sessionType, activeTypes, hourlyRate } from '../lib/slots.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function classWhen(cls, opts = {}) {
  // Always in restaurant time (Toronto), wherever the visitor is.
  const d = new Date(cls.startsAt);
  const timeZone = store.liveBooking.timeZone;
  const date = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone, ...(opts.year ? { year: 'numeric' } : {}) });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone, timeZoneName: 'short' });
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

// Book any open Saturday or Sunday, by the hour, coached online.
function weekendPanel(st) {
  const s = store.liveBooking;
  const types = activeTypes(s);
  const type = sessionType(s, st.type) || types[0];
  const dates = slotDates(s);
  const usage = store.slotUsage || {};
  const slot = { date: st.date || dates[0], time: st.time, hours: st.hours, people: st.people, type: type.id };
  const sub = hourlyRate(type, slot.people) * slot.hours;
  const tax = taxOn(s, sub);
  const problem = slot.time ? slotProblem(s, slot, usage) : '';
  const perHour = (t) => `${money(t.pricePerHourCents, s.currency)}/h${t.extraPersonCents ? ` + ${money(t.extraPersonCents, s.currency)}/h per extra cook` : ''}`;
  const minH = Math.max(s.minHours, type.minHours || 1);
  return `<div class="panel weekend" data-weekend>
    <div class="spread" style="align-items:flex-start"><div>
      <span class="eyebrow">Saturdays &amp; Sundays · live by video call</span>
      <h2 style="margin:4px 0 6px">Book a live online class</h2>
      <p class="muted" style="margin:0;max-width:46em">${esc(s.description)}</p></div>
      <span class="chip gold" style="white-space:nowrap">From ${money(Math.min(...types.map((t) => t.pricePerHourCents)), s.currency)} per hour + ${esc(s.taxLabel)}</span></div>

    <h3 class="wk-label">1. What kind of class?</h3>
    <div class="wk-types" role="radiogroup" aria-label="Kind of class">${types.map((t) => `<button type="button" role="radio" aria-checked="${t.id === type.id}" class="wk-type ${t.id === type.id ? 'is-on' : ''}" data-wk-type="${esc(t.id)}">
      <b>${esc(t.name)}</b><span class="small muted">${esc(t.short)}</span><span class="wk-type-price">${esc(perHour(t))}</span></button>`).join('')}</div>
    <p class="small muted" style="margin:10px 0 0">${esc(type.blurb)}</p>

    <h3 class="wk-label">2. Choose a day</h3>
    <div class="chips-scroll" role="group" aria-label="Dates">${dates.map((d) => `<button type="button" class="chip-btn ${d === slot.date ? 'is-on' : ''}" data-wk-date="${d}">${esc(formatDate(d))}</button>`).join('')}</div>

    <h3 class="wk-label">3. How long${type.maxPeople > 1 ? ', and how many cooks' : ''}?</h3>
    <div class="row" style="gap:20px">
      <div class="stepper"><span>Hours</span><button type="button" data-wk-step="hours" data-d="-1" aria-label="Fewer hours" ${slot.hours <= minH ? 'disabled' : ''}>−</button><b>${slot.hours}</b><button type="button" data-wk-step="hours" data-d="1" aria-label="More hours" ${slot.hours >= s.maxHours ? 'disabled' : ''}>+</button></div>
      ${type.maxPeople > 1 ? `<div class="stepper"><span>Cooks</span><button type="button" data-wk-step="people" data-d="-1" aria-label="Fewer cooks" ${slot.people <= type.minPeople ? 'disabled' : ''}>−</button><b>${slot.people}</b><button type="button" data-wk-step="people" data-d="1" aria-label="More cooks" ${slot.people >= type.maxPeople ? 'disabled' : ''}>+</button></div>` : ''}
    </div>
    ${type.minHours > 1 ? `<p class="small muted" style="margin:8px 0 0">${esc(type.name)} needs at least ${type.minHours} hours.</p>` : ''}

    <h3 class="wk-label">4. Pick a start time <span class="small muted" style="font-weight:400">(Toronto time)</span></h3>
    <div class="row" role="group" aria-label="Start times">${s.times.map((t) => {
      const why = slotProblem(s, { ...slot, time: t }, usage);
      return `<button type="button" class="chip-btn ${t === slot.time ? 'is-on' : ''}" data-wk-time="${t}" ${why ? 'disabled' : ''} title="${esc(why || 'Available')}">${esc(formatTime(t))}</button>`;
    }).join('')}</div>

    <div class="wk-total">
      <div class="small muted">${esc(type.name)} · ${slot.hours} h × ${money(hourlyRate(type, slot.people), s.currency)}/h${type.maxPeople > 1 ? ` (${slot.people} ${slot.people > 1 ? 'cooks' : 'cook'})` : ''}</div>
      <div class="line"><span>Class</span><span>${money(sub, s.currency)}</span></div>
      <div class="line"><span>${esc(s.taxLabel)} (${Math.round(s.taxRate * 100)}%)</span><span>${money(tax, s.currency)}</span></div>
      <div class="line total"><span>Total</span><span>${money(sub + tax, s.currency)}</span></div>
      ${problem ? `<p class="small" style="color:var(--fix)">${esc(problem)}</p>` : ''}
      <button type="button" class="btn btn-primary btn-lg btn-block" data-wk-book ${!slot.time || problem ? 'disabled' : ''}>${slot.time ? `Book ${esc(formatDate(slot.date))} at ${esc(formatTime(slot.time))}` : 'Pick a start time'}</button>
      <p class="small muted" style="margin:8px 0 0">${icon('video', 14)} On ${esc((s.platforms || []).slice(0, 3).join(', '))} or your favourite video app. Pay securely by card, Apple Pay or Google Pay.</p>
    </div>
  </div>`;
}

// Keep hours and cooks inside what the chosen kind of class allows.
function fitToType(st) {
  const s = store.liveBooking;
  const type = sessionType(s, st.type) || activeTypes(s)[0];
  st.type = type.id;
  st.people = Math.min(type.maxPeople, Math.max(type.minPeople, st.people));
  st.hours = Math.min(s.maxHours, Math.max(Math.max(s.minHours, type.minHours || 1), st.hours));
  return st;
}

async function list() {
  const classes = store.liveClasses;
  const s = store.liveBooking;
  if (s.enabled) await store.loadSlotUsage();
  const st = fitToType({ type: activeTypes(s)[0]?.id, date: '', time: '', hours: 1, people: 1 });
  return {
    title: 'Live online cooking classes',
    html: `
    <section class="section-tight">
      <div class="wrap">
        <span class="eyebrow">Live with the ${esc(config.brand.short)} kitchen</span>
        <h1>Live online cooking classes</h1>
        <p class="lede">Cook in your own kitchen while a Mcuire chef coaches you live by video call (Zoom, Microsoft Teams, Google Meet or your favourite app), every Saturday and Sunday. Casual home cooking, cooking for an event, cooking as a group, or simply a chef to help you as you cook.</p>
        <p class="muted" style="margin:0">Prefer your own pace? <a class="link" href="#/courses">Buy any course</a> and cook whenever you like with step-by-step lessons.</p>
      </div>
    </section>
    <section class="section-tight" style="padding-top:0">
      <div class="wrap">
        ${s.enabled ? `<div data-weekend-host>${weekendPanel(st)}</div>` : ''}
        ${classes.length ? `<h2 style="margin-top:40px">Special classes</h2>${classes.map(classCard).join('')}` : s.enabled ? '' : `<div class="empty"><h3>No classes scheduled right now</h3><p>New dates are announced here. In the meantime, every dish is available as a step-by-step Cook With Me lesson.</p><a class="btn btn-primary" href="#/courses">Browse lessons</a></div>`}
      </div>
    </section>`,
    mount(root) {
      const host = root.querySelector('[data-weekend-host]');
      if (!host) return null;
      const redraw = () => { host.innerHTML = weekendPanel(st); };
      const offs = [
        on(host, 'click', '[data-wk-type]', (_, b) => { st.type = b.dataset.wkType; st.time = ''; fitToType(st); redraw(); }),
        on(host, 'click', '[data-wk-date]', (_, b) => { st.date = b.dataset.wkDate; st.time = ''; redraw(); }),
        on(host, 'click', '[data-wk-time]', (_, b) => { st.time = b.dataset.wkTime; redraw(); }),
        on(host, 'click', '[data-wk-step]', (_, b) => {
          const k = b.dataset.wkStep;
          st[k] += Number(b.dataset.d);
          fitToType(st);
          redraw();
        }),
        on(host, 'click', '[data-wk-book]', () => {
          const date = st.date || slotDates(s)[0];
          location.hash = `#/live/${slotId({ date, time: st.time, hours: st.hours, people: st.people, type: st.type })}/book`;
        }),
      ];
      return () => offs.forEach((o) => o());
    },
  };
}

function book(cls, query) {
  if (!cls || cls.status !== 'published') {
    return { title: 'Class not found', html: '<section class="section wrap empty"><h2>That class isn’t available</h2><a class="btn btn-primary" href="#/live">See live classes</a></section>' };
  }
  const recipe = store.recipe(cls.recipeId);
  const demo = config.payments !== 'stripe';
  const isSlot = cls.kind === 'slot';
  const what = isSlot ? `${cls.typeName} · ${cls.slot.hours} h${cls.capacity > 1 ? ` · ${cls.slot.people} ${cls.slot.people > 1 ? 'cooks' : 'cook'}` : ''}` : '1 seat';
  const platforms = store.liveBooking.platforms || ['Zoom', 'Microsoft Teams', 'Google Meet'];
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
        <div class="line"><span>${esc(what)}</span><span>${money(p.subtotal, cls.currency)}</span></div>
        ${p.applied ? `<div class="line" style="color:var(--leaf)"><span>${esc(p.applied.code)} (−${p.applied.percentOff}%)</span><span>−${money(p.discount, cls.currency)}</span></div>` : ''}
        ${p.tax ? `<div class="line"><span>${esc(cls.taxLabel || 'Tax')} (${Math.round(cls.taxRate * 100)}%)</span><span>${money(p.tax, cls.currency)}</span></div>` : ''}
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
          <h1 style="font-size:clamp(1.9rem,4vw,2.8rem);margin-top:12px">${isSlot ? 'Book your class' : 'Book your seat'}</h1>
          <p class="muted">${isSlot ? `${esc(cls.typeName)}, ${cls.slot.hours} ${cls.slot.hours > 1 ? 'hours' : 'hour'}, live by video call from your kitchen. Your confirmation arrives by email; we send the ingredient list and your call link before the class.` : cls.format === 'in-person' ? 'Your ticket and the address arrive by email.' : 'Your ticket and join link appear in My Kitchen and arrive by email.'}</p>
          <form data-pay-form novalidate>
            <div class="field"><label for="email">Email</label>
              <input id="email" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@example.com" value="${esc(store.kitchen.account?.email || '')}">
              <small>Your ticket and sign-in link go here.</small></div>
            ${isSlot ? `<div class="field"><label for="dish">What would you like to cook?</label>
              <textarea id="dish" name="dish" rows="3" maxlength="400" placeholder="${cls.slot.type === 'event' ? 'e.g. Jollof rice and chicken for 30 guests at a birthday party' : cls.slot.type === 'help' ? 'e.g. My egusi soup keeps turning out bitter' : 'e.g. Egusi soup and pounded yam'}"></textarea>
              <small>So the chef can prepare and send you the ingredient list.</small></div>
            <div class="field"><label for="videoapp">Video app you prefer</label>
              <select id="videoapp" name="videoapp">${platforms.map((p) => `<option>${esc(p)}</option>`).join('')}<option>Any is fine</option></select></div>` : ''}
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
            const note = isSlot ? [form.dish?.value.trim() && `Cook: ${form.dish.value.trim()}`, form.videoapp && `App: ${form.videoapp.value}`].filter(Boolean).join(' · ') : '';
            const result = await store.bookLiveClass(cls.id, email, code, note);
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
        <h1>${cls.kind === 'slot' ? 'See you on the call' : 'See you in the kitchen'}</h1>
        <p class="lede" style="margin:0 auto 24px"><b>${esc(cls.title)}</b><br>${esc(when.text)}</p>
        <div class="panel" style="text-align:left;max-width:520px;margin:0 auto 24px">
          ${cls.format === 'in-person'
            ? `<p style="margin:0"><b>Where:</b> ${esc(ticket.location || cls.location || config.brand.name)}</p>`
            : cls.kind === 'slot' ? '<p style="margin:0"><b>How to join:</b> we email you the video call link and the ingredient list before the class. Have your phone, tablet or laptop set up in the kitchen.</p>'
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
  if (route.pattern === '/live/:id/book') {
    if (cls?.kind === 'slot') {
      await store.loadSlotUsage();
      const problem = slotProblem(store.liveBooking, cls.slot, store.slotUsage);
      if (problem) return { title: 'Choose another time', html: `<section class="section wrap narrow empty"><h2>That time isn’t available</h2><p>${esc(problem)}</p><a class="btn btn-primary" href="#/live">Choose another time</a></section>` };
    }
    return book(cls, query);
  }
  if (route.pattern === '/live/:id/booked') return booked(cls, query);
  return list();
}
