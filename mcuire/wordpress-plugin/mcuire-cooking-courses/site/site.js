/* Mcuire site style: scroll animations, compact header, back-to-top and the
   phone action bar. Everything degrades to the normal page without JS. */
(function () {
  var cfg = window.MCUIRE_SITE || {};
  var doc = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.classList.add('mcu-js');

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    var body = document.body;
    var main = document.querySelector('main') || body;

    // First cover block on the page is the hero.
    var hero = main.querySelector('.wp-block-cover');
    if (hero && hero.getBoundingClientRect().top < 400) hero.classList.add('mcu-hero');

    // ---- header: compact after scrolling, tucks away while reading down
    var lastY = window.scrollY, ticking = false;
    function onScroll() {
      var y = window.scrollY;
      body.classList.toggle('mcu-scrolled', y > 60);
      var menuOpen = document.querySelector('.wp-block-navigation__responsive-container.is-menu-open');
      body.classList.toggle('mcu-hide-header', !menuOpen && y > 500 && y > lastY + 4);
      if (y < lastY - 4 || y < 500) body.classList.remove('mcu-hide-header');
      lastY = y;
      if (top) top.classList.toggle('is-on', y > 700);
      if (bar) bar.classList.toggle('is-on', y > 300);
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

    // ---- back to top
    var top = document.createElement('button');
    top.className = 'mcu-top';
    top.type = 'button';
    top.setAttribute('aria-label', 'Back to top');
    top.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    body.appendChild(top);

    // ---- phone action bar: Reserve + Call
    var bar = null;
    var reserve = document.querySelector('.patterns-restaurant-header .wp-block-button__link');
    var phone = cfg.phone || '';
    if (!phone) {
      var tel = document.querySelector('a[href^="tel:"]');
      if (tel) phone = tel.getAttribute('href').slice(4);
      else {
        var m = (document.querySelector('footer') || body).textContent.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
        if (m) phone = m[0];
      }
    }
    if (reserve || phone) {
      bar = document.createElement('nav');
      bar.className = 'mcu-bar';
      bar.setAttribute('aria-label', 'Quick actions');
      var html = '';
      if (phone) html += '<a href="tel:' + phone.replace(/[^\d+]/g, '') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>Call</a>';
      if (reserve) html += '<a class="mcu-bar-main" href="' + reserve.getAttribute('href') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' + (reserve.textContent.trim() || 'Reserve') + '</a>';
      bar.innerHTML = html;
      body.appendChild(bar);
    }
    onScroll();

    // ---- scroll reveal
    if (reduce || !('IntersectionObserver' in window)) return;
    var picks = main.querySelectorAll([
      '.wp-block-heading', 'p', '.wp-block-buttons', '.wp-block-image', '.wp-block-gallery',
      '.wp-block-columns > .wp-block-column', '.wp-block-media-text', '.wp-block-list', '.wp-block-quote',
      '.mcu-card', '.mcu-cards > div', '.mcu-proof li', '.mcu-grid figure', '.mcu-ws-row', '.mcu-form'
    ].join(','));
    var foot = document.querySelectorAll('footer .wp-block-column, footer .wp-block-social-links, footer .wp-block-heading');
    var all = Array.prototype.slice.call(picks).concat(Array.prototype.slice.call(foot));
    var seen = new Set();
    all.forEach(function (el) {
      if (seen.has(el) || el.closest('.mcu-hero, .patterns-restaurant-header, [class*="cookie"], [id*="cookie"]')) return;
      // Skip children of something already revealed so nothing animates twice.
      for (var p = el.parentElement; p; p = p.parentElement) { if (seen.has(p)) return; }
      seen.add(el);
      el.classList.add('mcu-reveal');
      if (el.matches('.wp-block-image, .wp-block-gallery, .mcu-grid figure')) el.classList.add('mcu-zoom');
      // Stagger siblings that come in together.
      var i = 0, s = el.previousElementSibling;
      while (s && i < 6) { if (s.classList.contains('mcu-reveal')) i++; s = s.previousElementSibling; }
      el.style.setProperty('--mcu-delay', (i * 0.08).toFixed(2) + 's');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('mcu-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    seen.forEach(function (el) { io.observe(el); });
    // Safety net: never leave anything hidden.
    setTimeout(function () { seen.forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('mcu-in'); }); }, 2500);
  });
})();
