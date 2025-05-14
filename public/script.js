// Kode untuk admin
if (document.querySelector('#toggleSession')) {
    const socket = io();
    const toggleSessionBtn = document.getElementById('toggleSession');
    const sessionStatusElement = document.getElementById('sessionStatus');
    const fastestResponderDisplay = document.getElementById('fastestResponderDisplay');
    const resetSystemBtn = document.getElementById('resetSystem');
    const userListElement = document.getElementById('userList');

    // Update daftar user
    socket.on('userListUpdated', (users) => {
        userListElement.innerHTML = users.length > 0 
            ? users.map(user => `
                <li class="flex items-center py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                    <span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    ${user}
                </li>
            `).join('')
            : '<li class="text-gray-500 italic py-2">Tidak ada peserta</li>';
    });

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
            <div class="animate-pulse">
                <p class="font-bold text-lg text-yellow-700">${responder.name}</p>
                <p class="text-yellow-600">Merespon paling cepat!</p>
            </div>
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
    const answerButton = document.getElementById('answerButton');
    
    let userName = '';
    let hasRegistered = false;

    // Tangani pendaftaran user
    registerUserBtn.addEventListener('click', () => {
        userName = userNameInput.value.trim();
        if (userName) {
            hasRegistered = true;
            userNameInput.disabled = true;
            registerUserBtn.disabled = true;
            responseSection.style.display = 'block';
            socket.emit('registerUser', userName);
            document.getElementById("registrationSection").classList.add("hidden");
        }
    });

    // Update status sesi untuk user
    socket.on('sessionStatus', (isActive) => {
        userSessionStatus.textContent = isActive ? 'Aktif' : 'Tidak Aktif';
        userSessionStatus.className = isActive ? 'active-session' : 'inactive-session';
        userSessionStatus.classList.add(isActive ? 'text-green-700' : '');
    });

    // Tangani tombol space untuk menjawab
    document.addEventListener('keydown', (e) => {
        if (!hasRegistered || e.code !== 'Space') return;
        
        e.preventDefault();
        handleAnswer();
    });

    // Tangani tombol jawab
    answerButton.addEventListener('click', handleAnswer);

    function handleAnswer() {
        if (userSessionStatus.textContent !== 'Aktif') {
            return;
        }
        
        if (responseResult.style.display !== 'none') {
            return;
        }
        
        // Animasi tombol
        answerButton.classList.add('animate-bounce');
        setTimeout(() => {
            answerButton.classList.remove('animate-bounce');
        }, 1000);
        
        socket.emit('userRespond', { name: userName });
        
        responseResult.classList.remove('hidden');
        responseResult.classList.add('animate-fade-in');
        
        // Reset animasi setelah 3 detik
        setTimeout(() => {
            responseResult.classList.remove('animate-fade-in');
        }, 3000);
    }

    // Reset tampilan user ketika sistem direset
    socket.on('systemReset', () => {
        responseResult.style.display = 'none';
        userSessionStatus.textContent = 'Tidak Aktif';
        userSessionStatus.className = 'inactive-session';
    });

    // Tampilkan jika ada responder tercepat
    socket.on('fastestResponder', (responder) => {
        if (responder.name === userName) {
            responseResult.textContent = 'Anda yang pertama menjawab!';
            responseResult.classList.remove("hidden");
        }
    });
}