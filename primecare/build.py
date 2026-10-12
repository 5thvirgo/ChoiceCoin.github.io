#!/usr/bin/env python3
"""Builds dist/ from src/ and config.json.

  python3 build.py            release build: stops if any field still says TODO
  python3 build.py --preview  preview build: TODO fields shown as [placeholders]
"""
import html, json, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).parent
preview = '--preview' in sys.argv
cfg = json.loads((ROOT / 'config.json').read_text())

todo = [k for k, v in cfg.items() if not k.startswith('_') and 'TODO' in json.dumps(v)]
if todo and not preview:
    sys.exit('Fill these in config.json first: ' + ', '.join(todo))

def field(key, label):
    # In preview, "TODO e.g. 905-555-0100" shows as "[Phone number]" so nothing fake looks real.
    v = cfg[key]
    return f'[{label}]' if 'TODO' in v else v

phone = field('phone', 'Phone number')
digits = re.sub(r'\D', '', phone)
if len(digits) == 10:
    digits = '1' + digits
email = field('email', 'Email')
areas = [a if 'TODO' not in a else '[City]' for a in cfg['areas']]

values = {
    'NAME': cfg['name'], 'SHORT': cfg['short'], 'DOMAIN': cfg['domain'],
    'PHONE': phone, 'TEL': ('tel:+' + digits) if digits else '#call',
    'SMS': ('sms:+' + digits) if digits else '#call',
    'EMAIL': email, 'MAILTO': ('mailto:' + email) if '@' in email else '#call',
    'AREA': field('area', 'Area you serve'), 'HOURS': field('hours', 'Hours'),
    'AREAS_LI': '\n'.join(f'<li class="rv" style="--t:{i * .06:.2f}s"><i class="ph ph-map-pin" aria-hidden="true"></i>{html.escape(a)}</li>' for i, a in enumerate(areas)),
    'AREAS_JSON': json.dumps(areas),
    'SERVICES': '\n'.join(
        f'<li class="svc rv" style="--t:{i * .06:.2f}s"><span class="ic"><i class="ph {ic}" aria-hidden="true"></i></span>'
        f'<h3>{html.escape(t)}</h3><p>{html.escape(d)}</p></li>'
        for i, (ic, t, d) in enumerate(cfg['services'])),
    'SERVICES_JSON': json.dumps([t for _, t, _ in cfg['services']]),
}

page = (ROOT / 'src/index.html').read_text()
for k, v in values.items():
    esc = v if k in ('AREAS_LI', 'SERVICES', 'AREAS_JSON', 'SERVICES_JSON') else html.escape(v, quote=True)
    page = page.replace('{{' + k + '}}', esc)
left = re.findall(r'\{\{\w+\}\}', page)
if left:
    sys.exit('Unknown placeholders: ' + ', '.join(sorted(set(left))))

out = ROOT / 'dist'
shutil.rmtree(out, ignore_errors=True)
out.mkdir()
(out / 'index.html').write_text(page)
if (ROOT / 'src/img').exists():
    shutil.copytree(ROOT / 'src/img', out / 'img')
print('Built', 'PREVIEW' if preview else 'RELEASE', '->', out / 'index.html')
