<?php
/**
 * Google Meet Integration
 *
 * For easy setup, we'll use a simple approach:
 * Generate Google Meet links using a simple format
 *
 * For full integration with Google Calendar:
 * 1. Set up Google Cloud Console project
 * 2. Get OAuth2 credentials
 * 3. Implement full calendar + meet integration
 */

class GoogleMeet {
    private $db;
    private $google_api_key;

    public function __construct($pdo, $api_key = null) {
        $this->db = $pdo;
        $this->google_api_key = $api_key;
    }

    /**
     * Generate Google Meet link for a booking
     * Simple format: meet.google.com/mentra-<booking-id>
     */
    public function generateMeetLink($booking_id) {
        $meet_code = 'mentra-' . $booking_id;
        $meet_url = 'https://meet.google.com/' . $meet_code;

        return [
            'meet_url' => $meet_url,
            'meet_code' => $meet_code
        ];
    }

    /**
     * Save meet link to booking
     */
    public function saveMeetLink($booking_id, $meet_url, $meet_code) {
        // Add meet columns to bookings table if not exists
        // ALTER TABLE bookings ADD COLUMN google_meet_url VARCHAR(255);
        // ALTER TABLE bookings ADD COLUMN google_meet_code VARCHAR(100);

        $stmt = $this->db->prepare('
            UPDATE bookings
            SET google_meet_url = ?, google_meet_code = ?
            WHERE id = ?
        ');

        try {
            $stmt->execute([$meet_url, $meet_code, $booking_id]);
            return ['success' => true];
        } catch (Exception $e) {
            // Column might not exist yet, create it
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get meet link for a booking
     */
    public function getMeetLink($booking_id) {
        $stmt = $this->db->prepare('
            SELECT google_meet_url, google_meet_code FROM bookings WHERE id = ?
        ');
        $stmt->execute([$booking_id]);
        $result = $stmt->fetch();

        if ($result && $result['google_meet_url']) {
            return $result;
        }

        // If not saved, generate it
        $meet = $this->generateMeetLink($booking_id);
        $this->saveMeetLink($booking_id, $meet['meet_url'], $meet['meet_code']);
        return $meet;
    }

    /**
     * Full Google Calendar Integration (Advanced)
     * Requires Google Cloud Setup
     *
     * Steps:
     * 1. Create Google Cloud project
     * 2. Enable Google Meet API
     * 3. Create OAuth2 credentials
     * 4. Store refresh token
     */
    public function createCalendarEvent($booking, $psychologist, $access_token) {
        if (!$access_token) {
            return ['success' => false, 'error' => 'Google access token not configured'];
        }

        $event = [
            'summary' => 'Session with ' . $booking['client_name'],
            'description' => 'Psychology session - Booking #' . $booking['booking_code'],
            'start' => [
                'dateTime' => date('c', strtotime($booking['slot_date'] . ' ' . $booking['start_time'])),
                'timeZone' => 'Asia/Kolkata'
            ],
            'end' => [
                'dateTime' => date('c', strtotime($booking['slot_date'] . ' ' . $booking['end_time'])),
                'timeZone' => 'Asia/Kolkata'
            ],
            'attendees' => [
                [
                    'email' => $booking['client_email'],
                    'displayName' => $booking['client_name'],
                    'responseStatus' => 'needsAction'
                ],
                [
                    'email' => $psychologist['email'],
                    'displayName' => $psychologist['name'],
                    'responseStatus' => 'needsAction'
                ]
            ],
            'conferenceData' => [
                'createRequest' => [
                    'requestId' => 'mentra-' . $booking['id'] . '-' . time(),
                    'conferenceSolutionKey' => [
                        'key' => 'hangoutsMeet'
                    ]
                ]
            ],
            'reminders' => [
                'useDefault' => false,
                'overrides' => [
                    [
                        'method' => 'email',
                        'minutes' => 24 * 60 // 24 hours before
                    ]
                ]
            ]
        ];

        try {
            $url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1';

            $options = [
                'http' => [
                    'method' => 'POST',
                    'header' => [
                        'Authorization: Bearer ' . $access_token,
                        'Content-Type: application/json'
                    ],
                    'content' => json_encode($event),
                    'timeout' => 30
                ]
            ];

            $context = stream_context_create($options);
            $response = file_get_contents($url, false, $context);
            $event_data = json_decode($response, true);

            if (isset($event_data['id']) && isset($event_data['conferenceData'])) {
                return [
                    'success' => true,
                    'event_id' => $event_data['id'],
                    'meet_link' => $event_data['conferenceData']['entryPoints'][0]['uri'] ?? null,
                    'html_link' => $event_data['htmlLink']
                ];
            } else {
                return ['success' => false, 'error' => 'Failed to create event'];
            }
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Setup instructions for full Google Meet integration
     */
    public static function getSetupInstructions() {
        return [
            'step1' => 'Visit: https://console.cloud.google.com',
            'step2' => 'Create new project: "Mentra"',
            'step3' => 'Enable APIs: Google Calendar API, Google Meet API',
            'step4' => 'Create OAuth2 credentials (Web application)',
            'step5' => 'Set Authorized redirect URIs: https://yourdomain.com/admin/auth-callback.php',
            'step6' => 'Get Client ID and Client Secret',
            'step7' => 'Store in config/Config.php',
            'step8' => 'Implement authorization flow'
        ];
    }
}
?>
