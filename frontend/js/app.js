// ==========================================
// 1. CÁC HÀM TẢI THÔNG TIN TỪ API BACKEND
// ==========================================

// Trang Dashboard: Tải thông tin số liệu đếm tổng hợp
async function loadDashboardStats() {
   try {
        // 1. Tải số liệu đếm tổng quan và tính toán thanh tiến trình
        const responseStats = await fetch('http://localhost:3000/api/dashboard-summary');
        const stats = await responseStats.json();
        
        const total = stats.TongMay || 0;
        const active = stats.MayHoatDong || 0;
        const issue = stats.MayLoi || 0;

        document.getElementById('stat-total').innerText = total;
        document.getElementById('stat-active').innerText = active;
        document.getElementById('stat-issue').innerText = issue;

        // Tính toán % hiệu suất máy hoạt động
        const performancePercent = total > 0 ? Math.round((active / total) * 100) : 0;
        document.getElementById('txt-performance').innerText = performancePercent + '%';
        document.getElementById('bar-performance').style.width = performancePercent + '%';

        // 2. Tải danh sách cảnh báo khẩn cấp
        const responseAlerts = await fetch('http://localhost:3000/api/dashboard-alerts');
        const alertsData = await responseAlerts.json();
        const alertsList = document.getElementById('dashboard-alerts-list');

        if (alertsData.length === 0) {
            alertsList.innerHTML = `<li class="list-group-item text-success text-center small"><i class="fas fa-shield-alt me-1"></i> Toàn bộ hệ thống vận hành an toàn</li>`;
        } else {
            alertsList.innerHTML = alertsData.map(alert => `
                <li class="list-group-item d-flex justify-content-between align-items-center border-start border-danger border-3 mb-2 shadow-sm rounded">
                    <div>
                        <div class="fw-bold text-dark small">${alert.TenTB}</div>
                        <small class="text-muted"><i class="fas fa-map-marker-alt me-1"></i>${alert.ViTri}</small>
                    </div>
                    <span class="badge ${alert.TrangThai === 'Sự cố' ? 'bg-danger' : 'bg-warning text-dark'} small">
                        ${alert.TrangThai}
                    </span>
                </li>
            `).join('');
        }

    } catch (error) {
        console.error('Lỗi khi tải thông tin chi tiết Dashboard:', error);
    }
}

// Trang Thiết bị: Tải bảng danh sách chi tiết máy móc
async function loadDevices() {
    try {
        const response = await fetch('http://localhost:3000/api/thiet-bi');
        const data = await response.json();
        
        const tableBody = document.getElementById('tb-data');
        tableBody.innerHTML = data.map(item => `
            <tr>
                <td><strong>${item.MaTB}</strong></td>
                <td>${item.TenTB}</td>
                <td>${item.ViTri}</td>
                <td>
                    <span class="badge ${item.TrangThai === 'Hoạt động' ? 'bg-success' : item.TrangThai === 'Đang bảo trì' ? 'bg-warning' : 'bg-danger'}">
                        ${item.TrangThai}
                    </span>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Lỗi khi tải bảng danh sách thiết bị:', error);
    }
}

// Trang Lịch sử bảo trì: Tải dữ liệu nhật ký sửa chữa
async function loadMaintenanceHistory() {
    try {
        const response = await fetch('http://localhost:3000/api/lich-su-bao-tri');
        const data = await response.json();
        
        const tableBody = document.getElementById('tb-lich-su-data');
        tableBody.innerHTML = data.map(item => `
            <tr>
                <td><strong>${item.MaPhieu}</strong></td>
                <td>${item.TenTB}</td>
                <td>${item.HoTen}</td>
                <td>${Number(item.ChiPhi).toLocaleString('vi-VN')}</td>
                <td>${item.NoiDung}</td>
                <td>
                    <span class="badge ${item.KetQua === 'Hoàn thành' ? 'bg-success' : 'bg-info'}">
                        ${item.KetQua}
                    </span>
                </td>
                <td>${new Date(item.NgayThucHien).toLocaleDateString('vi-VN')}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Lỗi khi tải lịch sử bảo trì:', error);
    }
}

// ==========================================
// 2. LOGIC ĐIỀU HƯỚNG CHUYỂN ĐỔI MÀN HÌNH
// ==========================================
function switchPage(viewId, activeBtnId) {
    // Ẩn toàn bộ các vùng trang nội dung
    document.querySelectorAll('.page-view').forEach(view => {
        view.style.display = 'none';
    });
    // Chỉ hiển thị vùng trang được chọn
    document.getElementById(viewId).style.display = 'block';

    // Bỏ tô đậm nút menu cũ
    document.querySelectorAll('.sidebar .nav-link').forEach(btn => {
        btn.classList.remove('active');
    });
    // Tô đậm nút menu hiện tại đang bấm
    document.getElementById(activeBtnId).classList.add('active');
}

// Lắng nghe sự kiện click trên Sidebar để tải thông tin riêng biệt
document.getElementById('btn-dashboard').addEventListener('click', () => {
    switchPage('view-dashboard', 'btn-dashboard');
    loadDashboardStats(); // Bấm dashboard -> chỉ tải thông tin ô số tổng quan
});

document.getElementById('btn-thiet-bi').addEventListener('click', () => {
    switchPage('view-thiet-bi', 'btn-thiet-bi');
    loadDevices(); // Bấm thiết bị -> chỉ tải thông tin bảng danh sách
});

document.getElementById('btn-lich-su').addEventListener('click', () => {
    switchPage('view-lich-su', 'btn-lich-su');
    loadMaintenanceHistory(); // Bấm lịch sử -> tải thông tin nhật ký liên kết phối hợp
});

// ==========================================
// 3. LOGIC TRỢ LÝ AI KỸ THUẬT (GEMINI)
// ==========================================
async function askAI() {
    const input = document.getElementById('issue-input');
    const chat = document.getElementById('ai-chat');
    
    if (!input.value.trim()) return;

    chat.innerHTML += `<div class="user-msg text-end mb-2"><strong>Bạn:</strong> ${input.value}</div>`;
    const issue = input.value;
    input.value = 'Đang phân tích...';
    input.disabled = true;

    try {
        const response = await fetch('http://localhost:3000/api/ai/diagnose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceIssue: issue })
        });
        
        const data = await response.json();
        
        chat.innerHTML += `
            <div class="ai-msg bg-light p-2 rounded mb-2">
                <strong>AI:</strong> ${data.advice}
            </div>`;
    } catch (error) {
        chat.innerHTML += `<div class="text-danger ai-msg mb-2">Lỗi: Không thể kết nối AI.</div>`;
    } finally {
        input.value = '';
        input.disabled = false;
        chat.scrollTop = chat.scrollHeight;
    }
}
// Ẩn hiện hộp chat AI khi bấm vào tiêu đề và đổi icon mũi tên
document.getElementById('ai-header').addEventListener('click', function() {
    const aiBox = document.getElementById('ai-box');
    const toggleIcon = document.getElementById('ai-toggle-icon');
    
    // Bật/tắt class 'collapsed' để thu hẹp hoặc mở rộng hộp chat
    aiBox.classList.toggle('collapsed');
    
    // Đổi chiều mũi tên icon dựa theo trạng thái đóng/mở
    if (aiBox.classList.contains('collapsed')) {
        toggleIcon.classList.remove('fas', 'fa-chevron-down');
        toggleIcon.classList.add('fas', 'fa-chevron-up'); // Mũi tên hướng lên báo hiệu bấm để mở
    } else {
        toggleIcon.classList.remove('fas', 'fa-chevron-up');
        toggleIcon.classList.add('fas', 'fa-chevron-down'); // Mũi tên hướng xuống báo hiệu bấm để thu gọn
    }
});

// Khi vừa mở trang web, hiển thị mặc định trang Dashboard và nạp số liệu
document.addEventListener('DOMContentLoaded', () => {
    switchPage('view-dashboard', 'btn-dashboard');
    loadDashboardStats();
});

document.getElementById('issue-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        askAI();
    }
});