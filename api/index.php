<?php
/**
 * API Router
 * Base endpoint: /api/
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Load configuration and classes
require_once __DIR__ . '/../config/Config.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../includes/Psychologist.php';
require_once __DIR__ . '/../includes/Booking.php';
require_once __DIR__ . '/../includes/Payment.php';

// Initialize database
$database = new Database();
$pdo = $database->connect();

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$path = trim($path, '/');

// Parse request body
$input = json_decode(file_get_contents('php://input'), true);

// Route handler
try {
    // Handle CORS preflight
    if ($method === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    // Psychologist endpoints
    if (preg_match('/^psychologists\/?$/', $path)) {
        if ($method === 'GET') {
            $psychologist = new Psychologist($pdo);
            $psychologists = $psychologist->getAll();
            response(200, ['success' => true, 'data' => $psychologists]);
        }
    }

    // Get psychologist by slug
    if (preg_match('/^psychologists\/(.+)$/', $path, $matches)) {
        if ($method === 'GET') {
            $slug = $matches[1];
            $psychologist = new Psychologist($pdo);
            $data = $psychologist->getBySlug($slug);
            if ($data) {
                response(200, ['success' => true, 'data' => $data]);
            } else {
                response(404, ['success' => false, 'error' => 'Psychologist not found']);
            }
        }
    }

    // Available slots
    if (preg_match('/^slots\/(.+)\/(.+)$/', $path, $matches)) {
        if ($method === 'GET') {
            $psychologist_id = $matches[1];
            $date = $matches[2];
            $psychologist = new Psychologist($pdo);
            $slots = $psychologist->getAvailableSlots($psychologist_id, $date);
            response(200, ['success' => true, 'data' => $slots]);
        }
    }

    // Create booking
    if (preg_match('/^bookings\/?$/', $path)) {
        if ($method === 'POST') {
            if (!isset($input['psychologist_id']) || !isset($input['slot_date']) || !isset($input['client_phone'])) {
                response(400, ['success' => false, 'error' => 'Missing required fields']);
            }

            $booking = new Booking($pdo);
            $result = $booking->create($input);

            if ($result['success']) {
                response(201, $result);
            } else {
                response(400, $result);
            }
        }
    }

    // Create payment order
    if (preg_match('/^payment\/order\/?$/', $path)) {
        if ($method === 'POST') {
            if (!isset($input['booking_id']) || !isset($input['amount'])) {
                response(400, ['success' => false, 'error' => 'Missing required fields']);
            }

            $payment = new Payment($pdo);
            $result = $payment->createOrder($input['booking_id'], $input['amount']);

            if ($result['success']) {
                response(201, $result);
            } else {
                response(400, $result);
            }
        }
    }

    // Verify payment
    if (preg_match('/^payment\/verify\/?$/', $path)) {
        if ($method === 'POST') {
            if (!isset($input['razorpay_order_id']) || !isset($input['razorpay_payment_id']) || !isset($input['razorpay_signature'])) {
                response(400, ['success' => false, 'error' => 'Missing payment details']);
            }

            $payment = new Payment($pdo);
            $result = $payment->confirmPayment(
                $input['razorpay_order_id'],
                $input['razorpay_payment_id'],
                $input['razorpay_signature']
            );

            if ($result['success']) {
                response(200, $result);
            } else {
                response(400, $result);
            }
        }
    }

    // Get booking details
    if (preg_match('/^bookings\/(.+)$/', $path, $matches)) {
        if ($method === 'GET') {
            $booking_code = $matches[1];
            $booking = new Booking($pdo);
            $data = $booking->getByCode($booking_code);

            if ($data) {
                response(200, ['success' => true, 'data' => $data]);
            } else {
                response(404, ['success' => false, 'error' => 'Booking not found']);
            }
        }
    }

    // 404 Not Found
    response(404, ['success' => false, 'error' => 'Endpoint not found']);

} catch (Exception $e) {
    response(500, ['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Send JSON response
 */
function response($status_code, $data) {
    http_response_code($status_code);
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}
?>
