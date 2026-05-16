let currentRole = '';
let sessionMaNV = ''; // Lưu trữ mã định danh Kỹ thuật viên trích xuất từ Session đăng nhập

// LOGIC ĐĂNG NHẬP HỆ THỐNG
async function handleLogin() {
    const usernameInput = document.getElementById('username-input').value.trim();
    const passwordInput = document.getElementById('password-input').value.trim();
    const errorAlert = document.getElementById('login-error');

    if (!usernameInput || !passwordInput) {
        errorAlert.innerText = "Vui lòng nhập đầy đủ tài khoản và mật khẩu!";
        errorAlert.classList.remove('d-none');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });
        
        const data = await response.json();

        if (data.success) {
            currentRole = data.user.Quyen;
            sessionMaNV = data.user.MaNV; // Ghi nhận mã nhân viên ngầm từ phiên đăng nhập hiện tại

            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('main-app').style.display = 'block';

            document.getElementById('user-display-name').innerText = data.user.HoTen;
            document.getElementById('user-display-role').innerText = currentRole === 'admin' ? 'Administrator' : 'Kỹ thuật viên';

            // Phân quyền giao diện: Cả admin và staff đều xem được tab lịch sử, nhưng chỉ staff được quyền lập phiếu mới
            const btnOpenTicket = document.getElementById('btn-open-ticket');
            if (btnOpenTicket) {
                btnOpenTicket.style.display = currentRole === 'staff' ? 'block' : 'none';
            }

            switchPage('view-dashboard', 'btn-dashboard');
            loadDashboardStats();
            errorAlert.classList.add('d-none');
        } else {
            errorAlert.innerText = data.message;
            errorAlert.classList.remove('d-none');
        }
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        errorAlert.innerText = "Không thể kết nối đến máy chủ Backend!";
        errorAlert.classList.remove('d-none');
    }
}

// Hàm mở Modal lập phiếu và tự động điền mã nhân viên từ Session đăng nhập
async function openCreateTicketModal() {
    // Tự động gán chặt mã kỹ thuật viên lấy từ Session hiện hành vào form, khóa cứng không cho gõ tay đổi mã
    document.getElementById('ticket-staff-id').value = sessionMaNV;
    
    // Xóa trống các ô nhập liệu cũ của form
    document.getElementById('ticket-id').value = '';
    document.getElementById('ticket-cost').value = '';
    document.getElementById('ticket-content').value = '';

    // Tải danh sách thiết bị cho thẻ select
    try {
        const response = await fetch('http://localhost:3000/api/thiet-bi');
        const devices = await response.json();
        const selectBox = document.getElementById('ticket-device-select');
        selectBox.innerHTML = devices.map(d => `<option value="${d.MaTB}">${d.TenTB}</option>`).join('');
    } catch (err) {
        console.error("Không thể tải danh sách máy móc:", err);
    }

    const ticketModal = new bootstrap.Modal(document.getElementById('createTicketModal'));
    ticketModal.show();
}

// Gửi phiếu bảo trì mới lên Backend để lưu trữ vào CSDL
async function submitCreateTicket() {
    const ticketId = document.getElementById('ticket-id').value.trim();
    const deviceId = document.getElementById('ticket-device-select').value;
    const staffId = document.getElementById('ticket-staff-id').value; // Trích xuất an toàn từ ô readonly
    const cost = document.getElementById('ticket-cost').value.trim();
    const content = document.getElementById('ticket-content').value.trim();
    const result = document.getElementById('ticket-result').value;

    if (!ticketId || !cost || !content) {
        alert("Vui lòng điền đầy đủ các trường thông tin bắt buộc!");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/lich-su-bao-tri', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                MaPhieu: ticketId,
                MaTB: deviceId,
                MaNV: staffId,
                ChiPhi: cost,
                NoiDung: content,
                KetQua: result
            })
        });

        if (response.ok) {
            alert("Lập phiếu nghiệm thu bảo trì thành công! Hệ thống đã ghi nhận nhân sự chịu trách nhiệm.");
            const modalElement = document.getElementById('createTicketModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();

            loadMaintenanceHistory(); // Cập nhật lại bảng lịch sử bảo trì ngoài giao diện chính
        } else {
            alert("Lỗi: Không thể lưu phiếu. Vui lòng kiểm tra lại mã phiếu xem có trùng không.");
        }
    } catch (err) {
        console.error("Lỗi lập phiếu:", err);
    }
}

function handleLogout() {
    currentRole = ''; sessionMaNV = '';
    document.getElementById('username-input').value = ''; document.getElementById('password-input').value = '';
    document.getElementById('main-app').style.display = 'none'; document.getElementById('login-screen').style.display = 'flex';
}

// ==========================================
// CÁC HÀM TẢI THÔNG TIN TỪ API BACKEND
// ==========================================

async function loadDashboardStats() {
   try {
        const responseStats = await fetch('http://localhost:3000/api/dashboard-summary');
        const stats = await responseStats.json();
        document.getElementById('stat-total').innerText = stats.TongMay || 0;
        document.getElementById('stat-active').innerText = stats.MayHoatDong || 0;
        document.getElementById('stat-issue').innerText = stats.MayLoi || 0;
        const performancePercent = stats.TongMay > 0 ? Math.round((stats.MayHoatDong / stats.TongMay) * 100) : 0;
        document.getElementById('txt-performance').innerText = performancePercent + '%';
        document.getElementById('bar-performance').style.width = performancePercent + '%';

        const responseAlerts = await fetch('http://localhost:3000/api/dashboard-alerts');
        const alertsData = await responseAlerts.json();
        const alertsList = document.getElementById('dashboard-alerts-list');
        if (alertsData.length === 0) {
            alertsList.innerHTML = `<li class="list-group-item text-success text-center small"><i class="fas fa-shield-alt me-1"></i> Hệ thống an toàn</li>`;
        } else {
            alertsList.innerHTML = alertsData.map(alert => `
                <li class="list-group-item d-flex justify-content-between align-items-center border-start border-danger border-3 mb-2 small shadow-sm rounded">
                    <div><div class="fw-bold">${alert.TenTB}</div><small class="text-muted">${alert.ViTri}</small></div>
                    <span class="badge ${alert.TrangThai === 'Sự cố' ? 'bg-danger' : 'bg-warning text-dark'} small">${alert.TrangThai}</span>
                </li>`).join('');
        }
    } catch (error) { console.error(error); }
}

async function loadDevices() {
    try {
        const response = await fetch('http://localhost:3000/api/thiet-bi');
        const data = await response.json();
        const thHanhDong = document.querySelector('.th-hanh-dong');
        if (thHanhDong) { thHanhDong.style.display = currentRole === 'admin' ? 'table-cell' : 'none'; }
        const tableBody = document.getElementById('tb-data');
        if (tableBody) {
            tableBody.innerHTML = data.map(item => `
                <tr>
                    <td><strong>${item.MaTB}</strong></td><td>${item.TenTB}</td><td>${item.ViTri}</td>
                    <td><span class="badge ${item.TrangThai === 'Hoạt động' ? 'bg-success' : item.TrangThai === 'Đang bảo trì' ? 'bg-warning text-dark' : 'bg-danger'}">${item.TrangThai}</span></td>
                    <td class="text-end fw-bold text-secondary">${Number(item.TongChiPhiBaoTri).toLocaleString('vi-VN')} đ</td>
                    <td style="display: ${currentRole === 'admin' ? 'table-cell' : 'none'}">
                        <button class="btn btn-sm btn-outline-primary" onclick="showEditModal('${item.MaTB}', '${item.TenTB}', '${item.TrangThai}')"><i class="fas fa-edit"></i> Sửa</button>
                    </td>
                </tr>`).join('');
        }
    } catch (error) { console.error(error); }
}

function showEditModal(id, name, status) {
    document.getElementById('edit-id').value = id; document.getElementById('edit-name').value = name; document.getElementById('edit-status').value = status;
    const editModal = new bootstrap.Modal(document.getElementById('editDeviceModal')); editModal.show();
}

async function submitEditDevice() {
    const id = document.getElementById('edit-id').value; const status = document.getElementById('edit-status').value;
    try {
        const response = await fetch(`http://localhost:3000/api/thiet-bi/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole }, body: JSON.stringify({ TrangThai: status })
        });
        if (response.ok) {
            alert('Cập nhật thành công!'); bootstrap.Modal.getInstance(document.getElementById('editDeviceModal')).hide(); loadDevices(); loadDashboardStats();
        }
    } catch (error) { console.error(error); }
}

async function loadMaintenanceHistory() {
    try {
        const response = await fetch('http://localhost:3000/api/lich-su-bao-tri');
        const data = await response.json();
        const tableBody = document.getElementById('tb-lich-su-data');
        if (tableBody) {
            tableBody.innerHTML = data.map(item => `
                <tr>
                    <td><strong>${item.MaPhieu}</strong></td><td>${item.TenTB}</td><td>${item.HoTen}</td>
                    <td>${Number(item.ChiPhi).toLocaleString('vi-VN')} đ</td><td>${item.NoiDung}</td>
                    <td><span class="badge ${item.KetQua === 'Hoàn thành' ? 'bg-success' : 'bg-info'}">${item.KetQua}</span></td>
                    <td>${new Date(item.NgayThucHien).toLocaleDateString('vi-VN')}</td>
                </tr>`).join('');
        }
    } catch (error) { console.error(error); }
}

function switchPage(viewId, activeBtnId) {
    document.querySelectorAll('.page-view').forEach(view => view.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';
    document.querySelectorAll('.sidebar .nav-link').forEach(btn => btn.classList.remove('active'));
    document.getElementById(activeBtnId).classList.add('active');
}

document.getElementById('btn-dashboard').addEventListener('click', () => { switchPage('view-dashboard', 'btn-dashboard'); loadDashboardStats(); });
document.getElementById('btn-thiet-bi').addEventListener('click', () => { switchPage('view-thiet-bi', 'btn-thiet-bi'); loadDevices(); });
document.getElementById('btn-lich-su').addEventListener('click', () => { switchPage('view-lich-su', 'btn-lich-su'); loadMaintenanceHistory(); });

async function askAI() {
    const input = document.getElementById('issue-input'); const chat = document.getElementById('ai-chat');
    if (!input.value.trim()) return;
    chat.innerHTML += `<div class="user-msg text-end mb-2"><strong>Bạn:</strong> ${input.value}</div>`;
    const issue = input.value; input.value = 'Đang phân tích cấu trúc...'; input.disabled = true;
    try {
        const response = await fetch('http://localhost:3000/api/ai/diagnose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceIssue: issue }) });
        const data = await response.json();
        chat.innerHTML += `<div class="ai-msg bg-light p-2 rounded mb-2"><strong>AI Trợ lý:</strong> ${data.advice}<div class="mt-2 text-primary small fw-bold"><i class="fas fa-database me-1"></i> Lệnh SQL gợi ý:</div><div class="sql-suggestion">${data.sqlSuggestion}</div></div>`;
    } catch (error) { console.error(error); } finally { input.value = ''; input.disabled = false; chat.scrollTop = chat.scrollHeight; }
}

document.getElementById('ai-header')
    .addEventListener('click', function() {
        const aiBox = document
            .getElementById('ai-box'); 
            const toggleIcon = document.getElementById('ai-toggle-icon');
        aiBox
            .classList
            .toggle('collapsed'); 
        toggleIcon
            .className = aiBox.classList.contains('collapsed') ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    });

document.getElementById('issue-input')
    .addEventListener('keydown', function(event) {
        if (event.key === 'Enter') { 
            event.preventDefault(); 
            if (currentRole) askAI(); 
        } 
    });
document.getElementById('password-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleLogin();
    }
});