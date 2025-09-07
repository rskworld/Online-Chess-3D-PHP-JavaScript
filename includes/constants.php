<?php
/**
 * For support, licensing, or custom development inquiries: help@rskworld.in • Phone/WhatsApp: +91 9330539277
 * Website: RSK World • Business Inquiries: help@rskworld.in
 * 🤝 Contributing: Suggestions and improvements are welcome!
 */

// Contact constants used across pages
if (!defined('RSK_CONTACT_EMAIL')) {
    define('RSK_CONTACT_EMAIL', 'help@rskworld.in');
}
if (!defined('RSK_CONTACT_PHONE')) {
    define('RSK_CONTACT_PHONE', '+91 9330539277');
}
if (!defined('RSK_WEBSITE_NAME')) {
    define('RSK_WEBSITE_NAME', 'RSK World');
}

/**
 * Generate the standard RSK World footer HTML block.
 */
function rsk_footer_html(): string {
    $email = htmlspecialchars(RSK_CONTACT_EMAIL, ENT_QUOTES);
    $phone = htmlspecialchars(RSK_CONTACT_PHONE, ENT_QUOTES);
    $site = htmlspecialchars(RSK_WEBSITE_NAME, ENT_QUOTES);

    return '<div class="rsk-footer text-xs text-gray-500 mt-8 px-4 py-3 border-t">'
        . 'For support, licensing, or custom development inquiries: '
        . '<a class="underline" href="mailto:' . $email . '">' . $email . '</a>'
        . ' • Phone/WhatsApp: ' . $phone
        . '<br/>Website: ' . $site
        . ' • Business Inquiries: <a class="underline" href="mailto:' . $email . '">' . $email . '</a>'
        . '<br/>🤝 Contributing: Suggestions and improvements are welcome!'
        . '</div>';
}


