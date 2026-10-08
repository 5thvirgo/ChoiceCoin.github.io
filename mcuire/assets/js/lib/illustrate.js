// Drawn illustrations for every photo slot that doesn't have a real photo yet.
// Each picture is built from the slot's own description ("Fried pepper sauce
// with red oil floating on top", "Golden puff-puff draining on paper"...), so
// every step shows the right vessel, colours, heat, steam and ingredients.
// They are clearly drawings: the moment staff upload a photo, it replaces them.

const rng = (seed) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const f = (n) => Math.round(n * 10) / 10;
const has = (t, re) => re.test(t);

// ---- colours ---------------------------------------------------------------
const FOOD = {
  red: ['#b8321c', '#d9542b', '#8f2414'],
  palm: ['#d24e17', '#ee7a2a', '#9e3510'],
  orange: ['#d8662a', '#f08a3c', '#a84a1c'],
  egusi: ['#cfa556', '#e6c47a', '#9c7a3a'],
  green: ['#3d7a2a', '#5e9c3a', '#2a5a1c'],
  olive: ['#6b7a2c', '#8c9a3e', '#4a5a1e'],
  white: ['#f1eadb', '#fffaf0', '#d8ccb4'],
  yellow: ['#e5c25e', '#f3d985', '#b8952f'],
  brown: ['#7a4426', '#9a5a32', '#55301a'],
  dark: ['#4a3122', '#6a4630', '#2e1d12'],
  golden: ['#d99a32', '#f0bd55', '#a8701c'],
  stock: ['#c99a4e', '#e2b86a', '#9c7034'],
  water: ['#cfe0dc', '#eef6f3', '#a8bfba'],
  batter: ['#ecd8a8', '#f8ead0', '#c9b07a'],
  beans: ['#b9895a', '#d4a874', '#8a6038'],
  cream: ['#efe2c2', '#fbf3df', '#cdbb92'],
};

const mix = (hex, to, amt) => {
  const a = parseInt(hex.slice(1), 16); const b = parseInt(to.slice(1), 16);
  const c = [16, 8, 0].map((sh) => Math.round(((a >> sh) & 255) * (1 - amt) + ((b >> sh) & 255) * amt));
  return `#${c.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
};

const COLOUR_RULES = [
  [/egusi|melon/, 'egusi'], [/ayamase|green pepper|olive/, 'olive'],
  [/milky water|clear water|soaking|in water|rinse|wash/, 'water'],
  [/batter|dough|flour/, 'batter'],
  [/golden stock|stock|broth(?! with palm)/, 'stock'],
  [/palm (oil|cream|nut)|banga|red-orange/, 'palm'],
  [/pale orange|orange/, 'orange'],
  [/jollof|pepper|tomato|stew|sauce|red|ata|shito|yaji/, 'red'],
  [/spinach|ugu|ewedu|leaf|leaves|greens|bitterleaf|afang|oha|green|okra|okro|vegetables/, 'green'],
  [/ogbono|amala|dark brown|waakye|ofada|reddish-brown/, 'dark'],
  [/beans|moi moi|bean/, 'beans'],
  [/eba|garri|gari|yellow|semolina|curry/, 'yellow'],
  [/golden|puff|akara|chin chin|dodo|plantain|pie|crisp|caramel/, 'golden'],
  [/rice|yam|fufu|white|coconut|cocoyam/, 'white'],
  [/suya|yaji|asun|beef|goat|meat|chicken|fish|shaki|tilapia/, 'brown'],
  [/onion/, 'cream'],
  [/fried|fry/, 'golden', true],
];
const TONE_COLOUR = { jollof: 'red', rice: 'white', egusi: 'egusi', suya: 'brown', plantain: 'golden', leaf: 'green', onion: 'cream' };

// Colours named in the description, in the order they are mentioned.
function colours(t, tone) {
  const found = [];
  for (const [re, k, weak] of COLOUR_RULES) {
    const m = re.exec(t);
    if (m && !found.some((x) => x.k === k) && !(weak && found.length)) found.push({ k, i: m.index });
  }
  found.sort((a, b) => a.i - b.i);
  const keys = found.map((x) => x.k);
  // Jollof-family rice stays red/orange even when the sentence starts with "rice".
  if (tone === 'jollof' && keys[0] === 'white' && !/white rice|white/.test(t)) keys.unshift('red');
  if (!keys.length) keys.push(TONE_COLOUR[tone] || 'red');
  return keys.map((k) => FOOD[k]);
}

function foodColour(t, tone) {
  let c = colours(t, tone)[0].slice();
  if (/thin|juice|watery|splashy|bright|just added|at the start|wet|pale|raw/.test(t)) c = c.map((x) => mix(x, '#ffffff', 0.14));
  if (/reduced|thick|deep|darker|brick|concentrated/.test(t)) c = c.map((x) => mix(x, '#2a0a00', 0.18));
  if (/too dry|catching|burn|scorch|dark patches|black specks|overfried|dark brown/.test(t)) c = c.map((x) => mix(x, '#1a0a00', 0.42));
  return c;
}

// ---- small parts -------------------------------------------------------------
const P = {
  meat: (x, y, s, r) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 360)}) scale(${f(s)})"><path d="M-9 -6 Q-2 -11 7 -7 Q12 -1 8 6 Q0 11 -8 7 Q-12 0 -9 -6Z" fill="#7a3a1e"/><path d="M-6 -5 Q0 -8 5 -5" stroke="#a65a32" stroke-width="2" fill="none" stroke-linecap="round"/></g>`,
  chicken: (x, y, s, r) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 360)}) scale(${f(s)})"><ellipse cx="0" cy="0" rx="13" ry="9" fill="#b0581f"/><ellipse cx="-3" cy="-3" rx="7" ry="4" fill="#d07a33" opacity=".8"/><rect x="11" y="-2.5" width="9" height="5" rx="2.5" fill="#efe0c4"/></g>`,
  fish: (x, y, s, r) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 40 - 20)}) scale(${f(s)})"><path d="M-16 0 Q-4 -10 10 0 Q-4 10 -16 0Z" fill="#a8774a"/><path d="M10 0 L19 -7 L19 7Z" fill="#8a5a33"/><circle cx="-10" cy="-1.5" r="1.4" fill="#2a1a10"/></g>`,
  egg: (x, y, s) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><ellipse rx="9" ry="7" fill="#fbf7ee"/><circle r="4" fill="#f2b632"/></g>`,
  plantain: (x, y, s, r) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 180)}) scale(${f(s)})"><ellipse rx="10" ry="6.5" fill="#9a4a14"/><ellipse rx="8" ry="5" fill="#e3992e"/><ellipse cx="-2" cy="-1" rx="4" ry="2" fill="#f6c65c" opacity=".8"/></g>`,
  onion: (x, y, s, r) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 180)}) scale(${f(s)})" fill="none" stroke="#f3e6c8" stroke-width="2"><ellipse rx="10" ry="7"/><ellipse rx="6" ry="4" opacity=".7"/></g>`,
  tomato: (x, y, s) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><circle r="9" fill="#d23a22"/><circle r="6" fill="#e8613f"/><circle cx="-2" cy="1" r="1" fill="#f6d36a"/><circle cx="2" cy="-2" r="1" fill="#f6d36a"/><circle cx="2" cy="2.5" r="1" fill="#f6d36a"/></g>`,
  pepper: (x, y, s, r) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 360)}) scale(${f(s)})"><path d="M-8 -2 Q-9 -9 -2 -8 Q2 -11 6 -7 Q11 -4 8 2 Q8 9 0 8 Q-9 8 -8 -2Z" fill="#c9221a"/><path d="M-1 -8 Q1 -13 4 -12" stroke="#3d7a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/><ellipse cx="-3" cy="-3" rx="2.5" ry="1.5" fill="#f06a52" opacity=".8"/></g>`,
  leaf: (x, y, s, r) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 360)}) scale(${f(s)})"><path d="M-12 0 Q0 -9 12 0 Q0 9 -12 0Z" fill="#3f8a2c"/><path d="M-10 0 L10 0" stroke="#7cbc52" stroke-width="1"/></g>`,
  ball: (x, y, s) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><circle r="10" fill="#e8ac3c"/><circle r="10" fill="url(#ballsh)"/><circle cx="-3.5" cy="-3.5" r="3" fill="#fbe0a0" opacity=".8"/></g>`,
  square: (x, y, s, r) => `<rect x="${f(x - 4 * s)}" y="${f(y - 4 * s)}" width="${f(8 * s)}" height="${f(8 * s)}" rx="${f(2 * s)}" fill="#d99a32" stroke="#a8701c" stroke-width="1" transform="rotate(${f(r() * 90)} ${f(x)} ${f(y)})"/>`,
  pie: (x, y, s, r) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 30 - 15)}) scale(${f(s)})"><path d="M-16 4 Q-16 -12 0 -12 Q16 -12 16 4Z" fill="#dca04a"/><path d="M-16 4 L16 4" stroke="#b27a2e" stroke-width="3" stroke-dasharray="2 2.5"/><ellipse cx="-3" cy="-6" rx="7" ry="3" fill="#f2c477" opacity=".7"/></g>`,
  crayfish: (x, y, s, r) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 360)}) scale(${f(s)})"><path d="M-6 0 Q0 -5 6 -1 Q2 4 -6 0Z" fill="#c4562a"/></g>`,
  chunk: (x, y, s, r, c) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(5 * s)}" ry="${f(3.5 * s)}" fill="${c}" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})"/>`,
};

function itemsFor(t) {
  const out = [];
  const add = (k, n) => out.push([k, n]);
  if (has(t, /chicken|drumstick|thigh/)) add('chicken', 4);
  if (has(t, /beef|goat|meat|shaki|cow skin|assorted|protein|mince/) && !has(t, /meat pie/)) add('meat', 5);
  if (has(t, /fish|mackerel|tilapia|stockfish/)) add('fish', 2);
  if (has(t, /crayfish/)) add('crayfish', 6);
  if (has(t, /egg/)) add('egg', 2);
  if (has(t, /plantain|dodo|kelewele/)) add('plantain', 5);
  if (has(t, /onion (rings|slices)|sliced onion|onion rings|raw onion|chopped onion/)) add('onion', 4);
  if (has(t, /tomato (slices|rings)|sliced tomato/)) add('tomato', 3);
  if (has(t, /scotch|bonnet|peppers(?! sauce)|whole pepper|tatashe|rodo/)) add('pepper', 4);
  if (has(t, /spinach|ugu|leaf|leaves|greens|bitterleaf|afang|oha|uziza|scent/) && !has(t, /uma leaf/)) add('leaf', 6);
  if (has(t, /puff-puff|puff puff|akara|ball/)) add('ball', 7);
  if (has(t, /chin chin|cubes|squares/)) add('square', 14);
  if (has(t, /meat pie|pies/)) add('pie', 3);
  return out;
}

// ---- backgrounds -------------------------------------------------------------
function backdrop(kind, id) {
  if (kind === 'linen') {
    return `<rect width="400" height="300" fill="#efe4cf"/><rect width="400" height="300" fill="url(#${id}-weave)" opacity=".5"/>
      <rect x="-20" y="210" width="440" height="40" fill="#c43d1a" opacity=".12" transform="rotate(-6 200 230)"/>`;
  }
  return `<rect width="400" height="300" fill="url(#${id}-wood)"/>
    ${[40, 95, 150, 205, 260].map((y, i) => `<path d="M0 ${y} Q100 ${y + (i % 2 ? 6 : -6)} 200 ${y} T400 ${y}" stroke="#2a1a10" stroke-opacity=".18" fill="none"/>`).join('')}`;
}

function defs(id) {
  return `<defs>
    <linearGradient id="${id}-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d4428"/><stop offset="1" stop-color="#3e2616"/></linearGradient>
    <pattern id="${id}-weave" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 3H6M3 0V6" stroke="#d9c9a8" stroke-width="1"/></pattern>
    <linearGradient id="${id}-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1f1f22"/><stop offset=".35" stop-color="#55565c"/><stop offset=".55" stop-color="#2c2d31"/><stop offset="1" stop-color="#18181a"/></linearGradient>
    <radialGradient id="${id}-light" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient>
    <radialGradient id="ballsh" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#7a4a10" stop-opacity=".45"/></radialGradient>
    <radialGradient id="${id}-food" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient>
  </defs>`;
}

// ---- contents of a round vessel ---------------------------------------------
function contents(cx, cy, rx, ry, t, col, r, id) {
  let s = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${col[0]}"/>`;
  // texture: rice grains, lumps, flecks
  if (has(t, /rice|grain/) && !has(t, /before (the )?rice|rice goes in/)) {
    for (let i = 0; i < Math.round(rx * 1.1); i++) {
      const a = r() * Math.PI * 2; const d = Math.sqrt(r());
      s += `<ellipse cx="${f(cx + Math.cos(a) * rx * d * 0.92)}" cy="${f(cy + Math.sin(a) * ry * d * 0.9)}" rx="${f(rx / 32)}" ry="${f(rx / 80)}" fill="${mix(col[0], '#ffffff', 0.35)}" stroke="${col[2]}" stroke-width=".4" opacity=".95" transform="rotate(${f(r() * 180)} ${f(cx + Math.cos(a) * rx * d * 0.92)} ${f(cy + Math.sin(a) * ry * d * 0.9)})"/>`;
    }
  } else if (has(t, /lump|grainy|coarse|chunky|egusi|crumbl|clump/)) {
    for (let i = 0; i < 28; i++) {
      const a = r() * Math.PI * 2; const d = Math.sqrt(r());
      s += P.chunk(cx + Math.cos(a) * rx * d * 0.85, cy + Math.sin(a) * ry * d * 0.8, 0.6 + r() * 0.7, r, i % 2 ? col[1] : col[2]);
    }
  } else {
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2; const d = Math.sqrt(r());
      s += `<ellipse cx="${f(cx + Math.cos(a) * rx * d * 0.8)}" cy="${f(cy + Math.sin(a) * ry * d * 0.75)}" rx="${f(8 + r() * 14)}" ry="${f(2 + r() * 3)}" fill="${col[1]}" opacity=".45"/>`;
    }
  }
  if (has(t, /green|spinach|leaf|leaves|ugu|ewedu|bitterleaf|afang|oha|uziza|scent|okra|okro/) && !has(t, /^green|ayamase/)) {
    for (let i = 0; i < 12; i++) { const a = r() * Math.PI * 2; const d = Math.sqrt(r()); s += P.chunk(cx + Math.cos(a) * rx * d * 0.85, cy + Math.sin(a) * ry * d * 0.8, 0.9, r, '#3f8a2c'); }
  }
  if (has(t, /oil|glossy|separat|floating|sheen/)) {
    for (let i = 0; i < 6; i++) {
      const a = r() * Math.PI * 2; const d = 0.55 + r() * 0.35;
      s += `<ellipse cx="${f(cx + Math.cos(a) * rx * d)}" cy="${f(cy + Math.sin(a) * ry * d)}" rx="${f(10 + r() * 16)}" ry="${f(3 + r() * 3)}" fill="#ff8a2a" opacity=".55"/>`;
    }
  }
  if (has(t, /too much liquid|submerged|liquid (just )?above|like soup|watery|juice|thin|runny|splashy/)) {
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${mix(col[0], '#ffffff', 0.25)}" opacity=".55"/>`;
    for (let i = 0; i < 4; i++) s += `<path d="M${f(cx - rx * 0.6 + r() * rx * 0.4)} ${f(cy - ry * 0.5 + i * ry * 0.3)} q${f(rx * 0.12)} -5 ${f(rx * 0.25)} 0 t${f(rx * 0.25)} 0" stroke="#fff" stroke-opacity=".45" fill="none" stroke-width="2"/>`;
  }
  if (has(t, /level with|correct liquid|just absorbed|glossy/)) s += `<ellipse cx="${f(cx - rx * 0.3)}" cy="${f(cy - ry * 0.35)}" rx="${f(rx * 0.35)}" ry="${f(ry * 0.18)}" fill="#fff" opacity=".22"/>`;
  if (has(t, /too little liquid|dry grains|dry|chalky|hard white/)) {
    for (let i = 0; i < 30; i++) { const a = r() * Math.PI * 2; const d = Math.sqrt(r()); s += `<circle cx="${f(cx + Math.cos(a) * rx * d * 0.85)}" cy="${f(cy + Math.sin(a) * ry * d * 0.8)}" r="1.6" fill="#fffaf0" opacity=".9"/>`; }
  }
  if (has(t, /sticky|clump|soggy|mushy|overcooked|stiff|cracking/)) {
    for (let i = 0; i < 7; i++) { const a = r() * Math.PI * 2; const d = Math.sqrt(r()) * 0.7; s += `<ellipse cx="${f(cx + Math.cos(a) * rx * d)}" cy="${f(cy + Math.sin(a) * ry * d)}" rx="${f(rx * 0.14)}" ry="${f(ry * 0.22)}" fill="${col[2]}" opacity=".45"/>`; }
  }
  if (has(t, /black specks|burn|scorch|dark patches|catching/)) {
    for (let i = 0; i < 22; i++) { const a = r() * Math.PI * 2; const d = 0.5 + r() * 0.5; s += `<circle cx="${f(cx + Math.cos(a) * rx * d * 0.92)}" cy="${f(cy + Math.sin(a) * ry * d * 0.9)}" r="${f(1 + r() * 3)}" fill="#120804" opacity=".85"/>`; }
  }
  if (has(t, /stretchy|drawy|strands|stretch/)) {
    for (let i = 0; i < 3; i++) s += `<path d="M${cx + 30 + i * 8} ${cy - 50} Q${cx + 20 + i * 10} ${cy - 20} ${cx + 10 + i * 12} ${cy}" stroke="${col[1]}" stroke-width="3" fill="none" opacity=".8"/>`;
  }
  if (has(t, /boil|bubbl|simmer|rolling|fry|frying|sizzl/)) {
    for (let i = 0; i < 14; i++) {
      const a = r() * Math.PI * 2; const d = Math.sqrt(r());
      s += `<circle cx="${f(cx + Math.cos(a) * rx * d * 0.85)}" cy="${f(cy + Math.sin(a) * ry * d * 0.8)}" r="${f(1.5 + r() * 3)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>`;
    }
  }
  if (has(t, /trail|drag/)) s += `<path d="M${cx - rx * 0.5} ${cy + 4} Q${cx} ${cy - 6} ${cx + rx * 0.5} ${cy + 2}" stroke="#4a1a0a" stroke-opacity=".55" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  // ingredients floating on top
  for (const [k, n] of itemsFor(t)) {
    for (let i = 0; i < Math.min(n, 6); i++) {
      const a = r() * Math.PI * 2; const d = Math.sqrt(r()) * 0.7;
      s += P[k](cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, (0.9 + r() * 0.3) * Math.max(1, rx / 90), r);
    }
  }
  if (has(t, /butter/)) s += `<rect x="${cx - 8}" y="${cy - 8}" width="16" height="11" rx="2" fill="#fbe7a0"/>`;
  return s + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}-food)"/>`;
}

// ---- vessels -----------------------------------------------------------------
function flame(cx, y, level) {
  const n = level === 'low' ? 5 : level === 'high' ? 9 : 7;
  const h = level === 'low' ? 9 : level === 'high' ? 22 : 15;
  let s = `<ellipse cx="${cx}" cy="${y + 6}" rx="80" ry="10" fill="#111" opacity=".55"/>`;
  for (let i = 0; i < n; i++) {
    const x = cx - 60 + (120 / (n - 1)) * i;
    s += `<path d="M${x - 5} ${y} Q${x} ${y - h} ${x + 5} ${y} Z" fill="#2f7fd6" opacity=".9"/>`;
    if (level !== 'low') s += `<path d="M${x - 2.5} ${y} Q${x} ${y - h * 0.55} ${x + 2.5} ${y} Z" fill="#9fd0ff"/>`;
    if (level === 'high') s += `<path d="M${x - 3} ${y - h * 0.4} Q${x} ${y - h * 1.15} ${x + 3} ${y - h * 0.4} Z" fill="#f39a2c" opacity=".7"/>`;
  }
  return s;
}

function steam(cx, top, r) {
  let s = '';
  for (let i = 0; i < 3; i++) {
    const x = cx - 40 + i * 40 + r() * 10;
    s += `<path d="M${f(x)} ${top} q-10 -16 0 -30 t0 -30" stroke="#fff" stroke-opacity="${f(0.35 + r() * 0.2)}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  }
  return s;
}

function spoon(x, y) {
  return `<g transform="rotate(-38 ${x} ${y})"><rect x="${x - 4}" y="${y - 120}" width="8" height="112" rx="4" fill="#c99a62"/><ellipse cx="${x}" cy="${y}" rx="12" ry="17" fill="#b88650"/><ellipse cx="${x}" cy="${y - 2}" rx="8" ry="12" fill="#d8ac74"/></g>`;
}

function pot(t, col, r, id) {
  const heat = has(t, /low flame|low heat|gentle|lowest/) ? 'low' : has(t, /high heat|rolling|stir-fry|fry/) ? 'high' : 'mid';
  const covered = has(t, /foil|covered|lid on|cover/);
  if (has(t, /close-up|closeup|close up/) && !covered) {
    // Fill the frame with the food; just the pot rim curving at the edges.
    let s = contents(200, 165, 290, 190, t, col, r, id);
    s += `<path d="M-20 40 Q200 -30 420 40" stroke="#2c2d31" stroke-width="26" fill="none"/>`;
    if (has(t, /stir|spoon|push|lift|scrap/)) s += spoon(300, 170);
    return s;
  }
  // How full the pot looks: thin / just-added sauces sit high, reduced ones lower.
  const drop = has(t, /reduced|by half|thick|level (barely|dropped)|dropped/) ? 16 : has(t, /too dry|catching|dry/) ? 24 : 4;
  let s = flame(200, 284, heat);
  s += `<path d="M44 112 L56 250 Q60 276 96 278 L304 278 Q340 276 344 250 L356 112 Z" fill="url(#${id}-steel)"/>`;
  s += `<rect x="12" y="128" width="40" height="13" rx="6" fill="#1d1d20"/><rect x="348" y="128" width="40" height="13" rx="6" fill="#1d1d20"/>`;
  s += `<ellipse cx="200" cy="112" rx="158" ry="64" fill="#3a3b40"/><ellipse cx="200" cy="112" rx="149" ry="58" fill="#202124"/>`;
  if (covered) {
    s += `<ellipse cx="200" cy="108" rx="156" ry="62" fill="#c9ccd2"/>${Array.from({ length: 14 }, () => `<path d="M${f(70 + r() * 260)} ${f(70 + r() * 70)} l${f(r() * 24 - 12)} ${f(r() * 10 - 5)}" stroke="#8e9198" stroke-width="1.2"/>`).join('')}
      <ellipse cx="200" cy="100" rx="128" ry="48" fill="#2c2d31"/><ellipse cx="200" cy="96" rx="22" ry="9" fill="#111"/>`;
  } else {
    s += contents(200, 116 + drop, 141 - drop * 0.6, 52 - drop * 0.5, t, col, r, id);
    if (drop > 4) s += `<ellipse cx="200" cy="${116 + drop}" rx="${141 - drop * 0.6}" ry="${52 - drop * 0.5}" fill="none" stroke="${col[2]}" stroke-width="3" opacity=".7"/>`;
    if (has(t, /stir|spoon|turn|scrap|lift|fold|push|spatula/)) s += spoon(282, 112);
  }
  if (has(t, /steam|boil|simmer|hot|rolling|steaming/) || covered) s += steam(200, 70, r);
  return s;
}

function pan(t, col, r, id) {
  const deep = has(t, /deep[- ]fr|puff|akara|chin chin|hot oil|into (the )?oil|oil is hot/) && !has(t, /pepper|sauce|stew/);
  let s = flame(185, 262, 'high');
  s += `<rect x="290" y="168" width="110" height="14" rx="7" fill="#1b1b1d" transform="rotate(-8 290 175)"/>`;
  s += `<ellipse cx="185" cy="${deep ? 190 : 196}" rx="140" ry="58" fill="url(#${id}-steel)"/><ellipse cx="185" cy="${deep ? 180 : 188}" rx="128" ry="48" fill="#151517"/>`;
  const oil = deep ? ['#d79a2e', '#f2c45a', '#a8701c'] : col;
  s += contents(185, deep ? 184 : 190, 116, 40, deep ? t.replace(/rice|lump|grain/g, '') : t, oil, r, id);
  if (deep) {
    for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2; const d = Math.sqrt(r()); s += `<circle cx="${f(185 + Math.cos(a) * 100 * d)}" cy="${f(184 + Math.sin(a) * 32 * d)}" r="${f(1 + r() * 2)}" fill="#fff6d0" opacity=".8"/>`; }
  }
  if (has(t, /turn|tongs|flip|lift|stir/)) s += spoon(250, 180);
  return s;
}

function blender(t, col) {
  const fill = has(t, /coarse|chunk/) ? 0.55 : 0.6;
  const top = 50; const bottom = 226; const lvl = bottom - (bottom - top) * fill;
  return `<ellipse cx="200" cy="268" rx="96" ry="14" fill="#000" opacity=".35"/>
    <path d="M130 232 L270 232 L262 270 L138 270 Z" fill="#1d1d20"/><circle cx="200" cy="252" r="7" fill="#c43d1a"/>
    <path d="M140 ${top} L260 ${top} L250 ${bottom} L150 ${bottom} Z" fill="#dfe9ee" opacity=".35" stroke="#eef6f9" stroke-opacity=".7" stroke-width="3"/>
    <path d="M${f(140 + (lvl - top) * 0.083)} ${f(lvl)} L${f(260 - (lvl - top) * 0.083)} ${f(lvl)} L250 ${bottom} L150 ${bottom} Z" fill="${col[0]}"/>
    ${has(t, /coarse|chunk/) ? Array.from({ length: 22 }, (_, i) => `<circle cx="${160 + (i * 37) % 80}" cy="${f(lvl + 10 + ((i * 53) % (bottom - lvl - 16)))}" r="${2 + (i % 3)}" fill="${col[2]}" opacity=".8"/>`).join('') : `<path d="M150 ${f(lvl + 20)} Q200 ${f(lvl + 10)} 250 ${f(lvl + 20)}" stroke="${col[1]}" stroke-width="4" fill="none" opacity=".7"/>`}
    <path d="M260 70 Q300 80 296 130 Q292 160 255 170" stroke="#eef6f9" stroke-opacity=".6" stroke-width="7" fill="none"/>
    <rect x="132" y="36" width="136" height="16" rx="5" fill="#1d1d20"/>
    <path d="M152 60 L160 220" stroke="#fff" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/>`;
}

function board(t, col, r) {
  let s = `<ellipse cx="200" cy="262" rx="170" ry="16" fill="#000" opacity=".3"/>
    <rect x="40" y="70" width="320" height="180" rx="22" fill="#c4945e"/><rect x="40" y="70" width="320" height="180" rx="22" fill="none" stroke="#9a6c3c" stroke-width="3"/>
    ${[100, 140, 180, 220].map((y) => `<path d="M58 ${y} Q200 ${y + 5} 342 ${y - 3}" stroke="#a8784a" stroke-opacity=".5" fill="none"/>`).join('')}
    <g transform="rotate(-18 300 120)"><rect x="210" y="104" width="120" height="22" rx="6" fill="#d9dde2"/><path d="M210 104 L330 104 L330 126 Q260 132 210 126Z" fill="#eef1f4"/><rect x="330" y="107" width="56" height="16" rx="6" fill="#2a1a10"/></g>`;
  const items = itemsFor(t);
  const list = items.length ? items : [['chunk', 18]];
  let i = 0;
  for (const [k, n] of list) {
    for (let j = 0; j < Math.min(n, 9); j++, i++) {
      const x = 80 + r() * 170; const y = 115 + r() * 110;
      s += k === 'chunk' ? P.chunk(x, y, 2.4, r, col[i % 2]) : P[k](x, y, 2.1, r);
    }
  }
  return s;
}

function bowl(t, col, r, id, cx = 200, cy = 170, w = 130) {
  const ceramic = has(t, /glass|clear/) ? '#e8eef0' : '#e9dcc4';
  return `<ellipse cx="${cx}" cy="${cy + 92}" rx="${w * 0.8}" ry="14" fill="#000" opacity=".3"/>
    <path d="M${cx - w} ${cy - 10} Q${cx - w + 10} ${cy + 90} ${cx} ${cy + 90} Q${cx + w - 10} ${cy + 90} ${cx + w} ${cy - 10} Z" fill="${ceramic}"/>
    <path d="M${cx - w} ${cy - 10} Q${cx - w + 10} ${cy + 90} ${cx} ${cy + 90} Q${cx + w - 10} ${cy + 90} ${cx + w} ${cy - 10} Z" fill="url(#${id}-light)"/>
    <path d="M${cx - w + 14} ${cy + 30} Q${cx} ${cy + 52} ${cx + w - 14} ${cy + 30}" stroke="#c43d1a" stroke-width="5" fill="none" opacity=".7"/>
    <ellipse cx="${cx}" cy="${cy - 10}" rx="${w}" ry="${w * 0.3}" fill="#d7c6a8"/>
    ${contents(cx, cy - 6, w - 12, w * 0.26, t, col, r, id)}
    ${has(t, /whisk|whip|stir|mix|knead|spoon/) ? spoon(cx + w * 0.55, cy - 10) : ''}`;
}

function plate(t, col0, r, id, tone) {
  // The mound is the rice or main starch when one is named, even if a protein is mentioned first.
  const main = [[/jollof/, 'red'], [/fried rice/, 'golden'], [/coconut rice/, 'cream'], [/waakye/, 'dark'], [/ofada|white rice|rice/, 'white'], [/moi moi/, 'orange'], [/beans/, 'beans']].find(([re]) => re.test(t));
  const col = main ? FOOD[main[1]] : col0;
  let s = `<ellipse cx="200" cy="172" rx="182" ry="122" fill="#000" opacity=".16"/>
    <ellipse cx="200" cy="160" rx="176" ry="116" fill="#fbf6ee"/><ellipse cx="200" cy="160" rx="140" ry="90" fill="#f3ebdc"/>
    <ellipse cx="200" cy="160" rx="176" ry="116" fill="none" stroke="#c43d1a" stroke-width="3" opacity=".45"/>`;
  if (has(t, /newspaper|paper/)) {
    s = `<g transform="rotate(-4 200 160)"><rect x="40" y="50" width="320" height="220" fill="#ece6d6"/>${[80, 100, 120, 140, 160, 180, 200, 220, 240].map((y) => `<rect x="70" y="${y}" width="${f(140 + r() * 120)}" height="5" fill="#b8b0a0"/>`).join('')}</g>`;
  }
  if (has(t, /uma leaf|banana leaf|leaf-lined/)) s += `<path d="M60 170 Q200 30 340 150 Q200 262 60 170Z" fill="#4c8f34"/><path d="M70 168 Q200 150 330 150" stroke="#86c45a" stroke-width="2"/>`;
  if (has(t, /paper cone/)) {
    return `${s.slice(0, 0)}<rect width="400" height="300" fill="none"/><path d="M120 40 L280 40 L200 285 Z" fill="#e8dcc0"/><path d="M120 40 L280 40 L200 285 Z" fill="url(#${id}-light)"/>
      ${Array.from({ length: 12 }, (_, i) => P.plantain(140 + (i % 4) * 40, 40 + Math.floor(i / 4) * 16 + r() * 8, 1.6, r)).join('')}
      ${has(t, /peanut/) ? Array.from({ length: 8 }, () => `<ellipse cx="${f(150 + r() * 100)}" cy="${f(30 + r() * 30)}" rx="5" ry="3.5" fill="#d8b07a"/>`).join('') : ''}`;
  }
  const cols = colours(t, tone);
  const swallow = has(t, /pounded yam|eba|fufu|amala|semolina|swallow|balls? of|mound of/);
  const soup = has(t, /soup|egusi|ogbono|ewedu|gbegiri|efo|okra|afang|oha|bowl of|beside a bowl|next to a bowl|nsala|banga/);
  if (swallow) {
    const c = has(t, /eba|garri|yellow/) ? '#e9c86a' : has(t, /amala|brown amala/) ? '#6b4a35' : '#f4eee2';
    s += `<ellipse cx="140" cy="176" rx="62" ry="44" fill="${mix(c, '#000000', 0.12)}"/><ellipse cx="136" cy="168" rx="56" ry="38" fill="${c}"/><ellipse cx="122" cy="154" rx="24" ry="10" fill="#fff" opacity=".4"/>`;
    if (has(t, /two|balls/)) s += `<ellipse cx="104" cy="212" rx="40" ry="26" fill="${mix(c, '#000000', 0.12)}"/><ellipse cx="102" cy="207" rx="36" ry="22" fill="${c}"/>`;
    if (soup) {
      const sc = cols.find((x) => x !== FOOD.white && x !== FOOD.yellow && x !== FOOD.dark) || col;
      s += `<ellipse cx="282" cy="150" rx="74" ry="50" fill="#e2d2b4"/><ellipse cx="282" cy="146" rx="64" ry="42" fill="#d5c2a0"/>${contents(282, 146, 58, 37, t, sc, r, id)}`;
    }
    return s;
  }
  if (has(t, /tilapia|whole fish|grilled fish|fish centre/)) {
    s += `<g transform="translate(200 158) scale(5.2)"><path d="M-16 0 Q-4 -10 10 0 Q-4 10 -16 0Z" fill="#8a4a22"/><path d="M10 0 L19 -7 L19 7Z" fill="#6a3416"/><path d="M-10 -3 L4 3 M-6 -5 L8 2 M-12 1 L0 5" stroke="#2a0e05" stroke-width=".8" opacity=".7"/><circle cx="-11" cy="-1.5" r="1.2" fill="#f3e6c8"/></g>`;
    if (has(t, /dodo|plantain/)) for (let i = 0; i < 5; i++) s += P.plantain(90 + i * 14, 220 + (i % 2) * 8, 1.6, r);
    if (has(t, /onion/)) for (let i = 0; i < 3; i++) s += P.onion(290 + i * 16, 220, 1.8, r);
    if (has(t, /lime|lemon/)) s += `<circle cx="310" cy="100" r="16" fill="#7cbc3a"/><circle cx="310" cy="100" r="12" fill="#b6e07a"/>`;
    return s;
  }
  // Discrete foods (suya, puff-puff, meat pies...) are drawn as a pile of pieces.
  const pieces = [[/suya|asun|skewer|beef cubes|fried beef|goat pieces/, 'meat'], [/peppered chicken|chicken pieces|wings/, 'chicken'], [/puff-puff|puff puff|akara/, 'ball'], [/chin chin/, 'square'], [/meat pie/, 'pie'], [/dodo|kelewele|plantain/, 'plantain']]
    .find(([re]) => re.test(t) && !/jollof|rice|beside|with jollof/.test(t.slice(0, t.search(re) + 40)));
  if (pieces && !has(t, /(jollof|rice|stew)[^.]*(with|beside)|(plated|plate) with (jollof|rice)/)) {
    const [, k] = pieces;
    const n = { meat: 16, chicken: 8, ball: 12, square: 40, pie: 5, plantain: 14 }[k];
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2; const d = Math.sqrt(r()) * 0.8;
      s += P[k](200 + Math.cos(a) * 110 * d, 158 + Math.sin(a) * 66 * d, { meat: 2.2, chicken: 2.4, ball: 2.6, square: 2.6, pie: 2.6, plantain: 2.2 }[k], r);
    }
    if (has(t, /onion/)) for (let i = 0; i < 4; i++) s += P.onion(110 + i * 22, 220 - i * 6, 2, r);
    if (has(t, /tomato/)) for (let i = 0; i < 3; i++) s += P.tomato(290 + i * 18, 110 + i * 14, 1.8, r);
    if (has(t, /cabbage|salad/)) s += `<ellipse cx="300" cy="215" rx="34" ry="18" fill="#cfe3b0"/>`;
    if (has(t, /yaji|pile of/)) s += `<ellipse cx="100" cy="120" rx="28" ry="14" fill="#a8401c"/>`;
    return s;
  }
  // Main food: an irregular mound.
  const pts = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2; const k = 0.86 + r() * 0.2;
    return [200 + Math.cos(a) * 104 * k, 156 + Math.sin(a) * 64 * k];
  });
  const d = pts.map((p, i) => {
    const n = pts[(i + 1) % 12]; const mx = (p[0] + n[0]) / 2; const my = (p[1] + n[1]) / 2;
    return `${i ? '' : `M${f((pts[11][0] + p[0]) / 2)} ${f((pts[11][1] + p[1]) / 2)} `}Q${f(p[0])} ${f(p[1])} ${f(mx)} ${f(my)}`;
  }).join(' ');
  s += `<path d="${d}" fill="${col[2]}" transform="translate(0 5)"/><path d="${d}" fill="${col[0]}"/>`;
  s += `<clipPath id="${id}-m"><path d="${d}"/></clipPath><g clip-path="url(#${id}-m)">${contents(200, 156, 100, 62, t, col, r, id)}</g>`;
  // A second named colour (e.g. "white rice with deep red stew") is ladled over one side.
  if (cols[1] && cols[1] !== cols[0] && has(t, /with .*(stew|sauce)|stew on top|sauce on|ladled/)) {
    s += `<path d="M210 120 Q280 118 290 160 Q270 200 220 190 Q190 160 210 120Z" fill="${cols[1][0]}"/><ellipse cx="248" cy="150" rx="18" ry="6" fill="#ff8a2a" opacity=".5"/>`;
  }
  const side = [];
  if (has(t, /chicken|drumstick/)) side.push(() => [P.chicken(300, 214, 2.2, r), P.chicken(318, 186, 2, r)].join(''));
  if (has(t, /fish/)) side.push(() => P.fish(300, 210, 3, r));
  if (has(t, /plantain|dodo/)) side.push(() => Array.from({ length: 5 }, (_, i) => P.plantain(96 + i * 14, 210 + (i % 2) * 8, 1.5, r)).join(''));
  if (has(t, /coleslaw|salad/)) side.push(() => `<ellipse cx="100" cy="112" rx="34" ry="20" fill="#eef2dc"/>${Array.from({ length: 14 }, () => `<rect x="${f(76 + r() * 46)}" y="${f(100 + r() * 22)}" width="8" height="2" rx="1" fill="${r() > 0.5 ? '#f08a3c' : '#7aa83a'}"/>`).join('')}`);
  if (has(t, /egg/)) side.push(() => P.egg(306, 112, 2, r));
  if (has(t, /meat|beef|goat|shaki/) && !has(t, /pie/)) side.push(() => Array.from({ length: 3 }, (_, i) => P.meat(290 + i * 16, 200 + i * 6, 1.8, r)).join(''));
  side.forEach((fn) => { s += fn(); });
  if (has(t, /skewer/)) for (let i = 0; i < 3; i++) s += skewer(90, 120 + i * 32, r);
  if (has(t, /shito|pepper sauce on the side|side of/)) s += `<circle cx="318" cy="96" r="24" fill="#e9dcc4"/><circle cx="318" cy="96" r="17" fill="#5a2010"/>`;
  if (has(t, /sprinkle of gari|gari on top|sprinkle/)) s += Array.from({ length: 30 }, () => `<circle cx="${f(150 + r() * 100)}" cy="${f(120 + r() * 60)}" r="1.2" fill="#f6e7b8"/>`).join('');
  return s;
}

function skewer(x, y, r, shade = '') {
  const meat = /grey|not grilled|pale/.test(shade) ? ['#8a6a5a', '#a88878'] : /burnt|black/.test(shade) ? ['#1f0e06', '#3a1a0a'] : ['#7a3416', '#c4562a'];
  let s = `<rect x="${x - 20}" y="${y - 1.5}" width="230" height="3" fill="#d8b98a"/>`;
  for (let i = 0; i < 7; i++) s += `<g transform="translate(${x + 10 + i * 27} ${y}) rotate(${f(r() * 20 - 10)})"><rect x="-11" y="-8" width="22" height="16" rx="5" fill="${meat[0]}"/><rect x="-11" y="-8" width="22" height="16" rx="5" fill="${meat[1]}" opacity=".45"/><path d="M-9 -5 L9 4" stroke="#2a0e05" stroke-width="2.5" opacity=".7"/></g>`;
  return s;
}

function grill(t, col, r) {
  let s = `<rect x="20" y="40" width="360" height="230" rx="16" fill="#1a1a1c"/>`;
  s += `<g opacity=".9">${Array.from({ length: 10 }, (_, i) => `<rect x="30" y="${56 + i * 21}" width="340" height="5" rx="2.5" fill="#4a4b50"/>`).join('')}</g>`;
  s += `<rect x="20" y="40" width="360" height="230" rx="16" fill="url(#glow)"/>`;
  if (has(t, /skewer|suya/)) for (let i = 0; i < 4; i++) s += skewer(70, 90 + i * 45, r, t);
  else if (has(t, /fish/)) { s += P.fish(150, 140, 4.2, () => 0.5); s += P.fish(260, 200, 3.4, () => 0.7); }
  else if (has(t, /goat|beef|meat|asun/)) for (let i = 0; i < 14; i++) s += P.meat(70 + (i % 5) * 65 + r() * 10, 90 + Math.floor(i / 5) * 70 + r() * 10, 2.6, r);
  else if (has(t, /\bpies?\b|bak|oven|pastry/)) for (let i = 0; i < 6; i++) s += P.pie(100 + (i % 3) * 100, 110 + Math.floor(i / 3) * 90, 2.2, r);
  else for (let i = 0; i < 7; i++) s += P.chicken(80 + (i % 4) * 80, 100 + Math.floor(i / 4) * 90 + r() * 20, 2.6, r);
  if (has(t, /char|smok|grill/)) s += steam(200, 70, r);
  return `<defs><radialGradient id="glow" cx=".5" cy=".9" r=".8"><stop offset="0" stop-color="#ff7a1a" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>${s}`;
}

function mortar(t, col) {
  return `<ellipse cx="200" cy="268" rx="110" ry="14" fill="#000" opacity=".35"/>
    <path d="M100 120 L300 120 L270 250 L130 250 Z" fill="#7a4a26"/><path d="M100 120 L300 120 L270 250 L130 250 Z" fill="url(#m-light)"/>
    <ellipse cx="200" cy="120" rx="100" ry="26" fill="#5a3418"/><ellipse cx="200" cy="124" rx="86" ry="20" fill="${col[0]}"/>
    <g transform="rotate(20 230 70)"><rect x="220" y="-10" width="22" height="150" rx="11" fill="#b8865a"/></g>
    <defs><linearGradient id="m-light" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".4" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>`;
}

function spread(t, r) {
  // "all the ingredients on the counter", "spices in small piles"
  const piles = ['#c9221a', '#d24e17', '#e6c47a', '#7a4426', '#3d7a2a', '#f1eadb', '#c4562a', '#e9c86a'];
  let s = '';
  for (let i = 0; i < 8; i++) {
    const x = 70 + (i % 4) * 88; const y = 105 + Math.floor(i / 4) * 105;
    s += `<ellipse cx="${x}" cy="${y + 24}" rx="38" ry="10" fill="#000" opacity=".3"/><ellipse cx="${x}" cy="${y + 10}" rx="38" ry="22" fill="#e9dcc4"/><ellipse cx="${x}" cy="${y + 6}" rx="31" ry="16" fill="${piles[i]}"/><ellipse cx="${x - 8}" cy="${y + 1}" rx="10" ry="4" fill="#fff" opacity=".25"/>`;
  }
  return s;
}

// ---- scene picker ------------------------------------------------------------
function plantains(t, r) {
  const skin = has(t, /very ripe|black skin|overripe/) ? ['#2a1d12', '#5a3a1e'] : has(t, /unripe|green/) ? ['#5f8f2a', '#7aa83a'] : ['#e8c23a', '#f3d860'];
  let s = `<ellipse cx="200" cy="262" rx="170" ry="16" fill="#000" opacity=".3"/><rect x="40" y="70" width="320" height="180" rx="22" fill="#c4945e"/>`;
  const guide = has(t, /ripeness|green, yellow/);
  for (let i = 0; i < 3; i++) {
    if (guide) skin.splice(0, 2, ...[['#5f8f2a', '#7aa83a'], ['#e8c23a', '#f3d860'], ['#2a1d12', '#5a3a1e']][i]);
    s += `<path d="M80 ${120 + i * 45} Q200 ${70 + i * 45} 320 ${115 + i * 45} L316 ${132 + i * 45} Q200 ${92 + i * 45} 84 ${138 + i * 45}Z" fill="${skin[0]}"/><path d="M110 ${118 + i * 45} Q200 ${84 + i * 45} 290 ${116 + i * 45}" stroke="${skin[1]}" stroke-width="4" fill="none"/>`;
    if (has(t, /black spots|spots/) && (!guide || i === 1)) for (let j = 0; j < 8; j++) s += `<circle cx="${f(110 + r() * 190)}" cy="${f(108 + i * 45 + r() * 14)}" r="${f(1.5 + r() * 2.5)}" fill="#2a1d12"/>`;
  }
  return s;
}

function jar(t, col, r) {
  const x = has(t, /and a jar|two jars/) ? [140, 270] : [200];
  return x.map((cx, i) => {
    const c = i ? FOOD.brown : col;
    return `<ellipse cx="${cx}" cy="262" rx="62" ry="12" fill="#000" opacity=".2"/>
      <rect x="${cx - 58}" y="70" width="116" height="190" rx="22" fill="#e9f1f3" opacity=".55" stroke="#ffffff" stroke-opacity=".8" stroke-width="3"/>
      <rect x="${cx - 52}" y="${i ? 120 : 100}" width="104" height="${i ? 134 : 154}" rx="18" fill="${c[0]}"/>
      ${has(t, /oil on top/) && !i ? `<rect x="${cx - 52}" y="100" width="104" height="18" rx="8" fill="#e8501a" opacity=".85"/>` : ''}
      ${Array.from({ length: 16 }, () => `<circle cx="${f(cx - 44 + r() * 88)}" cy="${f((i ? 130 : 124) + r() * 120)}" r="${f(1 + r() * 2.5)}" fill="${c[2]}" opacity=".7"/>`).join('')}
      <rect x="${cx - 46}" y="54" width="92" height="22" rx="6" fill="#b08a2e"/><rect x="${cx - 40}" y="90" width="10" height="150" rx="5" fill="#fff" opacity=".35"/>`;
  }).join('') + (has(t, /spoon/) ? spoon(300, 80) : '');
}

function scene(t, tone, r, id) {
  const col = foodColour(t, tone);
  if (has(t, /(unripe|ripe|very ripe) plantain|ripeness guide/)) return ['wood', plantains(t, r)];
  if (has(t, /rolled pastry|circles cut|cutting it into|cut into .*squares|rolling the dough|filling, folding|crimping/)) {
    return ['wood', `${board(t.replace(/chicken|pie/g, ''), FOOD.batter, r).replace(/<g transform="rotate\(-18[\s\S]*?<\/g>/, '')}<rect x="70" y="95" width="230" height="140" rx="16" fill="#efdcae"/>${has(t, /circle|pie/) ? Array.from({ length: 6 }, (_, i) => `<circle cx="${110 + (i % 3) * 75}" cy="${130 + Math.floor(i / 3) * 70}" r="28" fill="none" stroke="#c9a66a" stroke-width="3"/>`).join('') : Array.from({ length: 7 }, (_, i) => `<path d="M${95 + i * 30} 95 V235 M70 ${115 + i * 18} H300" stroke="#c9a66a" stroke-width="2"/>`).join('')}${has(t, /crimp|filling/) ? P.pie(330, 200, 2.4, r) : ''}`];
  }
  if (has(t, /meat pies?|pies (baking|on)|pale meat pies|golden meat pies/) && !has(t, /plate|filling|dough|pastry/)) return ['wood', grill('pie bake', col, r)];
  if (has(t, /\bjar\b/)) return ['linen', jar(t, col, r)];
  if (has(t, /heaped|bowl full|piled|in a bowl with|cubes .*in a bowl|fried beef bowl/)) return ['linen', plate(t, col, r, id, tone)];
  if (has(t, /suya|asun/) && !has(t, /plat|paper|spice|piles|pot|bowl/)) return ['wood', grill(`${t} skewer`, col, r)];
  if (has(t, /dough|flour|breadcrumbs|butter lumps/) && !has(t, /fry|frying|in oil|pot of oil/)) return ['wood', bowl(t, FOOD.batter, r, id)];
  if (has(t, /spread (thin )?on a tray|on a tray/)) return ['wood', `<rect x="30" y="50" width="340" height="220" rx="10" fill="#9a9ca2"/><rect x="42" y="62" width="316" height="196" rx="6" fill="#b9bbc0"/>${contents(200, 160, 150, 92, t, col, r, id).replace(/<ellipse cx="200" cy="160" rx="150" ry="92" fill="#[0-9a-f]+"\/>/, `<rect x="52" y="72" width="296" height="176" rx="20" fill="${col[0]}"/>`)}`];
  if (has(t, /all .*ingredients|spices in small piles|piles|laid out|mise en place|on the mcuire counter/)) return ['wood', spread(t, r)];
  if (has(t, /side by side|\bvs\b/) && has(t, /bowl|wash|water/)) {
    const [a, b] = t.split(/\bvs\b|,/);
    return ['wood', `<g transform="translate(-14 62) scale(.6)">${bowl(a, foodColour(a, tone), r, id)}</g><g transform="translate(174 62) scale(.6)">${bowl(b || a, foodColour(b || a, tone), r, id)}</g>`];
  }
  if (has(t, /blend|blender|jug|food processor/)) return ['wood', blender(t, col)];
  if (has(t, /mortar|pestle/)) return ['wood', mortar(t, col)];
  if (has(t, /plating|plated|on a (mcuire )?plate|paper cone|served/)) return ['linen', plate(t, col, r, id, tone)];
  if (has(t, /grill|skewers? under|on the rack|oven|baking tray|cooling rack|bak(e|ed|ing)|charcoal/) && !has(t, /plate|paper cone/)) return ['wood', grill(t, col, r)];
  if (has(t, /chop|slic(e|ing) |dic(e|ing)|cutting|scor(e|ing)|knife|board|peel/) && !has(t, /sliced onion in oil|sliced tomato and onion rings (laid|on top)|in the pot|in oil/)) return ['wood', board(t, col, r)];
  if (has(t, /plat(e|ed|ing)|served|serve |beside|next to|side by side|paper cone|newspaper|uma leaf|table|platter|piled|finished|on a plate|jar|overhead|45°/) && !has(t, /in a (wide )?pot|in the pot/)) return ['linen', plate(t, col, r, id, tone)];
  if (has(t, /fry|fried|frying|pan|dodo|puff|akara|chin chin|golden|crisp|draining/) && !has(t, /pot/)) return ['wood', pan(t, col, r, id)];
  if (has(t, /soak|bowl|batter|dough|marinade|knead|whisk|whip|sieve|rinse|wash|mix/) && !has(t, /pot/)) return ['wood', bowl(t, col, r, id)];
  return ['wood', pot(t, col, r, id)];
}

let counter = 0;
export function illustration(ref) {
  const text = `${ref.brief || ''} ${ref.alt || ''}`.toLowerCase();
  const id = `il${(counter++).toString(36)}`;
  const r = rng(text + (ref.tone || ''));
  const [bg, body] = scene(text, ref.tone, r, id);
  return `<svg class="illus illus-${bg}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${defs(id)}${backdrop(bg, id)}${body}
    <rect width="400" height="300" fill="url(#${id}-light)" opacity=".5"/></svg>`;
}

// A plain-language caption from the shot description ("Close-up:", "Overhead"
// and similar photographer notes removed).
export function caption(ref) {
  return String(ref.alt || ref.brief || '')
    .replace(/^\s*\d+-second clip:\s*/i, '')
    .replace(/^(close-up|mcuire plating|overhead):\s*/i, '')
    .replace(/\s*(overhead|45°|evening light|natural light)[^.]*\.?/gi, '')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}
