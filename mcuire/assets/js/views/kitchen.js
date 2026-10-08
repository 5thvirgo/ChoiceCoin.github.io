import { store } from '../services/store.js';
import { achievements, challenges } from '../services/achievements.js';
import { media, ring, badge, signInForm, bindSignIn } from '../components.js';
import { esc, icon, formatDate, on, toast } from '../lib/dom.js';
import { classWhen, joinWindow, downloadIcs } from './live.js';

function miniRow(recipe, right = '') {
  return `<li>${media(recipe.hero, { compact: true, ratio: null })}<div style="flex:1;min-width:0"><a href="#/recipes/${esc(recipe.slug)}">${esc(recipe.title)}</a><div class="small muted">${esc(recipe.region || '')}</div></div>${right}</li>`;
}

export default function kitchen() {
  const k = store.kitchen;
  const name = k.account?.name;
  const owned = store.ownedCourses;
  const flagship = store.flagship;
  const current = store.inProgress()[0];
  const completedIds = store.completedRecipeIds();
  const saved = k.saved.map((id) => store.recipe(id)).filter(Boolean);
  const recent = k.recent.map((id) => store.recipe(id)).filter(Boolean).slice(0, 5);
  const achs = achievements();
  const chals = challenges();
  const cert = store.certificateProgress();
  const ownsFlagship = store.owns(flagship.id);
  const shopCount = k.shopping.selections.length;

  // "Current module": first module of the best owned course with an unfinished, ready lesson.
  const mainCourse = owned.find((c) => c.kind === 'flagship') || owned[0];
  let currentModule = null;
  if (mainCourse) {
    currentModule = mainCourse.modules.find((m) => m.recipeIds.some((id) => !completedIds.includes(id))) || mainCourse.modules.at(-1);
  }

  const continueCard = current ? `
    <a class="continue" href="#/cook/${esc(current.recipe.slug)}">
      ${media(current.recipe.hero, { compact: true, ratio: null })}
      <div>
        <span class="eyebrow" style="margin-bottom:6px">Continue cooking</span>
        <b>${esc(current.recipe.title)}</b>
        <span style="color:#cdbfae">Step ${current.progress.step + 1} of ${current.recipe.steps.length} · ${esc(current.recipe.steps[current.progress.step]?.title || '')}</span>
        <div class="progress gold" style="margin:12px 0"><i style="width:${((current.progress.step) / current.recipe.steps.length) * 100}%"></i></div>
        <span class="btn btn-gold">${icon('play', 18)} Pick up where you left off</span>
      </div>
    </a>` : `
    <a class="continue" href="#/${owned.length ? `cook/${esc(store.freeRecipe.slug)}` : 'try'}">
      ${media(store.freeRecipe.hero, { compact: true, ratio: null })}
      <div>
        <span class="eyebrow" style="margin-bottom:6px">${owned.length ? 'Start here' : 'Free lesson'}</span>
        <b>${esc(store.freeRecipe.title)}</b>
        <span style="color:#cdbfae">Our favourite first lesson. Most people finish it in under two hours.</span><br>
        <span class="btn btn-gold" style="margin-top:12px">${icon('play', 18)} Start cooking</span>
      </div>
    </a>`;

  return {
    title: 'My Kitchen',
    html: `
    <section class="kitchen-hero">
      <div class="wrap">
        <span class="eyebrow">My Kitchen</span>
        <h1>${name ? `Welcome back, ${esc(name)}` : k.account ? 'Welcome back' : 'Your kitchen'}</h1>
        ${!owned.length ? '<p class="lede" style="color:#cdbfae">You haven’t picked a course yet. Start with the free jollof lesson, then choose what you want to cook next.</p>' : ''}
        ${!k.account && store.canSignIn ? `<div style="margin-top:18px;color:var(--ink)">${signInForm()}</div>` : ''}
        ${continueCard}
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap k-grid">
        <div>
          ${owned.length ? `
          <div class="k-block">
            <h2>My courses</h2>
            <ul class="mini-list">
              ${owned.filter((c) => c.kind === 'flagship' || !ownsFlagship).map((c) => {
                const ids = store.courseRecipeIds(c);
                const done = ids.filter((id) => completedIds.includes(id)).length;
                return `<li>${ring(ids.length ? done / ids.length : 0, 56, 6)}<div style="flex:1"><a href="#/courses/${esc(c.slug)}">${esc(c.title)}</a><div class="small muted">${done} of ${ids.length} dishes cooked</div></div></li>`;
              }).join('')}
            </ul>
            ${ownsFlagship ? '<p class="small muted" style="margin-top:8px">Your programme includes every mini course.</p>' : ''}
          </div>` : `
          <div class="k-block">
            <h2>Choose your first course</h2>
            <p class="muted">Pick the whole programme or start with one category.</p>
            <a class="btn btn-primary" href="#/courses">Explore courses</a>
          </div>`}

          ${currentModule ? `
          <div class="k-block">
            <span class="eyebrow">Current module</span>
            <h3 style="font-size:1.6rem">${esc(currentModule.title)}</h3>
            <ul class="mini-list">${currentModule.recipeIds.slice(0, 6).map((id) => store.recipe(id)).filter(Boolean).map((r) => miniRow(r,
              completedIds.includes(r.id) ? `<span class="chip leaf">${icon('check', 12)} Cooked</span>` : r.status === 'complete' ? '<span class="chip gold">Ready</span>' : '<span class="chip">Soon</span>')).join('')}</ul>
          </div>` : ''}

          ${(k.tickets || []).length ? `<div class="k-block">
            <h2>Your live classes</h2>
            <ul class="mini-list">${k.tickets.map((t) => {
              const cls = store.liveClass(t.classId);
              if (!cls) return '';
              const jw = joinWindow(cls);
              const r = store.recipe(cls.recipeId);
              const join = cls.format === 'in-person'
                ? `<span class="small">${icon('home', 14)} ${esc(t.location || cls.location || 'Address in your email')}</span>`
                : jw.ended ? '<span class="small muted">This class has ended</span>'
                  : jw.open && t.joinUrl ? `<a class="btn btn-primary btn-sm" href="${esc(t.joinUrl)}" target="_blank" rel="noopener">${icon('video', 14)} Join now</a>`
                    : `<span class="small muted">Join link appears here 30 min before class</span>`;
              return `<li style="align-items:flex-start">${media(r?.hero, { compact: true, ratio: null })}<div style="flex:1;min-width:0">
                <b>${esc(cls.title)}</b><div class="small muted">${esc(classWhen(cls).text)}</div>
                <div class="row" style="margin-top:8px">${join}<button class="btn btn-ghost btn-sm" data-ics="${esc(cls.id)}">Add to calendar</button>${r ? `<a class="link small" href="#/recipes/${esc(r.slug)}">Ingredients</a>` : ''}</div>
              </div></li>`;
            }).join('')}</ul>
          </div>` : ''}

          <div class="k-block">
            <div class="spread"><h2 style="margin:0">Shopping list</h2><a class="btn btn-ghost btn-sm" href="#/kitchen/shopping">${icon('cart', 16)} Open list</a></div>
            <p class="muted" style="margin-top:8px">${shopCount ? `${shopCount} recipe${shopCount > 1 ? 's' : ''} on your list, sorted by aisle.` : 'Pick recipes and we’ll build your list, sorted by aisle, with quantities for your number of guests.'}</p>
          </div>

          <div class="k-block">
            <h2>Saved recipes</h2>
            ${saved.length ? `<ul class="mini-list">${saved.map((r) => miniRow(r)).join('')}</ul>` : '<p class="muted">Tap the heart on any recipe to keep it here.</p>'}
          </div>

          <div class="k-block">
            <h2>Cooked</h2>
            ${completedIds.length ? `<ul class="mini-list">${completedIds.map((id) => store.recipe(id)).filter(Boolean).map((r) => {
              const times = k.cookLog.filter((l) => l.recipeId === r.id).length;
              return miniRow(r, `<span class="small muted">${times}×</span>`);
            }).join('')}</ul>` : '<p class="muted">Finish a Cook With Me lesson and it will appear here.</p>'}
          </div>

          ${recent.length ? `<div class="k-block"><h2>Recently viewed</h2><ul class="mini-list">${recent.map((r) => miniRow(r)).join('')}</ul></div>` : ''}
        </div>

        <div>
          <div class="k-block">
            <div class="panel">
              <div class="ring-stat">
                ${ring(cert.ratio, 92, 8, 'var(--gold)')}
                <div>
                  <span class="eyebrow" style="margin-bottom:4px">Certificate</span>
                  <b style="font-family:var(--display);font-size:1.15rem">${esc(flagship.certificateTitle)}</b>
                  <div class="small muted">${store.certificate(flagship.id) ? 'Earned. Congratulations!' : ownsFlagship ? `${cert.completed.length} of ${cert.required.length} dishes cooked` : `Included with ${esc(flagship.title)}`}</div>
                </div>
              </div>
              <a class="btn btn-ghost btn-block btn-sm" style="margin-top:14px" href="#/kitchen/certificate">${store.certificate(flagship.id) ? 'View certificate' : 'Preview certificate'}</a>
            </div>
          </div>

          <div class="k-block">
            <h2>Achievements</h2>
            <div class="ach-grid">${achs.map((a) => `<div class="ach ${a.earned ? '' : 'locked'}">${badge(a.earned)}<b>${esc(a.title)}</b><small>${esc(a.description)}</small></div>`).join('')}</div>
          </div>

          <div class="k-block">
            <h2>Challenges</h2>
            ${chals.map((c) => `<div class="challenge">
              <div class="spread"><h4>${esc(c.title)}</h4>${c.done ? `<span class="chip leaf">${icon('check', 12)} Complete</span>` : `<span class="small muted">${c.value}/${c.target}</span>`}</div>
              <p class="small muted" style="margin:0 0 8px">${esc(c.description)}</p>
              <div class="progress"><i style="width:${(c.value / c.target) * 100}%"></i></div>
            </div>`).join('')}
          </div>

          ${k.account ? `<div class="k-block">
            <h3>Account</h3>
            <p class="small muted" style="margin:0">${esc(k.account.email)} · since ${formatDate(k.account.createdAt)}</p>
            <form data-name class="row" style="margin-top:12px;flex-wrap:nowrap"><label class="sr-only" for="acct-name">Your name</label><input id="acct-name" class="input" name="name" placeholder="Your name" value="${esc(name || '')}" style="min-height:44px"><button class="btn btn-ghost btn-sm">Save</button></form>
            <button class="link small" data-signout style="margin-top:12px">Sign out</button>
          </div>` : ''}
        </div>
      </div>
    </section>`,
    mount(root) {
      const offs = [
        on(root, 'submit', '[data-name]', (e, f) => { e.preventDefault(); store.setAccountName(f.name.value.trim()); toast('Saved'); }),
        on(root, 'click', '[data-signout]', async () => {
          const msg = store.canSignIn ? 'Sign out of My Kitchen on this device?' : 'This demo keeps your kitchen in this browser only. Signing out clears your courses and progress here. Continue?';
          if (confirm(msg)) { await store.signOut(); location.hash = '#/'; }
        }),
        bindSignIn(root),
        on(root, 'click', '[data-ics]', (_, b) => downloadIcs(store.liveClass(b.dataset.ics), store.ticket(b.dataset.ics))),
      ];
      return () => offs.forEach((o) => o());
    },
  };
}
