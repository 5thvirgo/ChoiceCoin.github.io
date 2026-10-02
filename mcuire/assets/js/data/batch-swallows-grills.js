// Swallows: Fufu, Semolina, Amala with Ewedu & Gbegiri.
// Grills: Mcuire Grilled Chicken, Grilled Tilapia, Asun, Fried Beef,
// Pepper Assorted Meat, Ata Dindin & Yaji.
import { photo, video, ing, sb, onion, redPeppers, stockCubes, salt, vegOil, fryOil, palmOil, crayfish, iru, STOCK_NOTE, hotOilTip, scotchTip } from './common.js';

const swallowBase = {
  status: 'complete', categoryId: 'soups', previewSteps: 0,
  baseServings: 4, servingOptions: [1, 2, 4, 6, 10], difficulty: 'Beginner friendly',
  serveWith: ['Egusi Soup', 'Ogbono Soup', 'Okra Soup', 'Efo Riro'],
};
const turnCheckpoint = (tone, thing) => ({
  question: 'How does it feel?', options: [
    { id: 'lumpy', label: 'Lumpy', verdict: 'wait', media: photo(`Lumpy ${thing}.`, tone), guidance: 'Keep pressing the lumps against the side of the pot with your spoon.' },
    { id: 'smooth', label: 'Smooth, holds its shape', verdict: 'good', media: photo(`Smooth ${thing}.`, tone), guidance: 'Perfect.' },
    { id: 'hard', label: 'Stiff and hard', verdict: 'fix', media: photo(`Stiff ${thing}.`, tone), guidance: 'Add 2–3 tablespoons of hot water and keep turning.' },
    { id: 'soft', label: 'Too soft', verdict: 'fix', media: photo(`Soft ${thing}.`, tone), guidance: 'Sprinkle in a little more flour and turn hard for another minute.' },
  ],
});
const shapeStep = (id, tone) => ({
  id, phase: 'finish', title: 'Shape and serve',
  body: 'Wet a small bowl or your hands with water and shape portions into smooth balls. Serve at once with soup, or wrap in cling film to keep warm.',
  media: [photo('Smooth shaped balls of swallow beside a bowl of soup.', tone)], ingredientIds: [],
});

// ---------------------------------------------------------------------------
export const fufu = {
  ...swallowBase,
  id: 'fufu', slug: 'fufu', title: 'Fufu', region: 'West Africa',
  subtitle: 'Soft, smooth, slightly tangy cassava swallow, made on the stove with fufu flour.',
  story: 'Traditional fufu is made from fermented cassava, which takes days. In Canada and the US most families use fufu flour, and it’s excellent. Unlike eba, fufu is cooked in a pot and turned until it goes from white to smooth and stretchy.',
  prepMinutes: 2, cookMinutes: 12,
  allergens: [], dietary: ['Vegan', 'Gluten-free'],
  hero: photo('Smooth, off-white balls of fufu beside a bowl of light soup. 45°.', 'rice', 'Fufu'),
  equipment: [{ name: 'Non-stick pot', note: '' }, { name: 'Strong wooden spoon', note: '' }, { name: 'Kettle', note: 'For hot water.' }],
  ingredients: [
    ing('fufu-flour', 'Cassava fufu flour', 2, 'cup', 'African Ingredients', ['african-grocery', 'online'], { altQty: 260, altUnit: 'g', note: 'Look for “cassava fufu” or “fufu flour”. Plantain fufu flour works the same way.', substitutes: [{ name: 'Plantain fufu flour', note: 'Same method.' }] }),
    ing('water', 'Water (cold, plus extra hot)', 2.5, 'cup', 'Other', ['mainstream'], { altQty: 600, altUnit: 'ml' }),
  ],
  steps: [
    { id: 'fu1', phase: 'prep', title: 'Mix the flour with cold water', body: 'Off the heat, put the fufu flour in the pot. Add 1 cup of cold water and stir until there are no dry lumps. It should be a smooth, thick paste.', why: 'Starting with cold water is what keeps fufu lump-free.', about: '2 minutes', media: [photo('Fufu flour and cold water mixed into a smooth paste in a pot.', 'rice')], ingredientIds: ['fufu-flour', 'water'] },
    { id: 'fu2', phase: 'cook', title: 'Cook and turn on medium heat', body: 'Put the pot on medium heat. Stir and turn constantly with the wooden spoon, pressing and folding. It will thicken quickly. Keep going, adding a splash of hot water if it gets too stiff.', cues: { see: 'It changes from bright white to slightly off-white and a little see-through.', texture: 'Smooth, soft and stretchy.' }, about: '5–8 minutes', timer: { minutes: 5, label: 'Turn the fufu' }, media: [video('15-second clip: turning fufu in a pot as it turns translucent and stretchy.', 'rice')], ingredientIds: [], tips: [{ kind: 'chef', text: 'Hold the pot handle with a cloth. It takes some arm strength.' }],
      checkpoint: { question: 'What does it look like?', options: [
        { id: 'raw', label: 'Bright white and pasty', verdict: 'wait', media: photo('Raw-looking white fufu.', 'rice'), guidance: 'Keep turning. It isn’t cooked yet.' },
        { id: 'done', label: 'Off-white, smooth, stretchy', verdict: 'good', media: photo('Cooked fufu, smooth and stretchy.', 'rice'), guidance: 'Nearly there. Now steam it.' },
      ] } },
    { id: 'fu3', phase: 'cook', title: 'Steam, then turn again', body: 'Pour ¼ cup of hot water over the fufu, cover the pot, turn the heat to low and steam for 2–3 minutes. Then turn it again firmly until smooth.', about: '3–4 minutes', timer: { minutes: 3, label: 'Steam the fufu' }, media: [], ingredientIds: [], checkpoint: turnCheckpoint('rice', 'fufu') },
    shapeStep('fu4', 'rice'),
  ],
};

// ---------------------------------------------------------------------------
export const semolina = {
  ...swallowBase,
  id: 'semolina', slug: 'semolina', title: 'Semolina', region: 'Nigeria',
  subtitle: 'The easiest swallow to start with: smooth, mild and lump-free.',
  story: 'Semolina (or “semo”) is the swallow many beginners start with: it’s quick, mild and forgiving. The only trick is to stop lumps forming, and we’ll show you how.',
  prepMinutes: 2, cookMinutes: 10,
  allergens: ['Wheat (gluten)'], dietary: ['Vegan'],
  hero: photo('Smooth pale yellow semolina balls beside egusi soup. 45°.', 'rice', 'Semolina'),
  equipment: [{ name: 'Medium pot with lid', note: '' }, { name: 'Wooden spoon', note: '' }],
  ingredients: [
    ing('semo', 'Semolina (or Semovita)', 2, 'cup', 'Pantry', ['mainstream', 'african-grocery'], { altQty: 340, altUnit: 'g', note: 'Fine semolina from any supermarket works.' }),
    ing('water', 'Water', 3, 'cup', 'Other', ['mainstream'], { altQty: 720, altUnit: 'ml' }),
  ],
  steps: [
    { id: 'se1', phase: 'cook', title: 'Boil the water', body: 'Bring 2½ cups of the water to a boil in the pot. Keep the rest aside.', about: '3 minutes', media: [], ingredientIds: ['water'] },
    { id: 'se2', phase: 'cook', title: 'Sprinkle in the semolina while stirring', body: 'Turn the heat to low. With one hand stirring fast, sprinkle in the semolina a little at a time with the other. Keep stirring until all of it is in.', why: 'Adding it slowly while stirring is what prevents lumps.', about: '2 minutes', media: [video('12-second clip: sprinkling semolina into hot water while stirring quickly.', 'rice')], ingredientIds: ['semo'] },
    { id: 'se3', phase: 'cook', title: 'Turn until thick and smooth', body: 'Turn and press the mixture against the side of the pot, folding it over, until it’s thick and smooth.', cues: { texture: 'Smooth and soft, pulling away from the sides of the pot.' }, about: '3–4 minutes', media: [], ingredientIds: [] },
    { id: 'se4', phase: 'cook', title: 'Steam, then turn again', body: 'Add the remaining ½ cup of water over the top, cover and steam on low for 3 minutes. Then turn it again for 1 minute until smooth.', about: '4 minutes', timer: { minutes: 3, label: 'Steam semolina' }, media: [], ingredientIds: [], checkpoint: turnCheckpoint('rice', 'semolina') },
    shapeStep('se5', 'rice'),
  ],
};

// ---------------------------------------------------------------------------
export const amala = {
  ...swallowBase,
  id: 'amala-ewedu-gbegiri', slug: 'amala-ewedu-gbegiri', title: 'Amala with Ewedu & Gbegiri', region: 'Nigeria (Yoruba)',
  subtitle: 'Dark yam-flour swallow with silky jute-leaf soup and smooth bean soup: Ibadan’s famous “abula”.',
  story: 'This is Ibadan’s pride: smooth brown amala served with two soups side by side. Ewedu is green and drawy, gbegiri is golden and creamy, and usually there’s a ladle of stew on top. Together they’re called “abula”.',
  prepMinutes: 45, cookMinutes: 75, difficulty: 'Intermediate', baseServings: 4,
  allergens: ['Fish and shellfish (crayfish)', STOCK_NOTE], dietary: ['Dairy-free', 'Gluten-free if your stock cubes are'],
  serveWith: ['White Rice & Nigerian Tomato Stew (the stew)', 'Fried Beef', 'Pepper Assorted Meat'],
  hero: photo('Brown amala with green ewedu and golden gbegiri side by side, red stew on top. Overhead.', 'egusi', 'Amala, ewedu and gbegiri'),
  equipment: [{ name: 'Three pots', note: 'One for each part.' }, { name: 'Blender', note: '' }, { name: 'Strong wooden spoon', note: '' }],
  ingredients: [
    ing('elubo', 'Yam flour (elubo)', 2, 'cup', 'African Ingredients', ['african-grocery', 'online'], { group: 'Amala', altQty: 250, altUnit: 'g', note: 'Brown-grey flour made from dried yam.', substitutes: [{ name: 'Plantain flour (amala ogede)', note: 'Same method, slightly sweeter.' }] }),
    ing('amala-water', 'Water for amala', 3, 'cup', 'Other', ['mainstream'], { group: 'Amala', altQty: 720, altUnit: 'ml' }),
    ing('ewedu', 'Ewedu (jute) leaves', 300, 'g', 'African Ingredients', ['african-grocery', 'online'], { group: 'Ewedu', note: 'Fresh or frozen. Frozen is often already chopped.', substitutes: [{ name: 'Frozen molokhia', note: 'The same leaf, sold in Middle Eastern grocery stores.' }] }),
    ing('baking-soda', 'Baking soda (pinch)', 0.25, 'tsp', 'Pantry', ['mainstream'], { group: 'Ewedu', optional: true, note: 'Keeps ewedu green and helps the draw. Traditionally potash (kaun) is used.' }),
    iru(1, 'iru', { group: 'Ewedu' }),
    ing('beans', 'Black-eyed beans (dry)', 1, 'cup', 'Rice & Grains', ['mainstream', 'african-grocery'], { group: 'Gbegiri', altQty: 200, altUnit: 'g', substitutes: [{ name: 'Peeled bean flour', note: 'Whisk 1 cup into 3 cups simmering water; cook 15 minutes.' }] }),
    palmOil(0.25, 'palm-oil', { group: 'Gbegiri' }),
    crayfish(2, 'crayfish'), sb(1), stockCubes(2), salt(1),
  ],
  steps: [
    { id: 'am1', phase: 'prep', title: 'Gbegiri: soak and peel the beans', body: 'Soak the beans for 30 minutes, then rub them between your palms underwater so the skins float off. Pour the skins away and repeat until mostly white (the same as our Moi Moi and Akara lessons).', about: '30 minutes + 15 to peel', timer: { minutes: 30, label: 'Soak beans' }, media: [photo('Peeled white beans after rubbing off skins.', 'rice')], ingredientIds: ['beans'] },
    { id: 'am2', phase: 'cook', title: 'Gbegiri: boil until falling apart', body: 'Boil the peeled beans in 4 cups of water until they are completely soft and falling apart. Add water if it gets low.', about: '40 minutes', timer: { minutes: 40, label: 'Boil the beans' }, media: [], ingredientIds: [] },
    { id: 'am3', phase: 'cook', title: 'Gbegiri: blend smooth and season', body: 'Mash the beans with a whisk, or blend them, until perfectly smooth. Return to the pot and add the palm oil, half the crayfish, the pepper, 1 stock cube and salt. Simmer for 10 minutes, stirring, until smooth and pourable.', cues: { texture: 'Smooth and creamy, like a thick soup that pours slowly.' }, about: '10 minutes', timer: { minutes: 10, label: 'Simmer gbegiri' }, media: [photo('Smooth golden gbegiri in a pot.', 'egusi')], ingredientIds: ['palm-oil', 'sb'],
      checkpoint: { question: 'How is the texture?', options: [
        { id: 'thick', label: 'Too thick to pour', verdict: 'fix', media: photo('Overly thick gbegiri.', 'egusi'), guidance: 'Whisk in hot water a little at a time.' },
        { id: 'right', label: 'Smooth, pours slowly', verdict: 'good', media: photo('Correct gbegiri.', 'egusi'), guidance: 'Perfect.' },
        { id: 'grainy', label: 'Grainy', verdict: 'wait', media: photo('Grainy gbegiri.', 'egusi'), guidance: 'Blend or whisk again. The beans may need 10 more minutes of boiling first.' },
      ] } },
    { id: 'am4', phase: 'cook', title: 'Ewedu: cook the leaves', body: 'Pick the leaves off the stems (if fresh) and wash them. Bring 1 cup of water to a boil with the pinch of baking soda. Add the leaves and cook for 5 minutes.', about: '5 minutes', timer: { minutes: 5, label: 'Cook ewedu' }, media: [], ingredientIds: ['ewedu', 'baking-soda'] },
    { id: 'am5', phase: 'cook', title: 'Ewedu: blend until drawy, then season', body: 'Blend the ewedu with its water in short pulses until finely chopped and slimy. Don’t over-blend into a juice. (Traditionally it’s whisked in the pot with an ijabe broom.) Return it to the pot, add the iru, the remaining crayfish, 1 stock cube and salt, and warm for 2 minutes.', cues: { see: 'Bright green and silky, with stretchy strands.' }, about: '3 minutes', media: [video('10-second clip: pulsing ewedu until finely chopped and drawy.', 'leaf')], ingredientIds: ['iru', 'crayfish', 'stock-cubes', 'salt'],
      checkpoint: { question: 'Does it look like this?', options: [
        { id: 'right', label: 'Green and drawy', verdict: 'good', media: photo('Green, drawy ewedu.', 'leaf'), guidance: 'Perfect.' },
        { id: 'brown', label: 'Brown or dull', verdict: 'fix', media: photo('Overcooked brown ewedu.', 'egusi'), guidance: 'It was cooked too long. Still edible. Next time keep it to 5 minutes.' },
      ] } },
    { id: 'am6', phase: 'cook', title: 'Amala: make it last', body: 'Boil 2½ cups of water. Turn the heat to low and add the yam flour all at once. Immediately turn and press it hard with the wooden spoon until smooth, about 2–3 minutes. Pour the remaining ½ cup of hot water around the edge, cover for 2 minutes, then turn again until smooth and stretchy.', why: 'Amala gets lumpy if you hesitate. Have everything ready and work fast.', cues: { see: 'Smooth, dark brown, glossy.' }, about: '5–6 minutes', timer: { minutes: 2, label: 'Steam amala' }, media: [video('15-second clip: turning amala vigorously until smooth.', 'egusi')], ingredientIds: ['elubo', 'amala-water'], checkpoint: turnCheckpoint('egusi', 'amala') },
    { id: 'am7', phase: 'finish', title: 'Serve as “abula”', body: 'Put a portion of amala on each plate. Spoon ewedu on one side and gbegiri on the other, then add a ladle of stew and meat on top if you have it. Eat with your right hand.', media: [photo('Mcuire abula: amala, ewedu, gbegiri, stew and meat.', 'egusi')], ingredientIds: [], tips: [{ kind: 'mcuire', text: 'Use the stew from our Rice & Stew lesson. A spoonful turns this into the full Ibadan experience.' }] },
  ],
};

// ===========================================================================
const grillBase = {
  status: 'complete', categoryId: 'grills', previewSteps: 0,
  baseServings: 6, servingOptions: [2, 4, 6, 10, 15, 20],
  dietary: ['Dairy-free', 'Gluten-free if your stock cubes are'],
};
const ginger = (g = 30) => ing('ginger', 'Fresh ginger', g, 'g', 'Produce', ['mainstream'], { note: 'About a thumb-sized piece.', substitutes: [{ name: '1 tsp ground ginger', note: '' }] });
const garlic = (n = 4) => ing('garlic', 'Garlic', n, 'clove', 'Produce', ['mainstream'], { scale: 'whole', substitutes: [{ name: '1 tsp garlic powder', note: '' }] });
const thyme = () => ing('thyme', 'Dried thyme', 1, 'tsp', 'Spices');
const curry = () => ing('curry', 'Nigerian-style curry powder', 1, 'tsp', 'Spices', ['african-grocery', 'online'], { substitutes: [{ name: 'Mild curry powder', note: '' }] });

const pepperSauceSteps = (prefix, minutes = 10) => [
  { id: `${prefix}-ps1`, phase: 'cook', title: 'Make the pepper sauce', body: 'Blend the red peppers, scotch bonnets and one onion roughly. Heat 3 tablespoons of oil in a wide pan, add the sliced onion and cook for 2 minutes, then pour in the pepper blend. Fry, stirring often, until the water cooks off and the sauce is thick and glossy.', cues: { see: 'Thick, shiny red sauce with oil at the edges.' }, about: `${minutes}–${minutes + 2} minutes`, timer: { minutes, label: 'Fry pepper sauce' }, media: [photo('Thick glossy pepper sauce in a pan.', 'jollof')], ingredientIds: ['rbp', 'sb', 'oil'], tips: [scotchTip],
    checkpoint: { question: 'How does your sauce look?', options: [
      { id: 'watery', label: 'Still watery', verdict: 'wait', media: photo('Watery pepper sauce.', 'jollof'), guidance: 'Keep frying for 3–5 more minutes.' },
      { id: 'glossy', label: 'Thick and glossy', verdict: 'good', media: photo('Glossy pepper sauce.', 'jollof'), guidance: 'Perfect.' },
    ] } },
];

// ---------------------------------------------------------------------------
export const grilledChicken = {
  ...grillBase,
  id: 'grilled-chicken', slug: 'grilled-chicken', title: 'Mcuire Grilled Chicken', region: 'West Africa',
  subtitle: 'Marinated in ginger, garlic and pepper, roasted juicy and finished with a sticky, charred glaze.',
  story: 'This is the grilled chicken from the Mcuire kitchen: a bold West African marinade that soaks right into the meat, then a hot finish for crisp, charred skin. Your oven does it perfectly; a barbecue makes it even better.',
  prepMinutes: 20, cookMinutes: 50, difficulty: 'Beginner friendly',
  allergens: [STOCK_NOTE],
  hero: photo('Grilled chicken thighs with charred, glossy skin on a board with lime and onions. 45°.', 'suya', 'Grilled chicken'),
  serveWith: ['Nigerian Party Jollof Rice', 'Coconut Rice', 'Fried Plantain (Dodo)', 'Salad'],
  equipment: [{ name: 'Blender', note: '' }, { name: 'Roasting tray with a wire rack', note: '' }, { name: 'Large bowl or zip bag', note: 'For marinating.' }, { name: 'Meat thermometer', note: 'Optional, but very helpful.' }],
  ingredients: [
    ing('chicken', 'Chicken thighs and drumsticks, skin on', 1.5, 'kg', 'Meat & Fish', ['mainstream'], { substitutes: [{ name: 'Whole chicken, spatchcocked', note: 'Roast 45–55 minutes.' }] }),
    onion(1), garlic(4), ginger(30), sb(1),
    ing('lemon', 'Lemon juice', 2, 'tbsp', 'Produce', ['mainstream']),
    vegOil(3, 'tbsp'),
    ing('paprika', 'Smoked paprika', 2, 'tsp', 'Spices'),
    curry(), thyme(), stockCubes(2), salt(1),
    ing('honey', 'Honey (for the glaze)', 2, 'tbsp', 'Pantry', ['mainstream'], { optional: true }),
  ],
  steps: [
    { id: 'gc1', phase: 'prep', title: 'Blend the marinade', body: 'Blend the onion, garlic, ginger, scotch bonnet, lemon juice, oil, paprika, curry, thyme, crumbled stock cubes and salt until smooth. Keep 2 tablespoons aside for the glaze.', about: '5 minutes', media: [photo('Orange-red marinade in a blender jug.', 'jollof')], ingredientIds: ['onion', 'garlic', 'ginger', 'sb', 'lemon', 'oil', 'paprika', 'curry', 'thyme', 'stock-cubes', 'salt'], tips: [scotchTip] },
    { id: 'gc2', phase: 'prep', title: 'Score and marinate', body: 'Pat the chicken dry. Make 2–3 cuts into each piece, down to the bone. Rub the marinade all over and into the cuts. Cover and refrigerate for at least 1 hour, ideally overnight.', why: 'The cuts let the flavour reach the bone and help the chicken cook evenly.', about: '1 hour to overnight', timer: { minutes: 60, label: 'Marinate chicken' }, media: [video('10-second clip: scoring chicken and rubbing marinade into the cuts.', 'suya')], ingredientIds: ['chicken'] },
    { id: 'gc3', phase: 'cook', title: 'Heat the oven', body: 'Take the chicken out of the fridge 20 minutes before cooking. Heat the oven to 200°C (400°F). Put the chicken on a rack over a foil-lined tray, skin side up.', about: '20 minutes', timer: { minutes: 20, label: 'Chicken warms, oven heats' }, media: [], ingredientIds: [] },
    { id: 'gc4', phase: 'cook', title: 'Roast, turning once', body: 'Roast for 20 minutes, turn the pieces, and roast for another 15–20 minutes.', about: '35–40 minutes', timer: { minutes: 20, label: 'Roast, first side' }, media: [photo('Chicken roasting on a rack, skin browning.', 'suya')], ingredientIds: [],
      tips: [{ kind: 'ready', text: 'Juices run clear when pierced at the thickest part, with no pink by the bone. With a thermometer: 74°C (165°F).' }] },
    { id: 'gc5', phase: 'cook', title: 'Glaze and char', body: 'Mix the honey with the 2 tablespoons of marinade you kept. Brush it over the chicken. Switch the oven to the grill (broiler) on high and grill for 3–5 minutes until the edges char.', about: '3–5 minutes', timer: { minutes: 3, label: 'Char the chicken' }, media: [photo('Glazed chicken with charred edges under the grill.', 'suya')], ingredientIds: ['honey'],
      checkpoint: { question: 'How does your chicken look?', options: [
        { id: 'pale', label: 'Golden, no char', verdict: 'wait', media: photo('Golden chicken without char.', 'plantain'), guidance: 'Another 1–2 minutes under the grill.' },
        { id: 'charred', label: 'Glossy with charred edges', verdict: 'good', media: photo('Perfectly charred grilled chicken.', 'suya'), guidance: 'Perfect.' },
        { id: 'burnt', label: 'Black and bitter', verdict: 'fix', media: photo('Burnt glaze.', 'suya'), guidance: 'Honey burns fast. Next time move the tray down a shelf and check after 2 minutes.' },
      ] } },
    { id: 'gc6', phase: 'finish', title: 'Rest and serve', body: 'Rest the chicken for 5 minutes so the juices settle, then serve with jollof, coconut rice or dodo.', about: '5 minutes', timer: { minutes: 5, label: 'Rest chicken' }, media: [photo('Mcuire grilled chicken plated with jollof and dodo.', 'suya')], ingredientIds: [] },
  ],
};

// ---------------------------------------------------------------------------
export const grilledFish = {
  ...grillBase,
  id: 'grilled-fish', slug: 'grilled-fish', title: 'Grilled Tilapia', region: 'West Africa',
  subtitle: 'Whole fish rubbed with a pepper and ginger paste, grilled with crisp skin and tender flesh.',
  story: 'Whole grilled tilapia is a West African “point and kill” favourite: you choose your fish, and it’s grilled over open flame with a fiery pepper rub. We’ll show you how to keep the flesh moist and the skin from sticking.',
  prepMinutes: 45, cookMinutes: 25, difficulty: 'Beginner friendly',
  baseServings: 4, servingOptions: [2, 4, 6, 8, 12],
  allergens: ['Fish', STOCK_NOTE],
  hero: photo('Two whole grilled tilapia with charred skin and red pepper rub, lemon and onions. Overhead.', 'suya', 'Grilled tilapia'),
  serveWith: ['Fried Plantain (Dodo)', 'Nigerian Party Jollof Rice', 'Banku or kenkey', 'Sliced onions and tomato'],
  equipment: [{ name: 'Sharp knife', note: '' }, { name: 'Blender', note: '' }, { name: 'Baking tray, foil and wire rack', note: '' }, { name: 'Wide spatula', note: 'For turning the fish.' }],
  ingredients: [
    ing('tilapia', 'Whole tilapia, cleaned and scaled', 2, '', 'Meat & Fish', ['african-grocery', 'international', 'mainstream'], { scale: 'whole', note: 'About 600 g each. Ask the fishmonger to clean and scale them.', substitutes: [{ name: 'Whole sea bream, snapper or mackerel', note: '' }] }),
    onion(0.5, 'onion', { scale: 'linear' }), garlic(3), ginger(20), sb(1), redPeppers(1),
    ing('lemon', 'Lemon', 1, '', 'Produce', ['mainstream'], { scale: 'whole' }),
    vegOil(3, 'tbsp'), ing('paprika', 'Paprika', 1, 'tsp', 'Spices'), stockCubes(1), salt(1),
  ],
  steps: [
    { id: 'gf1', phase: 'prep', title: 'Score the fish', body: 'Rinse the fish inside and out and pat it completely dry. Cut 3 deep diagonal slits on each side, right down to the bone.', why: 'The slits help the fish cook evenly and let the flavour in.', about: '5 minutes', media: [video('8-second clip: scoring deep diagonal slits in a tilapia.', 'suya')], ingredientIds: ['tilapia'] },
    { id: 'gf2', phase: 'prep', title: 'Rub and marinate', body: 'Blend the onion, garlic, ginger, scotch bonnet, red pepper, the juice of half the lemon, oil, paprika, stock cube and salt into a paste. Rub it all over the fish, inside the belly and deep into the slits. Rest for 30 minutes.', about: '30 minutes', timer: { minutes: 30, label: 'Marinate fish' }, media: [photo('Tilapia coated in red pepper paste, paste pushed into slits.', 'jollof')], ingredientIds: ['onion', 'garlic', 'ginger', 'sb', 'rbp', 'lemon', 'oil', 'paprika', 'stock-cubes', 'salt'], tips: [scotchTip] },
    { id: 'gf3', phase: 'cook', title: 'Heat the oven and oil the rack', body: 'Heat the oven to 220°C (425°F). Line a tray with foil and set a wire rack on it. Brush the rack generously with oil.', why: 'An oiled rack stops the skin sticking and tearing.', about: '10 minutes', media: [], ingredientIds: [] },
    { id: 'gf4', phase: 'cook', title: 'Roast, then turn carefully', body: 'Lay the fish on the rack and roast for 12 minutes. Using a wide spatula, carefully turn each fish and roast for 10 minutes more. For extra char, finish under the grill (broiler) for 2–3 minutes.', about: '22–25 minutes', timer: { minutes: 12, label: 'Roast, first side' }, media: [photo('Fish turned on the rack, skin crisp and charred.', 'suya')], ingredientIds: [],
      checkpoint: { question: 'Check the thickest part near the bone', options: [
        { id: 'raw', label: 'Glassy, see-through', verdict: 'wait', media: photo('Undercooked fish, translucent flesh.', 'onion'), guidance: 'Roast 3–5 minutes more and check again.' },
        { id: 'done', label: 'White, flakes easily', verdict: 'good', media: photo('Cooked fish flaking from the bone.', 'onion'), guidance: 'Perfect. The eyes will also have turned white.' },
      ] } },
    { id: 'gf5', phase: 'finish', title: 'Serve', body: 'Squeeze over the rest of the lemon. Serve whole with sliced onions, tomatoes and dodo, jollof or banku.', media: [photo('Mcuire plating: grilled tilapia with dodo and onions.', 'suya')], ingredientIds: [] },
  ],
};

// ---------------------------------------------------------------------------
export const asun = {
  ...grillBase,
  id: 'goat-meat', slug: 'goat-meat', title: 'Peppered Goat Meat (Asun)', region: 'Nigeria (Yoruba)',
  subtitle: 'Tender goat, grilled until smoky, then tossed in a fiery pepper sauce: the party favourite.',
  story: 'Asun is the dish people crowd around at Yoruba parties: smoky, spicy, chewy goat meat with the skin on. First the goat is cooked tender, then grilled for smoke, then tossed in pepper. At home, your oven’s grill gives you the smoke.',
  prepMinutes: 20, cookMinutes: 90, difficulty: 'Intermediate',
  allergens: [STOCK_NOTE],
  hero: photo('Asun: small charred goat pieces glossy with red pepper, onion rings on top. 45°.', 'suya', 'Peppered goat meat'),
  serveWith: ['Cold drinks', 'Party small chops', 'Nigerian Party Jollof Rice'],
  equipment: [{ name: 'Large pot', note: '' }, { name: 'Baking tray with rack', note: '' }, { name: 'Wide frying pan', note: '' }, { name: 'Blender', note: '' }],
  ingredients: [
    ing('goat', 'Goat meat with skin, in small pieces', 1.2, 'kg', 'Meat & Fish', ['african-grocery', 'international'], { note: 'Ask for small, bite-size pieces. The skin is part of the joy.', substitutes: [{ name: 'Lamb shoulder', note: 'Shorter cooking: about 35 minutes in step 1.' }] }),
    onion(3, 'onion', { name: 'Onions (1 for boiling, 1 blended, 1 in rings)' }), ginger(20), garlic(3),
    redPeppers(2), sb(4, 'sb', { note: 'Asun is meant to be fiery. Use 2 for medium.' }),
    vegOil(3, 'tbsp'), stockCubes(3), salt(1),
  ],
  steps: [
    { id: 'as1', phase: 'cook', title: 'Season and cook the goat until tender', body: 'Put the goat in a pot with one chopped onion, the ginger, garlic, 2 crumbled stock cubes, salt and ½ cup of water. Cover and steam for 10 minutes, then add water to just cover and simmer until tender. Keep the stock.', cues: { texture: 'Tender but still a little chewy. It shouldn’t fall apart.' }, about: '50–60 minutes', timer: { minutes: 50, label: 'Cook goat' }, media: [photo('Goat pieces simmering with onion and ginger.', 'suya')], ingredientIds: ['goat', 'ginger', 'garlic', 'stock-cubes', 'salt'] },
    { id: 'as2', phase: 'cook', title: 'Grill for smoke and char', body: 'Heat the oven grill (broiler) to high. Drain the goat and spread it on a rack over a tray. Grill for 10–12 minutes, turning halfway, until the edges are browned and charred. (On a barbecue, use a grill basket.)', cues: { smell: 'Smoky and roasted.' }, about: '10–12 minutes', timer: { minutes: 10, label: 'Grill the goat' }, media: [photo('Goat pieces charring under the grill.', 'suya')], ingredientIds: [],
      checkpoint: { question: 'How does it look?', options: [
        { id: 'pale', label: 'Grey, no colour', verdict: 'wait', media: photo('Pale grilled goat.', 'suya'), guidance: 'Give it a few minutes more, closer to the heat.' },
        { id: 'charred', label: 'Browned, charred edges', verdict: 'good', media: photo('Charred goat pieces.', 'suya'), guidance: 'Perfect smoky char.' },
      ] } },
    ...pepperSauceSteps('as', 8),
    { id: 'as3', phase: 'finish', title: 'Toss together', body: 'Add the grilled goat and 3 tablespoons of the goat stock to the pepper sauce. Toss over medium heat for 3 minutes until every piece is coated. Top with onion rings.', about: '3 minutes', timer: { minutes: 3, label: 'Toss asun' }, media: [video('8-second clip: tossing charred goat in pepper sauce.', 'suya')], ingredientIds: [] },
    { id: 'as4', phase: 'finish', title: 'Serve hot', body: 'Serve straight away, with toothpicks for a party or as a side with jollof.', media: [photo('Mcuire asun in a bowl with toothpicks.', 'suya')], ingredientIds: [] },
  ],
};

// ---------------------------------------------------------------------------
export const friedBeef = {
  ...grillBase,
  id: 'beef-stew-meat', slug: 'beef-stew-meat', title: 'Fried Beef', region: 'Nigeria',
  subtitle: 'Seasoned, cooked tender, then fried golden: the meat that goes in stew and on every party plate.',
  story: 'Nigerian fried beef is boiled in seasoning first, so it’s tender and tasty right through. Then it’s fried for a golden, chewy crust. Eat it as a snack, add it to stew, or serve it at parties. The stock it leaves behind is gold for jollof.',
  prepMinutes: 10, cookMinutes: 70, difficulty: 'Beginner friendly',
  allergens: [STOCK_NOTE],
  hero: photo('Golden-brown fried beef cubes with crisp edges, in a bowl. 45°.', 'suya', 'Fried beef'),
  serveWith: ['White Rice & Nigerian Tomato Stew', 'Nigerian Party Jollof Rice', 'As a snack'],
  equipment: [{ name: 'Pot with lid', note: '' }, { name: 'Deep frying pan', note: '' }, { name: 'Slotted spoon', note: '' }, { name: 'Paper towels', note: '' }],
  ingredients: [
    ing('beef', 'Beef (chuck or stewing beef), in 4 cm cubes', 1.2, 'kg', 'Meat & Fish', ['mainstream']),
    onion(1), garlic(3), ginger(20), thyme(), curry(), stockCubes(2), salt(1), fryOil(),
  ],
  steps: [
    { id: 'fb1', phase: 'cook', title: 'Season and steam the beef', body: 'Put the beef in a pot with the chopped onion, garlic, ginger, thyme, curry, crumbled stock cubes and salt. Mix well with your hands. Cover and cook on medium-low in its own juices.', about: '10 minutes', timer: { minutes: 10, label: 'Steam the beef' }, media: [photo('Seasoned beef releasing juices in the pot.', 'suya')], ingredientIds: ['beef', 'onion', 'garlic', 'ginger', 'thyme', 'curry', 'stock-cubes', 'salt'] },
    { id: 'fb2', phase: 'cook', title: 'Simmer until tender', body: 'Add 2 cups of water and simmer, covered, until the beef is tender but still holds its shape.', cues: { texture: 'A fork goes in with light pressure. Not falling apart.' }, about: '40–50 minutes', timer: { minutes: 40, label: 'Simmer the beef' }, media: [], ingredientIds: [], tips: [{ kind: 'watch', text: 'Don’t let it go too soft, or it will break up in the frying pan.' }] },
    { id: 'fb3', phase: 'prep', title: 'Drain and dry', body: 'Lift the beef out and let it cool and dry on a tray for 5 minutes. Pour the stock into a jar and keep it for stew or jollof.', about: '5 minutes', timer: { minutes: 5, label: 'Dry the beef' }, media: [], ingredientIds: [], tips: [{ kind: 'mcuire', text: 'That stock is liquid gold. It freezes for 3 months.' }] },
    { id: 'fb4', phase: 'cook', title: 'Fry until golden', body: 'Heat 3 cm of oil in a deep pan to about 175°C (a wooden spoon handle bubbles steadily). Fry the beef in batches, turning, until deep golden-brown with crisp edges.', about: '5–7 minutes per batch', timer: { minutes: 5, label: 'Fry beef batch' }, media: [video('10-second clip: frying beef cubes until golden.', 'suya')], ingredientIds: ['fry-oil'], tips: [hotOilTip, { kind: 'watch', text: 'Dry the beef well first. Wet meat makes oil spit.' }],
      checkpoint: { question: 'What colour is it?', options: [
        { id: 'pale', label: 'Pale brown', verdict: 'wait', media: photo('Pale fried beef.', 'onion'), guidance: 'Another 1–2 minutes.' },
        { id: 'golden', label: 'Deep golden, crisp edges', verdict: 'good', media: photo('Perfect fried beef.', 'suya'), guidance: 'Perfect. Out onto paper towels.' },
      ] } },
    { id: 'fb5', phase: 'finish', title: 'Drain and serve', body: 'Drain on paper towels. Eat as a snack, add to stew, or serve alongside jollof.', media: [photo('Mcuire fried beef bowl.', 'suya')], ingredientIds: [] },
  ],
};

// ---------------------------------------------------------------------------
export const assortedMeat = {
  ...grillBase,
  id: 'assorted-meat', slug: 'assorted-meat', title: 'Pepper Assorted Meat', region: 'Nigeria',
  subtitle: 'Shaki, cow skin, cow foot and beef: cleaned, cooked tender and tossed in hot pepper sauce.',
  story: 'Assorted meat (“orisirisi”) is a mix of beef and offal, loved for its different textures: chewy shaki, soft cow skin, rich cow foot. The secret is cooking the toughest pieces first so everything finishes tender together.',
  prepMinutes: 30, cookMinutes: 110, difficulty: 'Intermediate',
  allergens: [STOCK_NOTE],
  hero: photo('Pepper assorted meat: shaki, cow skin, beef glossy with red pepper sauce. 45°.', 'suya', 'Pepper assorted meat'),
  serveWith: ['Party small chops', 'Nigerian Party Jollof Rice', 'White Rice & Nigerian Tomato Stew'],
  equipment: [{ name: 'Large pot', note: '' }, { name: 'Wide frying pan', note: '' }, { name: 'Blender', note: '' }, { name: 'Sharp knife', note: '' }],
  ingredients: [
    ing('cow-foot', 'Cow foot, cut in pieces', 500, 'g', 'Frozen', ['african-grocery'], { substitutes: [{ name: 'Oxtail', note: 'Rich and tender. Same cooking time.' }] }),
    ing('shaki', 'Shaki (tripe), cleaned', 400, 'g', 'Frozen', ['african-grocery', 'international'], { note: 'Often sold cleaned and frozen.' }),
    ing('ponmo', 'Ponmo (cow skin)', 300, 'g', 'African Ingredients', ['african-grocery'], { optional: true }),
    ing('beef', 'Beef, in chunks', 400, 'g', 'Meat & Fish', ['mainstream']),
    onion(2, 'onion', { name: 'Onions (1 for boiling, 1 sliced)' }), stockCubes(3), salt(1),
    redPeppers(2), sb(3), vegOil(3, 'tbsp'),
  ],
  steps: [
    { id: 'am1', phase: 'prep', title: 'Clean the meats', body: 'Rinse everything in warm water. Rub the shaki with a little salt and rinse again. If the ponmo is dried, soak it in hot water for 30 minutes and scrape off any dark bits with a knife. Cut everything into bite-size pieces.', about: '20 minutes', media: [photo('Cleaned shaki, ponmo, cow foot and beef on a board.', 'onion')], ingredientIds: ['shaki', 'ponmo'] },
    { id: 'am2', phase: 'cook', title: 'Cow foot first', body: 'Cow foot takes the longest. Put it in a pot with half an onion, 1 stock cube, salt and water to cover. Boil, covered.', about: '40 minutes', timer: { minutes: 40, label: 'Boil cow foot' }, media: [], ingredientIds: ['cow-foot'] },
    { id: 'am3', phase: 'cook', title: 'Add the rest and cook until tender', body: 'Add the shaki, ponmo, beef, another stock cube and more water if needed. Simmer until everything is tender.', cues: { texture: 'Shaki is soft-chewy, ponmo is soft, the beef is tender.' }, about: '30–40 minutes', timer: { minutes: 30, label: 'Simmer everything' }, media: [photo('Assorted meats simmering together.', 'suya')], ingredientIds: ['beef', 'stock-cubes', 'salt'],
      checkpoint: { question: 'Bite a piece of shaki', options: [
        { id: 'tough', label: 'Rubbery and tough', verdict: 'wait', media: photo('Tough shaki.', 'onion'), guidance: 'Simmer 15 minutes more.' },
        { id: 'right', label: 'Pleasantly chewy', verdict: 'good', media: photo('Tender shaki.', 'onion'), guidance: 'Perfect. Shaki always keeps a little chew.' },
      ] } },
    ...pepperSauceSteps('ast', 10),
    { id: 'am4', phase: 'finish', title: 'Toss and serve', body: 'Drain the meats (keep the stock) and toss them in the pepper sauce with a splash of stock for 5 minutes. Taste for salt and serve.', about: '5 minutes', timer: { minutes: 5, label: 'Toss in sauce' }, media: [photo('Mcuire pepper assorted meat, ready to serve.', 'suya')], ingredientIds: [] },
  ],
};

// ---------------------------------------------------------------------------
export const ataDindin = {
  ...grillBase,
  id: 'pepper-sauce', slug: 'pepper-sauce', title: 'Ata Dindin & Yaji', region: 'Nigeria',
  subtitle: 'Two essentials for your fridge and pantry: slow-fried pepper sauce and suya spice.',
  story: 'Ata dindin is slow-fried pepper sauce. Keep a jar in the fridge and you can upgrade rice, yam, eggs, bread or grilled meat in seconds. Yaji is suya spice: sprinkle it on anything grilled. Make both once and use them for weeks.',
  prepMinutes: 15, cookMinutes: 40, difficulty: 'Beginner friendly',
  baseServings: 10, servingOptions: [5, 10, 20],
  allergens: ['Peanuts (yaji)', 'Fish and shellfish (crayfish, optional)', STOCK_NOTE],
  dietary: ['Dairy-free', 'Vegan without crayfish (use vegan stock cubes)'],
  hero: photo('A jar of deep red ata dindin and a jar of reddish-brown yaji, spoon resting on top. 45°.', 'jollof', 'Ata dindin and yaji'),
  serveWith: ['Boiled yam or plantain', 'White rice', 'Bread and eggs', 'Grilled meats'],
  equipment: [{ name: 'Blender', note: '' }, { name: 'Heavy pot', note: '' }, { name: 'Clean glass jars', note: '' }],
  ingredients: [
    redPeppers(4, 'rbp', { group: 'Ata dindin' }), sb(4, 'sb', { group: 'Ata dindin' }),
    onion(2, 'onion', { group: 'Ata dindin', name: 'Onions (1 blended, 1 sliced)' }),
    vegOil(1, 'cup', 'oil', { group: 'Ata dindin', altQty: 240, altUnit: 'ml', note: 'Plenty of oil is what preserves the sauce.' }),
    crayfish(1, 'crayfish', { group: 'Ata dindin', optional: true }),
    stockCubes(2, 'stock-cubes', { group: 'Ata dindin' }), salt(1),
    ing('kuli', 'Kuli-kuli or ground roasted peanuts', 0.5, 'cup', 'African Ingredients', ['african-grocery', 'online', 'mainstream'], { group: 'Yaji', altQty: 70, altUnit: 'g', substitutes: [{ name: 'Unsalted roasted peanuts, pulsed to powder', note: 'Pulse in short bursts so it doesn’t become peanut butter.' }] }),
    ing('ginger-powder', 'Ground ginger', 1, 'tsp', 'Spices', ['mainstream'], { group: 'Yaji' }),
    ing('garlic-powder', 'Garlic powder', 1, 'tsp', 'Spices', ['mainstream'], { group: 'Yaji' }),
    ing('paprika', 'Smoked paprika', 1, 'tbsp', 'Spices', ['mainstream'], { group: 'Yaji' }),
    ing('cayenne', 'Cayenne pepper', 1.5, 'tsp', 'Spices', ['mainstream'], { group: 'Yaji', scale: 'taste' }),
  ],
  steps: [
    { id: 'ad1', phase: 'prep', title: 'Blend the peppers roughly', body: 'Blend the red peppers, scotch bonnets and one onion for a few seconds. Keep it a little coarse.', about: '2 minutes', media: [photo('Coarse red pepper blend.', 'jollof')], ingredientIds: ['rbp', 'sb'], tips: [scotchTip] },
    { id: 'ad2', phase: 'cook', title: 'Boil off the water', body: 'Cook the blend in a dry pot on medium-high, uncovered, stirring now and then, until most of the water has gone and it’s thick.', about: '10 minutes', timer: { minutes: 10, label: 'Boil down peppers' }, media: [], ingredientIds: [] },
    { id: 'ad3', phase: 'cook', title: 'Fry slowly in oil', body: 'Heat the oil in a heavy pot on medium. Add the sliced onion and cook 3 minutes. Add the thick pepper and fry on medium-low, stirring every few minutes, until it turns a deep, dark red and the oil separates clearly.', why: 'Long, slow frying is what makes ata dindin sweet, smoky and long-lasting.', cues: { see: 'Deep brick-red sauce sitting in a layer of clear red oil.', smell: 'Sweet and roasted.' }, about: '20–25 minutes', timer: { minutes: 20, label: 'Fry ata dindin' }, media: [photo('Deep red pepper sauce fried with oil separated.', 'jollof')], ingredientIds: ['oil'],
      checkpoint: { question: 'What colour is your sauce?', options: [
        { id: 'bright', label: 'Bright red, wet', verdict: 'wait', media: photo('Bright, still-wet pepper.', 'jollof'), guidance: 'Keep frying. It needs time.' },
        { id: 'deep', label: 'Deep red, oil separated', verdict: 'good', media: photo('Deep red ata dindin.', 'jollof'), guidance: 'Perfect.' },
        { id: 'dark', label: 'Brown, smells burnt', verdict: 'fix', media: photo('Burnt pepper sauce.', 'suya'), guidance: 'The heat was too high. Turn it down and stir more often next time.' },
      ] } },
    { id: 'ad4', phase: 'finish', title: 'Season, cool and jar', body: 'Stir in the crayfish, crumbled stock cubes and salt and cook for 2 more minutes. Let it cool completely, then spoon it into clean jars with a layer of oil on top.', about: '20 minutes cooling', timer: { minutes: 20, label: 'Cool the sauce' }, media: [photo('Ata dindin in a jar with oil on top.', 'jollof')], ingredientIds: ['crayfish', 'stock-cubes', 'salt'], tips: [{ kind: 'kitchen', text: 'Keeps 2 weeks in the fridge. Always use a clean, dry spoon and keep it covered with oil.' }] },
    { id: 'ad5', phase: 'prep', title: 'Mix the yaji', body: 'Mix the kuli-kuli, ginger, garlic powder, paprika and cayenne. Rub between your fingers to break up lumps and store in a sealed jar.', about: '5 minutes', media: [photo('Yaji spice in a jar.', 'suya')], ingredientIds: ['kuli', 'ginger-powder', 'garlic-powder', 'paprika', 'cayenne'], tips: [{ kind: 'mcuire', text: 'Sprinkle yaji on grilled chicken, roasted corn, fried eggs or popcorn. It’s addictive.' }] },
  ],
};
