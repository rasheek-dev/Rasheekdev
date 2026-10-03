<?php
/**
 * Email Notification Handler
 */

class Email {
    private $from;
    private $from_name;

    public function __construct() {
        $this->from = MAIL_FROM;
        $this->from_name = MAIL_FROM_NAME;
    }

    /**
     * Send booking confirmation email to client
     */
    public function sendBookingConfirmation($booking) {
        $subject = 'Booking Confirmed - ' . $booking['psychologist_name'];
        $to = $booking['client_email'];

        $body = $this->getBookingConfirmationTemplate($booking);

        return $this->send($to, $subject, $body);
    }

    /**
     * Send booking notification to admin
     */
    public function sendBookingNotification($booking) {
        $subject = 'New Booking - ' . $booking['client_name'];
        $to = ADMIN_EMAIL;

        $body = $this->getAdminNotificationTemplate($booking);

        return $this->send($to, $subject, $body);
    }

    /**
     * Send payment confirmation email
     */
    public function sendPaymentConfirmation($booking) {
        $subject = 'Payment Received - ' . $booking['booking_code'];
        $to = $booking['client_email'];

        $body = $this->getPaymentConfirmationTemplate($booking);

        return $this->send($to, $subject, $body);
    }

    /**
     * Send cancellation email
     */
    public function sendCancellationEmail($booking) {
        $subject = 'Booking Cancelled - Refund Processed';
        $to = $booking['client_email'];

        $body = $this->getCancellationTemplate($booking);

        return $this->send($to, $subject, $body);
    }

    /**
     * Send email
     */
    private function send($to, $subject, $body) {
        $headers = "From: {$this->from_name} <{$this->from}>\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "Reply-To: " . SUPPORT_EMAIL . "\r\n";

        return mail($to, $subject, $body, $headers);
    }

    /**
     * Booking confirmation template
     */
    private function getBookingConfirmationTemplate($booking) {
        $date = date('F j, Y', strtotime($booking['slot_date']));
        $time = date('g:i A', strtotime($booking['start_time']));

        return "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #667bc6;'>Booking Confirmed!</h2>

                <p>Dear {$booking['client_name']},</p>

                <p>Your session has been confirmed with <strong>{$booking['psychologist_name']}</strong>.</p>

                <div style='background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <h3>Booking Details:</h3>
                    <p><strong>Booking Code:</strong> {$booking['booking_code']}</p>
                    <p><strong>Date:</strong> {$date}</p>
                    <p><strong>Time:</strong> {$time}</p>
                    <p><strong>Amount Paid:</strong> ₹{$booking['final_amount']}</p>
                </div>

                <p>If you need to reschedule or cancel, please contact us at least 24 hours before your session.</p>

                <p style='margin-top: 30px; color: #999; font-size: 12px;'>
                    " . BUSINESS_NAME . "<br>
                    " . BUSINESS_EMAIL . "<br>
                    " . BUSINESS_PHONE . "
                </p>
            </div>
        </body>
        </html>";
    }

    /**
     * Admin notification template
     */
    private function getAdminNotificationTemplate($booking) {
        $date = date('F j, Y', strtotime($booking['slot_date']));
        $time = date('g:i A', strtotime($booking['start_time']));

        return "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #667bc6;'>New Booking Received</h2>

                <div style='background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <h3>Booking Details:</h3>
                    <p><strong>Booking Code:</strong> {$booking['booking_code']}</p>
                    <p><strong>Client Name:</strong> {$booking['client_name']}</p>
                    <p><strong>Client Phone:</strong> {$booking['client_phone']}</p>
                    <p><strong>Client Email:</strong> {$booking['client_email']}</p>
                    <p><strong>Psychologist:</strong> {$booking['psychologist_name']}</p>
                    <p><strong>Date:</strong> {$date}</p>
                    <p><strong>Time:</strong> {$time}</p>
                    <p><strong>Amount:</strong> ₹{$booking['final_amount']}</p>
                    <p><strong>Status:</strong> {$booking['booking_status']}</p>
                </div>

                <p>Log in to your admin panel to manage this booking.</p>
            </div>
        </body>
        </html>";
    }

    /**
     * Payment confirmation template
     */
    private function getPaymentConfirmationTemplate($booking) {
        return "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #667bc6;'>Payment Confirmed</h2>

                <p>Payment of ₹{$booking['final_amount']} has been received for booking {$booking['booking_code']}.</p>

                <p>Your session is confirmed and ready. Please check your email for session details.</p>

                <p style='margin-top: 30px; color: #999; font-size: 12px;'>
                    Thank you!<br>
                    " . BUSINESS_NAME . "
                </p>
            </div>
        </body>
        </html>";
    }

    /**
     * Cancellation template
     */
    private function getCancellationTemplate($booking) {
        return "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #667bc6;'>Booking Cancelled</h2>

                <p>Your booking {$booking['booking_code']} has been cancelled.</p>

                <p>Your refund of ₹{$booking['final_amount']} will be processed to your original payment method within 5-7 business days.</p>

                <p>If you'd like to reschedule, please feel free to book another session.</p>

                <p style='margin-top: 30px; color: #999; font-size: 12px;'>
                    " . BUSINESS_NAME . "<br>
                    " . BUSINESS_EMAIL . "
                </p>
            </div>
        </body>
        </html>";
    }
}
?>
