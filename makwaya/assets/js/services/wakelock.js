// Keep the phone screen awake while Cook With Me is open.
// Uses the Screen Wake Lock API (Chrome/Edge/Safari 16.4+). Elsewhere it
// silently does nothing; the UI still tells the cook their progress is saved.

let lock = null;
let wanted = false;

async function acquire() {
  if (!wanted || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try {
    lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => { lock = null; });
  } catch { /* denied (battery saver, iframe): ignore */ }
}

document.addEventListener('visibilitychange', () => {
  if (wanted && !lock) acquire();
});

export const wakeLockSupported = 'wakeLock' in navigator;

export function keepAwake() {
  wanted = true;
  acquire();
}

export function allowSleep() {
  wanted = false;
  lock?.release().catch(() => {});
  lock = null;
}
