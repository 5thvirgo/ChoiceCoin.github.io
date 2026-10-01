// Checkout: Choose course → Pay → Course immediately unlocks.
// payments = 'stripe': hand off to Stripe Checkout (cards, Apple Pay, Google Pay).
// payments = 'demo':   simulated payment, clearly labelled, same unlock path.

import { config } from '../config.js';
import { store } from '../services/store.js';
import { media } from '../components.js';
import { esc, icon, money, on, toast } from '../lib/dom.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function welcome(course, query) {
  // Returning from Stripe: confirm the session server-side, which also signs the buyer in.
  if (query.session_id && config.dataSource === 'api') {
    try {
      await fetch(`api/checkout/confirm?session_id=${encodeURIComponent(query.session_id)}`, { credentials: 'same-origin' });
      await store.init();
    } catch { /* webhook will still unlock; the page below offers My Kitchen */ }
  }
  const resume = query.resume && store.recipe(query.resume);
  const owned = store.owns(course.id);
  const step = resume ? store.progress(resume.id)?.step : null;
  return {
    title: 'Welcome to the kitchen',
    html: `
    <section class="section">
      <div class="wrap narrow" style="text-align:center">
        <span class="eyebrow">${owned ? 'Payment received' : 'Almost there'}</span>
        <h1>${owned ? 'Welcome to the Mcuire kitchen' : 'We’re confirming your payment'}</h1>
        <p class="lede" style="margin:0 auto 28px">${owned
          ? `<b>${esc(course.title)}</b> is unlocked and waiting in My Kitchen. ${config.payments === 'demo' ? '(Test mode: no email is sent.)' : `We’ve emailed your receipt and a sign-in link to <b>${esc(store.kitchen.account?.email || 'your inbox')}</b> so you can cook on any device.`}`
          : 'This usually takes a few seconds. Refresh this page, or use the sign-in link we’ve emailed you.'}</p>
        ${owned ? `
          <form class="panel" data-name style="text-align:left;max-width:480px;margin:0 auto 24px">
            <div class="field"><label for="nm">What should we call you?</label><input id="nm" name="name" autocomplete="name" placeholder="Your first name" value="${esc(store.kitchen.account?.name || '')}"><small>Used for your welcome message and your certificate. You can change it later.</small></div>
            <button class="btn btn-dark btn-sm" type="submit">Save</button>
          </form>` : ''}
        <div class="stack" style="max-width:420px;margin:0 auto">
          ${resume && owned ? `<a class="btn btn-primary btn-lg btn-block" href="#/cook/${esc(resume.slug)}">${icon('play', 18)} Continue cooking${step != null ? ` at step ${step + 1}` : ''}</a>` : ''}
          <a class="btn ${resume ? 'btn-ghost' : 'btn-primary btn-lg'} btn-block" href="#/kitchen">Go to My Kitchen</a>
        </div>
      </div>
    </section>`,
    mount(root) {
      return on(root, 'submit', '[data-name]', (e, form) => {
        e.preventDefault();
        store.setAccountName(form.name.value.trim());
        toast('Saved');
      });
    },
  };
}

export default async function checkout({ slug }, query, route) {
  const course = store.course(slug);
  if (!course) return { title: 'Not found', html: '<section class="section wrap empty"><h2>Course not found</h2></section>' };
  if (route.pattern === '/welcome/:slug') return welcome(course, query);
  if (store.owns(course.id)) {
    location.replace('#/kitchen');
    return null;
  }

  const demo = config.payments !== 'stripe';
  const hero = store.recipe(store.courseRecipeIds(course)[0])?.hero;
  let code = '';

  const summary = () => {
    const p = store.priceFor(course, code);
    return `
      <div class="row" style="flex-wrap:nowrap;align-items:flex-start">
        <div style="width:96px;flex:none">${media(hero, { ratio: 'square', compact: true })}</div>
        <div><b style="font-family:var(--display);font-size:1.2rem">${esc(course.title)}</b><div class="small muted">${esc(course.kind === 'flagship' ? course.subtitle : 'Mini course')} · ${store.courseRecipeIds(course).length} dishes · lifetime access</div></div>
      </div>
      <div style="margin-top:16px">
        <div class="line"><span>Course</span><span>${money(p.subtotal, course.currency)}</span></div>
        ${p.applied ? `<div class="line" style="color:var(--leaf)"><span>${esc(p.applied.code)} (−${p.applied.percentOff}%)</span><span>−${money(p.discount, course.currency)}</span></div>` : ''}
        <div class="line total"><span>Total today</span><span>${money(p.total, course.currency)}</span></div>
      </div>
      <form class="row" data-code style="margin-top:10px;flex-wrap:nowrap">
        <label class="sr-only" for="code">Discount code</label>
        <input id="code" class="input" name="code" placeholder="Discount code" value="${esc(code)}" autocapitalize="characters" style="min-height:44px">
        <button class="btn btn-ghost btn-sm" type="submit">Apply</button>
      </form>`;
  };

  const payButton = (label) => `<button class="btn btn-primary btn-lg btn-block" type="submit" data-pay>${icon('lock', 18)} ${label}</button>`;

  return {
    title: `Checkout · ${course.title}`,
    html: `
    <section class="section-tight">
      <div class="wrap checkout">
        <div>
          <a class="small muted" href="#/courses/${esc(course.slug)}" style="text-decoration:none">${icon('back', 14)} Back to course</a>
          <h1 style="font-size:clamp(1.9rem,4vw,2.8rem);margin-top:12px">Start cooking in a minute</h1>
          <p class="muted">No account to create. Pay, and the course unlocks straight away.</p>
          <form data-pay-form novalidate>
            <div class="field">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@example.com" value="${esc(store.kitchen.account?.email || '')}">
              <small>Your receipt and sign-in link go here. That’s your account.</small>
            </div>
            <div class="paybox">
              ${demo ? `<div class="test-banner"><b>Test mode.</b> No real payment is taken. Live payments run through Stripe when <code>payments: 'stripe'</code> is enabled.</div>
                <div class="wallets">
                  <button type="button" class="wallet" data-wallet="Apple Pay">Pay with Apple Pay</button>
                  <button type="button" class="wallet g" data-wallet="Google Pay">Pay with Google Pay</button>
                </div>
                <div class="or">or pay with card</div>
                <div class="field"><label for="cc">Card number</label><input id="cc" inputmode="numeric" autocomplete="cc-number" value="4242 4242 4242 4242"></div>
                <div class="grid-2"><div class="field"><label for="exp">Expiry</label><input id="exp" autocomplete="cc-exp" value="12 / 30"></div><div class="field"><label for="cvc">CVC</label><input id="cvc" inputmode="numeric" autocomplete="cc-csc" value="123"></div></div>
                ${payButton('Pay and unlock')}`
              : `<p class="small muted" style="margin-top:0">You’ll pay on Stripe’s secure page with card, Apple Pay or Google Pay, then come straight back to your kitchen.</p>
                ${payButton('Continue to secure payment')}`}
              <div class="trust"><span>${icon('lock', 14)} Secure payment by Stripe</span><span>${icon('check', 14)} Instant access</span></div>
            </div>
            <p class="small muted" data-error role="alert" style="color:var(--fix);margin-top:12px"></p>
          </form>
        </div>
        <aside class="summary" data-summary>${summary()}</aside>
      </div>
    </section>`,
    mount(root) {
      const err = root.querySelector('[data-error]');
      const form = root.querySelector('[data-pay-form]');

      async function pay(method) {
        const email = form.email.value.trim();
        if (!EMAIL.test(email)) {
          err.textContent = 'Please enter your email so we can send your receipt and sign-in link.';
          form.email.focus();
          return;
        }
        err.textContent = '';
        const btns = root.querySelectorAll('[data-pay], [data-wallet]');
        btns.forEach((b) => { b.disabled = true; });
        const payBtn = root.querySelector('[data-pay]');
        const label = payBtn.innerHTML;
        payBtn.textContent = demo ? `Processing ${method}…` : 'Opening secure payment…';
        try {
          if (demo) await new Promise((r) => setTimeout(r, 900));
          const result = await store.checkout(course.id, email, code, query.resume);
          if (result.url) {
            location.href = result.url; // Stripe Checkout
            return;
          }
          location.hash = `#/welcome/${course.slug}${query.resume ? `?resume=${encodeURIComponent(query.resume)}` : ''}`;
        } catch (e) {
          err.textContent = e.message || 'Payment could not be started. Please try again.';
          btns.forEach((b) => { b.disabled = false; });
          payBtn.innerHTML = label;
        }
      }

      const offs = [
        on(root, 'submit', '[data-pay-form]', (e) => { e.preventDefault(); pay('card'); }),
        on(root, 'click', '[data-wallet]', (_, b) => pay(b.dataset.wallet)),
        on(root, 'submit', '[data-code]', (e, f) => {
          e.preventDefault();
          const value = f.code.value.trim();
          if (value && !store.discount(value)) { toast('That code isn’t valid'); return; }
          code = value;
          root.querySelector('[data-summary]').innerHTML = summary();
          if (value) toast('Discount applied');
        }),
      ];
      return () => offs.forEach((off) => off());
    },
  };
}
