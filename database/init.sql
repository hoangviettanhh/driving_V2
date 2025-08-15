-- Driving Test App Database Schema
-- Mobile-first design cho giáo viên dạy lái xe

CREATE DATABASE IF NOT EXISTS driving_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE driving_test;

-- Bảng Users (Giáo viên)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Sessions (Phiên thi)
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50),
    total_score INT DEFAULT 100,
    status ENUM('in_progress', 'completed', 'cancelled') DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    notes TEXT,
    
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_instructor (instructor_id),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Results (Kết quả từng bài thi)
CREATE TABLE results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    lesson_number INT NOT NULL CHECK (lesson_number >= 1 AND lesson_number <= 11),
    lesson_name VARCHAR(100) NOT NULL,
    errors_detected JSON,
    points_deducted INT DEFAULT 0,
    is_disqualified BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_lesson_number (lesson_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Lessons (Định nghĩa 11 bài thi)
CREATE TABLE lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_number INT UNIQUE NOT NULL CHECK (lesson_number >= 1 AND lesson_number <= 11),
    lesson_name VARCHAR(100) NOT NULL,
    description TEXT,
    common_errors JSON,
    max_time_seconds INT,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_lesson_number (lesson_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert dữ liệu 11 bài thi từ Document.md
INSERT INTO lessons (lesson_number, lesson_name, description, common_errors, max_time_seconds) VALUES
(1, 'Xuất phát', 'Bài thi khởi hành từ vị trí xuất phát', 
 JSON_ARRAY(
   JSON_OBJECT('error', 'Không thắt dây an toàn', 'points', 5, 'type', 'deduction'),
   JSON_OBJECT('error', 'Không bật xi nhan trái đúng lúc', 'points', 5, 'type', 'deduction'),
   JSON_OBJECT('error', 'Quá 20s không khởi hành', 'points', 5, 'type', 'deduction'),
   JSON_OBJECT('error', 'Quá 30s không khởi hành', 'points', 100, 'type', 'disqualification')
 ), 30),

(2, 'Dừng xe nhường đường cho người đi bộ', 'Dừng xe đúng vị trí để nhường đường', 
 JSON_ARRAY(
   JSON_OBJECT('error', 'Dừng sai vị trí (quá xa hoặc vượt vạch)', 'points', 5, 'type', 'deduction')
 ), 60),

(3, 'Dừng xe và khởi hành ngang dốc', 'Dừng xe trên dốc và khởi hành an toàn', 
 JSON_ARRAY(
   JSON_OBJECT('error', 'Không dừng đúng quy định', 'points', 5, 'type', 'deduction'),
   JSON_OBJECT('error', 'Không khởi hành trong 30 giây', 'points', 100, 'type', 'disqualification'),
   JSON_OBJECT('error', 'Xe tụt dốc quá 50cm', 'points', 100, 'type', 'disqualification')
 ), 60),

(4, 'Qua vệt bánh xe và đường hẹp vuông góc', 'Điều khiển xe qua các vệt bánh xe', 
 JSON_ARRAY(
   JSON_OBJECT('error', 'Bánh xe đè vạch giới hạn', 'points', 5, 'type', 'deduction'),
   JSON_OBJECT('error', 'Đè vạch quá 5 giây', 'points', 5, 'type', 'deduction')
 ), 120),

(5, 'Qua ngã tư có đèn tín hiệu', 'Tuân thủ đèn giao thông tại ngã tư', 
 JSON_ARRAY(
   JSON_OBJECT('error', 'Vi phạm đèn đỏ', 'points', 10, 'type', 'deduction'),
   JSON_OBJECT('error', 'Dừng sai vị trí', 'points', 5, 'type', 'deduction'),
   JSON_OBJECT('error', 'Không xi nhan khi rẽ', 'points', 5, 'type', 'deduction'),
   JSON_OBJECT('error', 'Quá 20 giây từ đèn xanh', 'points', 100, 'type', 'disqualification')
 ), 60),

(6, 'Đường vòng quanh co (chữ S)', 'Điều khiển xe qua đường cong hình chữ S', 
 JSON_ARRAY(
   JSON_OBJECT('error', 'Bánh xe đè vạch giới hạn', 'points', 5, 'type', 'deduction'),
   JSON_OBJECT('error', 'Quá thời gian quy định', 'points', 5, 'type', 'deduction')
 ), 120),

(7, 'Ghép xe dọc vào nơi đỗ', 'Lùi xe vào khu vực đỗ xe dọc', 
 JSON_ARRAY(
   JSON_OBJECT('error', 'Bánh xe đè vạch', 'points', 5, 'type', 'deduction'),
   JSON_OBJECT('error', 'Không lùi hết vào chuồng', 'points', 5, 'type', 'deduction'),
   JSON_OBJECT('error', 'Ghép sai vị trí', 'points', 5, 'type', 'deduction')
 ), 180),

(8, 'Tạm dừng nơi có đường sắt chạy qua', 'Dừng xe đúng quy định tại đường sắt', 
 JSON_ARRAY(
   JSON_OBJECT('error', 'Dừng sai vị trí (quá vạch hoặc chưa đến vạch)', 'points', 5, 'type', 'deduction')
 ), 60),

(9, 'Thay đổi số/tăng tốc trên đường bằng', 'Vận hành hộp số và tăng tốc đúng kỹ thuật', 
 JSON_ARRAY(
   JSON_OBJECT('error', 'Không đổi số đúng quy định', 'points', 5, 'type', 'deduction')
 ), 60),

(10, 'Ghép xe ngang vào nơi đỗ', 'Lùi xe vào khu vực đỗ xe ngang', 
 JSON_ARRAY(
   JSON_OBJECT('error', 'Bánh xe chèn vạch', 'points', 5, 'type', 'deduction'),
   JSON_OBJECT('error', 'Không vào được nơi đỗ', 'points', 5, 'type', 'deduction'),
   JSON_OBJECT('error', 'Dừng sai vị trí', 'points', 5, 'type', 'deduction')
 ), 180),

(11, 'Kết thúc (qua vạch đích)', 'Hoàn thành bài thi và qua vạch đích', 
 JSON_ARRAY(
   JSON_OBJECT('error', 'Không bật xi nhan phải trước khi qua vạch', 'points', 5, 'type', 'deduction')
 ), 30);

-- Insert admin user mặc định với password: password123
INSERT INTO users (username, email, password_hash, full_name, phone) VALUES 
('admin', 'admin@drivingtest.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiDCHOgLgdKu', 'Quản trị viên', '0123456789');

-- Tạo indexes cho performance
CREATE INDEX idx_results_session_lesson ON results(session_id, lesson_number);
CREATE INDEX idx_sessions_instructor_status ON sessions(instructor_id, status);

-- Commit changes
COMMIT;