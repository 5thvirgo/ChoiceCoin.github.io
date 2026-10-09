// Sharing: every dish has a clean public address (mcuire.ca/cooking-courses/recipes/egusi/)
// that search engines index and that previews nicely on WhatsApp, Facebook and X.
import { config } from '../config.js';
import { esc, icon, on, toast } from './dom.js';

// "/recipes/egusi" -> https://mcuire.ca/cooking-courses/recipes/egusi/
export function publicUrl(path) {
  if (config.basePath) return `${location.origin}${config.basePath}${path.replace(/^\//, '')}/`;
  return `${location.href.split('#')[0]}#${path}`;
}

export function shareRow({ title, text, path }) {
  const url = publicUrl(path);
  const msg = `${text} ${url}`;
  return `<div class="share-row" data-share-row data-title="${esc(title)}" data-text="${esc(text)}" data-url="${esc(url)}">
    <span class="small muted">Share</span>
    <button type="button" class="btn btn-ghost btn-sm" data-share-native>${icon('share', 16)} Share</button>
    <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">WhatsApp</a>
    <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}">Facebook</a>
    <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}">X</a>
    <button type="button" class="btn btn-ghost btn-sm" data-share-copy>Copy link</button>
  </div>`;
}

export function bindShare(root) {
  const row = (el) => el.closest('[data-share-row]').dataset;
  const offs = [
    on(root, 'click', '[data-share-native]', async (_, b) => {
      const d = row(b);
      try {
        if (navigator.share) { await navigator.share({ title: d.title, text: d.text, url: d.url }); return; }
        await navigator.clipboard.writeText(`${d.text} ${d.url}`);
        toast('Link copied. Paste it anywhere to share.');
      } catch { /* cancelled */ }
    }),
    on(root, 'click', '[data-share-copy]', async (_, b) => {
      const d = row(b);
      try { await navigator.clipboard.writeText(d.url); toast('Link copied'); } catch { toast(d.url); }
    }),
  ];
  return () => offs.forEach((o) => o());
}
