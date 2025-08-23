/*
 Navicat Premium Data Transfer

 Source Server         : Driving
 Source Server Type    : MySQL
 Source Server Version : 80041 (8.0.41)
 Source Host           : localhost:3315
 Source Schema         : driving_test

 Target Server Type    : MySQL
 Target Server Version : 80041 (8.0.41)
 File Encoding         : 65001

 Date: 23/08/2025 22:37:03
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for lessons
-- ----------------------------
DROP TABLE IF EXISTS `lessons`;
CREATE TABLE `lessons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lesson_number` int NOT NULL,
  `lesson_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `common_errors` json DEFAULT NULL,
  `max_time_seconds` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `lesson_number` (`lesson_number`),
  KEY `idx_lesson_number` (`lesson_number`),
  CONSTRAINT `lessons_chk_1` CHECK (((`lesson_number` >= 1) and (`lesson_number` <= 12)))
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of lessons
-- ----------------------------
BEGIN;
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (49, 1, 'Xuất phát', 'Bài thi khởi hành từ vị trí xuất phát', '[{\"type\": \"deduction\", \"error\": \"Không thắt dây an toàn\", \"points\": 5}, {\"type\": \"deduction\", \"error\": \"Không tắt xi nhan trái\", \"points\": 5}]', 30, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (50, 2, 'Dừng xe nhường đường cho người đi bộ', '', '[{\"type\": \"deduction\", \"error\": \"Dừng xe chưa đến vị trí\", \"points\": 5}]', 60, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (51, 3, 'Dừng xe và khởi hành ngang dốc', 'Dừng xe trên dốc và khởi hành an toàn', '[{\"type\": \"deduction\", \"error\": \"Dừng xe chưa đến vị trí\", \"points\": 5}, {\"type\": \"disqualification\", \"error\": \"Xe bị chết máy\", \"points\": 100}, {\"type\": \"disqualification\", \"error\": \"Dừng xe quá vị trí\", \"points\": 100}]', 90, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (52, 4, 'Qua vệt bánh xe', 'Điều khiển xe qua các vệt bánh xe', '[{\"type\": \"deduction\", \"error\": \"Bánh xe đè vạch\", \"points\": 5}, {\"type\": \"disqualification\", \"error\": \"Bánh xe không đi vô vệt bánh xe\", \"points\": 100}]', 120, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (53, 5, 'Qua ngã tư có đèn tín hiệu', 'Tuân thủ tín hiệu đèn giao thông', '[{\"type\": \"disqualification\", \"error\": \"Vượt đèn đỏ\", \"points\": 100}]', 180, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (54, 6, 'Đường vòng quanh co', 'Điều khiển xe qua đường cong', '[{\"type\": \"deduction\", \"error\": \"Bánh xe đè vạch\", \"points\": 5}]', 240, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (55, 7, 'Ghép xe dọc', 'Đỗ xe song song với lề đường', '[{\"type\": \"deduction\", \"error\": \"Bánh xe đè vạch\", \"points\": 5}, {\"type\": \"deduction\", \"error\": \"Ghép xe chưa đúng vị trí\", \"points\": 5}, {\"type\": \"deduction\", \"error\": \"Quá thời gian bài thi\", \"points\": 3}, {\"type\": \"disqualification\", \"error\": \"Lỗi bỏ bài\", \"points\": 100}]', 300, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (56, 8, 'Tạm dừng đường sắt', 'Dừng xe an toàn trước đường sắt', '[{\"type\": \"deduction\", \"error\": \"Dừng xe chưa đúng vị trí\", \"points\": 5}]', 60, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (57, 9, 'Tăng tốc đường bằng', 'Tăng tốc và chuyển số đúng cách', '[{\"type\": \"deduction\", \"error\": \"Không đạt tốc độ\", \"points\": 5}]', 180, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (58, 10, 'Ghép xe ngang', 'Đỗ xe vuông góc với lề đường', '[{\"type\": \"deduction\", \"error\": \"Bánh xe đè vạch\", \"points\": 5}, {\"type\": \"deduction\", \"error\": \"Ghép xe chưa đúng vị trí\", \"points\": 5}, {\"type\": \"deduction\", \"error\": \"Quá thời gian bài thi\", \"points\": 3}, {\"type\": \"disqualification\", \"error\": \"Lỗi bỏ bài\", \"points\": 100}]', 300, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (59, 11, 'Kết thúc', 'Hoàn thành bài thi và về đích', '[{\"type\": \"deduction\", \"error\": \"Không bật xi nhan phải\", \"points\": 5}]', 60, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (60, 12, 'Tình huống khẩn cấp', 'Xử lý tình huống khẩn cấp trên đường', '[{\"type\": \"deduction\", \"error\": \"Không dừng xe\", \"points\": 10}, {\"type\": \"deduction\", \"error\": \"Không bấm nút tình huống khẩn cấp\", \"points\": 10}, {\"type\": \"deduction\", \"error\": \"Không tắt nút tình huống khẩn cấp\", \"points\": 10}]', 300, 1);
COMMIT;

-- ----------------------------
-- Table structure for results
-- ----------------------------
DROP TABLE IF EXISTS `results`;
CREATE TABLE `results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `lesson_number` int NOT NULL,
  `lesson_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `errors_detected` json DEFAULT NULL,
  `points_deducted` int DEFAULT '0',
  `is_disqualified` tinyint(1) DEFAULT '0',
  `completed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_lesson_number` (`lesson_number`),
  CONSTRAINT `results_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `results_chk_1` CHECK (((`lesson_number` >= 1) and (`lesson_number` <= 12)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of results
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for sessions
-- ----------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `instructor_id` int NOT NULL,
  `student_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_score` int DEFAULT '100',
  `status` enum('in_progress','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'in_progress',
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_instructor` (`instructor_id`),
  KEY `idx_status` (`status`),
  KEY `idx_started_at` (`started_at`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of sessions
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` tinyint NOT NULL DEFAULT '2' COMMENT '1=Admin, 2=Teacher',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active_token` text COLLATE utf8mb4_unicode_ci COMMENT 'Current active JWT token for single device login (teachers only)',
  `suspicious_activity_count` int DEFAULT '0' COMMENT 'Number of suspicious multi-device login attempts',
  `last_suspicious_attempt` timestamp NULL DEFAULT NULL COMMENT 'Last time user tried to login from different device',
  `is_flagged` tinyint(1) DEFAULT '0' COMMENT 'Account flagged for suspicious activity',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_active_token` (`active_token`(255)),
  KEY `idx_suspicious_activity` (`suspicious_activity_count`),
  KEY `idx_flagged` (`is_flagged`),
  CONSTRAINT `users_chk_1` CHECK ((`role` in (1,2)))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of users
-- ----------------------------
BEGIN;
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `phone`, `role`, `is_active`, `created_at`, `updated_at`, `active_token`, `suspicious_activity_count`, `last_suspicious_attempt`, `is_flagged`) VALUES (2, 'admin', 'admin@drivingtest.com', '$2a$12$VjvvnYMUJPgyxE.TCcXhROlQLBxo0ullj7xqorefUXV4R4fseo1Fa', 'Quản trị viên', '0123456789', 1, 1, '2025-08-16 16:32:54', '2025-08-16 16:32:54', NULL, 0, NULL, 0);
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
