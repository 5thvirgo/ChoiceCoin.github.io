// Single place for brand + runtime configuration.
// A server can override any value by defining window.MAKWAYA_CONFIG before app.js loads.
const defaults = {
  brand: {
    name: 'Makwaya African Restaurant',
    short: 'Makwaya',
    academy: 'Makwaya Kitchen',
    tagline: 'Cook West African food with confidence.',
    signatory: { name: 'Head Chef', title: 'Head Chef, Makwaya African Restaurant' },
  },
  // 'local' = everything in this browser (static demo / GitHub Pages)
  // 'api'   = server/server.mjs (entitlements enforced server-side)
  dataSource: 'local',
  // 'demo' = simulated checkout, clearly labelled test mode
  // 'stripe' = Stripe Checkout via /api/checkout/session
  payments: 'demo',
  // Show photographer briefs on media placeholders (turn off once photos are in).
  showMediaBriefs: true,
  // Static-demo-only admin gate. Real admin access is role-based on the server.
  demoAdminPasscode: 'makwaya',
};

function merge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(a[k] || {}, v) : v;
  }
  return out;
}

export const config = merge(defaults, window.MAKWAYA_CONFIG);
