# Driving Test App - Project Brief

## Tổng quan dự án
**Tên dự án**: Ứng dụng Web Chấm Điểm Thi Lái Xe  
**Mục tiêu**: Xây dựng web application cho giáo viên dạy lái xe chấm điểm thi thử cho học viên  
**Phạm vi**: Nội bộ trung tâm dạy lái xe  
**Nền tảng**: Mobile-first web application  

## Yêu cầu chức năng chính

### 1. Hệ thống Authentication
- Đăng ký tài khoản giáo viên
- Đăng nhập/Đăng xuất
- Quản lý profile cơ bản

### 2. Module 11 bài thi sa hình
Dựa trên document `Document.md`, bao gồm:
1. Xuất phát
2. Dừng xe nhường đường cho người đi bộ
3. Dừng xe và khởi hành ngang dốc
4. Qua vệt bánh xe và đường hẹp vuông góc
5. Qua ngã tư có đèn tín hiệu điều khiển giao thông
6. Đường vòng quanh co (chữ S)
7. Ghép xe dọc vào nơi đỗ
8. Tạm dừng nơi có đường sắt chạy qua
9. Thay đổi số/tăng tốc trên đường bằng
10. Ghép xe ngang vào nơi đỗ
11. Kết thúc (qua vạch đích)

### 3. Hệ thống chấm điểm
- Điểm khởi đầu: 100 điểm
- Trừ điểm theo từng lỗi cụ thể
- Truất quyền thi cho lỗi nghiêm trọng
- Lưu lịch sử chấm điểm

### 4. Text-to-Speech Integration
- AI đọc tên bài thi
- AI đọc từng lỗi khi user click
- Hỗ trợ tiếng Việt

## Yêu cầu kỹ thuật

### Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MySQL
- **Voice**: Web Speech API
- **Containerization**: Docker + Docker Compose
- **Hosting**: Hostinger với Docker support

### Yêu cầu UI/UX
- **Mobile-first design**: Tối ưu cho điện thoại
- **Responsive**: Hoạt động tốt trên mọi kích thước màn hình
- **Intuitive**: Giao diện đơn giản, dễ sử dụng cho giáo viên
- **Accessible**: Hỗ trợ voice feedback

## Ràng buộc và giới hạn
- Sử dụng nội bộ (không cần scale lớn)
- Tập trung vào UI/UX
- Logic đơn giản (chỉ auth + scoring)
- Chi phí thấp (~79k VNĐ/tháng)

## Mục tiêu thành công
- Giáo viên có thể chấm điểm nhanh chóng
- Giao diện đẹp, dễ sử dụng trên mobile
- Âm thanh AI hỗ trợ tốt
- Deploy thành công lên Hostinger với Docker