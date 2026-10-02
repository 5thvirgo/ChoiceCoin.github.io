// Soups: Okra, Oha, Afang, Edikang Ikong, Bitterleaf (Ofe Onugbu), Nsala, Banga.
import { photo, video, ing, sb, onion, stockCubes, salt, palmOil, crayfish, driedFish, meat, cocoyam, cookMeatStep, soakFishStep, STOCK_NOTE } from './common.js';

const SWALLOWS = ['Eba', 'Pounded Yam', 'Fufu', 'Semolina'];
const soupBase = (extra = {}) => ({
  status: 'complete', categoryId: 'soups', previewSteps: 0,
  baseServings: 6, servingOptions: [2, 4, 6, 10, 15, 20],
  allergens: ['Fish and shellfish (dried fish, crayfish)', STOCK_NOTE],
  dietary: ['Dairy-free', 'Gluten-free if your stock cubes are'],
  serveWith: SWALLOWS,
  equipment: [
    { name: 'Large pot with lid', note: '' }, { name: 'Wooden spoon', note: '' },
    { name: 'Knife and chopping board', note: '' },
  ],
  ...extra,
});

const servedStep = (id, tone, tip) => ({
  id, phase: 'finish', title: 'Serve with swallow',
  body: 'Serve hot in deep bowls with your swallow (eba, pounded yam, fufu or semolina). Pinch off a small piece of swallow, roll it, make a dent with your thumb and scoop up the soup.',
  media: [photo('Mcuire plating: the soup in a bowl beside a smooth ball of swallow.', tone)],
  ingredientIds: [],
  tips: [{ kind: 'kitchen', text: tip || 'Keeps 3 days in the fridge or 2 months in the freezer. Reheat gently with a splash of water.' }],
});

const cocoyamSteps = (prefix) => [
  { id: `${prefix}-cy1`, phase: 'cook', title: 'Boil the cocoyam', body: 'Wash the cocoyam well and boil it, skin on, in water until a knife slides through easily.', about: '20 minutes', timer: { minutes: 20, label: 'Boil cocoyam' }, media: [photo('Boiled cocoyam, skins splitting.', 'rice')], ingredientIds: ['cocoyam'], tips: [{ kind: 'watch', text: 'Wear gloves to handle raw cocoyam. It can make your hands itch.' }] },
  { id: `${prefix}-cy2`, phase: 'prep', title: 'Peel and pound the cocoyam smooth', body: 'Peel off the skins while warm. Pound in a mortar, or blend with 2–3 tablespoons of hot water, until completely smooth and sticky.', cues: { texture: 'Smooth, sticky paste, like thick mashed potato with no lumps.' }, about: '5 minutes', media: [video('10-second clip: pounding cocoyam into a smooth sticky paste.', 'rice')], ingredientIds: [],
    checkpoint: { question: 'How smooth is it?', options: [
      { id: 'lumpy', label: 'Lumpy', verdict: 'wait', media: photo('Lumpy cocoyam.', 'rice'), guidance: 'Keep pounding or blending. Lumps will stay as lumps in the soup.' },
      { id: 'smooth', label: 'Smooth and sticky', verdict: 'good', media: photo('Smooth cocoyam paste.', 'rice'), guidance: 'Perfect thickener.' },
    ] } },
];

const thickenStep = (id) => ({
  id, phase: 'cook', title: 'Thicken with the cocoyam',
  body: 'Drop the cocoyam paste into the soup in small lumps, about a teaspoon each. Cover and simmer, stirring every few minutes, until the lumps dissolve and the soup thickens.',
  cues: { texture: 'Thick enough to coat the back of a spoon.' },
  about: '10–15 minutes', timer: { minutes: 10, label: 'Dissolve cocoyam' },
  media: [photo('Small lumps of cocoyam dissolving into the soup.', 'egusi')], ingredientIds: [],
  checkpoint: { question: 'How thick is your soup?', options: [
    { id: 'thin', label: 'Still thin', verdict: 'wait', media: photo('Thin soup.', 'egusi'), guidance: 'Simmer 5 more minutes. Add a little more cocoyam paste if it stays thin.' },
    { id: 'right', label: 'Coats the spoon', verdict: 'good', media: photo('Correctly thickened soup.', 'egusi'), guidance: 'Perfect.' },
    { id: 'thick', label: 'Too thick, like porridge', verdict: 'fix', media: photo('Overly thick soup.', 'egusi'), guidance: 'Stir in ½ cup of stock or hot water.' },
  ] },
});

// ---------------------------------------------------------------------------
export const okraSoup = {
  ...soupBase(),
  id: 'okra', slug: 'okra', title: 'Okra Soup', region: 'Nigeria',
  subtitle: 'Bright, fresh and drawy: chopped okra in a light palm-oil broth with meat and seafood.',
  story: 'Okra soup is one of the quickest Nigerian soups. Once the meat is cooked, it’s on the table in 15 minutes. The key is not to overcook the okra, so it stays bright green with that lovely “draw”.',
  prepMinutes: 20, cookMinutes: 50, difficulty: 'Beginner friendly',
  allergens: ['Fish and shellfish (dried fish, prawns, crayfish)', STOCK_NOTE],
  hero: photo('Bright green okra soup with prawns and meat, red palm oil swirls. Overhead.', 'leaf', 'Okra soup'),
  ingredients: [
    meat(600), driedFish(150),
    ing('okra', 'Fresh okra', 500, 'g', 'Produce', ['african-grocery', 'international', 'mainstream'], { note: 'Pick firm, bright green pods. Small ones are more tender.', substitutes: [{ name: 'Frozen chopped okra', note: 'Add it straight from frozen.' }] }),
    ing('prawns', 'Prawns, peeled', 200, 'g', 'Frozen', ['mainstream'], { optional: true }),
    palmOil(0.33), crayfish(2), sb(2), onion(1), stockCubes(2), salt(1),
    ing('greens', 'Spinach or ugu leaves, chopped', 150, 'g', 'Produce', ['mainstream', 'african-grocery'], { optional: true }),
  ],
  steps: [
    cookMeatStep('ok1', ['meat', 'onion'], 35),
    soakFishStep('ok2'),
    { id: 'ok3', phase: 'prep', title: 'Chop the okra', body: 'Wash the okra and cut off the tops and tails. Chop it very finely for more “draw”, or slice it into thin rounds if you like a little crunch.', why: 'The finer you chop, the more silky and stretchy the soup becomes.', about: '10 minutes', media: [video('10-second clip: finely chopping okra, showing the size of the pieces.', 'leaf')], ingredientIds: ['okra'], tips: [{ kind: 'kitchen', text: 'Dry okra chops more easily. Pat it dry after washing.' }] },
    { id: 'ok4', phase: 'cook', title: 'Build the broth', body: 'You should have about 3 cups of meat stock in the pot. Add the palm oil, chopped scotch bonnet, crayfish, fish and 1 crumbled stock cube. Boil for 5 minutes.', about: '5 minutes', timer: { minutes: 5, label: 'Boil the broth' }, media: [photo('Red-orange broth with palm oil and fish.', 'jollof')], ingredientIds: ['palm-oil', 'sb', 'crayfish', 'dried-fish', 'stock-cubes'] },
    { id: 'ok5', phase: 'cook', title: 'Add the okra and cook briefly', body: 'Add the okra and stir. Cook uncovered, stirring once or twice, until the okra is just tender and the soup becomes stretchy.', cues: { see: 'Still bright green.', texture: 'Lift your spoon: silky strands stretch from it.' }, about: '5–7 minutes', timer: { minutes: 5, label: 'Cook the okra' }, media: [photo('Okra just cooked, bright green and drawy.', 'leaf')], ingredientIds: [],
      tips: [{ kind: 'mcuire', text: 'Keep the lid off. Covering okra turns it dull and olive-coloured.' }],
      checkpoint: { question: 'What colour is your okra?', options: [
        { id: 'bright', label: 'Bright green and drawy', verdict: 'good', media: photo('Bright green okra soup.', 'leaf'), guidance: 'Perfect. Move on quickly.' },
        { id: 'dull', label: 'Dull olive green', verdict: 'fix', media: photo('Overcooked dull okra.', 'egusi'), guidance: 'A little overcooked, but still tasty. Next time take it off a few minutes earlier.' },
      ] } },
    { id: 'ok6', phase: 'finish', title: 'Add the meat, prawns and greens', body: 'Add the meat, prawns and greens. Simmer for 3 minutes, until the prawns turn pink. Taste and add salt.', about: '3 minutes', timer: { minutes: 3, label: 'Finish the soup' }, media: [], ingredientIds: ['prawns', 'greens', 'salt'] },
    servedStep('ok7', 'leaf'),
  ],
};

// ---------------------------------------------------------------------------
export const ohaSoup = {
  ...soupBase(),
  id: 'oha', slug: 'oha', title: 'Oha Soup', region: 'Nigeria (Igbo)',
  subtitle: 'Tender oha leaves in a rich, cocoyam-thickened palm-oil broth: an Igbo classic.',
  story: 'Oha soup is famous across Eastern Nigeria. Its silky, slightly lemony leaves sit in a broth thickened with cocoyam. Tradition says to tear oha leaves by hand rather than cutting them with a knife. Many cooks say it keeps the flavour and colour.',
  prepMinutes: 30, cookMinutes: 75, difficulty: 'Intermediate',
  hero: photo('Oha soup with torn green leaves, palm oil, assorted meat and fish. Overhead.', 'leaf', 'Oha soup'),
  ingredients: [
    meat(800, 'meat', 'Assorted meat and stockfish'), driedFish(150), cocoyam(300),
    ing('oha', 'Oha leaves', 2, 'cup', 'African Ingredients', ['african-grocery', 'online'], { note: 'Sold fresh or frozen at African grocery stores.', substitutes: [{ name: 'Spinach + a few bitterleaf leaves', note: 'Not the same, but a good stand-in.' }] }),
    ing('uziza', 'Uziza leaves, sliced', 5, 'leaf', 'African Ingredients', ['african-grocery'], { optional: true, scale: 'whole', note: 'Peppery and aromatic.', substitutes: [{ name: 'A pinch of ground black pepper', note: '' }] }),
    palmOil(0.5), crayfish(3), sb(2), stockCubes(3), salt(1), onion(1),
    ing('ogiri', 'Ogiri (fermented oil seed)', 1, 'tsp', 'African Ingredients', ['african-grocery'], { optional: true, substitutes: [{ name: '1 tsp iru or white miso', note: '' }] }),
  ],
  steps: [
    cookMeatStep('oh1', ['meat', 'onion'], 40),
    soakFishStep('oh2'),
    ...cocoyamSteps('oh'),
    { id: 'oh3', phase: 'cook', title: 'Build the broth', body: 'Make sure there’s about 4 cups of stock in the meat pot. Add the palm oil, scotch bonnet, crayfish, fish, ogiri and 2 crumbled stock cubes. Boil for 5 minutes.', about: '5 minutes', timer: { minutes: 5, label: 'Boil the broth' }, media: [photo('Palm-oil broth with meat and fish.', 'jollof')], ingredientIds: ['palm-oil', 'sb', 'crayfish', 'dried-fish', 'ogiri', 'stock-cubes'] },
    thickenStep('oh4'),
    { id: 'oh5', phase: 'finish', title: 'Tear in the oha leaves', body: 'Tear the oha leaves into small pieces with your fingers and add them with the uziza. Simmer for 3 minutes, just until wilted. Taste and add salt.', cues: { see: 'Leaves soft but still bright green.' }, about: '3 minutes', timer: { minutes: 3, label: 'Cook oha leaves' }, media: [video('8-second clip: tearing oha leaves by hand into the soup.', 'leaf')], ingredientIds: ['oha', 'uziza', 'salt'], tips: [{ kind: 'watch', text: 'Oha leaves are delicate. Overcooking them loses their lovely aroma.' }] },
    servedStep('oh6', 'leaf'),
  ],
};

// ---------------------------------------------------------------------------
const waterleafSoup = (fields) => ({
  ...soupBase(),
  difficulty: 'Intermediate', prepMinutes: 40, cookMinutes: 60,
  allergens: ['Fish and shellfish (periwinkles, dried fish, crayfish)', STOCK_NOTE],
  ...fields,
});
const periwinkle = ing('periwinkle', 'Periwinkles (shelled)', 1, 'cup', 'Frozen', ['african-grocery'], { optional: true, note: 'Small sea snails, sold frozen and shelled.', substitutes: [{ name: 'Clams or mussels (shelled)', note: 'Very similar.' }] });
const waterleaf = (g) => ing('waterleaf', 'Waterleaf, chopped', g, 'g', 'Produce', ['african-grocery'], { note: 'A soft, juicy leaf that releases water as it cooks.', substitutes: [{ name: 'Spinach', note: 'The most common substitute in Canada and the US.' }, { name: 'Purslane', note: 'Closer in texture, found at some farmers’ markets.' }] });

export const afang = waterleafSoup({
  id: 'afang', slug: 'afang', title: 'Afang Soup', region: 'Nigeria (Efik/Ibibio)',
  subtitle: 'A deep green, vegetable-rich soup of afang and waterleaf with periwinkles and palm oil.',
  story: 'Afang comes from the Efik and Ibibio people of south-eastern Nigeria. It’s mostly leaves, cooked with very little water, because the waterleaf releases its own juice. The result is thick, rich and wonderfully green.',
  hero: photo('Dark green afang soup with meat and periwinkles, palm oil sheen. Overhead.', 'leaf', 'Afang soup'),
  ingredients: [
    meat(800, 'meat', 'Beef and assorted meat'), driedFish(150), periwinkle,
    ing('afang-leaf', 'Afang (okazi) leaves, shredded', 2, 'cup', 'African Ingredients', ['african-grocery', 'online'], { note: 'Sold fresh, frozen or dried. Soak dried afang in warm water for 10 minutes.', substitutes: [{ name: 'Dried afang', note: 'Use 1 cup, soaked.' }] }),
    waterleaf(500), palmOil(1), crayfish(3), sb(3), stockCubes(3), salt(1), onion(1),
  ],
  steps: [
    cookMeatStep('af1', ['meat', 'onion'], 35, { body: 'Season the meat with a little onion, 1 stock cube and salt and steam it in ½ cup of water for 10 minutes. Then add just enough water to cover and simmer until tender. You want only about 1 cup of stock left at the end. Afang uses very little water.' }),
    soakFishStep('af2'),
    { id: 'af3', phase: 'prep', title: 'Prepare the leaves', body: 'Wash and chop the waterleaf. Grind the afang: pulse it in a blender with 2 tablespoons of water, or pound it, until finely shredded. Keep the two leaves separate.', about: '10 minutes', media: [photo('Chopped waterleaf and finely ground afang in separate bowls.', 'leaf')], ingredientIds: ['afang-leaf', 'waterleaf'] },
    { id: 'af4', phase: 'cook', title: 'Steam the waterleaf with the meat', body: 'Add the waterleaf to the meat pot, cover, and cook on medium for 5 minutes. It will collapse and release its water.', about: '5 minutes', timer: { minutes: 5, label: 'Steam waterleaf' }, media: [], ingredientIds: [] },
    { id: 'af5', phase: 'cook', title: 'Add palm oil and seasoning', body: 'Add the palm oil, scotch bonnet, crayfish, fish, periwinkles and the rest of the stock cubes. Stir and simmer for 5 minutes.', about: '5 minutes', timer: { minutes: 5, label: 'Simmer' }, media: [photo('Waterleaf, palm oil and periwinkles simmering.', 'jollof')], ingredientIds: ['palm-oil', 'sb', 'crayfish', 'dried-fish', 'periwinkle', 'stock-cubes'] },
    { id: 'af6', phase: 'finish', title: 'Stir in the afang', body: 'Add the ground afang and stir well. Simmer uncovered for 5 minutes. Taste and add salt.', about: '5 minutes', timer: { minutes: 5, label: 'Cook afang' }, media: [], ingredientIds: ['salt'],
      checkpoint: { question: 'How does it look?', options: [
        { id: 'watery', label: 'Watery', verdict: 'fix', media: photo('Watery afang.', 'leaf'), guidance: 'Leave the lid off and simmer 5 more minutes to cook off the water.' },
        { id: 'right', label: 'Thick and green, oil glistening', verdict: 'good', media: photo('Correct afang.', 'leaf'), guidance: 'That’s afang.' },
      ] } },
    servedStep('af7', 'leaf'),
  ],
});

export const edikangIkong = waterleafSoup({
  id: 'edikang-ikong', slug: 'edikang-ikong', title: 'Edikang Ikong', region: 'Nigeria (Efik)',
  subtitle: 'A celebration soup of fluted pumpkin leaves and waterleaf, packed with meat and seafood.',
  story: 'Edikang ikong is the soup of Calabar, famous for being generous with everything: leaves, meat and seafood. Like afang, the waterleaf gives the water. The ugu leaves go in at the very end to stay vivid green.',
  hero: photo('Vivid green edikang ikong packed with meat, fish and periwinkles. Overhead.', 'leaf', 'Edikang ikong'),
  ingredients: [
    meat(800, 'meat', 'Beef, goat and assorted meat'), driedFish(150), periwinkle,
    ing('ugu', 'Ugu (fluted pumpkin) leaves, finely chopped', 600, 'g', 'Produce', ['african-grocery'], { substitutes: [{ name: 'Spinach', note: 'Use the same amount.' }, { name: 'Kale + spinach', note: 'Half and half, for more body.' }] }),
    waterleaf(400), palmOil(1), crayfish(3), sb(3), stockCubes(3), salt(1), onion(1),
  ],
  steps: [
    cookMeatStep('ei1', ['meat', 'onion'], 35, { body: 'Season the meat with a little onion, 1 stock cube and salt and steam it in ½ cup of water for 10 minutes. Then add just enough water to cover and simmer until tender. You want only about 1 cup of stock left. This soup gets its water from the leaves.' }),
    soakFishStep('ei2'),
    { id: 'ei3', phase: 'prep', title: 'Chop the leaves finely', body: 'Wash both leaves well. Chop the ugu very finely and the waterleaf roughly. Keep them separate.', about: '15 minutes', media: [video('10-second clip: finely chopping ugu leaves.', 'leaf')], ingredientIds: ['ugu', 'waterleaf'] },
    { id: 'ei4', phase: 'cook', title: 'Waterleaf first', body: 'Add the waterleaf to the meat, cover and cook 5 minutes until it collapses and releases its juice.', about: '5 minutes', timer: { minutes: 5, label: 'Steam waterleaf' }, media: [], ingredientIds: [] },
    { id: 'ei5', phase: 'cook', title: 'Palm oil, seafood and seasoning', body: 'Add the palm oil, pepper, crayfish, fish, periwinkles and the remaining stock cubes. Simmer 5 minutes.', about: '5 minutes', timer: { minutes: 5, label: 'Simmer' }, media: [], ingredientIds: ['palm-oil', 'sb', 'crayfish', 'dried-fish', 'periwinkle', 'stock-cubes'] },
    { id: 'ei6', phase: 'finish', title: 'Ugu last, just 3 minutes', body: 'Stir in the ugu and cook uncovered for 3 minutes only. Taste and add salt. Turn off the heat.', about: '3 minutes', timer: { minutes: 3, label: 'Cook the ugu' }, media: [photo('Ugu just wilted into the soup, vivid green.', 'leaf')], ingredientIds: ['salt'],
      checkpoint: { question: 'What colour are the leaves?', options: [
        { id: 'vivid', label: 'Vivid green', verdict: 'good', media: photo('Vivid green edikang ikong.', 'leaf'), guidance: 'Perfect. Take it off the heat.' },
        { id: 'dull', label: 'Dark and dull', verdict: 'fix', media: photo('Overcooked dull leaves.', 'egusi'), guidance: 'A little overcooked, but still delicious. Next time switch it off sooner.' },
      ] } },
    servedStep('ei7', 'leaf'),
  ],
});

// ---------------------------------------------------------------------------
export const bitterleaf = {
  ...soupBase(),
  id: 'bitterleaf-soup', slug: 'bitterleaf-soup', title: 'Bitterleaf Soup (Ofe Onugbu)', region: 'Nigeria (Igbo)',
  subtitle: 'Washed bitterleaf in a cocoyam-thickened palm-oil soup: gently bitter, deeply savoury.',
  story: 'Ofe onugbu is an Igbo favourite. Bitterleaf is washed until just a gentle, pleasant bitterness remains, and that bitterness balances the rich palm oil and meat. Ready-washed bitterleaf from the freezer section saves a lot of work.',
  prepMinutes: 30, cookMinutes: 75, difficulty: 'Intermediate',
  hero: photo('Bitterleaf soup with dark green leaves, palm oil and assorted meat. Overhead.', 'leaf', 'Bitterleaf soup'),
  ingredients: [
    meat(800, 'meat', 'Assorted meat and stockfish'), driedFish(150), cocoyam(300),
    ing('bitterleaf', 'Bitterleaf (washed)', 1, 'cup', 'Frozen', ['african-grocery', 'online'], { note: 'Buy it washed and frozen, or dried. Fresh bitterleaf must be washed first (step 1).', substitutes: [{ name: 'Dried bitterleaf', note: 'Soak in warm water for 15 minutes, then squeeze.' }, { name: 'Kale + a little dandelion greens', note: 'For a gentle bitterness if you can’t find it.' }] }),
    palmOil(0.5), crayfish(3), sb(2), stockCubes(3), salt(1), onion(1),
    ing('ogiri', 'Ogiri (fermented oil seed)', 1, 'tsp', 'African Ingredients', ['african-grocery'], { optional: true, substitutes: [{ name: '1 tsp iru or white miso', note: '' }] }),
  ],
  steps: [
    { id: 'bl1', phase: 'prep', title: 'Wash the bitterleaf (if fresh)', body: 'Using washed or frozen bitterleaf? Just thaw it and skip ahead. For fresh leaves: rub them firmly between your hands in a bowl of water, squeeze out the green water, and repeat with fresh water 5–6 times. Taste a leaf: it should be only mildly bitter.', about: '15 minutes', media: [video('12-second clip: rubbing and squeezing bitterleaf in water, green water pouring off.', 'leaf')], ingredientIds: ['bitterleaf'],
      checkpoint: { question: 'Taste a leaf. How bitter is it?', options: [
        { id: 'very', label: 'Very bitter', verdict: 'wait', media: photo('Bitterleaf, first wash.', 'leaf'), guidance: 'Keep washing and squeezing, 2–3 more rounds.' },
        { id: 'mild', label: 'Gently bitter', verdict: 'good', media: photo('Washed bitterleaf.', 'leaf'), guidance: 'Perfect. A little bitterness is the point.' },
      ] } },
    cookMeatStep('bl2', ['meat', 'onion'], 40),
    soakFishStep('bl3'),
    ...cocoyamSteps('bl'),
    { id: 'bl4', phase: 'cook', title: 'Build the broth', body: 'With about 4 cups of stock in the pot, add the palm oil, scotch bonnet, crayfish, fish, ogiri and 2 crumbled stock cubes. Boil for 5 minutes.', about: '5 minutes', timer: { minutes: 5, label: 'Boil the broth' }, media: [], ingredientIds: ['palm-oil', 'sb', 'crayfish', 'dried-fish', 'ogiri', 'stock-cubes'] },
    thickenStep('bl5'),
    { id: 'bl6', phase: 'finish', title: 'Add the bitterleaf', body: 'Add the bitterleaf and simmer for 5 minutes. Taste and adjust the salt.', about: '5 minutes', timer: { minutes: 5, label: 'Cook bitterleaf' }, media: [], ingredientIds: ['salt'], tips: [{ kind: 'ready', text: 'Rich and savoury, with a gentle bitter finish. Not harsh.' }] },
    servedStep('bl7', 'leaf'),
  ],
};

// ---------------------------------------------------------------------------
export const nsala = {
  ...soupBase(),
  id: 'nsala', slug: 'nsala', title: 'Nsala (White Soup)', region: 'Nigeria (Igbo)',
  subtitle: 'A light, peppery catfish soup thickened with yam, with no palm oil, hence “white soup”.',
  story: 'Nsala is famous as a comforting soup, often made for new mothers. It has no palm oil, so it’s pale and light, but it’s full of flavour from fresh catfish, pepper and fragrant uziza and ehuru spices.',
  prepMinutes: 25, cookMinutes: 40, difficulty: 'Beginner friendly',
  allergens: ['Fish and shellfish (catfish, crayfish)', STOCK_NOTE],
  hero: photo('Pale, peppery nsala with catfish steaks and green utazi leaves. 45°.', 'onion', 'Nsala white soup'),
  ingredients: [
    ing('catfish', 'Fresh catfish, cut into steaks', 1, 'kg', 'Meat & Fish', ['african-grocery', 'mainstream'], { note: 'Ask the fishmonger to clean and cut it.', substitutes: [{ name: 'Tilapia or any firm white fish', note: 'Simmer 2–3 minutes less.' }, { name: 'Chicken thighs', note: 'A popular “chicken nsala”. Simmer 25 minutes in step 3.' }] }),
    ing('yam', 'White yam (thickener)', 200, 'g', 'Produce', ['african-grocery'], { substitutes: [{ name: '3 tbsp instant mashed potato flakes', note: 'Stir in at step 4 instead of yam paste.' }] }),
    ing('uziza-seed', 'Uziza seeds, ground', 1, 'tsp', 'African Ingredients', ['african-grocery', 'online'], { substitutes: [{ name: '½ tsp ground black pepper', note: '' }] }),
    ing('ehuru', 'Ehuru (calabash nutmeg), toasted and ground', 1, 'tsp', 'African Ingredients', ['african-grocery', 'online'], { substitutes: [{ name: '¼ tsp ground nutmeg', note: '' }] }),
    ing('utazi', 'Utazi leaves, thinly sliced', 4, 'leaf', 'African Ingredients', ['african-grocery'], { optional: true, scale: 'whole', note: 'Pleasantly bitter. A little goes a long way.', substitutes: [{ name: 'Leave it out', note: '' }] }),
    crayfish(2), sb(2), onion(1), stockCubes(2), salt(1),
  ],
  steps: [
    { id: 'ns1', phase: 'prep', title: 'Clean the catfish', body: 'Put the catfish in a bowl and pour hot (not boiling) water over it. The slimy coating turns white. Rub it off with a little salt and a paper towel, then rinse.', why: 'Removing the slime gives a clean-tasting soup.', about: '5 minutes', media: [video('10-second clip: pouring hot water over catfish and rubbing off the slime.', 'onion')], ingredientIds: ['catfish'], tips: [{ kind: 'watch', text: 'Hot tap water or water just off the boil is enough. Boiling water starts cooking the fish.' }] },
    { id: 'ns2', phase: 'cook', title: 'Boil and pound the yam', body: 'Peel and cube the yam and boil it until very soft. Drain, then pound or blend it with a splash of hot water into a smooth, sticky paste.', about: '15 minutes', timer: { minutes: 15, label: 'Boil the yam' }, media: [], ingredientIds: ['yam'] },
    { id: 'ns3', phase: 'cook', title: 'Poach the catfish gently', body: 'In a pot, bring 4 cups of water to the boil with the chopped onion, pepper, crayfish, uziza, ehuru and stock cubes. Lower in the catfish and simmer gently. Don’t stir: swirl the pot instead, so the fish doesn’t break.', about: '10 minutes', timer: { minutes: 10, label: 'Poach catfish' }, media: [photo('Catfish steaks poaching in pale, peppery broth.', 'onion')], ingredientIds: ['uziza-seed', 'ehuru', 'crayfish', 'sb', 'onion', 'stock-cubes'], tips: [{ kind: 'chef', text: 'Holding both handles and swirling the pot mixes everything without breaking the fish.' }] },
    { id: 'ns4', phase: 'cook', title: 'Thicken with the yam', body: 'Add the yam paste in small lumps. Simmer and swirl until they dissolve and the soup thickens slightly.', cues: { texture: 'Lightly thick, like a creamy broth. Not heavy.' }, about: '8–10 minutes', timer: { minutes: 8, label: 'Thicken with yam' }, media: [], ingredientIds: [],
      checkpoint: { question: 'How thick is it?', options: [
        { id: 'thin', label: 'Thin like water', verdict: 'wait', media: photo('Thin nsala.', 'onion'), guidance: 'Simmer a few minutes more, or add a little more yam paste.' },
        { id: 'right', label: 'Lightly creamy', verdict: 'good', media: photo('Correct nsala consistency.', 'onion'), guidance: 'Perfect.' },
      ] } },
    { id: 'ns5', phase: 'finish', title: 'Season and finish with utazi', body: 'Taste and add salt. Scatter in the sliced utazi and turn off the heat.', about: '1 minute', media: [], ingredientIds: ['utazi', 'salt'] },
    servedStep('ns6', 'onion', 'Nsala is best eaten fresh. Catfish doesn’t reheat as well as meat soups.'),
  ],
};

// ---------------------------------------------------------------------------
export const banga = {
  ...soupBase(),
  id: 'banga', slug: 'banga', title: 'Banga Soup', region: 'Nigeria (Delta)',
  subtitle: 'Rich palm-fruit soup with fresh fish and fragrant banga spices.',
  story: 'Banga is made from the cream of palm fruit, not palm oil. It’s rich, nutty and aromatic. In the Niger Delta it’s eaten with starch, and across Nigeria it’s loved with white rice as “banga rice”. Tinned palm cream makes it easy anywhere.',
  prepMinutes: 20, cookMinutes: 45, difficulty: 'Intermediate',
  allergens: ['Fish and shellfish (fish, crayfish)', STOCK_NOTE],
  hero: photo('Deep orange banga soup with fresh fish steaks and scent leaves. Overhead.', 'jollof', 'Banga soup'),
  serveWith: ['White rice', 'Eba', 'Starch (Delta swallow)'],
  ingredients: [
    ing('palm-cream', 'Palm fruit concentrate (banga cream)', 1, 'tin', 'African Ingredients', ['african-grocery', 'online'], { altQty: 800, altUnit: 'g', scale: 'whole', note: 'Sold in tins as “palm nut cream” or “sauce graine”.', substitutes: [{ name: 'Fresh palm fruits', note: 'Boil 1 kg until soft, pound, and squeeze out the cream with warm water.' }] }),
    ing('fish', 'Fresh fish (catfish or croaker), in steaks', 800, 'g', 'Meat & Fish', ['african-grocery', 'mainstream'], { substitutes: [{ name: 'Tilapia or any firm white fish', note: '' }] }),
    driedFish(150), meat(500, 'meat', 'Beef or goat (optional)', { optional: true }),
    ing('banga-spice', 'Banga spice mix', 1, 'tbsp', 'African Ingredients', ['african-grocery', 'online'], { note: 'A blend of oburunbebe stick, rohojie and other Delta spices, often sold ready-mixed.', substitutes: [{ name: 'Leave it out', note: 'Add 1 extra tbsp crayfish and a pinch of nutmeg. Simpler, but still good.' }] }),
    ing('scent-leaf', 'Scent leaves (or beletete), sliced', 6, 'leaf', 'African Ingredients', ['african-grocery'], { scale: 'whole', substitutes: [{ name: 'Fresh basil', note: 'Close relative, similar aroma.' }] }),
    crayfish(2), sb(2), onion(1), stockCubes(2), salt(1),
  ],
  steps: [
    { id: 'bg1', phase: 'prep', title: 'Clean the fish and cook the meat (if using)', body: 'Pour hot water over the fish and rub off any slime, then rinse. If you’re using meat, season and simmer it until tender first, as in our other soups.', about: '10 minutes (+35 for meat)', media: [], ingredientIds: ['fish', 'meat'] },
    soakFishStep('bg2'),
    { id: 'bg3', phase: 'cook', title: 'Cook the palm cream', body: 'Put the palm cream in a pot with 3 cups of water (or meat stock) and stir until smooth. Bring it to a boil and let it bubble steadily, stirring now and then.', cues: { see: 'It thickens and a layer of red oil starts to appear on top.' }, about: '15–20 minutes', timer: { minutes: 15, label: 'Cook palm cream' }, media: [photo('Palm cream boiling, red oil rising on top.', 'jollof')], ingredientIds: ['palm-cream'],
      checkpoint: { question: 'Can you see oil on top?', options: [
        { id: 'no', label: 'Not yet, still thin', verdict: 'wait', media: photo('Thin palm cream.', 'jollof'), guidance: 'Keep boiling, 5 more minutes.' },
        { id: 'yes', label: 'Thicker, oil rising', verdict: 'good', media: photo('Palm cream with oil rising.', 'jollof'), guidance: 'Perfect. Add the seasoning.' },
      ] } },
    { id: 'bg4', phase: 'cook', title: 'Add the spices and seasoning', body: 'Add the banga spice, scotch bonnet, crayfish, chopped onion, dried fish, meat (if using) and stock cubes. Simmer for 5 minutes.', about: '5 minutes', timer: { minutes: 5, label: 'Simmer with spices' }, media: [], ingredientIds: ['banga-spice', 'sb', 'crayfish', 'onion', 'dried-fish', 'stock-cubes'] },
    { id: 'bg5', phase: 'cook', title: 'Add the fresh fish', body: 'Lower the fish steaks into the soup. Simmer gently for 10 minutes without stirring. Swirl the pot instead, so the fish stays whole.', about: '10 minutes', timer: { minutes: 10, label: 'Cook the fish' }, media: [photo('Fish steaks in banga soup.', 'jollof')], ingredientIds: [] },
    { id: 'bg6', phase: 'finish', title: 'Finish with scent leaves', body: 'Add the sliced scent leaves, taste and add salt. Turn off the heat.', about: '1 minute', media: [], ingredientIds: ['scent-leaf', 'salt'] },
    servedStep('bg7', 'jollof', 'Try it as “banga rice”: spoon it over white rice instead of serving it with swallow.'),
  ],
};
