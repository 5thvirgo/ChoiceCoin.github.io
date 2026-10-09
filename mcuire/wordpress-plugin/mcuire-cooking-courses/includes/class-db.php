<?php
/**
 * Database tables (prefixed wp_mcu_) and helpers.
 * Content is document-shaped (JSON columns); commerce is relational.
 */

if (!defined('ABSPATH')) {
	exit;
}

class Mcuire_CC_DB {

	public static function t($name) {
		global $wpdb;
		return $wpdb->prefix . 'mcu_' . $name;
	}

	public static function now() {
		return gmdate('Y-m-d\TH:i:s.v\Z');
	}

	public static function install() {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$c = $wpdb->get_charset_collate();
		$tables = array(
			"CREATE TABLE " . self::t('users') . " (
				id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				email varchar(190) NOT NULL,
				name varchar(190) NOT NULL DEFAULT '',
				role varchar(20) NOT NULL DEFAULT 'customer',
				created_at varchar(32) NOT NULL,
				PRIMARY KEY  (id),
				UNIQUE KEY email (email)
			) $c;",
			"CREATE TABLE " . self::t('sessions') . " (
				token_hash char(64) NOT NULL,
				user_id bigint(20) unsigned NOT NULL,
				expires_at varchar(32) NOT NULL,
				PRIMARY KEY  (token_hash),
				KEY user_id (user_id)
			) $c;",
			"CREATE TABLE " . self::t('magic_links') . " (
				token_hash char(64) NOT NULL,
				user_id bigint(20) unsigned NOT NULL,
				expires_at varchar(32) NOT NULL,
				used_at varchar(32) DEFAULT NULL,
				PRIMARY KEY  (token_hash)
			) $c;",
			"CREATE TABLE " . self::t('categories') . " (
				id varchar(64) NOT NULL,
				sort int(11) NOT NULL DEFAULT 0,
				doc longtext NOT NULL,
				PRIMARY KEY  (id)
			) $c;",
			"CREATE TABLE " . self::t('courses') . " (
				id varchar(64) NOT NULL,
				slug varchar(190) NOT NULL,
				kind varchar(20) NOT NULL,
				status varchar(20) NOT NULL DEFAULT 'published',
				price_cents int(11) NOT NULL,
				compare_at_cents int(11) DEFAULT NULL,
				currency varchar(3) NOT NULL DEFAULT 'CAD',
				certificate_title varchar(190) DEFAULT NULL,
				doc longtext NOT NULL,
				updated_at varchar(32) NOT NULL,
				PRIMARY KEY  (id),
				UNIQUE KEY slug (slug)
			) $c;",
			"CREATE TABLE " . self::t('course_recipes') . " (
				course_id varchar(64) NOT NULL,
				recipe_id varchar(64) NOT NULL,
				module_id varchar(64) NOT NULL,
				sort int(11) NOT NULL DEFAULT 0,
				PRIMARY KEY  (course_id,recipe_id),
				KEY recipe_id (recipe_id)
			) $c;",
			"CREATE TABLE " . self::t('recipes') . " (
				id varchar(64) NOT NULL,
				slug varchar(190) NOT NULL,
				status varchar(20) NOT NULL DEFAULT 'outline',
				category_id varchar(64) DEFAULT NULL,
				preview_steps int(11) NOT NULL DEFAULT 0,
				version int(11) NOT NULL DEFAULT 1,
				doc longtext NOT NULL,
				updated_at varchar(32) NOT NULL,
				PRIMARY KEY  (id),
				UNIQUE KEY slug (slug)
			) $c;",
			"CREATE TABLE " . self::t('recipe_revisions') . " (
				id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				recipe_id varchar(64) NOT NULL,
				version int(11) NOT NULL,
				doc longtext NOT NULL,
				edited_by bigint(20) unsigned DEFAULT NULL,
				created_at varchar(32) NOT NULL,
				PRIMARY KEY  (id),
				KEY recipe_id (recipe_id)
			) $c;",
			"CREATE TABLE " . self::t('content_meta') . " (
				meta_key varchar(64) NOT NULL,
				doc longtext NOT NULL,
				PRIMARY KEY  (meta_key)
			) $c;",
			"CREATE TABLE " . self::t('discounts') . " (
				code varchar(64) NOT NULL,
				percent_off int(11) NOT NULL,
				active tinyint(1) NOT NULL DEFAULT 1,
				note varchar(190) NOT NULL DEFAULT '',
				expires_at varchar(32) DEFAULT NULL,
				max_redemptions int(11) DEFAULT NULL,
				redemptions int(11) NOT NULL DEFAULT 0,
				PRIMARY KEY  (code)
			) $c;",
			"CREATE TABLE " . self::t('orders') . " (
				id varchar(40) NOT NULL,
				user_id bigint(20) unsigned DEFAULT NULL,
				email varchar(190) NOT NULL,
				course_id varchar(64) NOT NULL,
				live_class_id varchar(64) DEFAULT NULL,
				amount_cents int(11) NOT NULL,
				currency varchar(3) NOT NULL,
				discount_code varchar(64) DEFAULT NULL,
				stripe_session_id varchar(190) DEFAULT NULL,
				stripe_account varchar(64) DEFAULT NULL,
				payment_intent varchar(190) DEFAULT NULL,
				status varchar(20) NOT NULL,
				created_at varchar(32) NOT NULL,
				paid_at varchar(32) DEFAULT NULL,
				PRIMARY KEY  (id),
				UNIQUE KEY stripe_session_id (stripe_session_id),
				KEY user_id (user_id),
				KEY live_class_id (live_class_id)
			) $c;",
			"CREATE TABLE " . self::t('enrollments') . " (
				user_id bigint(20) unsigned NOT NULL,
				course_id varchar(64) NOT NULL,
				order_id varchar(40) DEFAULT NULL,
				granted_at varchar(32) NOT NULL,
				PRIMARY KEY  (user_id,course_id)
			) $c;",
			"CREATE TABLE " . self::t('kitchen_state') . " (
				user_id bigint(20) unsigned NOT NULL,
				doc longtext NOT NULL,
				updated_at varchar(32) NOT NULL,
				PRIMARY KEY  (user_id)
			) $c;",
			"CREATE TABLE " . self::t('certificates') . " (
				number varchar(32) NOT NULL,
				user_id bigint(20) unsigned NOT NULL,
				course_id varchar(64) NOT NULL,
				name varchar(190) NOT NULL,
				issued_at varchar(32) NOT NULL,
				revoked_at varchar(32) DEFAULT NULL,
				PRIMARY KEY  (number),
				UNIQUE KEY user_course (user_id,course_id)
			) $c;",
		);
		foreach ($tables as $sql) {
			dbDelta($sql);
		}
		self::seed();
		self::add_new_content();
		update_option('mcuire_cc_db_version', MCUIRE_CC_VERSION);
	}

	// Fill an empty database from data/seed.json (the same content as the app).
	private static function seed() {
		global $wpdb;
		if ($wpdb->get_var('SELECT COUNT(*) FROM ' . self::t('courses'))) {
			return;
		}
		$seed = json_decode(file_get_contents(MCUIRE_CC_DIR . 'data/seed.json'), true);
		foreach ($seed['categories'] as $cat) {
			$wpdb->replace(self::t('categories'), array('id' => $cat['id'], 'sort' => (int) $cat['sort'], 'doc' => wp_json_encode($cat)));
		}
		foreach ($seed['recipes'] as $r) {
			self::save_recipe($r, null);
		}
		foreach ($seed['courses'] as $course) {
			self::save_course($course);
		}
		foreach ($seed['discounts'] as $d) {
			$wpdb->replace(self::t('discounts'), array('code' => strtoupper($d['code']), 'percent_off' => (int) $d['percentOff'], 'active' => $d['active'] ? 1 : 0, 'note' => $d['note'] ?? ''));
		}
		foreach (array('achievements', 'challenges', 'freeLesson') as $key) {
			self::set_meta($key, $seed[$key]);
		}
	}

	// On every update: add dishes, courses and live classes that are new in this
	// version, without touching anything the owner has already edited.
	private static function add_new_content() {
		global $wpdb;
		$seed = json_decode(file_get_contents(MCUIRE_CC_DIR . 'data/seed.json'), true);
		foreach ($seed['recipes'] as $r) {
			$existing = self::get_recipe($r['id']);
			if (!$existing && !$wpdb->get_var($wpdb->prepare('SELECT 1 FROM ' . self::t('recipes') . ' WHERE slug = %s', $r['slug']))) {
				self::save_recipe($r, null);
			} elseif ($existing) {
				$merged = self::fill_gaps($existing, $r, $seed['replacedPhotos'] ?? array());
				if ($merged !== $existing) {
					self::save_recipe($merged, null);
				}
			}
		}
		foreach ($seed['courses'] as $course) {
			if (!$wpdb->get_var($wpdb->prepare('SELECT 1 FROM ' . self::t('courses') . ' WHERE id = %s OR slug = %s', $course['id'], $course['slug']))) {
				self::save_course($course);
			}
		}
		// Example live classes start as drafts: the owner sets real dates and links first.
		// Example classes are replaced by the newer examples while they are all still
		// untouched drafts with no bookings; once the owner publishes one, they are kept.
		$current = self::get_meta('liveClasses');
		$untouched = is_array($current) && !array_filter($current, function ($c) { return ($c['status'] ?? '') !== 'draft'; })
			&& !$wpdb->get_var('SELECT 1 FROM ' . self::t('orders') . ' WHERE live_class_id IS NOT NULL LIMIT 1');
		if (self::get_meta('liveBooking') === null && !empty($seed['liveBooking'])) {
			self::set_meta('liveBooking', $seed['liveBooking']);
		}
		if ($current === null || $untouched) {
			self::set_meta('liveClasses', array_map(function ($c) { $c['status'] = 'draft'; return $c; }, $seed['liveClasses'] ?? array()));
		}
	}

	// Bring in new photos and "what it should look like" notes from an update,
	// only where the saved recipe has none (or still has one of our earlier
	// default photos that Mcuire has since replaced), so staff uploads and edits are kept.
	private static function fill_gaps($have, $new, $replaced = array()) {
		$photo = function ($old, $fresh) use ($replaced) {
			if (empty($fresh['src'])) {
				return $old;
			}
			if (empty($old['src'])) {
				return array_merge((array) $old, $fresh);
			}
			return (in_array($old['src'], $replaced, true) && $old['src'] !== $fresh['src']) ? array_merge($old, $fresh) : $old;
		};
		if (isset($new['hero'])) {
			$have['hero'] = $photo($have['hero'] ?? array(), $new['hero']);
		}
		$steps = array();
		foreach ($new['steps'] as $s) {
			$steps[$s['id']] = $s;
		}
		foreach ($have['steps'] as $i => $s) {
			$n = $steps[$s['id'] ?? ''] ?? null;
			if (!$n) {
				continue;
			}
			if (empty($s['cues']) && !empty($n['cues'])) {
				$have['steps'][$i]['cues'] = $n['cues'];
			}
			if (!empty($n['media'][0]['src'])) {
				$have['steps'][$i]['media'][0] = $photo($s['media'][0] ?? array(), $n['media'][0]);
			}
		}
		$ings = array();
		foreach ($new['ingredients'] as $g) {
			$ings[$g['id']] = $g;
		}
		foreach ($have['ingredients'] as $i => $g) {
			$n = $ings[$g['id'] ?? ''] ?? null;
			if ($n && !empty($n['photo']['src'])) {
				$have['ingredients'][$i]['photo'] = $photo($g['photo'] ?? array(), $n['photo']);
			}
		}
		return $have;
	}

	// Photos shipped with the plugin are saved as "media:<file>".
	public static function media_url($src) {
		return (is_string($src) && strpos($src, 'media:') === 0) ? plugins_url('media/' . basename(substr($src, 6)), MCUIRE_CC_DIR . 'mcuire-cooking-courses.php') : $src;
	}

	public static function live_classes() {
		return self::get_meta('liveClasses') ?: array();
	}

	public static function live_class($id) {
		foreach (self::live_classes() as $c) {
			if ($c['id'] === $id) {
				return $c;
			}
		}
		return strpos((string) $id, 'slot-') === 0 ? self::slot_class($id) : null;
	}

	// ---- weekend classes booked by the hour (same rules as assets/js/lib/slots.js) ----
	public static function booking_settings() {
		$defaults = array(
			'enabled' => true, 'title' => 'Hands-on cooking class at Mcuire',
			'description' => 'Book your own hands-on class in the Mcuire kitchen on any Saturday or Sunday.',
			'days' => array(6, 0), 'times' => array('10:00', '12:00', '14:00', '16:00'), 'minHours' => 1, 'maxHours' => 4,
			'latestEnd' => '20:00', 'pricePerHourCents' => 7500, 'perPerson' => true, 'maxPeople' => 10, 'taxRate' => 0.13,
			'taxLabel' => 'HST', 'leadDays' => 2, 'weeksAhead' => 12, 'timeZone' => 'America/Toronto',
			'location' => 'Mcuire African Restaurant', 'currency' => 'CAD',
		);
		return array_merge($defaults, (array) (self::get_meta('liveBooking') ?: array()));
	}

	public static function parse_slot($id) {
		if (!preg_match('/^slot-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})-(\d+)h-(\d+)p$/', (string) $id, $m)) {
			return null;
		}
		return array('date' => "$m[1]-$m[2]-$m[3]", 'time' => "$m[4]:$m[5]", 'hours' => (int) $m[6], 'people' => (int) $m[7]);
	}

	public static function slot_class($id) {
		$slot = self::parse_slot($id);
		if (!$slot) {
			return null;
		}
		$s = self::booking_settings();
		try {
			$start = new DateTime($slot['date'] . ' ' . $slot['time'], new DateTimeZone($s['timeZone']));
		} catch (Exception $e) {
			return null;
		}
		return array(
			'id' => $id, 'slot' => $slot, 'status' => 'published', 'title' => $s['title'], 'description' => $s['description'],
			'startsAt' => $start->format('c'), 'durationMinutes' => $slot['hours'] * 60,
			'priceCents' => (int) $s['pricePerHourCents'] * $slot['hours'] * ($s['perPerson'] ? $slot['people'] : 1),
			'currency' => $s['currency'], 'taxRate' => (float) $s['taxRate'], 'taxLabel' => $s['taxLabel'],
			'capacity' => (int) $s['maxPeople'], 'format' => 'in-person', 'platform' => '', 'joinUrl' => '', 'location' => $s['location'],
			'host' => 'Mcuire kitchen team', 'whatYouNeed' => 'Just yourselves. Aprons, ingredients and equipment are provided.', 'recipeId' => 'party-jollof',
		);
	}

	// People booked per date and hour (paid, or checkout started in the last 30 minutes).
	public static function slot_usage() {
		global $wpdb;
		$recent = gmdate('Y-m-d\TH:i:s.v\Z', time() - 30 * 60);
		$ids = $wpdb->get_col($wpdb->prepare("SELECT live_class_id FROM " . self::t('orders') . " WHERE live_class_id LIKE %s AND (status = 'paid' OR (status = 'pending' AND created_at > %s))", 'slot-%', $recent));
		$usage = array();
		foreach ($ids as $id) {
			$slot = self::parse_slot($id);
			if (!$slot) {
				continue;
			}
			$h0 = (int) substr($slot['time'], 0, 2);
			for ($h = $h0; $h < $h0 + $slot['hours']; $h++) {
				$usage[$slot['date']][$h] = ($usage[$slot['date']][$h] ?? 0) + $slot['people'];
			}
		}
		return $usage;
	}

	// Why this weekend slot can't be booked, or '' if it can.
	public static function slot_problem($slot) {
		$s = self::booking_settings();
		if (empty($s['enabled'])) {
			return 'Weekend classes are not taking bookings right now.';
		}
		$tz = new DateTimeZone($s['timeZone']);
		$day = DateTime::createFromFormat('!Y-m-d', $slot['date'], $tz);
		$today = new DateTime('today', $tz);
		if (!$day) {
			return 'Please choose one of the listed dates.';
		}
		$diff = (int) floor(($day->getTimestamp() - $today->getTimestamp()) / DAY_IN_SECONDS + 0.5);
		if (!in_array((int) $day->format('w'), array_map('intval', $s['days']), true) || $diff < (int) $s['leadDays'] || $diff >= (int) $s['leadDays'] + 7 * (int) $s['weeksAhead']) {
			return 'Please choose one of the listed dates.';
		}
		if (!in_array($slot['time'], $s['times'], true)) {
			return 'Please choose one of the listed start times.';
		}
		if ($slot['hours'] < (int) $s['minHours'] || $slot['hours'] > (int) $s['maxHours']) {
			return 'Classes run ' . (int) $s['minHours'] . ' to ' . (int) $s['maxHours'] . ' hours.';
		}
		list($eh, $em) = array_map('intval', explode(':', $s['latestEnd']));
		list($sh, $sm) = array_map('intval', explode(':', $slot['time']));
		if ($sh * 60 + $sm + $slot['hours'] * 60 > $eh * 60 + $em) {
			return 'Classes must finish by ' . $s['latestEnd'] . '. Choose an earlier time or fewer hours.';
		}
		if ($slot['people'] < 1 || $slot['people'] > (int) $s['maxPeople']) {
			return 'Up to ' . (int) $s['maxPeople'] . ' people per class.';
		}
		$usage = self::slot_usage();
		$used = 0;
		for ($h = $sh; $h < $sh + $slot['hours']; $h++) {
			$used = max($used, $usage[$slot['date']][$h] ?? 0);
		}
		if ((int) $s['maxPeople'] - $used < $slot['people']) {
			return 'Not enough places left at that time. Try another time or date.';
		}
		return '';
	}

	// Paid seats plus checkouts started in the last 30 minutes (so two people
	// can't both pay for the last seat).
	public static function seats_taken($class_id) {
		global $wpdb;
		$recent = gmdate('Y-m-d\TH:i:s.v\Z', time() - 30 * 60);
		return (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM " . self::t('orders') . " WHERE live_class_id = %s AND (status = 'paid' OR (status = 'pending' AND created_at > %s))", $class_id, $recent));
	}

	// ---- content -----------------------------------------------------------
	public static function save_recipe($r, $edited_by) {
		global $wpdb;
		$prev = (int) $wpdb->get_var($wpdb->prepare('SELECT version FROM ' . self::t('recipes') . ' WHERE id = %s', $r['id']));
		$version = $prev + 1;
		$doc = wp_json_encode($r);
		$wpdb->replace(self::t('recipes'), array(
			'id' => $r['id'], 'slug' => $r['slug'], 'status' => $r['status'], 'category_id' => $r['categoryId'] ?? null,
			'preview_steps' => (int) ($r['previewSteps'] ?? 0), 'version' => $version, 'doc' => $doc, 'updated_at' => self::now(),
		));
		$wpdb->insert(self::t('recipe_revisions'), array('recipe_id' => $r['id'], 'version' => $version, 'doc' => $doc, 'edited_by' => $edited_by, 'created_at' => self::now()));
	}

	public static function save_course($c) {
		global $wpdb;
		$doc = $c;
		foreach (array('priceCents', 'compareAtCents', 'currency', 'certificateTitle') as $k) {
			unset($doc[$k]);
		}
		$wpdb->replace(self::t('courses'), array(
			'id' => $c['id'], 'slug' => $c['slug'], 'kind' => $c['kind'], 'status' => $c['status'],
			'price_cents' => (int) $c['priceCents'], 'compare_at_cents' => isset($c['compareAtCents']) ? (int) $c['compareAtCents'] : null,
			'currency' => $c['currency'] ?? 'CAD', 'certificate_title' => $c['certificateTitle'] ?? null,
			'doc' => wp_json_encode($doc), 'updated_at' => self::now(),
		));
		$wpdb->delete(self::t('course_recipes'), array('course_id' => $c['id']));
		foreach ($c['modules'] as $m) {
			foreach (array_values($m['recipeIds']) as $i => $rid) {
				$wpdb->replace(self::t('course_recipes'), array('course_id' => $c['id'], 'recipe_id' => $rid, 'module_id' => $m['id'], 'sort' => $i));
			}
		}
	}

	public static function course_from_row($row) {
		$c = json_decode($row->doc, true);
		$c['id'] = $row->id;
		$c['slug'] = $row->slug;
		$c['kind'] = $row->kind;
		$c['status'] = $row->status;
		$c['priceCents'] = (int) $row->price_cents;
		if ($row->compare_at_cents !== null) {
			$c['compareAtCents'] = (int) $row->compare_at_cents;
		}
		$c['currency'] = $row->currency;
		if ($row->certificate_title !== null) {
			$c['certificateTitle'] = $row->certificate_title;
		}
		return $c;
	}

	public static function all_courses() {
		global $wpdb;
		return array_map(array(__CLASS__, 'course_from_row'), $wpdb->get_results('SELECT * FROM ' . self::t('courses')));
	}

	public static function get_course($id_or_slug) {
		global $wpdb;
		$row = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . self::t('courses') . ' WHERE id = %s OR slug = %s', $id_or_slug, $id_or_slug));
		return $row ? self::course_from_row($row) : null;
	}

	public static function get_recipe($id_or_slug) {
		global $wpdb;
		$doc = $wpdb->get_var($wpdb->prepare('SELECT doc FROM ' . self::t('recipes') . ' WHERE id = %s OR slug = %s', $id_or_slug, $id_or_slug));
		return $doc ? json_decode($doc, true) : null;
	}

	public static function get_meta($key) {
		global $wpdb;
		$doc = $wpdb->get_var($wpdb->prepare('SELECT doc FROM ' . self::t('content_meta') . ' WHERE meta_key = %s', $key));
		return $doc ? json_decode($doc, true) : null;
	}

	public static function set_meta($key, $value) {
		global $wpdb;
		$wpdb->replace(self::t('content_meta'), array('meta_key' => $key, 'doc' => wp_json_encode($value)));
	}
}
