<?php
// One-time setup: verifies the DB connection and creates the first admin account.
// Refuses to create another account once any admin exists.
$configPath = dirname(__DIR__) . '/config/Database.php';

function page($title, $html) {
    echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<title>MindLedger Setup</title><style>'
        . 'body{font-family:system-ui,sans-serif;background:#1d4ed8;margin:0;padding:24px 16px;color:#111}'
        . '.card{max-width:440px;margin:40px auto;background:#fff;border-radius:10px;padding:28px;box-shadow:0 10px 30px rgba(0,0,0,.2)}'
        . 'h1{font-size:22px;margin:0 0 16px}label{display:block;font-size:14px;margin:12px 0 4px}'
        . 'input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:15px}'
        . 'button,.btn{display:inline-block;margin-top:18px;width:100%;box-sizing:border-box;text-align:center;padding:11px;background:#2563eb;color:#fff;border:0;border-radius:6px;font-size:15px;text-decoration:none;cursor:pointer}'
        . '.err{background:#fef2f2;color:#b91c1c;padding:10px;border-radius:6px;margin-bottom:10px}'
        . '.ok{background:#f0fdf4;color:#15803d;padding:10px;border-radius:6px;margin-bottom:10px}'
        . 'code{background:#f3f4f6;padding:1px 4px;border-radius:4px}</style></head><body><div class="card">'
        . '<h1>' . htmlspecialchars($title) . '</h1>' . $html . '</div></body></html>';
    exit;
}

if (!file_exists($configPath)) {
    page('Config not found', '<div class="err">Expected <code>' . htmlspecialchars($configPath)
        . '</code>.</div><p>Upload Mentra\'s <code>config</code> folder to <code>public_html/config/</code>.</p>');
}

function dbFailed($detail) {
    page('Database connection failed', '<div class="err">' . htmlspecialchars($detail ?: 'Could not connect.') . '</div>'
        . '<p>Check the database name, username and password in <code>public_html/config/Database.php</code> '
        . 'match the database you created in Hostinger (hPanel &rarr; Databases &rarr; MySQL Databases).</p>');
}

$pdo = null;
// Mentra's Database::connect() calls die() on failure; turn that into a readable page.
register_shutdown_function(function () use (&$pdo) {
    if ($pdo === null) {
        $out = ob_get_level() ? trim(ob_get_clean()) : '';
        dbFailed($out);
    }
});
ob_start();
require_once $configPath;
try {
    $pdo = (new Database())->getConnection();
} catch (Throwable $e) {
    ob_end_clean();
    dbFailed($e->getMessage());
}
ob_end_clean();

$pdo->exec("CREATE TABLE IF NOT EXISTS admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$appUrl = './';
$adminCount = (int)$pdo->query('SELECT COUNT(*) FROM admin_users')->fetchColumn();
if ($adminCount > 0) {
    page('Setup already complete', '<div class="ok">An admin account already exists.</div>'
        . '<p>Sign in with it. For security, delete <code>setup.php</code> from the server.</p>'
        . '<a class="btn" href="' . $appUrl . '">Go to MindLedger</a>');
}

$error = '';
$v = ['full_name' => '', 'username' => '', 'email' => ''];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach ($v as $k => $_) $v[$k] = trim((string)($_POST[$k] ?? ''));
    $password = (string)($_POST['password'] ?? '');
    if ($v['username'] === '' || $v['email'] === '' || $password === '') {
        $error = 'Username, email and password are required.';
    } elseif (!filter_var($v['email'], FILTER_VALIDATE_EMAIL)) {
        $error = 'Enter a valid email address.';
    } elseif (strlen($password) < 8) {
        $error = 'Password must be at least 8 characters.';
    } elseif ($password !== (string)($_POST['confirm'] ?? '')) {
        $error = 'Passwords do not match.';
    } else {
        $stmt = $pdo->prepare('INSERT INTO admin_users (username, password_hash, email, full_name) VALUES (?, ?, ?, ?)');
        $stmt->execute([$v['username'], password_hash($password, PASSWORD_DEFAULT), $v['email'], $v['full_name'] ?: $v['username']]);
        page('Setup complete', '<div class="ok">Admin account <b>' . htmlspecialchars($v['username']) . '</b> created.</div>'
            . '<p>Now delete <code>setup.php</code> from <code>public_html/mindledger/</code> in File Manager.</p>'
            . '<a class="btn" href="' . $appUrl . '">Go to MindLedger and sign in</a>');
    }
}

$f = fn($k) => htmlspecialchars($v[$k]);
page('MindLedger setup', '<div class="ok">Database connected.</div>'
    . ($error ? '<div class="err">' . htmlspecialchars($error) . '</div>' : '')
    . '<p>Create your admin account. You\'ll use it to sign in to MindLedger (and the Mentra admin panel).</p>'
    . '<form method="post">'
    . '<label>Full name</label><input name="full_name" value="' . $f('full_name') . '">'
    . '<label>Username *</label><input name="username" required value="' . $f('username') . '">'
    . '<label>Email *</label><input name="email" type="email" required value="' . $f('email') . '">'
    . '<label>Password * (min 8 characters)</label><input name="password" type="password" required minlength="8">'
    . '<label>Confirm password *</label><input name="confirm" type="password" required minlength="8">'
    . '<button type="submit">Create admin account</button></form>');
