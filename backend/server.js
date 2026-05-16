const express = require('express');
const sql = require('mssql');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || '127.0.0.1', 
    database: process.env.DB_NAME || 'QUANLYBAOTRITHIETBI',
    options: {
        encrypt: true, 
        trustServerCertificate: true, 
        enableArithAbort: true
    },
    serverName: 'localhost',
    port: 1433 
};

// API: Xử lý Đăng nhập hệ thống (Trích xuất kèm mã nhân viên MaNV của phiên làm việc)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        let pool = await sql.connect(config);
        
        let result = await pool.request()
            .input('TaiKhoan', sql.VarChar(50), username)
            .input('MatKhau', sql.VarChar(50), password)
            .query(`
                SELECT u.TaiKhoan, u.Quyen, u.MaNV, n.HoTen 
                FROM NGUOI_DUNG u
                LEFT JOIN NHAN_VIEN n ON u.MaNV = n.MaNV
                WHERE u.TaiKhoan = @TaiKhoan AND u.MatKhau = @MatKhau
            `);

        if (result.recordset.length > 0) {
            res.json({ success: true, user: result.recordset[0] });
        } else {
            res.json({ success: false, message: "Tài khoản hoặc mật khẩu không chính xác!" });
        }
    } catch (err) {
        console.error("❌ LỖI API ĐĂNG NHẬP:", err.message);
        res.status(500).send(err.message);
    }
});

// API: Tiếp nhận dữ liệu lập phiếu nghiệm thu bảo trì từ Kỹ thuật viên
app.post('/api/lich-su-bao-tri', async (req, res) => {
    try {
        const { MaPhieu, MaTB, MaNV, ChiPhi, NoiDung, KetQua } = req.body;
        let pool = await sql.connect(config);
        
        // Thực hiện chèn phiếu mới vào CSDL, kích hoạt TRIGGER trg_AutoUpdateDeviceStatus chạy ngầm tự động
        await pool.request()
            .input('MaPhieu', sql.VarChar(10), MaPhieu)
            .input('MaTB', sql.VarChar(10), MaTB)
            .input('MaNV', sql.VarChar(10), MaNV)
            .input('ChiPhi', sql.Decimal(18,2), ChiPhi)
            .input('NoiDung', sql.NVarChar(sql.MAX), NoiDung)
            .input('KetQua', sql.NVarChar(50), KetQua)
            .input('NgayThucHien', sql.Date, new Date()) // Tự động lấy ngày hôm nay
            .query(`
                INSERT INTO PHIEU_BAO_TRI (MaPhieu, MaTB, MaNV, ChiPhi, NoiDung, KetQua, NgayThucHien)
                VALUES (@MaPhieu, @MaTB, @MaNV, @ChiPhi, @NoiDung, @KetQua, @NgayThucHien)
            `);

        res.sendStatus(201); // Trả về mã thành công 201 (Created)
    } catch (err) {
        console.error("❌ LỖI API LẬP PHIẾU BẢO TRÌ:", err.message);
        res.status(500).send(err.message);
    }
});

// API: Lấy danh sách thiết bị (Kết hợp gọi FUNCTION)
app.get('/api/thiet-bi', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query(`
            SELECT MaTB, TenTB, ViTri, TrangThai, 
                   dbo.fn_TongChiPhiThietBi(MaTB) AS TongChiPhiBaoTri 
            FROM THIET_BI
        `);
        res.json(result.recordset);
    } catch (err) { 
        console.error("❌ LỖI API THIẾT BỊ:", err.message);
        res.status(500).send(err.message); 
    }
});

// API: Cập nhật trạng thái thiết bị (Admin)
app.put('/api/thiet-bi/:id', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role'];
        if (userRole !== 'admin') { return res.status(403).send("Từ chối thao tác!"); }
        
        const { id } = req.params;
        const { TrangThai } = req.body;
        let pool = await sql.connect(config);
        await pool.request()
            .input('MaTB', sql.VarChar(10), id)
            .input('TrangThai', sql.NVarChar(50), TrangThai)
            .query('UPDATE THIET_BI SET TrangThai = @TrangThai WHERE MaTB = @MaTB');
        res.sendStatus(200);
    } catch (err) { 
        console.error("❌ LỖI API CẬP NHẬT THIẾT BỊ:", err.message);
        res.status(500).send(err.message); 
    }
});

// API: Thống kê ô số Dashboard (Gọi STORED PROCEDURE)
app.get('/api/dashboard-summary', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().execute('sp_GetDashboardSummary');
        res.json(result.recordset[0]); 
    } catch (err) { 
        console.error("❌ LỖI API DASHBOARD SUMMARY:", err.message);
        res.status(500).send(err.message); 
    }
});

// API: Lấy lịch sử bảo trì (Khai thác qua VIEW)
app.get('/api/lich-su-bao-tri', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query('SELECT * FROM v_LichSuBaoTri ORDER BY NgayThucHien DESC');
        res.json(result.recordset);
    } catch (err) { 
        console.error("❌ LỖI API LỊCH SỬ BẢO TRÌ:", err.message);
        res.status(500).send(err.message); 
    }
});

// API: Trợ lý AI
app.post('/api/ai/diagnose', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const { deviceIssue } = req.body;
        
        const prompt = `
            Bạn là một trợ lý AI thông minh tích hợp vào hệ thống Quản lý bảo trì thiết bị công nghiệp.
            Hệ thống có cấu trúc bảng sau:
            - THIET_BI(MaTB, TenTB, LoaiTB, ViTri, TrangThai)
            - NHAN_VIEN(MaNV, HoTen, ChuyenMon)
            - PHIEU_BAO_TRI(MaPhieu, MaTB, MaNV, ChiPhi, NoiDung, KetQua, NgayThucHien)
            - View: v_LichSuBaoTri
            - Function: dbo.fn_TongChiPhiThietBi(MaTB)

            Yêu cầu từ quản trị viên: "${deviceIssue}".
            
            Hãy thực hiện 2 việc:
            1. Trả lời hướng xử lý ngắn gọn hoặc giải thích nghiệp vụ bằng tiếng Việt.
            2. Tạo câu lệnh SQL chuẩn để lấy dữ liệu theo đúng yêu cầu trên. Phải đặt câu lệnh SQL sau phân tách [SQL_COMMAND].
        `;
        
        const result = await model.generateContent(prompt);
        const fullText = result.response.text();
        const parts = fullText.split('[SQL_COMMAND]');
        res.json({ advice: parts[0].trim(), sqlSuggestion: parts[1] ? parts[1].trim() : "" });
    } catch (err) { 
        console.error("❌ LỖI API AI DIAGNOSE:", err.message);
        res.status(500).json({ advice: "Lỗi kết nối AI", sqlSuggestion: "" }); 
    }
});

// API: Lấy danh sách thiết bị lỗi cho Dashboard
app.get('/api/dashboard-alerts', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query(`
            SELECT TOP 3 MaTB, TenTB, ViTri, TrangThai 
            FROM THIET_BI 
            WHERE TrangThai = N'Sự cố' OR TrangThai = N'Đang bảo trì' 
            ORDER BY MaTB DESC
        `);
        res.json(result.recordset);
    } catch (err) { 
        console.error("❌ LỖI API DASHBOARD ALERTS:", err.message);
        res.status(500).send(err.message); 
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));