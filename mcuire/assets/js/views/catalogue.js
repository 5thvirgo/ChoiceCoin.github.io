import { store } from '../services/store.js';
import { media, recipeTile } from '../components.js';
import { esc, icon, money } from '../lib/dom.js';

function priceTag(course) {
  if (store.owns(course.id)) return `<span class="chip leaf">${icon('check', 14)} In your kitchen</span>`;
  return `<span class="price">${money(course.priceCents, course.currency)}${course.compareAtCents ? `<s>${money(course.compareAtCents, course.currency)}</s>` : ''}</span>`;
}

export default function catalogue() {
  const flagship = store.flagship;
  const minis = store.courses.filter((c) => c.kind === 'mini' && c.status === 'published');
  const cats = store.categories;
  const complete = store.recipes.filter((r) => r.status === 'complete').length;

  return {
    title: 'Cooking courses',
    html: `
    <section class="section-tight">
      <div class="wrap">
        <span class="eyebrow">Mcuire Cooking Courses</span>
        <h1>Choose what you want to cook</h1>
        <p class="lede">Take the whole programme, or start with the dishes you love most. Every course works on your phone, right next to your stove.</p>
      </div>
    </section>

    <section class="section-tight" style="padding-top:0">
      <div class="wrap">
        <div class="flagship">
          ${media(store.freeRecipe.gallery?.[0] || store.freeRecipe.hero, { ratio: null, compact: true })}
          <div class="body">
            <span class="eyebrow">Best value · Everything included</span>
            <h2 style="color:#fff">${esc(flagship.title)}: <span style="font-style:italic;color:var(--gold)">${esc(flagship.subtitle)}</span></h2>
            <p class="lede">${esc(flagship.blurb)}</p>
            <ul class="ticks">
              <li>${icon('check')} All ${minis.length} mini courses + Complete Meals</li>
              <li>${icon('check')} ${store.courseRecipeIds(flagship).length} dishes across ${flagship.modules.length} modules</li>
              <li>${icon('check')} Mcuire Certificate of Completion</li>
            </ul>
            <div class="row">${priceTag(flagship)}</div>
            <div class="row" style="margin-top:16px">
              <a class="btn btn-gold btn-lg" href="#/courses/${esc(flagship.slug)}">View programme</a>
              ${store.owns(flagship.id) ? '' : `<a class="btn btn-ghost btn-lg" style="color:#fff;border-color:rgba(255,255,255,.3)" href="#/checkout/${esc(flagship.slug)}">Buy now</a>`}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <h2>Mini courses</h2>
        <p class="muted">Focused, affordable, and you can upgrade to the full programme later.</p>
        ${minis.map((c) => {
          const cat = store.categories.find((x) => x.name === c.title);
          const first = store.recipe(c.modules[0].recipeIds[0]);
          return `<article class="course-row">
            ${media(cat ? { kind: 'photo', brief: `${c.title}: a spread of dishes from this course.`, tone: cat.tone } : first?.hero, { ratio: 'wide', compact: true })}
            <div>
              <span class="eyebrow">${store.courseRecipeIds(c).length} dishes</span>
              <h3 style="font-size:1.8rem">${esc(c.title)}</h3>
              <p class="muted">${esc(c.blurb)}</p>
              <div class="row" style="margin-top:16px">${priceTag(c)}</div>
              <div class="row" style="margin-top:14px"><a class="btn btn-dark" href="#/courses/${esc(c.slug)}">See what you’ll cook</a></div>
            </div>
          </article>`;
        }).join('')}
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="spread"><h2>Every dish</h2><span class="muted small">${complete} ready to cook now · more filmed every month</span></div>
        <nav class="cat-nav" aria-label="Categories">${cats.map((c) => `<a href="#/courses?c=${esc(c.slug)}" data-jump="${esc(c.slug)}">${esc(c.name)}</a>`).join('')}</nav>
        ${cats.map((c) => `
          <div id="cat-${esc(c.slug)}" style="padding-top:28px;scroll-margin-top:130px">
            <h3 style="font-size:1.6rem">${esc(c.name)}</h3>
            <p class="muted">${esc(c.tagline)}</p>
            <div class="tiles" style="margin-top:18px">${store.recipesIn(c.id).map((r) => recipeTile(r, { owned: store.ownsRecipe(r.id) })).join('')}</div>
          </div>`).join('')}
      </div>
    </section>`,
    mount(root) {
      const jump = (slug) => root.querySelector(`#cat-${CSS.escape(slug)}`)?.scrollIntoView({ behavior: 'smooth' });
      root.querySelectorAll('[data-jump]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); jump(a.dataset.jump); }));
      const c = new URLSearchParams(location.hash.split('?')[1]).get('c');
      if (c) setTimeout(() => jump(c), 50);
    },
  };
}
