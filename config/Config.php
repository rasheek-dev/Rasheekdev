<?php
/**
 * Application Configuration
 */

define('APP_NAME', 'Mentra');
define('APP_URL', 'https://mentracare.in'); // Update with your domain
define('APP_ENV', 'production'); // 'development' or 'production'

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'ul80950667_mentra_booking');
define('DB_USER', 'ul80950667_mentra_user');
define('DB_PASS', 'Rasheek123#care@2026');

// Razorpay Configuration
// Get your keys from: https://dashboard.razorpay.com/app/keys
define('RAZORPAY_KEY_ID', 'rzp_test_XXXXXXXXXXXXXX'); // Replace with your key
define('RAZORPAY_KEY_SECRET', 'XXXXXXXXXXXXXXXXXXXXXX'); // Replace with your secret

// Email Configuration
define('MAIL_FROM', 'noreply@mentracare.in');
define('MAIL_FROM_NAME', 'Mentra');
define('ADMIN_EMAIL', 'admin@mentracare.in');
define('SUPPORT_EMAIL', 'support@mentracare.in');

// Business Details
define('BUSINESS_NAME', 'Mentra');
define('BUSINESS_PHONE', '+91 XXXXXXXXXX'); // UPDATE THIS
define('BUSINESS_EMAIL', 'contact@mentracare.in');
define('BUSINESS_ADDRESS', 'Your Address'); // UPDATE THIS
define('WHATSAPP_NUMBER', '+91 XXXXXXXXXX'); // UPDATE THIS / Set empty if not available

// Booking Settings
define('REQUIRE_PAYMENT', true); // false = confirm without payment
define('PAYMENT_CURRENCY', 'INR');
define('SESSION_HOLD_MINUTES', 15); // Minutes to hold a slot after order creation
define('ADVANCE_BOOKING_DAYS', 30); // How many days in advance can clients book
define('MIN_LEAD_HOURS', 2); // Minimum hours before a session to book

// Session Configuration
define('SESSION_TIMEOUT', 3600); // 1 hour in seconds
define('REMEMBER_ME_DURATION', 2592000); // 30 days in seconds

// Security
define('HASH_ALGO', 'sha256');
define('API_RATE_LIMIT', 100); // Requests per minute

// Timezone
date_default_timezone_set('Asia/Kolkata');

// Error Reporting
if (APP_ENV === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../logs/error.log');
}

// Create logs directory if it doesn't exist
if (!is_dir(__DIR__ . '/../logs')) {
    mkdir(__DIR__ . '/../logs', 0755, true);
}

// Create uploads directory if it doesn't exist
if (!is_dir(__DIR__ . '/../uploads')) {
    mkdir(__DIR__ . '/../uploads', 0755, true);
}
?>
