<?php
/**
 * Bookings Management
 */

session_start();

if (!isset($_SESSION['admin_id'])) {
    header('Location: login.php');
    exit;
}

require_once '../config/Config.php';
require_once '../config/Database.php';
require_once '../includes/Booking.php';

$database = new Database();
$pdo = $database->connect();
$booking_class = new Booking($pdo);

$filter_date = $_GET['date'] ?? date('Y-m-d');
$filter_status = $_GET['status'] ?? '';

// Build query
$query = 'SELECT b.*, p.name as psychologist_name FROM bookings b JOIN psychologists p ON b.psychologist_id = p.id WHERE 1=1';
$params = [];

if ($filter_date) {
    $query .= ' AND DATE(b.slot_date) = ?';
    $params[] = $filter_date;
}

if ($filter_status) {
    $query .= ' AND b.booking_status = ?';
    $params[] = $filter_status;
}

$query .= ' ORDER BY b.slot_date DESC, b.start_time DESC LIMIT 100';

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$bookings = $stmt->fetchAll();

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bookings - Mentra Admin</title>
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
        }

        .filters {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .filters input, .filters select {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }

        .filters button {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border-radius: 8px;
            overflow: hidden;
        }

        table th {
            background: #f5f7fa;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            border-bottom: 1px solid #eee;
        }

        table td {
            padding: 15px;
            border-bottom: 1px solid #eee;
        }

        table tr:hover {
            background: #f5f7fa;
        }

        .badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge.confirmed {
            background: #d4edda;
            color: #155724;
        }

        .badge.pending {
            background: #fff3cd;
            color: #856404;
        }

        .badge.cancelled {
            background: #f8d7da;
            color: #721c24;
        }

        .meet-link {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }

        .meet-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="navbar">
        <a href="dashboard.php">← Dashboard</a>
        <h1>📅 Bookings</h1>
    </div>

    <div class="sidebar">
        <a href="dashboard.php">📈 Dashboard</a>
        <a href="psychologists.php">👨‍⚕️ Psychologists</a>
        <a href="bookings.php" class="active">📅 Bookings</a>
        <a href="appointments.php">🗓️ Create Appointment</a>
        <a href="settings.php">⚙️ Settings</a>
        <hr style="margin: 20px; border: none; border-top: 1px solid #eee;">
        <a href="logout.php">🚪 Logout</a>
    </div>

    <div class="main-content">
        <div class="filters">
            <form method="GET" style="display: flex; gap: 10px; width: 100%;">
                <input type="date" name="date" value="<?= htmlspecialchars($filter_date) ?>">
                <select name="status">
                    <option value="">All Status</option>
                    <option value="confirmed" <?= $filter_status === 'confirmed' ? 'selected' : '' ?>>Confirmed</option>
                    <option value="pending" <?= $filter_status === 'pending' ? 'selected' : '' ?>>Pending</option>
                    <option value="cancelled" <?= $filter_status === 'cancelled' ? 'selected' : '' ?>>Cancelled</option>
                </select>
                <button type="submit">Filter</button>
                <a href="bookings.php" style="padding: 10px 20px; background: #666; color: white; text-decoration: none; border-radius: 5px;">Reset</a>
            </form>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Booking Code</th>
                    <th>Client</th>
                    <th>Psychologist</th>
                    <th>Date & Time</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Google Meet</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($bookings as $b): ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($b['booking_code']) ?></strong></td>
                        <td>
                            <?= htmlspecialchars($b['client_name']) ?>
                            <br><small><?= htmlspecialchars($b['client_phone']) ?></small>
                        </td>
                        <td><?= htmlspecialchars($b['psychologist_name']) ?></td>
                        <td>
                            <?= date('M d, Y', strtotime($b['slot_date'])) ?>
                            <br><?= date('g:i A', strtotime($b['start_time'])) ?>
                        </td>
                        <td>₹<?= number_format($b['final_amount'], 2) ?></td>
                        <td>
                            <span class="badge <?= $b['booking_status'] ?>">
                                <?= ucfirst($b['booking_status']) ?>
                            </span>
                        </td>
                        <td>
                            <?php if ($b['google_meet_url'] ?? false): ?>
                                <a href="<?= htmlspecialchars($b['google_meet_url']) ?>" target="_blank" class="meet-link">
                                    📹 Join Meet
                                </a>
                            <?php else: ?>
                                -
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</body>
</html>
