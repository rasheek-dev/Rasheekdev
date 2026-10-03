<?php
/**
 * Psychologists Management
 */

session_start();

if (!isset($_SESSION['admin_id'])) {
    header('Location: login.php');
    exit;
}

require_once '../config/Config.php';
require_once '../config/Database.php';
require_once '../includes/Psychologist.php';

$database = new Database();
$pdo = $database->connect();
$psy = new Psychologist($pdo);

$message = '';
$error = '';

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'add') {
        $result = $psy->create([
            'name' => $_POST['name'] ?? '',
            'email' => $_POST['email'] ?? '',
            'phone' => $_POST['phone'] ?? '',
            'gender' => $_POST['gender'] ?? 'female',
            'bio' => $_POST['bio'] ?? '',
            'qualifications' => $_POST['qualifications'] ?? '',
            'hourly_fee' => $_POST['hourly_fee'] ?? 999,
            'session_minutes' => $_POST['session_minutes'] ?? 60,
            'experience_years' => $_POST['experience_years'] ?? '',
            'registration_number' => $_POST['registration_number'] ?? ''
        ]);

        if ($result['success']) {
            $message = 'Psychologist added successfully!';
        } else {
            $error = $result['error'] ?? 'Failed to add psychologist';
        }
    } elseif ($action === 'edit') {
        $id = $_POST['id'] ?? '';
        $result = $psy->update($id, [
            'name' => $_POST['name'] ?? '',
            'email' => $_POST['email'] ?? '',
            'phone' => $_POST['phone'] ?? '',
            'gender' => $_POST['gender'] ?? 'female',
            'bio' => $_POST['bio'] ?? '',
            'qualifications' => $_POST['qualifications'] ?? '',
            'hourly_fee' => $_POST['hourly_fee'] ?? 999,
            'session_minutes' => $_POST['session_minutes'] ?? 60,
            'experience_years' => $_POST['experience_years'] ?? '',
            'registration_number' => $_POST['registration_number'] ?? ''
        ]);

        if ($result['success']) {
            $message = 'Psychologist updated successfully!';
        } else {
            $error = $result['error'] ?? 'Failed to update psychologist';
        }
    } elseif ($action === 'delete') {
        $id = $_POST['id'] ?? '';
        $result = $psy->delete($id);

        if ($result['success']) {
            $message = 'Psychologist deleted successfully!';
        } else {
            $error = $result['error'] ?? 'Failed to delete psychologist';
        }
    } elseif ($action === 'add_schedule') {
        $result = $psy->createSchedule(
            $_POST['psychologist_id'],
            $_POST['day_of_week'],
            $_POST['start_time'],
            $_POST['end_time'],
            $_POST['slot_step'] ?? 30
        );

        if ($result['success']) {
            $message = 'Schedule added successfully!';
        } else {
            $error = $result['error'] ?? 'Failed to add schedule';
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
    <title>Psychologists - Mentra Admin</title>
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
        }

        .navbar a {
            color: white;
            text-decoration: none;
            padding: 8px 15px;
            background: rgba(255,255,255,0.2);
            border-radius: 5px;
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

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }

        .btn {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: background 0.3s;
        }

        .btn:hover {
            background: #764ba2;
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
            border-left: 4px solid #f5c6cb;
        }

        .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            padding: 20px;
            margin-bottom: 20px;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 8px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #333;
        }

        input, textarea, select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            font-family: inherit;
        }

        textarea {
            resize: vertical;
            min-height: 80px;
        }

        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
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

        .action-buttons {
            display: flex;
            gap: 5px;
        }

        .btn-small {
            padding: 6px 12px;
            font-size: 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
        }

        .btn-small.delete {
            background: #dc3545;
        }

        .btn-small:hover {
            opacity: 0.9;
        }

        .close-modal {
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            color: #999;
        }

        .close-modal:hover {
            color: #333;
        }
    </style>
</head>
<body>
    <div class="navbar">
        <h1>👨‍⚕️ Psychologists</h1>
        <a href="dashboard.php">← Back to Dashboard</a>
    </div>

    <div class="sidebar">
        <a href="dashboard.php">📈 Dashboard</a>
        <a href="psychologists.php" class="active">👨‍⚕️ Psychologists</a>
        <a href="bookings.php">📅 Bookings</a>
        <a href="appointments.php">🗓️ Create Appointment</a>
        <a href="settings.php">⚙️ Settings</a>
        <hr style="margin: 20px; border: none; border-top: 1px solid #eee;">
        <a href="logout.php">🚪 Logout</a>
    </div>

    <div class="main-content">
        <div class="header">
            <h2>Manage Psychologists</h2>
            <button class="btn" onclick="openAddModal()">+ Add New Psychologist</button>
        </div>

        <?php if ($message): ?>
            <div class="message"><?= htmlspecialchars($message) ?></div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Phone</th>
                        <th>Fee</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($psychologists as $p): ?>
                        <tr>
                            <td><strong><?= htmlspecialchars($p['name']) ?></strong></td>
                            <td><code><?= htmlspecialchars($p['slug']) ?></code></td>
                            <td><?= htmlspecialchars($p['phone'] ?? '-') ?></td>
                            <td>₹<?= number_format($p['hourly_fee'], 2) ?></td>
                            <td><?= $p['is_active'] ? '✅ Active' : '❌ Inactive' ?></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-small" onclick="openEditModal(<?= htmlspecialchars(json_encode($p)) ?>)">Edit</button>
                                    <form style="display: inline;" method="POST">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="id" value="<?= $p['id'] ?>">
                                        <button type="submit" class="btn-small delete" onclick="return confirm('Are you sure?')">Delete</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Add/Edit Modal -->
    <div id="psychologistModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal()">&times;</span>
            <h2 id="modalTitle">Add Psychologist</h2>

            <form method="POST">
                <input type="hidden" name="action" id="formAction" value="add">
                <input type="hidden" name="id" id="psychologistId" value="">

                <div class="form-row">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" name="name" id="name" required>
                    </div>
                    <div class="form-group">
                        <label>Gender</label>
                        <select name="gender" id="gender">
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" id="email">
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" name="phone" id="phone">
                    </div>
                </div>

                <div class="form-group">
                    <label>Bio</label>
                    <textarea name="bio" id="bio"></textarea>
                </div>

                <div class="form-group">
                    <label>Qualifications</label>
                    <textarea name="qualifications" id="qualifications"></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Hourly Fee (₹)</label>
                        <input type="number" name="hourly_fee" id="hourly_fee" value="999" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Session Duration (minutes)</label>
                        <input type="number" name="session_minutes" id="session_minutes" value="60">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Experience (years)</label>
                        <input type="number" name="experience_years" id="experience_years">
                    </div>
                    <div class="form-group">
                        <label>Registration Number</label>
                        <input type="text" name="registration_number" id="registration_number">
                    </div>
                </div>

                <button type="submit" class="btn">Save Psychologist</button>
            </form>
        </div>
    </div>

    <script>
        function openAddModal() {
            document.getElementById('formAction').value = 'add';
            document.getElementById('modalTitle').textContent = 'Add Psychologist';
            document.getElementById('psychologistId').value = '';
            document.getElementById('psychologistModal').classList.add('active');
            document.querySelector('form').reset();
        }

        function openEditModal(psychologist) {
            document.getElementById('formAction').value = 'edit';
            document.getElementById('modalTitle').textContent = 'Edit Psychologist';
            document.getElementById('psychologistId').value = psychologist.id;
            document.getElementById('name').value = psychologist.name;
            document.getElementById('email').value = psychologist.email || '';
            document.getElementById('phone').value = psychologist.phone || '';
            document.getElementById('gender').value = psychologist.gender || 'female';
            document.getElementById('bio').value = psychologist.bio || '';
            document.getElementById('qualifications').value = psychologist.qualifications || '';
            document.getElementById('hourly_fee').value = psychologist.hourly_fee;
            document.getElementById('session_minutes').value = psychologist.session_minutes;
            document.getElementById('experience_years').value = psychologist.experience_years || '';
            document.getElementById('registration_number').value = psychologist.registration_number || '';

            document.getElementById('psychologistModal').classList.add('active');
        }

        function closeModal() {
            document.getElementById('psychologistModal').classList.remove('active');
        }

        window.onclick = function(event) {
            const modal = document.getElementById('psychologistModal');
            if (event.target === modal) {
                closeModal();
            }
        }
    </script>
</body>
</html>
