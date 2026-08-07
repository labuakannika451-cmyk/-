// ปรับระบบให้ทำงานแบบ Hybrid (ใช้งานได้แม้อยู่บน Browser เปล่าๆ หรือผ่าน Node.js Server)
const API_URL = window.location.protocol.startsWith('http') ? '/api' : null;

// ฐานข้อมูลจำลองกรณีเปิดไฟล์เดี่ยวบนเบราว์เซอร์
let localEquipments = JSON.parse(localStorage.getItem('localEquipments')) || [
    { id: "SP01", name: "ลูกฟุตบอล", available: 10 },
    { id: "SP02", name: "ลูกบาสเกตบอล", available: 2 },
    { id: "SP03", name: "ไม้แบดมินตัน", available: 12 },
    { id: "SP04", name: "ลูกวอลเลย์บอล", available: 0 },
    { id: "SP05", name: "ลูกปิงปอง", available: 30 }
];

function saveLocalStock() {
    localStorage.setItem('localEquipments', JSON.stringify(localEquipments));
}

function toggleForm(type) {
    const errorMsg = document.getElementById('error-msg');
    if (errorMsg) errorMsg.style.display = 'none';

    if (type === 'register') {
        document.getElementById('login-box').style.display = 'none';
        document.getElementById('register-box').style.display = 'block';
    } else {
        document.getElementById('register-box').style.display = 'none';
        document.getElementById('login-box').style.display = 'block';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const fullname = document.getElementById('reg-fullname').value;
    const user = document.getElementById('reg-user').value;
    const pass = document.getElementById('reg-pass').value;

    if (API_URL) {
        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname, user, pass })
            });
            const data = await res.json();
            if (data.success) {
                alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
                toggleForm('login');
            } else {
                alert(data.message);
            }
            return;
        } catch (e) {}
    }

    // Local Mode Fallback
    let localUsers = JSON.parse(localStorage.getItem('localUsers')) || [
        { fullname: 'ผู้ดูแลระบบ (Admin)', user: 'admin', pass: 'admin123', role: 'admin' },
        { fullname: 'นายสมชาย ใจดี', user: 'user', pass: '1234', role: 'user' }
    ];

    if (localUsers.find(u => u.user === user)) {
        alert('ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว');
        return;
    }

    localUsers.push({ fullname, user, pass, role: 'user' });
    localStorage.setItem('localUsers', JSON.stringify(localUsers));
    alert('สมัครสมาชิกสำเร็จ!');
    toggleForm('login');
}

async function handleLogin(event) {
    event.preventDefault();
    const userInput = document.getElementById('login-user');
    const passInput = document.getElementById('login-pass');
    const errorMsg = document.getElementById('error-msg');

    if (API_URL) {
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: userInput.value, pass: passInput.value })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('currentUser', data.fullname);
                localStorage.setItem('userRole', data.role);
                window.location.href = './index.html';
                return;
            }
        } catch (e) {}
    }

    // Local Mode Fallback
    let localUsers = JSON.parse(localStorage.getItem('localUsers')) || [
        { fullname: 'ผู้ดูแลระบบ (Admin)', user: 'admin', pass: 'admin123', role: 'admin' },
        { fullname: 'นายสมชาย ใจดี', user: 'user', pass: '1234', role: 'user' }
    ];

    const found = localUsers.find(u => u.user === userInput.value && u.pass === passInput.value);
    if (found) {
        localStorage.setItem('currentUser', found.fullname);
        localStorage.setItem('userRole', found.role);
        window.location.href = './index.html';
    } else {
        errorMsg.style.display = 'block';
        userInput.classList.add('input-error');
        passInput.classList.add('input-error');
    }
}

function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert("กรุณาล็อกอินก่อนเข้าใช้งาน!");
        window.location.href = './login.html';
    } else {
        const userDisplay = document.getElementById('user-display');
        const role = localStorage.getItem('userRole');
        if (userDisplay) {
            userDisplay.innerText = `${role === 'admin' ? '⚙️ [ADMIN]' : '👤'} ${currentUser}`;
        }
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    window.location.href = './login.html';
}

async function loadAIAlerts() {
    const aiBox = document.getElementById('ai-alert-box');
    if (!aiBox) return;

    if (API_URL) {
        try {
            const res = await fetch(`${API_URL}/ai-alert`);
            const data = await res.json();
            if (data.success) {
                aiBox.innerHTML = data.alerts.map(msg => `<div class="ai-alert-item">${msg}</div>`).join('');
                return;
            }
        } catch (e) {}
    }

    // Local Mode AI Alert
    const outOfStock = localEquipments.filter(e => e.available === 0);
    const lowStock = localEquipments.filter(e => e.available > 0 && e.available <= 3);
    let alerts = [];

    if (outOfStock.length > 0) {
        alerts.push(`🚨 **AI Warning:** มีอุปกรณ์หมดสต็อก [${outOfStock.map(e => e.name).join(', ')}]`);
    }
    if (lowStock.length > 0) {
        alerts.push(`⚠️ **AI Notice:** อุปกรณ์ใกล้อย่างวิกฤต [${lowStock.map(e => `${e.name} (${e.available})`).join(', ')}]`);
    }
    if (alerts.length === 0) {
        alerts.push(`✨ **AI Status:** ระบบอุปกรณ์กีฬาพร้อมใช้งาน สต็อกอยู่ในเกณฑ์ปกติทุกรายการ`);
    }
    aiBox.innerHTML = alerts.map(msg => `<div class="ai-alert-item">${msg}</div>`).join('');
}

async function renderStockTable() {
    const tbody = document.getElementById('stock-table-body');
    if (!tbody) return;

    const isAdmin = localStorage.getItem('userRole') === 'admin';
    let equipments = localEquipments;

    if (API_URL) {
        try {
            const res = await fetch(`${API_URL}/equipments`);
            equipments = await res.json();
        } catch (e) {}
    }

    tbody.innerHTML = '';
    equipments.forEach(item => {
        const isAvailable = item.available > 0;
        const tr = document.createElement('tr');
        const adminActionHTML = isAdmin 
            ? `<td class="text-center"><button class="btn-edit" onclick="editStock('${item.id}', ${item.available})">✏️ แก้ไขสต็อก</button></td>` 
            : '';

        tr.innerHTML = `
            <td class="text-center"><strong>${item.id}</strong></td>
            <td>${item.name}</td>
            <td class="text-center">
                <span class="badge ${isAvailable ? 'badge-success' : 'badge-danger'}">
                    ${isAvailable ? 'พร้อมยืม' : 'ของหมด'}
                </span>
            </td>
            <td class="text-center"><strong>${item.available}</strong> ชิ้น</td>
            ${adminActionHTML}
        `;
        tbody.appendChild(tr);
    });

    const adminHeader = document.getElementById('admin-header');
    if (adminHeader) adminHeader.style.display = isAdmin ? 'table-cell' : 'none';

    loadAIAlerts();
}

async function editStock(id, currentQty) {
    const newQty = prompt(`กรุณากรอกจำนวนสต็อกใหม่สำหรับอุปกรณ์ (${id}):`, currentQty);
    if (newQty === null || newQty.trim() === '') return;

    if (API_URL) {
        try {
            const res = await fetch(`${API_URL}/equipments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ available: parseInt(newQty) })
            });
            const data = await res.json();
            if (data.success) {
                alert('อัปเดตสต็อกสำเร็จ!');
                renderStockTable();
                return;
            }
        } catch (e) {}
    }

    // Local Mode Update
    const item = localEquipments.find(e => e.id === id);
    if (item) {
        item.available = parseInt(newQty) || 0;
        saveLocalStock();
        alert('อัปเดตสต็อกสำเร็จ!');
        renderStockTable();
    }
}

async function renderBorrowSelection() {
    const container = document.getElementById('equipmentSelectArea');
    if (!container) return;

    let equipments = localEquipments;
    if (API_URL) {
        try {
            const res = await fetch(`${API_URL}/equipments`);
            equipments = await res.json();
        } catch (e) {}
    }

    container.innerHTML = '';
    equipments.forEach(item => {
        const isAvailable = item.available > 0;
        const div = document.createElement('div');
        div.className = 'item-row';
        div.innerHTML = `
            <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                <input type="checkbox" class="equip-checkbox" value="${item.id}" ${!isAvailable ? 'disabled' : ''}>
                <span><strong>${item.name}</strong> (คงเหลือ ${item.available} ชิ้น)</span>
            </label>
            <div>
                จำนวน: <input type="number" class="equip-qty" id="qty_${item.id}" min="1" max="${item.available}" value="1" ${!isAvailable ? 'disabled' : ''}> ชิ้น
            </div>
        `;
        container.appendChild(div);
    });
}

async function handleBorrowSubmit(event) {
    event.preventDefault();
    const checkedBoxes = document.querySelectorAll('.equip-checkbox:checked');
    if (checkedBoxes.length === 0) {
        alert("❌ กรุณาติ๊กเลือกอุปกรณ์อย่างน้อย 1 ชิ้น!");
        return;
    }

    const items = [];
    checkedBoxes.forEach(box => {
        const id = box.value;
        const qty = parseInt(document.getElementById('qty_' + id).value);
        items.push({ id, qty });
    });

    const studentId = document.getElementById('studentId').value;
    const fullName = document.getElementById('fullName').value;
    const department = document.getElementById('department').value;
    const room = document.getElementById('room').value;
    const borrowTime = document.getElementById('borrowTime').value;
    const returnTime = document.getElementById('returnTime').value;

    if (API_URL) {
        try {
            const res = await fetch(`${API_URL}/borrow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, fullName, department, room, borrowTime, returnTime, items })
            });
            const result = await res.json();
            if (result.success) {
                alert(`✅ บันทึกการยืมสำเร็จ!\n\nผู้ยืม: ${fullName} (${studentId})\nรายการ: ${result.data.items.join(', ')}`);
                window.location.href = './index.html';
                return;
            }
        } catch (e) {}
    }

    // Local Mode Borrow Process
    let borrowedNames = [];
    items.forEach(reqItem => {
        const equip = localEquipments.find(e => e.id === reqItem.id);
        if (equip && equip.available >= reqItem.qty) {
            equip.available -= reqItem.qty;
            borrowedNames.push(`${equip.name} (${reqItem.qty} ชิ้น)`);
        }
    });
    saveLocalStock();
    alert(`✅ บันทึกการยืมสำเร็จ!\n\nผู้ยืม: ${fullName} (${studentId})\nรายการ: ${borrowedNames.join(', ')}`);
    window.location.href = './index.html';
}