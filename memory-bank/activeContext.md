# Active Context - Driving Test App

## Current Project Status
**Phase**: Initial Setup & Planning  
**Last Updated**: Current session  
**Priority**: High - Starting development  

## Current Focus
Đang trong giai đoạn setup dự án và chuẩn bị môi trường phát triển với Docker.

### Immediate Goals
1. ✅ Phân tích requirements từ Document.md
2. ✅ Lựa chọn tech stack (React + Node.js + MySQL + Docker)
3. ✅ Xác định deployment strategy (Hostinger với Docker)
4. ✅ Tạo memory bank và project structure
5. 🔄 **NEXT**: Setup project structure với Docker

## Key Decisions Made

### Technology Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MySQL 8.0
- **Containerization**: Docker + Docker Compose
- **Hosting**: Hostinger VPS (~79k VNĐ/tháng)
- **Voice**: Web Speech API (built-in browser)

### Architecture Approach
- **Mobile-first design**: Tối ưu cho smartphone
- **Microservices pattern**: Frontend, Backend, Database containers riêng biệt
- **RESTful API**: Simple API design cho auth và test management
- **Component-based UI**: React components tái sử dụng

## Data Structure from Document.md

### 11 Bài Thi Sa Hình
1. **Xuất phát** - Lỗi: Không thắt dây an toàn (-5đ), Không bật xi nhan (-5đ), Quá 20s (-5đ)
2. **Dừng xe nhường đường** - Lỗi: Dừng sai vị trí (-5đ), Xe chết máy (trừ điểm)
3. **Dừng xe ngang dốc** - Lỗi: Không khởi hành trong 30s (truất quyền), Tụt dốc >50cm (truất quyền)
4. **Qua vệt bánh xe** - Lỗi: Bánh xe đè vạch (-5đ/lần), Đè vạch >5s (tiếp tục trừ)
5. **Qua ngã tư có đèn** - Lỗi: Vi phạm đèn đỏ (-10đ), Quá 20s từ đèn xanh (truất quyền)
6. **Đường vòng chữ S** - Lỗi: Bánh xe đè vạch (-5đ/lần), Quá thời gian (-5đ)
7. **Ghép xe dọc** - Lỗi: Bánh xe đè vạch (-5đ), Không lùi hết chuồng (-5đ)
8. **Tạm dừng đường sắt** - Lỗi: Dừng sai vị trí (-5đ)
9. **Tăng tốc đường bằng** - Lỗi: Không đổi số đúng (-5đ)
10. **Ghép xe ngang** - Lỗi: Bánh xe chèn vạch (-5đ), Không vào được nơi đỗ (-5đ)
11. **Kết thúc** - Lỗi: Không bật xi nhan phải (-5đ)

### Scoring System
- **Điểm khởi đầu**: 100 điểm
- **Trừ điểm**: -5 điểm cho lỗi thường, -10 điểm cho lỗi nghiêm trọng
- **Truất quyền**: 0 điểm cho lỗi cực nghiêm trọng
- **Điểm đậu**: >= 80 điểm

## Current Development Plan

### Week 1: Project Setup & Core Structure
- [x] Create memory bank và project documentation
- [ ] Setup Docker development environment
- [ ] Create React frontend với Tailwind CSS
- [ ] Setup Express backend với MySQL connection
- [ ] Implement basic authentication system

### Week 2: Core Features Implementation
- [ ] Build 11 test modules based on Document.md
- [ ] Implement scoring system với error tracking
- [ ] Integrate Web Speech API cho voice features
- [ ] Create mobile-responsive UI components

### Week 3: Testing & Optimization
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Docker production configuration
- [ ] Deploy to Hostinger

## Technical Considerations

### Mobile-First Design Requirements
- **Touch-friendly**: Buttons ít nhất 44px x 44px
- **Readable text**: Minimum 16px font size
- **Fast loading**: Optimize images và minimize bundle size
- **Offline support**: Service worker cho basic functionality

### Voice Integration Requirements
- **Vietnamese support**: Đảm bảo Web Speech API hỗ trợ tiếng Việt
- **Error handling**: Fallback khi browser không support
- **User control**: Toggle on/off voice features
- **Clear pronunciation**: Slow speech rate cho clarity

### Docker Deployment Strategy
- **Multi-stage builds**: Optimize image sizes
- **Environment variables**: Flexible configuration
- **Health checks**: Monitor container status
- **Volume persistence**: MySQL data persistence
- **Reverse proxy**: Nginx cho production

## Next Actions
1. **Setup Docker environment** với docker-compose.yml
2. **Create project structure** cho frontend và backend
3. **Implement authentication** với JWT tokens
4. **Build test data structure** từ Document.md
5. **Start UI development** với mobile-first approach

## Questions & Decisions Needed
- **Audio files**: Có cần record audio files cho mỗi bài thi không, hay chỉ dùng Web Speech API?
- **User roles**: Có cần phân quyền giữa admin và giáo viên không?
- **Data export**: Có cần tính năng export kết quả ra Excel/PDF không?
- **Offline mode**: Có cần app hoạt động offline không?

## Risk Mitigation
- **Browser compatibility**: Test Web Speech API trên các browser phổ biến
- **Hostinger limitations**: Verify Docker support và resource limits
- **Performance**: Monitor app performance trên mobile devices
- **Data backup**: Implement MySQL backup strategy