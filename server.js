const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Sediakan file statis dari folder public
app.use(express.static(path.join(__dirname, 'public')));

// State aplikasi
let sessionActive = false;
let users = {};
let fastestResponder = null;

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Kirim status sesi saat pertama kali terhubung
    socket.emit('sessionStatus', sessionActive);
    
    // Admin mengaktifkan/menonaktifkan sesi
    socket.on('toggleSession', (isActive) => {
        sessionActive = isActive;
        fastestResponder = null;
        
        if (!isActive) {
            users = {}; // Reset users ketika sesi dimatikan
        }
        
        io.emit('sessionStatus', sessionActive);
        console.log(`Session ${sessionActive ? 'started' : 'stopped'}`);
    });
    
    // User menekan tombol jawab
socket.on('userRespond', (userData) => {
    console.log(`Respon diterima dari: ${userData.name} (${socket.id})`);
    
    if (!sessionActive) {
        console.log('Sesi tidak aktif, abaikan respon');
        return;
    }
    
    if (fastestResponder) {
        console.log('Sudah ada responder tercepat, abaikan');
        return;
    }
    
    const responseTime = Date.now();
    users[socket.id] = {
        name: userData.name,
        responseTime: responseTime
    };
    
    console.log(`User ${userData.name} merespon pada: ${responseTime}`);
    
    // Cari user tercepat
    const responders = Object.values(users);
    if (responders.length > 0) {
        fastestResponder = responders.reduce((fastest, current) => 
            current.responseTime < fastest.responseTime ? current : fastest
        );
        
        console.log(`Responder tercepat: ${fastestResponder.name} pada ${fastestResponder.responseTime}`);
        io.emit('fastestResponder', fastestResponder);
    }
});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});