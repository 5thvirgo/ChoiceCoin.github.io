<?php
/**
 * Plugin Name:       Mcuire Cooking Courses
 * Description:       Mcuire African Restaurant’s online West African cooking academy: Cook With Me lessons, single dishes, courses, live cooking classes, event catering page, Stripe payments (CAD), My Kitchen and certificates, at /cooking-courses/.
 * Version:           1.5.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Mcuire African Restaurant
 * Text Domain:       mcuire-cooking-courses
 */

if (!defined('ABSPATH')) {
	exit;
}

define('MCUIRE_CC_VERSION', '1.5.0');
define('MCUIRE_CC_DIR', plugin_dir_path(__FILE__));
define('MCUIRE_CC_SLUG', 'cooking-courses');

require_once MCUIRE_CC_DIR . 'includes/class-db.php';
require_once MCUIRE_CC_DIR . 'includes/class-api.php';
require_once MCUIRE_CC_DIR . 'includes/class-admin.php';
require_once MCUIRE_CC_DIR . 'includes/class-seo.php';
require_once MCUIRE_CC_DIR . 'includes/class-catering.php';

register_activation_hook(__FILE__, function () {
	Mcuire_CC_DB::install();
	mcuire_cc_rewrite();
	flush_rewrite_rules();
	if (!get_option('mcuire_cc_admin_emails')) {
		update_option('mcuire_cc_admin_emails', get_option('admin_email'));
	}
	mcuire_cc_add_menu_link();
});

register_deactivation_hook(__FILE__, function () {
	flush_rewrite_rules();
});

// Upgrade the database when the plugin is updated.
add_action('plugins_loaded', function () {
	if (get_option('mcuire_cc_db_version') !== MCUIRE_CC_VERSION) {
		Mcuire_CC_DB::install();
		update_option('mcuire_cc_flush_rewrites', 1); // new page addresses in this version
	}
});

// ---------------------------------------------------------------------------
// The academy page: mcuire.ca/cooking-courses/
// ---------------------------------------------------------------------------
function mcuire_cc_rewrite() {
	add_rewrite_rule('^' . MCUIRE_CC_SLUG . '/?$', 'index.php?mcuire_academy=1', 'top');
	// Clean addresses for each dish, course and live class (for Google and sharing).
	add_rewrite_rule('^' . MCUIRE_CC_SLUG . '/(recipes|courses|live)/([a-z0-9-]+)/?$', 'index.php?mcuire_academy=1&mcuire_path=$matches[1]/$matches[2]', 'top');
	add_rewrite_rule('^' . MCUIRE_CC_SLUG . '/sitemap\\.xml$', 'index.php?mcuire_academy=sitemap', 'top');
}
add_action('init', 'mcuire_cc_rewrite');
add_action('init', function () {
	if (get_option('mcuire_cc_flush_rewrites')) {
		delete_option('mcuire_cc_flush_rewrites');
		flush_rewrite_rules();
	}
}, 99);

// Keep our addresses exactly as they are (no added slash on sitemap.xml).
add_filter('redirect_canonical', function ($redirect) {
	return get_query_var('mcuire_academy') ? false : $redirect;
});

add_filter('query_vars', function ($vars) {
	$vars[] = 'mcuire_academy';
	$vars[] = 'mcuire_path';
	return $vars;
});

add_action('template_redirect', function () {
	$academy = get_query_var('mcuire_academy');
	if (!$academy) {
		return;
	}
	if ($academy === 'sitemap') {
		Mcuire_CC_SEO::sitemap();
		exit;
	}
	nocache_headers();
	$config = array(
		'dataSource' => 'api',
		'payments' => 'stripe',
		'apiBase' => untrailingslashit(rest_url('mcuire/v1')),
		'showMediaBriefs' => (bool) get_option('mcuire_cc_show_briefs', true),
		'restaurantUrl' => home_url('/'),
		'basePath' => wp_parse_url(home_url('/' . MCUIRE_CC_SLUG . '/'), PHP_URL_PATH),
	);
	// Logged-in WordPress administrators are academy admins automatically.
	if (is_user_logged_in()) {
		$config['wpNonce'] = wp_create_nonce('wp_rest');
	}
	$html = file_get_contents(MCUIRE_CC_DIR . 'app/app.html');
	$html = str_replace('__MCUIRE_CONFIG__', wp_json_encode($config), $html);
	$html = Mcuire_CC_SEO::apply($html, (string) get_query_var('mcuire_path'));
	header('Content-Type: text/html; charset=utf-8');
	echo $html; // phpcs:ignore WordPress.Security.EscapeOutput -- prebuilt application shell
	exit;
});

// ---------------------------------------------------------------------------
// Add "Cooking Courses" to the site's main menu on activation (classic menus
// and block-theme navigation). Done once; staff can move or rename it.
// ---------------------------------------------------------------------------
function mcuire_cc_add_menu_link() {
	if (get_option('mcuire_cc_menu_added')) {
		return;
	}
	$url = home_url('/' . MCUIRE_CC_SLUG . '/');
	$added = false;

	// Classic themes: every menu assigned to a theme location.
	$locations = get_nav_menu_locations();
	foreach (array_unique(array_filter(array_values((array) $locations))) as $menu_id) {
		$items = wp_get_nav_menu_items($menu_id) ?: array();
		foreach ($items as $item) {
			if (untrailingslashit($item->url) === untrailingslashit($url)) {
				$added = true; // already there
				continue 2;
			}
		}
		wp_update_nav_menu_item($menu_id, 0, array(
			'menu-item-title' => 'Cooking Courses',
			'menu-item-url' => $url,
			'menu-item-status' => 'publish',
			'menu-item-type' => 'custom',
		));
		$added = true;
	}

	// Block themes: navigation menus stored as wp_navigation posts.
	$navs = get_posts(array('post_type' => 'wp_navigation', 'post_status' => 'publish', 'numberposts' => 5));
	foreach ($navs as $nav) {
		if (strpos($nav->post_content, '/' . MCUIRE_CC_SLUG) !== false) {
			$added = true; // already there
			continue;
		}
		$link = sprintf('<!-- wp:navigation-link {"label":"Cooking Courses","url":"%s","kind":"custom","isTopLevelLink":true} /-->', esc_url($url));
		wp_update_post(array('ID' => $nav->ID, 'post_content' => $nav->post_content . "\n" . $link));
		$added = true;
	}

	update_option('mcuire_cc_menu_added', $added ? 'yes' : 'manual');
}
