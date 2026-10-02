// Complete Meals: timeline lessons that bring several Cook With Me dishes
// together so everything is ready at the same time.
//
// A meal is a recipe with `kind: 'meal'` and `components` (recipe ids).
// Its steps are a timeline; `links` on a step open the full lesson for that
// dish (with "Back to meal plan" on the way out). The shopping list and the
// serving calculator expand a meal into its component recipes.

const photo = (brief, tone, alt = brief) => ({ kind: 'photo', src: null, alt, brief, tone });

const meal = (fields) => ({
  status: 'complete',
  kind: 'meal',
  categoryId: 'meals',
  region: 'Complete meal',
  previewSteps: 0,
  allergens: [],
  dietary: [],
  equipment: [],
  ingredients: [],
  servingOptions: [2, 4, 6, 10, 15, 20],
  ...fields,
  slug: fields.id,
});

// ---------------------------------------------------------------------------
export const partyPlate = meal({
  id: 'jollof-chicken-plantain',
  title: 'Jollof + Chicken + Plantain',
  subtitle: 'The classic Nigerian party plate, timed so all three are hot at the same moment.',
  story:
    'Cooking one dish is a recipe. Cooking three at once is a plan. This lesson is the plan: what to start when, what can wait, and how to use the hands-off moments so nothing goes cold.',
  prepMinutes: 40,
  cookMinutes: 140,
  difficulty: 'Beginner friendly',
  baseServings: 6,
  components: ['party-jollof', 'peppered-chicken', 'dodo'],
  hero: photo('The Mcuire party plate: jollof, glossy peppered chicken, dodo, a little salad. 45°.', 'jollof', 'Jollof, peppered chicken and plantain'),
  steps: [
    {
      id: 'pp1', phase: 'prep', title: 'Shop, and season the chicken the night before',
      body: 'Add this meal to your shopping list and everything for all three dishes is added at once. If you can, season the chicken the night before (Peppered Chicken, steps 1–2) and keep it in the fridge. It saves 30 minutes and tastes better.',
      about: 'The day before (optional)',
      media: [], ingredientIds: [], links: ['peppered-chicken'],
      tips: [{ kind: 'mcuire', text: 'Make sure your plantains are yellow with black spots. If they’re green, buy them 4–7 days ahead.' }],
    },
    {
      id: 'pp2', phase: 'prep', title: '2 hr 30 before: start the chicken and the jollof base',
      body: 'Not seasoned yet? Season the chicken now and let it rest (Peppered Chicken, step 2). At the same time, blend the jollof pepper base and start boiling it down (Jollof, steps 1–3).',
      about: '2 hr 30 before dinner',
      timer: { minutes: 30, label: 'Chicken marinates / base reduces' },
      media: [], ingredientIds: [], links: ['peppered-chicken', 'party-jollof'],
    },
    {
      id: 'pp3', phase: 'cook', title: '2 hr before: cook the chicken while frying the jollof base',
      body: 'Put the chicken on to cook in its own juices (Peppered Chicken, step 3). While it cooks, wash the rice and fry the onion, tomato paste and pepper base for the jollof until the oil rises (Jollof, steps 4–7).',
      about: '2 hr before dinner',
      media: [], ingredientIds: [], links: ['peppered-chicken', 'party-jollof'],
      tips: [{ kind: 'mcuire', text: 'Use some of the chicken’s cooking liquid as the stock for your jollof. That’s how restaurants do it.' }],
    },
    {
      id: 'pp4', phase: 'cook', title: '1 hr 20 before: rice in, lid on, now fry the chicken',
      body: 'Season the jollof sauce, add the rice, cover with foil and steam on low (Jollof, steps 8–10). You now have about 30 hands-off minutes. Use them to dry and fry the chicken (or bake it), and make the pepper sauce (Peppered Chicken, steps 4–6).',
      about: '1 hr 20 before dinner',
      timer: { minutes: 30, label: 'Jollof steams: fry chicken now' },
      media: [], ingredientIds: [], links: ['party-jollof', 'peppered-chicken'],
      tips: [{ kind: 'watch', text: 'Don’t lift the jollof lid while you’re busy with the chicken. Trust the timer.' }],
    },
    {
      id: 'pp5', phase: 'cook', title: '35 min before: finish the jollof, toss the chicken',
      body: 'Check and turn the jollof, then give it the smoky party finish (Jollof, steps 11–12). Turn the pepper sauce to low and toss the fried chicken in it (Peppered Chicken, step 7). Leave it covered on the lowest heat.',
      about: '35 minutes before dinner',
      media: [], ingredientIds: [], links: ['party-jollof', 'peppered-chicken'],
    },
    {
      id: 'pp6', phase: 'cook', title: '15 min before: fry the dodo while the jollof rests',
      body: 'Turn off the jollof and let it rest, covered (Jollof, step 13). Now peel, slice and fry the plantain (Dodo, steps 2–5). Dodo is best fresh, so it goes last.',
      about: '15 minutes before dinner',
      timer: { minutes: 15, label: 'Fry dodo, jollof rests' },
      media: [], ingredientIds: [], links: ['dodo', 'party-jollof'],
    },
    {
      id: 'pp7', phase: 'finish', title: 'Plate it the Mcuire way',
      body: 'Spoon a generous mound of jollof onto one side of the plate. Lean a piece or two of peppered chicken against it, spooning over a little sauce. Fan 4–5 slices of dodo on the other side. Add a little coleslaw or sliced tomato and cucumber for freshness.',
      media: [photo('Step-by-step plating: jollof mound, chicken leaning, dodo fanned, salad.', 'jollof')],
      ingredientIds: [],
      checkpoint: {
        question: 'Is everything hot and ready together?',
        options: [
          { id: 'yes', label: 'All hot at once', verdict: 'good', media: photo('Three dishes ready on the counter at once.', 'jollof'), guidance: 'You just cooked a party plate. That’s real confidence in the kitchen.' },
          { id: 'cold', label: 'Something went cold', verdict: 'fix', media: photo('Reheating chicken in a hot oven.', 'suya'), guidance: 'Warm chicken for 8 minutes in a 200°C oven, and jollof covered on low with a splash of water. Next time, start the chicken 15 minutes later.' },
        ],
      },
    },
  ],
});

// ---------------------------------------------------------------------------
export const egusiPoundedYam = meal({
  id: 'egusi-pounded-yam',
  title: 'Egusi + Pounded Yam',
  subtitle: 'Soup and swallow, the way it’s served at a Mcuire table.',
  story:
    'Pounded yam has to be made at the very last minute, while the soup waits happily on low heat. This plan shows you how to get them to the table together, piping hot.',
  prepMinutes: 40,
  cookMinutes: 100,
  difficulty: 'Beginner friendly',
  baseServings: 6,
  components: ['egusi', 'pounded-yam'],
  hero: photo('Egusi in a bowl beside a smooth mound of pounded yam on a Mcuire plate. 45°.', 'egusi', 'Egusi and pounded yam'),
  steps: [
    {
      id: 'ep1', phase: 'prep', title: '2 hr before: start the meat',
      body: 'Season and steam the meat, then simmer until tender (Egusi, steps 1–3). While it simmers, soak the fish, blend the peppers and mix the egusi paste (Egusi, steps 4–6).',
      about: '2 hr before dinner',
      timer: { minutes: 45, label: 'Meat simmers: prep the rest' },
      media: [], ingredientIds: [], links: ['egusi'],
    },
    {
      id: 'ep2', phase: 'cook', title: '1 hr 10 before: cook the soup',
      body: 'Fry the egusi lumps in palm oil, add the peppers and stock, then the meat and fish, and simmer (Egusi, steps 7–11).',
      about: '1 hr 10 before dinner',
      media: [], ingredientIds: [], links: ['egusi'],
    },
    {
      id: 'ep3', phase: 'prep', title: '45 min before: peel and boil the yam',
      body: 'While the soup simmers, peel and cut the yam and put it on to boil (Pounded Yam, steps 1–2).',
      about: '45 minutes before dinner',
      timer: { minutes: 25, label: 'Yam boils' },
      media: [], ingredientIds: [], links: ['pounded-yam'],
      tips: [{ kind: 'kitchen', text: 'Set up your food processor now, so it’s ready the moment the yam is soft.' }],
    },
    {
      id: 'ep4', phase: 'cook', title: '15 min before: greens in, soup on low',
      body: 'Stir the greens into the egusi (Egusi, step 12), then turn the soup to the lowest heat and cover it. It will happily wait.',
      about: '15 minutes before dinner',
      media: [], ingredientIds: [], links: ['egusi'],
    },
    {
      id: 'ep5', phase: 'cook', title: '10 min before: pound the yam',
      body: 'Drain the yam and pound it while it’s very hot, then shape it into balls (Pounded Yam, steps 3–5).',
      about: '10 minutes before dinner',
      media: [], ingredientIds: [], links: ['pounded-yam'],
      tips: [{ kind: 'mcuire', text: 'Swallow is always last. Soup can wait; pounded yam can’t.' }],
    },
    {
      id: 'ep6', phase: 'finish', title: 'Serve',
      body: 'Ladle egusi into deep bowls with plenty of meat and fish. Put a ball of pounded yam on a plate beside each bowl. Put a bowl of water on the table for washing hands: it’s traditional to eat this with your right hand.',
      media: [photo('Table set with egusi, pounded yam and a hand-washing bowl.', 'egusi')],
      ingredientIds: [],
    },
  ],
});

// ---------------------------------------------------------------------------
export const riceStewProtein = meal({
  id: 'rice-stew-protein',
  title: 'Rice + Stew + Protein',
  subtitle: 'Cook once on Sunday, eat well all week. A meal-prep plan with Nigerian stew.',
  story:
    'A big pot of stew is the backbone of a Nigerian kitchen. Cook it once and it becomes rice and stew, stew with yam, stew with plantain and beans… This plan doubles the stew, portions it and gives you a week of quick dinners.',
  prepMinutes: 30,
  cookMinutes: 100,
  difficulty: 'Beginner friendly',
  baseServings: 10,
  servingOptions: [6, 10, 15, 20],
  components: ['white-rice-and-stew', 'dodo'],
  hero: photo('Meal-prep containers of rice and red stew with chicken, a pot of stew behind. Overhead.', 'jollof', 'Rice and stew meal prep'),
  steps: [
    {
      id: 'rs1', phase: 'prep', title: 'Choose your batch size',
      body: 'Set the servings above to the number of meals you want for the week (10 is about 5 days for 2 people). Add this meal to your shopping list and the quantities scale automatically.',
      about: 'Before you shop',
      media: [], ingredientIds: [], links: ['white-rice-and-stew'],
      tips: [{ kind: 'kitchen', text: 'You’ll need your largest pot. If it’s more than half full, split the stew between two pots.' }],
    },
    {
      id: 'rs2', phase: 'cook', title: 'Cook the chicken and the stew base together',
      body: 'Cook the chicken in its juices while you blend and boil down the stew base (Rice & Stew, steps 1–3).',
      about: 'First 30 minutes',
      media: [], ingredientIds: [], links: ['white-rice-and-stew'],
    },
    {
      id: 'rs3', phase: 'cook', title: 'Fry the stew slowly',
      body: 'Fry the chicken if you like, then fry the paste and the stew base until the oil rises (Rice & Stew, steps 4–6). A big batch takes 5–10 minutes longer. Wait for the oil.',
      about: '45 minutes',
      media: [], ingredientIds: [], links: ['white-rice-and-stew'],
    },
    {
      id: 'rs4', phase: 'cook', title: 'Cook the rice and finish the stew',
      body: 'Cook the rice while the stew finishes with the stock and chicken (Rice & Stew, steps 7–8).',
      about: '20 minutes',
      media: [], ingredientIds: [], links: ['white-rice-and-stew'],
    },
    {
      id: 'rs5', phase: 'finish', title: 'Cool quickly and portion',
      body: 'Spread the rice on a tray to cool, and pour the stew into a wide dish so it cools faster. Within 2 hours of cooking, divide into containers: rice, a ladle of stew and one piece of chicken each. Refrigerate what you’ll eat in the next 3 days and freeze the rest.',
      why: 'Cooling quickly and refrigerating within 2 hours keeps cooked rice safe to eat later.',
      about: '20 minutes',
      timer: { minutes: 20, label: 'Cool before portioning' },
      media: [photo('Portioning rice, stew and chicken into containers.', 'jollof')],
      ingredientIds: [],
      tips: [{ kind: 'watch', text: 'Reheat rice until steaming hot all the way through, and only reheat it once.' }],
    },
    {
      id: 'rs6', phase: 'finish', title: 'On the day: add fresh dodo',
      body: 'Reheat a container until steaming hot. Fry a fresh plantain in 10 minutes (Dodo lesson) and you have a full Mcuire plate on a weeknight.',
      media: [], ingredientIds: [], links: ['dodo'],
      tips: [{ kind: 'mcuire', text: 'Leftover stew also turns into a new meal: serve it with boiled yam, with beans and plantain, or with fried eggs and bread.' }],
    },
  ],
});

// ---------------------------------------------------------------------------
export const sundayDinner = meal({
  id: 'sunday-dinner',
  title: 'West African Sunday Dinner',
  subtitle: 'Fried rice, peppered chicken, moi moi and dodo: a full family table, planned from morning to plate.',
  story:
    'Sunday dinner is about the whole table. The trick is that two dishes, moi moi and seasoned chicken, can be done in the morning, so the afternoon is calm and dinner arrives together.',
  prepMinutes: 90,
  cookMinutes: 180,
  difficulty: 'Intermediate',
  baseServings: 8,
  servingOptions: [6, 8, 10, 15, 20],
  components: ['moi-moi', 'peppered-chicken', 'nigerian-fried-rice', 'dodo'],
  hero: photo('A family table: fried rice, peppered chicken, moi moi turned out, dodo, coleslaw, drinks. Overhead.', 'plantain', 'A West African Sunday dinner'),
  steps: [
    {
      id: 'sd1', phase: 'prep', title: 'Morning: soak the beans and season the chicken',
      body: 'Put the beans to soak (Moi Moi, step 1) and season the chicken, then put it in the fridge (Peppered Chicken, steps 1–2).',
      about: 'Morning (around 10am for a 5pm dinner)',
      timer: { minutes: 30, label: 'Beans soak' },
      media: [], ingredientIds: [], links: ['moi-moi', 'peppered-chicken'],
    },
    {
      id: 'sd2', phase: 'cook', title: 'Late morning: make and steam the moi moi',
      body: 'Peel and blend the beans, mix the batter, fill the containers and steam them (Moi Moi, steps 2–7). Once set, let them cool in the pot. They reheat perfectly later.',
      about: 'Late morning',
      media: [], ingredientIds: [], links: ['moi-moi'],
      tips: [{ kind: 'mcuire', text: 'Making moi moi first means the hardest dish is done before lunch.' }],
    },
    {
      id: 'sd3', phase: 'prep', title: '3 hr before: cook the curry rice and cool it',
      body: 'Cook the rice in curry stock and spread it out to cool (Fried Rice, steps 1–3). Then chop all the vegetables.',
      about: '3 hr before dinner',
      media: [], ingredientIds: [], links: ['nigerian-fried-rice'],
      tips: [{ kind: 'kitchen', text: 'Rice cooked early and cooled makes the best fried rice.' }],
    },
    {
      id: 'sd4', phase: 'cook', title: '2 hr before: cook and fry the chicken',
      body: 'Cook the chicken in its juices, dry it, and fry (or bake) it (Peppered Chicken, steps 3–5). Make the pepper sauce but don’t toss yet (step 6).',
      about: '2 hr before dinner',
      media: [], ingredientIds: [], links: ['peppered-chicken'],
    },
    {
      id: 'sd5', phase: 'cook', title: '45 min before: fry the rice',
      body: 'Cook the prawns and liver, stir-fry the vegetables, then fry the rice in batches (Fried Rice, steps 4–7). Cover the dish with foil and keep it in a low oven (90°C).',
      about: '45 minutes before dinner',
      media: [], ingredientIds: [], links: ['nigerian-fried-rice'],
    },
    {
      id: 'sd6', phase: 'cook', title: '20 min before: reheat moi moi, toss chicken, fry dodo',
      body: 'Put the moi moi back on to steam for 15 minutes. Toss the chicken in the warm pepper sauce (Peppered Chicken, step 7). Fry the dodo last (Dodo, steps 2–5).',
      about: '20 minutes before dinner',
      timer: { minutes: 15, label: 'Moi moi reheats: fry dodo' },
      media: [], ingredientIds: [], links: ['peppered-chicken', 'dodo', 'moi-moi'],
    },
    {
      id: 'sd7', phase: 'finish', title: 'Set the table',
      body: 'Serve everything family-style in the middle of the table: fried rice in a big dish, chicken piled high, moi moi turned out onto a plate, dodo in a bowl, and a fresh salad or coleslaw.',
      media: [photo('Family-style table layout from above.', 'plantain')],
      ingredientIds: [],
    },
  ],
});

// ---------------------------------------------------------------------------
export const partyPlatter = meal({
  id: 'party-platter',
  title: 'Party Platter for 20',
  subtitle: 'Small chops, jollof, fried rice and grills for a crowd, with a two-day timing plan.',
  story:
    'Feeding twenty people is about planning, not panic. Half of this menu can be made the day before. This is the order we’d use in the Mcuire kitchen for a big celebration.',
  prepMinutes: 180,
  cookMinutes: 300,
  difficulty: 'Confident cook',
  baseServings: 20,
  servingOptions: [10, 15, 20, 30, 40],
  components: ['party-jollof', 'nigerian-fried-rice', 'peppered-chicken', 'suya', 'moi-moi', 'puff-puff', 'dodo', 'chin-chin'],
  hero: photo('A full party table: trays of jollof and fried rice, chicken, suya, moi moi, puff-puff, dodo, chin chin. Overhead.', 'jollof', 'A party platter'),
  steps: [
    {
      id: 'pt1', phase: 'prep', title: 'A week before: plan, shop and make chin chin',
      body: 'Add this meal to your shopping list for 20 people. Check you have big enough pots. You’ll want two pots for the jollof (rice cooks unevenly in one giant pot). Make the chin chin now: it keeps for weeks in a sealed container.',
      about: 'Up to a week before',
      media: [], ingredientIds: [], links: ['chin-chin'],
      tips: [{ kind: 'mcuire', text: 'Ask one friend to help on the day just with frying. It changes everything.' }],
    },
    {
      id: 'pt2', phase: 'prep', title: 'The day before: bases, seasoning and moi moi',
      body: 'Blend and boil down the jollof pepper base (Jollof, steps 2–3) and refrigerate it. Season the chicken (Peppered Chicken, steps 1–2) and the suya beef (Suya, steps 1–4) and refrigerate them. Make and steam the moi moi (Moi Moi lesson). It reheats perfectly.',
      about: 'The day before',
      media: [], ingredientIds: [], links: ['party-jollof', 'peppered-chicken', 'suya', 'moi-moi'],
    },
    {
      id: 'pt3', phase: 'cook', title: 'Party morning: rice dishes',
      body: 'Cook and cool the curry rice for fried rice (Fried Rice, steps 1–3). Then cook the jollof in two pots, using your ready-made base (Jollof, steps 4–13). Keep the jollof covered. It holds its heat well.',
      about: 'Morning',
      media: [], ingredientIds: [], links: ['nigerian-fried-rice', 'party-jollof'],
    },
    {
      id: 'pt4', phase: 'cook', title: '3 hr before: chicken, then puff-puff batter',
      body: 'Cook, fry and sauce the chicken (Peppered Chicken, steps 3–7). Mix the puff-puff batter and leave it to rise (Puff-Puff, steps 1–4).',
      about: '3 hr before guests arrive',
      media: [], ingredientIds: [], links: ['peppered-chicken', 'puff-puff'],
    },
    {
      id: 'pt5', phase: 'cook', title: '90 min before: fry the rice and puff-puff',
      body: 'Finish the fried rice (Fried Rice, steps 4–7) and keep it covered in a low oven. Fry the puff-puff (Puff-Puff, steps 5–8).',
      about: '90 minutes before',
      media: [], ingredientIds: [], links: ['nigerian-fried-rice', 'puff-puff'],
    },
    {
      id: 'pt6', phase: 'cook', title: '40 min before: suya, moi moi and dodo',
      body: 'Grill the suya (Suya, steps 5–8). Reheat the moi moi by steaming it for 15–20 minutes. Fry the dodo last (Dodo lesson).',
      about: '40 minutes before',
      timer: { minutes: 20, label: 'Moi moi reheats: grill suya' },
      media: [], ingredientIds: [], links: ['suya', 'dodo', 'moi-moi'],
    },
    {
      id: 'pt7', phase: 'finish', title: 'Lay out the platter',
      body: 'Serve the rice dishes side by side in large trays. Pile chicken and suya together, with onions and yaji. Put the small chops (puff-puff, chin chin, dodo, moi moi) on a separate platter, so guests can graze before the main meal.',
      media: [photo('Party buffet layout: rice trays, grills, small chops platter.', 'jollof')],
      ingredientIds: [],
      checkpoint: {
        question: 'How did it go?',
        options: [
          { id: 'great', label: 'Everything came together', verdict: 'good', media: photo('Happy guests at a full party table.', 'jollof'), guidance: 'You just catered a party. That’s Party Chef territory.' },
          { id: 'rushed', label: 'Some things were rushed', verdict: 'fix', media: photo('Busy kitchen counter mid-party.', 'suya'), guidance: 'Totally normal the first time. Next time, move puff-puff to the morning and keep it warm in a low oven.' },
        ],
      },
    },
  ],
});

export const MEALS = [partyPlate, egusiPoundedYam, riceStewProtein, sundayDinner, partyPlatter];
