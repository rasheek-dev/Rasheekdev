<?php
/**
 * Payment Handler - Razorpay Integration
 */

require_once 'Booking.php';

class Payment {
    private $razorpay_key_id;
    private $razorpay_key_secret;
    private $booking;
    private $db;

    public function __construct($pdo) {
        $this->razorpay_key_id = RAZORPAY_KEY_ID;
        $this->razorpay_key_secret = RAZORPAY_KEY_SECRET;
        $this->db = $pdo;
        $this->booking = new Booking($pdo);
    }

    /**
     * Create a Razorpay order
     */
    public function createOrder($booking_id, $amount) {
        if (!$this->razorpay_key_id || !$this->razorpay_key_secret) {
            return ['success' => false, 'error' => 'Razorpay keys not configured'];
        }

        $booking = $this->booking->getById($booking_id);
        if (!$booking) {
            return ['success' => false, 'error' => 'Booking not found'];
        }

        $amount_paise = round($amount * 100); // Convert to paise

        $data = [
            'amount' => $amount_paise,
            'currency' => 'INR',
            'receipt' => $booking['booking_code'],
            'notes' => [
                'booking_id' => $booking_id,
                'client_phone' => $booking['client_phone'],
                'client_name' => $booking['client_name']
            ]
        ];

        try {
            $response = $this->makeApiCall('orders', $data, 'POST');

            if (isset($response['id'])) {
                // Update booking with order ID
                $stmt = $this->db->prepare('
                    UPDATE bookings
                    SET razorpay_order_id = ?
                    WHERE id = ?
                ');
                $stmt->execute([$response['id'], $booking_id]);

                return [
                    'success' => true,
                    'order_id' => $response['id'],
                    'key_id' => $this->razorpay_key_id,
                    'amount' => $amount_paise,
                    'booking_code' => $booking['booking_code'],
                    'client_name' => $booking['client_name'],
                    'client_email' => $booking['client_email'],
                    'client_phone' => $booking['client_phone']
                ];
            } else {
                return ['success' => false, 'error' => 'Failed to create Razorpay order'];
            }
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Verify Razorpay payment
     */
    public function verifyPayment($razorpay_order_id, $razorpay_payment_id, $razorpay_signature) {
        if (!$this->razorpay_key_secret) {
            return ['success' => false, 'error' => 'Razorpay key secret not configured'];
        }

        // Generate signature to verify
        $data = $razorpay_order_id . '|' . $razorpay_payment_id;
        $generated_signature = hash_hmac('sha256', $data, $this->razorpay_key_secret);

        if ($generated_signature === $razorpay_signature) {
            return ['success' => true, 'message' => 'Payment verified'];
        } else {
            return ['success' => false, 'error' => 'Payment verification failed'];
        }
    }

    /**
     * Confirm payment and update booking
     */
    public function confirmPayment($razorpay_order_id, $razorpay_payment_id, $razorpay_signature) {
        // Verify payment signature
        $verification = $this->verifyPayment($razorpay_order_id, $razorpay_payment_id, $razorpay_signature);
        if (!$verification['success']) {
            return $verification;
        }

        // Get booking by order ID
        $booking = $this->booking->getByRazorpayOrder($razorpay_order_id);
        if (!$booking) {
            return ['success' => false, 'error' => 'Booking not found'];
        }

        // Verify payment details from Razorpay API
        try {
            $payment_details = $this->getPaymentDetails($razorpay_payment_id);

            if ($payment_details['status'] === 'captured' || $payment_details['status'] === 'authorized') {
                // Confirm booking
                return $this->booking->confirm($booking['id'], $razorpay_payment_id, $razorpay_signature);
            } else {
                return ['success' => false, 'error' => 'Payment not captured'];
            }
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get payment details from Razorpay
     */
    public function getPaymentDetails($payment_id) {
        try {
            return $this->makeApiCall('payments/' . $payment_id, [], 'GET');
        } catch (Exception $e) {
            throw new Exception('Failed to fetch payment details: ' . $e->getMessage());
        }
    }

    /**
     * Refund a payment
     */
    public function refund($payment_id, $amount = null) {
        if (!$this->razorpay_key_id || !$this->razorpay_key_secret) {
            return ['success' => false, 'error' => 'Razorpay keys not configured'];
        }

        try {
            $data = [];
            if ($amount) {
                $data['amount'] = round($amount * 100);
            }

            $response = $this->makeApiCall('payments/' . $payment_id . '/refund', $data, 'POST');

            if (isset($response['id'])) {
                return ['success' => true, 'refund_id' => $response['id']];
            } else {
                return ['success' => false, 'error' => 'Failed to create refund'];
            }
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Make API call to Razorpay
     */
    private function makeApiCall($endpoint, $data, $method = 'POST') {
        $url = 'https://api.razorpay.com/v1/' . $endpoint;

        $options = [
            'http' => [
                'method' => $method,
                'header' => [
                    'Authorization: Basic ' . base64_encode($this->razorpay_key_id . ':' . $this->razorpay_key_secret),
                    'Content-Type: application/json'
                ],
                'timeout' => 30
            ]
        ];

        if ($method === 'POST' && !empty($data)) {
            $options['http']['content'] = json_encode($data);
        } elseif ($method === 'GET' && !empty($data)) {
            $url .= '?' . http_build_query($data);
        }

        $context = stream_context_create($options);
        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            throw new Exception('Failed to connect to Razorpay API');
        }

        return json_decode($response, true);
    }

    /**
     * Check if payment is in test mode
     */
    public function isTestMode() {
        return strpos($this->razorpay_key_id, 'rzp_test_') === 0;
    }
}
?>
