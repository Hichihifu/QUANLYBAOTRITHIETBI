const express = require('express');
const sql = require('mssql');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Khai báo kết nối tĩnh 
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || '127.0.0.1', 
    database: process.env.DB_NAME,
    options: {
        encrypt: true, 
        trustServerCertificate: true, 
        enableArithAbort: true
    },
    port: 1433 
};

// API 1: Lấy danh sách toàn bộ thiết bị
app.get('/api/thiet-bi', async (req, res) => {
    try {
        let pool = await sql.connect(config); // Đã sửa từ dbConfig thành config
        let result = await pool.request().query('SELECT * FROM THIET_BI');
        res.json(result.recordset);
    } catch (err) { 
        res.status(500).send(err.message); 
    }
});

// API 2: Lấy thông tin tổng quan cho dashboard
app.get('/api/dashboard-summary', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        
        // Chạy câu lệnh SQL đếm trực tiếp trong Database
        let result = await pool.request().query(`
            SELECT 
                COUNT(*) AS TongMay,
                SUM(CASE WHEN TrangThai = N'Hoạt động' THEN 1 ELSE 0 END) AS MayHoatDong,
                SUM(CASE WHEN TrangThai = N'Sự cố' OR TrangThai = N'Đang bảo trì' THEN 1 ELSE 0 END) AS MayLoi
            FROM THIET_BI
        `);
        
        // Trả về kết quả dạng ô số { TongMay: X, MayHoatDong: Y, MayLoi: Z }
        res.json(result.recordset[0]); 
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// API 3: Lấy lịch sử bảo trì phối hợp thông tin (MỚI THÊM)
app.get('/api/lich-su-bao-tri', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        // Truy vấn JOIN 3 bảng để hiển thị thông tin rõ ràng ra màn hình web
        let queryStr = `
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
            INNER JOIN NHAN_VIEN n ON p.MaNV = n.MaNV
        `;
        let result = await pool.request().query(queryStr);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// API 4: Trợ lý AI phân tích lỗi
app.post('/api/ai/diagnose', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        
        // Kiểm tra xem Backend đã đọc được API Key từ .env chưa
        if (!apiKey) {
            console.error("❌ LỖI: Chưa cấu hình GEMINI_API_KEY trong file .env!");
            return res.status(500).json({ advice: "Hệ thống chưa cấu hình mã bảo mật AI (API Key)." });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Sử dụng model ổn định nhất
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const { deviceIssue } = req.body;

        if (!deviceIssue) {
            return res.status(400).json({ advice: "Nội dung câu hỏi không được để trống." });
        }

        const prompt = `Bạn là chuyên gia kỹ thuật máy móc nhà xưởng. Người dùng báo lỗi: ${deviceIssue}. Hãy đưa ra hướng dẫn khắc phục ngắn gọn, rõ ràng bằng tiếng Việt.`;
        
        console.log(`[AI] Đang xử lý câu hỏi: "${deviceIssue}"...`);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        console.log("✅ [AI] Đã phản hồi thành công!");
        res.json({ advice: responseText });

    } catch (err) { 
        // In toàn bộ lỗi kỹ thuật chi tiết ra Terminal để bạn đọc được
        console.error("❌ LỖI AI THỰC TẾ:", err); 
        res.status(500).json({ advice: "Trợ lý AI đang bận hoặc gặp lỗi kết nối tới máy chủ Google: " + err.message }); 
    }
});

// API5: Lấy danh sách thiết bị cảnh báo (Sự cố/Bảo trì) cho Dashboard
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
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));