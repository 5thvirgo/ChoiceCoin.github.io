// Makwaya Certificate of Completion.
// Rendered as SVG (crisp at any size, prints perfectly), exported to PNG via canvas.
// Wording deliberately says "certificate of completion", not an accredited qualification.

import { config } from '../config.js';
import { store, isValidCertificateNumber } from '../services/store.js';
import { seal, brandMark } from '../components.js';
import { esc, icon, formatDate, money, on, toast } from '../lib/dom.js';

const W = 1600;
const H = 1131;

function weave(y) {
  const colors = ['#c43d1a', '#e0a22a', '#1d140e', '#3b6a3a', '#e0a22a', '#1d140e'];
  const widths = [44, 16, 8, 36, 16, 8];
  let x = 60;
  let i = 0;
  let out = '';
  while (x < W - 60) {
    const w = Math.min(widths[i % 6], W - 60 - x);
    out += `<rect x="${x}" y="${y}" width="${w}" height="10" fill="${colors[i % 6]}"/>`;
    x += w;
    i += 1;
  }
  return out;
}

export function certificateSvg({ name, course, date, number, preview = false }) {
  const brand = config.brand;
  const nameSize = name.length > 26 ? 64 : name.length > 18 ? 78 : 92;
  return `<svg class="cert-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Certificate of Completion for ${esc(name)}">
  <rect width="${W}" height="${H}" fill="#fffdf8"/>
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="#1d140e" stroke-width="3"/>
  <rect x="44" y="44" width="${W - 88}" height="${H - 88}" fill="none" stroke="#b08a2e" stroke-width="1.5"/>
  ${weave(60)}${weave(H - 70)}
  ${[[70, 90], [W - 70, 90], [70, H - 90], [W - 70, H - 90]].map(([x, y]) => `<g transform="translate(${x} ${y})"><rect x="-9" y="-9" width="18" height="18" transform="rotate(45)" fill="#c43d1a"/><rect x="-4" y="-4" width="8" height="8" transform="rotate(45)" fill="#e0a22a"/></g>`).join('')}

  <g transform="translate(${W / 2 - 40} 110)">${brandMark(80).replace('class="brand-mark"', '')}</g>
  <text x="${W / 2}" y="242" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="9" fill="#1d140e">${esc(brand.name.toUpperCase())}</text>
  <line x1="${W / 2 - 220}" y1="272" x2="${W / 2 + 220}" y2="272" stroke="#b08a2e" stroke-width="1.5"/>
  <text x="${W / 2}" y="326" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="52" font-weight="600" letter-spacing="6" fill="#c43d1a">CERTIFICATE OF COMPLETION</text>

  <text x="${W / 2}" y="406" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="30" fill="#4f4035">This certifies that</text>
  <text x="${W / 2}" y="${500}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-weight="600" font-size="${nameSize}" fill="#1d140e">${esc(name)}</text>
  <line x1="${W / 2 - 420}" y1="528" x2="${W / 2 + 420}" y2="528" stroke="#1d140e" stroke-width="1"/>
  <text x="${W / 2}" y="582" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="30" fill="#4f4035">has successfully completed</text>
  <text x="${W / 2}" y="652" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="54" fill="#1d140e">${esc(course.certificateTitle || course.title)}</text>
  <text x="${W / 2}" y="712" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="23" fill="#4f4035">Makwaya’s guided home-cooking programme in West African dishes, ingredients,</text>
  <text x="${W / 2}" y="744" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="23" fill="#4f4035">preparation methods and cooking techniques, taught step by step by the Makwaya kitchen.</text>

  <g font-family="DM Sans, Arial, sans-serif">
    <text x="300" y="900" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="32" fill="#1d140e">${esc(date)}</text>
    <line x1="160" y1="918" x2="440" y2="918" stroke="#1d140e"/>
    <text x="300" y="950" text-anchor="middle" font-size="18" letter-spacing="3" font-weight="700" fill="#84715f">DATE OF COMPLETION</text>

    <text x="${W - 300}" y="900" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="44" fill="#23170f">${esc(brand.signatory.name)}</text>
    <line x1="${W - 450}" y1="918" x2="${W - 150}" y2="918" stroke="#1d140e"/>
    <text x="${W - 300}" y="950" text-anchor="middle" font-size="18" letter-spacing="3" font-weight="700" fill="#84715f">AUTHORISED SIGNATURE</text>
    <text x="${W - 300}" y="976" text-anchor="middle" font-size="17" fill="#84715f">${esc(brand.signatory.title)}</text>
  </g>
  <g transform="translate(${W / 2 - 100} 780)">${seal(200, 'cert-seal')}</g>

  <text x="${W / 2}" y="1028" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="18" letter-spacing="2" fill="#4f4035">CERTIFICATE NO. ${esc(number)}</text>
  <text x="${W / 2}" y="1052" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="14" fill="#84715f">A Makwaya Certificate of Completion. Not an accredited culinary qualification.</text>
  ${preview ? `<text x="${W / 2}" y="${H / 2 + 60}" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="230" font-weight="700" fill="#c43d1a" fill-opacity="0.08" transform="rotate(-18 ${W / 2} ${H / 2})">PREVIEW</text>` : ''}
</svg>`;
}

// Best effort: inline the Google fonts so the exported PNG matches the screen.
async function fontCss() {
  try {
    const href = document.querySelector('link[href*="fonts.googleapis"]').href;
    const css = await (await fetch(href)).text();
    const urls = [...new Set(css.match(/url\((https:[^)]+)\)/g) || [])].slice(0, 12);
    let out = css;
    await Promise.all(urls.map(async (u) => {
      const url = u.slice(4, -1);
      const blob = await (await fetch(url)).blob();
      const data = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
      out = out.split(url).join(data);
    }));
    return out;
  } catch {
    return '';
  }
}

async function toPng(svg) {
  const css = await fontCss();
  const withFonts = svg.replace('<rect width', `<style>${css}</style><rect width`);
  const url = URL.createObjectURL(new Blob([withFonts], { type: 'image/svg+xml' }));
  const img = new Image();
  img.decoding = 'async';
  await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
  await new Promise((r) => setTimeout(r, 150)); // let embedded fonts settle
  const canvas = document.createElement('canvas');
  canvas.width = W * 1.5;
  canvas.height = H * 1.5;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return new Promise((r) => canvas.toBlob(r, 'image/png'));
}

function verifyUrl(number) {
  return `${location.origin}${location.pathname}#/verify/${encodeURIComponent(number)}`;
}

async function verify(number) {
  let record = null;
  const valid = isValidCertificateNumber(number);
  if (valid) {
    if (config.dataSource === 'api') {
      try { const r = await fetch(`api/certificates/${encodeURIComponent(number)}`); if (r.ok) record = await r.json(); } catch { /* offline */ }
    } else {
      record = store.kitchen.certificates.find((c) => c.number === number.toUpperCase()) || null;
    }
  }
  const course = record && store.course(record.courseId);
  return {
    title: 'Verify a certificate',
    html: `<section class="section"><div class="wrap narrow" style="text-align:center">
      <span class="eyebrow">Certificate verification</span>
      <h1 style="font-size:clamp(1.8rem,4vw,2.6rem)">${record ? 'This certificate is genuine' : valid ? 'Certificate not found' : 'That number isn’t valid'}</h1>
      ${record ? `<div class="panel" style="text-align:left;margin-top:24px">
        <p><b>Name:</b> ${esc(record.name)}</p><p><b>Programme:</b> ${esc(course?.certificateTitle || record.courseId)}</p>
        <p><b>Completed:</b> ${formatDate(record.issuedAt)}</p><p style="margin:0"><b>Number:</b> ${esc(record.number)}</p></div>
        <p class="small muted">Issued by ${esc(config.brand.name)} as a Certificate of Completion. Not an accredited culinary qualification.</p>`
        : `<p class="lede" style="margin:0 auto">${valid ? (config.dataSource === 'api' ? 'We have no certificate with that number.' : 'In this demo, certificates can only be verified on the device that issued them. The live site checks Makwaya’s records.') : 'Certificate numbers look like MKW-2026-ABC234-X. Please check for typos.'}</p>`}
    </div></section>`,
  };
}

export default async function certificate(params, query, route) {
  if (route.pattern === '/verify/:number') return verify(params.number);

  const course = store.flagship;
  const owns = store.owns(course.id);
  const progress = store.certificateProgress(course);
  const earned = progress.ratio >= 1;
  const cert = store.certificate(course.id);
  const accountName = store.kitchen.account?.name || '';

  const view = () => {
    const c = store.certificate(course.id);
    if (c) {
      return `
        <span class="eyebrow">Congratulations</span>
        <h1 style="font-size:clamp(2rem,5vw,3.2rem)">Your Makwaya certificate</h1>
        <div class="cert-wrap" style="margin-top:20px" data-cert>${certificateSvg({ name: c.name, course, date: formatDate(c.issuedAt), number: c.number })}</div>
        <div class="row no-print" style="margin-top:20px;justify-content:center">
          <button class="btn btn-primary" data-dl>${icon('download', 18)} Download image</button>
          <button class="btn btn-ghost" onclick="window.print()">${icon('download', 18)} Save as PDF</button>
          <button class="btn btn-ghost" data-share>${icon('share', 18)} Share</button>
          <a class="btn btn-ghost" href="#/verify/${esc(c.number)}">Verification page</a>
        </div>`;
    }
    const sampleName = accountName || 'Your Name';
    return `
      <span class="eyebrow">${esc(course.certificateTitle)}</span>
      <h1 style="font-size:clamp(2rem,5vw,3.2rem)">${earned ? 'You’ve earned it' : 'Your certificate is waiting'}</h1>
      <p class="lede">${earned
        ? 'Add your name exactly as you want it printed, then issue your certificate.'
        : owns
          ? `Cook every dish in the programme to earn your Makwaya Certificate of Completion. You’ve cooked <b>${progress.completed.length} of ${progress.required.length}</b>.`
          : `Complete ${esc(course.title)} to receive this personalised certificate from ${esc(config.brand.name)}.`}</p>
      ${owns && !earned ? `<div class="progress gold" style="max-width:520px;margin:6px 0 24px"><i style="width:${progress.ratio * 100}%"></i></div>` : ''}
      ${earned ? `<form class="panel no-print" data-issue style="max-width:560px">
        <div class="field"><label for="cert-name">Name on certificate</label><input id="cert-name" name="name" required maxlength="40" autocomplete="name" value="${esc(accountName)}"><small>Check the spelling. This is how it will appear.</small></div>
        <button class="btn btn-primary btn-lg" type="submit">${icon('award', 20)} Issue my certificate</button>
      </form>` : ''}
      <div class="cert-wrap" style="margin-top:20px">${certificateSvg({ name: sampleName, course, date: formatDate(new Date().toISOString()), number: 'MKW-0000-PREVIEW', preview: true })}</div>
      <p class="cert-preview-note small muted">Preview. Your name, completion date and a unique certificate number appear on the final version.</p>
      ${owns ? '' : `<div class="row no-print" style="justify-content:center;margin-top:12px"><a class="btn btn-primary btn-lg" href="#/courses/${esc(course.slug)}">Get ${esc(course.title)} · ${money(course.priceCents, course.currency)}</a></div>`}`;
  };

  return {
    title: 'Certificate',
    html: `<section class="section-tight"><div class="wrap" data-root>${view()}</div></section>`,
    mount(root) {
      const host = root.querySelector('[data-root]');
      const offs = [
        on(root, 'submit', '[data-issue]', async (e, f) => {
          e.preventDefault();
          const name = f.name.value.trim();
          if (!name) return;
          if (!accountName) store.setAccountName(name);
          try {
            await store.issueCertificate(course.id, name);
          } catch (err) {
            toast(err.message);
            return;
          }
          host.innerHTML = view();
          toast('Certificate issued. Congratulations!');
        }),
        on(root, 'click', '[data-dl]', async (_, b) => {
          b.disabled = true;
          const c = store.certificate(course.id);
          const blob = await toPng(certificateSvg({ name: c.name, course, date: formatDate(c.issuedAt), number: c.number }));
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `Makwaya-Certificate-${c.number}.png`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 2000);
          b.disabled = false;
        }),
        on(root, 'click', '[data-share]', async () => {
          const c = store.certificate(course.id);
          const text = `I completed ${course.certificateTitle} with ${config.brand.name}!`;
          const url = verifyUrl(c.number);
          try {
            const blob = await toPng(certificateSvg({ name: c.name, course, date: formatDate(c.issuedAt), number: c.number }));
            const file = new File([blob], 'Makwaya-Certificate.png', { type: 'image/png' });
            if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text, url });
            else if (navigator.share) await navigator.share({ title: 'My Makwaya certificate', text, url });
            else { await navigator.clipboard.writeText(`${text} ${url}`); toast('Link copied. Paste it anywhere to share.'); }
          } catch { /* cancelled */ }
        }),
      ];
      if (cert && query.print) setTimeout(() => window.print(), 300);
      return () => offs.forEach((o) => o());
    },
  };
}
