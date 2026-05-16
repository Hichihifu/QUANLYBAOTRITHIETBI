USE QUANLYBAOTRITHIETBI;
GO

-- Xóa Trigger cũ nếu có
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_KiemTraXoaThietBi')
    DROP TRIGGER trg_KiemTraXoaThietBi;
GO

CREATE TRIGGER trg_KiemTraXoaThietBi
ON THIET_BI
INSTEAD OF DELETE
AS
BEGIN
    IF EXISTS (SELECT 1 FROM PHIEU_BAO_TRI WHERE MaTB IN (SELECT MaTB FROM deleted))
    BEGIN
        RAISERROR(N'Không thể xóa thiết bị vì đã có lịch sử dữ liệu!', 16, 1);
        ROLLBACK TRANSACTION;
    END
    ELSE
    BEGIN
        DELETE FROM THIET_BI WHERE MaTB IN (SELECT MaTB FROM deleted);
    END
END;
GO