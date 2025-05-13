const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

// State aplikasi
let sessionActive = false;
let users = {};
let connectedUsers = {};
let fastestResponder = null;

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Kirim status sesi dan daftar user saat pertama kali terhubung
    socket.emit('sessionStatus', sessionActive);
    socket.emit('userListUpdated', Object.values(connectedUsers));
    
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
    
    // User register
    socket.on('registerUser', (userName) => {
        connectedUsers[socket.id] = userName;
        io.emit('userListUpdated', Object.values(connectedUsers));
        console.log(`User registered: ${userName}`);
    });
    
    // User menekan tombol jawab
    socket.on('userRespond', (userData) => {
        if (!sessionActive || fastestResponder) return;
        
        const responseTime = Date.now();
        users[socket.id] = {
            name: userData.name,
            responseTime: responseTime
        };
        
        // Cari user tercepat
        const responders = Object.values(users);
        if (responders.length > 0) {
            fastestResponder = responders.reduce((fastest, current) => 
                current.responseTime < fastest.responseTime ? current : fastest
            );
            
            io.emit('fastestResponder', fastestResponder);
            console.log('Fastest responder:', fastestResponder.name);
        }
    });
    
    // Reset sistem
    socket.on('resetSystem', () => {
        sessionActive = false;
        users = {};
        fastestResponder = null;
        io.emit('sessionStatus', sessionActive);
        io.emit('systemReset');
        console.log('System has been reset');
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        delete users[socket.id];
        delete connectedUsers[socket.id];
        io.emit('userListUpdated', Object.values(connectedUsers));
    });
});

const PORT = 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://${getLocalIpAddress()}:${PORT}`);
});

function getLocalIpAddress() {
    const interfaces = require('os').networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}