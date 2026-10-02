// Shared building blocks for recipe content, so common ingredients carry the
// same substitutions and where-to-buy advice in every lesson.

export const photo = (brief, tone, alt = brief) => ({ kind: 'photo', src: null, alt, brief, tone });
export const video = (brief, tone, alt = brief) => ({ kind: 'video', src: null, poster: null, alt, brief, tone });

export const STOCK_NOTE = 'Check stock cubes: some contain wheat, soy or celery';

const AFR = ['african-grocery', 'online'];
const MAIN = ['mainstream'];

export const ing = (id, name, qty, unit, shopCategory, availability = MAIN, extra = {}) => ({
  id, name, qty, unit, shopCategory, availability, substitutes: [], ...extra,
});

export const sb = (qty = 2, id = 'sb', extra = {}) => ing(id, 'Scotch bonnet peppers', qty, '', 'Produce', ['african-grocery', 'international', 'mainstream'], {
  scale: 'taste', note: 'Use fewer, or remove the seeds, for less heat.', substitutes: [{ name: 'Habanero', note: 'Same heat and fruity flavour.' }], ...extra,
});
export const onion = (qty = 1, id = 'onion', extra = {}) => ing(id, 'Onion', qty, '', 'Produce', MAIN, { scale: 'whole', ...extra });
export const redPeppers = (qty = 2, id = 'rbp', extra = {}) => ing(id, 'Red bell peppers (tatashe)', qty, '', 'Produce', MAIN, { scale: 'whole', ...extra });
export const stockCubes = (qty = 2, id = 'stock-cubes', extra = {}) => ing(id, 'Stock cubes', qty, 'cube', 'African Ingredients', ['mainstream', 'african-grocery'], {
  scale: 'whole', substitutes: [{ name: 'Bouillon powder', note: '1 tsp per cube.' }], ...extra,
});
export const salt = (qty = 1, id = 'salt') => ing(id, 'Salt', qty, 'tsp', 'Pantry', MAIN, { scale: 'taste' });
export const vegOil = (qty, unit, id = 'oil', extra = {}) => ing(id, 'Vegetable oil', qty, unit, 'Pantry', MAIN, extra);
export const fryOil = (id = 'fry-oil') => ing(id, 'Vegetable oil for frying', 4, 'cup', 'Pantry', MAIN, { altQty: 1, altUnit: 'l', scale: 'fixed' });
export const palmOil = (qty = 0.5, id = 'palm-oil', extra = {}) => ing(id, 'Red palm oil', qty, 'cup', 'African Ingredients', [...AFR, 'international'], {
  altQty: Math.round(qty * 240), altUnit: 'ml',
  note: 'Gives the colour and the true taste. It may be solid in a cold kitchen. That’s normal.',
  substitutes: [{ name: 'Vegetable oil + 1 tsp sweet paprika', note: 'Right colour, milder flavour. Use it only if you can’t find palm oil.' }], ...extra,
});
export const crayfish = (qty = 2, id = 'crayfish', extra = {}) => ing(id, 'Ground crayfish', qty, 'tbsp', 'African Ingredients', AFR, {
  substitutes: [{ name: 'Dried shrimp powder', note: 'Asian grocery stores sell this. Same amount.' }], ...extra,
});
export const driedFish = (g = 150, id = 'dried-fish', extra = {}) => ing(id, 'Dried or smoked fish', g, 'g', 'African Ingredients', AFR, {
  substitutes: [{ name: 'Smoked mackerel fillets', note: 'In most supermarket fish fridges.' }], ...extra,
});
export const iru = (qty = 1, id = 'iru', extra = {}) => ing(id, 'Iru (fermented locust beans)', qty, 'tbsp', 'African Ingredients', AFR, {
  substitutes: [{ name: '1 tsp white miso', note: 'Similar fermented depth.' }], ...extra,
});
export const meat = (g = 800, id = 'meat', name = 'Beef or assorted meat, in chunks', extra = {}) => ing(id, name, g, 'g', 'Meat & Fish', ['mainstream', 'african-grocery'], {
  substitutes: [{ name: 'Smoked turkey wings', note: 'Popular in Canada and the US. Simmer about 40 minutes.' }], ...extra,
});
export const cocoyam = (g = 300, id = 'cocoyam') => ing(id, 'Cocoyam (thickener)', g, 'g', 'Produce', ['african-grocery', 'international'], {
  note: 'Small, hairy brown tubers, sometimes called taro or eddoes.',
  substitutes: [{ name: '3 tbsp cocoyam flour (achi or ofor)', note: 'Mix with a little water before adding.' }, { name: 'Taro root', note: 'Same family. Use the same amount.' }],
});

// Season-and-simmer meat: the first step of most Nigerian soups.
export const cookMeatStep = (id, ingredientIds, minutes = 35, extra = {}) => ({
  id, phase: 'cook', title: 'Season and cook the meat',
  body: 'Put the meat in your pot with a little chopped onion, 1 crumbled stock cube, a pinch of salt and ½ cup of water. Cover and let it steam in its own juices for 10 minutes. Then add enough water to just cover it and simmer until tender. Keep the liquid. It’s your stock.',
  cues: { texture: 'A fork slides into the meat easily.' },
  about: `About ${minutes}–${minutes + 15} minutes`,
  timer: { minutes, label: 'Simmer the meat' },
  media: [photo('Seasoned meat simmering in its own stock.', 'suya')],
  ingredientIds,
  tips: [{ kind: 'mcuire', text: 'Never pour this stock away. It carries flavour into the whole soup.' }],
  ...extra,
});

export const soakFishStep = (id) => ({
  id, phase: 'prep', title: 'Soften the dried fish',
  body: 'Cover the dried fish with hot water from the kettle and leave it 10 minutes. Then pull out the hard bones and break it into bite-size pieces.',
  about: '10 minutes',
  timer: { minutes: 10, label: 'Soak dried fish' },
  media: [photo('Softened dried fish being broken into pieces.', 'suya')],
  ingredientIds: ['dried-fish'],
});

export const hotOilTip = { kind: 'watch', text: 'Never leave hot oil alone. Keep a lid nearby. If it ever catches fire, cover it and turn off the heat. Never use water.' };
export const scotchTip = { kind: 'watch', text: 'Wash your hands with soap after cutting scotch bonnet, and keep them away from your eyes.' };
