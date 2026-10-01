// Mcuire Kitchen: app shell + hash router.
import { config } from './config.js';
import { store } from './services/store.js';
import * as timers from './services/timers.js';
import { brandMark } from './components.js';
import { esc, icon, clock } from './lib/dom.js';

const routes = [
  ['/', 'landing'],
  ['/courses', 'catalogue'],
  ['/courses/:slug', 'course'],
  ['/recipes/:slug', 'recipe'],
  ['/try', 'cook'],
  ['/cook/:slug', 'cook'],
  ['/checkout/:slug', 'checkout'],
  ['/welcome/:slug', 'checkout'],
  ['/kitchen', 'kitchen'],
  ['/kitchen/shopping', 'shopping'],
  ['/kitchen/certificate', 'certificate'],
  ['/verify/:number', 'certificate'],
  ['/admin', 'admin'],
  ['/admin/:section', 'admin'],
  ['/admin/:section/:id', 'admin'],
].map(([pattern, view]) => {
  const keys = [];
  const rx = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}/?$`);
  return { pattern, view, keys, rx };
});

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  return { path, query: Object.fromEntries(new URLSearchParams(qs)) };
}

function match(path) {
  for (const r of routes) {
    const m = r.rx.exec(path);
    if (m) {
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      return { ...r, params };
    }
  }
  return null;
}

const app = document.getElementById('app');
let cleanup = null;

function shell() {
  app.innerHTML = `
    <header class="site-header">
      <div class="wrap bar">
        <a class="brand" href="#/">${brandMark()}<span><span class="brand-name">${esc(config.brand.short)}</span><span class="brand-sub">Cooking Courses</span></span></a>
        <nav class="nav" aria-label="Main">
          <a href="#/courses" data-nav="/courses">Courses</a>
          <a href="#/try" class="hide-sm" data-nav="/try">Free lesson</a>
          <a href="#/kitchen" data-nav="/kitchen">My Kitchen</a>
        </nav>
      </div>
      <div class="band thin"></div>
    </header>
    <main id="view"></main>
    <footer class="site-footer">
      <div class="wrap">
        <div class="cols">
          <div>
            <div class="row" style="margin-bottom:12px">${brandMark(36)}<b style="color:#fff;font-family:var(--display);font-size:1.2rem">${esc(config.brand.name)}</b></div>
            <p>${esc(config.brand.tagline)} Taught by the Mcuire kitchen, one step at a time.</p>
          </div>
          <div><h4>Learn</h4><ul><li><a href="#/courses">All courses</a></li><li><a href="#/try">Free jollof lesson</a></li><li><a href="#/kitchen">My Kitchen</a></li></ul></div>
          <div><h4>Mcuire</h4><ul><li><a href="#/kitchen/certificate">Certificates</a></li><li><a href="#/admin">Staff</a></li></ul></div>
        </div>
        <p class="small" style="margin-top:28px">© ${new Date().getFullYear()} ${esc(config.brand.name)}. Mcuire Certificates of Completion recognise completion of Mcuire’s guided programme. They are not an accredited culinary qualification.</p>
      </div>
    </footer>
    <div class="timer-dock" id="timer-dock" aria-live="polite"></div>
    <div id="alarm-host"></div>`;
}

async function render() {
  const { path, query } = parseHash();
  const route = match(path);
  const view = document.getElementById('view');
  cleanup?.();
  cleanup = null;
  document.body.classList.remove('cooking');

  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.classList.toggle('active', path === a.dataset.nav || path.startsWith(`${a.dataset.nav}/`));
  });

  if (!route) {
    view.innerHTML = `<section class="section wrap narrow empty"><h2>We couldn’t find that page</h2><p><a class="btn btn-primary" href="#/courses">Browse cooking courses</a></p></section>`;
    return;
  }
  try {
    const mod = await import(`./views/${route.view}.js`);
    const result = await mod.default({ ...route.params }, query, route);
    if (!result) return; // view redirected
    document.title = result.title ? `${result.title} · ${config.brand.short} Kitchen` : `Cooking Courses · ${config.brand.name}`;
    view.innerHTML = result.html;
    if (!result.keepScroll) window.scrollTo(0, 0);
    cleanup = result.mount?.(view) || null;
    // Move focus to the page heading for screen-reader users on navigation.
    const h = view.querySelector('h1, h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  } catch (err) {
    console.error(err);
    view.innerHTML = `<section class="section wrap narrow empty"><h2>Something went wrong</h2><p>${esc(err.message)}</p><p><a class="btn btn-primary" href="#/">Back to Mcuire Kitchen</a></p></section>`;
  }
}

// ---- Global timers: dock + "time's up" alert ---------------------------
function renderDock() {
  const dock = document.getElementById('timer-dock');
  if (!dock) return;
  const active = timers.list().filter((t) => t.state !== 'dismissed');
  document.body.classList.toggle('has-timers', active.length > 0);
  dock.innerHTML = active.map((t) => `
    <a class="timer-pill ${t.state === 'done' ? 'done' : ''}" href="#/cook/${esc(t.recipeSlug)}?step=${t.stepIndex + 1}">
      ${icon(t.state === 'paused' ? 'pause' : 'timer', 18)}
      <span><b>${t.state === 'done' ? 'Done' : clock(timers.remaining(t))}</b><br><small>${esc(t.label)}</small></span>
    </a>`).join('');
}

function showAlarm(timer) {
  const host = document.getElementById('alarm-host');
  const recipe = store.recipe(timer.recipeId);
  host.innerHTML = `
    <div class="alarm" role="alertdialog" aria-labelledby="alarm-title">
      <div class="stack">
        <div class="ring">${icon('timer', 44)}</div>
        <h2 id="alarm-title">Time’s up</h2>
        <p style="font-size:1.2rem">${esc(timer.label)}${recipe ? ` · ${esc(recipe.title)}` : ''}</p>
        <p>Check your pot against step ${timer.stepIndex + 1}.</p>
        <a class="btn btn-light btn-lg btn-block" data-alarm="go" href="#/cook/${esc(timer.recipeSlug)}?step=${timer.stepIndex + 1}">Go to step ${timer.stepIndex + 1}</a>
        <div class="row" style="justify-content:center">
          <button class="btn btn-ghost" style="color:#fff;border-color:rgba(255,255,255,.4)" data-alarm="more">+2 minutes</button>
          <button class="btn btn-ghost" style="color:#fff;border-color:rgba(255,255,255,.4)" data-alarm="ok">Stop alarm</button>
        </div>
      </div>
    </div>`;
  const close = () => { host.innerHTML = ''; timers.silence(); };
  host.querySelector('[data-alarm=go]').addEventListener('click', () => { timers.dismiss(timer.id); close(); });
  host.querySelector('[data-alarm=more]').addEventListener('click', () => { timers.addMinutes(timer.id, 2); close(); });
  host.querySelector('[data-alarm=ok]').addEventListener('click', () => { close(); });
  host.querySelector('[data-alarm=go]').focus();
}

timers.subscribe((_, event) => {
  renderDock();
  if (event?.type === 'finished') showAlarm(event.timer);
  if (event?.type === 'dismissed' || event?.type === 'changed') {
    if (!timers.list().some((t) => t.state === 'done')) document.getElementById('alarm-host').innerHTML = '';
  }
});

// Expose for views that need to re-render the router (e.g. after purchase).
export function navigate(hash) {
  if (location.hash === hash) render(); else location.hash = hash;
}

(async function boot() {
  await store.init();
  shell();
  window.addEventListener('hashchange', render);
  await render();
  renderDock();
})();
