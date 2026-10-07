<?php
// MindLedger API: PHP + MySQL backend for the MindLedger web app.
// All access control is enforced here; the browser is never trusted.

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

// Fallbacks for hosts without the mbstring extension or on PHP 7.x.
if (!function_exists('mb_substr')) {
    function mb_substr(string $s, int $start, ?int $length = null): string
    {
        if (preg_match_all('/./us', $s, $m) === false) {
            return substr($s, $start, $length ?? strlen($s));
        }
        return implode('', array_slice($m[0], $start, $length));
    }
}
if (!function_exists('mb_strlen')) {
    function mb_strlen(string $s): int
    {
        $n = preg_match_all('/./us', $s);
        return $n === false ? strlen($s) : $n;
    }
}
if (!function_exists('str_starts_with')) {
    function str_starts_with(string $haystack, string $needle): bool
    {
        return strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}

const CONSENT_VERSION = 'DPDP-V1.2-2024';
const SESSION_HOURS = 12;
const STAFF_ROLES = ['clinician', 'psychologist', 'front_desk', 'coordinator'];
const CLINICIAN_ROLES = ['clinician', 'psychologist'];
const COORDINATOR_ROLES = ['front_desk', 'coordinator'];

final class ApiError extends Exception
{
    public $status;
    public $codeName;

    public function __construct(int $status, string $message, string $codeName = 'error')
    {
        parent::__construct($message);
        $this->status = $status;
        $this->codeName = $codeName;
    }
}

function respond(int $status, array $payload)
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(int $status, string $message, string $code = 'error')
{
    throw new ApiError($status, $message, $code);
}

set_exception_handler(function (Throwable $e) {
    if ($e instanceof ApiError) {
        respond($e->status, ['ok' => false, 'error' => $e->getMessage(), 'code' => $e->codeName]);
    }
    error_log('MindLedger API: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    $detail = get_class($e) . ': ' . $e->getMessage() . ' (line ' . $e->getLine() . ', PHP ' . PHP_VERSION . ')';
    respond(500, ['ok' => false, 'error' => 'Server error: ' . substr($detail, 0, 400), 'code' => 'server_error']);
});

// ------------------------------------------------------------------ Setup

$config = require __DIR__ . '/config.php';
date_default_timezone_set($config['timezone'] ?? 'Asia/Kolkata');

function db(): PDO
{
    static $pdo = null;
    global $config;
    if ($pdo) {
        return $pdo;
    }
    if (empty($config['db_name']) || empty($config['db_user'])) {
        fail(503, 'Database details are missing in mindledger/api/config.php.', 'not_configured');
    }
    try {
        $pdo = new PDO(
            'mysql:host=' . $config['db_host'] . ';dbname=' . $config['db_name'] . ';charset=utf8mb4',
            $config['db_user'],
            $config['db_pass'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
    } catch (PDOException $e) {
        error_log('MindLedger DB connect: ' . $e->getMessage());
        fail(503, 'Cannot connect to the database: ' . $e->getMessage(), 'db_error');
    }
    return $pdo;
}

function migrate(): void
{
    $pdo = db();
    // An earlier MindLedger build created ml_records with a different layout; keep it under another name.
    $legacy = $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ml_records'")->fetchColumn() > 0
        && $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ml_records' AND COLUMN_NAME = 'kind'")->fetchColumn() == 0;
    if ($legacy) {
        $pdo->exec('RENAME TABLE ml_records TO ml_records_legacy_' . date('YmdHis'));
    }
    $pdo->exec("CREATE TABLE IF NOT EXISTS ml_clinics (
        id VARCHAR(32) PRIMARY KEY,
        owner_id VARCHAR(32) NOT NULL,
        data LONGTEXT NOT NULL,
        created_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS ml_users (
        id VARCHAR(32) PRIMARY KEY,
        clinic_id VARCHAR(32) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        data LONGTEXT NOT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL,
        INDEX idx_clinic (clinic_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS ml_sessions (
        token_hash CHAR(64) PRIMARY KEY,
        user_id VARCHAR(32) NOT NULL,
        expires_at DATETIME NOT NULL,
        INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS ml_records (
        id VARCHAR(64) PRIMARY KEY,
        kind VARCHAR(20) NOT NULL,
        clinic_id VARCHAR(32) NOT NULL,
        client_id VARCHAR(32) NULL,
        assigned_clinician_id VARCHAR(32) NULL,
        clinician_id VARCHAR(32) NULL,
        data LONGTEXT NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_kind_clinic (kind, clinic_id),
        INDEX idx_client (client_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS ml_login_attempts (
        ip VARCHAR(64) NOT NULL,
        attempted_at DATETIME NOT NULL,
        INDEX idx_ip_time (ip, attempted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $hasExternal = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ml_users' AND COLUMN_NAME = 'external_id'")->fetchColumn() > 0;
    if (!$hasExternal) {
        $pdo->exec('ALTER TABLE ml_users ADD COLUMN external_id VARCHAR(40) NULL, ADD UNIQUE INDEX idx_external (external_id)');
    }
}

// ------------------------------------------------------------------ Helpers

function newId(): string
{
    return bin2hex(random_bytes(10));
}

function nowSql(): string
{
    return date('Y-m-d H:i:s');
}

function isoNow(): string
{
    return gmdate('Y-m-d\TH:i:s\Z');
}

function displayDate(?int $ts = null): string
{
    return date('j M Y', $ts ?? time());
}

function displayDateTime(?int $ts = null): string
{
    return date('j M Y, g:i A', $ts ?? time());
}

function str(array $body, string $key, int $max = 2000): string
{
    $v = $body[$key] ?? '';
    if (!is_string($v) && !is_numeric($v)) {
        return '';
    }
    return mb_substr(trim((string)$v), 0, $max);
}

function input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        fail(400, 'Invalid request body.');
    }
    return $data;
}

function isOwnerRole(array $u): bool
{
    return $u['role'] === 'owner';
}

function isClinicianRole(array $u): bool
{
    return in_array($u['role'], CLINICIAN_ROLES, true);
}

function isCoordinatorRole(array $u): bool
{
    return in_array($u['role'], COORDINATOR_ROLES, true);
}

function publicUser(array $row): array
{
    $data = json_decode($row['data'], true) ?: [];
    return array_merge($data, [
        'id' => $row['id'],
        'clinic_id' => $row['clinic_id'],
        'email' => $row['email'],
        'role' => $row['role'],
    ]);
}

function loadClinic(string $clinicId): array
{
    $stmt = db()->prepare('SELECT id, owner_id, data FROM ml_clinics WHERE id = ?');
    $stmt->execute([$clinicId]);
    $row = $stmt->fetch();
    if (!$row) {
        fail(404, 'Clinic not found.');
    }
    return array_merge(json_decode($row['data'], true) ?: [], ['id' => $row['id'], 'owner_id' => $row['owner_id']]);
}

function audit(array $actor, string $action, string $entityType, string $entityId, string $details): void
{
    $id = newId();
    saveRecord('audit', [
        'id' => $id,
        'clinic_id' => $actor['clinic_id'],
        'actor_id' => $actor['id'],
        'actor_name' => $actor['name'] ?? '',
        'action' => $action,
        'entity_type' => $entityType,
        'entity_id' => $entityId,
        'timestamp' => isoNow(),
        'details' => $details,
    ], true);
}

// ------------------------------------------------------------------ Records

function saveRecord(string $kind, array $data, bool $insert): void
{
    $now = nowSql();
    if ($insert) {
        $stmt = db()->prepare('INSERT INTO ml_records (id, kind, clinic_id, client_id, assigned_clinician_id, clinician_id, data, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['id'], $kind, $data['clinic_id'], $data['client_id'] ?? null,
            $data['assigned_clinician_id'] ?? null, $data['clinician_id'] ?? null,
            json_encode($data, JSON_UNESCAPED_UNICODE), $now, $now,
        ]);
    } else {
        $stmt = db()->prepare('UPDATE ml_records SET data = ?, client_id = ?, assigned_clinician_id = ?, updated_at = ? WHERE id = ? AND kind = ?');
        $stmt->execute([
            json_encode($data, JSON_UNESCAPED_UNICODE), $data['client_id'] ?? null,
            $data['assigned_clinician_id'] ?? null, $now, $data['id'], $kind,
        ]);
    }
}

// JSON objects decode to PHP arrays, so empty objects must be restored before sending them back.
function decodeRecord(string $json): array
{
    $d = json_decode($json, true) ?: [];
    if (array_key_exists('content', $d) && $d['content'] === []) {
        $d['content'] = new stdClass();
    }
    return $d;
}

function getRecord(string $kind, string $id, string $clinicId, bool $forUpdate = false): ?array
{
    $sql = 'SELECT data FROM ml_records WHERE id = ? AND kind = ? AND clinic_id = ?' . ($forUpdate ? ' FOR UPDATE' : '');
    $stmt = db()->prepare($sql);
    $stmt->execute([$id, $kind, $clinicId]);
    $row = $stmt->fetch();
    return $row ? decodeRecord($row['data']) : null;
}

function listRecords(string $kind, string $clinicId, ?string $where = null, array $params = []): array
{
    $sql = 'SELECT data FROM ml_records WHERE kind = ? AND clinic_id = ?' . ($where ? " AND ($where)" : '') . ' ORDER BY created_at DESC';
    $stmt = db()->prepare($sql);
    $stmt->execute(array_merge([$kind, $clinicId], $params));
    return array_map(fn($r) => decodeRecord($r['data']), $stmt->fetchAll());
}

function visibleClient(array $me, string $clientId, bool $forUpdate = false): array
{
    $client = getRecord('client', $clientId, $me['clinic_id'], $forUpdate);
    if (!$client) {
        fail(404, 'Client not found.');
    }
    if (isClinicianRole($me) && $client['assigned_clinician_id'] !== $me['id']) {
        fail(403, 'This client is not in your caseload.');
    }
    return $client;
}

function canSeeClinical(array $me, array $record): bool
{
    if (isOwnerRole($me)) {
        return true;
    }
    if (isClinicianRole($me)) {
        return ($record['clinician_id'] ?? null) === $me['id'] || ($record['assigned_clinician_id'] ?? null) === $me['id'];
    }
    return false;
}

function clinicalRecord(array $me, string $kind, string $id, bool $forUpdate = false): array
{
    $record = getRecord($kind, $id, $me['clinic_id'], $forUpdate);
    if (!$record || !canSeeClinical($me, $record)) {
        fail(404, $kind === 'note' ? 'Session note not found.' : 'Assessment not found.');
    }
    return $record;
}

// ------------------------------------------------------------------ Auth

function clientIp(): string
{
    return substr($_SERVER['REMOTE_ADDR'] ?? 'unknown', 0, 64);
}

function tooManyAttempts(): bool
{
    db()->prepare('DELETE FROM ml_login_attempts WHERE attempted_at < ?')->execute([date('Y-m-d H:i:s', time() - 900)]);
    $stmt = db()->prepare('SELECT COUNT(*) FROM ml_login_attempts WHERE ip = ?');
    $stmt->execute([clientIp()]);
    return (int)$stmt->fetchColumn() >= 10;
}

function startSession(string $userId): string
{
    $token = bin2hex(random_bytes(32));
    db()->prepare('DELETE FROM ml_sessions WHERE expires_at < ?')->execute([nowSql()]);
    db()->prepare('INSERT INTO ml_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
        ->execute([hash('sha256', $token), $userId, date('Y-m-d H:i:s', time() + SESSION_HOURS * 3600)]);
    return $token;
}

function bearerToken(): string
{
    $token = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
    return preg_match('/^[a-f0-9]{64}$/', $token) ? $token : '';
}

function currentUser(bool $required = true): ?array
{
    $token = bearerToken();
    if ($token !== '') {
        $stmt = db()->prepare('SELECT u.* FROM ml_sessions s JOIN ml_users u ON u.id = s.user_id
            WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1');
        $stmt->execute([hash('sha256', $token), nowSql()]);
        $row = $stmt->fetch();
        if ($row) {
            db()->prepare('UPDATE ml_sessions SET expires_at = ? WHERE token_hash = ?')
                ->execute([date('Y-m-d H:i:s', time() + SESSION_HOURS * 3600), hash('sha256', $token)]);
            return publicUser($row);
        }
    }
    if ($required) {
        fail(401, 'Your session has ended. Please sign in again.', 'unauthenticated');
    }
    return null;
}

function requireOwner(array $me): void
{
    if (!isOwnerRole($me)) {
        fail(403, 'Only the clinic owner can do that.');
    }
}

function validPassword(string $password): void
{
    if (mb_strlen($password) < 8) {
        fail(400, 'Password must be at least 8 characters long.');
    }
}

// ------------------------------------------------------------------ Assessments

function assessmentDefinitions(): array
{
    return [
        'PHQ9' => ['questions' => 9, 'max' => 27, 'bands' => [[0, 4, 'Minimal'], [5, 9, 'Mild'], [10, 14, 'Moderate'], [15, 19, 'Moderately Severe'], [20, 27, 'Severe']]],
        'GAD7' => ['questions' => 7, 'max' => 21, 'bands' => [[0, 4, 'Minimal'], [5, 9, 'Mild'], [10, 14, 'Moderate'], [15, 21, 'Severe']]],
    ];
}

function getAssessmentByToken(string $token, bool $forUpdate = false): ?array
{
    if (!preg_match('/^[a-f0-9]{48}$/', $token)) {
        return null;
    }
    $stmt = db()->prepare("SELECT data FROM ml_records WHERE id = ? AND kind = 'assessment'" . ($forUpdate ? ' FOR UPDATE' : ''));
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    return $row ? decodeRecord($row['data']) : null;
}

// ------------------------------------------------------------------ Mentra website sync
// Psychologists listed on the website become MindLedger psychologists, and paid or
// confirmed website bookings become client files and sessions. Clients are matched by
// phone or email, so a follow-up booking lands in the same file with all earlier notes.

function mentraTablesExist(): bool
{
    $n = db()->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('psychologists', 'bookings')")->fetchColumn();
    return (int)$n === 2;
}

function phoneKey(?string $phone): string
{
    $digits = preg_replace('/\D/', '', (string)$phone);
    return strlen($digits) >= 10 ? substr($digits, -10) : '';
}

function syncMentraPsychologists(string $clinicId): array
{
    $pdo = db();
    $map = [];
    $rows = $pdo->query('SELECT id, slug, name, email, phone, photo_url, registration_number, is_active FROM psychologists')->fetchAll();
    foreach ($rows as $p) {
        $externalId = 'mentra-psy-' . $p['id'];
        $email = strtolower(trim((string)$p['email']));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $email = '';
        }
        $stmt = $pdo->prepare('SELECT * FROM ml_users WHERE external_id = ?');
        $stmt->execute([$externalId]);
        $user = $stmt->fetch();
        if (!$user && $email !== '') {
            // A staff account added by hand with the same email is linked rather than duplicated.
            $stmt = $pdo->prepare("SELECT * FROM ml_users WHERE email = ? AND clinic_id = ? AND role IN ('clinician', 'psychologist') AND external_id IS NULL");
            $stmt->execute([$email, $clinicId]);
            $user = $stmt->fetch();
            if ($user) {
                $pdo->prepare('UPDATE ml_users SET external_id = ? WHERE id = ?')->execute([$externalId, $user['id']]);
            }
        }

        $photo = (string)$p['photo_url'];
        if ($photo !== '' && !preg_match('#^(https?:)?//#', $photo)) {
            $photo = '/' . ltrim($photo, '/');
        }

        if (!$user) {
            $loginEmail = $email;
            if ($loginEmail === '') {
                $loginEmail = preg_replace('/[^a-z0-9.-]/', '', strtolower((string)$p['slug'])) . '@psychologist.mentracare.in';
            }
            $taken = $pdo->prepare('SELECT COUNT(*) FROM ml_users WHERE email = ?');
            $taken->execute([$loginEmail]);
            if ((int)$taken->fetchColumn() > 0) {
                $loginEmail = 'psychologist-' . $p['id'] . '@psychologist.mentracare.in';
            }
            $id = newId();
            $profile = array_filter([
                'name' => (string)$p['name'],
                'phone' => (string)$p['phone'],
                'license_number' => (string)$p['registration_number'],
                'avatar_url' => $photo,
                'color' => '#2A9D8F',
                'from_website' => true,
                'needs_password' => true,
                'placeholder_email' => $email === '',
            ], fn($v) => $v !== '' && $v !== false);
            $profile['phone'] = $profile['phone'] ?? '';
            // Unusable random password until the owner sets one in Clinic Settings.
            $pdo->prepare('INSERT INTO ml_users (id, clinic_id, email, password_hash, role, data, created_at, external_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                ->execute([$id, $clinicId, $loginEmail, password_hash(bin2hex(random_bytes(24)), PASSWORD_DEFAULT), 'clinician', json_encode($profile, JSON_UNESCAPED_UNICODE), nowSql(), $externalId]);
            $map[(int)$p['id']] = $id;
            continue;
        }

        $map[(int)$p['id']] = $user['id'];
        $profile = json_decode($user['data'], true) ?: [];
        $updated = array_merge($profile, array_filter([
            'name' => (string)$p['name'],
            'phone' => (string)$p['phone'],
            'license_number' => (string)$p['registration_number'],
            'avatar_url' => $photo,
        ], fn($v) => $v !== ''), ['from_website' => true]);
        $newEmail = $user['email'];
        if ($email !== '' && $email !== $user['email']) {
            $taken = $pdo->prepare('SELECT COUNT(*) FROM ml_users WHERE email = ?');
            $taken->execute([$email]);
            if ((int)$taken->fetchColumn() === 0) {
                $newEmail = $email;
                unset($updated['placeholder_email']);
            }
        }
        if ($updated != $profile || $newEmail !== $user['email']) {
            $pdo->prepare('UPDATE ml_users SET data = ?, email = ? WHERE id = ?')
                ->execute([json_encode($updated, JSON_UNESCAPED_UNICODE), $newEmail, $user['id']]);
        }
    }
    return $map;
}

function findClientForBooking(string $clinicId, array $b): ?array
{
    $phone = phoneKey($b['client_phone'] ?? '');
    $email = strtolower(trim((string)($b['client_email'] ?? '')));
    foreach (listRecords('client', $clinicId) as $c) {
        if (!empty($c['anonymized'])) {
            continue;
        }
        if (($phone !== '' && phoneKey($c['phone'] ?? '') === $phone) || ($email !== '' && strtolower((string)($c['email'] ?? '')) === $email)) {
            return $c;
        }
    }
    return null;
}

function reassignClient(array $client, string $clinicianId): array
{
    $client['assigned_clinician_id'] = $clinicianId;
    saveRecord('client', $client, false);
    foreach (['note', 'assessment', 'session'] as $kind) {
        foreach (listRecords($kind, $client['clinic_id'], 'client_id = ?', [$client['id']]) as $r) {
            if (($r['assigned_clinician_id'] ?? null) !== $clinicianId) {
                $r['assigned_clinician_id'] = $clinicianId;
                saveRecord($kind, $r, false);
            }
        }
    }
    return $client;
}

function syncMentra(): void
{
    $pdo = db();
    if (!mentraTablesExist()) {
        return;
    }
    $clinicId = $pdo->query('SELECT id FROM ml_clinics ORDER BY created_at LIMIT 1')->fetchColumn();
    if (!$clinicId) {
        return;
    }
    if ((int)$pdo->query("SELECT GET_LOCK('mindledger_mentra_sync', 0)")->fetchColumn() !== 1) {
        return;
    }
    try {
        $psyMap = syncMentraPsychologists($clinicId);

        $state = getRecord('sync', 'mentra-sync', $clinicId);
        $since = $state['bookings_updated_at'] ?? '1970-01-01 00:00:00';
        $stmt = $pdo->prepare('SELECT * FROM bookings WHERE updated_at >= ? ORDER BY slot_date, start_time, id');
        $stmt->execute([$since]);
        $latest = $since;

        foreach ($stmt->fetchAll() as $b) {
            if ($b['updated_at'] > $latest) {
                $latest = $b['updated_at'];
            }
            $sessionId = 'mb-' . $b['id'];
            $existing = getRecord('session', $sessionId, $clinicId);
            $cancelled = in_array($b['booking_status'], ['cancelled', 'no_show'], true) || in_array($b['payment_status'], ['failed', 'cancelled'], true);
            $eligible = !$cancelled && (in_array($b['booking_status'], ['confirmed', 'completed'], true) || $b['payment_status'] === 'completed');
            $clinicianId = $psyMap[(int)$b['psychologist_id']] ?? null;
            if (!$clinicianId) {
                continue;
            }
            if (!$existing && !$eligible) {
                continue;
            }

            $pdo->beginTransaction();
            if ($existing) {
                $client = getRecord('client', $existing['client_id'], $clinicId);
            } else {
                $client = findClientForBooking($clinicId, $b);
            }
            $bookingAt = $b['slot_date'] . ' ' . $b['start_time'];

            if (!$client) {
                $age = (int)($b['client_age'] ?? 0);
                $client = [
                    'id' => newId(),
                    'clinic_id' => $clinicId,
                    'name' => (string)$b['client_name'],
                    'phone' => (string)$b['client_phone'],
                    'email' => (string)($b['client_email'] ?? ''),
                    'date_of_birth' => '',
                    'age_at_intake' => $age > 0 ? $age : null,
                    'emergency_contact_name' => 'Not provided',
                    'emergency_contact_phone' => 'Not provided',
                    'assigned_clinician_id' => $clinicianId,
                    'is_minor' => $age > 0 && $age < 18,
                    'consent_status' => 'pending',
                    'status' => 'active',
                    'created_at' => substr((string)$b['created_at'], 0, 10),
                    'source' => 'website',
                    'intake_concerns' => (string)($b['client_concerns'] ?? ''),
                    'last_booking_at' => $bookingAt,
                ];
                saveRecord('client', $client, true);
            } elseif (!$cancelled && $bookingAt >= ($client['last_booking_at'] ?? '')) {
                // The most recent booking decides who the client's psychologist is now.
                $client['last_booking_at'] = $bookingAt;
                if (empty($client['intake_concerns']) && !empty($b['client_concerns'])) {
                    $client['intake_concerns'] = (string)$b['client_concerns'];
                }
                if ($client['assigned_clinician_id'] !== $clinicianId) {
                    $client = reassignClient($client, $clinicianId);
                } else {
                    saveRecord('client', $client, false);
                }
            }

            $session = [
                'id' => $sessionId,
                'clinic_id' => $clinicId,
                'client_id' => $client['id'],
                'assigned_clinician_id' => $client['assigned_clinician_id'],
                'clinician_id' => $clinicianId,
                'booking_code' => (string)$b['booking_code'],
                'date' => (string)$b['slot_date'],
                'start_time' => substr((string)$b['start_time'], 0, 5),
                'end_time' => substr((string)$b['end_time'], 0, 5),
                'status' => $cancelled ? 'cancelled' : (string)$b['booking_status'],
                'payment_status' => (string)$b['payment_status'],
                'concerns' => (string)($b['client_concerns'] ?? ''),
                'meet_url' => (string)($b['google_meet_url'] ?? ''),
                'source' => 'website',
            ];
            saveRecord('session', $session, !$existing);
            $pdo->commit();
        }

        $syncState = ['id' => 'mentra-sync', 'clinic_id' => $clinicId, 'bookings_updated_at' => $latest, 'synced_at' => isoNow()];
        saveRecord('sync', $syncState, $state === null);
    } finally {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $pdo->query("SELECT RELEASE_LOCK('mindledger_mentra_sync')");
    }
}

// ------------------------------------------------------------------ Routing

$method = $_SERVER['REQUEST_METHOD'];
$path = trim((string)($_GET['path'] ?? ''), '/');
$parts = $path === '' ? [] : explode('/', $path);
$route = $method . ' ' . preg_replace('/[a-f0-9]{16,64}/', ':id', $path);
$body = in_array($method, ['POST', 'PATCH', 'PUT'], true) ? input() : [];

migrate();

switch ($route) {
    // ---------------------------------------------------------------- status & auth
    case 'GET status': {
        $hasOwner = (int)db()->query("SELECT COUNT(*) FROM ml_users WHERE role = 'owner'")->fetchColumn() > 0;
        $me = currentUser(false);
        respond(200, [
            'ok' => true,
            'needs_setup' => !$hasOwner,
            'user' => $me,
            'clinic' => $me ? loadClinic($me['clinic_id']) : null,
        ]);
    }

    case 'POST auth/setup': {
        $pdo = db();
        $pdo->beginTransaction();
        try {
            if ((int)$pdo->query("SELECT COUNT(*) FROM ml_users WHERE role = 'owner'")->fetchColumn() > 0) {
                fail(409, 'This MindLedger is already set up. Please sign in.');
            }
            $clinicName = str($body, 'clinic_name', 150);
            $ownerName = str($body, 'owner_name', 120);
            $email = strtolower(str($body, 'email', 190));
            $password = (string)($body['password'] ?? '');
            if ($clinicName === '' || $ownerName === '') {
                fail(400, 'Clinic name and owner name are required.');
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                fail(400, 'Please enter a valid email address.');
            }
            validPassword($password);

            $clinicId = newId();
            $ownerId = newId();
            $clinic = [
                'name' => $clinicName,
                'address' => '',
                'data_residency_region' => 'Hostinger MySQL',
                'consent_officer_name' => $ownerName,
                'consent_officer_email' => $email,
                'consent_officer_phone' => '',
                'dpdp_officer_name' => $ownerName,
                'dpdp_officer_email' => $email,
                'phone' => '',
                'email' => $email,
            ];
            $pdo->prepare('INSERT INTO ml_clinics (id, owner_id, data, created_at) VALUES (?, ?, ?, ?)')
                ->execute([$clinicId, $ownerId, json_encode($clinic, JSON_UNESCAPED_UNICODE), nowSql()]);
            $profile = ['name' => $ownerName, 'phone' => '', 'color' => '#5749e2'];
            $pdo->prepare('INSERT INTO ml_users (id, clinic_id, email, password_hash, role, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
                ->execute([$ownerId, $clinicId, $email, password_hash($password, PASSWORD_DEFAULT), 'owner', json_encode($profile, JSON_UNESCAPED_UNICODE), nowSql()]);
            $token = startSession($ownerId);
            $owner = array_merge($profile, ['id' => $ownerId, 'clinic_id' => $clinicId, 'email' => $email, 'role' => 'owner']);
            audit($owner, 'CLINIC_REGISTERED', 'Clinic', $clinicId, "Set up clinic \"$clinicName\" with owner $ownerName ($email).");
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
        respond(201, ['ok' => true, 'token' => $token, 'user' => $owner, 'clinic' => loadClinic($clinicId)]);
    }

    case 'POST auth/login': {
        if (tooManyAttempts()) {
            fail(429, 'Too many sign-in attempts. Please wait 15 minutes and try again.');
        }
        $email = strtolower(str($body, 'email', 190));
        $password = (string)($body['password'] ?? '');
        $stmt = db()->prepare('SELECT * FROM ml_users WHERE email = ?');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        if (!$row || !password_verify($password, $row['password_hash'])) {
            db()->prepare('INSERT INTO ml_login_attempts (ip, attempted_at) VALUES (?, ?)')->execute([clientIp(), nowSql()]);
            fail(401, 'Incorrect email or password.');
        }
        if ((int)$row['active'] !== 1) {
            fail(403, 'Your access has been removed. Please contact your clinic owner.', 'removed');
        }
        if (password_needs_rehash($row['password_hash'], PASSWORD_DEFAULT)) {
            db()->prepare('UPDATE ml_users SET password_hash = ? WHERE id = ?')->execute([password_hash($password, PASSWORD_DEFAULT), $row['id']]);
        }
        $user = publicUser($row);
        $token = startSession($row['id']);
        respond(200, ['ok' => true, 'token' => $token, 'user' => $user, 'clinic' => loadClinic($user['clinic_id'])]);
    }

    case 'POST auth/logout': {
        $token = bearerToken();
        if ($token !== '') {
            db()->prepare('DELETE FROM ml_sessions WHERE token_hash = ?')->execute([hash('sha256', $token)]);
        }
        respond(200, ['ok' => true]);
    }

    case 'POST auth/password': {
        $me = currentUser();
        $stmt = db()->prepare('SELECT password_hash FROM ml_users WHERE id = ?');
        $stmt->execute([$me['id']]);
        if (!password_verify((string)($body['current_password'] ?? ''), (string)$stmt->fetchColumn())) {
            fail(400, 'Your current password is incorrect.');
        }
        $new = (string)($body['new_password'] ?? '');
        validPassword($new);
        db()->prepare('UPDATE ml_users SET password_hash = ? WHERE id = ?')->execute([password_hash($new, PASSWORD_DEFAULT), $me['id']]);
        db()->prepare('DELETE FROM ml_sessions WHERE user_id = ? AND token_hash <> ?')->execute([$me['id'], hash('sha256', bearerToken())]);
        audit($me, 'PASSWORD_CHANGED', 'User', $me['id'], 'Changed own password.');
        respond(200, ['ok' => true]);
    }

    // ---------------------------------------------------------------- data
    case 'GET data': {
        $me = currentUser();
        $cid = $me['clinic_id'];
        try {
            syncMentra();
        } catch (Throwable $e) {
            // A website sync problem must never block access to existing records.
            error_log('MindLedger Mentra sync: ' . $e->getMessage() . ' @ line ' . $e->getLine());
        }
        $stmt = db()->prepare('SELECT * FROM ml_users WHERE clinic_id = ? AND active = 1 ORDER BY created_at');
        $stmt->execute([$cid]);
        $users = array_map('publicUser', $stmt->fetchAll());

        $notes = [];
        $assessments = [];
        $dpdp = [];
        if (isClinicianRole($me)) {
            $clients = listRecords('client', $cid, 'assigned_clinician_id = ?', [$me['id']]);
            $sessions = listRecords('session', $cid, 'assigned_clinician_id = ? OR clinician_id = ?', [$me['id'], $me['id']]);
            $notes = listRecords('note', $cid, 'assigned_clinician_id = ? OR clinician_id = ?', [$me['id'], $me['id']]);
            $assessments = listRecords('assessment', $cid, 'assigned_clinician_id = ? OR clinician_id = ?', [$me['id'], $me['id']]);
        } else {
            $clients = listRecords('client', $cid);
            $sessions = listRecords('session', $cid);
            if (isOwnerRole($me)) {
                $notes = listRecords('note', $cid);
                $assessments = listRecords('assessment', $cid);
                $dpdp = listRecords('dpdp', $cid);
            }
        }
        usort($clients, fn($a, $b) => strcasecmp($a['name'], $b['name']));
        $consents = array_reverse(listRecords('consent', $cid));

        respond(200, [
            'ok' => true,
            'clinic' => loadClinic($cid),
            'users' => $users,
            'clients' => $clients,
            'notes' => $notes,
            'assessments' => $assessments,
            'consentRecords' => $consents,
            'dpdpRequests' => $dpdp,
            'sessions' => $sessions,
            'websiteLinked' => mentraTablesExist(),
        ]);
    }

    // ---------------------------------------------------------------- clinic & staff
    case 'PATCH clinic': {
        $me = currentUser();
        requireOwner($me);
        $clinic = loadClinic($me['clinic_id']);
        $fields = ['name', 'address', 'phone', 'consent_officer_name', 'consent_officer_email', 'consent_officer_phone', 'dpdp_officer_name', 'dpdp_officer_email'];
        foreach ($fields as $f) {
            if (array_key_exists($f, $body)) {
                $clinic[$f] = str($body, $f, 300);
            }
        }
        if (($clinic['name'] ?? '') === '') {
            fail(400, 'Clinic name cannot be empty.');
        }
        $id = $clinic['id'];
        unset($clinic['id'], $clinic['owner_id']);
        db()->prepare('UPDATE ml_clinics SET data = ? WHERE id = ?')->execute([json_encode($clinic, JSON_UNESCAPED_UNICODE), $id]);
        audit($me, 'CLINIC_UPDATED', 'Clinic', $id, 'Updated clinic profile and DPDP officer details.');
        respond(200, ['ok' => true, 'clinic' => loadClinic($id)]);
    }

    case 'POST staff': {
        $me = currentUser();
        requireOwner($me);
        $name = str($body, 'name', 120);
        $email = strtolower(str($body, 'email', 190));
        $role = str($body, 'role', 20);
        $password = (string)($body['password'] ?? '');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            fail(400, 'A name and a valid email address are required.');
        }
        if (!in_array($role, STAFF_ROLES, true)) {
            fail(400, 'Invalid staff role.');
        }
        validPassword($password);
        $avatar = (string)($body['avatar_url'] ?? '');
        if ($avatar !== '' && (!str_starts_with($avatar, 'data:image/jpeg;base64,') || strlen($avatar) > 200000)) {
            fail(400, 'Profile photo could not be used. Please choose another image.');
        }
        $stmt = db()->prepare('SELECT id, active FROM ml_users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            fail(409, 'An account with this email address already exists.');
        }
        $id = newId();
        $profile = array_filter([
            'name' => $name,
            'phone' => str($body, 'phone', 40),
            'license_number' => in_array($role, CLINICIAN_ROLES, true) ? str($body, 'license_number', 60) : '',
            'avatar_url' => $avatar,
            'color' => '#2A9D8F',
        ], fn($v) => $v !== '');
        $profile['phone'] = $profile['phone'] ?? '';
        db()->prepare('INSERT INTO ml_users (id, clinic_id, email, password_hash, role, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
            ->execute([$id, $me['clinic_id'], $email, password_hash($password, PASSWORD_DEFAULT), $role, json_encode($profile, JSON_UNESCAPED_UNICODE), nowSql()]);
        audit($me, 'STAFF_ADDED', 'User', $id, "Added $name ($email) as $role.");
        respond(201, ['ok' => true, 'user' => array_merge($profile, ['id' => $id, 'clinic_id' => $me['clinic_id'], 'email' => $email, 'role' => $role])]);
    }

    case 'POST staff/:id/remove':
    case 'POST staff/:id/password': {
        $me = currentUser();
        requireOwner($me);
        $staffId = $parts[1];
        $stmt = db()->prepare('SELECT * FROM ml_users WHERE id = ? AND clinic_id = ? AND active = 1');
        $stmt->execute([$staffId, $me['clinic_id']]);
        $staff = $stmt->fetch();
        if (!$staff) {
            fail(404, 'Staff member not found.');
        }
        $staffUser = publicUser($staff);
        if ($parts[2] === 'remove') {
            if ($staffId === $me['id'] || $staff['role'] === 'owner') {
                fail(400, 'The clinic owner account cannot be removed.');
            }
            db()->prepare('UPDATE ml_users SET active = 0 WHERE id = ?')->execute([$staffId]);
            db()->prepare('DELETE FROM ml_sessions WHERE user_id = ?')->execute([$staffId]);
            audit($me, 'STAFF_REMOVED', 'User', $staffId, "Removed {$staffUser['name']} ({$staffUser['email']}, {$staff['role']}).");
        } else {
            if ($staff['role'] === 'owner') {
                fail(400, 'Use "Change password" to change your own password.');
            }
            $password = (string)($body['password'] ?? '');
            validPassword($password);
            $profile = json_decode($staff['data'], true) ?: [];
            unset($profile['needs_password']);
            db()->prepare('UPDATE ml_users SET password_hash = ?, data = ? WHERE id = ?')
                ->execute([password_hash($password, PASSWORD_DEFAULT), json_encode($profile, JSON_UNESCAPED_UNICODE), $staffId]);
            db()->prepare('DELETE FROM ml_sessions WHERE user_id = ?')->execute([$staffId]);
            audit($me, 'STAFF_PASSWORD_RESET', 'User', $staffId, "Reset password for {$staffUser['name']}.");
        }
        respond(200, ['ok' => true]);
    }

    // ---------------------------------------------------------------- clients & consent
    case 'POST clients': {
        $me = currentUser();
        if (isClinicianRole($me)) {
            fail(403, 'Psychologists cannot register new clients.');
        }
        $name = str($body, 'name', 150);
        if ($name === '') {
            fail(400, 'Client name is required.');
        }
        $assigned = str($body, 'assigned_clinician_id', 32);
        $stmt = db()->prepare("SELECT id FROM ml_users WHERE id = ? AND clinic_id = ? AND active = 1 AND role IN ('owner', 'clinician', 'psychologist')");
        $stmt->execute([$assigned, $me['clinic_id']]);
        if (!$stmt->fetch()) {
            fail(400, 'Please choose a psychologist for this client.');
        }
        $consent = ($body['consent_status'] ?? '') === 'granted' ? 'granted' : 'pending';
        $isMinor = !empty($body['is_minor']);
        $id = newId();
        $client = [
            'id' => $id,
            'clinic_id' => $me['clinic_id'],
            'name' => $name,
            'phone' => str($body, 'phone', 40),
            'email' => str($body, 'email', 190),
            'date_of_birth' => str($body, 'date_of_birth', 20),
            'emergency_contact_name' => str($body, 'emergency_contact_name', 150),
            'emergency_contact_phone' => str($body, 'emergency_contact_phone', 40),
            'assigned_clinician_id' => $assigned,
            'is_minor' => $isMinor,
            'consent_status' => $consent,
            'status' => 'active',
            'created_at' => date('Y-m-d'),
        ];
        if ($isMinor) {
            $client['guardian_name'] = str($body, 'guardian_name', 150);
            $client['guardian_contact'] = str($body, 'guardian_contact', 60);
        }
        if ($consent === 'granted') {
            $client['consent_timestamp'] = isoNow();
        }
        $pdo = db();
        $pdo->beginTransaction();
        saveRecord('client', $client, true);
        if ($consent === 'granted') {
            $consentId = newId();
            saveRecord('consent', [
                'id' => $consentId,
                'clinic_id' => $me['clinic_id'],
                'client_id' => $id,
                'purpose' => 'Clinical care, record keeping and assessments',
                'consent_text_version' => CONSENT_VERSION,
                'granted_at' => displayDateTime(),
                'ip_address' => 'Recorded at intake by ' . $me['name'],
                'status' => 'granted',
            ], true);
        }
        audit($me, 'CLIENT_CREATED', 'Client', $id, "Registered client file for $name.");
        $pdo->commit();
        respond(201, ['ok' => true, 'client' => $client]);
    }

    case 'POST clients/:id/consent-withdraw': {
        $me = currentUser();
        $pdo = db();
        $pdo->beginTransaction();
        $client = visibleClient($me, $parts[1], true);
        $purpose = str($body, 'purpose', 200) ?: 'All Optional Data Processing';
        $record = [
            'id' => newId(),
            'clinic_id' => $me['clinic_id'],
            'client_id' => $client['id'],
            'purpose' => $purpose,
            'consent_text_version' => CONSENT_VERSION,
            'withdrawn_at' => displayDateTime(),
            'ip_address' => 'Recorded by ' . $me['name'],
            'status' => 'withdrawn',
        ];
        saveRecord('consent', $record, true);
        $client['consent_status'] = 'withdrawn';
        saveRecord('client', $client, false);
        audit($me, 'CONSENT_WITHDRAWN', 'ConsentRecord', $record['id'], "Consent withdrawn for \"$purpose\". Reason: " . str($body, 'reason', 300));
        $pdo->commit();
        respond(200, ['ok' => true, 'record' => $record]);
    }

    case 'POST clients/:id/erase': {
        $me = currentUser();
        requireOwner($me);
        $pdo = db();
        $pdo->beginTransaction();
        $client = visibleClient($me, $parts[1], true);
        $originalName = $client['name'];
        $client = array_merge($client, [
            'name' => 'Anonymized Client #' . substr($client['id'], -4),
            'phone' => '+91-REDACTED',
            'email' => 'redacted@dpdp.erased',
            'emergency_contact_name' => 'REDACTED',
            'emergency_contact_phone' => 'REDACTED',
            'date_of_birth' => 'REDACTED',
            'anonymized' => true,
            'status' => 'inactive',
        ]);
        if (!empty($client['is_minor'])) {
            $client['guardian_name'] = 'REDACTED';
            $client['guardian_contact'] = 'REDACTED';
        }
        saveRecord('client', $client, false);
        foreach (listRecords('dpdp', $me['clinic_id'], 'client_id = ?', [$client['id']]) as $req) {
            if ($req['type'] === 'erasure' && $req['status'] !== 'completed') {
                $req['status'] = 'completed';
                $req['completed_at'] = displayDate();
                $req['processed_by'] = $me['name'];
                saveRecord('dpdp', $req, false);
            }
        }
        foreach (listRecords('assessment', $me['clinic_id'], 'client_id = ?', [$client['id']]) as $a) {
            $a['client_first_name'] = '';
            saveRecord('assessment', $a, false);
        }
        audit($me, 'DPDP_RIGHT_TO_ERASURE_EXECUTED', 'Client', $client['id'], "Erased contact details of $originalName; clinical records anonymized.");
        $pdo->commit();
        respond(200, ['ok' => true]);
    }

    case 'POST dpdp': {
        $me = currentUser();
        $contact = str($body, 'client_contact', 190);
        if ($contact === '') {
            fail(400, 'A phone number or email is required.');
        }
        $type = ($body['type'] ?? '') === 'erasure' ? 'erasure' : 'export';
        $digits = preg_replace('/\D/', '', $contact);
        $matched = null;
        foreach (listRecords('client', $me['clinic_id']) as $c) {
            if (strcasecmp($c['email'] ?? '', $contact) === 0 || (strlen($digits) > 5 && preg_replace('/\D/', '', $c['phone'] ?? '') === $digits)) {
                $matched = $c;
                break;
            }
        }
        $req = [
            'id' => newId(),
            'clinic_id' => $me['clinic_id'],
            'client_id' => $matched['id'] ?? 'unmatched',
            'client_name' => str($body, 'client_name', 150) ?: ($matched['name'] ?? 'Unnamed requester'),
            'client_contact' => $contact,
            'type' => $type,
            'requested_on' => displayDate(),
            'requested_on_iso' => isoNow(),
            'status' => 'pending',
            'notes' => str($body, 'notes', 1000) ?: 'Recorded via Your Data Rights form.',
        ];
        saveRecord('dpdp', $req, true);
        audit($me, 'DPDP_REQUEST_RECORDED', 'DPDPRequest', $req['id'], "$type request recorded for {$req['client_name']}.");
        respond(201, ['ok' => true, 'request' => $req]);
    }

    case 'POST dpdp/:id/complete': {
        $me = currentUser();
        requireOwner($me);
        $req = getRecord('dpdp', $parts[1], $me['clinic_id']);
        if (!$req) {
            fail(404, 'Request not found.');
        }
        $req['status'] = 'completed';
        $req['completed_at'] = displayDate();
        $req['processed_by'] = $me['name'];
        saveRecord('dpdp', $req, false);
        respond(200, ['ok' => true, 'request' => $req]);
    }

    // ---------------------------------------------------------------- session notes
    case 'POST notes': {
        $me = currentUser();
        if (isCoordinatorRole($me)) {
            fail(403, 'Client Coordinators cannot create clinical session notes.');
        }
        $client = visibleClient($me, str($body, 'client_id', 32));
        $appointmentId = str($body, 'appointment_id', 64);
        if ($appointmentId !== '') {
            $session = getRecord('session', $appointmentId, $me['clinic_id']);
            if (!$session || $session['client_id'] !== $client['id']) {
                $appointmentId = '';
            }
        }
        $now = isoNow();
        $note = [
            'id' => newId(),
            'clinic_id' => $me['clinic_id'],
            'client_id' => $client['id'],
            'assigned_clinician_id' => $client['assigned_clinician_id'],
            'clinician_id' => $me['id'],
            'clinician_name' => $me['name'],
            'appointment_id' => $appointmentId !== '' ? $appointmentId : null,
            'status' => 'draft',
            'addenda' => [],
            'created_at' => $now,
            'updated_at' => $now,
        ];
        $note = applyNoteFields($note, $body);
        saveRecord('note', $note, true);
        audit($me, 'NOTE_CREATED', 'SessionNote', $note['id'], "Created a session note for {$client['name']}.");
        respond(201, ['ok' => true, 'note' => $note]);
    }

    case 'PATCH notes/:id': {
        $me = currentUser();
        $pdo = db();
        $pdo->beginTransaction();
        $note = clinicalRecord($me, 'note', $parts[1], true);
        if ($note['status'] !== 'draft') {
            fail(409, 'This note is signed and locked. Add an addendum instead.');
        }
        $note = applyNoteFields($note, $body);
        $note['updated_at'] = isoNow();
        saveRecord('note', $note, false);
        $pdo->commit();
        respond(200, ['ok' => true, 'note' => $note]);
    }

    case 'POST notes/:id/sign': {
        $me = currentUser();
        $pdo = db();
        $pdo->beginTransaction();
        $note = clinicalRecord($me, 'note', $parts[1], true);
        if ($note['status'] !== 'draft') {
            fail(409, 'This note is already signed.');
        }
        $signedIso = isoNow();
        $hash = hash('sha256', json_encode([
            'id' => $note['id'], 'client' => $note['client_id'], 'template' => $note['template_type'] ?? '',
            'content' => $note['content'] ?? [], 'signer' => $me['id'], 'at' => $signedIso,
        ], JSON_UNESCAPED_UNICODE));
        $note = array_merge($note, [
            'status' => 'signed',
            'signed_at' => displayDateTime(),
            'signed_at_iso' => $signedIso,
            'signed_by' => $me['name'],
            'signed_by_id' => $me['id'],
            'signature_hash' => 'SHA256:' . substr($hash, 0, 32),
            'updated_at' => $signedIso,
        ]);
        saveRecord('note', $note, false);
        audit($me, 'NOTE_SIGNED', 'SessionNote', $note['id'], "Signed and locked note ({$note['signature_hash']}).");
        $pdo->commit();
        respond(200, ['ok' => true, 'note' => $note]);
    }

    case 'POST notes/:id/addenda': {
        $me = currentUser();
        $text = str($body, 'text', 5000);
        if ($text === '') {
            fail(400, 'Addendum text cannot be empty.');
        }
        $pdo = db();
        $pdo->beginTransaction();
        $note = clinicalRecord($me, 'note', $parts[1], true);
        if ($note['status'] !== 'signed') {
            fail(409, 'Addenda can only be added to signed notes. Edit the draft instead.');
        }
        $note['addenda'][] = ['id' => 'addendum-' . newId(), 'text' => $text, 'added_by' => $me['name'], 'added_at' => displayDateTime()];
        $note['updated_at'] = isoNow();
        saveRecord('note', $note, false);
        audit($me, 'ADDENDUM_ADDED', 'SessionNote', $note['id'], 'Appended an addendum to a signed note.');
        $pdo->commit();
        respond(200, ['ok' => true, 'note' => $note]);
    }

    // ---------------------------------------------------------------- assessments
    case 'POST assessments': {
        $me = currentUser();
        if (isCoordinatorRole($me)) {
            fail(403, 'Client Coordinators cannot issue clinical assessments.');
        }
        $type = str($body, 'type', 10);
        if (!isset(assessmentDefinitions()[$type])) {
            fail(400, 'Unknown assessment type.');
        }
        $client = visibleClient($me, str($body, 'client_id', 32));
        $token = bin2hex(random_bytes(24));
        $expires = time() + 7 * 86400;
        $clinic = loadClinic($me['clinic_id']);
        $assessment = [
            'id' => $token,
            'clinic_id' => $me['clinic_id'],
            'client_id' => $client['id'],
            'assigned_clinician_id' => $client['assigned_clinician_id'],
            'clinician_id' => $me['id'],
            'type' => $type,
            'sent_at' => isoNow(),
            'secure_link_token' => $token,
            'expires_at' => gmdate('Y-m-d\TH:i:s\Z', $expires),
            'status' => 'pending',
            'client_first_name' => explode(' ', $client['name'])[0],
            'clinic_name' => $clinic['name'] ?? '',
        ];
        saveRecord('assessment', $assessment, true);
        audit($me, 'ASSESSMENT_SENT', 'Assessment', $token, "Issued $type link for {$client['name']}.");
        respond(201, ['ok' => true, 'assessment' => $assessment]);
    }

    case 'GET public/assessment/:id': {
        $a = getAssessmentByToken($parts[2]);
        if (!$a || $a['status'] !== 'pending') {
            fail(404, 'This questionnaire link is not valid, or it has already been submitted.', 'unavailable');
        }
        if (strtotime($a['expires_at']) < time()) {
            fail(410, 'This questionnaire link has expired. Please ask your psychologist for a new link.', 'expired');
        }
        respond(200, ['ok' => true, 'type' => $a['type'], 'client_first_name' => $a['client_first_name'] ?? '', 'clinic_name' => $a['clinic_name'] ?? '']);
    }

    case 'POST public/assessment/:id': {
        $pdo = db();
        $pdo->beginTransaction();
        $a = getAssessmentByToken($parts[2], true);
        if (!$a || $a['status'] !== 'pending') {
            fail(404, 'This questionnaire link is not valid, or it has already been submitted.', 'unavailable');
        }
        if (strtotime($a['expires_at']) < time()) {
            fail(410, 'This questionnaire link has expired. Please ask your psychologist for a new link.', 'expired');
        }
        $def = assessmentDefinitions()[$a['type']];
        $raw = $body['responses'] ?? null;
        if (!is_array($raw)) {
            fail(400, 'Please answer every question.');
        }
        $responses = [];
        for ($i = 1; $i <= $def['questions']; $i++) {
            $v = $raw[(string)$i] ?? $raw[$i] ?? null;
            if (!is_int($v) || $v < 0 || $v > 3) {
                fail(400, 'Please answer every question.');
            }
            $responses[(string)$i] = $v;
        }
        $score = array_sum($responses);
        $band = 'Minimal';
        foreach ($def['bands'] as [$min, $max, $label]) {
            if ($score >= $min && $score <= $max) {
                $band = $label;
            }
        }
        $a = array_merge($a, [
            'responses' => $responses,
            'score' => $score,
            'severity_band' => $band,
            'status' => 'completed',
            'completed_at' => displayDate(),
            'completed_at_iso' => isoNow(),
        ]);
        saveRecord('assessment', $a, false);
        $pdo->commit();
        respond(200, ['ok' => true]);
    }

    default:
        fail(404, 'Unknown request.');
}

function applyNoteFields(array $note, array $body): array
{
    $template = $body['template_type'] ?? ($note['template_type'] ?? 'SOAP');
    $note['template_type'] = in_array($template, ['SOAP', 'DAP', 'Free Text', 'free_text'], true) ? $template : 'SOAP';
    if (isset($body['content']) && is_array($body['content'])) {
        $content = [];
        foreach (['subjective', 'objective', 'assessment', 'plan', 'data', 'text', 'free_text'] as $k) {
            if (isset($body['content'][$k]) && is_string($body['content'][$k])) {
                $content[$k] = mb_substr($body['content'][$k], 0, 20000);
            }
        }
        $note['content'] = (object)$content;
    } elseif (!isset($note['content'])) {
        $note['content'] = (object)[];
    }
    if (array_key_exists('private_notes', $body)) {
        $note['private_notes'] = mb_substr((string)$body['private_notes'], 0, 20000);
    }
    foreach (['duration_minutes', 'duration_seconds'] as $k) {
        if (isset($body[$k]) && is_numeric($body[$k])) {
            $note[$k] = max(0, min(86400, (int)$body[$k]));
        }
    }
    foreach (['started_at', 'ended_at'] as $k) {
        if (isset($body[$k]) && is_string($body[$k])) {
            $note[$k] = mb_substr($body[$k], 0, 40);
        }
    }
    return $note;
}
