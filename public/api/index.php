<?php
// MindLedger API — reuses the Mentra database and admin_users for login.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond($code, $payload) {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

function fail($code, $message) {
    respond($code, ['success' => false, 'error' => $message]);
}

set_exception_handler(function ($e) {
    error_log('MindLedger API: ' . $e->getMessage());
    fail(500, 'Server error');
});

// Mentra's config lives in public_html/config; this file is public_html/<slug>/api/index.php
$configPath = dirname(__DIR__, 2) . '/config/Database.php';
if (!file_exists($configPath)) {
    fail(500, 'Mentra config/Database.php not found at ' . $configPath);
}
require_once $configPath;

$pdo = (new Database())->getConnection();

$pdo->exec("CREATE TABLE IF NOT EXISTS ml_tokens (
    token CHAR(64) PRIMARY KEY,
    admin_id INT NOT NULL,
    expires_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$pdo->exec("CREATE TABLE IF NOT EXISTS ml_records (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    client_id VARCHAR(64) NULL,
    data LONGTEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_type_client (type, client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];
$path = trim($_GET['path'] ?? '', '/');
$parts = $path === '' ? [] : explode('/', $path);
$raw = json_decode(file_get_contents('php://input') ?: 'null');
$body = is_object($raw) ? $raw : new stdClass();

function userPayload($row, $token = null) {
    $p = [
        'id' => (string)$row['id'],
        'name' => $row['full_name'] ?: $row['username'],
        'email' => $row['email'],
        'username' => $row['username'],
        'role' => 'owner',
        'clinic_id' => 'clinic_1',
    ];
    if ($token) $p['token'] = $token;
    return $p;
}

// ---- Auth ----
if ($parts === ['auth', 'login'] && $method === 'POST') {
    $login = trim((string)($body->email ?? ''));
    $password = (string)($body->password ?? '');
    if ($login === '' || $password === '') fail(400, 'Username and password required');

    $stmt = $pdo->prepare('SELECT id, username, password_hash, email, full_name FROM admin_users WHERE username = ? OR email = ? LIMIT 1');
    $stmt->execute([$login, $login]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        fail(401, 'Invalid username or password');
    }

    $pdo->exec('DELETE FROM ml_tokens WHERE expires_at < NOW()');
    $token = bin2hex(random_bytes(32));
    $pdo->prepare('INSERT INTO ml_tokens (token, admin_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 12 HOUR))')
        ->execute([$token, $user['id']]);

    respond(200, ['success' => true, 'data' => userPayload($user, $token)]);
}

$headers = function_exists('getallheaders') ? array_change_key_case(getallheaders(), CASE_LOWER) : [];
$token = $headers['x-auth-token'] ?? ($_SERVER['HTTP_X_AUTH_TOKEN'] ?? '');
$stmt = $pdo->prepare('SELECT a.id, a.username, a.email, a.full_name FROM ml_tokens t JOIN admin_users a ON a.id = t.admin_id WHERE t.token = ? AND t.expires_at > NOW()');
$stmt->execute([$token]);
$me = $stmt->fetch();
if (!$me) fail(401, 'Not authenticated');

if ($parts === ['auth', 'logout'] && $method === 'POST') {
    $pdo->prepare('DELETE FROM ml_tokens WHERE token = ?')->execute([$token]);
    respond(200, ['success' => true]);
}

if ($parts === ['auth', 'me'] && $method === 'GET') {
    respond(200, ['success' => true, 'data' => userPayload($me)]);
}

// ---- Records ----
function listRecords($pdo, $type, $clientId = null) {
    if ($clientId === null) {
        $stmt = $pdo->prepare('SELECT data FROM ml_records WHERE type = ? ORDER BY created_at');
        $stmt->execute([$type]);
    } else {
        $stmt = $pdo->prepare('SELECT data FROM ml_records WHERE type = ? AND client_id = ? ORDER BY created_at');
        $stmt->execute([$type, $clientId]);
    }
    return array_map(fn($r) => json_decode($r['data']), $stmt->fetchAll());
}

function getRecord($pdo, $type, $id) {
    $stmt = $pdo->prepare('SELECT data FROM ml_records WHERE type = ? AND id = ?');
    $stmt->execute([$type, $id]);
    $row = $stmt->fetch();
    return $row ? json_decode($row['data']) : null;
}

function createRecord($pdo, $type, $data, $clientId = null) {
    $id = is_string($data->id ?? null) ? $data->id : '';
    if (!preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id)) {
        $id = $type . '_' . bin2hex(random_bytes(8));
    }
    $data->id = $id;
    if ($clientId !== null) $data->client_id = $clientId;
    $pdo->prepare('INSERT INTO ml_records (id, type, client_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())')
        ->execute([$id, $type, $clientId, json_encode($data)]);
    return $data;
}

function updateRecord($pdo, $type, $id, $changes) {
    $current = getRecord($pdo, $type, $id);
    if ($current === null) fail(404, ucfirst($type) . ' not found');
    $merged = (object) array_merge((array) $current, (array) $changes);
    $merged->id = $id;
    if (isset($current->client_id)) $merged->client_id = $current->client_id;
    $pdo->prepare('UPDATE ml_records SET data = ?, updated_at = NOW() WHERE type = ? AND id = ?')
        ->execute([json_encode($merged), $type, $id]);
    return $merged;
}

$n = count($parts);
$ok = fn($data) => respond(200, ['success' => true, 'data' => $data]);

if ($parts === ['clients']) {
    if ($method === 'GET') $ok(listRecords($pdo, 'client'));
    if ($method === 'POST') $ok(createRecord($pdo, 'client', $body));
}

if ($n === 2 && $parts[0] === 'clients') {
    if ($method === 'GET') {
        $c = getRecord($pdo, 'client', $parts[1]);
        $c ? $ok($c) : fail(404, 'Client not found');
    }
    if ($method === 'PUT') $ok(updateRecord($pdo, 'client', $parts[1], $body));
}

if ($n >= 3 && $parts[0] === 'clients' && in_array($parts[2], ['notes', 'assessments'], true)) {
    $type = $parts[2] === 'notes' ? 'note' : 'assessment';
    $clientId = $parts[1];
    if (!getRecord($pdo, 'client', $clientId)) fail(404, 'Client not found');
    if ($n === 3 && $method === 'GET') $ok(listRecords($pdo, $type, $clientId));
    if ($n === 3 && $method === 'POST') $ok(createRecord($pdo, $type, $body, $clientId));
    if ($n === 4 && $method === 'PUT') $ok(updateRecord($pdo, $type, $parts[3], $body));
}

if ($n === 3 && $parts[0] === 'assessments' && $parts[2] === 'responses' && $method === 'PUT') {
    $ok(updateRecord($pdo, 'assessment', $parts[1], $body));
}

if ($parts === ['reports'] && $method === 'GET') {
    $ok([
        'clients' => listRecords($pdo, 'client'),
        'notes' => listRecords($pdo, 'note'),
        'assessments' => listRecords($pdo, 'assessment'),
    ]);
}

fail(404, 'Unknown endpoint: ' . $method . ' /' . $path);
