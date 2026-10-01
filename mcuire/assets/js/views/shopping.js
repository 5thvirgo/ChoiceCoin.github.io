import { store } from '../services/store.js';
import { SHOP_CATEGORIES } from '../data/seed.js';
import { esc, icon, on, toast } from '../lib/dom.js';
import { scaleIngredient, formatQty } from '../lib/units.js';

// Combine ingredients across selected recipes, merging identical items.
export function buildList(selections, extras = []) {
  const items = new Map();
  for (const sel of selections) {
    const recipe = store.recipe(sel.recipeId);
    if (!recipe) continue;
    for (const ing of recipe.ingredients) {
      const key = `${ing.name.toLowerCase()}|${ing.unit || ''}`;
      const s = scaleIngredient(ing, recipe.baseServings, sel.servings);
      const item = items.get(key) || { key, name: ing.name, unit: ing.unit, qty: 0, texts: [], category: ing.shopCategory || 'Other', recipes: new Set(), optional: true };
      if (typeof s.qty === 'number') item.qty += s.qty; else item.texts.push(s.text);
      item.optional = item.optional && !!ing.optional;
      item.recipes.add(recipe.title);
      items.set(key, item);
    }
  }
  for (const x of extras) {
    items.set(`extra|${x.id}`, { key: `extra|${x.id}`, name: x.name, qty: 0, texts: [], category: 'Other', recipes: new Set(), extra: x.id });
  }
  const grouped = SHOP_CATEGORIES.map((cat) => ({
    cat,
    items: [...items.values()].filter((i) => i.category === cat).map((i) => ({
      ...i,
      amount: i.qty ? formatQty(Math.round(i.qty * 100) / 100, i.unit) : i.texts[0] || '',
      recipes: [...i.recipes],
    })),
  })).filter((g) => g.items.length);
  return grouped;
}

export default function shopping() {
  const ready = store.recipes.filter((r) => r.status === 'complete');

  const render = () => {
    const sh = store.shopping;
    const groups = buildList(sh.selections, sh.extras);
    const count = groups.reduce((s, g) => s + g.items.length, 0);
    const ticked = groups.reduce((s, g) => s + g.items.filter((i) => sh.checked[i.key]).length, 0);
    return `
    <section class="section-tight">
      <div class="wrap narrow">
        <a class="small muted" href="#/kitchen" style="text-decoration:none">${icon('back', 14)} My Kitchen</a>
        <h1 style="font-size:clamp(2rem,5vw,3rem);margin-top:12px">Shopping list</h1>
        <p class="lede">Choose what you’re cooking and for how many. We’ll combine everything and sort it by aisle.</p>

        <div class="panel no-print">
          <h3>What are you cooking?</h3>
          ${ready.map((r) => {
            const sel = sh.selections.find((s) => s.recipeId === r.id);
            return `<div class="pick">
              <input type="checkbox" id="pick-${esc(r.id)}" data-pick="${esc(r.id)}" ${sel ? 'checked' : ''} style="width:24px;height:24px;accent-color:var(--leaf)">
              <label class="grow" for="pick-${esc(r.id)}"><b>${esc(r.title)}</b></label>
              <label class="sr-only" for="srv-${esc(r.id)}">People</label>
              <select id="srv-${esc(r.id)}" data-servings="${esc(r.id)}" ${sel ? '' : 'disabled'}>
                ${[...new Set([...(r.servingOptions || []), sel?.servings || r.baseServings])].sort((a, b) => a - b).map((n) => `<option value="${n}" ${n === (sel?.servings || r.baseServings) ? 'selected' : ''}>${n} people</option>`).join('')}
              </select>
            </div>`;
          }).join('')}
          <p class="small muted" style="margin:12px 0 0">More recipes join this list as each lesson is released.</p>
        </div>

        ${count ? `
        <div class="spread no-print" style="margin-top:24px">
          <span class="muted">${ticked} of ${count} in your basket</span>
          <div class="row">
            <button class="btn btn-ghost btn-sm" data-share>${icon('share', 16)} Send list</button>
            <button class="btn btn-ghost btn-sm" onclick="window.print()">Print</button>
            ${ticked ? '<button class="btn btn-ghost btn-sm" data-clear>Untick all</button>' : ''}
          </div>
        </div>
        ${groups.map((g) => `<div class="shop-cat"><h3>${esc(g.cat)}</h3>
          ${g.items.map((i) => `<label class="shop-item ${sh.checked[i.key] ? 'checked' : ''}">
            <input type="checkbox" data-check="${esc(i.key)}" ${sh.checked[i.key] ? 'checked' : ''}>
            <span class="grow"><b>${esc(i.name)}</b>${i.optional ? ' <span class="small muted">(optional)</span>' : ''}<small>${esc(i.amount)}${i.recipes.length > 1 ? ` · ${esc(i.recipes.join(', '))}` : ''}</small></span>
            ${i.extra ? `<button class="icon-btn" data-remove="${esc(i.extra)}" aria-label="Remove ${esc(i.name)}" style="width:40px;height:40px">${icon('trash', 16)}</button>` : ''}
          </label>`).join('')}</div>`).join('')}
        ` : '<div class="empty">Tick a recipe above to build your list.</div>'}

        <form class="row no-print" data-extra style="margin-top:24px;flex-wrap:nowrap">
          <label class="sr-only" for="extra">Add your own item</label>
          <input id="extra" class="input" name="item" placeholder="Add something else (e.g. drinks, napkins)">
          <button class="btn btn-dark" type="submit">${icon('plus', 18)} Add</button>
        </form>
      </div>
    </section>`;
  };

  return {
    title: 'Shopping list',
    html: render(),
    mount(root) {
      const rerender = () => { const y = scrollY; root.innerHTML = render(); scrollTo(0, y); };
      const update = (patch) => { store.saveShopping({ ...store.shopping, ...patch }); rerender(); };
      const offs = [
        on(root, 'change', '[data-pick]', (_, el) => {
          const id = el.dataset.pick;
          const r = store.recipe(id);
          const sel = store.shopping.selections.filter((s) => s.recipeId !== id);
          if (el.checked) sel.push({ recipeId: id, servings: store.progress(id)?.servings || r.baseServings });
          update({ selections: sel });
        }),
        on(root, 'change', '[data-servings]', (_, el) => {
          update({ selections: store.shopping.selections.map((s) => (s.recipeId === el.dataset.servings ? { ...s, servings: Number(el.value) } : s)) });
        }),
        on(root, 'change', '[data-check]', (_, el) => {
          update({ checked: { ...store.shopping.checked, [el.dataset.check]: el.checked } });
        }),
        on(root, 'click', '[data-clear]', () => update({ checked: {} })),
        on(root, 'click', '[data-remove]', (e, b) => {
          e.preventDefault();
          update({ extras: store.shopping.extras.filter((x) => x.id !== b.dataset.remove) });
        }),
        on(root, 'submit', '[data-extra]', (e, f) => {
          e.preventDefault();
          const name = f.item.value.trim();
          if (name) update({ extras: [...store.shopping.extras, { id: `x${Date.now()}`, name }] });
        }),
        on(root, 'click', '[data-share]', async () => {
          const sh = store.shopping;
          const text = buildList(sh.selections, sh.extras)
            .map((g) => `${g.cat.toUpperCase()}\n${g.items.map((i) => `${sh.checked[i.key] ? '✓' : '☐'} ${i.name}${i.amount ? `: ${i.amount}` : ''}`).join('\n')}`)
            .join('\n\n');
          const title = 'Mcuire shopping list';
          try {
            if (navigator.share) await navigator.share({ title, text });
            else { await navigator.clipboard.writeText(`${title}\n\n${text}`); toast('List copied. Paste it into a message.'); }
          } catch { /* user cancelled */ }
        }),
      ];
      return () => offs.forEach((o) => o());
    },
  };
}
