<?php
/**
 * Event Catering page: mcuire.ca/event-catering/
 *
 * Shown inside the site's own header and footer. Past events gallery (photos
 * from Mcuire's earlier catering page), what we cater, and a quote request
 * form that emails the owners and is listed in WordPress → Cooking Courses →
 * Catering requests.
 */

if (!defined('ABSPATH')) {
	exit;
}

class Mcuire_CC_Catering {

	const SLUG = 'event-catering';
	const REQUESTS = 'mcuire_cc_catering_requests';

	private static $categories = array(
		'weddings' => 'Weddings & ceremonies',
		'corporate' => 'Corporate & government',
		'parties' => 'Birthdays & private parties',
		'dinners' => 'Tastings & special dinners',
	);

	public static function init() {
		add_action('init', function () {
			add_rewrite_rule('^' . self::SLUG . '/?$', 'index.php?mcuire_catering=1', 'top');
		});
		add_filter('query_vars', function ($vars) {
			$vars[] = 'mcuire_catering';
			return $vars;
		});
		add_action('template_redirect', array(__CLASS__, 'render'));
		add_action('rest_api_init', function () {
			register_rest_route('mcuire/v1', '/catering', array('methods' => 'POST', 'callback' => array(__CLASS__, 'request'), 'permission_callback' => '__return_true'));
		});
		add_action('admin_menu', function () {
			add_submenu_page('mcuire-cooking-courses', 'Catering requests', 'Catering requests', 'manage_options', 'mcuire-catering-requests', array(__CLASS__, 'admin_page'));
		}, 20);
		// Add "Event Catering" to the site menu once, after this feature arrives.
		add_action('init', function () {
			if (!get_option('mcuire_cc_catering_menu_added')) {
				self::add_menu_link();
			}
		}, 100);
	}

	public static function url() {
		return home_url('/' . self::SLUG . '/');
	}

	public static function photo($id, $w) {
		return 'https://static.wixstatic.com/media/' . rawurlencode($id) . '/v1/fill/w_' . $w . ',h_' . $w . ',q_80/' . rawurlencode($id);
	}

	public static function big($id) {
		return 'https://static.wixstatic.com/media/' . rawurlencode($id) . '/v1/fit/w_1600,h_1600,q_85/' . rawurlencode($id);
	}

	private static function category($title) {
		$t = strtolower($title);
		if (preg_match('/wedding|naming/', $t)) {
			return 'weddings';
		}
		if (preg_match('/government|parks canada|innovate|office|company|end of the year/', $t)) {
			return 'corporate';
		}
		if (preg_match('/tasting|valentine|pastor|church|thanksgiving/', $t)) {
			return 'dinners';
		}
		return 'parties';
	}

	public static function items() {
		$raw = json_decode((string) file_get_contents(MCUIRE_CC_DIR . 'data/catering.json'), true) ?: array();
		return array_map(function ($r) {
			return array('id' => $r[0], 'title' => str_replace('MCUIRE', 'Mcuire', $r[1]), 'desc' => $r[2], 'cat' => self::category($r[1]));
		}, $raw);
	}

	// ---- page ------------------------------------------------------------------
	public static function render() {
		if (!get_query_var('mcuire_catering')) {
			return;
		}
		global $wp_query;
		$wp_query->is_404 = false;
		$wp_query->is_page = true;
		status_header(200);
		$title = 'Event Catering in Niagara · Nigerian & Ghanaian Food · Mcuire';
		$desc = 'Mcuire caters weddings, corporate and government events, birthdays and private parties across Niagara, Oakville and the GTA. See past events and request a quote.';
		$items = self::items();
		$image = $items ? self::photo($items[0]['id'], 1200) : '';
		add_filter('pre_get_document_title', function () use ($title) {
			return $title;
		}, 99);
		add_action('wp_head', function () use ($title, $desc, $image, $items) {
			echo '<meta name="description" content="' . esc_attr($desc) . '">' . "\n";
			echo '<link rel="canonical" href="' . esc_url(self::url()) . '">' . "\n";
			echo '<meta property="og:type" content="website"><meta property="og:title" content="' . esc_attr($title) . '"><meta property="og:description" content="' . esc_attr($desc) . '"><meta property="og:url" content="' . esc_url(self::url()) . '">';
			if ($image) {
				echo '<meta property="og:image" content="' . esc_url($image) . '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' . esc_url($image) . '">';
			}
			$schema = array(
				'@context' => 'https://schema.org',
				'@graph' => array(
					array(
						'@type' => 'Service', 'serviceType' => 'Event catering', 'name' => 'Mcuire Event Catering', 'description' => $desc, 'url' => self::url(),
						'provider' => array('@type' => 'Restaurant', 'name' => 'Mcuire African Restaurant', 'url' => home_url('/'), 'servesCuisine' => array('Nigerian', 'Ghanaian', 'West African')),
						'areaServed' => array('Niagara Falls', 'Niagara Region', 'Fort Erie', 'Oakville', 'Greater Toronto Area'),
					),
					array(
						'@type' => 'ImageGallery', 'name' => 'Mcuire past catering events', 'url' => self::url(),
						'image' => array_map(function ($i) {
							return array('@type' => 'ImageObject', 'contentUrl' => self::big($i['id']), 'name' => $i['title']);
						}, array_slice($items, 0, 30)),
					),
				),
			);
			echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
			echo '<style>' . self::css() . '</style>';
		});
		get_header();
		echo self::body($items);
		get_footer();
		exit;
	}

	private static function body($items) {
		$count = array_count_values(array_column($items, 'cat'));
		ob_start();
		?>
<main class="mcu-cat" id="event-catering">
	<section class="mcu-hero">
		<div class="mcu-wrap">
			<p class="mcu-eyebrow">Mcuire African Restaurant</p>
			<h1>Event Catering</h1>
			<p class="mcu-lede">Nigerian and Ghanaian food for weddings, corporate and government events, birthdays and private parties, cooked by the Mcuire kitchen and served across Niagara, Oakville and the GTA.</p>
			<div class="mcu-actions">
				<a class="mcu-btn" href="#request-a-quote">Request a catering quote</a>
				<a class="mcu-btn mcu-btn-ghost" href="#past-events">See past events</a>
			</div>
			<ul class="mcu-proof">
				<li><b>130</b> guests at a wedding at Balls Falls Conservation Area</li>
				<li><b>170</b> guests at a family reunion</li>
				<li><b>Government of Canada</b> · Parks Canada events</li>
				<li><b>Innovate Niagara</b> · Black Excellence event</li>
			</ul>
		</div>
	</section>

	<section class="mcu-wrap mcu-what">
		<h2>What we cater</h2>
		<div class="mcu-cards">
			<div><h3>Weddings &amp; ceremonies</h3><p>Weddings, traditional ceremonies and child naming ceremonies, from the buffet to plated service.</p></div>
			<div><h3>Corporate &amp; government</h3><p>Office parties, conferences and public events. We have catered for Parks Canada and Innovate Niagara.</p></div>
			<div><h3>Birthdays &amp; private parties</h3><p>Birthdays, reunions, Christmas and Thanksgiving parties, indoors or outdoors, from 10 to 170 guests.</p></div>
			<div><h3>Tastings &amp; special dinners</h3><p>Private menu tastings, Valentine's dinners, retreats and church events, plated at your venue or at Mcuire.</p></div>
		</div>
		<p class="mcu-note">Party jollof, fried rice, small chops, suya, grilled fish, soups and swallows, veg platters and desserts. Tell us your guests' tastes and dietary needs and we will plan the menu with you.</p>
	</section>

	<section class="mcu-wrap" id="past-events">
		<h2>Past events</h2>
		<div class="mcu-filters" role="group" aria-label="Filter events">
			<button type="button" class="is-on" data-cat="all">All (<?php echo count($items); ?>)</button>
			<?php foreach (self::$categories as $k => $label) : if (empty($count[$k])) { continue; } ?>
				<button type="button" data-cat="<?php echo esc_attr($k); ?>"><?php echo esc_html($label); ?> (<?php echo (int) $count[$k]; ?>)</button>
			<?php endforeach; ?>
		</div>
		<div class="mcu-grid">
			<?php foreach ($items as $i => $it) : ?>
				<figure data-cat="<?php echo esc_attr($it['cat']); ?>">
					<button type="button" data-i="<?php echo (int) $i; ?>" aria-label="<?php echo esc_attr('Open photo: ' . $it['title']); ?>">
						<img src="<?php echo esc_url(self::photo($it['id'], 600)); ?>" alt="<?php echo esc_attr($it['title'] . ($it['desc'] && strlen($it['desc']) < 80 ? ' – ' . $it['desc'] : '')); ?>" loading="<?php echo $i < 6 ? 'eager' : 'lazy'; ?>" decoding="async" width="600" height="600">
					</button>
					<figcaption><b><?php echo esc_html($it['title']); ?></b><?php if ($it['desc'] && strlen($it['desc']) < 80) : ?><span><?php echo esc_html($it['desc']); ?></span><?php endif; ?></figcaption>
				</figure>
			<?php endforeach; ?>
		</div>
	</section>

	<section class="mcu-wrap mcu-quote" id="request-a-quote">
		<div>
			<h2>Request a catering quote</h2>
			<p>Tell us about your event and we will reply by email with menu ideas and a price. The more you tell us, the more exact the quote.</p>
			<p class="mcu-small">Prefer to talk? Visit us at the restaurant or use the contact details on our <a href="<?php echo esc_url(home_url('/contact/')); ?>">Contact page</a>.</p>
		</div>
		<form class="mcu-form" data-catering-form novalidate>
			<div class="mcu-row"><label>Your name<input name="name" required autocomplete="name"></label><label>Email<input name="email" type="email" required autocomplete="email"></label></div>
			<div class="mcu-row"><label>Phone<input name="phone" type="tel" autocomplete="tel"></label><label>Type of event<select name="type"><option>Wedding</option><option>Corporate or government</option><option>Birthday or private party</option><option>Church or community event</option><option>Tasting or special dinner</option><option>Other</option></select></label></div>
			<div class="mcu-row"><label>Event date<input name="date" type="date"></label><label>Number of guests<input name="guests" type="number" min="1" inputmode="numeric"></label></div>
			<label>Where is the event?<input name="location" placeholder="Venue or city"></label>
			<label>Tell us about it<textarea name="message" rows="4" placeholder="Dishes you'd love, dietary needs, buffet or plated, budget…"></textarea></label>
			<label class="mcu-hp" aria-hidden="true">Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label>
			<button class="mcu-btn" type="submit">Send request</button>
			<p class="mcu-status" role="status" aria-live="polite"></p>
		</form>
	</section>

	<div class="mcu-lightbox" hidden><button type="button" class="mcu-x" aria-label="Close">×</button><button type="button" class="mcu-prev" aria-label="Previous">‹</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="mcu-next" aria-label="Next">›</button></div>
</main>
<script>
(function () {
	var items = <?php echo wp_json_encode(array_map(function ($it) { return array('src' => self::big($it['id']), 'title' => $it['title'], 'desc' => $it['desc']); }, $items)); ?>;
	var root = document.getElementById('event-catering');
	root.querySelectorAll('.mcu-filters button').forEach(function (b) {
		b.addEventListener('click', function () {
			root.querySelectorAll('.mcu-filters button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
			root.querySelectorAll('.mcu-grid figure').forEach(function (f) { f.hidden = b.dataset.cat !== 'all' && f.dataset.cat !== b.dataset.cat; });
		});
	});
	var box = root.querySelector('.mcu-lightbox'), img = box.querySelector('img'), cap = box.querySelector('figcaption'), at = 0;
	function visible() { return Array.prototype.filter.call(root.querySelectorAll('.mcu-grid figure'), function (f) { return !f.hidden; }).map(function (f) { return +f.querySelector('button').dataset.i; }); }
	function show(i) { at = i; var it = items[i]; img.src = it.src; img.alt = it.title; cap.innerHTML = ''; var b = document.createElement('b'); b.textContent = it.title; cap.appendChild(b); if (it.desc) { var s = document.createElement('span'); s.textContent = it.desc; cap.appendChild(s); } box.hidden = false; document.body.style.overflow = 'hidden'; }
	function step(d) { var v = visible(), k = v.indexOf(at); show(v[(k + d + v.length) % v.length]); }
	function close() { box.hidden = true; document.body.style.overflow = ''; }
	root.querySelectorAll('.mcu-grid button').forEach(function (b) { b.addEventListener('click', function () { show(+b.dataset.i); }); });
	box.querySelector('.mcu-x').addEventListener('click', close);
	box.querySelector('.mcu-prev').addEventListener('click', function () { step(-1); });
	box.querySelector('.mcu-next').addEventListener('click', function () { step(1); });
	box.addEventListener('click', function (e) { if (e.target === box) close(); });
	document.addEventListener('keydown', function (e) { if (box.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });

	var form = root.querySelector('[data-catering-form]'), status = form.querySelector('.mcu-status');
	form.addEventListener('submit', function (e) {
		e.preventDefault();
		if (!form.name.value.trim() || !/^\S+@\S+\.\S+$/.test(form.email.value.trim())) { status.textContent = 'Please add your name and a valid email so we can reply.'; return; }
		var btn = form.querySelector('button[type=submit]'); btn.disabled = true; status.textContent = 'Sending…';
		var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
		fetch(<?php echo wp_json_encode(rest_url('mcuire/v1/catering')); ?>, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Mcuire': '1' }, body: JSON.stringify(data) })
			.then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
			.then(function (res) {
				if (res.ok) { form.reset(); status.textContent = 'Thank you! Your request has been sent. We will reply by email soon.'; }
				else { status.textContent = (res.j && res.j.error) || 'Something went wrong. Please try again.'; }
			})
			.catch(function () { status.textContent = 'Could not send. Please check your connection and try again.'; })
			.then(function () { btn.disabled = false; });
	});
})();
</script>
		<?php
		return ob_get_clean();
	}

	private static function css() {
		return '
.mcu-cat{--mcu-accent:#ef9a1a;--mcu-accent-ink:#9a5a00;--mcu-ink:#1f1a17;--mcu-muted:#5f544b;--mcu-paper:#fbf6ee;--mcu-line:#e8dccb;--mcu-ease:cubic-bezier(.2,.7,.2,1);color:var(--mcu-ink);font-family:Roboto,system-ui,-apple-system,"Segoe UI",Arial,sans-serif;font-size:17px;line-height:1.65;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
@media (min-width:900px){.mcu-cat{font-size:18px}}
.mcu-cat p{text-wrap:pretty}
.mcu-cat *{box-sizing:border-box}
.mcu-wrap{max-width:1180px;margin:0 auto;padding:0 20px}
.mcu-hero{background:var(--mcu-paper);padding:64px 0 48px;margin-bottom:48px}
.mcu-eyebrow{text-transform:uppercase;letter-spacing:.16em;font-size:.8rem;color:var(--mcu-accent-ink);font-weight:700;margin:0 0 8px}
.mcu-cat h1{font-family:"Playfair Display",Georgia,serif;font-size:clamp(2.4rem,6vw,4rem);line-height:1.08;margin:0 0 16px;color:var(--mcu-ink);font-weight:700;text-wrap:balance}
.mcu-cat h2{font-family:"Playfair Display",Georgia,serif;font-size:clamp(1.8rem,4vw,2.4rem);line-height:1.15;margin:0 0 16px;color:var(--mcu-ink);font-weight:700;text-wrap:balance}
.mcu-cat h3{font-family:"Playfair Display",Georgia,serif;font-size:1.25rem;line-height:1.25;font-weight:700;margin:0 0 8px;color:var(--mcu-ink)}
.mcu-lede{font-size:1.2rem;max-width:44em;color:var(--mcu-muted);margin:0 0 24px}
.mcu-actions{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:28px}
.mcu-btn{display:inline-block;background:var(--mcu-accent);color:#fff!important;border:0;border-radius:4px;padding:14px 26px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:.85rem;text-decoration:none;cursor:pointer}
.mcu-btn{transition:transform .18s var(--mcu-ease),box-shadow .25s var(--mcu-ease),background-color .2s var(--mcu-ease)}
.mcu-btn:hover{transform:translateY(-2px);box-shadow:0 12px 24px -12px rgba(154,90,0,.7)}
.mcu-btn:active{transform:translateY(0) scale(.98)}
.mcu-btn-ghost:hover{background:#fff;box-shadow:inset 0 0 0 2px var(--mcu-ink),0 10px 22px -14px rgba(0,0,0,.5)}
.mcu-cat :focus-visible{outline:3px solid var(--mcu-accent);outline-offset:2px}
.mcu-btn-ghost{background:transparent;color:var(--mcu-ink)!important;box-shadow:inset 0 0 0 2px var(--mcu-ink)}
.mcu-proof{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.mcu-proof li{background:#fff;border:1px solid var(--mcu-line);border-radius:8px;padding:12px 14px;font-size:.95rem;color:var(--mcu-muted)}
.mcu-proof b{display:block;color:var(--mcu-ink);font-family:"Playfair Display",Georgia,serif;font-size:1.3rem;font-variant-numeric:lining-nums}
.mcu-what{margin-bottom:56px}
.mcu-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.mcu-cards>div{border:1px solid var(--mcu-line);border-radius:8px;padding:20px;background:#fff;transition:transform .25s var(--mcu-ease),box-shadow .25s var(--mcu-ease),border-color .2s}
.mcu-cards>div:hover{transform:translateY(-4px);border-color:var(--mcu-accent);box-shadow:0 18px 34px -22px rgba(31,26,23,.45)}
.mcu-cards p{margin:0;color:var(--mcu-muted);font-size:.98rem}
.mcu-note{color:var(--mcu-muted);margin-top:16px}
.mcu-filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
.mcu-filters button{border:1px solid var(--mcu-line);background:#fff;border-radius:999px;padding:8px 16px;font-size:.92rem;cursor:pointer;color:var(--mcu-ink);transition:background-color .2s,border-color .2s,color .2s}
.mcu-filters button:hover{border-color:var(--mcu-ink)}
.mcu-filters button.is-on{background:var(--mcu-ink);border-color:var(--mcu-ink);color:#fff}
.mcu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;margin-bottom:64px}
.mcu-grid figure{margin:0}
.mcu-grid figure[hidden]{display:none}
.mcu-grid button{display:block;width:100%;padding:0;border:0;background:#eee;border-radius:8px;overflow:hidden;cursor:zoom-in;aspect-ratio:1}
.mcu-grid img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s var(--mcu-ease)}
.mcu-grid button{transition:box-shadow .25s var(--mcu-ease)}
.mcu-grid button:hover{box-shadow:0 16px 30px -18px rgba(31,26,23,.6)}
.mcu-grid button:hover img{transform:scale(1.06)}
.mcu-grid figcaption{padding:8px 2px 0;font-size:.9rem;line-height:1.35}
.mcu-grid figcaption span,.mcu-lightbox figcaption span{display:block;color:var(--mcu-muted);font-size:.85rem}
.mcu-quote{display:grid;grid-template-columns:1fr 1.3fr;gap:40px;padding-top:40px;padding-bottom:72px;border-top:1px solid var(--mcu-line)}
.mcu-small{font-size:.92rem;color:var(--mcu-muted)}
.mcu-form{display:grid;gap:14px;background:var(--mcu-paper);padding:24px;border-radius:10px}
.mcu-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mcu-form label{display:grid;gap:6px;font-weight:600;font-size:.92rem}
.mcu-form input,.mcu-form select,.mcu-form textarea{width:100%;font:inherit;font-weight:400;padding:12px 14px;border:1px solid var(--mcu-line);border-radius:6px;background:#fff;color:var(--mcu-ink);transition:border-color .2s,box-shadow .2s}
.mcu-form input:hover,.mcu-form select:hover,.mcu-form textarea:hover{border-color:#b9a892}
.mcu-form input:focus,.mcu-form select:focus,.mcu-form textarea:focus{outline:none;border-color:var(--mcu-accent);box-shadow:0 0 0 4px rgba(239,154,26,.2)}
.mcu-hp{position:absolute!important;left:-9999px!important}
.mcu-status{margin:0;font-weight:600}
.mcu-lightbox{position:fixed;inset:0;z-index:99999;background:rgba(15,10,6,.92);display:flex;align-items:center;justify-content:center;padding:20px}
.mcu-lightbox[hidden]{display:none}
.mcu-lightbox figure{margin:0;max-width:min(1100px,100%);text-align:center;color:#fff}
.mcu-lightbox img{max-width:100%;max-height:78vh;border-radius:6px}
.mcu-lightbox figcaption{margin-top:10px}
.mcu-lightbox figcaption span{color:#d9cfc4}
.mcu-lightbox button{position:absolute;background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:999px;width:48px;height:48px;font-size:28px;cursor:pointer;transition:background-color .2s}
.mcu-lightbox button:hover{background:rgba(255,255,255,.25)}
@media (prefers-reduced-motion:reduce){.mcu-cat *{transition:none!important}}
.mcu-x{top:16px;right:16px}.mcu-prev{left:12px;top:50%}.mcu-next{right:12px;top:50%}
@media (max-width:780px){.mcu-quote{grid-template-columns:1fr}.mcu-row{grid-template-columns:1fr}.mcu-hero{padding:40px 0 32px}}
';
	}

	// ---- quote requests ----------------------------------------------------------
	public static function request(WP_REST_Request $req) {
		if ($req->get_header('x_mcuire') !== '1') {
			return new WP_REST_Response(array('error' => 'Missing request header'), 403);
		}
		$d = json_decode($req->get_body(), true);
		if (!is_array($d)) {
			return new WP_REST_Response(array('error' => 'Invalid request'), 400);
		}
		if (!empty($d['website'])) {
			return new WP_REST_Response(array('ok' => true), 200); // spam trap
		}
		$ip_key = 'mcuire_cat_' . md5((string) ($_SERVER['REMOTE_ADDR'] ?? ''));
		$n = (int) get_transient($ip_key);
		if ($n >= 5) {
			return new WP_REST_Response(array('error' => 'You have sent several requests already. Please wait an hour or contact us directly.'), 429);
		}
		$email = sanitize_email($d['email'] ?? '');
		$name = sanitize_text_field($d['name'] ?? '');
		if (!$name || !is_email($email)) {
			return new WP_REST_Response(array('error' => 'Please add your name and a valid email so we can reply.'), 400);
		}
		$r = array(
			'id' => 'cat_' . bin2hex(random_bytes(5)), 'createdAt' => gmdate('c'), 'name' => $name, 'email' => $email,
			'phone' => sanitize_text_field($d['phone'] ?? ''), 'type' => sanitize_text_field($d['type'] ?? ''),
			'date' => sanitize_text_field($d['date'] ?? ''), 'guests' => max(0, (int) ($d['guests'] ?? 0)),
			'location' => sanitize_text_field($d['location'] ?? ''), 'message' => sanitize_textarea_field($d['message'] ?? ''),
		);
		$all = get_option(self::REQUESTS, array());
		array_unshift($all, $r);
		update_option(self::REQUESTS, array_slice($all, 0, 500), false);
		set_transient($ip_key, $n + 1, HOUR_IN_SECONDS);

		$to = array_filter(array_map('trim', explode(',', (string) get_option('mcuire_cc_admin_emails', get_option('admin_email')))));
		$body = "New catering request from mcuire.ca/event-catering/\n\n"
			. "Name: {$r['name']}\nEmail: {$r['email']}\nPhone: {$r['phone']}\nEvent: {$r['type']}\nDate: {$r['date']}\nGuests: {$r['guests']}\nWhere: {$r['location']}\n\n{$r['message']}\n";
		wp_mail($to ?: get_option('admin_email'), 'Catering request: ' . $r['type'] . ($r['guests'] ? ' for ' . $r['guests'] . ' guests' : '') . ' – ' . $r['name'], $body, array('Reply-To: ' . $r['name'] . ' <' . $r['email'] . '>'));
		wp_mail($r['email'], 'We received your catering request – Mcuire African Restaurant', "Hi {$r['name']},\n\nThank you for asking Mcuire to cater your event. We have your request and will reply by email soon with menu ideas and a quote.\n\nMcuire African Restaurant\n" . home_url('/'));
		return new WP_REST_Response(array('ok' => true), 200);
	}

	public static function admin_page() {
		if (!current_user_can('manage_options')) {
			return;
		}
		$all = get_option(self::REQUESTS, array());
		echo '<div class="wrap"><h1>Catering requests</h1><p>Requests sent from <a href="' . esc_url(self::url()) . '" target="_blank">' . esc_html(self::url()) . '</a>. Each one is also emailed to the owner emails in Cooking Courses settings.</p>';
		if (!$all) {
			echo '<p>No requests yet.</p></div>';
			return;
		}
		echo '<table class="widefat striped"><thead><tr><th>Received</th><th>Name</th><th>Contact</th><th>Event</th><th>Date</th><th>Guests</th><th>Where</th><th>Message</th></tr></thead><tbody>';
		foreach ($all as $r) {
			echo '<tr><td>' . esc_html(wp_date('M j, Y g:i a', strtotime($r['createdAt']))) . '</td><td>' . esc_html($r['name']) . '</td><td><a href="mailto:' . esc_attr($r['email']) . '">' . esc_html($r['email']) . '</a><br>' . esc_html($r['phone']) . '</td><td>' . esc_html($r['type']) . '</td><td>' . esc_html($r['date']) . '</td><td>' . (int) $r['guests'] . '</td><td>' . esc_html($r['location']) . '</td><td>' . nl2br(esc_html($r['message'])) . '</td></tr>';
		}
		echo '</tbody></table></div>';
	}

	// ---- menu link ---------------------------------------------------------------
	public static function add_menu_link() {
		$url = self::url();
		$added = false;
		foreach (array_unique(array_filter(array_values((array) get_nav_menu_locations()))) as $menu_id) {
			$items = wp_get_nav_menu_items($menu_id) ?: array();
			foreach ($items as $item) {
				if (untrailingslashit($item->url) === untrailingslashit($url)) {
					$added = true;
					continue 2;
				}
			}
			wp_update_nav_menu_item($menu_id, 0, array('menu-item-title' => 'Event Catering', 'menu-item-url' => $url, 'menu-item-status' => 'publish', 'menu-item-type' => 'custom'));
			$added = true;
		}
		foreach (get_posts(array('post_type' => 'wp_navigation', 'post_status' => 'publish', 'numberposts' => 5)) as $nav) {
			if (strpos($nav->post_content, '/' . self::SLUG) !== false) {
				$added = true;
				continue;
			}
			$link = sprintf('<!-- wp:navigation-link {"label":"Event Catering","url":"%s","kind":"custom","isTopLevelLink":true} /-->', esc_url($url));
			wp_update_post(array('ID' => $nav->ID, 'post_content' => $nav->post_content . "\n" . $link));
			$added = true;
		}
		update_option('mcuire_cc_catering_menu_added', $added ? 'yes' : 'manual');
	}
}

Mcuire_CC_Catering::init();
