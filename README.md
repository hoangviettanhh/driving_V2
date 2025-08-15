# Driving Test App - Ứng dụng Chấm Điểm Thi Lái Xe

Web application mobile-first cho giáo viên dạy lái xe chấm điểm thi thử cho học viên với 11 bài thi sa hình và tính năng Text-to-Speech.

## 🚀 Quick Start

### Yêu cầu hệ thống
- Docker & Docker Compose
- Node.js 18+ (cho development)
- Git

### Chạy ứng dụng

1. **Clone repository**
```bash
git clone <repo-url>
cd driving-test-app
```

2. **Chạy với Docker Compose**
```bash
docker-compose up --build
```

3. **Truy cập ứng dụng**
- Frontend: http://localhost:3020
- Backend API: http://localhost:5000
- MySQL: localhost:3306

### Tài khoản demo
- **Username**: admin
- **Password**: password123

## 📱 Tính năng chính

### ✅ Đã hoàn thành
- 🔐 **Authentication**: Đăng ký/Đăng nhập với JWT
- 🎨 **Mobile-first UI**: Responsive design với Tailwind CSS
- 🗣️ **Text-to-Speech**: AI đọc nội dung bằng tiếng Việt
- 📋 **11 bài thi sa hình**: Theo đúng quy định thực tế
- 🐳 **Docker**: Multi-container development environment
- 💾 **Database**: MySQL với schema đầy đủ

### 🔄 Đang phát triển
- 📊 **Scoring System**: Hệ thống chấm điểm chi tiết
- 📈 **Test Interface**: Giao diện chấm điểm interactive
- 📜 **History**: Lịch sử và thống kê phiên thi

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** - Fast development
- **Tailwind CSS** - Mobile-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** + **Express** - RESTful API
- **MySQL 8.0** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Joi** - Input validation

### DevOps
- **Docker Compose** - Multi-container setup
- **Nginx** - Production web server
- **PM2** - Process management

## 📁 Cấu trúc project

```
driving-test-app/
├── frontend/                 # React App
│   ├── src/
│   │   ├── components/       # UI Components
│   │   ├── contexts/         # React Contexts
│   │   ├── pages/           # Page Components
│   │   └── utils/           # Utilities
│   ├── Dockerfile
│   └── package.json
├── backend/                  # Node.js API
│   ├── routes/              # API Routes
│   ├── middleware/          # Express Middleware
│   ├── models/              # Database Models
│   ├── Dockerfile
│   └── server.js
├── database/
│   └── init.sql             # Database Schema
├── docker-compose.yml
└── README.md
```

## 🎯 11 Bài Thi Sa Hình

1. **Xuất phát** - Khởi hành từ vị trí xuất phát
2. **Dừng xe nhường đường** - Nhường đường cho người đi bộ
3. **Dừng xe ngang dốc** - Dừng và khởi hành trên dốc
4. **Qua vệt bánh xe** - Điều khiển qua đường hẹp
5. **Qua ngã tư có đèn** - Tuân thủ đèn giao thông
6. **Đường vòng chữ S** - Qua đường cong phức tạp
7. **Ghép xe dọc** - Lùi xe vào chỗ đỗ dọc
8. **Tạm dừng đường sắt** - Dừng xe tại đường sắt
9. **Tăng tốc đường bằng** - Thay đổi số và tăng tốc
10. **Ghép xe ngang** - Lùi xe vào chỗ đỗ ngang
11. **Kết thúc** - Hoàn thành và qua vạch đích

## 🎨 UI/UX Features

### Mobile-First Design
- ✅ Touch-friendly buttons (44px minimum)
- ✅ Readable fonts (16px minimum)
- ✅ Safe area support for iOS
- ✅ Responsive breakpoints
- ✅ Optimized for one-handed use

### Voice Integration
- ✅ Web Speech API với tiếng Việt
- ✅ Đọc tên bài thi và mô tả
- ✅ Đọc chi tiết lỗi khi click
- ✅ Toggle on/off voice features
- ✅ Fallback khi browser không support

### Performance
- ✅ Code splitting & lazy loading
- ✅ Image optimization
- ✅ Gzip compression
- ✅ Service Worker ready

## 🔧 Development

### Local Development (không Docker)

1. **Backend**
```bash
cd backend
npm install
npm run dev
```

2. **Frontend**
```bash
cd frontend
npm install
npm run dev
```

3. **Database**
- Cài đặt MySQL 8.0
- Import `database/init.sql`

### Environment Variables

Backend (`.env`):
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=driving_test
JWT_SECRET=your_jwt_secret
```

Frontend (`.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

## 📊 Database Schema

### Core Tables
- **users** - Thông tin giáo viên
- **test_sessions** - Phiên thi của học viên
- **test_results** - Kết quả từng bài thi
- **test_definitions** - Định nghĩa 11 bài thi

### Sample Data
Database được seed với:
- 11 bài thi sa hình đầy đủ
- Danh sách lỗi phổ biến cho mỗi bài
- Tài khoản admin mặc định

## 🚀 Deployment

### Production với Docker
```bash
# Build production images
docker-compose -f docker-compose.prod.yml up --build

# Với SSL và domain
# Cấu hình Nginx reverse proxy
# Cài đặt Let's Encrypt SSL
```

### Hostinger VPS
1. Upload code lên VPS
2. Cài đặt Docker & Docker Compose
3. Chạy `docker-compose up -d`
4. Cấu hình domain và SSL

## 📈 Roadmap

### Phase 1 (Hiện tại)
- ✅ Basic authentication
- ✅ Mobile-first UI
- ✅ Voice integration
- ✅ Docker setup

### Phase 2 (Tiếp theo)
- 🔄 Complete scoring system
- 🔄 Interactive test interface
- 🔄 Real-time error tracking
- 🔄 Session management

### Phase 3 (Tương lai)
- 📋 Advanced reporting
- 📋 Student management
- 📋 Multi-instructor support
- 📋 Export to PDF/Excel

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- Email: support@drivingtest.com
- Issues: GitHub Issues
- Documentation: Wiki

---

**Made with ❤️ for Vietnamese driving instructors**