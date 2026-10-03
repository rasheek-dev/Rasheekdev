<?php
/**
 * Admin Settings
 */

session_start();

if (!isset($_SESSION['admin_id'])) {
    header('Location: login.php');
    exit;
}

require_once '../config/Config.php';
require_once '../config/Database.php';

$database = new Database();
$pdo = $database->connect();

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $key = $_POST['key'] ?? '';
    $value = $_POST['value'] ?? '';

    if ($key && $value) {
        $stmt = $pdo->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?');

        try {
            $stmt->execute([$key, $value, $value]);
            $message = 'Setting saved successfully!';
        } catch (Exception $e) {
            $error = 'Failed to save setting: ' . $e->getMessage();
        }
    }
}

// Get all settings
$stmt = $pdo->query('SELECT * FROM settings');
$settings = [];
foreach ($stmt->fetchAll() as $s) {
    $settings[$s['setting_key']] = $s['setting_value'];
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settings - Mentra Admin</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
        }

        .navbar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
        }

        .navbar a {
            color: white;
            text-decoration: none;
            padding: 8px 15px;
            background: rgba(255,255,255,0.2);
            border-radius: 5px;
            float: right;
        }

        .sidebar {
            position: fixed;
            left: 0;
            top: 50px;
            width: 250px;
            height: calc(100vh - 50px);
            background: white;
            border-right: 1px solid #eee;
        }

        .sidebar a {
            display: block;
            padding: 15px 20px;
            color: #666;
            text-decoration: none;
        }

        .sidebar a.active {
            background: #f5f7fa;
            color: #667eea;
            border-left: 3px solid #667eea;
        }

        .main-content {
            margin-left: 250px;
            margin-top: 50px;
            padding: 30px;
            max-width: 800px;
        }

        .card {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }

        .message {
            background: #d4edda;
            color: #155724;
            padding: 12px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #28a745;
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 12px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #dc3545;
        }

        .setting-item {
            padding: 15px 0;
            border-bottom: 1px solid #eee;
        }

        .setting-item:last-child {
            border-bottom: none;
        }

        .setting-key {
            font-weight: 600;
            color: #667eea;
            margin-bottom: 5px;
        }

        .setting-value {
            color: #666;
            font-family: monospace;
            background: #f5f7fa;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 10px;
        }

        input, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            font-family: monospace;
        }

        input:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        button {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
        }

        button:hover {
            background: #764ba2;
        }

        .info-text {
            background: #e7f3ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 13px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="navbar">
        <a href="dashboard.php">← Dashboard</a>
        <h1>⚙️ Settings</h1>
    </div>

    <div class="sidebar">
        <a href="dashboard.php">📈 Dashboard</a>
        <a href="psychologists.php">👨‍⚕️ Psychologists</a>
        <a href="bookings.php">📅 Bookings</a>
        <a href="appointments.php">🗓️ Create Appointment</a>
        <a href="settings.php" class="active">⚙️ Settings</a>
        <hr style="margin: 20px; border: none; border-top: 1px solid #eee;">
        <a href="logout.php">🚪 Logout</a>
    </div>

    <div class="main-content">
        <?php if ($message): ?>
            <div class="message"><?= htmlspecialchars($message) ?></div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <div class="card">
            <h2 style="margin-bottom: 20px;">System Settings</h2>

            <div class="info-text">
                ℹ️ These settings are used by the booking system for payments, emails, and notifications.
            </div>

            <h3 style="margin-bottom: 15px; margin-top: 20px;">Razorpay Configuration</h3>
            <div class="setting-item">
                <div class="setting-key">Razorpay Key ID</div>
                <div class="setting-value"><?= htmlspecialchars($settings['razorpay_key_id'] ?? '') ?></div>
                <form method="POST">
                    <input type="hidden" name="key" value="razorpay_key_id">
                    <input type="text" name="value" placeholder="rzp_test_..." value="<?= htmlspecialchars($settings['razorpay_key_id'] ?? '') ?>">
                    <button type="submit" style="margin-top: 10px;">Update</button>
                </form>
            </div>

            <div class="setting-item" style="margin-top: 20px;">
                <div class="setting-key">Razorpay Key Secret</div>
                <div class="setting-value">***<?= substr(htmlspecialchars($settings['razorpay_key_secret'] ?? ''), -4) ?></div>
                <form method="POST">
                    <input type="hidden" name="key" value="razorpay_key_secret">
                    <input type="password" name="value" placeholder="Your secret key">
                    <button type="submit" style="margin-top: 10px;">Update</button>
                </form>
            </div>

            <h3 style="margin-bottom: 15px; margin-top: 30px;">Email Configuration</h3>
            <div class="setting-item">
                <div class="setting-key">From Email</div>
                <div class="setting-value"><?= htmlspecialchars(MAIL_FROM) ?></div>
                <p style="color: #999; font-size: 12px;">Edit config/Config.php to change</p>
            </div>

            <h3 style="margin-bottom: 15px; margin-top: 30px;">Business Details</h3>
            <div class="setting-item">
                <div class="setting-key">Business Name</div>
                <div class="setting-value"><?= htmlspecialchars($settings['business_name'] ?? BUSINESS_NAME) ?></div>
                <form method="POST">
                    <input type="hidden" name="key" value="business_name">
                    <input type="text" name="value" value="<?= htmlspecialchars($settings['business_name'] ?? BUSINESS_NAME) ?>">
                    <button type="submit" style="margin-top: 10px;">Update</button>
                </form>
            </div>

            <div class="setting-item" style="margin-top: 20px;">
                <div class="setting-key">Contact Email</div>
                <div class="setting-value"><?= htmlspecialchars($settings['contact_email'] ?? '') ?></div>
                <form method="POST">
                    <input type="hidden" name="key" value="contact_email">
                    <input type="email" name="value" value="<?= htmlspecialchars($settings['contact_email'] ?? '') ?>">
                    <button type="submit" style="margin-top: 10px;">Update</button>
                </form>
            </div>

            <div class="setting-item" style="margin-top: 20px;">
                <div class="setting-key">Contact Phone</div>
                <div class="setting-value"><?= htmlspecialchars($settings['contact_phone'] ?? '') ?></div>
                <form method="POST">
                    <input type="hidden" name="key" value="contact_phone">
                    <input type="tel" name="value" value="<?= htmlspecialchars($settings['contact_phone'] ?? '') ?>">
                    <button type="submit" style="margin-top: 10px;">Update</button>
                </form>
            </div>

            <div class="setting-item" style="margin-top: 20px;">
                <div class="setting-key">WhatsApp Number</div>
                <div class="setting-value"><?= htmlspecialchars($settings['whatsapp_number'] ?? '') ?></div>
                <form method="POST">
                    <input type="hidden" name="key" value="whatsapp_number">
                    <input type="tel" name="value" value="<?= htmlspecialchars($settings['whatsapp_number'] ?? '') ?>">
                    <button type="submit" style="margin-top: 10px;">Update</button>
                </form>
            </div>
        </div>

        <div class="card">
            <h2>Google Meet Integration</h2>
            <p style="margin: 15px 0; color: #666;">
                Google Meet links are automatically generated for each booking in the format:
                <code style="background: #f5f7fa; padding: 5px 10px; border-radius: 3px;">https://meet.google.com/mentra-[booking-id]</code>
            </p>
            <p style="margin: 15px 0; color: #666;">
                For advanced Google Calendar integration, see INSTALLATION.md
            </p>
        </div>
    </div>
</body>
</html>
