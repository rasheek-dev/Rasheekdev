<?php
/**
 * Password Hash Generator
 * Upload to mentracare.in/hash.php
 * This generates bcrypt hashes for admin passwords
 */

$password = isset($_POST['password']) ? $_POST['password'] : '';
$hash = $password ? password_hash($password, PASSWORD_BCRYPT) : '';

?>
<!DOCTYPE html>
<html>
<head>
    <title>Generate Password Hash</title>
    <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
        input, button { padding: 10px; font-size: 14px; }
        .hash { background: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px; word-break: break-all; }
        button { background: #667eea; color: white; border: none; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Generate Bcrypt Hash</h1>
    <form method="POST">
        <label>Password:</label><br>
        <input type="text" name="password" value="<?php echo htmlspecialchars($password); ?>" size="40">
        <button type="submit">Generate Hash</button>
    </form>

    <?php if ($hash): ?>
        <h3>Generated Hash:</h3>
        <div class="hash"><?php echo $hash; ?></div>
        <p>Use this hash in phpMyAdmin for the admin password_hash field</p>
    <?php endif; ?>
</body>
</html>
?>
