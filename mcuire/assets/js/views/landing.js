import { config } from '../config.js';
import { store } from '../services/store.js';
import { media, recipeTile } from '../components.js';
import { esc, icon, money } from '../lib/dom.js';

export default function landing() {
  const flagship = store.flagship;
  const jollof = store.freeRecipe;
  const cp = jollof.steps.find((s) => s.checkpoint?.options.length >= 3)?.checkpoint;
  const teaser = jollof.steps[6] || jollof.steps[0];
  const highlights = ['party-jollof', 'egusi', 'suya', 'puff-puff'].map((id) => store.recipe(id)).filter(Boolean);

  return {
    title: 'Learn to cook West African food',
    html: `
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <span class="eyebrow">${esc(config.brand.name)} · Cooking Courses</span>
          <h1>Our kitchen is open. <em>Come cook with us.</em></h1>
          <p class="lede">Learn to cook real West African food, from party jollof and egusi to suya and puff-puff. We guide you one step at a time and show you what yours should look like at every stage.</p>
          <div class="row" style="margin-top:28px">
            <a class="btn btn-primary btn-lg" href="#/try">${icon('play', 18)} Try the free jollof lesson</a>
            <a class="btn btn-ghost btn-lg" href="#/courses">Explore courses</a>
          </div>
          <p class="small muted" style="margin-top:14px">No account needed for the free lesson. Takes 2 minutes to try.</p>
        </div>
        <div class="hero-media">
          ${media(jollof.hero, { ratio: 'hero', eager: true })}
          <div class="hero-note"><b>“Wait for the oil to rise.”</b>The one thing that makes party jollof taste like party jollof. We’ll show you exactly what that looks like.</div>
        </div>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <ol class="journey" style="padding:0;margin:0">
          <li><h3>See the finished dish</h3><p class="muted">Times, servings, ingredients and what to buy, before you light the stove.</p></li>
          <li><h3>Cook one step at a time</h3><p class="muted">One clear instruction on screen. Big buttons. Your phone stays awake.</p></li>
          <li><h3>Check yours against ours</h3><p class="muted">Photos of “too watery”, “almost” and “just right” at every important moment.</p></li>
          <li><h3>Cook it again without us</h3><p class="muted">That’s the goal: real confidence, not just one good pot.</p></li>
        </ol>
      </div>
    </section>

    <section class="section">
      <div class="wrap feature-split">
        <div>
          <span class="eyebrow">Cook With Me</span>
          <h2>Not a 40-minute video. A cook standing next to you.</h2>
          <p class="lede">Every recipe becomes a guided session. Each step tells you what to do, what you should see and smell, how long it takes, and what to do if something goes wrong. Start a timer straight from the step, and when it rings we take you right back to where you were.</p>
          <ul class="ticks">
            <li>${icon('check')} Written for people who have barely cooked before</li>
            <li>${icon('check')} Short demo clips only where movement matters</li>
            <li>${icon('check')} Mcuire Tips from our kitchen</li>
            <li>${icon('check')} Your progress is saved. Pause any time.</li>
          </ul>
        </div>
        <div class="phone" aria-hidden="true">
          <div class="phone-screen">
            <div class="ps-top"><span>Party Jollof</span><span>Step 7 of ${jollof.steps.length}</span></div>
            <div class="ps-bar"><i></i></div>
            <div class="ps-body">
              ${media(teaser.media?.[0] || jollof.hero, { ratio: 'wide', compact: true })}
              <h4>${esc(teaser.title)}</h4>
              <p>Cook uncovered, stirring every 2–3 minutes, until you see red oil on top and at the edges.</p>
              <div class="timer-card" style="margin:0 0 12px;padding:12px 14px"><span class="big" style="font-size:2rem">12:00</span><span class="btn btn-gold btn-sm">Start timer</span></div>
              <span class="btn btn-primary btn-block">Done, next step</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    ${cp ? `
    <section class="section dark-section">
      <div class="wrap feature-split">
        <div>
          <span class="eyebrow">Visual checkpoints</span>
          <h2 style="color:#fff">“Does yours look like this?”</h2>
          <p class="lede">At every moment that matters, compare your pot with real photos from the Mcuire kitchen. Tap the one that matches yours and we tell you what to do next: keep going, wait a few minutes, or how to fix it.</p>
          <a class="btn btn-gold" href="#/try">See it in the free lesson</a>
        </div>
        <div class="compare">
          ${cp.options.slice(0, 3).map((o) => `<figure>${media(o.media, { ratio: 'square', compact: true })}<figcaption>${icon(o.verdict === 'good' ? 'check' : o.verdict === 'wait' ? 'clock' : 'alert', 14)} ${esc(o.label)}</figcaption></figure>`).join('')}
        </div>
      </div>
    </section>` : ''}

    <section class="section">
      <div class="wrap">
        <div class="spread" style="margin-bottom:28px">
          <div><span class="eyebrow">Far more than soup</span><h2>The whole West African table</h2></div>
          <a class="link" href="#/courses">See every course</a>
        </div>
        <div class="tiles">${highlights.map((r) => recipeTile(r)).join('')}</div>
      </div>
    </section>

    <section class="section-tight">
      <div class="wrap">
        <div class="flagship">
          ${media(flagship.cover || jollof.gallery?.[0] || jollof.hero, { ratio: null, compact: true })}
          <div class="body">
            <span class="eyebrow">Flagship programme</span>
            <h2 style="color:#fff">${esc(flagship.title)}<br><span style="font-style:italic;color:var(--gold)">${esc(flagship.subtitle)}</span></h2>
            <p class="lede">${esc(flagship.blurb)}</p>
            <ul class="ticks">${flagship.outcomes.map((o) => `<li>${icon('check')} ${esc(o)}</li>`).join('')}</ul>
            <div class="row"><span class="price" style="color:#fff">${money(flagship.priceCents, flagship.currency)}${flagship.compareAtCents ? `<s>${money(flagship.compareAtCents, flagship.currency)}</s>` : ''}</span></div>
            <div class="row" style="margin-top:16px">
              <a class="btn btn-gold btn-lg" href="#/courses/${esc(flagship.slug)}">See the full programme</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    ${store.liveClasses.length ? `<section class="section-tight">
      <div class="wrap">
        <div class="spread" style="margin-bottom:8px">
          <div><span class="eyebrow">Live with our chef</span><h2>Cook with us, live</h2></div>
          <a class="link" href="#/live">All live classes</a>
        </div>
        <p class="lede">Small live classes online and in our kitchen. Ask questions as you cook and get it right the first time.</p>
        <div class="tiles" style="margin-top:20px">${store.liveClasses.slice(0, 3).map((c) => {
          const r = store.recipe(c.recipeId);
          const d = new Date(c.startsAt);
          return `<a class="tile" href="#/live">${media(r?.hero, { ratio: 'wide', compact: true })}<h3>${esc(c.title)}</h3><p>${esc(d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }))} · ${esc(d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }))}</p><div class="meta"><span>${esc(c.format === 'in-person' ? 'In person' : 'Online')}</span><span>·</span><span>${money(c.priceCents, c.currency)}</span></div></a>`;
        }).join('')}</div>
      </div>
    </section>` : ''}

    <section class="section">
      <div class="wrap narrow" style="text-align:center">
        <p class="quote" style="margin:0 auto 18px">“Free recipes are everywhere. What people really want is to know they’re doing it right.”</p>
        <p class="muted">The Mcuire kitchen</p>
        <div class="row" style="justify-content:center;margin-top:24px">
          <a class="btn btn-primary btn-lg" href="#/try">Start cooking free</a>
        </div>
      </div>
    </section>`,
  };
}
