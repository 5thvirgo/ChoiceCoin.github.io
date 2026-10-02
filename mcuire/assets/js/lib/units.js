// Ingredient scaling + friendly quantity formatting for beginners.
// Quantities are authored for recipe.baseServings and scaled at render time.

const FRACTIONS = [
  [0, ''], [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'], [1, ''],
];
const VOLUME_UNITS = new Set(['cup', 'cups', 'tbsp', 'tsp']);
const PLURAL = { cup: 'cups', clove: 'cloves', leaf: 'leaves', piece: 'pieces', tin: 'tins', cube: 'cubes', sheet: 'sheets' };

export function fraction(value) {
  if (value <= 0) return '0';
  const whole = Math.floor(value + 1e-9);
  const rest = value - whole;
  let best = FRACTIONS[0];
  for (const f of FRACTIONS) if (Math.abs(f[0] - rest) < Math.abs(best[0] - rest)) best = f;
  if (best[0] === 1) return String(whole + 1);
  if (!best[1]) return String(whole || (rest > 0 ? '⅛' : '0'));
  return whole ? `${whole}${best[1]}` : best[1];
}

function round(value, unit, mode) {
  if (mode === 'whole') return Math.max(1, Math.round(value));
  if (unit === 'g' || unit === 'ml') {
    if (value >= 200) return Math.round(value / 25) * 25;
    if (value >= 50) return Math.round(value / 5) * 5;
    return Math.max(1, Math.round(value));
  }
  if (unit === 'kg' || unit === 'l') return Math.round(value * 10) / 10;
  return value;
}

function unitLabel(unit, qty) {
  if (!unit) return '';
  if (qty > 1 && PLURAL[unit]) return PLURAL[unit];
  return unit;
}

// 2000 g -> 2 kg, 1500 ml -> 1.5 l (for display only).
export function bigUnits(qty, unit) {
  if ((unit === 'g' || unit === 'ml') && qty >= 1000) return [Math.round(qty / 100) / 10, unit === 'g' ? 'kg' : 'l'];
  return [qty, unit];
}

export function formatQty(qty, unit) {
  if (qty == null) return '';
  const text = VOLUME_UNITS.has(unit) || !unit || PLURAL[unit] ? fraction(qty) : String(qty);
  const label = unitLabel(unit, qty);
  return label ? `${text} ${label}` : text;
}

// Returns { qty, unit, text, alt, note } for the requested servings.
export function scaleIngredient(ing, baseServings, servings) {
  const factor = servings / baseServings;
  const mode = ing.scale || 'linear';
  let qty = ing.qty;
  let altQty = ing.altQty;
  if (qty != null && mode !== 'fixed') {
    qty = round(qty * factor, ing.unit, mode);
    if (altQty != null) altQty = round(altQty * factor, ing.altUnit, mode === 'whole' ? 'linear' : mode);
  }
  // Big batches read better in kg / litres ("2 kg", not "2000 g").
  let unit = ing.unit;
  if (qty != null && (unit === 'g' || unit === 'ml') && qty >= 1000) {
    qty = Math.round(qty / 100) / 10;
    unit = unit === 'g' ? 'kg' : 'l';
  }
  const text = qty == null ? (ing.amountText || 'to taste') : formatQty(qty, unit);
  let altUnit = ing.altUnit;
  if (altQty != null && (altUnit === 'g' || altUnit === 'ml') && altQty >= 1000) {
    altQty = Math.round(altQty / 100) / 10;
    altUnit = altUnit === 'g' ? 'kg' : 'l';
  }
  const alt = altQty != null ? `about ${formatQty(altQty, altUnit)}` : '';
  const note = mode === 'taste' && factor !== 1 ? 'adjust to taste' : '';
  return { qty, unit, text, alt, note };
}

export function batchWarning(recipe, servings) {
  if (servings > 12) {
    return `Cooking for ${servings}? Use two pots rather than one giant pot. Rice cooks unevenly in very large batches. Each pot will need a little more time than the recipe says.`;
  }
  if (servings > recipe.baseServings * 1.5) {
    return `For ${servings} people you need a bigger pot (at least ${Math.ceil((servings / recipe.baseServings) * 5)} litres). Cooking may take 5–10 minutes longer. Trust what you see, not just the timer.`;
  }
  return '';
}
