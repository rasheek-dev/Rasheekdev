<?php
/**
 * Create Manual Appointments
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
require_once '../includes/Email.php';
require_once '../includes/GoogleMeet.php';

$database = new Database();
$pdo = $database->connect();
$psy = new Psychologist($pdo);
$booking_class = new Booking($pdo);
$google_meet = new GoogleMeet($pdo);

$message = '';
$error = '';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $psychologist_id = $_POST['psychologist_id'] ?? '';
    $slot_date = $_POST['slot_date'] ?? '';
    $start_time = $_POST['start_time'] ?? '';
    $end_time = $_POST['end_time'] ?? '';
    $client_name = $_POST['client_name'] ?? '';
    $client_phone = $_POST['client_phone'] ?? '';
    $client_email = $_POST['client_email'] ?? '';
    $client_age = $_POST['client_age'] ?? '';
    $amount = $_POST['amount'] ?? '';
    $create_meet = isset($_POST['create_meet']) ? true : false;

    if (!$psychologist_id || !$slot_date || !$start_time || !$client_name || !$client_phone) {
        $error = 'Please fill all required fields';
    } else {
        // Create the booking
        $result = $booking_class->create([
            'psychologist_id' => $psychologist_id,
            'slot_date' => $slot_date,
            'start_time' => $start_time,
            'end_time' => $end_time,
            'client_name' => $client_name,
            'client_phone' => $client_phone,
            'client_email' => $client_email,
            'client_age' => $client_age ?? null,
            'amount' => $amount,
            'source_page' => 'admin-manual'
        ]);

        if ($result['success']) {
            $booking_id = $result['id'];

            // Generate and save Google Meet link
            if ($create_meet) {
                $meet = $google_meet->generateMeetLink($booking_id);
                $google_meet->saveMeetLink($booking_id, $meet['meet_url'], $meet['meet_code']);
            }

            // Confirm booking immediately (admin created it)
            $booking_class->confirm($booking_id, 'admin-manual-' . time(), '');

            // Send confirmation email if email provided
            if ($client_email) {
                $booking = $booking_class->getById($booking_id);
                $email = new Email();
                $email->sendBookingConfirmation($booking);
            }

            $message = 'Appointment created successfully! Booking #' . $result['booking_code'];
            if ($create_meet) {
                $message .= ' - Google Meet link generated';
            }
        } else {
            $error = $result['error'] ?? 'Failed to create appointment';
        }
    }
}

$psychologists = $psy->getAll();

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Appointment - Mentra Admin</title>
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
            transition: all 0.3s;
        }

        .sidebar a:hover,
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

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }

        input, select, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            font-family: inherit;
        }

        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .checkbox-group input[type="checkbox"] {
            width: auto;
        }

        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: transform 0.2s;
        }

        button:hover {
            transform: translateY(-2px);
        }

        .info-box {
            background: #e7f3ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 13px;
            line-height: 1.6;
        }

        .required {
            color: #dc3545;
        }
    </style>
</head>
<body>
    <div class="navbar">
        <a href="dashboard.php">← Back</a>
        <h1>📅 Create Appointment</h1>
    </div>

    <div class="sidebar">
        <a href="dashboard.php">📈 Dashboard</a>
        <a href="psychologists.php">👨‍⚕️ Psychologists</a>
        <a href="bookings.php">📅 Bookings</a>
        <a href="appointments.php" class="active">🗓️ Create Appointment</a>
        <a href="settings.php">⚙️ Settings</a>
        <hr style="margin: 20px; border: none; border-top: 1px solid #eee;">
        <a href="logout.php">🚪 Logout</a>
    </div>

    <div class="main-content">
        <div class="card">
            <h2 style="margin-bottom: 20px;">Create Manual Appointment</h2>

            <div class="info-box">
                ℹ️ Manually create appointments for clients who book offline or need special arrangements.
                <br>Confirmation email will be sent automatically if email is provided.
            </div>

            <?php if ($message): ?>
                <div class="message"><?= htmlspecialchars($message) ?></div>
            <?php endif; ?>

            <?php if ($error): ?>
                <div class="error"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>

            <form method="POST">
                <div class="form-row">
                    <div class="form-group">
                        <label>Psychologist <span class="required">*</span></label>
                        <select name="psychologist_id" required>
                            <option value="">Select a psychologist</option>
                            <?php foreach ($psychologists as $p): ?>
                                <option value="<?= $p['id'] ?>">
                                    <?= htmlspecialchars($p['name']) ?> - ₹<?= number_format($p['hourly_fee'], 2) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Date <span class="required">*</span></label>
                        <input type="date" name="slot_date" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Start Time <span class="required">*</span></label>
                        <input type="time" name="start_time" required>
                    </div>

                    <div class="form-group">
                        <label>End Time</label>
                        <input type="time" name="end_time">
                    </div>
                </div>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

                <h3 style="margin-bottom: 15px;">Client Details</h3>

                <div class="form-row">
                    <div class="form-group">
                        <label>Client Name <span class="required">*</span></label>
                        <input type="text" name="client_name" required>
                    </div>

                    <div class="form-group">
                        <label>Phone <span class="required">*</span></label>
                        <input type="tel" name="client_phone" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="client_email">
                    </div>

                    <div class="form-group">
                        <label>Age</label>
                        <input type="number" name="client_age">
                    </div>
                </div>

                <div class="form-group">
                    <label>Session Amount (₹) <span class="required">*</span></label>
                    <input type="number" name="amount" value="999" step="0.01" required>
                </div>

                <div class="form-group checkbox-group">
                    <input type="checkbox" name="create_meet" id="create_meet" checked>
                    <label for="create_meet" style="margin: 0;">
                        📹 Generate Google Meet link for this session
                    </label>
                </div>

                <button type="submit">✓ Create Appointment</button>
            </form>
        </div>
    </div>
</body>
</html>
