// Kode untuk admin
if (document.querySelector('#toggleSession')) {
    const socket = io();
    const toggleSessionBtn = document.getElementById('toggleSession');
    const sessionStatusElement = document.getElementById('sessionStatus');
    const fastestResponderDisplay = document.getElementById('fastestResponderDisplay');
    const resetSystemBtn = document.getElementById('resetSystem');

    // Update UI berdasarkan status sesi
    socket.on('sessionStatus', (isActive) => {
        sessionStatusElement.textContent = isActive ? 'Aktif' : 'Tidak Aktif';
        sessionStatusElement.className = isActive ? 'active-session' : 'inactive-session';
        toggleSessionBtn.textContent = isActive ? 'Hentikan Sesi' : 'Mulai Sesi';
        toggleSessionBtn.classList.toggle('active', isActive);
        
        if (!isActive) {
            fastestResponderDisplay.innerHTML = '<p>Belum ada yang menjawab</p>';
        }
    });

    // Tampilkan responder tercepat
    socket.on('fastestResponder', (responder) => {
        fastestResponderDisplay.innerHTML = `
            <p><strong>${responder.name}</strong></p>
            <p>Merespon paling cepat!</p>
        `;
    });

    // Toggle sesi
    toggleSessionBtn.addEventListener('click', () => {
        const newStatus = !toggleSessionBtn.classList.contains('active');
        socket.emit('toggleSession', newStatus);
    });

    // Reset sistem
    resetSystemBtn.addEventListener('click', () => {
        socket.emit('resetSystem');
    });

    // Sistem direset
    socket.on('systemReset', () => {
        sessionStatusElement.textContent = 'Tidak Aktif';
        sessionStatusElement.className = 'inactive-session';
        toggleSessionBtn.textContent = 'Mulai Sesi';
        toggleSessionBtn.classList.remove('active');
        fastestResponderDisplay.innerHTML = '<p>Belum ada yang menjawab</p>';
    });
}

// Kode untuk user
if (document.querySelector('#userName')) {
    const socket = io();
    const userNameInput = document.getElementById('userName');
    const registerUserBtn = document.getElementById('registerUser');
    const responseSection = document.getElementById('responseSection');
    const userSessionStatus = document.getElementById('userSessionStatus');
    const responseResult = document.getElementById('responseResult');
    const debugInfo = document.createElement('div'); // Tambahan untuk debugging
    debugInfo.style.marginTop = '20px';
    debugInfo.style.padding = '10px';
    debugInfo.style.backgroundColor = '#f0f0f0';
    debugInfo.style.borderRadius = '5px';
    responseSection.appendChild(debugInfo);
    
    let userName = '';
    let hasRegistered = false;
    let lastKeyPressed = '';

    // Debug: Tampilkan info koneksi socket
    socket.on('connect', () => {
        debugInfo.textContent += 'Terhubung ke server\n';
    });

    socket.on('disconnect', () => {
        debugInfo.textContent += 'Terputus dari server\n';
    });

    // Tangani pendaftaran user
    registerUserBtn.addEventListener('click', () => {
        userName = userNameInput.value.trim();
        if (userName) {
            hasRegistered = true;
            userNameInput.disabled = true;
            registerUserBtn.disabled = true;
            responseSection.style.display = 'block';
            debugInfo.textContent += `Terdaftar sebagai: ${userName}\n`;
        } else {
            debugInfo.textContent += 'Nama tidak boleh kosong\n';
        }
    });

    // Update status sesi untuk user
    socket.on('sessionStatus', (isActive) => {
        userSessionStatus.textContent = isActive ? 'Aktif' : 'Tidak Aktif';
        userSessionStatus.className = isActive ? 'active-session' : 'inactive-session';
        debugInfo.textContent += `Status sesi berubah: ${isActive ? 'Aktif' : 'Tidak Aktif'}\n`;
    });

    // Debug: Tampilkan semua event keydown
    document.addEventListener('keydown', (e) => {
        lastKeyPressed = `Key: ${e.key}, Code: ${e.code}`;
        debugInfo.textContent += `Key pressed: ${e.key} (${e.code})\n`;
    });

    // Tangani tombol space untuk menjawab
    document.addEventListener('keydown', (e) => {
        if (!hasRegistered) {
            debugInfo.textContent += 'Belum terdaftar, abaikan keypress\n';
            return;
        }
        
        if (e.code === 'Space') {
            e.preventDefault();
            debugInfo.textContent += 'Tombol SPACE ditekan\n';
            
            if (userSessionStatus.textContent !== 'Aktif') {
                debugInfo.textContent += 'Sesi tidak aktif, abaikan\n';
                return;
            }
            
            if (responseResult.style.display !== 'none') {
                debugInfo.textContent += 'Sudah menjawab sebelumnya\n';
                return;
            }
            
            debugInfo.textContent += 'Mengirim respon ke server...\n';
            socket.emit('userRespond', { name: userName });
            
            responseResult.style.display = 'block';
            responseResult.textContent = 'Jawaban Anda telah direkam!';
            debugInfo.textContent += 'Respon berhasil dikirim\n';
        }
    });

    // Reset tampilan user ketika sistem direset
    socket.on('systemReset', () => {
        responseResult.style.display = 'none';
        userSessionStatus.textContent = 'Tidak Aktif';
        userSessionStatus.className = 'inactive-session';
        debugInfo.textContent += 'Sistem direset oleh admin\n';
    });

    // Tampilkan jika ada responder tercepat
    socket.on('fastestResponder', (responder) => {
        if (responder.name === userName) {
            responseResult.textContent = 'Anda yang pertama menjawab!';
            debugInfo.textContent += 'Anda adalah responder tercepat!\n';
        } else {
            debugInfo.textContent += `Responder tercepat: ${responder.name}\n`;
        }
    });
}