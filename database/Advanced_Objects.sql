-- ==========================================================================
-- FILE 03: KHỞI TẠO CÁC ĐỐI TƯỢNG NÂNG CAO ĐỂ ĐÁP ỨNG ĐỀ BÀI (CÂU C & D)
-- ==========================================================================
USE QUANLYBAOTRITHIETBI;
GO

-- 1. VIEW: Khai thác CSDL phối hợp kết hợp 3 bảng dữ liệu (Hiển thị tab Nhật ký lịch sử)
CREATE OR ALTER VIEW v_LichSuBaoTri
AS
SELECT 
    p.MaPhieu,
    t.TenTB,
    n.HoTen,
    p.ChiPhi,
    p.NoiDung,
    p.KetQua,
    p.NgayThucHien
FROM PHIEU_BAO_TRI p
INNER JOIN THIET_BI t ON p.MaTB = t.MaTB
INNER JOIN NHAN_VIEN n ON p.MaNV = n.MaNV;
GO

-- 2. STORED PROCEDURE: Tổng hợp số liệu hệ thống thời gian thực (Hiển thị ô số Dashboard)
CREATE OR ALTER PROCEDURE sp_GetDashboardSummary
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        COUNT(*) AS TongMay,
        SUM(CASE WHEN TrangThai = N'Hoạt động' THEN 1 ELSE 0 END) AS MayHoatDong,
        SUM(CASE WHEN TrangThai = N'Sự cố' OR TrangThai = N'Đang bảo trì' THEN 1 ELSE 0 END) AS MayLoi
    FROM THIET_BI;
END;
GO

-- 3. FUNCTION: Tính toán lũy kế tổng chi phí sửa chữa của từng thiết bị dựa theo MaTB (Hiển thị tab Thiết bị)
CREATE OR ALTER FUNCTION fn_TongChiPhiThietBi (@MaTB VARCHAR(10))
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @TongChiPhi DECIMAL(18,2);
    SELECT @TongChiPhi = ISNULL(SUM(ChiPhi), 0) 
    FROM PHIEU_BAO_TRI 
    WHERE MaTB = @MaTB;
    RETURN @TongChiPhi;
END;
GO

-- 4. TRIGGER: Tự động đồng bộ chuyển đổi trạng thái máy sang 'Đang bảo trì' khi kỹ thuật viên lập phiếu 'Đang sửa chữa'
CREATE OR ALTER TRIGGER trg_AutoUpdateDeviceStatus
ON PHIEU_BAO_TRI
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE THIET_BI
    SET TrangThai = N'Đang bảo trì'
    FROM THIET_BI t
    INNER JOIN inserted i ON t.MaTB = i.MaTB
    WHERE i.KetQua = N'Đang sửa chữa';
END;
GO