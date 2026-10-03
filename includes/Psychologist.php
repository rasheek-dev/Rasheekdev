<?php
/**
 * Psychologist Model
 */

class Psychologist {
    private $db;

    public function __construct($pdo) {
        $this->db = $pdo;
    }

    /**
     * Get psychologist by slug
     */
    public function getBySlug($slug) {
        $stmt = $this->db->prepare('
            SELECT * FROM psychologists
            WHERE slug = ? AND is_active = true
        ');
        $stmt->execute([$slug]);
        return $stmt->fetch();
    }

    /**
     * Get all active psychologists
     */
    public function getAll() {
        $stmt = $this->db->query('
            SELECT * FROM psychologists
            WHERE is_active = true
            ORDER BY name ASC
        ');
        return $stmt->fetchAll();
    }

    /**
     * Get psychologist by ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare('
            SELECT * FROM psychologists WHERE id = ?
        ');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Create new psychologist
     */
    public function create($data) {
        $slug = $this->generateSlug($data['name']);

        $stmt = $this->db->prepare('
            INSERT INTO psychologists (
                slug, name, email, phone, gender, bio, qualifications,
                specializations, languages, concerns, photo_url,
                hourly_fee, session_minutes, is_active, experience_years,
                registration_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');

        try {
            $stmt->execute([
                $slug,
                $data['name'],
                $data['email'] ?? null,
                $data['phone'] ?? null,
                $data['gender'] ?? 'female',
                $data['bio'] ?? null,
                $data['qualifications'] ?? null,
                $data['specializations'] ? json_encode($data['specializations']) : null,
                $data['languages'] ? json_encode($data['languages']) : json_encode(['English', 'Hindi']),
                $data['concerns'] ? json_encode($data['concerns']) : null,
                $data['photo_url'] ?? null,
                $data['hourly_fee'] ?? 999,
                $data['session_minutes'] ?? 60,
                $data['is_active'] ?? true,
                $data['experience_years'] ?? null,
                $data['registration_number'] ?? null
            ]);

            return ['success' => true, 'id' => $this->db->lastInsertId(), 'slug' => $slug];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Update psychologist
     */
    public function update($id, $data) {
        $fields = [];
        $values = [];

        foreach ($data as $key => $value) {
            if ($key !== 'id' && in_array($key, ['name', 'email', 'phone', 'gender', 'bio', 'qualifications', 'specializations', 'languages', 'concerns', 'photo_url', 'hourly_fee', 'session_minutes', 'is_active', 'experience_years', 'registration_number'])) {
                $fields[] = "$key = ?";

                if (in_array($key, ['specializations', 'languages', 'concerns'])) {
                    $values[] = is_array($value) ? json_encode($value) : $value;
                } else {
                    $values[] = $value;
                }
            }
        }

        if (empty($fields)) {
            return ['success' => false, 'error' => 'No valid fields to update'];
        }

        $values[] = $id;
        $stmt = $this->db->prepare('UPDATE psychologists SET ' . implode(', ', $fields) . ' WHERE id = ?');

        try {
            $stmt->execute($values);
            return ['success' => true];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Delete psychologist
     */
    public function delete($id) {
        $stmt = $this->db->prepare('DELETE FROM psychologists WHERE id = ?');
        try {
            $stmt->execute([$id]);
            return ['success' => true];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Generate unique slug from name
     */
    private function generateSlug($name) {
        $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9-]/', '-', $name), '-'));
        $slug = preg_replace('/-+/', '-', $slug);

        // Check if slug exists, add number if it does
        $stmt = $this->db->prepare('SELECT COUNT(*) as count FROM psychologists WHERE slug = ?');
        $stmt->execute([$slug]);
        $result = $stmt->fetch();

        if ($result['count'] > 0) {
            $slug .= '-' . time();
        }

        return $slug;
    }

    /**
     * Get available time slots for a psychologist
     */
    public function getAvailableSlots($psychologist_id, $date) {
        $stmt = $this->db->prepare('
            SELECT * FROM time_slots
            WHERE psychologist_id = ?
            AND slot_date = ?
            AND status = "available"
            ORDER BY start_time ASC
        ');
        $stmt->execute([$psychologist_id, $date]);
        return $stmt->fetchAll();
    }

    /**
     * Get psychologist's schedule
     */
    public function getSchedule($psychologist_id) {
        $stmt = $this->db->prepare('
            SELECT * FROM psychologist_schedules
            WHERE psychologist_id = ?
            ORDER BY day_of_week ASC
        ');
        $stmt->execute([$psychologist_id]);
        return $stmt->fetchAll();
    }

    /**
     * Create weekly schedule
     */
    public function createSchedule($psychologist_id, $day_of_week, $start_time, $end_time, $slot_step = 30) {
        $stmt = $this->db->prepare('
            INSERT INTO psychologist_schedules
            (psychologist_id, day_of_week, start_time, end_time, slot_step_minutes)
            VALUES (?, ?, ?, ?, ?)
        ');

        try {
            $stmt->execute([$psychologist_id, $day_of_week, $start_time, $end_time, $slot_step]);
            return ['success' => true, 'id' => $this->db->lastInsertId()];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Add day off
     */
    public function addDayOff($psychologist_id, $date, $reason = '') {
        $stmt = $this->db->prepare('
            INSERT INTO days_off (psychologist_id, date, reason)
            VALUES (?, ?, ?)
        ');

        try {
            $stmt->execute([$psychologist_id, $date, $reason]);
            return ['success' => true];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Generate time slots for a date
     */
    public function generateSlots($psychologist_id, $start_date, $end_date) {
        $psychologist = $this->getById($psychologist_id);
        if (!$psychologist) {
            return ['success' => false, 'error' => 'Psychologist not found'];
        }

        $schedule = $this->getSchedule($psychologist_id);
        if (empty($schedule)) {
            return ['success' => false, 'error' => 'No schedule defined'];
        }

        $count = 0;
        $current = strtotime($start_date);
        $end = strtotime($end_date);

        while ($current <= $end) {
            $date = date('Y-m-d', $current);
            $dow = (int)date('w', $current);

            // Check if it's a day off
            $stmt = $this->db->prepare('SELECT id FROM days_off WHERE psychologist_id = ? AND date = ?');
            $stmt->execute([$psychologist_id, $date]);
            if ($stmt->fetch()) {
                $current += 86400;
                continue;
            }

            // Find schedule for this day
            foreach ($schedule as $sched) {
                if ((int)$sched['day_of_week'] === $dow) {
                    $time = strtotime($sched['start_time']);
                    $end_time = strtotime($sched['end_time']);
                    $slot_step = $sched['slot_step_minutes'];

                    while ($time < $end_time) {
                        $start = date('H:i:s', $time);
                        $slot_end = $time + ($psychologist['session_minutes'] * 60);
                        $end_slot = date('H:i:s', $slot_end);

                        // Don't create if slot goes beyond working hours
                        if ($slot_end <= $end_time) {
                            $stmt = $this->db->prepare('
                                INSERT IGNORE INTO time_slots
                                (psychologist_id, slot_date, start_time, end_time, status)
                                VALUES (?, ?, ?, ?, "available")
                            ');
                            $stmt->execute([$psychologist_id, $date, $start, $end_slot]);
                            $count++;
                        }

                        $time += ($slot_step * 60);
                    }
                }
            }

            $current += 86400;
        }

        return ['success' => true, 'slots_created' => $count];
    }
}
?>
