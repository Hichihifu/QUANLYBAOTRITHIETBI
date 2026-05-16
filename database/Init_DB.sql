-- ==========================================================================
-- FILE 01: KHỞI TẠO CƠ SỞ DỮ LIỆU & CÁC BẢNG CỐT LÕI
-- ==========================================================================
USE master;
GO

-- Xóa database cũ nếu đang tồn tại để làm sạch hệ thống hoàn toàn
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'QUANLYBAOTRITHIETBI')
BEGIN
    ALTER DATABASE QUANLYBAOTRITHIETBI SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE QUANLYBAOTRITHIETBI;
END
GO

-- Tạo mới database dự án
CREATE DATABASE QUANLYBAOTRITHIETBI;
GO

USE QUANLYBAOTRITHIETBI;
GO

-- 1. Tạo bảng Thiết bị công nghiệp
CREATE TABLE THIET_BI (
    MaTB VARCHAR(10) PRIMARY KEY,
    TenTB NVARCHAR(100) NOT NULL,
    LoaiTB NVARCHAR(50),
    ViTri NVARCHAR(100),
    TrangThai NVARCHAR(50) -- Gồm các trạng thái: 'Hoạt động', 'Đang bảo trì', 'Sự cố'
);
GO

-- 2. Tạo bảng Nhân viên kỹ thuật
CREATE TABLE NHAN_VIEN (
    MaNV VARCHAR(10) PRIMARY KEY,
    HoTen NVARCHAR(100) NOT NULL,
    ChuyenMon NVARCHAR(100)
);
GO

-- 3. Tạo bảng Phiếu bảo trì nghiệm thu (Có khóa ngoại liên kết)
CREATE TABLE PHIEU_BAO_TRI (
    MaPhieu VARCHAR(10) PRIMARY KEY,
    MaTB VARCHAR(10) FOREIGN KEY REFERENCES THIET_BI(MaTB),
    MaNV VARCHAR(10) FOREIGN KEY REFERENCES NHAN_VIEN(MaNV),
    ChiPhi DECIMAL(18,2) NOT NULL,
    NoiDung NVARCHAR(MAX),
    KetQua NVARCHAR(50), -- Gồm các kết quả: 'Hoàn thành', 'Đang sửa chữa'
    NgayThucHien DATE NOT NULL
);
GO

-- 4. Tạo bảng Người dùng (Hệ thống quản lý tài khoản đăng nhập phân quyền)
CREATE TABLE NGUOI_DUNG (
    TaiKhoan VARCHAR(50) PRIMARY KEY,
    MatKhau VARCHAR(50) NOT NULL,
    Quyen VARCHAR(20), -- Phân chia phân quyền: 'admin' hoặc 'staff'
    MaNV VARCHAR(10) FOREIGN KEY REFERENCES NHAN_VIEN(MaNV) -- Gán chặt phiên làm việc với nhân sự thực tế để trích xuất Session
);
GO