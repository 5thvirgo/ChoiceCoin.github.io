// Seed content for Mcuire Kitchen.
// This is the default catalogue. Admins edit it through #/admin (stored per
// browser in demo mode, or in the database when dataSource = 'api').
// Prices live ONLY here / in the courses table, never in view code.

// MediaRef helper. src stays null until Mcuire uploads its own photography.
// `brief` doubles as the photographer's shot list.
const photo = (brief, tone = 'jollof', alt = brief) => ({ kind: 'photo', src: null, alt, brief, tone });
const video = (brief, tone = 'jollof', alt = brief) => ({ kind: 'video', src: null, poster: null, alt, brief, tone });

export const SHOP_CATEGORIES = [
  'Produce', 'Meat & Fish', 'Rice & Grains', 'African Ingredients', 'Spices', 'Pantry', 'Frozen', 'Other',
];

export const AVAILABILITY = {
  'african-grocery': 'African grocery stores',
  international: 'International supermarkets',
  mainstream: 'Mainstream supermarkets',
  online: 'Online retailers',
};

export const TIP_KINDS = {
  mcuire: 'Mcuire Tip',
  chef: 'Chef’s Tip',
  kitchen: 'Kitchen Tip',
  watch: 'Watch Out',
  ready: 'How You Know It’s Ready',
};

const categories = [
  {
    id: 'rice', slug: 'rice-and-classics', name: 'Rice & Classics', sort: 1, tone: 'jollof',
    tagline: 'Party jollof, fried rice, coconut rice and the pots every family argues about.',
  },
  {
    id: 'soups', slug: 'soups-and-swallows', name: 'Soups & Swallows', sort: 2, tone: 'egusi',
    tagline: 'Rich, slow soups and the swallows that go with them, made by hand.',
  },
  {
    id: 'grills', slug: 'proteins-and-grills', name: 'Proteins & Grills', sort: 3, tone: 'suya',
    tagline: 'Suya, peppered chicken, grilled fish and the sauces that make them sing.',
  },
  {
    id: 'street', slug: 'street-food-and-snacks', name: 'Street Food & Snacks', sort: 4, tone: 'plantain',
    tagline: 'Puff-puff, akara, meat pie, chin chin and dodo, the taste of the roadside.',
  },
  {
    id: 'meals', slug: 'complete-meals', name: 'Complete Meals', sort: 5, tone: 'leaf',
    tagline: 'Bring dishes together and time a full table, from Sunday dinner to party platter.',
  },
];

// ---------------------------------------------------------------------------
// The flagship Cook With Me recipe: Nigerian Party Jollof Rice (complete).
// ---------------------------------------------------------------------------
const jollof = {
  id: 'party-jollof',
  slug: 'nigerian-party-jollof-rice',
  status: 'complete',
  title: 'Nigerian Party Jollof Rice',
  subtitle: 'Smoky, deep-red, every grain separate, the way it tastes at a Lagos party.',
  categoryId: 'rice',
  region: 'Nigeria',
  story:
    'Party jollof is the dish every Nigerian celebration is judged by. What makes it “party” is patience: a pepper base fried until the oil rises, rice steamed rather than boiled, and a little smoky “bottom pot” at the end. We will walk you through every one of those moments.',
  prepMinutes: 25,
  cookMinutes: 75,
  difficulty: 'Beginner friendly',
  baseServings: 6,
  servingOptions: [2, 4, 6, 10, 15, 20],
  previewSteps: 5,
  allergens: ['Milk (optional butter)', 'Check stock cubes: some contain wheat, soy or celery'],
  dietary: ['Gluten-free if your stock cubes are', 'Dairy-free without the butter'],
  hero: photo('Finished party jollof in a wide Mcuire pot, steam rising, sliced tomato and onion rings on top. Overhead, natural light.', 'jollof', 'A pot of Mcuire party jollof rice'),
  gallery: [
    photo('Plated: jollof, peppered chicken thigh, fried plantain, side salad. 45° angle on a Mcuire plate.', 'jollof'),
    photo('Close-up of grains: separate, glossy, orange-red, a few darker smoky grains.', 'jollof'),
  ],
  serveWith: ['Peppered Chicken', 'Fried Plantain (Dodo)', 'Coleslaw or simple salad', 'Moi Moi'],
  equipment: [
    { name: 'Large heavy-bottomed pot with a lid', note: 'At least 5 litres for 6 servings. A thin pot burns the bottom before the top is cooked.' },
    { name: 'Blender', note: 'Any kitchen blender. A stick blender works too.' },
    { name: 'Aluminium foil', note: 'Goes under the lid to trap steam. Parchment paper also works.' },
    { name: 'Wooden spoon or flat spatula', note: 'A flat edge helps you scrape and fold.' },
    { name: 'Sieve or colander', note: 'For draining the washed rice.' },
    { name: 'Large bowl', note: 'For washing the rice.' },
    { name: 'Measuring cups and spoons', note: 'Helpful the first time. Later you will cook by eye.' },
    { name: 'Knife and chopping board', note: '' },
  ],
  ingredients: [
    // Pepper base
    { id: 'tomatoes', group: 'For the pepper base', name: 'Ripe plum tomatoes', qty: 4, unit: '', altQty: 400, altUnit: 'g', scale: 'whole', shopCategory: 'Produce', availability: ['mainstream'], note: 'Soft, deep red tomatoes give the best colour.', substitutes: [{ name: '1 × 400 g tin of plum tomatoes', note: 'Drain off half the juice. Works year-round.' }] },
    { id: 'red-peppers', group: 'For the pepper base', name: 'Red bell peppers (tatashe)', qty: 3, unit: '', scale: 'whole', shopCategory: 'Produce', availability: ['mainstream', 'african-grocery'], note: 'Tatashe gives jollof its deep red colour without extra heat.', substitutes: [{ name: 'Roasted red peppers from a jar', note: 'Use about 300 g, drained.' }] },
    { id: 'scotch-bonnet', group: 'For the pepper base', name: 'Scotch bonnet peppers (ata rodo)', qty: 1, unit: '', scale: 'taste', shopCategory: 'Produce', availability: ['african-grocery', 'international', 'mainstream'], note: 'One gives a gentle warmth. Two is properly Nigerian. Remove the seeds for less heat.', substitutes: [{ name: 'Habanero pepper', note: 'Very similar heat and fruity flavour.' }, { name: '½ tsp dried chilli flakes', note: 'For a milder pot. Add with the spices instead of blending.' }] },
    { id: 'onion-blend', group: 'For the pepper base', name: 'Red onion', qty: 1, unit: '', prep: 'roughly chopped', scale: 'whole', shopCategory: 'Produce', availability: ['mainstream'], substitutes: [{ name: 'Any brown or white onion', note: 'Works exactly the same.' }] },
    // Pot
    { id: 'onion-slice', group: 'For the pot', name: 'Onion', qty: 1, unit: '', prep: 'thinly sliced', scale: 'whole', shopCategory: 'Produce', availability: ['mainstream'], substitutes: [] },
    { id: 'oil', group: 'For the pot', name: 'Vegetable oil', qty: 0.5, unit: 'cup', altQty: 120, altUnit: 'ml', shopCategory: 'Pantry', availability: ['mainstream'], note: 'Jollof needs this much oil to fry the base properly. Don’t cut it in half.', substitutes: [{ name: 'Sunflower, canola or groundnut oil', note: 'Any neutral oil.' }] },
    { id: 'tomato-paste', group: 'For the pot', name: 'Tomato paste', qty: 3, unit: 'tbsp', altQty: 70, altUnit: 'g', shopCategory: 'Pantry', availability: ['mainstream'], note: 'The concentrated kind in a tin or tube, not passata.', substitutes: [] },
    { id: 'rice', group: 'For the pot', name: 'Long-grain parboiled rice', qty: 3, unit: 'cup', altQty: 600, altUnit: 'g', shopCategory: 'Rice & Grains', availability: ['mainstream', 'african-grocery'], note: 'Also sold as “converted” or “easy-cook” rice. It stays separate and doesn’t go mushy, which is why Nigerian cooks use it.', substitutes: [{ name: 'Basmati rice', note: 'Use about ¼ less stock and check it 5 minutes earlier. It cooks faster and softer.' }, { name: 'Long-grain white rice', note: 'Rinse very well and use ¼ less stock.' }] },
    { id: 'stock', group: 'For the pot', name: 'Chicken stock, warm', qty: 2.5, unit: 'cup', altQty: 600, altUnit: 'ml', shopCategory: 'Pantry', availability: ['mainstream'], note: 'Homemade stock from boiling your chicken is best.', substitutes: [{ name: 'Water + 1 extra stock cube', note: 'Completely fine for a first attempt.' }, { name: 'Vegetable stock', note: 'For a vegetarian pot.' }] },
    { id: 'stock-cubes', group: 'For the pot', name: 'Chicken stock cubes', qty: 2, unit: 'cube', scale: 'whole', shopCategory: 'African Ingredients', availability: ['mainstream', 'african-grocery'], note: 'Nigerian cooks often use Knorr or Maggi cubes. Check the label for allergens.', substitutes: [{ name: '2 tsp chicken bouillon powder', note: 'Same job, measure instead of crumble.' }] },
    { id: 'curry', group: 'For the pot', name: 'Nigerian-style curry powder', qty: 1.5, unit: 'tsp', shopCategory: 'Spices', availability: ['african-grocery', 'online'], note: 'Milder and more yellow than Indian curry powder. It adds aroma, not heat.', substitutes: [{ name: '1 tsp mild Madras curry powder + a pinch of turmeric', note: 'Closest supermarket match.' }] },
    { id: 'thyme', group: 'For the pot', name: 'Dried thyme', qty: 1, unit: 'tsp', shopCategory: 'Spices', availability: ['mainstream'], substitutes: [] },
    { id: 'bay', group: 'For the pot', name: 'Bay leaves', qty: 2, unit: 'leaf', scale: 'whole', shopCategory: 'Spices', availability: ['mainstream'], substitutes: [{ name: 'Leave them out', note: 'You’ll lose a little fragrance but the jollof still works.' }] },
    { id: 'salt', group: 'For the pot', name: 'Salt', qty: 1, unit: 'tsp', scale: 'taste', shopCategory: 'Pantry', availability: ['mainstream'], note: 'Add a little, taste, then add more. Stock cubes are already salty.', substitutes: [] },
    { id: 'white-pepper', group: 'For the pot', name: 'Ground white pepper', qty: 0.5, unit: 'tsp', optional: true, shopCategory: 'Spices', availability: ['mainstream'], substitutes: [{ name: 'Black pepper', note: 'Use a little less.' }] },
    // Finish
    { id: 'butter', group: 'To finish', name: 'Butter', qty: 2, unit: 'tbsp', optional: true, shopCategory: 'Other', availability: ['mainstream'], note: 'Gives a glossy, rich finish.', substitutes: [{ name: 'Skip it', note: 'Dairy-free and still delicious.' }] },
    { id: 'garnish-tomato', group: 'To finish', name: 'Fresh tomatoes', qty: 2, unit: '', prep: 'sliced into rounds', scale: 'whole', optional: true, shopCategory: 'Produce', availability: ['mainstream'], substitutes: [] },
    { id: 'garnish-onion', group: 'To finish', name: 'Onion', qty: 1, unit: '', prep: 'sliced into rings', scale: 'whole', optional: true, shopCategory: 'Produce', availability: ['mainstream'], substitutes: [] },
  ],
  steps: [
    {
      id: 's1', phase: 'prep', title: 'Set everything out before you start',
      body: 'Wash your hands. Then take out every ingredient and every piece of equipment on the list and put them where you can reach them. Open the tomato paste. Unwrap the stock cubes. Measure the oil, stock and spices into cups or small bowls.',
      why: 'Once the frying starts, jollof moves quickly. If you are searching for the curry powder while the tomato paste is frying, it can burn.',
      about: 'About 5 minutes',
      media: [photo('Every jollof ingredient laid out on the Mcuire counter, labelled, in small bowls. Overhead.', 'jollof')],
      ingredientIds: [],
      tips: [{ kind: 'mcuire', text: 'In our kitchen we call this “setting your station”. Every Mcuire chef does it before every service, even for a dish they have cooked a thousand times.' }],
    },
    {
      id: 's2', phase: 'prep', title: 'Blend the pepper base',
      body: 'Roughly cut the tomatoes, red peppers and the red onion into big chunks. Pull the stalk off the scotch bonnet. Put everything into the blender with 2–3 tablespoons of water (just enough to get it moving). Blend until completely smooth.',
      cues: { see: 'A smooth, bright orange-red liquid with no visible chunks or pepper skins.', texture: 'Like a thin smoothie.' },
      about: 'About 1–2 minutes of blending',
      media: [video('10-second clip: blender running, then pouring the smooth pepper base so the texture is visible.', 'jollof')],
      ingredientIds: ['tomatoes', 'red-peppers', 'scotch-bonnet', 'onion-blend'],
      tips: [
        { kind: 'watch', text: 'Scotch bonnet is very hot. After cutting it, wash your hands with soap before you touch your face or eyes.' },
        { kind: 'chef', text: 'For a milder jollof, cut the scotch bonnet open and scrape out the seeds and white inside before blending. That’s where most of the heat is.' },
      ],
      checkpoint: {
        question: 'Does your blend look like this?',
        options: [
          { id: 'chunky', label: 'Chunky, I can see bits', verdict: 'wait', media: photo('Blender jug showing a chunky, uneven blend with visible pepper pieces.', 'jollof'), guidance: 'Blend for another 30–60 seconds. If the blades are spinning but nothing moves, add one more tablespoon of water.' },
          { id: 'smooth', label: 'Smooth and even', verdict: 'good', media: photo('Spoon lifted from a perfectly smooth pepper base.', 'jollof'), guidance: 'Perfect. Move on.' },
          { id: 'watery', label: 'Very thin and watery', verdict: 'fix', media: photo('Pepper base so thin it looks like juice.', 'jollof'), guidance: 'No problem. You added a bit too much water. You’ll just boil it a few minutes longer in the next step.' },
        ],
      },
    },
    {
      id: 's3', phase: 'prep', title: 'Boil the pepper base down until thick',
      body: 'Pour the blended pepper base into your big pot. Turn the heat to medium-high and let it bubble with the lid OFF. Stir every 3–4 minutes, scraping the bottom. You are boiling away water so the mixture becomes thick.',
      cues: { see: 'The level in the pot drops by about half. It turns from bright orange to a deeper red.', hear: 'Thick “plop-plop” bubbles instead of a rolling boil.', texture: 'Like a loose porridge. A spoon dragged across the bottom leaves a trail for a second.' },
      about: 'About 15–20 minutes',
      timer: { minutes: 15, label: 'Boil down pepper base' },
      media: [
        photo('Pepper base at the start: thin and bright, pot nearly full.', 'jollof'),
        photo('Pepper base reduced by half: thick, deeper red, spoon trail visible.', 'jollof'),
      ],
      ingredientIds: [],
      tips: [
        { kind: 'watch', text: 'It will splutter. Tilt the lid over the pot, leaving a gap, so steam can escape but the splashes stay in.' },
        { kind: 'kitchen', text: 'Use this time to do the next step: washing the rice.' },
        { kind: 'mcuire', text: 'You can make the pepper base a day ahead and keep it in the fridge. It even freezes for a month.' },
      ],
      checkpoint: {
        question: 'Has yours thickened like this?',
        options: [
          { id: 'watery', label: 'Still watery', verdict: 'wait', media: photo('Pepper base still thin and splashy, level barely dropped.', 'jollof'), guidance: 'Keep boiling with the lid off. Check again in 5 minutes. Watery base is the #1 reason jollof turns out soggy.' },
          { id: 'almost', label: 'Thicker, but still runs fast', verdict: 'wait', media: photo('Pepper base partly reduced, still runs off the spoon quickly.', 'jollof'), guidance: 'Almost there. Give it 3–5 more minutes.' },
          { id: 'correct', label: 'Thick, spoon leaves a trail', verdict: 'good', media: photo('Pepper base correctly reduced, spoon trail across pot base.', 'jollof'), guidance: 'That’s it. Turn off the heat and pour it into a bowl. You’ll need the pot for the next stage.' },
          { id: 'dry', label: 'Sticking or catching', verdict: 'fix', media: photo('Pepper base too dry, dark patches catching on the pot bottom.', 'jollof'), guidance: 'Turn the heat down and stir in ¼ cup of water straight away. Don’t scrape any black bits from the bottom into the sauce.' },
        ],
      },
      troubleshooting: [
        { problem: 'It’s splashing everywhere', fix: 'Turn the heat down to medium and half-cover with the lid.' },
        { problem: 'It smells slightly burnt', fix: 'Pour it into a clean pot without scraping the bottom, add a splash of water and continue on lower heat.' },
      ],
    },
    {
      id: 's4', phase: 'prep', title: 'Wash the rice until the water is clearer',
      body: 'Put the rice in a large bowl and cover with cold water. Rub the rice between your hands for about 10 seconds. The water will turn cloudy. Tip the cloudy water out, keeping the rice in the bowl with your hand. Do this 3–4 times. Then pour the rice into a sieve and leave it to drain.',
      why: 'The cloudiness is loose starch. Washing it off is what keeps your jollof grains separate instead of sticky.',
      cues: { see: 'The water goes from milky-white to almost clear.' },
      about: 'About 3–5 minutes',
      media: [photo('Side by side: first wash (milky water) vs fourth wash (nearly clear water) in a glass bowl.', 'rice')],
      ingredientIds: ['rice'],
      tips: [{ kind: 'kitchen', text: 'It doesn’t have to be perfectly clear. “Clearer” is enough.' }],
      checkpoint: {
        question: 'How does your water look now?',
        options: [
          { id: 'milky', label: 'Still milky white', verdict: 'wait', media: photo('Bowl of rice with milky water.', 'rice'), guidance: 'Wash it 1–2 more times.' },
          { id: 'clear', label: 'Mostly clear', verdict: 'good', media: photo('Bowl of rice with nearly clear water.', 'rice'), guidance: 'Great. Drain it in the sieve and leave it there.' },
        ],
      },
    },
    {
      id: 's5', phase: 'cook', title: 'Soften the onion in hot oil',
      body: 'Put the empty pot back on medium heat and pour in the oil. Wait 1–2 minutes for the oil to heat up. Test it by dropping in one slice of onion. If it sizzles gently, it’s ready. Add all the sliced onion and stir. Cook, stirring now and then, until the onion is soft.',
      cues: { see: 'Onion turns soft and see-through, with the edges just starting to turn golden.', hear: 'A steady, gentle sizzle, not loud crackling.', smell: 'Sweet onion.' },
      about: 'About 3–4 minutes',
      timer: { minutes: 4, label: 'Soften onion' },
      media: [photo('Sliced onion in oil, soft and translucent with golden edges.', 'onion')],
      ingredientIds: ['oil', 'onion-slice'],
      tips: [{ kind: 'watch', text: 'If the onion goes brown in under a minute, your heat is too high. Turn it down a little before the next step.' }],
    },
    {
      id: 's6', phase: 'cook', title: 'Fry the tomato paste until it darkens',
      body: 'Add the tomato paste to the onions and stir it into the oil. Keep stirring, almost constantly, scraping the bottom of the pot. The paste will slowly change colour. Don’t rush this part. Frying the paste is what removes the sour “raw tomato” taste.',
      cues: { see: 'Bright tomato red slowly becomes a deeper brick red. It may start to stick to the bottom slightly.', smell: 'Sharp and sour at first, then sweeter and richer.' },
      about: 'About 5–7 minutes',
      timer: { minutes: 6, label: 'Fry tomato paste' },
      media: [video('15-second clip: stirring tomato paste in oil; colour change from bright red to brick red.', 'jollof')],
      ingredientIds: ['tomato-paste'],
      tips: [{ kind: 'ready', text: 'It’s ready when it is a darker brick red, smells sweet rather than sharp, and the oil around the edges looks red.' }],
      checkpoint: {
        question: 'What colour is your paste now?',
        options: [
          { id: 'bright', label: 'Still bright red', verdict: 'wait', media: photo('Tomato paste just added: bright, shiny, tomato red.', 'jollof'), guidance: 'Keep stirring for another 2–3 minutes.' },
          { id: 'brick', label: 'Deeper, brick red', verdict: 'good', media: photo('Tomato paste correctly fried: deep brick red, oil tinted red at edges.', 'jollof'), guidance: 'Perfect. Go straight to the next step.' },
          { id: 'black', label: 'Dark brown with black bits', verdict: 'fix', media: photo('Overfried tomato paste: dark brown, black specks.', 'jollof'), guidance: 'Turn off the heat. If it smells bitter, wipe the pot and start this step again. A bitter base ruins the whole pot. A few dark specks with no bitter smell are fine. Add the pepper base now.' },
        ],
      },
    },
    {
      id: 's7', phase: 'cook', title: 'Fry the pepper base until the oil rises',
      body: 'Stand back a little and pour the thick pepper base into the pot. It will splutter. Stir well. Add the bay leaves, thyme and curry powder. Leave the lid off and let it cook on medium heat, stirring every 2–3 minutes and scraping the bottom each time.',
      why: 'This is the most important step in the whole recipe. Rushing it is why jollof tastes raw or sour. Wait for the oil.',
      cues: { see: 'A layer of red oil appears on top and around the edges of the pot. The sauce looks darker and glossy.', smell: 'Rich and savoury, not like fresh tomatoes any more.', texture: 'Thick enough that it holds its shape for a moment when you stir.' },
      about: 'About 10–15 minutes',
      timer: { minutes: 12, label: 'Fry pepper base' },
      media: [
        photo('Close-up: red oil separated and floating on top of fried pepper base, pooled at the pot edge.', 'jollof'),
        video('10-second clip: pushing the sauce aside with a spoon to show oil pooling.', 'jollof'),
      ],
      ingredientIds: ['bay', 'thyme', 'curry'],
      tips: [
        { kind: 'mcuire', text: 'At Mcuire we say: “the oil will tell you when it’s ready.” Until you see red oil on top, keep frying.' },
        { kind: 'watch', text: 'If it starts to stick and darken quickly, lower the heat. Don’t add water yet.' },
      ],
      checkpoint: {
        question: 'Can you see oil floating on top?',
        options: [
          { id: 'no-oil', label: 'No oil, sauce looks wet', verdict: 'wait', media: photo('Pepper sauce just added: wet, no visible oil.', 'jollof'), guidance: 'Keep frying and stirring every few minutes. This can take 15 minutes. That’s normal.' },
          { id: 'some', label: 'A little oil at the edges', verdict: 'wait', media: photo('Pepper sauce with thin oil beginning at the pot edge.', 'jollof'), guidance: 'Nearly there. 3–5 more minutes.' },
          { id: 'oil', label: 'Red oil clearly on top', verdict: 'good', media: photo('Fried pepper sauce with clear layer of red oil on top.', 'jollof'), guidance: 'Beautiful. This is the moment. Move on.' },
        ],
      },
      troubleshooting: [{ problem: 'It’s been 20 minutes and still no oil', fix: 'Your base was probably still watery. Keep going, it will come. Or, if your sauce is very thick already, it may just need 2 tablespoons more oil.' }],
    },
    {
      id: 's8', phase: 'cook', title: 'Season the sauce and taste',
      body: 'Crumble in the stock cubes. Add the salt and white pepper. Pour in the warm stock and stir. Turn the heat up and let it come to a boil. Now taste it with a clean spoon (careful, it’s hot).',
      why: 'The sauce should taste a little too salty and too strong on its own. The rice will soak up the flavour. If the sauce tastes “just right” now, the rice will taste bland.',
      cues: { see: 'A loose, red, bubbling sauce.', smell: 'Savoury and warm, with curry and thyme.' },
      about: 'About 3–5 minutes',
      media: [photo('Seasoned jollof sauce at a rolling boil before rice goes in.', 'jollof')],
      ingredientIds: ['stock-cubes', 'salt', 'white-pepper', 'stock'],
      tips: [{ kind: 'ready', text: 'It’s ready when it’s boiling and tastes slightly stronger and saltier than you’d want to eat by itself.' }],
      troubleshooting: [{ problem: 'It tastes too salty, not just slightly', fix: 'Add ½ cup of water and taste again. Remember the rice will absorb some salt.' }, { problem: 'It tastes flat', fix: 'Add half a stock cube or a pinch of salt and taste again.' }],
    },
    {
      id: 's9', phase: 'cook', title: 'Add the rice and check the liquid level',
      body: 'Tip in the drained rice and stir well so every grain is coated in red sauce. Then use your spoon to press the rice down flat. Now look closely. The liquid should come just to the top of the rice, not cover it like soup.',
      cues: { see: 'The rice surface is flat. Liquid is just visible between the top grains, but the rice is not floating.' },
      about: 'About 2 minutes',
      media: [photo('Rice pressed flat in sauce with liquid exactly level with the top of the rice.', 'jollof')],
      ingredientIds: ['rice'],
      tips: [
        { kind: 'chef', text: 'Simple test: touch the surface lightly with the tip of a clean spoon. If liquid rises above the rice by more than a few millimetres, there’s too much.' },
        { kind: 'mcuire', text: 'Too little water is easy to fix later. Too much water makes soggy jollof. When in doubt, use less.' },
      ],
      checkpoint: {
        question: 'Compare your liquid level',
        options: [
          { id: 'flooded', label: 'Rice is under liquid', verdict: 'fix', media: photo('Too much liquid: rice submerged like soup.', 'jollof'), guidance: 'Spoon some liquid out into a cup until it’s level with the rice. Keep it nearby in case you need it later.' },
          { id: 'level', label: 'Liquid just at the rice', verdict: 'good', media: photo('Correct: liquid level with the rice surface.', 'jollof'), guidance: 'Exactly right. Next step.' },
          { id: 'dry', label: 'Rice looks dry on top', verdict: 'fix', media: photo('Too little liquid: dry grains on top, sauce only at the bottom.', 'jollof'), guidance: 'Add ¼ cup of water or stock, stir once, and press flat again.' },
        ],
      },
    },
    {
      id: 's10', phase: 'cook', title: 'Cover tightly and steam on low',
      body: 'Lay a sheet of foil over the top of the pot and press it down around the edges. Put the lid on top of the foil. Turn the heat down to LOW. Now leave it alone. Don’t open it and don’t stir it.',
      why: 'Party jollof is steamed, not boiled. The foil traps steam so the grains cook evenly. Stirring now breaks the grains and makes it mushy.',
      cues: { hear: 'Very quiet bubbling. If you hear loud boiling, the heat is too high.', smell: 'After about 15 minutes it smells toasty and savoury.' },
      about: '20 minutes',
      timer: { minutes: 20, label: 'Steam the rice' },
      media: [photo('Pot covered with foil pressed around the rim, lid on top, low flame.', 'jollof')],
      ingredientIds: [],
      tips: [
        { kind: 'watch', text: 'If you smell burning before the timer ends, your heat is too high. Turn it to the lowest setting. Don’t open the pot.' },
        { kind: 'kitchen', text: 'Good time to fry your plantain or warm your chicken.' },
      ],
    },
    {
      id: 's11', phase: 'cook', title: 'Check the rice and turn it gently',
      body: 'Take off the lid and foil. Taste a few grains from the top. Then slide your spatula down to the bottom of the pot and gently lift and fold the rice over, from bottom to top, in 4–5 places. Don’t stir in circles. Cover again with the foil and lid and cook on low for 10 more minutes.',
      cues: { see: 'Grains are swollen, orange-red, and mostly separate.', texture: 'Soft on the outside with a very slight firmness in the middle.' },
      about: '10 more minutes',
      timer: { minutes: 10, label: 'Final steam' },
      media: [video('15-second clip: folding jollof from the bottom with a flat spatula, showing correct gentle motion.', 'jollof')],
      ingredientIds: [],
      checkpoint: {
        question: 'How does the rice feel when you bite it?',
        options: [
          { id: 'hard-dry', label: 'Hard and the pot looks dry', verdict: 'fix', media: photo('Undercooked jollof: hard white centres, dry surface.', 'jollof'), guidance: 'Sprinkle ¼ cup of water over the top (don’t pour it in one spot). Cover and give it the full 10 minutes, then check again.' },
          { id: 'firm', label: 'Soft outside, firm middle', verdict: 'good', media: photo('Nearly done jollof: grains swollen, slight bite.', 'jollof'), guidance: 'Exactly where it should be. The last 10 minutes will finish it.' },
          { id: 'mushy', label: 'Soft and wet or mushy', verdict: 'fix', media: photo('Overly wet jollof: grains soft and clumping.', 'jollof'), guidance: 'Don’t add anything and don’t stir. Leave the lid off, keep the heat low, and let the extra water steam away for 5–8 minutes.' },
        ],
      },
    },
    {
      id: 's12', phase: 'finish', title: 'Make the smoky “party” finish',
      body: 'Optional, but this is what makes it taste like party jollof. Add the butter on top. Lay the sliced tomatoes and onion rings over the rice. Cover again. Turn the heat up to medium for 3–5 minutes without stirring. The rice touching the bottom will toast and give a gentle smoky smell.',
      cues: { smell: 'Toasty and slightly smoky, like bread toasted just past golden.', hear: 'A light crackle from the bottom of the pot.' },
      about: '3–5 minutes',
      timer: { minutes: 4, label: 'Party finish' },
      media: [photo('Sliced tomato and onion rings laid over jollof with butter melting.', 'jollof')],
      ingredientIds: ['butter', 'garnish-tomato', 'garnish-onion'],
      tips: [
        { kind: 'mcuire', text: 'At Nigerian parties, jollof is cooked in huge pots over firewood. That smoky “bottom pot” flavour is what everyone is chasing. This step is how you get it at home.' },
        { kind: 'watch', text: 'If the smell turns sharp or bitter, switch off the heat immediately. When you serve, don’t scrape up the very bottom layer.' },
      ],
    },
    {
      id: 's13', phase: 'finish', title: 'Rest it, then fluff',
      body: 'Turn off the heat. Leave the pot covered for 5–10 minutes. Then remove the bay leaves and gently fluff the rice with a fork or spatula, lifting from the bottom.',
      why: 'Resting lets the last of the steam settle into the grains so they firm up and separate.',
      about: '5–10 minutes',
      timer: { minutes: 5, label: 'Rest jollof' },
      media: [photo('Fluffing finished jollof with a fork: separate, glossy grains.', 'jollof')],
      ingredientIds: [],
    },
    {
      id: 's14', phase: 'finish', title: 'Serve it like Mcuire',
      body: 'Spoon the jollof onto plates. Serve with chicken, fried plantain and a simple salad or coleslaw. You can share some of the smoky bottom-pot rice too, as long as it isn’t burnt black.',
      cues: { see: 'Deep orange-red grains, separate and glossy, not wet. A few darker smoky grains are a good sign.' },
      media: [photo('Mcuire plating: jollof, peppered chicken, dodo, salad on a Mcuire plate. 45°.', 'jollof')],
      ingredientIds: [],
      tips: [{ kind: 'kitchen', text: 'Leftovers keep 3 days in the fridge. Reheat with a splash of water, covered, until steaming hot all the way through.' }],
      checkpoint: {
        question: 'Does yours look like this?',
        options: [
          { id: 'perfect', label: 'Red, separate, glossy grains', verdict: 'good', media: photo('Perfect finished jollof close-up.', 'jollof'), guidance: 'You did it. That is party jollof.' },
          { id: 'pale', label: 'Paler / more orange than red', verdict: 'fix', media: photo('Pale orange jollof for comparison.', 'jollof'), guidance: 'Still delicious! Next time, use one more red pepper and fry the tomato paste a minute or two longer for a deeper colour.' },
          { id: 'soft', label: 'A bit soft or sticky', verdict: 'fix', media: photo('Soft, slightly sticky jollof for comparison.', 'jollof'), guidance: 'Next time, start with a little less stock in step 9 and wash the rice one more time. Your flavour is the hard part, and you have it.' },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Curriculum outlines. Same data model; steps are written + photographed next.
// ---------------------------------------------------------------------------
const outline = (id, categoryId, title, region, subtitle, prep, cook, difficulty = 'Beginner friendly', tone) => ({
  id, slug: id, status: 'outline', title, subtitle, categoryId, region,
  prepMinutes: prep, cookMinutes: cook, difficulty, baseServings: 4, servingOptions: [2, 4, 6, 10, 15, 20],
  previewSteps: 0, allergens: [], dietary: [],
  hero: photo(`Finished ${title}, plated Mcuire style.`, tone || categories.find((c) => c.id === categoryId).tone),
  equipment: [], ingredients: [], steps: [],
});

const outlines = [
  outline('nigerian-fried-rice', 'rice', 'Nigerian Fried Rice', 'Nigeria', 'Curry-gold rice with liver, prawns and colourful vegetables.', 30, 45),
  outline('coconut-rice', 'rice', 'Coconut Rice', 'Nigeria', 'Fragrant rice cooked in coconut milk with a gentle pepper base.', 20, 45),
  outline('white-rice-and-stew', 'rice', 'White Rice & Nigerian Tomato Stew', 'Nigeria', 'The everyday classic: a deep red stew you will cook for life.', 25, 70),
  outline('ofada-rice-ayamase', 'rice', 'Ofada Rice with Ayamase', 'Nigeria (Yoruba)', 'Local rice with the famous green pepper “designer stew”.', 40, 80, 'Intermediate', 'leaf'),
  outline('waakye', 'rice', 'Waakye', 'Ghana', 'Rice and beans cooked with sorghum leaves, served with shito.', 20, 70, 'Beginner friendly', 'egusi'),
  outline('thieboudienne', 'rice', 'Thiéboudienne', 'Senegal', 'Senegal’s national dish: fish, vegetables and broken rice in one pot.', 40, 90, 'Intermediate'),

  outline('egusi', 'soups', 'Egusi Soup', 'Nigeria', 'Ground melon seed soup with leafy greens and assorted meat.', 30, 60),
  outline('ogbono', 'soups', 'Ogbono Soup', 'Nigeria', 'The famously “drawy” soup made with wild mango seed.', 20, 45),
  outline('okra', 'soups', 'Okra Soup', 'Nigeria', 'Fresh, bright and quick, with seafood or beef.', 20, 35),
  outline('oha', 'soups', 'Oha Soup', 'Nigeria (Igbo)', 'Tender oha leaves in a cocoyam-thickened broth.', 40, 60, 'Intermediate'),
  outline('afang', 'soups', 'Afang Soup', 'Nigeria (Efik/Ibibio)', 'Afang and waterleaf with periwinkle and palm oil.', 45, 50, 'Intermediate', 'leaf'),
  outline('edikang-ikong', 'soups', 'Edikang Ikong', 'Nigeria (Efik)', 'A rich, vegetable-packed soup of fluted pumpkin and waterleaf.', 45, 50, 'Intermediate', 'leaf'),
  outline('efo-riro', 'soups', 'Efo Riro', 'Nigeria (Yoruba)', 'Spinach stewed in a fried pepper base with locust beans.', 25, 40, 'Beginner friendly', 'leaf'),
  outline('bitterleaf-soup', 'soups', 'Bitterleaf Soup (Ofe Onugbu)', 'Nigeria (Igbo)', 'Washed bitterleaf in a cocoyam-thickened palm oil broth.', 40, 60, 'Intermediate', 'leaf'),
  outline('nsala', 'soups', 'Nsala (White Soup)', 'Nigeria (Igbo)', 'A light, peppery soup thickened with yam, often with catfish.', 25, 45),
  outline('banga', 'soups', 'Banga Soup', 'Nigeria (Delta)', 'Palm fruit soup with fragrant banga spices and fresh fish.', 40, 60, 'Intermediate'),
  outline('pounded-yam', 'soups', 'Pounded Yam', 'Nigeria', 'Smooth and stretchy. We show you the method and the shortcut.', 15, 25, 'Beginner friendly', 'rice'),
  outline('eba', 'soups', 'Eba', 'Nigeria', 'Garri swallow: get the water ratio and the turn right every time.', 2, 5, 'Beginner friendly', 'rice'),
  outline('fufu', 'soups', 'Fufu', 'West Africa', 'Fermented cassava swallow, smooth and soft.', 10, 20, 'Beginner friendly', 'rice'),
  outline('semolina', 'soups', 'Semolina', 'Nigeria', 'The easiest swallow to start with, lump-free.', 2, 10, 'Beginner friendly', 'rice'),
  outline('amala-ewedu-gbegiri', 'soups', 'Amala with Ewedu & Gbegiri', 'Nigeria (Yoruba)', 'Yam flour swallow with jute leaf soup and bean soup.', 30, 60, 'Intermediate', 'egusi'),

  outline('suya', 'grills', 'Beef Suya', 'Nigeria (Hausa)', 'Thin-sliced beef in yaji spice, grilled until smoky.', 30, 15),
  outline('peppered-chicken', 'grills', 'Peppered Chicken', 'Nigeria', 'Seasoned, boiled, fried, then tossed in a glossy pepper sauce.', 20, 60),
  outline('grilled-chicken', 'grills', 'Mcuire Grilled Chicken', 'West Africa', 'Marinated overnight, oven or grill, juicy every time.', 20, 45),
  outline('grilled-fish', 'grills', 'Grilled Tilapia', 'West Africa', 'Whole fish with a pepper rub, crisp skin and tender flesh.', 20, 30),
  outline('goat-meat', 'grills', 'Peppered Goat Meat (Asun)', 'Nigeria', 'Smoky grilled goat tossed in fiery peppers.', 30, 90, 'Intermediate'),
  outline('beef-stew-meat', 'grills', 'Fried Beef', 'Nigeria', 'Seasoned, boiled tender, fried golden: the stew and party staple.', 15, 70),
  outline('assorted-meat', 'grills', 'Pepper Assorted Meat', 'Nigeria', 'Shaki, cow foot and beef: cleaning, cooking, and the pepper sauce.', 40, 120, 'Intermediate'),
  outline('pepper-sauce', 'grills', 'Ata Dindin & Yaji', 'Nigeria', 'The fried pepper sauce and the suya spice to keep in your fridge.', 15, 30),

  outline('puff-puff', 'street', 'Puff-Puff', 'Nigeria', 'Soft, round, golden. Learn the batter and the drop.', 70, 20, 'Beginner friendly', 'plantain'),
  outline('akara', 'street', 'Akara', 'Nigeria', 'Crisp bean fritters, light inside. Peeling and whipping beans made easy.', 40, 20, 'Intermediate', 'plantain'),
  outline('dodo', 'street', 'Fried Plantain (Dodo)', 'West Africa', 'Picking the right ripeness, cutting, frying to caramel.', 5, 10, 'Beginner friendly', 'plantain'),
  outline('meat-pie', 'street', 'Nigerian Meat Pie', 'Nigeria', 'Buttery short pastry, minced beef and potato filling, crimped by hand.', 60, 35, 'Intermediate', 'plantain'),
  outline('chin-chin', 'street', 'Chin Chin', 'Nigeria', 'Crunchy, lightly sweet fried dough bites.', 30, 30, 'Beginner friendly', 'plantain'),
  outline('moi-moi', 'street', 'Moi Moi', 'Nigeria', 'Steamed bean pudding, smooth and rich with egg and fish.', 40, 60, 'Intermediate'),
  outline('kelewele', 'street', 'Kelewele', 'Ghana', 'Spiced fried plantain with ginger and pepper.', 15, 10, 'Beginner friendly', 'plantain'),

  outline('jollof-chicken-plantain', 'meals', 'Jollof + Chicken + Plantain', 'Complete meal', 'The classic plate, timed so everything is hot together.', 40, 120, 'Beginner friendly', 'jollof'),
  outline('egusi-pounded-yam', 'meals', 'Egusi + Pounded Yam', 'Complete meal', 'Soup and swallow, the way it’s served at a Mcuire table.', 40, 90),
  outline('rice-stew-protein', 'meals', 'Rice + Stew + Protein', 'Complete meal', 'Cook once, eat all week. A meal-prep plan with stew.', 40, 100),
  outline('sunday-dinner', 'meals', 'West African Sunday Dinner', 'Complete meal', 'A full family table: a cooking timeline from morning to plate.', 60, 180, 'Intermediate', 'leaf'),
  outline('party-platter', 'meals', 'Party Platter', 'Complete meal', 'Small chops, jollof and grills for 20, with a shopping and timing plan.', 120, 240, 'Confident cook', 'suya'),
];

const recipes = [jollof, ...outlines];
const ids = (cat) => recipes.filter((r) => r.categoryId === cat).map((r) => r.id);

const courses = [
  {
    id: 'flagship', slug: 'west-african-kitchen', kind: 'flagship', status: 'published',
    title: 'West African Kitchen', subtitle: 'Beginner to Confident Cook',
    certificateTitle: 'West African Home Cooking Masterclass',
    priceCents: 9400, compareAtCents: 12100, currency: 'CAD',
    blurb: 'Our complete programme. Over 40 dishes, from party jollof to egusi and pounded yam, suya and puff-puff, taught one step at a time by the Mcuire kitchen.',
    outcomes: [
      'Cook a full West African table for family or a party',
      'Know what every stage should look, smell and feel like',
      'Shop confidently for African ingredients wherever you live',
      'Earn the Mcuire Certificate of Completion',
    ],
    modules: [
      { id: 'm1', title: 'Rice & Classics', summary: 'Start with the pot everyone judges you by.', recipeIds: ids('rice') },
      { id: 'm2', title: 'Soups & Swallows', summary: 'Eight soups and five swallows, made by hand.', recipeIds: ids('soups') },
      { id: 'm3', title: 'Proteins & Grills', summary: 'Seasoning, boiling, frying and grilling meat and fish.', recipeIds: ids('grills') },
      { id: 'm4', title: 'Street Food & Snacks', summary: 'Small chops and street favourites.', recipeIds: ids('street') },
      { id: 'm5', title: 'Complete Meals', summary: 'Timing several dishes into one meal.', recipeIds: ids('meals') },
    ],
    // Recipes that must be completed to earn the certificate.
    requiredRecipeIds: recipes.filter((r) => r.categoryId !== 'meals' || r.id === 'jollof-chicken-plantain').map((r) => r.id),
  },
  {
    id: 'rice-course', slug: 'rice-and-classics', kind: 'mini', status: 'published',
    title: 'Rice & Classics', subtitle: 'Mini course', priceCents: 2900, currency: 'CAD',
    blurb: 'Party jollof, fried rice, coconut rice, rice & stew, ofada, waakye and thiéboudienne.',
    outcomes: ['Cook party jollof with confidence', 'Master the Nigerian pepper base', 'Never make soggy rice again'],
    modules: [{ id: 'm1', title: 'Rice & Classics', summary: '', recipeIds: ids('rice') }],
  },
  {
    id: 'soups-course', slug: 'soups-and-swallows', kind: 'mini', status: 'published',
    title: 'Soups & Swallows', subtitle: 'Mini course', priceCents: 3900, currency: 'CAD',
    blurb: 'Egusi, ogbono, okra, oha, afang, edikang ikong, efo riro and more, with pounded yam, eba, fufu, semolina and amala.',
    outcomes: ['Cook eight classic soups', 'Make smooth, lump-free swallow', 'Clean and prepare leafy greens and assorted meat'],
    modules: [{ id: 'm1', title: 'Soups & Swallows', summary: '', recipeIds: ids('soups') }],
  },
  {
    id: 'grills-course', slug: 'proteins-and-grills', kind: 'mini', status: 'published',
    title: 'Proteins & Grills', subtitle: 'Mini course', priceCents: 2900, currency: 'CAD',
    blurb: 'Suya, peppered chicken, grilled fish, goat meat, beef, assorted meat and pepper sauces.',
    outcomes: ['Season meat the West African way', 'Grill without drying out', 'Make your own yaji and ata dindin'],
    modules: [{ id: 'm1', title: 'Proteins & Grills', summary: '', recipeIds: ids('grills') }],
  },
  {
    id: 'street-course', slug: 'street-food-and-snacks', kind: 'mini', status: 'published',
    title: 'Street Food & Snacks', subtitle: 'Mini course', priceCents: 2400, currency: 'CAD',
    blurb: 'Puff-puff, akara, dodo, meat pie, chin chin, moi moi and kelewele.',
    outcomes: ['Fry safely and evenly', 'Make dough and batter by feel', 'Host with small chops'],
    modules: [{ id: 'm1', title: 'Street Food & Snacks', summary: '', recipeIds: ids('street') }],
  },
];

const achievements = [
  { id: 'kitchen-starter', title: 'Kitchen Starter', description: 'Finished your first Cook With Me recipe.', rule: { type: 'recipesCompleted', count: 1 } },
  { id: 'jollof-boss', title: 'Jollof Boss', description: 'Cooked Nigerian Party Jollof from start to finish.', rule: { type: 'recipe', recipeId: 'party-jollof' } },
  { id: 'soup-master', title: 'Soup Master', description: 'Cooked three different soups.', rule: { type: 'category', categoryId: 'soups', count: 3 } },
  { id: 'street-food-chef', title: 'Street Food Chef', description: 'Cooked three street food favourites.', rule: { type: 'category', categoryId: 'street', count: 3 } },
  { id: 'party-chef', title: 'Party Chef', description: 'Cooked any recipe for 15 or more people.', rule: { type: 'servings', min: 15 } },
  { id: 'graduate', title: 'Mcuire Kitchen Graduate', description: 'Completed the West African Kitchen programme.', rule: { type: 'certificate', courseId: 'flagship' } },
];

const challenges = [
  { id: 'jollof-challenge', title: 'The Jollof Challenge', description: 'Cook party jollof twice, once for at least 10 people. Confidence comes from the second pot.', goals: [{ recipeId: 'party-jollof', times: 2 }, { recipeId: 'party-jollof', minServings: 10 }] },
  { id: 'soup-challenge', title: 'The Soup Challenge', description: 'Cook three different soups and serve each with the right swallow.', goals: [{ categoryId: 'soups', distinct: 3 }] },
  { id: 'street-challenge', title: 'The Street Food Challenge', description: 'Make three small chops for friends: something fried, something baked, something steamed.', goals: [{ categoryId: 'street', distinct: 3 }] },
];

const discounts = [
  { code: 'WELCOME10', percentOff: 10, active: true, note: 'Newsletter welcome' },
  { code: 'DINEIN15', percentOff: 15, active: true, note: 'Printed on Mcuire restaurant receipts' },
];

export const SEED = {
  version: 4,
  categories,
  courses,
  recipes,
  achievements,
  challenges,
  discounts,
  freeLesson: { recipeId: 'party-jollof' },
};
