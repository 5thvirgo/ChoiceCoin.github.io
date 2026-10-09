<?php
/**
 * WordPress admin screen: Cooking Courses → Settings.
 * Stripe accounts (one row per account), who can manage the academy, and test mode.
 * Recipes, prices and courses are managed inside the academy itself (/cooking-courses/#/admin).
 */

if (!defined('ABSPATH')) {
	exit;
}

class Mcuire_CC_Admin {

	public static function init() {
		add_action('admin_menu', function () {
			add_menu_page('Cooking Courses', 'Cooking Courses', 'manage_options', 'mcuire-cooking-courses', array(__CLASS__, 'page'), 'dashicons-carrot', 26);
		});
		add_action('admin_post_mcuire_cc_save', array(__CLASS__, 'save'));
		add_filter('plugin_action_links_' . plugin_basename(MCUIRE_CC_DIR . 'mcuire-cooking-courses.php'), function ($links) {
			array_unshift($links, '<a href="' . esc_url(admin_url('admin.php?page=mcuire-cooking-courses')) . '">Settings</a>');
			return $links;
		});
	}

	private static function clean_name($name, $fallback) {
		$n = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', (string) $name));
		return $n !== '' ? $n : $fallback;
	}

	public static function save() {
		if (!current_user_can('manage_options')) {
			wp_die('Not allowed');
		}
		check_admin_referer('mcuire_cc_settings');
		$old = get_option('mcuire_cc_stripe_accounts', array());
		$accounts = array();
		$rows = isset($_POST['acct']) && is_array($_POST['acct']) ? wp_unslash($_POST['acct']) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		foreach (array_values($rows) as $i => $row) {
			$original = sanitize_key($row['original'] ?? '');
			if (!empty($row['delete'])) {
				continue;
			}
			$name = self::clean_name($row['name'] ?? '', $i === 0 ? 'default' : 'account' . ($i + 1));
			$secret = trim(sanitize_text_field($row['secret'] ?? ''));
			$webhook = trim(sanitize_text_field($row['webhook'] ?? ''));
			// Blank fields keep the saved value, so keys never have to be shown again.
			if ($secret === '' && $original && isset($old[$original])) {
				$secret = $old[$original]['secret'];
			}
			if ($webhook === '' && $original && isset($old[$original])) {
				$webhook = $old[$original]['webhook'];
			}
			if ($secret === '') {
				continue;
			}
			if (!preg_match('/^(sk|rk)_(test|live)_/', $secret)) {
				add_settings_error('mcuire_cc', 'bad_key', sprintf('“%s”: a Stripe secret key starts with sk_live_ or sk_test_.', esc_html($name)));
				continue;
			}
			$accounts[$name] = array('secret' => $secret, 'webhook' => $webhook);
		}
		update_option('mcuire_cc_stripe_accounts', $accounts, false);
		update_option('mcuire_cc_admin_emails', sanitize_text_field(wp_unslash($_POST['admin_emails'] ?? '')));
		update_option('mcuire_cc_staff_emails', sanitize_text_field(wp_unslash($_POST['staff_emails'] ?? '')));
		update_option('mcuire_cc_test_purchases', !empty($_POST['test_purchases']) ? '1' : '0');
		update_option('mcuire_cc_show_briefs', !empty($_POST['show_briefs']) ? 1 : 0);
		$style = !empty($_POST['site_style']) ? '1' : '0';
		if ($style !== get_option('mcuire_cc_site_style', '1')) {
			update_option('mcuire_cc_purge_cache', 1); // show the change to visitors straight away
		}
		update_option('mcuire_cc_site_style', $style);
		$phone = sanitize_text_field(wp_unslash($_POST['phone'] ?? ''));
		if ($phone !== get_option('mcuire_cc_phone', '(905) 324-8091')) {
			update_option('mcuire_cc_purge_cache', 1);
		}
		update_option('mcuire_cc_phone', preg_match('/\d{7,}/', preg_replace('/\D/', '', $phone)) ? $phone : '(905) 324-8091');
		set_transient('mcuire_cc_notice', get_settings_errors('mcuire_cc') ?: 'saved', 60);
		wp_safe_redirect(admin_url('admin.php?page=mcuire-cooking-courses'));
		exit;
	}

	public static function page() {
		if (!current_user_can('manage_options')) {
			return;
		}
		$accounts = get_option('mcuire_cc_stripe_accounts', array());
		$page_url = home_url('/' . MCUIRE_CC_SLUG . '/');
		$notice = get_transient('mcuire_cc_notice');
		delete_transient('mcuire_cc_notice');
		$menu = get_option('mcuire_cc_menu_added');
		$rows = $accounts ?: array();
		$rows[''] = array('secret' => '', 'webhook' => ''); // one empty row to add an account
		?>
		<div class="wrap">
			<h1>Cooking Courses</h1>
			<?php if ($notice === 'saved') : ?>
				<div class="notice notice-success is-dismissible"><p>Settings saved.</p></div>
			<?php elseif (is_array($notice)) : foreach ($notice as $n) : ?>
				<div class="notice notice-error"><p><?php echo esc_html($n['message']); ?></p></div>
			<?php endforeach; endif; ?>

			<p style="font-size:14px">
				Your academy lives at <a href="<?php echo esc_url($page_url); ?>" target="_blank"><strong><?php echo esc_html($page_url); ?></strong></a>.
				&nbsp;<a class="button button-primary" href="<?php echo esc_url($page_url . '#/admin'); ?>" target="_blank">Open course admin (recipes, prices, photos)</a>
			</p>
			<?php if ($menu === 'manual') : ?>
				<div class="notice notice-warning inline"><p>Add a “Cooking Courses” link to your menu: <strong>Appearance → Menus</strong> (or <strong>Appearance → Editor → Navigation</strong>) → Custom Link → <code><?php echo esc_html($page_url); ?></code>.</p></div>
			<?php endif; ?>

			<form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
				<input type="hidden" name="action" value="mcuire_cc_save">
				<?php wp_nonce_field('mcuire_cc_settings'); ?>

				<h2>Stripe accounts</h2>
				<p>Add one row per Stripe account. In the course admin, each course chooses which account it pays into
				(<em>Courses &amp; prices → Pay into Stripe account</em>). The first account is used when a course doesn’t choose.<br>
				In Stripe: <strong>Developers → API keys</strong> for the secret key, and <strong>Developers → Webhooks → Add endpoint</strong>
				with the webhook address shown below and the events <code>checkout.session.completed</code> and <code>charge.refunded</code>.</p>
				<table class="widefat striped" style="max-width:1100px">
					<thead><tr><th style="width:140px">Name</th><th>Secret key</th><th>Webhook signing secret</th><th>Webhook address (paste into Stripe)</th><th style="width:60px">Remove</th></tr></thead>
					<tbody>
					<?php $i = 0; foreach ($rows as $name => $a) : $saved = $name !== ''; ?>
						<tr>
							<td>
								<input type="hidden" name="acct[<?php echo (int) $i; ?>][original]" value="<?php echo esc_attr($name); ?>">
								<input type="text" name="acct[<?php echo (int) $i; ?>][name]" value="<?php echo esc_attr($saved ? $name : ''); ?>" placeholder="<?php echo $accounts ? 'e.g. soups' : 'default'; ?>" style="width:120px">
							</td>
							<td>
								<input type="password" autocomplete="off" name="acct[<?php echo (int) $i; ?>][secret]" value="" placeholder="<?php echo $saved ? esc_attr('Saved (' . (strpos($a['secret'], 'live') !== false ? 'live' : 'test') . ' …' . substr($a['secret'], -4) . '). Leave blank to keep.') : 'sk_live_… or sk_test_…'; ?>" style="width:100%">
							</td>
							<td>
								<input type="password" autocomplete="off" name="acct[<?php echo (int) $i; ?>][webhook]" value="" placeholder="<?php echo $saved ? ($a['webhook'] ? 'Saved. Leave blank to keep.' : 'whsec_… (needed!)') : 'whsec_…'; ?>" style="width:100%">
							</td>
							<td><?php if ($saved) : ?><code style="font-size:11px"><?php echo esc_html(rest_url('mcuire/v1/api/stripe/webhook' . ($name === 'default' ? '' : '/' . $name))); ?></code><?php else : ?><span class="description">Shown after saving</span><?php endif; ?></td>
							<td><?php if ($saved) : ?><input type="checkbox" name="acct[<?php echo (int) $i; ?>][delete]" value="1"><?php endif; ?></td>
						</tr>
					<?php $i++; endforeach; ?>
					</tbody>
				</table>
				<p class="description">Keys are stored in your WordPress database and are never shown again or sent anywhere except Stripe. Test first with <code>sk_test_</code> keys and card 4242 4242 4242 4242.</p>

				<h2>Who manages the academy</h2>
				<table class="form-table">
					<tr><th>Owners (full admin)</th><td><input type="text" class="regular-text" name="admin_emails" value="<?php echo esc_attr(get_option('mcuire_cc_admin_emails', '')); ?>"><p class="description">Comma-separated emails. WordPress administrators are always owners too.</p></td></tr>
					<tr><th>Kitchen staff</th><td><input type="text" class="regular-text" name="staff_emails" value="<?php echo esc_attr(get_option('mcuire_cc_staff_emails', '')); ?>"><p class="description">Can edit recipes and photos, not prices or customers.</p></td></tr>
				</table>

				<h2>Website look</h2>
				<table class="form-table">
					<tr><th>Mcuire site style</th><td><label><input type="checkbox" name="site_style" value="1" <?php checked(get_option('mcuire_cc_site_style', '1'), '1'); ?>> Use the polished header, footer and animations on the whole website</label><p class="description">Woven kente edges, a header that stays handy while scrolling, a full-screen phone menu, Call / Reserve buttons on phones, and gentle animations as visitors scroll. Untick to go back to the theme's original look. Your pages and text are not changed either way.</p></td></tr>
					<tr><th>Restaurant phone</th><td><input type="text" class="regular-text" name="phone" value="<?php echo esc_attr(get_option('mcuire_cc_phone', '(905) 324-8091')); ?>"><p class="description">Used by the Call button on phones.</p></td></tr>
				</table>

				<h2>Testing</h2>
				<table class="form-table">
					<tr><th>Free test purchases</th><td><label><input type="checkbox" name="test_purchases" value="1" <?php checked(get_option('mcuire_cc_test_purchases'), '1'); ?>> Let checkout unlock courses <strong>without payment</strong> while no Stripe account is added.</label><p class="description">For trying the full flow before Stripe is ready. Turn it off before you announce the courses.</p></td></tr>
					<tr><th>Photo briefs</th><td><label><input type="checkbox" name="show_briefs" value="1" <?php checked((bool) get_option('mcuire_cc_show_briefs', true)); ?>> Show “what to photograph” notes on photo placeholders</label><p class="description">Turn off once your own photos are uploaded.</p></td></tr>
				</table>

				<?php submit_button('Save settings'); ?>
			</form>
		</div>
		<?php
	}
}

Mcuire_CC_Admin::init();
