-- Mentra Booking System Database Schema
-- Import this into your Hostinger MySQL database

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `time_slots`;
DROP TABLE IF EXISTS `psychologist_schedules`;
DROP TABLE IF EXISTS `psychologists`;
DROP TABLE IF EXISTS `admin_users`;

SET FOREIGN_KEY_CHECKS = 1;

-- Admin Users
CREATE TABLE `admin_users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(100) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `full_name` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Psychologists
CREATE TABLE `psychologists` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `slug` VARCHAR(100) UNIQUE NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100),
  `phone` VARCHAR(20),
  `gender` ENUM('male', 'female', 'other') DEFAULT 'female',
  `bio` TEXT,
  `qualifications` TEXT,
  `specializations` JSON,
  `languages` JSON DEFAULT '["English", "Hindi"]',
  `concerns` JSON,
  `photo_url` VARCHAR(255),
  `hourly_fee` DECIMAL(10, 2) NOT NULL DEFAULT 999.00,
  `session_minutes` INT DEFAULT 60,
  `is_active` BOOLEAN DEFAULT true,
  `next_available` DATETIME,
  `experience_years` INT,
  `registration_number` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Psychologist Weekly Schedule (recurring)
CREATE TABLE `psychologist_schedules` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `psychologist_id` INT NOT NULL,
  `day_of_week` INT NOT NULL COMMENT '0=Sunday, 6=Saturday',
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `slot_step_minutes` INT DEFAULT 30,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`psychologist_id`) REFERENCES `psychologists` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Time Slots (all available and booked slots)
CREATE TABLE `time_slots` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `psychologist_id` INT NOT NULL,
  `slot_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `status` ENUM('available', 'booked', 'hold', 'blocked') DEFAULT 'available',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`psychologist_id`) REFERENCES `psychologists` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_slot` (`psychologist_id`, `slot_date`, `start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings
CREATE TABLE `bookings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `booking_code` VARCHAR(20) UNIQUE NOT NULL,
  `psychologist_id` INT NOT NULL,
  `time_slot_id` INT,
  `slot_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `client_name` VARCHAR(100) NOT NULL,
  `client_email` VARCHAR(100),
  `client_phone` VARCHAR(20) NOT NULL,
  `client_age` INT,
  `client_concerns` TEXT,
  `amount` DECIMAL(10, 2) NOT NULL,
  `coupon_code` VARCHAR(50),
  `discount_amount` DECIMAL(10, 2) DEFAULT 0,
  `final_amount` DECIMAL(10, 2),
  `payment_status` ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  `razorpay_order_id` VARCHAR(100),
  `razorpay_payment_id` VARCHAR(100),
  `razorpay_signature` VARCHAR(255),
  `booking_status` ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'pending',
  `source_page` VARCHAR(100) COMMENT 'website, find-psychologist, free-assessment, etc',
  `utm_source` VARCHAR(100),
  `utm_medium` VARCHAR(100),
  `utm_campaign` VARCHAR(100),
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `confirmed_at` DATETIME,
  FOREIGN KEY (`psychologist_id`) REFERENCES `psychologists` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots` (`id`) ON DELETE SET NULL,
  INDEX `idx_slot_date` (`slot_date`),
  INDEX `idx_payment_status` (`payment_status`),
  INDEX `idx_booking_status` (`booking_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Day Off (specific dates when psychologist is not available)
CREATE TABLE `days_off` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `psychologist_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `reason` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`psychologist_id`) REFERENCES `psychologists` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_day_off` (`psychologist_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Settings
CREATE TABLE `settings` (
  `setting_key` VARCHAR(100) PRIMARY KEY,
  `setting_value` TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('razorpay_key_id', ''),
('razorpay_key_secret', ''),
('business_name', 'Mentra'),
('contact_email', ''),
('contact_phone', ''),
('contact_address', ''),
('whatsapp_number', ''),
('require_payment', '1'),
('session_hold_minutes', '15'),
('advance_booking_days', '30'),
('min_lead_hours', '2');

-- Create indexes for better performance
CREATE INDEX `idx_psychologist_active` ON `psychologists` (`is_active`);
CREATE INDEX `idx_booking_psychologist_date` ON `bookings` (`psychologist_id`, `slot_date`);
CREATE INDEX `idx_booking_created` ON `bookings` (`created_at`);
