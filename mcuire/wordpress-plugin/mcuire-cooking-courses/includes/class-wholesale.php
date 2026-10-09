<?php
/**
 * Wholesale Drinks page: mcuire.ca/wholesale-drinks/
 *
 * Zobo (hibiscus drink) for events and for resale. Shown inside the site's own
 * header and footer, with a "Request a Bulk Order Quote" form that emails the
 * owners and is listed in WordPress → Cooking Courses → Wholesale orders.
 * Also puts the site menu in the owner's chosen order once (see menu_order()).
 */

if (!defined('ABSPATH')) {
	exit;
}

class Mcuire_CC_Wholesale {

	const SLUG = 'wholesale-drinks';
	const REQUESTS = 'mcuire_cc_wholesale_requests';

	public static function init() {
		add_action('init', function () {
			add_rewrite_rule('^' . self::SLUG . '/?$', 'index.php?mcuire_wholesale=1', 'top');
		});
		add_filter('query_vars', function ($vars) {
			$vars[] = 'mcuire_wholesale';
			return $vars;
		});
		add_action('template_redirect', array(__CLASS__, 'render'));
		add_action('rest_api_init', function () {
			register_rest_route('mcuire/v1', '/wholesale', array('methods' => 'POST', 'callback' => array(__CLASS__, 'request'), 'permission_callback' => '__return_true'));
		});
		add_action('admin_menu', function () {
			add_submenu_page('mcuire-cooking-courses', 'Wholesale orders', 'Wholesale orders', 'manage_options', 'mcuire-wholesale-requests', array(__CLASS__, 'admin_page'));
		}, 21);
		// Add "Wholesale Drinks" to the menu and put the menu in order, once.
		add_action('init', function () {
			if (!get_option('mcuire_cc_menu_order_done')) {
				self::menu_order();
			}
		}, 101);
	}

	public static function url() {
		return home_url('/' . self::SLUG . '/');
	}

	public static function photo() {
		return plugins_url('media/zobo.jpg', MCUIRE_CC_DIR . 'mcuire-cooking-courses.php');
	}

	// ---- page ------------------------------------------------------------------
	public static function render() {
		if (!get_query_var('mcuire_wholesale')) {
			return;
		}
		global $wp_query;
		$wp_query->is_404 = false;
		$wp_query->is_page = true;
		status_header(200);
		$title = 'Wholesale Zobo Drinks for Events & Resale · Mcuire African Restaurant';
		$desc = 'Zobo hibiscus drink in 237 mL bottles from Mcuire, in bulk for weddings, parties, offices and caterers, and by the case for shops and restaurants. Request a bulk order quote.';
		add_filter('pre_get_document_title', function () use ($title) {
			return $title;
		}, 99);
		add_action('wp_head', function () use ($title, $desc) {
			echo '<meta name="description" content="' . esc_attr($desc) . '">' . "\n";
			echo '<link rel="canonical" href="' . esc_url(self::url()) . '">' . "\n";
			echo '<meta property="og:type" content="website"><meta property="og:title" content="' . esc_attr($title) . '"><meta property="og:description" content="' . esc_attr($desc) . '"><meta property="og:url" content="' . esc_url(self::url()) . '">';
			echo '<meta property="og:image" content="' . esc_url(self::photo()) . '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' . esc_url(self::photo()) . '">' . "\n";
			$schema = array(
				'@context' => 'https://schema.org',
				'@type' => 'Product',
				'name' => 'Zobo Hibiscus Drink (237 mL)',
				'description' => 'West African hibiscus drink, sold in bulk for events and by the case for resale.',
				'image' => self::photo(),
				'url' => self::url(),
				'category' => 'Beverages',
				'brand' => array('@type' => 'Brand', 'name' => 'Mcuire African Restaurant'),
			);
			echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
			echo '<style>' . Mcuire_CC_Catering::css() . self::css() . '</style>';
		});
		get_header();
		echo self::body();
		get_footer();
		exit;
	}

	private static function body() {
		ob_start();
		?>
<main class="mcu-cat mcu-ws" id="wholesale-drinks">
	<section class="mcu-hero">
		<div class="mcu-wrap mcu-ws-hero">
			<div>
				<p class="mcu-eyebrow">Mcuire African Restaurant</p>
				<h1>Wholesale Drinks</h1>
				<p class="mcu-lede">Our Zobo is a deep-red West African hibiscus drink, bottled in 237 mL glass bottles. Order it in bulk for your event, or by the case to sell in your shop or restaurant.</p>
				<div class="mcu-actions">
					<a class="mcu-btn" href="#bulk-order-quote">Request a bulk order quote</a>
					<a class="mcu-btn mcu-btn-ghost" href="#how-it-works">How it works</a>
				</div>
				<ul class="mcu-proof">
					<li><b>237 mL</b> glass bottles</li>
					<li><b>Hibiscus</b> inspired by West Africa</li>
					<li><b>Pickup or delivery</b> across Niagara and the GTA</li>
				</ul>
			</div>
			<figure class="mcu-ws-bottle"><img src="<?php echo esc_url(self::photo()); ?>" alt="Bottle of Zobo hibiscus drink, 237 mL" width="800" height="1200" fetchpriority="high"></figure>
		</div>
	</section>

	<section class="mcu-wrap mcu-what" id="how-it-works">
		<h2>Two ways to order</h2>
		<div class="mcu-ws-table" role="table" aria-label="Wholesale offers">
			<div class="mcu-ws-row mcu-ws-head" role="row"><span role="columnheader">Offer</span><span role="columnheader">Who it is for</span><span role="columnheader">How it is priced</span></div>
			<div class="mcu-ws-row" role="row">
				<span role="cell"><b>Event bulk orders</b></span>
				<span role="cell">Weddings, parties, offices and caterers</span>
				<span role="cell">A volume price for drinks served at your event. The more bottles, the better the price per bottle.</span>
			</div>
			<div class="mcu-ws-row" role="row">
				<span role="cell"><b>Wholesale cases</b></span>
				<span role="cell">Shops and restaurants reselling the drink</span>
				<span role="cell">A trade price by the case that leaves room for your own margin when you resell.</span>
			</div>
		</div>
		<p class="mcu-note">Every order is quoted, so the price fits your quantity, date and delivery. Send the form below and we will reply by email with a price.</p>
	</section>

	<section class="mcu-wrap mcu-quote" id="bulk-order-quote">
		<div>
			<h2>Request a Bulk Order Quote</h2>
			<p>Tell us how many bottles or cases you need, when and where. We will confirm availability and send you a quote.</p>
			<p class="mcu-small">Planning food as well? See our <a href="<?php echo esc_url(home_url('/event-catering/')); ?>">Event Catering</a>.</p>
		</div>
		<form class="mcu-form" data-wholesale-form novalidate>
			<div class="mcu-row"><label>Your name<input name="name" required autocomplete="name"></label><label>Email<input name="email" type="email" required autocomplete="email"></label></div>
			<div class="mcu-row"><label>Phone<input name="phone" type="tel" autocomplete="tel"></label><label>Business name (optional)<input name="company" autocomplete="organization"></label></div>
			<div class="mcu-row"><label>How many?<input name="quantity" type="number" min="1" inputmode="numeric" required></label><label>Bottles or cases?<select name="unit"><option value="bottles">Bottles</option><option value="cases">Cases</option></select></label></div>
			<div class="mcu-row"><label>Date you need them<input name="date" type="date" required></label><label>Delivery location<input name="location" placeholder="Address or city" autocomplete="street-address"></label></div>
			<fieldset class="mcu-choice"><legend>Pickup or delivery?</legend>
				<label><input type="radio" name="fulfilment" value="pickup" checked> Pickup at Mcuire</label>
				<label><input type="radio" name="fulfilment" value="delivery"> Delivery</label>
			</fieldset>
			<fieldset class="mcu-choice"><legend>Will you serve or resell the drinks?</legend>
				<label><input type="radio" name="use" value="serve" checked> Serve at an event</label>
				<label><input type="radio" name="use" value="resell"> Resell in a shop or restaurant</label>
			</fieldset>
			<label>Anything else?<textarea name="message" rows="3" placeholder="Event type, number of guests, regular weekly order…"></textarea></label>
			<label class="mcu-hp" aria-hidden="true">Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label>
			<button class="mcu-btn" type="submit">Request a quote</button>
			<p class="mcu-status" role="status" aria-live="polite"></p>
		</form>
	</section>
</main>
<script>
(function () {
	var form = document.querySelector('[data-wholesale-form]'), status = form.querySelector('.mcu-status');
	form.addEventListener('submit', function (e) {
		e.preventDefault();
		if (!form.name.value.trim() || !/^\S+@\S+\.\S+$/.test(form.email.value.trim())) { status.textContent = 'Please add your name and a valid email so we can reply.'; return; }
		if (!(+form.quantity.value > 0)) { status.textContent = 'Please tell us how many bottles or cases you need.'; form.quantity.focus(); return; }
		if (!form.date.value) { status.textContent = 'Please choose the date you need the drinks.'; form.date.focus(); return; }
		if (form.fulfilment.value === 'delivery' && !form.location.value.trim()) { status.textContent = 'Please add the delivery location.'; form.location.focus(); return; }
		var btn = form.querySelector('button[type=submit]'); btn.disabled = true; status.textContent = 'Sending…';
		var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
		fetch(<?php echo wp_json_encode(rest_url('mcuire/v1/wholesale')); ?>, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Mcuire': '1' }, body: JSON.stringify(data) })
			.then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
			.then(function (res) {
				if (res.ok) { form.reset(); status.textContent = 'Thank you! Your request has been sent. We will reply by email with a quote soon.'; }
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
.mcu-ws-hero{display:grid;grid-template-columns:1.3fr 1fr;gap:48px;align-items:center}
.mcu-ws-bottle{margin:0;display:flex;justify-content:center}
.mcu-ws-bottle img{width:auto;max-width:100%;max-height:560px;border-radius:12px;box-shadow:0 30px 60px -30px rgba(31,26,23,.5)}
.mcu-ws-table{border:1px solid var(--mcu-line);border-radius:10px;overflow:hidden;background:#fff}
.mcu-ws-row{display:grid;grid-template-columns:1fr 1.2fr 1.6fr;gap:16px;padding:16px 20px;border-top:1px solid var(--mcu-line);transition:background-color .2s}
.mcu-ws-row:first-child{border-top:0}
.mcu-ws-row:not(.mcu-ws-head):hover{background:var(--mcu-paper)}
.mcu-ws-head{background:var(--mcu-ink);color:#fff;font-size:.78rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.mcu-ws-row b{font-family:"Playfair Display",Georgia,serif;font-size:1.15rem}
.mcu-choice{border:0;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px 18px}
.mcu-choice legend{font-weight:600;font-size:.92rem;margin-bottom:6px;padding:0}
.mcu-choice label{display:flex!important;align-items:center;gap:8px;font-weight:400!important;cursor:pointer}
.mcu-choice input{width:auto!important;accent-color:#c43d1a;width:18px!important;height:18px}
@media (max-width:780px){.mcu-ws-hero{grid-template-columns:1fr}.mcu-ws-bottle{order:-1}.mcu-ws-bottle img{max-height:380px}.mcu-ws-row{grid-template-columns:1fr;gap:4px}.mcu-ws-head{display:none}}
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
		$ip_key = 'mcuire_ws_' . md5((string) ($_SERVER['REMOTE_ADDR'] ?? ''));
		$n = (int) get_transient($ip_key);
		if ($n >= 5) {
			return new WP_REST_Response(array('error' => 'You have sent several requests already. Please wait an hour or contact us directly.'), 429);
		}
		$email = sanitize_email($d['email'] ?? '');
		$name = sanitize_text_field($d['name'] ?? '');
		if (!$name || !is_email($email)) {
			return new WP_REST_Response(array('error' => 'Please add your name and a valid email so we can reply.'), 400);
		}
		$qty = max(0, (int) ($d['quantity'] ?? 0));
		$date = sanitize_text_field($d['date'] ?? '');
		if (!$qty) {
			return new WP_REST_Response(array('error' => 'Please tell us how many bottles or cases you need.'), 400);
		}
		if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
			return new WP_REST_Response(array('error' => 'Please choose the date you need the drinks.'), 400);
		}
		$fulfilment = ($d['fulfilment'] ?? '') === 'delivery' ? 'delivery' : 'pickup';
		$location = sanitize_text_field($d['location'] ?? '');
		if ($fulfilment === 'delivery' && !$location) {
			return new WP_REST_Response(array('error' => 'Please add the delivery location.'), 400);
		}
		$r = array(
			'id' => 'ws_' . bin2hex(random_bytes(5)), 'createdAt' => gmdate('c'), 'name' => $name, 'email' => $email,
			'phone' => sanitize_text_field($d['phone'] ?? ''), 'company' => sanitize_text_field($d['company'] ?? ''),
			'quantity' => $qty, 'unit' => ($d['unit'] ?? '') === 'cases' ? 'cases' : 'bottles', 'date' => $date,
			'location' => $location, 'fulfilment' => $fulfilment, 'use' => ($d['use'] ?? '') === 'resell' ? 'resell' : 'serve',
			'message' => sanitize_textarea_field($d['message'] ?? ''),
		);
		$all = get_option(self::REQUESTS, array());
		array_unshift($all, $r);
		update_option(self::REQUESTS, array_slice($all, 0, 500), false);
		set_transient($ip_key, $n + 1, HOUR_IN_SECONDS);

		$what = $r['quantity'] . ' ' . $r['unit'];
		$use = $r['use'] === 'resell' ? 'Resell (wholesale cases)' : 'Serve at an event (event bulk order)';
		$to = array_filter(array_map('trim', explode(',', (string) get_option('mcuire_cc_admin_emails', get_option('admin_email')))));
		$body = "New bulk drinks request from mcuire.ca/wholesale-drinks/\n\n"
			. "Name: {$r['name']}\nEmail: {$r['email']}\nPhone: {$r['phone']}\nBusiness: {$r['company']}\n\n"
			. "Quantity: $what\nNeeded by: {$r['date']}\n" . ucfirst($r['fulfilment']) . ($r['location'] ? " · {$r['location']}" : '') . "\nUse: $use\n\n{$r['message']}\n";
		wp_mail($to ?: get_option('admin_email'), 'Bulk drinks quote: ' . $what . ' for ' . $r['date'] . ' – ' . $r['name'], $body, array('Reply-To: ' . $r['name'] . ' <' . $r['email'] . '>'));
		wp_mail($r['email'], 'We received your bulk order request – Mcuire African Restaurant', "Hi {$r['name']},\n\nThank you for your interest in our Zobo. We have your request for $what by {$r['date']} and will reply by email soon with a quote.\n\nMcuire African Restaurant\n" . home_url('/'));
		return new WP_REST_Response(array('ok' => true), 200);
	}

	public static function admin_page() {
		if (!current_user_can('manage_options')) {
			return;
		}
		$all = get_option(self::REQUESTS, array());
		echo '<div class="wrap"><h1>Wholesale orders</h1><p>Bulk order quote requests sent from <a href="' . esc_url(self::url()) . '" target="_blank">' . esc_html(self::url()) . '</a>. Each one is also emailed to the owner emails in Cooking Courses settings.</p>';
		if (!$all) {
			echo '<p>No requests yet.</p></div>';
			return;
		}
		echo '<table class="widefat striped"><thead><tr><th>Received</th><th>Name</th><th>Contact</th><th>Quantity</th><th>Needed by</th><th>Pickup / delivery</th><th>Serve / resell</th><th>Message</th></tr></thead><tbody>';
		foreach ($all as $r) {
			echo '<tr><td>' . esc_html(wp_date('M j, Y g:i a', strtotime($r['createdAt']))) . '</td><td>' . esc_html($r['name']) . ($r['company'] ? '<br><small>' . esc_html($r['company']) . '</small>' : '') . '</td><td><a href="mailto:' . esc_attr($r['email']) . '">' . esc_html($r['email']) . '</a><br>' . esc_html($r['phone']) . '</td><td>' . (int) $r['quantity'] . ' ' . esc_html($r['unit']) . '</td><td>' . esc_html($r['date']) . '</td><td>' . esc_html(ucfirst($r['fulfilment'])) . ($r['location'] ? '<br>' . esc_html($r['location']) : '') . '</td><td>' . esc_html($r['use'] === 'resell' ? 'Resell' : 'Serve') . '</td><td>' . nl2br(esc_html($r['message'])) . '</td></tr>';
		}
		echo '</tbody></table></div>';
	}

	// ---- site menu ---------------------------------------------------------------
	// The owner's chosen order. Each entry: label words or address to recognise it.
	private static function wanted() {
		return array(
			array('label' => 'home', 'url' => untrailingslashit(home_url('/'))),
			array('label' => 'cooking courses', 'url' => '/cooking-courses'),
			array('label' => 'event catering', 'url' => '/event-catering'),
			array('label' => 'weekday menu', 'url' => ''),
			array('label' => 'weekend menu', 'url' => '/weekend-menu'),
			array('label' => 'wholesale drinks', 'url' => '/' . self::SLUG),
		);
	}

	private static function rank($label, $url) {
		$label = strtolower(trim(wp_strip_all_tags((string) $label)));
		$url = untrailingslashit((string) $url);
		$wanted = self::wanted();
		foreach ($wanted as $i => $w) { // by name first
			if ($label === $w['label']) {
				return $i;
			}
		}
		foreach ($wanted as $i => $w) { // then by address
			if ($i === 0 ? ($url === $w['url'] && $label === '') : ($w['url'] && strpos($url, $w['url']) !== false)) {
				return $i;
			}
		}
		return 100; // anything else (About, Contact, …) keeps its place after these
	}

	// Add "Wholesale Drinks" and order the menu: Home, Cooking Courses, Event
	// Catering, Weekday Menu, Weekend Menu, Wholesale Drinks, then the rest.
	// Runs once; the previous menu is kept in an option so it can be restored.
	public static function menu_order() {
		$url = self::url();
		$done = false;
		$backup = array();

		// Block themes (mcuire.ca): navigation stored as wp_navigation posts.
		foreach (get_posts(array('post_type' => 'wp_navigation', 'post_status' => 'publish', 'numberposts' => 10)) as $nav) {
			$content = $nav->post_content;
			if (strpos($content, '/' . MCUIRE_CC_SLUG) === false && strpos($content, '/' . Mcuire_CC_Catering::SLUG) === false) {
				continue; // not the menu we added our links to
			}
			$backup['nav_' . $nav->ID] = $content;
			if (strpos($content, '/' . self::SLUG) === false) {
				$content .= "\n" . sprintf('<!-- wp:navigation-link {"label":"Wholesale Drinks","url":"%s","kind":"custom","isTopLevelLink":true} /-->', esc_url($url));
			}
			$blocks = array_values(array_filter(parse_blocks($content), function ($b) {
				return !empty($b['blockName']);
			}));
			$keyed = array();
			foreach ($blocks as $i => $b) {
				$keyed[] = array(self::rank($b['attrs']['label'] ?? '', $b['attrs']['url'] ?? ''), $i, $b);
			}
			usort($keyed, function ($a, $b) {
				return $a[0] === $b[0] ? $a[1] - $b[1] : $a[0] - $b[0];
			});
			$out = implode("\n", array_map(function ($k) {
				return serialize_block($k[2]);
			}, $keyed));
			wp_update_post(array('ID' => $nav->ID, 'post_content' => $out));
			$done = true;
		}

		// Classic themes: menus assigned to a theme location.
		foreach (array_unique(array_filter(array_values((array) get_nav_menu_locations()))) as $menu_id) {
			$items = wp_get_nav_menu_items($menu_id) ?: array();
			$has = false;
			foreach ($items as $item) {
				$has = $has || untrailingslashit($item->url) === untrailingslashit($url);
			}
			if (!$has) {
				wp_update_nav_menu_item($menu_id, 0, array('menu-item-title' => 'Wholesale Drinks', 'menu-item-url' => $url, 'menu-item-status' => 'publish', 'menu-item-type' => 'custom'));
				$items = wp_get_nav_menu_items($menu_id) ?: array();
			}
			$top = array_values(array_filter($items, function ($it) {
				return !$it->menu_item_parent;
			}));
			$backup['menu_' . $menu_id] = array_map(function ($it) {
				return array($it->ID, $it->menu_order);
			}, $items);
			$keyed = array();
			foreach ($top as $i => $it) {
				$keyed[] = array(self::rank($it->title, $it->url), $i, $it);
			}
			usort($keyed, function ($a, $b) {
				return $a[0] === $b[0] ? $a[1] - $b[1] : $a[0] - $b[0];
			});
			$pos = 1;
			foreach ($keyed as $k) {
				wp_update_post(array('ID' => $k[2]->ID, 'menu_order' => $pos++));
				foreach ($items as $child) { // children stay right after their parent
					if ((int) $child->menu_item_parent === (int) $k[2]->ID) {
						wp_update_post(array('ID' => $child->ID, 'menu_order' => $pos++));
					}
				}
			}
			$done = true;
		}
		update_option('mcuire_cc_menu_backup', $backup, false);
		update_option('mcuire_cc_menu_order_done', $done ? 'yes' : 'manual');
	}
}

Mcuire_CC_Wholesale::init();
