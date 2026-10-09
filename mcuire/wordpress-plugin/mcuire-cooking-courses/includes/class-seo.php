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

	public static function init() {
		add_filter('robots_txt', function ($out, $public) {
			return $public ? rtrim($out) . "\nSitemap: " . self::url('sitemap.xml', false) . "\n" : $out;
		}, 10, 2);
	}

	public static function url($path = '', $slash = true) {
		$u = home_url('/' . MCUIRE_CC_SLUG . '/' . ltrim($path, '/'));
		return $slash && $path !== '' ? trailingslashit($u) : $u;
	}

	private static function brand() {
		return array('@type' => 'Restaurant', 'name' => 'Mcuire African Restaurant', 'url' => home_url('/'), 'servesCuisine' => array('Nigerian', 'Ghanaian', 'West African'), 'logo' => plugins_url('media/mcuire-logo.png', MCUIRE_CC_DIR . 'mcuire-cooking-courses.php'));
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
			'provider' => array('@type' => 'Organization', 'name' => 'Mcuire African Restaurant', 'sameAs' => home_url('/')),
			'offers' => array('@type' => 'Offer', 'category' => 'Paid', 'price' => self::money($c['priceCents']), 'priceCurrency' => $c['currency'] ?? 'CAD', 'availability' => 'https://schema.org/InStock', 'url' => $url),
			'hasCourseInstance' => array('@type' => 'CourseInstance', 'courseMode' => 'Online', 'courseWorkload' => 'PT2H'),
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
			'title' => 'West African Cooking Classes Online · Mcuire African Restaurant',
			'desc' => 'Learn to cook Nigerian and Ghanaian food step by step: party jollof, egusi, suya, puff-puff and more. Lessons from $20 CAD, plus hands-on live classes at Mcuire.',
			'image' => '', 'url' => self::url(), 'type' => 'website', 'schema' => array(), 'body' => '',
		);

		if ($type === 'recipes' && ($r = Mcuire_CC_DB::get_recipe($slug)) && $r['status'] === 'complete') {
			$url = self::url('recipes/' . $r['slug']);
			$single = self::single_course($r['id']);
			$price = $single ? ' · $' . self::money($single['priceCents']) . ' CAD' : '';
			$page['title'] = $r['title'] . ' Recipe: Step-by-Step Cooking Lesson' . ' · Mcuire';
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
			$page['title'] = $c['title'] . ' · West African Cooking Course · Mcuire';
			$page['desc'] = self::clip(($c['blurb'] ?? $c['subtitle'] ?? '') . ' $' . self::money($c['priceCents']) . ' CAD, lifetime access.');
			$page['url'] = $url;
			$first = $c['modules'][0]['recipeIds'][0] ?? '';
			$fr = $first ? Mcuire_CC_DB::get_recipe($first) : null;
			$page['image'] = Mcuire_CC_DB::media_url($fr['hero']['src'] ?? '');
			$page['schema'][] = self::course_schema($c, $url, $page['desc']);
			$page['body'] = '<h1>' . esc_html($c['title']) . '</h1><p>' . esc_html($page['desc']) . '</p>';
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
			$page['body'] = '<h1>Learn to cook West African food with Mcuire</h1><p>' . esc_html($page['desc']) . '</p><h2>Cooking lessons</h2><ul>' . implode('', $links) . '</ul>';
		}
		$page['schema'][] = self::brand();
		return $page;
	}

	// Put the page's title, description, preview tags and schema into the app shell.
	public static function apply($html, $route) {
		$p = self::page($route);
		$t = esc_html($p['title']);
		$d = esc_attr($p['desc']);
		$html = preg_replace('#<title>.*?</title>#s', '<title>' . $t . '</title>', $html, 1);
		$html = preg_replace('#<meta name="description" content="[^"]*">#', '<meta name="description" content="' . $d . '">', $html, 1);
		$head = '<link rel="canonical" href="' . esc_url($p['url']) . '">'
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

	public static function sitemap() {
		$urls = array(self::url());
		if (class_exists('Mcuire_CC_Catering')) {
			$urls[] = Mcuire_CC_Catering::url();
		}
		foreach (Mcuire_CC_DB::all_courses() as $c) {
			if ($c['status'] !== 'published') {
				continue;
			}
			if ($c['kind'] === 'single') {
				$r = Mcuire_CC_DB::get_recipe($c['modules'][0]['recipeIds'][0] ?? '');
				if ($r) {
					$urls[] = self::url('recipes/' . $r['slug']);
				}
			} else {
				$urls[] = self::url('courses/' . $c['slug']);
			}
		}
		foreach (Mcuire_CC_DB::live_classes() as $cls) {
			if ($cls['status'] === 'published' && strtotime($cls['startsAt']) > time()) {
				$urls[] = self::url('live/' . $cls['id']);
			}
		}
		header('Content-Type: application/xml; charset=utf-8');
		echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
		foreach (array_unique($urls) as $u) {
			echo '<url><loc>' . esc_url($u) . '</loc></url>';
		}
		echo '</urlset>';
	}
}

Mcuire_CC_SEO::init();
