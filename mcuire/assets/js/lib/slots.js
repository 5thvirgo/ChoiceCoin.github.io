// Weekend live classes, coached online: on any open Saturday or Sunday the
// customer picks a kind of session (home cooking, cooking help, group, event),
// a start time, how many hours and how many cooks. The chef joins them by video
// call (Zoom, Microsoft Teams, Google Meet…) while they cook in their own kitchen.
// A booking is identified by its slot id, e.g.
// "slot-20261017-1200-2h-3p-group" (Sat 17 Oct 2026, 12:00, 2 hours, 3 cooks,
// group session); the server re-checks every part of it and the price.
// Ids without a kind (older bookings) are read as "home".

export const SESSION_TYPES = [
  {
    id: 'home', name: 'Home cooking', short: 'Just me',
    blurb: 'You cook an everyday meal or a dish you love in your own kitchen while our chef coaches you live, step by step.',
    pricePerHourCents: 7500, extraPersonCents: 0, minPeople: 1, maxPeople: 1, minHours: 1, enabled: true,
  },
  {
    id: 'help', name: 'Cooking help', short: 'Help as I cook',
    blurb: 'Stuck on a recipe, or want a chef beside you? Get live help, tips and fixes while you cook.',
    pricePerHourCents: 7500, extraPersonCents: 0, minPeople: 1, maxPeople: 1, minHours: 1, enabled: true,
  },
  {
    id: 'group', name: 'Group cooking', short: 'Family, friends or team',
    blurb: 'Cook together with family, friends or your team, in one kitchen or several, all on one call.',
    pricePerHourCents: 7500, extraPersonCents: 2500, minPeople: 2, maxPeople: 8, minHours: 1, enabled: true,
  },
  {
    id: 'event', name: 'Cooking for an event', short: 'Party or celebration',
    blurb: 'Cooking for a party, celebration or big gathering? We plan the menu and quantities with you and send a shopping list, then coach you through the cook.',
    pricePerHourCents: 9500, extraPersonCents: 2500, minPeople: 1, maxPeople: 4, minHours: 2, enabled: true,
  },
];

export const DEFAULT_BOOKING = {
  enabled: true,
  title: 'Live online cooking class',
  description: 'Cook in your own kitchen while a Mcuire chef coaches you live by video call, on any Saturday or Sunday. Tell us what you would like to cook when you book; we email the ingredient list and your call link before the class.',
  days: [6, 0], // Saturday, Sunday
  times: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
  minHours: 1,
  maxHours: 4,
  latestEnd: '21:00',
  types: SESSION_TYPES,
  maxClassesAtOnce: 1, // the chef coaches one call at a time
  taxRate: 0.13,
  taxLabel: 'HST',
  leadDays: 2,
  weeksAhead: 12,
  timeZone: 'America/Toronto',
  format: 'online',
  platforms: ['Zoom', 'Microsoft Teams', 'Google Meet', 'WhatsApp video'],
  location: 'Online by video call, from your own kitchen',
  currency: 'CAD',
};

// Settings saved before online classes (no "types") are replaced by the new defaults.
export const bookingSettings = (content) => {
  const saved = content?.liveBooking || {};
  return Array.isArray(saved.types) ? { ...DEFAULT_BOOKING, ...saved } : { ...DEFAULT_BOOKING };
};

export const sessionType = (s, id) => (s.types || []).find((t) => t.id === (id || 'home')) || null;
export const activeTypes = (s) => (s.types || []).filter((t) => t.enabled !== false);

const pad = (n) => String(n).padStart(2, '0');

// Today's date (YYYY-MM-DD) in the restaurant's time zone.
function todayIn(tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

function addDays(date, n) {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

const weekday = (date) => { const [y, m, d] = date.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };

// Local wall time in a time zone -> ISO instant.
export function zonedISO(date, time, tz) {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
  const asLocal = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return new Date(guess - (asLocal - guess)).toISOString();
}

// The bookable dates, soonest first.
export function slotDates(s) {
  const start = addDays(todayIn(s.timeZone), s.leadDays);
  const out = [];
  for (let i = 0; i < s.weeksAhead * 7; i++) {
    const d = addDays(start, i);
    if (s.days.includes(weekday(d))) out.push(d);
  }
  return out;
}

export const slotId = ({ date, time, hours, people, type }) => `slot-${date.replace(/-/g, '')}-${time.replace(':', '')}-${hours}h-${people}p-${type || 'home'}`;

export function parseSlotId(id) {
  const m = /^slot-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})-(\d+)h-(\d+)p(?:-([a-z]+))?$/.exec(id || '');
  if (!m) return null;
  return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}`, hours: +m[6], people: +m[7], type: m[8] || 'home' };
}

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

// Why a slot can't be booked, or '' if it can.
export function slotProblem(s, slot, usage = {}) {
  if (!s.enabled) return 'Live classes are not taking bookings right now.';
  const type = sessionType(s, slot.type);
  if (!type || type.enabled === false) return 'Please choose a kind of class.';
  if (!slotDates(s).includes(slot.date)) return 'Please choose one of the listed dates.';
  if (!s.times.includes(slot.time)) return 'Please choose one of the listed start times.';
  const minH = Math.max(s.minHours, type.minHours || 1);
  if (slot.hours < minH || slot.hours > s.maxHours) return `${type.name} runs ${minH} to ${s.maxHours} hours.`;
  if (toMin(slot.time) + slot.hours * 60 > toMin(s.latestEnd)) return `Classes must finish by ${formatTime(s.latestEnd)}. Choose an earlier time or fewer hours.`;
  if (slot.people < type.minPeople || slot.people > type.maxPeople) return type.minPeople === type.maxPeople ? `${type.name} is for ${type.maxPeople} ${type.maxPeople > 1 ? 'people' : 'person'}.` : `${type.name} is for ${type.minPeople} to ${type.maxPeople} cooks.`;
  if (classesFree(s, slot, usage) < 1) return 'That time is already booked. Try another time or date.';
  return '';
}

// usage: { 'YYYY-MM-DD': { hour: classesBooked } }
export function classesFree(s, slot, usage = {}) {
  const day = usage[slot.date] || {};
  const startH = Math.floor(toMin(slot.time) / 60);
  let used = 0;
  for (let h = startH; h < startH + slot.hours; h++) used = Math.max(used, day[h] || 0);
  return Math.max(0, (s.maxClassesAtOnce || 1) - used);
}

export function addUsage(usage, slot) {
  const day = (usage[slot.date] ||= {});
  const startH = Math.floor(toMin(slot.time) / 60);
  for (let h = startH; h < startH + slot.hours; h++) day[h] = (day[h] || 0) + 1;
  return usage;
}

// Price per hour for this many cooks.
export function hourlyRate(type, people) {
  return type.pricePerHourCents + Math.max(0, people - 1) * (type.extraPersonCents || 0);
}

export function slotSubtotal(s, slot) {
  const type = sessionType(s, slot.type);
  return type ? hourlyRate(type, slot.people) * slot.hours : 0;
}

export const taxOn = (s, cents) => Math.round(cents * (s.taxRate || 0));

export function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}${m ? `:${pad(m)}` : ''} ${h < 12 ? 'am' : 'pm'}`;
}

export function formatDate(date, opts = {}) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC', ...opts });
}

const NEED = {
  event: 'A phone, tablet or laptop with a camera, set up so we can see your stove and worktop. We plan the menu and quantities with you and email the shopping list before the class.',
  default: 'A phone, tablet or laptop with a camera, set up so we can see your stove and worktop. We email the ingredient list before the class.',
};

// A booked slot shown like any other live class (My Kitchen, tickets, calendar).
export function slotClass(s, id) {
  const slot = parseSlotId(id);
  if (!slot) return null;
  const type = sessionType(s, slot.type) || SESSION_TYPES[0];
  return {
    id, kind: 'slot', slot, status: 'published', title: `${type.name}: live online class`,
    description: type.blurb, typeName: type.name,
    startsAt: zonedISO(slot.date, slot.time, s.timeZone), durationMinutes: slot.hours * 60,
    priceCents: slotSubtotal(s, slot), currency: s.currency, taxRate: s.taxRate, taxLabel: s.taxLabel,
    capacity: type.maxPeople, format: 'online', platform: 'Video call', joinUrl: '', location: s.location, host: 'Mcuire chef',
    whatYouNeed: NEED[type.id] || NEED.default,
    recipeId: 'party-jollof',
  };
}
