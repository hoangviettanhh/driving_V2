# Technical Context - Driving Test App

## Tech Stack Architecture

### Frontend Stack
- **Framework**: React 18+ với Vite
- **Styling**: Tailwind CSS cho mobile-first design
- **State Management**: React Context API (đơn giản)
- **HTTP Client**: Axios cho API calls
- **Voice**: Web Speech API (built-in browser)

### Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js (minimal, lightweight)
- **Database**: MySQL 8.0
- **ORM**: Sequelize hoặc raw MySQL queries
- **Authentication**: JWT tokens
- **Password**: bcrypt hashing

### DevOps & Deployment
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (reverse proxy)
- **Hosting**: Hostinger VPS với Docker support
- **SSL**: Let's Encrypt
- **Process Manager**: PM2

## Database Design

### Core Tables
```sql
-- Users (Giáo viên)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Test Sessions (Phiên thi)
CREATE TABLE test_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT NOT NULL,
    student_name VARCHAR(100),
    total_score INT DEFAULT 100,
    status ENUM('in_progress', 'completed') DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- Test Results (Kết quả từng bài)
CREATE TABLE test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    test_number INT NOT NULL, -- 1-11
    test_name VARCHAR(100) NOT NULL,
    errors_detected JSON, -- Array of error objects
    points_deducted INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES test_sessions(id)
);
```

## Docker Architecture

### Docker Compose Structure
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
  
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASS=password
    depends_on:
      - mysql
  
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: driving_test
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  mysql_data:
```

## API Design

### Authentication Endpoints
```
POST /api/auth/register - Đăng ký giáo viên
POST /api/auth/login    - Đăng nhập
POST /api/auth/logout   - Đăng xuất
GET  /api/auth/profile  - Lấy thông tin profile
```

### Test Management Endpoints
```
GET  /api/tests         - Lấy danh sách 11 bài thi
POST /api/sessions      - Tạo phiên thi mới
GET  /api/sessions/:id  - Lấy thông tin phiên thi
PUT  /api/sessions/:id  - Cập nhật kết quả phiên thi
GET  /api/sessions      - Lịch sử các phiên thi
```

## Development Environment

### Local Development Setup
```bash
# Clone repository
git clone <repo-url>
cd driving-test-app

# Start with Docker Compose
docker-compose up -d

# Or manual setup
cd frontend && npm install && npm run dev
cd backend && npm install && npm run dev
```

### Environment Variables
```env
# Backend (.env)
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=driving_test
JWT_SECRET=your-secret-key

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
```

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Lazy loading cho các route
- **Image Optimization**: WebP format, lazy loading
- **Bundle Size**: Tree shaking, minimal dependencies
- **Caching**: Service Worker cho offline support

### Backend Optimization
- **Database**: Indexing cho queries thường dùng
- **API**: Response caching cho static data
- **Memory**: Efficient JSON handling cho error data
- **Connection Pooling**: MySQL connection pool

## Security Measures

### Authentication Security
- JWT tokens với expiration
- Password hashing với bcrypt
- CORS configuration
- Rate limiting cho API endpoints

### Data Security
- Input validation và sanitization
- SQL injection prevention
- XSS protection
- HTTPS enforcement

## Monitoring & Logging

### Application Monitoring
- Error tracking với try-catch blocks
- API response time monitoring
- Database query performance
- Docker container health checks

### Logging Strategy
- Structured logging với timestamps
- Error logs với stack traces
- User activity logs
- System performance metrics