<?php
/**
 * REST API for the academy: /wp-json/mcuire/v1/api/...
 * Mirrors the standalone server (server/server.mjs) endpoint for endpoint,
 * so the same front end works with either.
 */

if (!defined('ABSPATH')) {
	exit;
}

class Mcuire_CC_Http_Error extends Exception {
	public $status;
	public function __construct($status, $message) {
		parent::__construct($message);
		$this->status = $status;
	}
}

class Mcuire_CC_API {

	const SESSION_DAYS = 30;
	const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

	public static function init() {
		add_action('rest_api_init', function () {
			register_rest_route('mcuire/v1', '/api/(?P<path>.+)', array(
				'methods' => array('GET', 'POST', 'PUT', 'DELETE'),
				'callback' => array(__CLASS__, 'dispatch'),
				'permission_callback' => '__return_true', // access is checked per endpoint below
			));
		});
	}

	// ---- small helpers ------------------------------------------------------
	private static function t($n) { return Mcuire_CC_DB::t($n); }
	private static function now() { return Mcuire_CC_DB::now(); }
	private static function fail($status, $msg) { throw new Mcuire_CC_Http_Error($status, $msg); }
	private static function json($data, $status = 200) {
		$res = new WP_REST_Response($data, $status);
		$res->header('Cache-Control', 'no-store');
		return $res;
	}
	private static function token() { return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '='); }
	private static function hash($t) { return hash('sha256', $t); }
	private static function app_url($hash = '') { return home_url('/' . MCUIRE_CC_SLUG . '/') . $hash; }
	private static function email_list($option) {
		return array_filter(array_map('strtolower', array_map('trim', explode(',', (string) get_option($option, '')))));
	}

	public static function stripe_accounts() {
		$accounts = get_option('mcuire_cc_stripe_accounts', array());
		return is_array($accounts) ? array_filter($accounts, function ($a) { return !empty($a['secret']); }) : array();
	}
	private static function stripe_account($name) {
		$all = self::stripe_accounts();
		if ($name && isset($all[$name])) {
			return $all[$name];
		}
		return $all['default'] ?? (reset($all) ?: null);
	}

	// ---- users & sessions ---------------------------------------------------
	private static function role_for($email) {
		$e = strtolower($email);
		if (in_array($e, self::email_list('mcuire_cc_admin_emails'), true)) {
			return 'admin';
		}
		if (in_array($e, self::email_list('mcuire_cc_staff_emails'), true)) {
			return 'staff';
		}
		return null;
	}

	private static function upsert_user($email, $role_override = null) {
		global $wpdb;
		$e = strtolower(trim($email));
		$user = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . self::t('users') . ' WHERE email = %s', $e));
		$role = $role_override ?: self::role_for($e);
		if (!$user) {
			$wpdb->insert(self::t('users'), array('email' => $e, 'name' => '', 'role' => $role ?: 'customer', 'created_at' => self::now()));
			$user = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . self::t('users') . ' WHERE email = %s', $e));
		} elseif ($role && $user->role !== $role) {
			$wpdb->update(self::t('users'), array('role' => $role), array('id' => $user->id));
			$user->role = $role;
		}
		return $user;
	}

	private static function create_session($user_id) {
		global $wpdb;
		$t = self::token();
		$wpdb->insert(self::t('sessions'), array('token_hash' => self::hash($t), 'user_id' => $user_id, 'expires_at' => gmdate('Y-m-d\TH:i:s.v\Z', time() + self::SESSION_DAYS * 86400)));
		return $t;
	}

	private static function bearer(WP_REST_Request $req) {
		if (preg_match('/^Bearer\s+(\S+)$/i', (string) $req->get_header('authorization'), $m)) {
			return $m[1];
		}
		return null;
	}

	private static function current_user(WP_REST_Request $req) {
		global $wpdb;
		$t = self::bearer($req);
		if ($t) {
			$u = $wpdb->get_row($wpdb->prepare('SELECT u.* FROM ' . self::t('sessions') . ' s JOIN ' . self::t('users') . ' u ON u.id = s.user_id WHERE s.token_hash = %s AND s.expires_at > %s', self::hash($t), self::now()));
			if ($u) {
				return $u;
			}
		}
		// Signed into WordPress as an administrator? Then you're an academy admin.
		if (is_user_logged_in() && current_user_can('manage_options')) {
			$wp_user = wp_get_current_user();
			return self::upsert_user($wp_user->user_email, 'admin');
		}
		return null;
	}

	private static function require_role($user, $roles) {
		if (!$user) {
			self::fail(401, 'Please sign in');
		}
		if (!in_array($user->role, (array) $roles, true)) {
			self::fail(403, 'Not allowed');
		}
	}

	private static function send_magic_link($user, $subject = null, $intro = '') {
		global $wpdb;
		$t = self::token();
		$wpdb->insert(self::t('magic_links'), array('token_hash' => self::hash($t), 'user_id' => $user->id, 'expires_at' => gmdate('Y-m-d\TH:i:s.v\Z', time() + 15 * 60)));
		$link = add_query_arg('token', $t, rest_url('mcuire/v1/api/auth/verify'));
		$site = wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES);
		wp_mail(
			$user->email,
			$subject ?: "Your {$site} cooking courses sign-in link",
			($intro ? $intro . "\n\n" : '') . "Tap to open My Kitchen (link valid for 15 minutes):\n{$link}\n\n{$site}"
		);
	}

	// ---- content gating -----------------------------------------------------
	private static function owns_recipe($user_id, $recipe_id) {
		global $wpdb;
		if (!$user_id) {
			return false;
		}
		return (bool) $wpdb->get_var($wpdb->prepare('SELECT 1 FROM ' . self::t('enrollments') . ' e JOIN ' . self::t('course_recipes') . ' cr ON cr.course_id = e.course_id WHERE e.user_id = %d AND cr.recipe_id = %s LIMIT 1', $user_id, $recipe_id));
	}

	// Paid steps never leave the server for people who haven't bought the course.
	private static function gate_recipe($recipe, $user) {
		if ($recipe['status'] !== 'complete' || ($user && in_array($user->role, array('admin', 'staff'), true)) || self::owns_recipe($user ? $user->id : 0, $recipe['id'])) {
			return $recipe;
		}
		$free = (int) ($recipe['previewSteps'] ?? 0);
		$recipe['locked'] = true;
		foreach ($recipe['steps'] as $i => $s) {
			if ($i >= $free) {
				$recipe['steps'][$i] = array('id' => $s['id'], 'title' => $s['title'], 'phase' => $s['phase'] ?? 'cook', 'timer' => $s['timer'] ?? null, 'locked' => true);
			}
		}
		return $recipe;
	}

	// ---- commerce -----------------------------------------------------------
	private static function certificate_number() {
		$body = '';
		foreach (str_split(random_bytes(6)) as $b) {
			$body .= self::ALPHABET[ord($b) % 32];
		}
		$sum = 0;
		foreach (str_split($body) as $i => $ch) {
			$sum += (strpos(self::ALPHABET, $ch) + 1) * ($i + 1);
		}
		return 'MCU-' . gmdate('Y') . '-' . $body . '-' . self::ALPHABET[$sum % 31];
	}

	private static function price_for($course, $code) {
		global $wpdb;
		$d = $code ? $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . self::t('discounts') . ' WHERE code = %s AND active = 1', strtoupper($code))) : null;
		$valid = $d && (!$d->expires_at || $d->expires_at > self::now()) && ($d->max_redemptions === null || (int) $d->redemptions < (int) $d->max_redemptions);
		$off = $valid ? (int) round($course['priceCents'] * $d->percent_off / 100) : 0;
		return array('total' => $course['priceCents'] - $off, 'code' => $valid ? $d->code : null);
	}

	// Idempotent: safe from both the webhook and the success page.
	private static function fulfill($session_id, $email, $payment_intent) {
		global $wpdb;
		$order = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . self::t('orders') . ' WHERE stripe_session_id = %s', $session_id));
		if (!$order) {
			self::fail(404, 'Unknown checkout session');
		}
		$user = self::upsert_user($email ?: $order->email);
		$first = $order->status !== 'paid';
		if ($first) {
			$wpdb->update(self::t('orders'), array('status' => 'paid', 'user_id' => $user->id, 'email' => $user->email, 'payment_intent' => $payment_intent, 'paid_at' => self::now()), array('id' => $order->id));
			if ($order->discount_code) {
				$wpdb->query($wpdb->prepare('UPDATE ' . self::t('discounts') . ' SET redemptions = redemptions + 1 WHERE code = %s', $order->discount_code));
			}
			$course = Mcuire_CC_DB::get_course($order->course_id);
			$grant = $course['kind'] === 'flagship' ? wp_list_pluck(Mcuire_CC_DB::all_courses(), 'id') : array($course['id']);
			foreach ($grant as $cid) {
				$wpdb->query($wpdb->prepare('INSERT IGNORE INTO ' . self::t('enrollments') . ' (user_id, course_id, order_id, granted_at) VALUES (%d, %s, %s, %s)', $user->id, $cid, $order->id, self::now()));
			}
			self::send_magic_link($user, 'Your cooking course is unlocked', sprintf('Thank you! %s is unlocked and waiting in My Kitchen.', $course['title']));
		}
		return $user;
	}

	private static function stripe($account, $method, $path, $form = null) {
		$base = defined('MCUIRE_CC_STRIPE_API') ? MCUIRE_CC_STRIPE_API : 'https://api.stripe.com';
		$res = wp_remote_request($base . '/v1/' . $path, array(
			'method' => $method,
			'timeout' => 30,
			'headers' => array('Authorization' => 'Bearer ' . $account['secret'], 'Content-Type' => 'application/x-www-form-urlencoded'),
			'body' => $form ? http_build_query($form) : null,
		));
		if (is_wp_error($res)) {
			self::fail(502, 'Could not reach the payment provider. Please try again.');
		}
		$body = json_decode(wp_remote_retrieve_body($res), true);
		if (wp_remote_retrieve_response_code($res) >= 400) {
			self::fail(502, $body['error']['message'] ?? 'Payment provider error');
		}
		return $body;
	}

	private static function verify_signature($raw, $header, $secret) {
		if (!$secret || !$header) {
			return false;
		}
		$t = 0;
		$sigs = array();
		foreach (explode(',', $header) as $part) {
			$kv = explode('=', $part, 2);
			if (count($kv) !== 2) {
				continue;
			}
			if ($kv[0] === 't') {
				$t = (int) $kv[1];
			} elseif ($kv[0] === 'v1') {
				$sigs[] = $kv[1];
			}
		}
		if (!$t || abs(time() - $t) > 300) {
			return false;
		}
		$expected = hash_hmac('sha256', $t . '.' . $raw, $secret);
		foreach ($sigs as $s) {
			if (hash_equals($expected, $s)) {
				return true;
			}
		}
		return false;
	}

	private static function me($user) {
		global $wpdb;
		if (!$user) {
			return array('account' => null);
		}
		$state = json_decode((string) $wpdb->get_var($wpdb->prepare('SELECT doc FROM ' . self::t('kitchen_state') . ' WHERE user_id = %d', $user->id)), true) ?: array();
		return array_merge($state, array(
			'account' => array('email' => $user->email, 'name' => $user->name, 'role' => $user->role, 'createdAt' => $user->created_at),
			'enrollments' => $wpdb->get_results($wpdb->prepare('SELECT course_id AS courseId, order_id AS orderId, granted_at AS grantedAt FROM ' . self::t('enrollments') . ' WHERE user_id = %d', $user->id)),
			'orders' => array_map(function ($o) { $o->amountCents = (int) $o->amountCents; return $o; }, $wpdb->get_results($wpdb->prepare("SELECT id, course_id AS courseId, email, amount_cents AS amountCents, currency, discount_code AS discountCode, status, created_at AS createdAt FROM " . self::t('orders') . " WHERE user_id = %d AND status != 'pending'", $user->id))),
			'certificates' => $wpdb->get_results($wpdb->prepare('SELECT number, course_id AS courseId, name, issued_at AS issuedAt FROM ' . self::t('certificates') . ' WHERE user_id = %d AND revoked_at IS NULL', $user->id)),
		));
	}

	private static function discounts_list($all) {
		global $wpdb;
		$rows = $wpdb->get_results('SELECT code, percent_off, active, note FROM ' . self::t('discounts') . ($all ? '' : ' WHERE active = 1'));
		return array_map(function ($d) { return array('code' => $d->code, 'percentOff' => (int) $d->percent_off, 'active' => (bool) $d->active, 'note' => $d->note); }, $rows);
	}

	// ---- router -------------------------------------------------------------
	public static function dispatch(WP_REST_Request $req) {
		try {
			return self::route($req);
		} catch (Mcuire_CC_Http_Error $e) {
			return self::json(array('error' => $e->getMessage()), $e->status);
		} catch (Throwable $e) {
			error_log('[mcuire-cooking-courses] ' . $e->getMessage());
			return self::json(array('error' => 'Something went wrong'), 500);
		}
	}

	private static function route(WP_REST_Request $req) {
		global $wpdb;
		$p = '/' . trim($req['path'], '/');
		$method = $req->get_method();
		$user = self::current_user($req);
		$body = function () use ($req) {
			$data = json_decode($req->get_body(), true);
			if (!is_array($data)) {
				self::fail(400, 'Invalid JSON');
			}
			return $data;
		};
		$is = function ($m, $pattern, &$match = null) use ($method, $p) {
			return $method === $m && preg_match($pattern, $p, $match);
		};

		// Cheap CSRF guard for anything that changes data (Stripe webhooks excepted).
		if ($method !== 'GET' && strpos($p, '/stripe/webhook') !== 0 && $req->get_header('x_mcuire') !== '1') {
			self::fail(403, 'Missing request header');
		}

		// ---- public content
		if ($is('GET', '#^/catalog$#')) {
			$recipes = array_map(function ($row) use ($user) { return self::gate_recipe(json_decode($row, true), $user); }, $wpdb->get_col('SELECT doc FROM ' . self::t('recipes')));
			$staff = $user && in_array($user->role, array('admin', 'staff'), true);
			$courses = array_values(array_filter(Mcuire_CC_DB::all_courses(), function ($c) use ($staff) { return $c['status'] !== 'hidden' || $staff; }));
			return self::json(array(
				'version' => 1,
				'categories' => array_map('json_decode', $wpdb->get_col('SELECT doc FROM ' . self::t('categories') . ' ORDER BY sort')),
				'courses' => $courses,
				'recipes' => $recipes,
				'discounts' => self::discounts_list($user && $user->role === 'admin'),
				'achievements' => Mcuire_CC_DB::get_meta('achievements'),
				'challenges' => Mcuire_CC_DB::get_meta('challenges'),
				'freeLesson' => Mcuire_CC_DB::get_meta('freeLesson'),
			));
		}
		if ($is('GET', '#^/recipes/([\w-]+)$#', $m)) {
			$recipe = Mcuire_CC_DB::get_recipe($m[1]);
			if (!$recipe) {
				self::fail(404, 'Recipe not found');
			}
			return self::json(self::gate_recipe($recipe, $user));
		}
		if ($is('GET', '#^/certificates/([\w-]+)$#', $m)) {
			$c = $wpdb->get_row($wpdb->prepare('SELECT number, name, course_id AS courseId, issued_at AS issuedAt FROM ' . self::t('certificates') . ' WHERE number = %s AND revoked_at IS NULL', strtoupper($m[1])));
			return $c ? self::json($c) : self::json(array('error' => 'Not found'), 404);
		}

		// ---- sign-in
		if ($is('POST', '#^/auth/magic-link$#')) {
			$email = sanitize_email($body()['email'] ?? '');
			if (!is_email($email)) {
				self::fail(400, 'Please enter a valid email');
			}
			$existing = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . self::t('users') . ' WHERE email = %s', strtolower($email)));
			$u = $existing ?: (self::role_for($email) ? self::upsert_user($email) : null);
			if ($u) {
				self::send_magic_link($u);
			}
			return self::json(null, 204); // same answer either way: no account fishing
		}
		if ($is('GET', '#^/auth/verify$#')) {
			$link = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . self::t('magic_links') . ' WHERE token_hash = %s', self::hash((string) $req['token'])));
			if (!$link || $link->used_at || $link->expires_at < self::now()) {
				wp_redirect(self::app_url('#/kitchen?signin=expired'));
				exit;
			}
			$wpdb->update(self::t('magic_links'), array('used_at' => self::now()), array('token_hash' => $link->token_hash));
			$u = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . self::t('users') . ' WHERE id = %d', $link->user_id));
			self::upsert_user($u->email); // refresh admin/staff role from settings
			wp_redirect(self::app_url('#/kitchen?session=' . rawurlencode(self::create_session($u->id))));
			exit;
		}
		if ($is('POST', '#^/auth/logout$#')) {
			$t = self::bearer($req);
			if ($t) {
				$wpdb->delete(self::t('sessions'), array('token_hash' => self::hash($t)));
			}
			return self::json(null, 204);
		}

		// ---- checkout
		if ($is('POST', '#^/checkout/session$#')) {
			$data = $body();
			$course = Mcuire_CC_DB::get_course((string) ($data['courseId'] ?? ''));
			if (!$course || $course['status'] !== 'published') {
				self::fail(404, 'Course not available');
			}
			$email = sanitize_email($data['email'] ?? '');
			if ($email && !is_email($email)) {
				self::fail(400, 'Please enter a valid email');
			}
			$price = self::price_for($course, $data['discountCode'] ?? ''); // price always from the database
			$order_id = 'ord_' . bin2hex(random_bytes(8));
			$resume = preg_match('/^[a-z0-9-]{1,80}$/', (string) ($data['resume'] ?? '')) ? '&resume=' . $data['resume'] : '';
			$success = self::app_url('#/welcome/' . $course['slug'] . '?session_id={CHECKOUT_SESSION_ID}' . $resume);
			$accounts = self::stripe_accounts();

			if (!$accounts) {
				if (get_option('mcuire_cc_test_purchases') !== '1') {
					self::fail(503, 'Online payments are being set up. Please check back soon.');
				}
				// Free test purchases: switched on by the owner in Settings while testing.
				$sid = 'cs_dev_' . bin2hex(random_bytes(8));
				$wpdb->insert(self::t('orders'), array('id' => $order_id, 'email' => strtolower($email ?: 'test@example.com'), 'course_id' => $course['id'], 'amount_cents' => $price['total'], 'currency' => $course['currency'], 'discount_code' => $price['code'], 'stripe_session_id' => $sid, 'stripe_account' => 'test', 'status' => 'pending', 'created_at' => self::now()));
				return self::json(array('url' => str_replace('{CHECKOUT_SESSION_ID}', $sid, $success), 'simulated' => true));
			}
			$account_name = isset($accounts[$course['stripeAccount'] ?? '']) ? $course['stripeAccount'] : (isset($accounts['default']) ? 'default' : array_key_first($accounts));
			$form = array(
				'mode' => 'payment',
				'line_items[0][quantity]' => '1',
				'line_items[0][price_data][currency]' => strtolower($course['currency']),
				'line_items[0][price_data][unit_amount]' => (string) $price['total'],
				'line_items[0][price_data][product_data][name]' => $course['title'] . ($course['kind'] === 'flagship' ? ': ' . $course['subtitle'] : ''),
				'line_items[0][price_data][product_data][description]' => wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES) . ' online cooking course. Lifetime access.',
				'customer_creation' => 'if_required',
				'success_url' => $success,
				'cancel_url' => self::app_url('#/courses/' . $course['slug']),
				'metadata[course_id]' => $course['id'],
				'metadata[order_id]' => $order_id,
			);
			if ($email) {
				$form['customer_email'] = $email;
			}
			if ($price['code']) {
				$form['metadata[discount_code]'] = $price['code'];
			}
			$session = self::stripe($accounts[$account_name], 'POST', 'checkout/sessions', $form);
			$wpdb->insert(self::t('orders'), array('id' => $order_id, 'email' => strtolower($email), 'course_id' => $course['id'], 'amount_cents' => $price['total'], 'currency' => $course['currency'], 'discount_code' => $price['code'], 'stripe_session_id' => $session['id'], 'stripe_account' => $account_name, 'status' => 'pending', 'created_at' => self::now()));
			return self::json(array('url' => $session['url']));
		}

		// Success page: confirm with Stripe, unlock, sign the buyer in on this device.
		if ($is('GET', '#^/checkout/confirm$#')) {
			$sid = (string) $req['session_id'];
			$order = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . self::t('orders') . ' WHERE stripe_session_id = %s', $sid));
			if (!$order) {
				self::fail(404, 'Unknown session');
			}
			if (time() - strtotime($order->created_at) > 3600) {
				self::fail(410, 'This link has expired. Use the sign-in link we emailed you.');
			}
			$email = $order->email;
			$pi = null;
			if ($order->stripe_account !== 'test') {
				$account = self::stripe_account($order->stripe_account);
				if (!$account) {
					self::fail(400, 'Payments not configured');
				}
				$s = self::stripe($account, 'GET', 'checkout/sessions/' . rawurlencode($sid));
				if (($s['payment_status'] ?? '') !== 'paid') {
					return self::json(array('status' => 'pending'), 202);
				}
				$email = $s['customer_details']['email'] ?? $email;
				$pi = $s['payment_intent'] ?? null;
			}
			$buyer = self::fulfill($sid, $email, $pi);
			return self::json(array('status' => 'paid', 'session' => self::create_session($buyer->id)));
		}

		// One webhook URL per Stripe account: .../stripe/webhook (default) or .../stripe/webhook/<name>.
		if ($is('POST', '#^/stripe/webhook(?:/([a-z0-9_]+))?$#', $m)) {
			$raw = $req->get_body();
			$accounts = self::stripe_accounts();
			$account = $accounts[$m[1] ?? 'default'] ?? null;
			if (!$account || !self::verify_signature($raw, $req->get_header('stripe_signature'), $account['webhook'] ?? '')) {
				self::fail(400, 'Bad signature');
			}
			$event = json_decode($raw, true);
			$obj = $event['data']['object'] ?? array();
			if (($event['type'] ?? '') === 'checkout.session.completed' && ($obj['payment_status'] ?? '') === 'paid') {
				self::fulfill($obj['id'], $obj['customer_details']['email'] ?? ($obj['customer_email'] ?? ''), $obj['payment_intent'] ?? null);
			}
			if (($event['type'] ?? '') === 'charge.refunded' && !empty($obj['refunded'])) {
				$order = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . self::t('orders') . ' WHERE payment_intent = %s', $obj['payment_intent'] ?? ''));
				if ($order) {
					$wpdb->update(self::t('orders'), array('status' => 'refunded'), array('id' => $order->id));
					$wpdb->delete(self::t('enrollments'), array('order_id' => $order->id));
				}
			}
			return self::json(array('received' => true));
		}

		// ---- signed-in customer
		if ($is('GET', '#^/me$#')) {
			return self::json(self::me($user));
		}
		if ($is('PUT', '#^/me/state$#')) {
			self::require_role($user, array('customer', 'staff', 'admin'));
			$data = $body();
			$doc = wp_json_encode(array(
				'progress' => $data['progress'] ?? new stdClass(), 'cookLog' => $data['cookLog'] ?? array(),
				'saved' => $data['saved'] ?? array(), 'recent' => $data['recent'] ?? array(), 'shopping' => $data['shopping'] ?? new stdClass(),
			));
			if (strlen($doc) > 256000) {
				self::fail(413, 'Kitchen state too large');
			}
			$wpdb->replace(self::t('kitchen_state'), array('user_id' => $user->id, 'doc' => $doc, 'updated_at' => self::now()));
			if (isset($data['name']) && is_string($data['name'])) {
				$wpdb->update(self::t('users'), array('name' => mb_substr(sanitize_text_field($data['name']), 0, 80)), array('id' => $user->id));
			}
			return self::json(null, 204);
		}
		if ($is('POST', '#^/me/certificates$#')) {
			self::require_role($user, array('customer', 'staff', 'admin'));
			$data = $body();
			$course = Mcuire_CC_DB::get_course((string) ($data['courseId'] ?? ''));
			if (!$course || !$wpdb->get_var($wpdb->prepare('SELECT 1 FROM ' . self::t('enrollments') . ' WHERE user_id = %d AND course_id = %s', $user->id, $course['id']))) {
				self::fail(403, 'You don’t own this course');
			}
			$existing = $wpdb->get_row($wpdb->prepare('SELECT number, course_id AS courseId, name, issued_at AS issuedAt FROM ' . self::t('certificates') . ' WHERE user_id = %d AND course_id = %s AND revoked_at IS NULL', $user->id, $course['id']));
			if ($existing) {
				return self::json($existing);
			}
			$state = json_decode((string) $wpdb->get_var($wpdb->prepare('SELECT doc FROM ' . self::t('kitchen_state') . ' WHERE user_id = %d', $user->id)), true) ?: array();
			$cooked = array_unique(array_map(function ($l) { return $l['recipeId'] ?? ''; }, $state['cookLog'] ?? array()));
			$required = $course['requiredRecipeIds'] ?? array_merge(...array_map(function ($m) { return $m['recipeIds']; }, $course['modules']));
			$missing = array_diff($required, $cooked);
			if ($missing) {
				self::fail(400, sprintf('Cook %d more dishes to earn this certificate', count($missing)));
			}
			$name = mb_substr(trim(sanitize_text_field($data['name'] ?? $user->name)), 0, 40);
			if (!$name) {
				self::fail(400, 'Name required');
			}
			$cert = array('number' => self::certificate_number(), 'courseId' => $course['id'], 'name' => $name, 'issuedAt' => self::now());
			$wpdb->insert(self::t('certificates'), array('number' => $cert['number'], 'user_id' => $user->id, 'course_id' => $course['id'], 'name' => $name, 'issued_at' => $cert['issuedAt']));
			return self::json($cert, 201);
		}

		// ---- staff & admin
		if ($is('PUT', '#^/admin/recipes/([\w-]+)$#', $m)) {
			self::require_role($user, array('staff', 'admin'));
			$r = $body();
			if (($r['id'] ?? '') !== $m[1] || empty($r['title']) || !preg_match('/^[a-z0-9-]+$/', $r['slug'] ?? '')) {
				self::fail(400, 'Recipe needs a title and a valid web address');
			}
			if (!is_array($r['steps'] ?? null) || !is_array($r['ingredients'] ?? null)) {
				self::fail(400, 'Malformed recipe');
			}
			if ($wpdb->get_var($wpdb->prepare('SELECT id FROM ' . self::t('recipes') . ' WHERE slug = %s AND id != %s', $r['slug'], $r['id']))) {
				self::fail(409, 'Another recipe uses that web address');
			}
			Mcuire_CC_DB::save_recipe($r, $user->id);
			return self::json(array('ok' => true));
		}
		if ($is('DELETE', '#^/admin/recipes/([\w-]+)$#', $m)) {
			self::require_role($user, 'admin');
			$wpdb->delete(self::t('recipes'), array('id' => $m[1]));
			foreach (Mcuire_CC_DB::all_courses() as $c) {
				foreach ($c['modules'] as $i => $mod) {
					$c['modules'][$i]['recipeIds'] = array_values(array_diff($mod['recipeIds'], array($m[1])));
				}
				Mcuire_CC_DB::save_course($c);
			}
			return self::json(null, 204);
		}
		if ($is('PUT', '#^/admin/courses/([\w-]+)$#', $m)) {
			self::require_role($user, 'admin'); // prices are admin-only
			$c = $body();
			if (($c['id'] ?? '') !== $m[1] || !Mcuire_CC_DB::get_course($m[1])) {
				self::fail(404, 'Course not found');
			}
			if (!is_int($c['priceCents'] ?? null) || $c['priceCents'] < 0) {
				self::fail(400, 'Invalid price');
			}
			if (!in_array($c['currency'] ?? 'CAD', array('CAD', 'USD'), true)) {
				self::fail(400, 'Unsupported currency');
			}
			$accounts = self::stripe_accounts();
			if (!empty($c['stripeAccount']) && $accounts && !isset($accounts[$c['stripeAccount']])) {
				self::fail(400, 'Unknown Stripe account');
			}
			Mcuire_CC_DB::save_course($c);
			return self::json(array('ok' => true));
		}
		if ($is('PUT', '#^/admin/discounts$#')) {
			self::require_role($user, 'admin');
			$list = $body();
			$wpdb->query('DELETE FROM ' . self::t('discounts'));
			foreach ($list as $d) {
				$wpdb->replace(self::t('discounts'), array('code' => strtoupper(sanitize_text_field($d['code'])), 'percent_off' => max(1, min(100, (int) $d['percentOff'])), 'active' => !empty($d['active']) ? 1 : 0, 'note' => sanitize_text_field($d['note'] ?? '')));
			}
			return self::json(array('ok' => true));
		}
		if ($is('PUT', '#^/admin/categories$#')) {
			self::require_role($user, array('staff', 'admin'));
			$list = $body();
			$keep = array();
			foreach ($list as $c) {
				if (!preg_match('/^[a-z0-9-]+$/', $c['id'] ?? '') || empty($c['name'])) {
					self::fail(400, 'Each category needs a name');
				}
				$keep[] = $c['id'];
			}
			$in_use = $wpdb->get_col('SELECT DISTINCT category_id FROM ' . self::t('recipes'));
			foreach ($wpdb->get_col('SELECT id FROM ' . self::t('categories')) as $id) {
				if (!in_array($id, $keep, true)) {
					if (in_array($id, $in_use, true)) {
						self::fail(409, 'Move recipes out of a category before deleting it');
					}
					$wpdb->delete(self::t('categories'), array('id' => $id));
				}
			}
			foreach ($list as $c) {
				$wpdb->replace(self::t('categories'), array('id' => $c['id'], 'sort' => (int) ($c['sort'] ?? 0), 'doc' => wp_json_encode($c)));
			}
			return self::json(array('ok' => true));
		}
		if ($is('PUT', '#^/admin/challenges$#')) {
			self::require_role($user, array('staff', 'admin'));
			Mcuire_CC_DB::set_meta('challenges', $body());
			return self::json(array('ok' => true));
		}
		if ($is('POST', '#^/admin/media$#')) {
			self::require_role($user, array('staff', 'admin'));
			$types = array('image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/avif' => 'avif', 'video/mp4' => 'mp4', 'video/webm' => 'webm');
			$mime = strtolower(trim(explode(';', (string) $req->get_header('content_type'))[0]));
			if (!isset($types[$mime])) {
				self::fail(415, 'Upload a JPG, PNG, WebP, AVIF, MP4 or WebM file');
			}
			$upload = wp_upload_bits('mcuire-' . bin2hex(random_bytes(6)) . '.' . $types[$mime], null, $req->get_body());
			if (!empty($upload['error'])) {
				self::fail(500, $upload['error']);
			}
			// Also add it to the WordPress Media Library.
			$attachment_id = wp_insert_attachment(array('post_mime_type' => $mime, 'post_title' => 'Cooking course media', 'post_status' => 'inherit'), $upload['file']);
			return self::json(array('id' => (string) $attachment_id, 'url' => $upload['url']), 201);
		}
		if ($is('GET', '#^/admin/customers$#')) {
			self::require_role($user, 'admin');
			$rows = $wpdb->get_results('SELECT id, email, name, role, created_at AS createdAt FROM ' . self::t('users') . ' ORDER BY created_at DESC LIMIT 500');
			$out = array();
			foreach ($rows as $u) {
				$st = json_decode((string) $wpdb->get_var($wpdb->prepare('SELECT doc FROM ' . self::t('kitchen_state') . ' WHERE user_id = %d', $u->id)), true) ?: array();
				$courses = array();
				foreach ($wpdb->get_col($wpdb->prepare('SELECT course_id FROM ' . self::t('enrollments') . ' WHERE user_id = %d', $u->id)) as $cid) {
					$c = Mcuire_CC_DB::get_course($cid);
					if ($c) {
						$courses[] = $c['title'];
					}
				}
				$u->courses = $courses;
				$u->cooked = count(array_unique(array_map(function ($l) { return $l['recipeId'] ?? ''; }, $st['cookLog'] ?? array())));
				$out[] = $u;
			}
			return self::json($out);
		}
		if ($is('GET', '#^/admin/stripe-accounts$#')) {
			self::require_role($user, 'admin');
			$out = array();
			foreach (self::stripe_accounts() as $name => $a) {
				$out[] = array('name' => $name, 'webhook' => rest_url('mcuire/v1/api/stripe/webhook' . ($name === 'default' ? '' : '/' . $name)), 'webhookReady' => !empty($a['webhook']), 'live' => strpos($a['secret'], 'sk_live') === 0);
			}
			return self::json($out);
		}
		if ($is('GET', '#^/admin/orders$#')) {
			self::require_role($user, 'admin');
			$rows = $wpdb->get_results('SELECT id, email, course_id AS courseId, amount_cents AS amountCents, currency, discount_code AS discountCode, status, stripe_account AS stripeAccount, created_at AS createdAt FROM ' . self::t('orders') . ' ORDER BY created_at');
			foreach ($rows as $r) {
				$r->amountCents = (int) $r->amountCents;
			}
			return self::json($rows);
		}
		if ($is('GET', '#^/admin/certificates$#')) {
			self::require_role($user, array('staff', 'admin'));
			return self::json($wpdb->get_results('SELECT number, name, course_id AS courseId, issued_at AS issuedAt FROM ' . self::t('certificates') . ' WHERE revoked_at IS NULL ORDER BY issued_at DESC'));
		}

		self::fail(404, 'Not found');
	}
}

Mcuire_CC_API::init();
