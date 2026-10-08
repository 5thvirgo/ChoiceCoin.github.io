import { config } from '../config.js';
import { store } from '../services/store.js';
import { media } from '../components.js';
import { esc, icon, money, minutes } from '../lib/dom.js';

export default function course({ slug }) {
  const c = store.course(slug);
  if (!c) return { title: 'Not found', html: '<section class="section wrap empty"><h2>Course not found</h2><a class="btn btn-primary" href="#/courses">All courses</a></section>' };
  const owned = store.owns(c.id);
  const all = store.courseRecipeIds(c).map((id) => store.recipe(id)).filter(Boolean);
  const ready = all.filter((r) => r.status === 'complete');
  const totalMins = all.reduce((s, r) => s + (r.prepMinutes || 0) + (r.cookMinutes || 0), 0);
  const hero = ready[0]?.hero || all[0]?.hero;
  const flagship = store.flagship;
  const upgrade = c.kind !== 'flagship' && !store.owns(flagship.id);

  return {
    title: c.title,
    html: `
    <section class="section-tight">
      <div class="wrap recipe-hero">
        <div>
          <a class="small muted" href="#/courses" style="text-decoration:none">${icon('back', 14)} All courses</a>
          <span class="eyebrow" style="margin-top:16px">${c.kind === 'flagship' ? 'Flagship programme' : c.kind === 'single' ? 'Single lesson' : 'Mini course'}</span>
          <h1 style="font-size:clamp(2rem,5vw,3.4rem)">${esc(c.title)}${c.kind === 'flagship' ? `<br><span style="font-style:italic;color:var(--jollof)">${esc(c.subtitle)}</span>` : ''}</h1>
          <p class="lede">${esc(c.blurb)}</p>
          <div class="facts">
            <div><b>${all.length}</b><span>Dishes</span></div>
            <div><b>${c.modules.length}</b><span>Module${c.modules.length > 1 ? 's' : ''}</span></div>
            <div><b>${Math.round(totalMins / 60)} hrs</b><span>Of cooking</span></div>
            <div><b>Lifetime</b><span>Access</span></div>
          </div>
        </div>
        ${media(hero, { ratio: 'hero', eager: true })}
      </div>
    </section>

    <section class="section-tight has-sticky-cta">
      <div class="wrap course-layout">
        <div>
          <h2>What you’ll be able to do</h2>
          <ul class="ticks" style="margin-bottom:36px">${c.outcomes.map((o) => `<li>${icon('check')} ${esc(o)}</li>`).join('')}</ul>

          <h2>What you’ll cook</h2>
          ${c.modules.map((m, i) => `
            <details class="module" ${i === 0 ? 'open' : ''}>
              <summary><div><span class="eyebrow" style="margin-bottom:4px">Module ${i + 1}</span><h3>${esc(m.title)}</h3>${m.summary ? `<p class="muted small" style="margin:4px 0 0">${esc(m.summary)}</p>` : ''}</div>${icon('down')}</summary>
              <ul class="lesson-list">
                ${m.recipeIds.map((id) => store.recipe(id)).filter(Boolean).map((r) => `
                  <li>
                    ${media(r.hero, { compact: true, ratio: null })}
                    <div class="grow"><a href="#/recipes/${esc(r.slug)}">${esc(r.title)}</a><div class="small muted">${esc(r.region)} · ${minutes((r.prepMinutes || 0) + (r.cookMinutes || 0))} · ${esc(r.difficulty)}</div></div>
                    ${r.status === 'complete'
                      ? (r.previewSteps && !owned ? '<span class="chip leaf">Free preview</span>' : '<span class="chip leaf">Cook With Me</span>')
                      : '<span class="chip">Filming soon</span>'}
                  </li>`).join('')}
              </ul>
            </details>`).join('')}

          ${c.kind === 'flagship' ? `
          <div class="panel" style="margin-top:36px;display:flex;gap:18px;align-items:center">
            ${icon('award', 40)}
            <div><h3 style="margin-bottom:4px">Mcuire Certificate of Completion</h3><p class="muted small" style="margin:0">Finish the programme and receive a personalised certificate from ${esc(config.brand.name)} to download, print or share. (A certificate of completion, not an accredited culinary qualification.)</p></div>
          </div>` : ''}
        </div>

        <aside class="buy-box" id="buy">
          ${owned ? `
            <span class="chip leaf">${icon('check', 14)} In your kitchen</span>
            <h3 style="margin-top:12px">You own this course</h3>
            <a class="btn btn-primary btn-block btn-lg" href="#/kitchen">Go to My Kitchen</a>
          ` : `
            <div class="price">${money(c.priceCents, c.currency)}${c.compareAtCents ? `<s>${money(c.compareAtCents, c.currency)}</s>` : ''}</div>
            <p class="small muted">One payment. Yours to keep, on any device.</p>
            <a class="btn btn-primary btn-block btn-lg" href="#/checkout/${esc(c.slug)}">Get this course</a>
            <a class="btn btn-ghost btn-block" style="margin-top:10px" href="#/try">Try the free lesson first</a>
            <ul class="ticks small" style="margin:18px 0 0">
              <li>${icon('check', 16)} Instant access after payment</li>
              <li>${icon('check', 16)} Card, Apple Pay or Google Pay</li>
              <li>${icon('check', 16)} No account to set up first</li>
            </ul>
            ${upgrade ? `<p class="small" style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px">Want everything? <a class="link" href="#/courses/${esc(flagship.slug)}">${esc(flagship.title)}</a> includes every mini course for ${money(flagship.priceCents, flagship.currency)}.</p>` : ''}
          `}
        </aside>
      </div>
    </section>
    ${owned ? '' : `<div class="sticky-cta"><a class="btn btn-primary btn-block btn-lg" href="#/checkout/${esc(c.slug)}">Get this course · ${money(c.priceCents, c.currency)}</a></div>`}`,
  };
}
