<?php
/**
 * Site style: touch-ups and animation for the whole of mcuire.ca (header,
 * footer, buttons, photos, scroll animations, phone action bar). Only adds a
 * stylesheet and a small script; page content is not changed. Switch it off in
 * Cooking Courses → Settings → Website look to get the theme's own look back.
 */

if (!defined('ABSPATH')) {
	exit;
}

class Mcuire_CC_Site_Style {

	const OPTION = 'mcuire_cc_site_style';

	public static function init() {
		add_action('wp_enqueue_scripts', array(__CLASS__, 'enqueue'), 20);
	}

	const PHONE = 'mcuire_cc_phone';

	// Restaurant phone for the Call button, e.g. "(905) 324-8091".
	public static function phone() {
		return (string) get_option(self::PHONE, '(905) 324-8091');
	}

	public static function enabled() {
		return get_option(self::OPTION, '1') === '1';
	}

	public static function enqueue() {
		if (!self::enabled() || is_admin()) {
			return;
		}
		$main = MCUIRE_CC_DIR . 'mcuire-cooking-courses.php';
		wp_enqueue_style('mcuire-site-style', plugins_url('site/site.css', $main), array(), MCUIRE_CC_VERSION);
		wp_enqueue_script('mcuire-site-style', plugins_url('site/site.js', $main), array(), MCUIRE_CC_VERSION, array('in_footer' => true, 'strategy' => 'defer'));
		// The Call button on phones always uses the restaurant number from Settings.
		wp_add_inline_script('mcuire-site-style', 'window.MCUIRE_SITE = ' . wp_json_encode(array('phone' => self::phone())) . ';', 'before');
	}
}

Mcuire_CC_Site_Style::init();
