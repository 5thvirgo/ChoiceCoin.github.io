// Weekend live classes: customers pick any open Saturday or Sunday, a start
// time, how many hours and how many people. Priced per hour (per person by
// default) plus HST. A booking is identified by its slot id, e.g.
// "slot-20261017-1200-2h-3p" (Sat 17 Oct 2026, 12:00, 2 hours, 3 people);
// the server re-checks every part of it and the price.

export const DEFAULT_BOOKING = {
  enabled: true,
  title: 'Hands-on cooking class at Mcuire',
  description: 'Book your own hands-on class in the Mcuire kitchen on any Saturday or Sunday. Choose the dish you want to learn when you arrive, or tell us when you book. All ingredients, aprons and equipment are provided, and you eat what you cook.',
  days: [6, 0], // Saturday, Sunday
  times: ['10:00', '12:00', '14:00', '16:00'],
  minHours: 1,
  maxHours: 4,
  latestEnd: '20:00',
  pricePerHourCents: 7500,
  perPerson: true,
  maxPeople: 10,
  taxRate: 0.13,
  taxLabel: 'HST',
  leadDays: 2,
  weeksAhead: 12,
  timeZone: 'America/Toronto',
  location: 'Mcuire African Restaurant',
  currency: 'CAD',
};

export const bookingSettings = (content) => ({ ...DEFAULT_BOOKING, ...(content?.liveBooking || {}) });

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

export const slotId = ({ date, time, hours, people }) => `slot-${date.replace(/-/g, '')}-${time.replace(':', '')}-${hours}h-${people}p`;

export function parseSlotId(id) {
  const m = /^slot-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})-(\d+)h-(\d+)p$/.exec(id || '');
  if (!m) return null;
  return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}`, hours: +m[6], people: +m[7] };
}

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

// Why a slot can't be booked, or '' if it can.
export function slotProblem(s, slot, usage = {}) {
  if (!s.enabled) return 'Weekend classes are not taking bookings right now.';
  if (!slotDates(s).includes(slot.date)) return 'Please choose one of the listed dates.';
  if (!s.times.includes(slot.time)) return 'Please choose one of the listed start times.';
  if (slot.hours < s.minHours || slot.hours > s.maxHours) return `Classes run ${s.minHours} to ${s.maxHours} hours.`;
  if (toMin(slot.time) + slot.hours * 60 > toMin(s.latestEnd)) return `Classes must finish by ${formatTime(s.latestEnd)}. Choose an earlier time or fewer hours.`;
  if (slot.people < 1 || slot.people > s.maxPeople) return `Up to ${s.maxPeople} people per class.`;
  if (seatsFree(s, slot, usage) < slot.people) return 'Not enough places left at that time. Try another time or date.';
  return '';
}

// usage: { 'YYYY-MM-DD': { hour: peopleBooked } }
export function seatsFree(s, slot, usage = {}) {
  const day = usage[slot.date] || {};
  const startH = Math.floor(toMin(slot.time) / 60);
  let used = 0;
  for (let h = startH; h < startH + slot.hours; h++) used = Math.max(used, day[h] || 0);
  return Math.max(0, s.maxPeople - used);
}

export function addUsage(usage, slot) {
  const day = (usage[slot.date] ||= {});
  const startH = Math.floor(toMin(slot.time) / 60);
  for (let h = startH; h < startH + slot.hours; h++) day[h] = (day[h] || 0) + slot.people;
  return usage;
}

export function slotSubtotal(s, slot) {
  return s.pricePerHourCents * slot.hours * (s.perPerson ? slot.people : 1);
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

// A booked slot shown like any other live class (My Kitchen, tickets, calendar).
export function slotClass(s, id) {
  const slot = parseSlotId(id);
  if (!slot) return null;
  return {
    id, kind: 'slot', slot, status: 'published', title: s.title,
    description: s.description,
    startsAt: zonedISO(slot.date, slot.time, s.timeZone), durationMinutes: slot.hours * 60,
    priceCents: slotSubtotal(s, slot), currency: s.currency, taxRate: s.taxRate, taxLabel: s.taxLabel,
    capacity: s.maxPeople, format: 'in-person', location: s.location, host: 'Mcuire kitchen team',
    whatYouNeed: 'Just yourselves. Aprons, ingredients and equipment are provided.',
    recipeId: 'party-jollof',
  };
}
