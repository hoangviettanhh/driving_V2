# Product Context - Driving Test App

## Vấn đề cần giải quyết

### Bối cảnh hiện tại
- Giáo viên dạy lái xe cần chấm điểm thi thử cho học viên
- Quá trình chấm điểm thủ công mất thời gian và dễ sai sót
- Thiếu công cụ hỗ trợ chuẩn hóa việc chấm điểm
- Học viên cần feedback chi tiết về lỗi phổ biến

### Giải pháp đề xuất
Web application mobile-first giúp:
- **Chuẩn hóa**: Quy trình chấm điểm theo đúng tiêu chuẩn
- **Nhanh chóng**: Interface tối ưu cho mobile, thao tác nhanh
- **Chính xác**: Danh sách lỗi chi tiết, tính điểm tự động
- **Hỗ trợ âm thanh**: AI đọc nội dung, giúp giáo viên dễ theo dõi

## Đối tượng người dùng

### Primary Users: Giáo viên dạy lái xe
- **Tuổi**: 25-50
- **Tech-savvy**: Trung bình, quen sử dụng smartphone
- **Nhu cầu**: Chấm điểm nhanh, chính xác, dễ dàng
- **Pain points**: 
  - Nhớ không hết các lỗi và mức điểm
  - Tính toán điểm mất thời gian
  - Khó theo dõi khi đang lái xe cùng học viên

### Secondary Users: Học viên
- **Benefit**: Nhận feedback chi tiết về lỗi
- **Expectation**: Hiểu rõ lý do bị trừ điểm

## User Journey

### Giáo viên sử dụng app:
1. **Đăng nhập** vào hệ thống
2. **Chọn bài thi** từ danh sách 11 bài
3. **Nghe AI đọc** mô tả bài thi
4. **Quan sát học viên** thực hiện
5. **Click vào lỗi** khi phát hiện vi phạm
6. **Nghe AI đọc** chi tiết lỗi
7. **Xem điểm tổng** được tính tự động
8. **Lưu kết quả** và chuyển bài tiếp theo

## Giá trị cốt lõi

### Cho Giáo viên
- **Tiết kiệm thời gian**: Không cần tính toán thủ công
- **Tăng độ chính xác**: Giảm sai sót trong chấm điểm
- **Chuẩn hóa**: Đảm bảo tiêu chuẩn chấm điểm nhất quán
- **Dễ sử dụng**: Interface mobile-friendly

### Cho Trung tâm dạy lái xe
- **Chất lượng giảng dạy**: Chấm điểm chuẩn, chi tiết
- **Hiệu quả**: Giáo viên làm việc nhanh hơn
- **Chi phí thấp**: Chỉ 79k VNĐ/tháng
- **Dễ triển khai**: Docker deployment đơn giản

## Success Metrics

### Immediate (1-3 tháng)
- Giáo viên sử dụng thành thạo app
- Thời gian chấm điểm giảm 50%
- Tỷ lệ sai sót trong chấm điểm giảm

### Long-term (6-12 tháng)
- Mở rộng thêm tính năng quản lý học viên
- Tích hợp báo cáo thống kê
- Scale cho nhiều trung tâm khác