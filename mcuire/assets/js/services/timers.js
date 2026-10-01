// Kitchen timers. Several can run at once (rice steaming while plantain fries).
// They survive page reloads (stored as absolute end times) and know which
// recipe step they belong to, so "time's up" can take the cook straight back.

const KEY = 'mcuire.timers.v1';
const listeners = new Set();
let timers = load();
let ticking = null;
let audio = null;
let alarmLoop = null;

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(timers)); } catch { /* ignore */ }
}
function emit(event) {
  listeners.forEach((fn) => fn(timers, event));
}

export function remaining(t) {
  if (t.state === 'paused') return t.pausedRemaining;
  if (t.state === 'done') return 0;
  return Math.max(0, t.endsAt - Date.now());
}

function tick() {
  let finished = null;
  for (const t of timers) {
    if (t.state === 'running' && t.endsAt <= Date.now()) {
      t.state = 'done';
      finished = t;
    }
  }
  if (finished) {
    save();
    ring(finished);
    emit({ type: 'finished', timer: finished });
  } else {
    emit({ type: 'tick' });
  }
  if (!timers.some((t) => t.state === 'running')) stopTicking();
}

function startTicking() {
  if (!ticking) ticking = setInterval(tick, 250);
}
function stopTicking() {
  clearInterval(ticking);
  ticking = null;
}

// Must be called from a user gesture once, so mobile browsers allow sound later.
function unlockAudio() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch { /* no audio available */ }
}

function chime() {
  if (!audio) return;
  const now = audio.currentTime;
  [0, 0.18, 0.36].forEach((offset, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = [880, 1046, 1318][i];
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.35, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.5);
    osc.connect(gain).connect(audio.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.55);
  });
}

function ring(timer) {
  chime();
  clearInterval(alarmLoop);
  alarmLoop = setInterval(chime, 2200); // keeps chiming until acknowledged
  if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 600]);
  if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
    try { new Notification('Time’s up', { body: timer.label, tag: timer.id }); } catch { /* ignore */ }
  }
}

export function silence() {
  clearInterval(alarmLoop);
  alarmLoop = null;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function list() {
  return timers;
}

export function forStep(recipeId, stepIndex) {
  return timers.find((t) => t.recipeId === recipeId && t.stepIndex === stepIndex && t.state !== 'dismissed');
}

export function start({ recipeId, recipeSlug, stepIndex, label, minutes }) {
  unlockAudio();
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
  timers = timers.filter((t) => !(t.recipeId === recipeId && t.stepIndex === stepIndex));
  const durationMs = Math.round(minutes * 60000);
  const timer = { id: `t${Date.now()}`, recipeId, recipeSlug, stepIndex, label, durationMs, endsAt: Date.now() + durationMs, state: 'running' };
  timers.push(timer);
  save();
  startTicking();
  emit({ type: 'started', timer });
  return timer;
}

export function pause(id) {
  const t = timers.find((x) => x.id === id);
  if (t?.state !== 'running') return;
  t.pausedRemaining = remaining(t);
  t.state = 'paused';
  save();
  emit({ type: 'paused', timer: t });
}

export function resume(id) {
  unlockAudio();
  const t = timers.find((x) => x.id === id);
  if (t?.state !== 'paused') return;
  t.endsAt = Date.now() + t.pausedRemaining;
  t.state = 'running';
  save();
  startTicking();
  emit({ type: 'resumed', timer: t });
}

export function addMinutes(id, mins) {
  const t = timers.find((x) => x.id === id);
  if (!t) return;
  if (t.state === 'paused') t.pausedRemaining += mins * 60000;
  else if (t.state === 'running') t.endsAt += mins * 60000;
  else { t.state = 'running'; t.endsAt = Date.now() + mins * 60000; startTicking(); }
  silence();
  save();
  emit({ type: 'changed', timer: t });
}

export function dismiss(id) {
  timers = timers.filter((x) => x.id !== id);
  silence();
  save();
  emit({ type: 'dismissed' });
}

export function pauseRecipe(recipeId) {
  timers.filter((t) => t.recipeId === recipeId && t.state === 'running').forEach((t) => pause(t.id));
}
export function resumeRecipe(recipeId) {
  timers.filter((t) => t.recipeId === recipeId && t.state === 'paused').forEach((t) => resume(t.id));
}

// Resume ticking after reload (and ring for anything that finished while away).
if (timers.some((t) => t.state === 'running')) startTicking();
document.addEventListener('pointerdown', unlockAudio, { once: true });
