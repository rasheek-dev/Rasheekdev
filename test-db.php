<?php
/**
 * Database Connection Test
 * Upload this to your server root and visit: https://mentracare.in/test-db.php
 */

// Test 1: Direct PDO connection
echo "<h2>Testing Database Connection</h2>";

try {
    $host = 'localhost';
    $db_name = 'u180950667_mentra';
    $db_user = 'u180950667_mentra';
    $db_pass = 'PASTE_DATABASE_PASSWORD_HERE';

    $pdo = new PDO(
        'mysql:host=' . $host . ';dbname=' . $db_name . ';charset=utf8mb4',
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    echo "<p style='color: green;'><strong>✅ SUCCESS: Database connected!</strong></p>";

    // Test 2: Check tables
    $tables = $pdo->query("SHOW TABLES")->fetchAll();
    echo "<p>Tables found: " . count($tables) . "</p>";
    echo "<ul>";
    foreach ($tables as $table) {
        $table_name = array_values($table)[0];
        echo "<li>" . $table_name . "</li>";
    }
    echo "</ul>";

    // Test 3: Check admin user
    $stmt = $pdo->query("SELECT * FROM admin_users");
    $admins = $stmt->fetchAll();
    echo "<p>Admin users found: " . count($admins) . "</p>";
    if ($admins) {
        echo "<pre>";
        print_r($admins);
        echo "</pre>";
    }

} catch (PDOException $e) {
    echo "<p style='color: red;'><strong>❌ ERROR: " . $e->getMessage() . "</strong></p>";
    echo "<p>This means the password in this test file doesn't match Hostinger.</p>";
    echo "<p>Check your password in Hostinger and update the <code>\$db_pass</code> variable above.</p>";
}

echo "<p><a href='admin/login.php'>Back to Admin Login</a></p>";
?>
