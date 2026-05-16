USE QUANLYBAOTRITHIETBI; -- Bắt buộc phải có dòng này
GO

CREATE OR ALTER VIEW vw_ThietBi_Status AS
SELECT 
    T.MaTB, 
    T.TenTB, 
    T.TrangThai, 
    T.ViTri,
    MAX(P.NgayThucHien) AS LanCuoiBaoTri,
    COUNT(P.MaPhieu) AS TongSoLanBaoTri
FROM THIET_BI T
LEFT JOIN PHIEU_BAO_TRI P ON T.MaTB = P.MaTB
GROUP BY T.MaTB, T.TenTB, T.TrangThai, T.ViTri;
GO