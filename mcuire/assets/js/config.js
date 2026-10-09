// Single place for brand + runtime configuration.
// A server can override any value by defining window.MCUIRE_CONFIG before app.js loads.
const defaults = {
  brand: {
    name: 'Mcuire African Restaurant',
    short: 'Mcuire',
    academy: 'Mcuire Kitchen',
    tagline: 'Cook West African food with confidence.',
    signatory: { name: 'Head Chef', title: 'Head Chef, Mcuire African Restaurant' },
  },
  // 'local' = everything in this browser (standalone demo)
  // 'api'   = server/server.mjs (entitlements enforced server-side)
  dataSource: 'local',
  // Where the server lives when the pages are hosted elsewhere, e.g. pages at
  // mcuire.ca/cooking-courses and server at https://mcuire-kitchen.onrender.com.
  // Empty = same site as the pages.
  apiBase: '',
  // 'demo' = simulated checkout, clearly labelled test mode
  // 'stripe' = Stripe Checkout via /api/checkout/session
  payments: 'demo',
  // Show photographer briefs on media placeholders (turn off once photos are in).
  showMediaBriefs: true,
  // Static-demo-only admin gate. Real admin access is role-based on the server.
  demoAdminPasscode: 'mcuire',
  // Set by the WordPress plugin ('/cooking-courses/') so dishes get clean, shareable addresses.
  basePath: '',
  // Where photos shipped with the plugin live ("media:waakye.jpg" -> mediaBase + "waakye.jpg").
  mediaBase: 'media/',
};

function merge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(a[k] || {}, v) : v;
  }
  return out;
}

export const config = merge(defaults, window.MCUIRE_CONFIG);

// Photos shipped with the plugin are stored as "media:<file>" so they keep
// working if the site moves. The demo page carries them inline.
export function mediaUrl(src) {
  if (!src || !src.startsWith('media:')) return src;
  const file = src.slice(6);
  return window.MCUIRE_MEDIA?.[file] || config.mediaBase + file;
}
