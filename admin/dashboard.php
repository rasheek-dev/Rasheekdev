<?php
/**
 * Admin Dashboard
 */

session_start();

if (!isset($_SESSION['admin_id'])) {
    header('Location: login.php');
    exit;
}

require_once '../config/Config.php';
require_once '../config/Database.php';
require_once '../includes/Psychologist.php';
require_once '../includes/Booking.php';

$database = new Database();
$pdo = $database->connect();

$psychologist_class = new Psychologist($pdo);
$booking_class = new Booking($pdo);

// Get statistics
$stmt = $pdo->query('SELECT COUNT(*) as count FROM psychologists WHERE is_active = true');
$total_psychologists = $stmt->fetch()['count'];

$stmt = $pdo->query('SELECT COUNT(*) as count FROM bookings WHERE DATE(slot_date) = DATE(NOW())');
$todays_bookings = $stmt->fetch()['count'];

$stmt = $pdo->query('SELECT COUNT(*) as count FROM bookings WHERE booking_status = "confirmed" AND slot_date >= DATE(NOW())');
$upcoming_bookings = $stmt->fetch()['count'];

$stmt = $pdo->query('SELECT SUM(final_amount) as total FROM bookings WHERE payment_status = "completed" AND DATE(created_at) = DATE(NOW())');
$todays_revenue = $stmt->fetch()['total'] ?? 0;

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Mentra</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
            color: #333;
        }

        .navbar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .navbar h1 {
            font-size: 22px;
            font-weight: 600;
        }

        .navbar .user-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .navbar a {
            color: white;
            text-decoration: none;
            padding: 8px 15px;
            background: rgba(255,255,255,0.2);
            border-radius: 5px;
            transition: background 0.3s;
        }

        .navbar a:hover {
            background: rgba(255,255,255,0.3);
        }

        .sidebar {
            position: fixed;
            left: 0;
            top: 50px;
            width: 250px;
            height: calc(100vh - 50px);
            background: white;
            border-right: 1px solid #eee;
            overflow-y: auto;
        }

        .sidebar a {
            display: block;
            padding: 15px 20px;
            color: #666;
            text-decoration: none;
            border-left: 3px solid transparent;
            transition: all 0.3s;
        }

        .sidebar a:hover,
        .sidebar a.active {
            background: #f5f7fa;
            color: #667eea;
            border-left-color: #667eea;
        }

        .main-content {
            margin-left: 250px;
            margin-top: 50px;
            padding: 30px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .stat-card h3 {
            color: #999;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 10px;
        }

        .stat-card .value {
            font-size: 32px;
            font-weight: 700;
            color: #667eea;
        }

        .quick-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }

        .action-btn {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            text-decoration: none;
            color: #333;
        }

        .action-btn:hover {
            box-shadow: 0 4px 16px rgba(0,0,0,0.12);
            transform: translateY(-2px);
        }

        .action-btn i {
            display: block;
            font-size: 32px;
            margin-bottom: 10px;
        }

        .action-btn strong {
            display: block;
            margin-bottom: 5px;
        }

        .content-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        table th {
            background: #f5f7fa;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
            border-bottom: 1px solid #eee;
        }

        table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }

        table tr:hover {
            background: #f5f7fa;
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
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

        @media (max-width: 768px) {
            .sidebar {
                width: 60px;
            }

            .sidebar a {
                padding: 15px 10px;
                font-size: 0;
            }

            .main-content {
                margin-left: 60px;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="navbar">
        <h1>📊 Mentra Admin</h1>
        <div class="user-info">
            <span><?= htmlspecialchars($_SESSION['admin_name'] ?? $_SESSION['admin_username']) ?></span>
            <a href="logout.php">Logout</a>
        </div>
    </div>

    <div class="sidebar">
        <a href="dashboard.php" class="active">📈 Dashboard</a>
        <a href="psychologists.php">👨‍⚕️ Psychologists</a>
        <a href="bookings.php">📅 Bookings</a>
        <a href="appointments.php">🗓️ Create Appointment</a>
        <a href="settings.php">⚙️ Settings</a>
    </div>

    <div class="main-content">
        <h2 style="margin-bottom: 20px;">Welcome back, <?= htmlspecialchars($_SESSION['admin_name'] ?? $_SESSION['admin_username']) ?>!</h2>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>Active Psychologists</h3>
                <div class="value"><?= $total_psychologists ?></div>
            </div>
            <div class="stat-card">
                <h3>Today's Bookings</h3>
                <div class="value"><?= $todays_bookings ?></div>
            </div>
            <div class="stat-card">
                <h3>Upcoming Bookings</h3>
                <div class="value"><?= $upcoming_bookings ?></div>
            </div>
            <div class="stat-card">
                <h3>Today's Revenue</h3>
                <div class="value">₹<?= number_format($todays_revenue, 0) ?></div>
            </div>
        </div>

        <div class="quick-actions">
            <a href="psychologists.php" class="action-btn">
                <strong>👨‍⚕️ Add Psychologist</strong>
                <small>Manage psychologists</small>
            </a>
            <a href="appointments.php" class="action-btn">
                <strong>📅 New Appointment</strong>
                <small>Create manually</small>
            </a>
            <a href="bookings.php" class="action-btn">
                <strong>📋 View Bookings</strong>
                <small>All bookings</small>
            </a>
        </div>

        <div class="content-section">
            <h3 style="margin-bottom: 20px;">Recent Bookings</h3>
            <table>
                <thead>
                    <tr>
                        <th>Booking Code</th>
                        <th>Client</th>
                        <th>Psychologist</th>
                        <th>Date & Time</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $stmt = $pdo->query('
                        SELECT b.*, p.name as psychologist_name
                        FROM bookings b
                        JOIN psychologists p ON b.psychologist_id = p.id
                        ORDER BY b.created_at DESC
                        LIMIT 10
                    ');

                    foreach ($stmt->fetchAll() as $booking):
                        $status_badge = match($booking['booking_status']) {
                            'confirmed' => 'confirmed',
                            'pending' => 'pending',
                            default => 'pending'
                        };
                    ?>
                        <tr>
                            <td><strong><?= htmlspecialchars($booking['booking_code']) ?></strong></td>
                            <td><?= htmlspecialchars($booking['client_name']) ?></td>
                            <td><?= htmlspecialchars($booking['psychologist_name']) ?></td>
                            <td><?= date('M d, Y g:i A', strtotime($booking['slot_date'] . ' ' . $booking['start_time'])) ?></td>
                            <td>₹<?= number_format($booking['final_amount'], 2) ?></td>
                            <td><span class="badge <?= $status_badge ?>"><?= $booking['booking_status'] ?></span></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
