<?php
/**
 * Database Configuration
 * Update these with your Hostinger credentials
 */

class Database {
    private $host = 'localhost'; // Hostinger usually uses localhost
    private $db_name = 'ul80950667_mentra_booking';
    private $db_user = 'ul80950667_mentra_user';
    private $db_pass = 'Rasheek123#care@2026';
    private $conn;

    /**
     * Connect to database
     */
    public function connect() {
        try {
            $this->conn = new PDO(
                'mysql:host=' . $this->host . ';dbname=' . $this->db_name . ';charset=utf8mb4',
                $this->db_user,
                $this->db_pass,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
            return $this->conn;
        } catch (PDOException $e) {
            die('Database Connection Error: ' . $e->getMessage());
        }
    }

    /**
     * Get connection
     */
    public function getConnection() {
        if (!$this->conn) {
            $this->connect();
        }
        return $this->conn;
    }

    /**
     * Test connection
     */
    public static function testConnection() {
        $db = new self();
        try {
            $db->connect();
            return ['status' => 'success', 'message' => 'Connected to database'];
        } catch (Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
}

// Create global database instance
$database = new Database();
$pdo = $database->connect();
?>
