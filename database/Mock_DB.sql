-- ==========================================================================
-- FILE 02: NẠP DỮ LIỆU MẪU (MOCK DATA) SẠCH CHO HỆ THỐNG
-- ==========================================================================
USE QUANLYBAOTRITHIETBI;
GO

-- 1. Nạp dữ liệu danh sách 15 thiết bị nhà xưởng thực tế
INSERT INTO THIET_BI (MaTB, TenTB, LoaiTB, ViTri, TrangThai) VALUES 
('TB001', N'Máy Phay CNC 5 Trục', N'Cơ khí', N'Xưởng Cơ Khí A', N'Hoạt động'),
('TB002', N'Robot Hàn Tự Động Kuka', N'Tự động hóa', N'Xưởng Lắp Ráp B', N'Đang bảo trì'),
('TB003', N'Máy Nén Khí Trục Vít Fusion', N'Phụ trợ', N'Trạm Nguồn Kỹ Thuật', N'Hoạt động'),
('TB004', N'Lò Tôi Cao Tần Chu Kỳ', N'Nhiệt luyện', N'Phòng Nhiệt Luyện', N'Sự cố'),
('TB005', N'Máy Cắt Laser Fiber 6000W', N'Cơ khí', N'Xưởng Cơ Khí A', N'Hoạt động'),
('TB006', N'Băng Tải Con Lăn Thông Minh', N'Tự động hóa', N'Kho Đóng Gói C', N'Hoạt động'),
('TB007', N'Hệ Thống Điều Hòa Trung Tâm Chiller', N'Phụ trợ', N'Tầng Thượng Khu A', N'Đang bảo trì'),
('TB008', N'Máy Ép Nhựa Thủy Lực Haitai', N'Cơ khí', N'Xưởng Đúc Nhựa D', N'Hoạt động'),
('TB009', N'Trạm Biến Áp Hạ Thế 22/0.4kV', N'Điện tử', N'Trạm Điện Trung Tâm', N'Hoạt động'),
('TB010', N'Máy Kiểm Tra Bo Mạch ICT', N'Điện tử', N'Phòng Sạch Linh Kiện', N'Sự cố'),
('TB011', N'Cánh Tay Robot Gắp Hàng ABB', N'Tự động hóa', N'Kho Đóng Gói C', N'Hoạt động'),
('TB012', N'Máy Tiện Vạn Năng', N'Cơ khí', N'Xưởng Cơ Khí A', N'Hoạt động'),
('TB013', N'Hệ Thống Xử Lý Nước Thải', N'Phụ trợ', N'Khu Xử Lý Chất Thải', N'Hoạt động'),
('TB014', N'Máy Phát Điện Dự Phòng Cummins', N'Phụ trợ', N'Trạm Nguồn Kỹ Thuật', N'Đang bảo trì'),
('TB015', N'Lò Sấy Công Nghiệp Tuần Hoàn', N'Nhiệt luyện', N'Phòng Nhiệt Luyện', N'Hoạt động');

-- 2. Nạp dữ liệu danh sách 10 nhân viên kỹ thuật
INSERT INTO NHAN_VIEN (MaNV, HoTen, ChuyenMon) VALUES 
('NV001', N'Nguyễn Văn Hùng', N'Cơ khí chế tạo'),
('NV002', N'Trần Thị Bích', N'Điện tử viễn thông'),
('NV003', N'Lê Hoàng Nam', N'Tự động hóa'),
('NV004', N'Phạm Minh Đức', N'Điện công nghiệp'),
('NV005', N'Vũ Tiến Đạt', N'Cơ khí thủy lực'),
('NV006', N'Hoàng Thanh Tùng', N'Tự động hóa'),
('NV007', N'Đặng Hồng Nhung', N'Điện tử viễn thông'),
('NV008', N'Đỗ Bảo Lâm', N'Nhiệt lạnh / Chiller'),
('NV009', N'Ngô Chí Trung', N'Cơ khí chế tạo'),
('NV010', N'Bùi Quang Huy', N'Điện công nghiệp');

-- 3. Nạp dữ liệu danh sách 5 phiếu bảo trì lịch sử ban đầu
INSERT INTO PHIEU_BAO_TRI (MaPhieu, MaTB, MaNV, ChiPhi, NoiDung, KetQua, NgayThucHien) VALUES 
('P001', 'TB001', 'NV001', 1500000.00, N'Thay dầu trục chính và căn chỉnh lại thước quang', N'Hoàn thành', '2026-04-10'),
('P002', 'TB003', 'NV004', 850000.00, N'Thay thế lọc tách dầu và vệ sinh lọc gió', N'Hoàn thành', '2026-04-15'),
('P003', 'TB007', 'NV008', 4200000.00, N'Bảo dưỡng định kỳ cục máy nén Chiller trung tâm', N'Đang sửa chữa', '2026-05-10'),
('P004', 'TB002', 'NV003', 2300000.00, N'Fix lỗi kẹt khớp trục số 4 của cánh tay robot', N'Đang sửa chữa', '2026-05-12'),
('P005', 'TB009', 'NV010', 500000.00, N'Kiểm tra định kỳ và châm thêm dầu biến áp', N'Hoàn thành', '2026-05-01');

-- 4. Nạp dữ liệu hệ thống tài khoản phân quyền đăng nhập (Đáp ứng yêu cầu bảo mật 2.c)
INSERT INTO NGUOI_DUNG (TaiKhoan, MatKhau, Quyen, MaNV) VALUES 
('admin', '123456', 'admin', 'NV001'),
('staff', '123456', 'staff', 'NV003');
GO