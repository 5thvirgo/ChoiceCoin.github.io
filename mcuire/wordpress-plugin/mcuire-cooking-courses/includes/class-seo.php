<?php
/**
 * Search and sharing for the cooking courses.
 *
 * Every dish, course and live class gets a clean address
 * (mcuire.ca/cooking-courses/recipes/egusi/) whose HTML already carries its
 * title, description, photo, schema.org data (Recipe, Course, Event) and a
 * readable summary, so Google can index it and WhatsApp/Facebook/X show a
 * proper preview. A sitemap lists them all.
 */

if (!defined('ABSPATH')) {
	exit;
}

class Mcuire_CC_SEO {
	const HOME_TITLE = 'Mcuire · Voted Best African Restaurant in the Niagara Region · Niagara Falls, Ontario';
	const HOME_DESC = 'Voted best African restaurant in the Niagara Region (CommunityVotes). Nigerian and Ghanaian food in Niagara Falls, Ontario. Party jollof, suya, egusi, pepper soup and more: dine-in, takeout, event catering and wholesale zobo.';


	public static function init() {
		add_filter('robots_txt', function ($out, $public) {
			return $public ? rtrim($out) . "\nSitemap: " . self::url('sitemap.xml', false) . "\n" : $out;
		}, 10, 2);
		// Homepage: a title with the words people search for, and full restaurant
		// details (address, phone, hours, menu, awards) for Google and Maps.
		add_filter('pre_get_document_title', function ($title) {
			if (is_front_page() && get_option('mcuire_cc_home_seo', '1') === '1') {
				return self::HOME_TITLE;
			}
			return $title;
		}, 999);
		add_action('wp_head', function () {
			if (is_front_page() && get_option('mcuire_cc_home_seo', '1') === '1') {
				// Search snippet and share preview, unless an SEO plugin already writes them.
				if (!self::seo_plugin_active()) {
					$desc = self::HOME_DESC;
					$img = plugins_url('media/jollof-chicken-plantain.jpg', MCUIRE_CC_DIR . 'mcuire-cooking-courses.php');
					printf('<meta name="description" content="%s">' . "\n", esc_attr($desc));
					printf('<meta property="og:type" content="restaurant"><meta property="og:title" content="%s"><meta property="og:description" content="%s"><meta property="og:url" content="%s"><meta property="og:image" content="%s"><meta name="twitter:card" content="summary_large_image">' . "\n",
						esc_attr(self::HOME_TITLE), esc_attr($desc), esc_url(home_url('/')), esc_url($img));
				}
				echo '<script type="application/ld+json">' . wp_json_encode(array_merge(array('@context' => 'https://schema.org'), self::restaurant()), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
			}
		}, 5);
		// Google Search Console ownership code on every page of the site.
		add_action('wp_head', function () {
			echo self::verification_tag(); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in verification_tag()
		}, 1);
		// IndexNow (Bing, Yandex and others): a key file at /<key>.txt and a notice
		// listing every course page after each plugin update.
		add_action('init', function () {
			add_rewrite_rule('^' . self::indexnow_key() . '\.txt$', 'index.php?mcuire_indexnow=1', 'top');
		});
		add_filter('query_vars', function ($vars) {
			$vars[] = 'mcuire_indexnow';
			return $vars;
		});
		add_action('template_redirect', function () {
			if (get_query_var('mcuire_indexnow')) {
				header('Content-Type: text/plain; charset=utf-8');
				echo esc_html(self::indexnow_key());
				exit;
			}
		}, 1);
		add_action('init', function () {
			if (get_option('mcuire_cc_indexnow_due')) {
				delete_option('mcuire_cc_indexnow_due');
				self::indexnow_ping();
			}
		}, 110);
	}

	public static function indexnow_key() {
		$key = get_option('mcuire_cc_indexnow_key');
		if (!$key) {
			$key = bin2hex(random_bytes(16));
			update_option('mcuire_cc_indexnow_key', $key);
		}
		return $key;
	}

	// Tell IndexNow search engines that the course pages are new or changed.
	public static function indexnow_ping() {
		$host = wp_parse_url(home_url('/'), PHP_URL_HOST);
		if (!$host || preg_match('/^(localhost|127\.|10\.|192\.168\.)|\.(local|test)$/', $host) || !get_option('blog_public')) {
			return; // test sites and sites hidden from search engines
		}
		$key = self::indexnow_key();
		wp_remote_post('https://api.indexnow.org/indexnow', array(
			'blocking' => false, 'timeout' => 5,
			'headers' => array('Content-Type' => 'application/json; charset=utf-8'),
			'body' => wp_json_encode(array('host' => $host, 'key' => $key, 'keyLocation' => home_url('/' . $key . '.txt'), 'urlList' => array_slice(self::all_urls(), 0, 1000))),
		));
	}

	public static function url($path = '', $slash = true) {
		$u = home_url('/' . MCUIRE_CC_SLUG . '/' . ltrim($path, '/'));
		return $slash && $path !== '' ? trailingslashit($u) : $u;
	}

	// The restaurant, which is also the cooking school behind the courses.
	private static function brand() {
		$phone = class_exists('Mcuire_CC_Site_Style') ? Mcuire_CC_Site_Style::phone() : '';
		return array(
			'@type' => array('Restaurant', 'EducationalOrganization'), '@id' => home_url('/#mcuire'),
			'name' => 'Mcuire African Restaurant', 'alternateName' => 'Mcuire Cooking Courses',
			'url' => home_url('/'), 'logo' => plugins_url('media/mcuire-logo.png', MCUIRE_CC_DIR . 'mcuire-cooking-courses.php'),
			'servesCuisine' => array('Nigerian', 'Ghanaian', 'West African', 'African'),
			'telephone' => $phone ? '+1 ' . trim(preg_replace('/[^\d]+/', ' ', $phone)) : null,
			'address' => array('@type' => 'PostalAddress', 'streetAddress' => '3876 Main St', 'addressLocality' => 'Niagara Falls', 'addressRegion' => 'ON', 'postalCode' => 'L2G 6B6', 'addressCountry' => 'CA'),
			'areaServed' => array('Canada', 'Worldwide (online courses)'),
			'knowsAbout' => array('African cooking', 'Nigerian cooking', 'Ghanaian cooking', 'West African cuisine', 'Jollof rice', 'Egusi soup', 'Suya'),
			'award' => array('Voted Best African Restaurant, Niagara Region (CommunityVotes)', 'CommunityVotes Niagara Region: 22 awards, 2023–2026', 'Canadian Choice Award 2023, Catering Services', 'Restaurant Guru Recommended 2022'),
			'sameAs' => array('https://www.instagram.com/mcuire_/'),
		);
	}

	// The restaurant itself, for the homepage.
	public static function restaurant() {
		$r = array_filter(self::brand(), function ($v) { return $v !== null; });
		$r['@type'] = 'Restaurant';
		$r['description'] = 'Voted best African restaurant in the Niagara Region (CommunityVotes). Nigerian and Ghanaian restaurant in Niagara Falls, Ontario: party jollof, suya, egusi and more. Weekend dine-in, takeout, event catering, wholesale zobo and online African cooking classes.';
		$r['image'] = array_map(function ($f) {
			return plugins_url('media/' . $f, MCUIRE_CC_DIR . 'mcuire-cooking-courses.php');
		}, array('party-jollof-2.jpg', 'jollof-chicken-plantain.jpg', 'rice-stew-protein.jpg', 'mcuire-logo.png'));
		$r['hasMap'] = 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode('Mcuire African Restaurant, 3876 Main St, Niagara Falls, ON L2G 6B6');
		$r['priceRange'] = '$$';
		$r['acceptsReservations'] = home_url('/reservations/');
		$r['hasMenu'] = home_url('/weekend-menu/');
		$r['openingHoursSpecification'] = array(array('@type' => 'OpeningHoursSpecification', 'dayOfWeek' => array('Thursday', 'Friday', 'Saturday'), 'opens' => '12:00', 'closes' => '19:00'));
		$r['areaServed'] = array('Niagara Falls', 'Niagara Region', 'St. Catharines', 'Welland', 'Fort Erie', 'Niagara-on-the-Lake', 'Thorold', 'Ontario', 'Canada');
		$r['makesOffer'] = array(
			array('@type' => 'Offer', 'itemOffered' => array('@type' => 'Service', 'name' => 'Event catering', 'url' => home_url('/event-catering/'))),
			array('@type' => 'Offer', 'itemOffered' => array('@type' => 'Service', 'name' => 'Online African cooking classes', 'url' => self::url())),
			array('@type' => 'Offer', 'itemOffered' => array('@type' => 'Product', 'name' => 'Zobo hibiscus drink (wholesale)', 'url' => home_url('/wholesale-drinks/'))),
		);
		return $r;
	}

	private static function faq() {
		$seed = json_decode((string) file_get_contents(MCUIRE_CC_DIR . 'data/seed.json'), true);
		return (array) ($seed['faq'] ?? array());
	}

	private static function money($cents) {
		return number_format($cents / 100, 2, '.', '');
	}

	private static function iso_minutes($m) {
		return 'PT' . max(0, (int) $m) . 'M';
	}

	private static function clip($text, $len = 158) {
		$text = trim(preg_replace('/\s+/', ' ', wp_strip_all_tags((string) $text)));
		return mb_strlen($text) > $len ? rtrim(mb_substr($text, 0, $len - 1)) . '…' : $text;
	}

	private static function ingredient_line($i) {
		$qty = isset($i['qty']) && $i['qty'] !== '' && $i['qty'] !== null ? (is_numeric($i['qty']) ? rtrim(rtrim(number_format((float) $i['qty'], 2, '.', ''), '0'), '.') : $i['qty']) : '';
		return trim(implode(' ', array_filter(array($qty, $i['unit'] ?? '', $i['name'] ?? ''), 'strlen')));
	}

	private static function single_course($recipe_id) {
		$c = Mcuire_CC_DB::get_course('dish-' . $recipe_id);
		return ($c && $c['status'] === 'published') ? $c : null;
	}

	private static function course_schema($c, $url, $desc) {
		return array(
			'@type' => 'Course', 'name' => $c['title'], 'description' => $desc, 'url' => $url,
			'provider' => array('@type' => 'Organization', '@id' => home_url('/#mcuire'), 'name' => 'Mcuire African Restaurant', 'sameAs' => home_url('/')),
			'educationalLevel' => 'Beginner', 'teaches' => 'West African (Nigerian and Ghanaian) home cooking', 'about' => array('African cooking', 'Nigerian food', 'Ghanaian food'),
			'isAccessibleForFree' => false, 'availableLanguage' => 'en',
			'offers' => array('@type' => 'Offer', 'category' => 'Paid', 'price' => self::money($c['priceCents']), 'priceCurrency' => $c['currency'] ?? 'CAD', 'availability' => 'https://schema.org/InStock', 'url' => $url),
			'hasCourseInstance' => array('@type' => 'CourseInstance', 'courseMode' => 'Online', 'courseWorkload' => 'PT2H', 'courseSchedule' => array('@type' => 'Schedule', 'repeatFrequency' => 'P1D', 'repeatCount' => 1, 'duration' => 'PT2H')),
			'inLanguage' => 'en',
		);
	}

	// What to show search engines and link previews for the current address.
	public static function page($route) {
		$parts = explode('/', (string) $route, 2);
		$type = $parts[0] ?? '';
		$slug = $parts[1] ?? '';
		$home = home_url('/');
		$page = array(
			'title' => 'Online African Cooking Course in Canada · Nigerian & Ghanaian Cooking Classes · Mcuire',
			'desc' => 'Learn African cooking online with Mcuire, voted best African restaurant in the Niagara Region (Niagara Falls, Canada): step-by-step Nigerian and Ghanaian lessons from $20, live video cooking classes and a certificate. Jollof, egusi, suya and 40+ dishes.',
			'image' => '', 'url' => self::url(), 'type' => 'website', 'schema' => array(), 'body' => '',
		);

		if ($type === 'recipes' && ($r = Mcuire_CC_DB::get_recipe($slug)) && $r['status'] === 'complete') {
			$url = self::url('recipes/' . $r['slug']);
			$single = self::single_course($r['id']);
			$price = $single ? ' · $' . self::money($single['priceCents']) . ' CAD' : '';
			$adj = array('Nigeria' => 'Nigerian', 'Ghana' => 'Ghanaian', 'Senegal' => 'Senegalese', 'Sierra Leone' => 'Sierra Leonean', 'Cameroon' => 'Cameroonian');
			$page['title'] = 'How to Make ' . $r['title'] . ': Step-by-Step ' . ($adj[trim(preg_replace('/\s*\(.*$/', '', (string) ($r['region'] ?? '')))] ?? 'West African') . ' Recipe & Cooking Lesson · Mcuire';
			$page['desc'] = self::clip(($r['subtitle'] ?? '') . ' Cook it with Mcuire African Restaurant’s step-by-step lesson, with photos, timers and tips' . $price . '.');
			$page['image'] = Mcuire_CC_DB::media_url($r['hero']['src'] ?? '');
			$page['url'] = $url;
			$page['type'] = 'article';
			$ingredients = array_values(array_filter(array_map(array(__CLASS__, 'ingredient_line'), $r['ingredients'] ?? array())));
			$recipe = array(
				'@type' => 'Recipe', 'name' => $r['title'], 'description' => self::clip($r['subtitle'] ?? $r['story'] ?? '', 300),
				'author' => array('@type' => 'Organization', 'name' => 'Mcuire African Restaurant'),
				'recipeCuisine' => $r['region'] ?: 'West African', 'recipeCategory' => !empty($r['components']) ? 'Meal' : 'Main course',
				'prepTime' => self::iso_minutes($r['prepMinutes'] ?? 0), 'cookTime' => self::iso_minutes($r['cookMinutes'] ?? 0),
				'totalTime' => self::iso_minutes(($r['prepMinutes'] ?? 0) + ($r['cookMinutes'] ?? 0)),
				'recipeYield' => ((int) ($r['baseServings'] ?? 4)) . ' servings', 'recipeIngredient' => $ingredients,
				'keywords' => implode(', ', array_filter(array($r['title'], $r['region'] ?? '', 'West African recipe', 'how to cook ' . strtolower($r['title'])))),
				'url' => $url,
			);
			// Google wants the method as HowToStep items; each lesson step becomes one.
			$steps = array();
			foreach (array_values($r['steps'] ?? array()) as $i => $s) {
				$text = trim(wp_strip_all_tags((string) ($s['body'] ?? '')));
				$step = array('@type' => 'HowToStep', 'name' => $s['title'] ?? ('Step ' . ($i + 1)), 'text' => self::clip($text !== '' ? $text : ($s['title'] ?? ''), 500), 'url' => $url . '#step-' . ($i + 1));
				$photo = Mcuire_CC_DB::media_url($s['media'][0]['src'] ?? '');
				if ($photo) {
					$step['image'] = $photo;
				}
				$steps[] = $step;
			}
			if ($steps) {
				$recipe['recipeInstructions'] = $steps;
			}
			if ($page['image']) {
				$recipe['image'] = array($page['image']);
			}
			$page['schema'][] = $recipe;
			if ($single) {
				$page['schema'][] = self::course_schema($single, $url, $page['desc']);
			}
			$page['body'] = '<h1>' . esc_html($r['title']) . '</h1><p>' . esc_html($r['subtitle'] ?? '') . '</p>'
				. ($page['image'] ? '<img src="' . esc_url($page['image']) . '" alt="' . esc_attr($r['title']) . '" width="600">' : '')
				. '<p>Prep ' . (int) $r['prepMinutes'] . ' min · Cook ' . (int) $r['cookMinutes'] . ' min · ' . esc_html($r['difficulty'] ?? '') . $price . '</p>'
				. ($ingredients ? '<h2>Ingredients</h2><ul><li>' . implode('</li><li>', array_map('esc_html', $ingredients)) . '</li></ul>' : '')
				. '<h2>Cook it step by step</h2><ol><li>' . implode('</li><li>', array_map(function ($s) { return esc_html($s['title']); }, $r['steps'])) . '</li></ol>';
		} elseif ($type === 'courses' && ($c = Mcuire_CC_DB::get_course($slug)) && $c['status'] === 'published') {
			$url = self::url('courses/' . $c['slug']);
			$page['title'] = $c['title'] . ' · Online African Cooking Course · Mcuire';
			$page['desc'] = self::clip(($c['blurb'] ?? $c['subtitle'] ?? '') . ' $' . self::money($c['priceCents']) . ' CAD, lifetime access.');
			$page['url'] = $url;
			$first = $c['modules'][0]['recipeIds'][0] ?? '';
			$fr = $first ? Mcuire_CC_DB::get_recipe($first) : null;
			$page['image'] = Mcuire_CC_DB::media_url($fr['hero']['src'] ?? '');
			$page['schema'][] = self::course_schema($c, $url, $page['desc']);
			$page['body'] = '<h1>' . esc_html($c['title']) . '</h1><p>' . esc_html($page['desc']) . '</p>';
		} elseif ($type === 'live' && $slug === '') {
			$page = self::live_landing($page);
		} elseif ($type === 'live' && ($cls = Mcuire_CC_DB::live_class($slug)) && $cls['status'] === 'published') {
			$url = self::url('live/' . $cls['id']);
			$start = strtotime($cls['startsAt']);
			$when = Mcuire_CC_API::class_when($cls);
			$in_person = ($cls['format'] ?? '') === 'in-person';
			$rec = !empty($cls['recipeId']) ? Mcuire_CC_DB::get_recipe($cls['recipeId']) : null;
			$page['title'] = $cls['title'] . ' · Live Cooking Class · Mcuire African Restaurant';
			$page['desc'] = self::clip($when . '. ' . ($cls['description'] ?? '') . ' $' . self::money($cls['priceCents']) . ' CAD per seat.');
			$page['image'] = Mcuire_CC_DB::media_url($rec['hero']['src'] ?? '');
			$page['url'] = $url;
			$event = array(
				'@type' => 'Event', 'name' => $cls['title'], 'description' => self::clip($cls['description'] ?? '', 300),
				'startDate' => gmdate('c', $start), 'endDate' => gmdate('c', $start + 60 * (int) ($cls['durationMinutes'] ?? 120)),
				'eventStatus' => 'https://schema.org/EventScheduled',
				'eventAttendanceMode' => $in_person ? 'https://schema.org/OfflineEventAttendanceMode' : 'https://schema.org/OnlineEventAttendanceMode',
				'location' => $in_person
					? array('@type' => 'Place', 'name' => 'Mcuire African Restaurant', 'address' => $cls['location'] ?: 'Mcuire African Restaurant')
					: array('@type' => 'VirtualLocation', 'url' => $url),
				'organizer' => array('@type' => 'Organization', 'name' => 'Mcuire African Restaurant', 'url' => $home),
				'offers' => array('@type' => 'Offer', 'price' => self::money($cls['priceCents']), 'priceCurrency' => $cls['currency'] ?? 'CAD', 'url' => $url, 'availability' => 'https://schema.org/InStock', 'validFrom' => gmdate('c')),
			);
			if ($page['image']) {
				$event['image'] = array($page['image']);
			}
			$page['schema'][] = $event;
			$page['body'] = '<h1>' . esc_html($cls['title']) . '</h1><p>' . esc_html($when) . '</p><p>' . esc_html($cls['description'] ?? '') . '</p>';
		} else {
			// Landing page: every dish with its price, as crawlable links.
			$items = array();
			$links = array();
			foreach (Mcuire_CC_DB::all_courses() as $c) {
				if ($c['kind'] !== 'single' || $c['status'] !== 'published') {
					continue;
				}
				$rid = $c['modules'][0]['recipeIds'][0] ?? '';
				$r = $rid ? Mcuire_CC_DB::get_recipe($rid) : null;
				if (!$r) {
					continue;
				}
				$u = self::url('recipes/' . $r['slug']);
				$items[] = array('@type' => 'ListItem', 'position' => count($items) + 1, 'item' => self::course_schema($c, $u, self::clip($r['subtitle'] ?? '', 200)));
				$links[] = '<li><a href="' . esc_url($u) . '">' . esc_html($r['title']) . '</a> · $' . self::money($c['priceCents']) . ' CAD</li>';
				if (!$page['image'] && !empty($r['hero']['src'])) {
					$page['image'] = Mcuire_CC_DB::media_url($r['hero']['src']);
				}
			}
			$jollof = Mcuire_CC_DB::get_recipe('party-jollof');
			if (!empty($jollof['hero']['src'])) {
				$page['image'] = Mcuire_CC_DB::media_url($jollof['hero']['src']);
			}
			$page['schema'][] = array('@type' => 'ItemList', 'name' => 'West African cooking lessons', 'itemListElement' => $items);
			$faq = self::faq();
			if ($faq) {
				$page['schema'][] = array('@type' => 'FAQPage', 'mainEntity' => array_map(function ($f) {
					return array('@type' => 'Question', 'name' => $f['q'], 'acceptedAnswer' => array('@type' => 'Answer', 'text' => $f['a']));
				}, $faq));
			}
			$page['body'] = '<h1>Online African cooking course from the kitchen voted best African restaurant in the Niagara Region</h1><p>' . esc_html($page['desc']) . '</p>'
				. '<h2>Nigerian and Ghanaian cooking lessons</h2><ul>' . implode('', $links) . '</ul>'
				. '<h2><a href="' . esc_url(self::url('live')) . '">Live online African cooking classes</a></h2><p>Cook at home, anywhere in the world, while a Mcuire chef coaches you live by video call, every Saturday and Sunday: home cooking, cooking help, group cooking and cooking for events.</p>'
				. ($faq ? '<h2>Questions people ask</h2>' . implode('', array_map(function ($f) { return '<h3>' . esc_html($f['q']) . '</h3><p>' . esc_html($f['a']) . '</p>'; }, $faq)) : '');
		}
		$page['schema'][] = array_filter(self::brand(), function ($v) { return $v !== null; });
		return $page;
	}

	// True when an SEO plugin (SiteSEO, Yoast, Rank Math, AIOSEO, SEOPress…) is
	// active; it writes the homepage description and share tags itself.
	private static function seo_plugin_active() {
		foreach ((array) get_option('active_plugins', array()) as $plugin) {
			if (preg_match('#^(siteseo|wordpress-seo|seo-by-rank-math|all-in-one-seo-pack|wp-seopress|autodescription|slim-seo)/#', (string) $plugin)) {
				return true;
			}
		}
		return defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION');
	}

	// The live online classes page (mcuire.ca/cooking-courses/live/): who it is
	// for, the kinds of class with prices, and its own FAQ. Kept in step with
	// WHO_FOR in assets/js/views/live.js.
	private static function live_landing($page) {
		$s = Mcuire_CC_DB::booking_settings();
		$url = self::url('live');
		$page['title'] = 'Live Online African Cooking Classes with a Chef · Nigerian & Ghanaian Food · Mcuire';
		$page['desc'] = 'Learn to cook Nigerian and Ghanaian food live on Zoom or Teams with a chef from Mcuire, voted best African restaurant in the Niagara Region. Join from anywhere, weekends, from $75/hour.';
		$page['url'] = $url;
		$jollof = Mcuire_CC_DB::get_recipe('party-jollof');
		$page['image'] = Mcuire_CC_DB::media_url($jollof['hero']['src'] ?? '');
		$who = array(
			array('Cooking for your partner or their family', 'Married to, or dating, someone Nigerian or Ghanaian? Learn the dishes they grew up with and cook them a taste of home.'),
			array('Missing food from home', 'Living far from West Africa? Cook jollof, egusi or pepper soup the way you remember it, with a chef beside you.'),
			array('Curious food lovers anywhere', 'Never cooked African food? Start from zero. We go step by step at your pace, in your own kitchen.'),
			array('Groups, parties and events', 'Cook together with friends, family or your team, or get coached through a big cook for a celebration.'),
		);
		$offers = array();
		$rows = '';
		foreach ((array) ($s['types'] ?? array()) as $t) {
			if (($t['enabled'] ?? true) === false) {
				continue;
			}
			$price = self::money($t['pricePerHourCents']);
			$offers[] = array(
				'@type' => 'Offer', 'name' => $t['name'], 'description' => $t['blurb'] ?? '', 'url' => $url,
				'priceSpecification' => array('@type' => 'UnitPriceSpecification', 'price' => $price, 'priceCurrency' => $s['currency'] ?? 'CAD', 'unitCode' => 'HUR', 'unitText' => 'hour', 'valueAddedTaxIncluded' => false),
			);
			$extra = !empty($t['extraPersonCents']) ? ' + $' . self::money($t['extraPersonCents']) . ' per extra cook' : '';
			$rows .= '<li><strong>' . esc_html($t['name']) . '</strong>: $' . $price . ' CAD per hour' . esc_html($extra) . '. ' . esc_html($t['blurb'] ?? '') . '</li>';
		}
		$page['schema'][] = array_filter(array(
			'@type' => 'Service', 'name' => 'Live online African cooking classes', 'serviceType' => 'Online cooking class',
			'description' => $page['desc'], 'url' => $url, 'image' => $page['image'] ?: null,
			'provider' => array('@id' => home_url('/#mcuire')), 'areaServed' => 'Worldwide',
			'availableChannel' => array('@type' => 'ServiceChannel', 'serviceUrl' => $url, 'name' => 'Video call: Zoom, Microsoft Teams, Google Meet or WhatsApp'),
			'audience' => array_map(function ($w) { return array('@type' => 'Audience', 'audienceType' => $w[0]); }, $who),
			'hasOfferCatalog' => array('@type' => 'OfferCatalog', 'name' => 'Kinds of live class', 'itemListElement' => $offers),
		));
		$faq = array_values(array_filter(self::faq(), function ($f) {
			return stripos($f['q'], 'live') !== false || stripos($f['q'], 'partner') !== false || stripos($f['q'], 'anywhere') !== false;
		}));
		if ($faq) {
			$page['schema'][] = array('@type' => 'FAQPage', 'mainEntity' => array_map(function ($f) {
				return array('@type' => 'Question', 'name' => $f['q'], 'acceptedAnswer' => array('@type' => 'Answer', 'text' => $f['a']));
			}, $faq));
		}
		$page['schema'][] = array('@type' => 'BreadcrumbList', 'itemListElement' => array(
			array('@type' => 'ListItem', 'position' => 1, 'name' => 'Cooking courses', 'item' => self::url()),
			array('@type' => 'ListItem', 'position' => 2, 'name' => 'Live online classes', 'item' => $url),
		));
		$page['body'] = '<h1>Live online African cooking classes with a Mcuire chef</h1><p>' . esc_html($page['desc']) . '</p>'
			. '<p>Cook in your own kitchen, anywhere in the world, while our chef coaches you live by video call every Saturday and Sunday. Tell us what you would like to cook when you book; we email the ingredient list and your call link before the class.</p>'
			. '<h2>Who our live classes are for</h2><ul>' . implode('', array_map(function ($w) { return '<li><strong>' . esc_html($w[0]) . '</strong>: ' . esc_html($w[1]) . '</li>'; }, $who)) . '</ul>'
			. ($rows ? '<h2>Kinds of class and prices</h2><ul>' . $rows . '</ul><p>Prices in Canadian dollars, plus HST. One class at a time, so the chef is all yours.</p>' : '')
			. ($faq ? '<h2>Questions people ask</h2>' . implode('', array_map(function ($f) { return '<h3>' . esc_html($f['q']) . '</h3><p>' . esc_html($f['a']) . '</p>'; }, $faq)) : '');
		return $page;
	}

	// Put the page's title, description, preview tags and schema into the app shell.
	public static function apply($html, $route) {
		$p = self::page($route);
		$t = esc_html($p['title']);
		$d = esc_attr($p['desc']);
		// Callbacks, not replacement strings: a price like "$20" would otherwise be read as a backreference and vanish.
		$html = preg_replace_callback('#<title>.*?</title>#s', function () use ($t) { return '<title>' . $t . '</title>'; }, $html, 1);
		$html = preg_replace_callback('#<meta name="description" content="[^"]*">#', function () use ($d) { return '<meta name="description" content="' . $d . '">'; }, $html, 1);
		$head = self::verification_tag() . '<link rel="canonical" href="' . esc_url($p['url']) . '">'
			. '<meta name="robots" content="index,follow,max-image-preview:large">'
			. '<meta property="og:site_name" content="Mcuire African Restaurant">'
			. '<meta property="og:locale" content="en_CA">'
			. '<meta property="og:type" content="' . esc_attr($p['type']) . '">'
			. '<meta property="og:title" content="' . esc_attr($p['title']) . '">'
			. '<meta property="og:description" content="' . $d . '">'
			. '<meta property="og:url" content="' . esc_url($p['url']) . '">'
			. ($p['image'] ? '<meta property="og:image" content="' . esc_url($p['image']) . '"><meta name="twitter:image" content="' . esc_url($p['image']) . '">' : '')
			. '<meta name="twitter:card" content="summary_large_image">'
			. '<meta name="twitter:title" content="' . esc_attr($p['title']) . '">'
			. '<meta name="twitter:description" content="' . $d . '">'
			. '<script type="application/ld+json">' . wp_json_encode(array('@context' => 'https://schema.org', '@graph' => $p['schema']), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>';
		$html = str_replace('</head>', $head . "\n</head>", $html);
		// A readable version of the page for search engines; the app replaces it on load.
		$pre = '<div class="seo-pre" style="max-width:720px;margin:40px auto;padding:0 16px;font-family:sans-serif">' . $p['body'] . '</div>';
		return str_replace('<div class="loading">Opening the Mcuire kitchen…</div>', $pre . '<div class="loading">Opening the Mcuire kitchen…</div>', $html);
	}

	// address => photo (or '') for every public page.
	public static function entries() {
		$urls = array(self::url() => '');
		if (class_exists('Mcuire_CC_Catering')) {
			$urls[Mcuire_CC_Catering::url()] = '';
		}
		if (class_exists('Mcuire_CC_Wholesale')) {
			$urls[Mcuire_CC_Wholesale::url()] = Mcuire_CC_Wholesale::photo();
		}
		foreach (Mcuire_CC_DB::all_courses() as $c) {
			if ($c['status'] !== 'published') {
				continue;
			}
			$r = Mcuire_CC_DB::get_recipe($c['modules'][0]['recipeIds'][0] ?? '');
			$img = $r ? Mcuire_CC_DB::media_url($r['hero']['src'] ?? '') : '';
			if ($c['kind'] === 'single') {
				if ($r) {
					$urls[self::url('recipes/' . $r['slug'])] = $img;
				}
			} else {
				$urls[self::url('courses/' . $c['slug'])] = $img;
			}
		}
		$jollof = Mcuire_CC_DB::get_recipe('party-jollof');
		$urls[self::url('live')] = $jollof ? Mcuire_CC_DB::media_url($jollof['hero']['src'] ?? '') : '';
		foreach (Mcuire_CC_DB::live_classes() as $cls) {
			if ($cls['status'] === 'published' && strtotime($cls['startsAt']) > time()) {
				$urls[self::url('live/' . $cls['id'])] = '';
			}
		}
		return $urls;
	}

	public static function sitemap() {
		$urls = self::entries();
		header('Content-Type: application/xml; charset=utf-8');
		echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">';
		foreach ($urls as $u => $img) {
			echo '<url><loc>' . esc_url($u) . '</loc>' . ($img && preg_match('#^https?://#', $img) ? '<image:image><image:loc>' . esc_url($img) . '</image:loc></image:image>' : '') . '</url>';
		}
		echo '</urlset>';
	}

	// Every page address in the sitemap (for search-engine notices).
	public static function all_urls() {
		return array_keys(self::entries());
	}

	// Google Search Console ownership code (Settings), on every page.
	public static function verification_tag() {
		$code = trim((string) get_option('mcuire_cc_google_verify', ''));
		return $code ? '<meta name="google-site-verification" content="' . esc_attr($code) . '">' : '';
	}
}

Mcuire_CC_SEO::init();
