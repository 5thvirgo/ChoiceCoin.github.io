// Shared presentational pieces.
import { config } from './config.js';
import { store } from './services/store.js';
import { esc, icon, minutes, money, on } from './lib/dom.js';

// Renders a MediaRef: real photo/video when Mcuire has supplied one,
// otherwise a clearly-labelled placeholder carrying the photographer's brief.
export function media(ref, { ratio = 'hero', compact = false, cls = '', eager = false } = {}) {
  const r = ref || { kind: 'photo', brief: 'Photo', tone: 'jollof' };
  const ratioCls = ratio ? `ratio-${ratio}` : '';
  if (r.src) {
    const cr = r.credit ? `<a class="photo-credit" href="${esc(r.credit.page)}" target="_blank" rel="noopener">Photo: ${esc(r.credit.author)} · ${esc(r.credit.license)}</a>` : '';
    if (r.kind === 'video') {
      return `<div class="media ${ratioCls} ${cls}"><video src="${esc(r.src)}" ${r.poster ? `poster="${esc(r.poster)}"` : ''} muted loop playsinline autoplay preload="metadata" aria-label="${esc(r.alt)}"></video><span class="chip dark video-badge">${icon('video', 14)} Watch</span></div>`;
    }
    return `<div class="media ${ratioCls} ${cls}"><img src="${esc(r.src)}" alt="${esc(r.alt || '')}" ${eager ? '' : 'loading="lazy"'} decoding="async" referrerpolicy="no-referrer">${compact ? '' : cr}</div>`;
  }
  // No photo yet: customers see nothing; staff see what to shoot.
  if (!location.hash.startsWith('#/admin')) return '';
  const tone = `tone-${r.tone || 'jollof'}`;
  return `<div class="media ${ratioCls} ${tone} ${compact ? 'ph-compact' : ''} ${cls}" role="img" aria-label="${esc(r.alt || r.brief || 'Photo coming soon')}">
    <div class="ph">${compact ? '' : `<div class="ph-label">${icon(r.kind === 'video' ? 'video' : 'camera', 18)}<div><strong>Photo to take</strong><span>${esc(r.brief || '')}</span></div></div>`}</div>
  </div>`;
}

export function brandMark(size = 40) {
  return `<svg class="brand-mark" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="31" fill="#c43d1a"/>
    <circle cx="32" cy="32" r="25.5" fill="none" stroke="#e0a22a" stroke-width="1.5" stroke-dasharray="5 3"/>
    <text x="32" y="43" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="30" font-weight="700" fill="#fbf6ee">M</text>
  </svg>`;
}

// Official seal used on the certificate and the completion screen.
export function seal(size = 120, id = 'seal') {
  const text = `${config.brand.name.toUpperCase()} · KITCHEN · `;
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" class="seal" aria-hidden="true">
    <defs><path id="${id}-arc" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0"/></defs>
    <g>${Array.from({ length: 36 }, (_, i) => `<path d="M100 2 L106 14 L94 14 Z" fill="#b08a2e" transform="rotate(${i * 10} 100 100)"/>`).join('')}</g>
    <circle cx="100" cy="100" r="88" fill="#c43d1a"/>
    <circle cx="100" cy="100" r="84" fill="none" stroke="#e0a22a" stroke-width="2"/>
    <circle cx="100" cy="100" r="56" fill="none" stroke="#e0a22a" stroke-width="1.5"/>
    <text font-family="DM Sans, Arial, sans-serif" font-size="12.5" font-weight="700" letter-spacing="2.4" fill="#fbf6ee"><textPath href="#${id}-arc" startOffset="0">${esc(text)}</textPath></text>
    <text x="100" y="112" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="46" font-weight="700" fill="#fbf6ee">M</text>
    <text x="100" y="135" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="9" font-weight="700" letter-spacing="2" fill="#f6e3b4">EST. KITCHEN</text>
  </svg>`;
}

export function ring(ratio, size = 72, stroke = 7, color = 'var(--jollof)') {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(1, ratio))}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Fraunces, Georgia, serif" font-size="${size / 4.2}" font-weight="600" fill="var(--ink)">${Math.round(ratio * 100)}%</text>
  </svg>`;
}

export function badge(earned, size = 56) {
  const fill = earned ? '#e0a22a' : '#d8ccbb';
  const inner = earned ? '#c43d1a' : '#bcae9b';
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M32 3l7 6 9-1 3 9 8 5-3 9 3 9-8 5-3 9-9-1-7 6-7-6-9 1-3-9-8-5 3-9-3-9 8-5 3-9 9 1z" fill="${fill}"/>
    <circle cx="32" cy="32" r="17" fill="${inner}"/>
    ${earned ? '<path d="M24 32l6 6 11-12" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' : '<rect x="26" y="30" width="12" height="10" rx="2" fill="#fff"/><path d="M28.5 30v-3a3.5 3.5 0 017 0v3" fill="none" stroke="#fff" stroke-width="2.5"/>'}
  </svg>`;
}

export function recipeTile(recipe, { owned = false } = {}) {
  const status = recipe.status === 'complete'
    ? `<span class="chip leaf status">${icon('play', 12)} Cook With Me</span>`
    : '<span class="chip dark status">Filming soon</span>';
  return `<a class="tile" href="#/recipes/${esc(recipe.slug)}">
    <div style="position:relative">${media(recipe.hero, { ratio: 'tall', compact: true })}${status}</div>
    <h3>${esc(recipe.title)}</h3>
    <p>${esc(recipe.subtitle || '')}</p>
    <div class="meta"><span>${esc(recipe.region || '')}</span><span>·</span><span>${minutes((recipe.prepMinutes || 0) + (recipe.cookMinutes || 0))}</span>${owned ? '<span>· Yours</span>' : (() => { const s = store.singleFor(recipe.id); return s ? `<span>· ${money(s.priceCents, s.currency)}</span>` : ''; })()}</div>
  </a>`;
}

// Passwordless sign-in for returning customers and staff (API mode only).
export function signInForm() {
  return `<form class="panel" data-signin style="max-width:480px">
    <h3>Already have a course?</h3>
    <p class="small muted">Enter the email you paid with and we’ll send you a sign-in link. No password needed.</p>
    <div class="field"><label for="si-email">Email</label><input id="si-email" name="email" type="email" inputmode="email" autocomplete="email" required></div>
    <button class="btn btn-dark">Email me a sign-in link</button>
    <p class="small" data-signin-msg role="status" style="margin:10px 0 0"></p>
  </form>`;
}

export function bindSignIn(root) {
  return on(root, 'submit', '[data-signin]', async (e, form) => {
    e.preventDefault();
    const msg = form.querySelector('[data-signin-msg]');
    try {
      await store.requestSignIn(form.email.value.trim());
      msg.textContent = 'Check your inbox. If that email has a Mcuire course, your link is on its way.';
    } catch (err) {
      msg.textContent = err.message;
    }
  });
}
