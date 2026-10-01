// Cook With Me: distraction-free, one-step-at-a-time cooking mode.
// Designed for a phone propped next to the stove: big type, big buttons,
// screen kept awake, timers that bring you back to the right step.

import { store } from '../services/store.js';
import * as timers from '../services/timers.js';
import { keepAwake, allowSleep, wakeLockSupported } from '../services/wakelock.js';
import { achievements, newlyEarned } from '../services/achievements.js';
import { TIP_KINDS } from '../data/seed.js';
import { media, seal, badge } from '../components.js';
import { esc, icon, clock, money, minutes, on } from '../lib/dom.js';
import { scaleIngredient } from '../lib/units.js';
import { servingsFor, servingsPicker, ingredientList, bindServings } from './recipe.js';

const CUE_ICONS = { see: ['eye', 'What you should see'], smell: ['nose', 'What you should smell'], hear: ['ear', 'What you should hear'], texture: ['hand', 'How it should feel'] };
const VERDICT_ICON = { good: 'check', wait: 'clock', fix: 'alert' };
const TIP_ICON = { makwaya: 'flame', chef: 'flame', kitchen: 'info', watch: 'alert', ready: 'check' };

export default async function cook({ slug }, query, route) {
  const isTry = route.pattern === '/try';
  const recipe = await store.fullRecipe(isTry ? store.freeRecipe.slug : slug);
  if (!recipe || recipe.status !== 'complete' || !recipe.steps.length) {
    location.replace(`#/recipes/${slug || ''}`);
    return null;
  }
  const total = recipe.steps.length;
  const saved = store.progress(recipe.id);

  const state = {
    stage: 'intro', // intro | step | gate | complete
    index: 0,
    servings: servingsFor(recipe),
    paused: false,
    drawer: false,
    earned: [],
  };
  if (query.step) {
    state.index = Math.max(0, Math.min(total - 1, Number(query.step) - 1));
    state.stage = 'step';
  } else if (saved?.active) {
    state.index = saved.step || 0;
    state.stage = 'step';
  }
  if (state.stage === 'step' && !store.canCookStep(recipe, state.index)) state.stage = 'gate';

  // ------------------------------------------------------------------ views
  const ingLine = (id) => {
    const ing = recipe.ingredients.find((i) => i.id === id);
    if (!ing) return '';
    const s = scaleIngredient(ing, recipe.baseServings, state.servings);
    return `<li><span>${esc(ing.name)}${ing.prep ? `, <span class="muted">${esc(ing.prep)}</span>` : ''}</span><b>${esc(s.text)}</b></li>`;
  };

  function timerCard(step) {
    if (!step.timer) return '';
    const t = timers.forStep(recipe.id, state.index);
    const mins = step.timer.minutes;
    if (!t) {
      return `<div class="timer-card" data-timer-card>
        <div><div class="label">${esc(step.timer.label)}</div><div class="big">${clock(mins * 60000)}</div></div>
        <button class="btn btn-gold btn-lg" data-action="timer-start">${icon('timer', 20)} Start ${mins}-minute timer</button>
      </div>`;
    }
    if (t.state === 'done') {
      return `<div class="timer-card done" data-timer-card>
        <div><div class="label" style="color:#e6f0e2">${esc(step.timer.label)}</div><div class="big">Time’s up</div></div>
        <div class="ctrls"><button class="btn btn-light" data-action="timer-more">+2 min</button><button class="btn btn-ghost" data-action="timer-clear">Clear</button></div>
      </div>`;
    }
    const running = t.state === 'running';
    return `<div class="timer-card" data-timer-card>
      <div><div class="label">${esc(step.timer.label)}${running ? '' : ' · paused'}</div><div class="big" data-countdown>${clock(timers.remaining(t))}</div></div>
      <div class="ctrls">
        <button class="btn btn-gold" data-action="${running ? 'timer-pause' : 'timer-resume'}" aria-label="${running ? 'Pause timer' : 'Resume timer'}">${icon(running ? 'pause' : 'play', 18)}</button>
        <button class="btn btn-ghost" data-action="timer-more">+1 min</button>
        <button class="btn btn-ghost" data-action="timer-clear" aria-label="Cancel timer">${icon('close', 18)}</button>
      </div>
    </div>`;
  }

  function checkpoint(step) {
    const cp = step.checkpoint;
    if (!cp) return '';
    const chosen = store.progress(recipe.id)?.checkpoints?.[step.id];
    const opt = cp.options.find((o) => o.id === chosen);
    return `<section class="checkpoint" aria-labelledby="cp-${esc(step.id)}">
      <h3 id="cp-${esc(step.id)}">${icon('eye', 22)} ${esc(cp.question)}</h3>
      <p class="muted small" style="margin:0">Tap the one that looks most like yours.</p>
      <div class="cp-options">
        ${cp.options.map((o) => `<button type="button" class="cp-option ${esc(o.verdict)}" data-cp="${esc(o.id)}" aria-pressed="${o.id === chosen}">
          ${media(o.media, { ratio: null, compact: true })}<span>${esc(o.label)}</span></button>`).join('')}
      </div>
      ${opt ? `<div class="cp-answer ${esc(opt.verdict)}" role="status">${icon(VERDICT_ICON[opt.verdict], 22)}<span>${esc(opt.guidance)}</span></div>` : ''}
    </section>`;
  }

  function stepView() {
    const step = recipe.steps[state.index];
    const last = state.index === total - 1;
    const cues = Object.entries(step.cues || {}).filter(([, v]) => v);
    const twoMedia = (step.media || []).length > 1;
    return `
      <div class="cook-scroll" data-scroll>
        <article class="cook-step" aria-live="polite">
          <span class="phase">${esc({ prep: 'Get ready', cook: 'Cooking', finish: 'Finishing' }[step.phase] || '')} · Step ${state.index + 1}</span>
          <h2>${esc(step.title)}</h2>
          ${(step.media || []).length ? `<div class="cook-media ${twoMedia ? 'two' : ''}">${step.media.map((m) => `<figure>${media(m, { ratio: null, compact: twoMedia })}${twoMedia ? `<figcaption>${esc(m.alt)}</figcaption>` : ''}</figure>`).join('')}</div>` : ''}
          <p class="body">${esc(step.body)}</p>
          ${step.about ? `<div class="about">${icon('clock', 18)} ${esc(step.about)}</div>` : ''}
          ${step.why ? `<p class="why"><b>Why this matters:</b> ${esc(step.why)}</p>` : ''}
          ${(step.ingredientIds || []).length ? `<div class="step-ings"><h4>You’ll need · for ${state.servings} people</h4><ul>${step.ingredientIds.map(ingLine).join('')}</ul></div>` : ''}
          ${timerCard(step)}
          ${cues.length ? `<div class="cues">${cues.map(([k, v]) => `<div class="cue"><span class="ico">${icon(CUE_ICONS[k][0], 20)}</span><div><b>${CUE_ICONS[k][1]}</b>${esc(v)}</div></div>`).join('')}</div>` : ''}
          ${(step.tips || []).map((t) => `<div class="tip ${esc(t.kind)}"><b>${icon(TIP_ICON[t.kind] || 'info', 16)} ${esc(TIP_KINDS[t.kind] || 'Tip')}</b><p>${esc(t.text)}</p></div>`).join('')}
          ${checkpoint(step)}
          ${(step.troubleshooting || []).length ? `<details class="trouble"><summary>${icon('alert', 18)} Something not right?</summary><dl>${step.troubleshooting.map((t) => `<dt>${esc(t.problem)}</dt><dd>${esc(t.fix)}</dd>`).join('')}</dl></details>` : ''}
        </article>
      </div>
      <div class="cook-bottom">
        <button class="btn btn-ghost back" data-action="prev" aria-label="Previous step" ${state.index === 0 ? 'disabled' : ''}>${icon('back', 24)}</button>
        <button class="btn btn-primary" data-action="next">${last ? `${icon('check', 22)} Finish cooking` : `Done, next step ${icon('next', 22)}`}</button>
      </div>`;
  }

  function introView() {
    return `
      <div class="cook-scroll"><div class="cook-step">
        ${media(recipe.hero, { ratio: 'wide', eager: true })}
        <span class="phase" style="display:block;margin-top:18px">${isTry ? 'Free lesson from the Makwaya kitchen' : 'Cook With Me'}</span>
        <h2>${esc(recipe.title)}</h2>
        <p class="body" style="font-size:1.1rem">${esc(recipe.story || recipe.subtitle)}</p>
        <div class="facts" style="grid-template-columns:repeat(3,1fr)">
          <div><b>${minutes(recipe.prepMinutes)}</b><span>Prep</span></div>
          <div><b>${minutes(recipe.cookMinutes)}</b><span>Cook</span></div>
          <div><b>${total}</b><span>Steps</span></div>
        </div>
        <h3>How many people are you cooking for?</h3>
        ${servingsPicker(recipe, state.servings)}
        ${!store.ownsRecipe(recipe.id) && recipe.previewSteps ? `<div class="notice">${icon('info', 18)}<span>The first ${recipe.previewSteps} steps are free. These are the real lesson, not a demo. You can unlock the rest at any point.</span></div>` : ''}
        <details class="trouble"><summary>${icon('list', 18)} Check your ingredients (${recipe.ingredients.length})</summary>${ingredientList(recipe, state.servings)}</details>
        <details class="trouble"><summary>${icon('info', 18)} Equipment (${recipe.equipment.length})</summary><ul class="equip">${recipe.equipment.map((e) => `<li><b>${esc(e.name)}</b>${e.note ? `<small>${esc(e.note)}</small>` : ''}</li>`).join('')}</ul></details>
        ${wakeLockSupported ? `<p class="small muted">${icon('sun', 14)} Your screen will stay on while you cook.</p>` : ''}
      </div></div>
      <div class="cook-bottom" style="grid-template-columns:1fr">
        <button class="btn btn-primary" data-action="begin">${icon('play', 22)} Start cooking</button>
      </div>`;
  }

  function gateView() {
    const flagship = store.flagship;
    const mini = store.coursesContaining(recipe.id).filter((c) => c.kind === 'mini').sort((a, b) => a.priceCents - b.priceCents)[0];
    const done = Math.min(state.index, recipe.previewSteps);
    return `
      <div class="cook-scroll"><div class="cook-step gate">
        <span class="phase">You’ve finished ${done} of ${total} steps</span>
        <h2>Ready to keep cooking?</h2>
        <p class="body" style="font-size:1.12rem">Your pot is waiting. Unlock the rest of this lesson and we’ll pick up exactly where you are: <b>step ${state.index + 1}, ${esc(recipe.steps[state.index].title.toLowerCase())}</b>.</p>
        <div class="progress gold" style="margin:18px 0 24px"><i style="width:${(done / total) * 100}%"></i></div>
        <div class="panel">
          <span class="eyebrow">Recommended</span>
          <h3>${esc(flagship.title)}: ${esc(flagship.subtitle)}</h3>
          <ul class="ticks small">
            <li>${icon('check', 16)} Finish this jollof, then over 40 more dishes</li>
            <li>${icon('check', 16)} Every course, every module, every future update</li>
            <li>${icon('check', 16)} Shopping lists, serving calculator, achievements</li>
            <li>${icon('check', 16)} Makwaya Certificate of Completion</li>
          </ul>
          <a class="btn btn-primary btn-lg btn-block" href="#/checkout/${esc(flagship.slug)}?resume=${esc(recipe.slug)}">Unlock everything · ${money(flagship.priceCents, flagship.currency)}</a>
        </div>
        ${mini ? `<div class="panel">
          <h3>Just ${esc(mini.title)}</h3>
          <p class="small muted">${esc(mini.blurb)}</p>
          <a class="btn btn-dark btn-block" href="#/checkout/${esc(mini.slug)}?resume=${esc(recipe.slug)}">Get ${esc(mini.title)} · ${money(mini.priceCents, mini.currency)}</a>
        </div>` : ''}
        <p class="small muted" style="text-align:center">Pay in seconds with card, Apple Pay or Google Pay. Your progress is saved.</p>
      </div></div>
      <div class="cook-bottom">
        <button class="btn btn-ghost back" data-action="prev" aria-label="Previous step">${icon('back', 24)}</button>
        <a class="btn btn-ghost" href="#/courses/${esc(flagship.slug)}">See everything in the course</a>
      </div>`;
  }

  function completeView() {
    const owned = store.ownsRecipe(recipe.id);
    const cert = store.certificateProgress();
    return `
      <div class="cook-scroll"><div class="complete">
        <div class="seal">${seal(120, 'done-seal')}</div>
        <span class="eyebrow">Well done, chef</span>
        <h2>You cooked ${esc(recipe.title)}</h2>
        <p class="lede" style="margin:0 auto">For ${state.servings} people. That’s a pot you can cook again, and now you know what every stage should look like.</p>
        ${state.earned.length ? `<div class="badge-row">${state.earned.map((a) => `<div class="ach">${badge(true)}<b>${esc(a.title)}</b><small>${esc(a.description)}</small></div>`).join('')}</div>` : ''}
        ${recipe.serveWith?.length ? `<p style="margin-top:24px"><b>Serve it with:</b> ${recipe.serveWith.map(esc).join(' · ')}</p>` : ''}
        ${owned && store.owns(store.flagship.id) ? `<div class="panel" style="text-align:left;margin-top:24px"><b>Certificate progress</b><div class="progress" style="margin:10px 0"><i style="width:${cert.ratio * 100}%"></i></div><span class="small muted">${cert.completed.length} of ${cert.required.length} dishes cooked</span></div>` : ''}
        <div class="stack" style="margin-top:24px">
          <a class="btn btn-primary btn-lg btn-block" href="#/kitchen">Go to My Kitchen</a>
          <a class="btn btn-ghost btn-block" href="#/courses">Choose your next dish</a>
        </div>
      </div></div>`;
  }

  function topBar() {
    const pct = state.stage === 'complete' ? 100 : ((state.index + (state.stage === 'step' ? 0 : 0)) / total) * 100;
    const label = state.stage === 'intro' ? 'Before you start' : state.stage === 'complete' ? 'Finished' : `Step ${state.index + 1} of ${total}`;
    return `<header class="cook-top">
      <div class="row">
        <button class="icon-btn" data-action="exit" aria-label="Leave Cook With Me (progress is saved)">${icon('close', 22)}</button>
        <div class="title"><b>${esc(recipe.title)}</b><span>${label}${state.stage === 'step' ? ` · ${state.servings} people` : ''}</span></div>
        ${state.stage === 'step' ? `
          <button class="icon-btn" data-action="drawer" aria-label="Ingredients and all steps">${icon('list', 22)}</button>
          <button class="icon-btn" data-action="pause" aria-label="Pause cooking">${icon('pause', 22)}</button>` : '<span style="width:48px"></span>'}
      </div>
      <div class="progress"><i style="width:${pct}%"></i></div>
    </header>`;
  }

  function pauseOverlay() {
    return `<div class="cook-overlay" role="dialog" aria-label="Paused">
      <div class="stack">
        ${icon('pause', 48)}
        <h2>Paused at step ${state.index + 1}</h2>
        <p>Your progress is saved and any timers for this recipe are paused. If you’ll be away for more than a few minutes, turn the heat down or off.</p>
        <button class="btn btn-gold btn-lg btn-block" data-action="resume">${icon('play', 20)} Resume cooking</button>
        <button class="btn btn-ghost btn-block" style="color:#fff;border-color:rgba(255,255,255,.3)" data-action="exit">Save and leave</button>
      </div>
    </div>`;
  }

  function drawer() {
    return `<div class="drawer" data-action="drawer-close"><div class="drawer-panel" data-stop>
      <div class="spread"><h3 style="margin:0">Ingredients</h3><button class="icon-btn" data-action="drawer-close" aria-label="Close">${icon('close', 20)}</button></div>
      <p class="small muted">Cooking for</p>
      ${servingsPicker(recipe, state.servings)}
      ${ingredientList(recipe, state.servings)}
      <h3 style="margin-top:28px">All steps</h3>
      <ol class="mini-list" style="padding:0">
        ${recipe.steps.map((s, i) => {
          const locked = !store.canCookStep(recipe, i);
          return `<li><span class="chip ${i === state.index ? 'gold' : ''}">${i + 1}</span><div class="grow" style="flex:1">${locked ? `<span class="muted">${esc(s.title)}</span>` : `<button class="link" style="text-decoration:none;color:var(--ink);text-align:left" data-goto="${i}">${esc(s.title)}</button>`}</div>${locked ? icon('lock', 16) : s.timer ? icon('timer', 16) : ''}</li>`;
        }).join('')}
      </ol>
    </div></div>`;
  }

  // ---------------------------------------------------------------- render
  let root;
  function render() {
    const body = { intro: introView, step: stepView, gate: gateView, complete: completeView }[state.stage]();
    root.querySelector('.cook').innerHTML = topBar() + body + (state.paused ? pauseOverlay() : '') + (state.drawer ? drawer() : '');
    root.querySelector('[data-scroll], .cook-scroll')?.scrollTo(0, 0);
  }

  function saveStep() {
    store.setProgress(recipe.id, { step: state.index, servings: state.servings, active: true });
  }

  function go(index) {
    state.index = Math.max(0, Math.min(total - 1, index));
    state.stage = store.canCookStep(recipe, state.index) ? 'step' : 'gate';
    saveStep();
    history.replaceState(null, '', `#/${isTry ? 'try' : `cook/${recipe.slug}`}?step=${state.index + 1}`);
    render();
    root.querySelector('.cook-step h2')?.focus?.({ preventScroll: true });
  }

  function finish() {
    const before = achievements().filter((a) => a.earned).map((a) => a.id);
    store.completeRecipe(recipe.id, state.servings);
    state.earned = newlyEarned(before);
    state.stage = 'complete';
    timers.list().filter((t) => t.recipeId === recipe.id).forEach((t) => timers.dismiss(t.id));
    render();
  }

  function updateCountdown() {
    if (state.stage !== 'step') return;
    const step = recipe.steps[state.index];
    if (!step.timer) return;
    const t = timers.forStep(recipe.id, state.index);
    const el = root.querySelector('[data-countdown]');
    const card = root.querySelector('[data-timer-card]');
    // Cheap path: just update the digits; full card re-render on state change.
    if (el && t?.state === 'running') el.textContent = clock(timers.remaining(t));
    else if (card) card.outerHTML = timerCard(step);
  }

  return {
    title: `Cook With Me · ${recipe.title}`,
    html: '<div class="cook" role="application" aria-label="Cook With Me"></div>',
    mount(el) {
      root = el;
      document.body.classList.add('cooking');
      keepAwake();
      render();

      let lastTimerState = '';
      const offTimers = timers.subscribe(() => {
        const t = state.stage === 'step' ? timers.forStep(recipe.id, state.index) : null;
        const sig = t ? `${t.id}:${t.state}` : '';
        if (sig !== lastTimerState) {
          lastTimerState = sig;
          const step = recipe.steps[state.index];
          const card = root.querySelector('[data-timer-card]');
          if (card && step?.timer) card.outerHTML = timerCard(step);
        } else updateCountdown();
      });

      const actions = {
        begin: () => { saveStep(); go(state.index); },
        next: () => (state.index === total - 1 ? finish() : go(state.index + 1)),
        prev: () => go(state.stage === 'gate' ? state.index - 1 : state.index - 1),
        exit: () => {
          if (state.stage === 'step') saveStep();
          if (state.paused) timers.resumeRecipe(recipe.id);
          location.hash = isTry ? `#/recipes/${recipe.slug}` : `#/recipes/${recipe.slug}`;
        },
        pause: () => { state.paused = true; timers.pauseRecipe(recipe.id); saveStep(); render(); },
        resume: () => { state.paused = false; timers.resumeRecipe(recipe.id); render(); },
        drawer: () => { state.drawer = true; render(); },
        'drawer-close': (e) => { if (e.target.closest('[data-stop]') && !e.target.closest('[data-action=drawer-close]')) return; state.drawer = false; render(); },
        'timer-start': () => {
          const step = recipe.steps[state.index];
          timers.start({ recipeId: recipe.id, recipeSlug: isTry ? recipe.slug : recipe.slug, stepIndex: state.index, label: step.timer.label, minutes: step.timer.minutes });
        },
        'timer-pause': () => timers.pause(timers.forStep(recipe.id, state.index).id),
        'timer-resume': () => timers.resume(timers.forStep(recipe.id, state.index).id),
        'timer-more': () => { const t = timers.forStep(recipe.id, state.index); timers.addMinutes(t.id, t.state === 'done' ? 2 : 1); },
        'timer-clear': () => timers.dismiss(timers.forStep(recipe.id, state.index).id),
      };

      const offs = [
        on(el, 'click', '[data-action]', (e, b) => {
          const fn = actions[b.dataset.action];
          if (fn) fn(e);
        }),
        on(el, 'click', '[data-cp]', (_, b) => {
          store.setCheckpoint(recipe.id, recipe.steps[state.index].id, b.dataset.cp);
          const cpEl = b.closest('.checkpoint');
          cpEl.outerHTML = checkpoint(recipe.steps[state.index]);
          el.querySelector('.cp-answer')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }),
        on(el, 'click', '[data-goto]', (_, b) => { state.drawer = false; go(Number(b.dataset.goto)); }),
        bindServings(el, recipe, (n) => { state.servings = n; render(); }),
      ];

      const onKey = (e) => {
        if (state.stage !== 'step' || state.paused || state.drawer || e.target.matches('input, textarea, select')) return;
        if (e.key === 'ArrowRight') actions.next();
        if (e.key === 'ArrowLeft' && state.index > 0) actions.prev();
      };
      document.addEventListener('keydown', onKey);

      return () => {
        offTimers();
        offs.forEach((off) => off());
        document.removeEventListener('keydown', onKey);
        allowSleep();
        document.body.classList.remove('cooking');
      };
    },
  };
}
