const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let users = [
    { fullname: 'ผู้ดูแลระบบ (Admin)', user: 'admin', pass: 'admin123', role: 'admin' },
    { fullname: 'นายสมชาย ใจดี', user: 'user', pass: '1234', role: 'user' }
];

let equipments = [
    { id: "SP01", name: "ลูกฟุตบอล", available: 10 },
    { id: "SP02", name: "ลูกบาสเกตบอล", available: 2 },
    { id: "SP03", name: "ไม้แบดมินตัน", available: 12 },
    { id: "SP04", name: "ลูกวอลเลย์บอล", available: 0 },
    { id: "SP05", name: "ลูกปิงปอง", available: 30 }
];

let borrowHistory = [];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/api/register', (req, res) => {
    const { fullname, user, pass } = req.body;
    if (users.find(u => u.user === user)) {
        return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว' });
    }
    users.push({ fullname, user, pass, role: 'user' });
    res.json({ success: true, message: 'สมัครสมาชิกสำเร็จ' });
});

app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    const foundUser = users.find(u => u.user === user && u.pass === pass);

    if (foundUser) {
        res.json({ success: true, fullname: foundUser.fullname, role: foundUser.role });
    } else {
        res.status(401).json({ success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }
});

app.get('/api/equipments', (req, res) => {
    res.json(equipments);
});

app.put('/api/equipments/:id', (req, res) => {
    const { id } = req.params;
    const { available } = req.body;
    const item = equipments.find(e => e.id === id);
    if (!item) return res.status(404).json({ success: false, message: 'ไม่พบอุปกรณ์นี้' });
    item.available = parseInt(available) || 0;
    res.json({ success: true, message: 'อัปเดตสต็อกเรียบร้อยแล้ว', item });
});

app.get('/api/ai-alert', (req, res) => {
    const outOfStock = equipments.filter(e => e.available === 0);
    const lowStock = equipments.filter(e => e.available > 0 && e.available <= 3);
    let alerts = [];

    if (outOfStock.length > 0) {
        alerts.push(`🚨 **AI Warning:** มีอุปกรณ์หมดสต็อก ได้แก่ [${outOfStock.map(e => e.name).join(', ')}]`);
    }
    if (lowStock.length > 0) {
        alerts.push(`⚠️ **AI Notice:** อุปกรณ์ใกล้อย่างวิกฤต [${lowStock.map(e => `${e.name} (${e.available})`).join(', ')}]`);
    }
    if (alerts.length === 0) {
        alerts.push(`✨ **AI Status:** อุปกรณ์กีฬาพร้อมใช้งาน สต็อกอยู่ในเกณฑ์ปกติทุกรายการ`);
    }
    res.json({ success: true, alerts });
});

app.post('/api/borrow', (req, res) => {
    const { studentId, fullName, department, room, borrowTime, returnTime, items } = req.body;
    if (!studentId || !fullName || !department || !room || !borrowTime || !returnTime || !items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' });
    }

    let borrowedNames = [];
    items.forEach(reqItem => {
        const equip = equipments.find(e => e.id === reqItem.id);
        if (equip && equip.available >= reqItem.qty) {
            equip.available -= reqItem.qty;
            borrowedNames.push(`${equip.name} (${reqItem.qty} ชิ้น)`);
        }
    });

    const record = { id: 'BR-' + Date.now(), studentId, fullName, department, room, borrowTime, returnTime, items: borrowedNames };
    borrowHistory.push(record);
    res.json({ success: true, message: 'บันทึกการยืมสำเร็จ!', data: record });
});

app.listen(PORT, () => {
    console.log(`🚀 Server พร้อมทำงานที่พอร์ต ${PORT}`);
});