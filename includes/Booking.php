<?php
/**
 * Booking Model
 */

class Booking {
    private $db;

    public function __construct($pdo) {
        $this->db = $pdo;
    }

    /**
     * Create a booking (pending payment)
     */
    public function create($data) {
        $booking_code = $this->generateBookingCode();

        $stmt = $this->db->prepare('
            INSERT INTO bookings (
                booking_code, psychologist_id, time_slot_id, slot_date,
                start_time, end_time, client_name, client_email, client_phone,
                client_age, client_concerns, amount, coupon_code, discount_amount,
                final_amount, source_page, utm_source, utm_medium, utm_campaign
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');

        try {
            $final_amount = ($data['amount'] ?? 0) - ($data['discount_amount'] ?? 0);

            $stmt->execute([
                $booking_code,
                $data['psychologist_id'],
                $data['time_slot_id'] ?? null,
                $data['slot_date'],
                $data['start_time'],
                $data['end_time'],
                $data['client_name'],
                $data['client_email'] ?? null,
                $data['client_phone'],
                $data['client_age'] ?? null,
                $data['client_concerns'] ?? null,
                $data['amount'],
                $data['coupon_code'] ?? null,
                $data['discount_amount'] ?? 0,
                $final_amount,
                $data['source_page'] ?? 'website',
                $data['utm_source'] ?? null,
                $data['utm_medium'] ?? null,
                $data['utm_campaign'] ?? null
            ]);

            $booking_id = $this->db->lastInsertId();

            // Hold the time slot
            if ($data['time_slot_id'] ?? null) {
                $this->holdSlot($data['time_slot_id'], DEFINE('SESSION_HOLD_MINUTES', 15));
            }

            return ['success' => true, 'id' => $booking_id, 'booking_code' => $booking_code];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Hold a time slot for payment
     */
    public function holdSlot($slot_id, $minutes = 15) {
        $stmt = $this->db->prepare('
            UPDATE time_slots
            SET status = "hold"
            WHERE id = ? AND status = "available"
        ');
        $stmt->execute([$slot_id]);
    }

    /**
     * Release hold on a slot
     */
    public function releaseHold($slot_id) {
        $stmt = $this->db->prepare('
            UPDATE time_slots
            SET status = "available"
            WHERE id = ? AND status = "hold"
        ');
        $stmt->execute([$slot_id]);
    }

    /**
     * Confirm booking after payment
     */
    public function confirm($booking_id, $razorpay_payment_id, $razorpay_signature) {
        $stmt = $this->db->prepare('
            UPDATE bookings
            SET booking_status = "confirmed",
                payment_status = "completed",
                razorpay_payment_id = ?,
                razorpay_signature = ?,
                confirmed_at = NOW()
            WHERE id = ?
        ');

        try {
            $stmt->execute([$razorpay_payment_id, $razorpay_signature, $booking_id]);

            // Mark slot as booked
            $booking = $this->getById($booking_id);
            if ($booking && $booking['time_slot_id']) {
                $this->db->prepare('
                    UPDATE time_slots
                    SET status = "booked"
                    WHERE id = ?
                ')->execute([$booking['time_slot_id']]);
            }

            return ['success' => true];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get booking by ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare('
            SELECT b.*, p.name as psychologist_name, p.slug
            FROM bookings b
            JOIN psychologists p ON b.psychologist_id = p.id
            WHERE b.id = ?
        ');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Get booking by booking code
     */
    public function getByCode($code) {
        $stmt = $this->db->prepare('
            SELECT b.*, p.name as psychologist_name, p.slug
            FROM bookings b
            JOIN psychologists p ON b.psychologist_id = p.id
            WHERE b.booking_code = ?
        ');
        $stmt->execute([$code]);
        return $stmt->fetch();
    }

    /**
     * Get booking by Razorpay order ID
     */
    public function getByRazorpayOrder($order_id) {
        $stmt = $this->db->prepare('
            SELECT * FROM bookings
            WHERE razorpay_order_id = ?
        ');
        $stmt->execute([$order_id]);
        return $stmt->fetch();
    }

    /**
     * Get all bookings for a psychologist
     */
    public function getByPsychologist($psychologist_id, $date = null) {
        if ($date) {
            $stmt = $this->db->prepare('
                SELECT * FROM bookings
                WHERE psychologist_id = ? AND slot_date = ?
                ORDER BY start_time ASC
            ');
            $stmt->execute([$psychologist_id, $date]);
        } else {
            $stmt = $this->db->prepare('
                SELECT * FROM bookings
                WHERE psychologist_id = ?
                ORDER BY slot_date DESC, start_time ASC
            ');
            $stmt->execute([$psychologist_id]);
        }
        return $stmt->fetchAll();
    }

    /**
     * Cancel booking
     */
    public function cancel($id, $reason = '') {
        $stmt = $this->db->prepare('
            UPDATE bookings
            SET booking_status = "cancelled"
            WHERE id = ?
        ');

        try {
            $stmt->execute([$id]);

            // Release the slot
            $booking = $this->getById($id);
            if ($booking && $booking['time_slot_id']) {
                $this->db->prepare('
                    UPDATE time_slots
                    SET status = "available"
                    WHERE id = ?
                ')->execute([$booking['time_slot_id']]);
            }

            return ['success' => true];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Generate unique booking code
     */
    private function generateBookingCode() {
        $code = 'BK' . strtoupper(substr(uniqid(), -8));

        // Ensure uniqueness
        $stmt = $this->db->prepare('SELECT COUNT(*) as count FROM bookings WHERE booking_code = ?');
        $stmt->execute([$code]);
        if ($stmt->fetch()['count'] > 0) {
            return $this->generateBookingCode();
        }

        return $code;
    }

    /**
     * Search bookings
     */
    public function search($filters) {
        $query = 'SELECT b.*, p.name as psychologist_name FROM bookings b JOIN psychologists p ON b.psychologist_id = p.id WHERE 1=1';
        $params = [];

        if (isset($filters['client_phone'])) {
            $query .= ' AND b.client_phone LIKE ?';
            $params[] = '%' . $filters['client_phone'] . '%';
        }

        if (isset($filters['booking_code'])) {
            $query .= ' AND b.booking_code = ?';
            $params[] = $filters['booking_code'];
        }

        if (isset($filters['date'])) {
            $query .= ' AND DATE(b.slot_date) = ?';
            $params[] = $filters['date'];
        }

        if (isset($filters['status'])) {
            $query .= ' AND b.booking_status = ?';
            $params[] = $filters['status'];
        }

        $query .= ' ORDER BY b.created_at DESC LIMIT 50';

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}
?>
