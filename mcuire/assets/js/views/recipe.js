import { store } from '../services/store.js';
import { AVAILABILITY } from '../data/seed.js';
import { media } from '../components.js';
import { esc, icon, minutes, money, on, toast } from '../lib/dom.js';
import { scaleIngredient, batchWarning } from '../lib/units.js';

// Meals list their dishes; allergens are gathered from every dish.
export function allergensFor(recipe) {
  if (!recipe.components) return recipe.allergens;
  return [...new Set(recipe.components.flatMap((id) => store.recipe(id)?.allergens || []))];
}

function mealDishes(recipe) {
  return `<ul class="mini-list" style="margin-top:12px">${recipe.components.map((id) => store.recipe(id)).filter(Boolean).map((r) => `
    <li>${media(r.hero, { compact: true, ratio: null })}<div style="flex:1;min-width:0"><a href="#/recipes/${esc(r.slug)}">${esc(r.title)}</a>
    <div class="small muted">${minutes((r.prepMinutes || 0) + (r.cookMinutes || 0))} on its own · ${r.steps.length} steps</div></div></li>`).join('')}</ul>
    <p class="small muted" style="margin-top:12px">The meal plan tells you when to start each dish, and each step opens that dish’s full lesson.</p>`;
}

export function servingsFor(recipe) {
  return store.progress(recipe.id)?.servings || recipe.baseServings;
}

export function servingsPicker(recipe, servings) {
  const opts = recipe.servingOptions || [2, 4, 6, 10];
  const custom = !opts.includes(servings);
  return `<div class="seg" role="group" aria-label="Number of people">
      ${opts.map((n) => `<button type="button" data-serves="${n}" aria-pressed="${n === servings}">${n}</button>`).join('')}
      <label class="sr-only" for="serves-custom">Custom number of people</label>
      <input id="serves-custom" type="number" inputmode="numeric" min="1" max="200" placeholder="Other" value="${custom ? servings : ''}" data-serves-custom>
    </div>`;
}

export function ingredientList(recipe, servings, { substitutions = true } = {}) {
  const groups = [];
  for (const ing of recipe.ingredients) {
    let g = groups.find((x) => x.name === (ing.group || ''));
    if (!g) groups.push((g = { name: ing.group || '', items: [] }));
    g.items.push(ing);
  }
  return groups.map((g) => `
    <div class="ing-group">
      ${g.name ? `<h4>${esc(g.name)}</h4>` : ''}
      ${g.items.map((ing) => {
        const s = scaleIngredient(ing, recipe.baseServings, servings);
        const hasHelp = substitutions && (ing.substitutes?.length || ing.availability?.length || ing.photo?.src);
        return `<div class="ing">
          <div class="name">${esc(ing.name)}${ing.prep ? `<small>, ${esc(ing.prep)}</small>` : ''}${ing.optional ? '<span class="opt">optional</span>' : ''}</div>
          <div class="qty">${esc(s.text)}${s.alt ? `<small>${esc(s.alt)}</small>` : ''}${s.note ? `<small>${esc(s.note)}</small>` : ''}</div>
          ${ing.note ? `<div class="note">${esc(ing.note)}</div>` : ''}
          ${hasHelp ? `<details class="cantfind"><summary>${icon('info', 16)} Can’t find this?</summary><div class="box">
            ${ing.photo?.src ? `<b>What it looks like</b><div style="max-width:220px;margin:6px 0 10px">${media(ing.photo, { ratio: 'wide' })}</div>` : ''}
            ${ing.availability?.length ? `<b>Where to look</b><div class="where">${ing.availability.map((a) => `<span class="chip">${esc(AVAILABILITY[a] || a)}</span>`).join('')}</div>` : ''}
            ${ing.substitutes?.length ? `<b style="display:block;margin-top:10px">Use instead</b><ul>${ing.substitutes.map((x) => `<li><b>${esc(x.name)}</b>${x.note ? `: ${esc(x.note)}` : ''}</li>`).join('')}</ul>` : ''}
          </div></details>` : ''}
        </div>`;
      }).join('')}
    </div>`).join('');
}

// Wire up a servings picker inside `root`; calls onChange(n).
export function bindServings(root, recipe, onChange) {
  const set = (n) => {
    n = Math.max(1, Math.min(200, Math.round(Number(n) || recipe.baseServings)));
    store.setProgress(recipe.id, { servings: n });
    onChange(n);
  };
  const offClick = on(root, 'click', '[data-serves]', (_, b) => set(b.dataset.serves));
  const offInput = on(root, 'change', '[data-serves-custom]', (_, input) => input.value && set(input.value));
  return () => { offClick(); offInput(); };
}

export default async function recipeView({ slug }) {
  let recipe = store.recipe(slug);
  if (!recipe) return { title: 'Not found', html: '<section class="section wrap empty"><h2>Recipe not found</h2><a class="btn btn-primary" href="#/courses">All courses</a></section>' };
  if (recipe.status === 'complete') recipe = await store.fullRecipe(slug);
  store.touchRecent(recipe.id);

  const owned = store.ownsRecipe(recipe.id);
  const courses = store.coursesContaining(recipe.id);
  const cheapest = courses.filter((c) => c.status === 'published').sort((a, b) => a.priceCents - b.priceCents)[0];
  const cat = store.category(recipe.categoryId);
  const progress = store.progress(recipe.id);
  const resumeStep = progress?.active ? progress.step : 0;
  const ready = recipe.status === 'complete';

  const single = store.singleFor(recipe.id);
  let cta;
  let ctaExtra = '';
  if (!ready) {
    cta = `<a class="btn btn-primary btn-lg btn-block" href="#/courses/${esc(cheapest?.slug || '')}">${owned ? 'In your course, coming soon' : 'See the course'}</a>`;
  } else if (owned) {
    cta = `<a class="btn btn-primary btn-lg btn-block" href="#/cook/${esc(recipe.slug)}">${icon('play', 18)} ${resumeStep ? `Continue at step ${resumeStep + 1}` : 'Start cooking'}</a>`;
  } else if (recipe.previewSteps) {
    cta = `<a class="btn btn-primary btn-lg btn-block" href="#/cook/${esc(recipe.slug)}">${icon('play', 18)} Start cooking · ${recipe.previewSteps} free steps</a>`;
    if (single) ctaExtra = `<a class="btn btn-ghost btn-block" style="margin-top:10px" href="#/checkout/${esc(single.slug)}">Buy this lesson · ${money(single.priceCents, single.currency)}</a>`;
  } else {
    cta = single
      ? `<a class="btn btn-primary btn-lg btn-block" href="#/checkout/${esc(single.slug)}">${icon('lock', 18)} Buy this lesson · ${money(single.priceCents, single.currency)}</a>`
      : `<a class="btn btn-primary btn-lg btn-block" href="#/courses/${esc(cheapest?.slug || '')}">${icon('lock', 18)} Unlock in ${esc(cheapest?.title || 'a course')}</a>`;
    const flagship = store.flagship;
    if (single && flagship && !store.owns(flagship.id)) ctaExtra = `<p class="small muted" style="margin:10px 0 0">Or get every dish with <a class="link" href="#/courses/${esc(flagship.slug)}">${esc(flagship.title)}</a> · ${money(flagship.priceCents, flagship.currency)}</p>`;
  }

  const meal = !!recipe.components;
  const render = (servings) => {
    const warning = batchWarning(recipe, servings);
    return `
    <section class="section-tight">
      <div class="wrap recipe-hero">
        <div>
          <a class="small muted" href="#/courses?c=${esc(cat?.slug || '')}" style="text-decoration:none">${icon('back', 14)} ${esc(cat?.name || 'Courses')}</a>
          <span class="eyebrow" style="margin-top:16px">${esc(recipe.region || '')}</span>
          <h1 style="font-size:clamp(2.1rem,5.5vw,3.6rem)">${esc(recipe.title)}</h1>
          <p class="lede">${esc(recipe.subtitle || '')}</p>
          <div class="facts">
            <div><b>${minutes(recipe.prepMinutes)}</b><span>Prep</span></div>
            <div><b>${minutes(recipe.cookMinutes)}</b><span>Cook</span></div>
            <div><b>${esc((recipe.difficulty || '').replace(' friendly', ''))}</b><span>Level</span></div>
            <div><b>${servings}</b><span>Servings</span></div>
          </div>
          <div class="row">
            <div style="flex:1;min-width:240px">${cta}${ctaExtra}</div>
            <button class="icon-btn" data-action="save" aria-pressed="${store.isSaved(recipe.id)}" title="Save recipe" style="${store.isSaved(recipe.id) ? 'color:var(--jollof);border-color:var(--jollof)' : ''}">${icon('heart')}</button>
          </div>
        </div>
        ${media(recipe.hero, { ratio: 'hero', eager: true })}
      </div>
    </section>

    ${ready ? '' : `
    <section class="section-tight"><div class="wrap narrow">
      <div class="panel"><h3>${icon('camera', 20)} Being filmed in the Mcuire kitchen</h3>
      <p class="muted" style="margin:0">This lesson is part of ${courses.map((c) => `<a class="link" href="#/courses/${esc(c.slug)}">${esc(c.title)}</a>`).join(' and ')}. When it’s ready it will have the same step-by-step Cook With Me guidance, photos and checkpoints as our <a class="link" href="#/recipes/${esc(store.freeRecipe.slug)}">Party Jollof lesson</a>. Course owners get it automatically.</p></div>
    </div></section>`}

    ${ready ? `
    <section class="section-tight has-sticky-cta">
      <div class="wrap two-col">
        <div>
          ${recipe.story ? `<p class="lede" style="margin-bottom:32px">${esc(recipe.story)}</p>` : ''}
          <div class="spread"><h2 style="margin:0">${meal ? 'What you’ll cook' : 'Ingredients'}</h2><button class="btn btn-ghost btn-sm" data-action="shop">${icon('cart', 16)} Add ${meal ? 'everything' : ''} to shopping list</button></div>
          ${meal ? mealDishes(recipe) : ingredientList(recipe, servings)}
        </div>
        <div class="stack">
          <div class="servings">
            <h3>${icon('users', 20)} How many people are you cooking for?</h3>
            ${servingsPicker(recipe, servings)}
            <p class="small muted" style="margin:10px 0 0">Every quantity on this page and in Cook With Me updates automatically.</p>
            ${warning ? `<div class="notice">${icon('alert', 18)}<span>${esc(warning)}</span></div>` : ''}
          </div>
          ${recipe.equipment.length ? `<div class="panel">
            <h3>Equipment</h3>
            <ul class="equip">${recipe.equipment.map((e) => `<li><b>${esc(e.name)}</b>${e.note ? `<small>${esc(e.note)}</small>` : ''}</li>`).join('')}</ul>
          </div>` : ''}
          <div class="panel">
            <h3>Allergens &amp; diet</h3>
            <ul class="ticks small" style="margin:0">
              ${allergensFor(recipe).map((a) => `<li>${icon('alert', 16)} ${esc(a)}</li>`).join('')}
              ${recipe.dietary.map((d) => `<li>${icon('leaf', 16)} ${esc(d)}</li>`).join('')}
            </ul>
          </div>
          ${recipe.serveWith?.length ? `<div class="panel"><h3>Serve with</h3><div class="row">${recipe.serveWith.map((s) => `<span class="chip gold">${esc(s)}</span>`).join('')}</div></div>` : ''}
          ${recipe.gallery?.length ? `<div class="cook-media two">${recipe.gallery.map((g) => media(g, { ratio: 'square', compact: true })).join('')}</div>` : ''}
        </div>
      </div>
    </section>
    <div class="sticky-cta">${cta}</div>` : ''}`;
  };

  let servings = servingsFor(recipe);
  return {
    title: recipe.title,
    html: render(servings),
    mount(root) {
      const offServ = bindServings(root, recipe, (n) => {
        servings = n;
        const y = window.scrollY;
        root.innerHTML = render(n);
        window.scrollTo(0, y);
      });
      const offSave = on(root, 'click', '[data-action=save]', (_, b) => {
        const saved = store.toggleSaved(recipe.id);
        b.setAttribute('aria-pressed', saved);
        b.style.cssText = saved ? 'color:var(--jollof);border-color:var(--jollof)' : '';
        toast(saved ? 'Saved to My Kitchen' : 'Removed from saved recipes');
      });
      const offShop = on(root, 'click', '[data-action=shop]', () => {
        const shopping = store.shopping;
        const selections = shopping.selections.filter((s) => s.recipeId !== recipe.id);
        selections.push({ recipeId: recipe.id, servings });
        store.saveShopping({ ...shopping, selections });
        toast(`Added for ${servings} people. Open it in My Kitchen.`);
      });
      return () => { offServ(); offSave(); offShop(); };
    },
  };
}
