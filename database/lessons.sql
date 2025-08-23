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

 Date: 16/08/2025 22:53:28
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of lessons
-- ----------------------------
BEGIN;
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (1, 1, 'Xuất phát', 'Bài thi khởi hành từ vị trí xuất phát', '[{\"type\": \"deduction\", \"error\": \"Không thắt dây an toàn\", \"points\": 5}, {\"type\": \"deduction\", \"error\": \"Không tắt xi nhan trái \", \"points\": 5}, {\"type\": \"deduction\", \"error\": \"Quá 20s không khởi hành\", \"points\": 5}, {\"type\": \"disqualification\", \"error\": \"Quá 30s không khởi hành\", \"points\": 100}]', 30, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (2, 2, 'Dừng xe nhường đường cho người đi bộ', 'Dừng xe đúng vị trí để nhường đường', '[{\"type\": \"deduction\", \"error\": \"Dừng sai vị trí (quá xa hoặc vượt vạch)\", \"points\": 5}]', 60, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (3, 3, 'Dừng xe và khởi hành ngang dốc', 'Dừng xe trên dốc và khởi hành an toàn', '[{\"type\": \"disqualification\", \"error\": \"Không khởi hành được trong 30s\", \"points\": 100}, {\"type\": \"disqualification\", \"error\": \"Xe tụt dốc quá 50cm\", \"points\": 100}, {\"type\": \"deduction\", \"error\": \"Dừng sai vị trí quy định\", \"points\": 5}]', 90, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (4, 4, 'Qua vệt bánh xe', 'Điều khiển xe qua các vệt bánh xe', '[{\"type\": \"deduction\", \"error\": \"Bánh xe đè vạch\", \"points\": 5}, {\"type\": \"deduction\", \"error\": \"Bánh xe không qua vạch\", \"points\": 100}]', 120, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (5, 5, 'Qua ngã tư có đèn tín hiệu', 'Tuân thủ tín hiệu đèn giao thông', '[{\"type\": \"deduction\", \"error\": \"Vi phạm tín hiệu đèn đỏ\", \"points\": 10}, {\"type\": \"disqualification\", \"error\": \"Quá 20s không di chuyển khi đèn xanh\", \"points\": 100}, {\"type\": \"deduction\", \"error\": \"Không quan sát kỹ trước khi qua ngã tư\", \"points\": 5}]', 180, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (6, 6, 'Đường vòng quanh co', 'Điều khiển xe qua đường cong', '[{\"type\": \"deduction\", \"error\": \"Bánh xe đè vạch biên\", \"points\": 5}, {\"type\": \"deduction\", \"error\": \"Quá thời gian quy định\", \"points\": 5}, {\"type\": \"disqualification\", \"error\": \"Không hoàn thành được bài thi\", \"points\": 100}]', 240, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (7, 7, 'Ghép xe dọc', 'Đỗ xe song song với lề đường', '[{\"type\": \"deduction\", \"error\": \"Bánh xe đè vạch kẻ\", \"points\": 5}, {\"type\": \"deduction\", \"error\": \"Không lùi hết vào chuồng\", \"points\": 5}, {\"type\": \"disqualification\", \"error\": \"Va chạm với vật cản\", \"points\": 100}]', 300, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (8, 8, 'Tạm dừng đường sắt', 'Dừng xe an toàn trước đường sắt', '[{\"type\": \"deduction\", \"error\": \"Dừng sai vị trí quy định\", \"points\": 5}, {\"type\": \"deduction\", \"error\": \"Không quan sát cẩn thận\", \"points\": 5}]', 60, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (9, 9, 'Tăng tốc đường bằng', 'Tăng tốc và chuyển số đúng cách', '[{\"type\": \"deduction\", \"error\": \"Không chuyển số đúng cách\", \"points\": 5}, {\"type\": \"deduction\", \"error\": \"Tăng tốc không đạt yêu cầu\", \"points\": 5}]', 180, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (10, 10, 'Ghép xe ngang', 'Đỗ xe vuông góc với lề đường', '[{\"type\": \"deduction\", \"error\": \"Bánh xe chèn vạch\", \"points\": 5}, {\"type\": \"deduction\", \"error\": \"Không vào được vị trí đỗ xe\", \"points\": 5}, {\"type\": \"disqualification\", \"error\": \"Va chạm với vật cản\", \"points\": 100}]', 300, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (11, 11, 'Kết thúc', 'Hoàn thành bài thi và về đích', '[{\"type\": \"deduction\", \"error\": \"Không bật xi nhan phải\", \"points\": 5}, {\"type\": \"deduction\", \"error\": \"Không dừng đúng vị trí\", \"points\": 5}]', 60, 1);
INSERT INTO `lessons` (`id`, `lesson_number`, `lesson_name`, `description`, `common_errors`, `max_time_seconds`, `is_active`) VALUES (12, 12, 'TÃ¬nh huá»‘ng kháº©n cáº¥p', 'Xá»­ lÃ½ tÃ¬nh huá»‘ng kháº©n cáº¥p trÃªn Ä‘Æ°á»ng', '[{\"type\": \"deduction\", \"error\": \"KhÃ´ng dá»«ng xe\", \"points\": 10}, {\"type\": \"deduction\", \"error\": \"KhÃ´ng báº¥m nÃºt tÃ¬nh huá»‘ng kháº©n cáº¥p\", \"points\": 10}, {\"type\": \"deduction\", \"error\": \"KhÃ´ng táº¯t nÃºt tÃ¬nh huá»‘ng kháº©n cáº¥p\", \"points\": 10}]', 30, 1);
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
