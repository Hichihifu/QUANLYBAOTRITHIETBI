USE QUANLYBAOTRITHIETBI;
GO

CREATE OR ALTER PROCEDURE sp_LapPhieuBaoTri
    @MaP VARCHAR(10), 
    @MaTB VARCHAR(10), 
    @MaNV VARCHAR(10), 
    @ChiPhi DECIMAL(18,2), 
    @NoiDung NVARCHAR(MAX),
    @KetQua NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO PHIEU_BAO_TRI(MaPhieu, MaTB, MaNV, ChiPhi, NoiDung, KetQua, NgayThucHien)
        VALUES (@MaP, @MaTB, @MaNV, @ChiPhi, @NoiDung, @KetQua, GETDATE());
        
        UPDATE THIET_BI 
        SET TrangThai = CASE WHEN @KetQua = N'Hoàn thành' THEN N'Hoạt động' ELSE N'Đang bảo trì' END
        WHERE MaTB = @MaTB;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO