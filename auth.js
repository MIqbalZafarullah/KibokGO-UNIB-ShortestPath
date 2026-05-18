// --- 1. SISTEM AUTENTIKASI (SIMULASI IN-MEMORY) ---
const mockDatabase = [];
let currentUser = null;

function showLoginModal() {
    document.getElementById('authOverlay').classList.remove('hidden');
    setTimeout(() => { document.getElementById('authOverlay').style.opacity = '1'; }, 10);
}

function hideLoginModal() {
    document.getElementById('authOverlay').style.opacity = '0';
    setTimeout(() => { document.getElementById('authOverlay').classList.add('hidden'); }, 300);
}

function switchTab(tab) {
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
    document.getElementById('tabLogin').className = tab === 'login' ? "flex-1 pb-2 font-bold text-blue-600 border-b-2 border-blue-600" : "flex-1 pb-2 font-semibold text-gray-400 hover:text-gray-600 transition";
    document.getElementById('tabRegister').className = tab === 'register' ? "flex-1 pb-2 font-bold text-blue-600 border-b-2 border-blue-600" : "flex-1 pb-2 font-semibold text-gray-400 hover:text-gray-600 transition";
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('regSuccess').classList.add('hidden');
}

function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('regUsername').value;
    const pass = document.getElementById('regPassword').value;

    if (mockDatabase.find(u => u.username === user)) {
        alert("Username sudah digunakan!"); return;
    }

    mockDatabase.push({ username: user, password: pass });
    document.getElementById('regSuccess').classList.remove('hidden');
    document.getElementById('registerForm').reset();
    setTimeout(() => switchTab('login'), 1500);
}

function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('loginUsername').value;
    const pass = document.getElementById('loginPassword').value;

    const validUser = mockDatabase.find(u => u.username === user && u.password === pass);
    if (validUser) {
        currentUser = validUser;
        document.getElementById('loginError').classList.add('hidden');
        hideLoginModal();
        updateUIBasedOnAuth();
        document.getElementById('loginForm').reset();
    } else {
        document.getElementById('loginError').classList.remove('hidden');
    }
}

function handleLogout() {
    currentUser = null;
    if (typeof stopLocationTracking === 'function') stopLocationTracking(); // Hentikan GPS demi privasi saat logout
    updateUIBasedOnAuth();
}

function updateUIBasedOnAuth() {
    const gpsCard = document.getElementById('gpsCard');
    const userInit = document.getElementById('userInitial');
    const authBtn = document.getElementById('authBtn');

    if (currentUser) {
        // UI Jika Login (Akses Penuh GPS)
        document.getElementById('userNameDisplay').innerText = currentUser.username;
        userInit.innerText = currentUser.username.charAt(0).toUpperCase();
        userInit.className = "w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold";

        document.getElementById('welcomeText').innerText = "Selamat datang,";
        authBtn.innerText = "Keluar";
        authBtn.onclick = handleLogout;
        authBtn.className = "text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 bg-red-50 rounded transition";

        gpsCard.className = "mb-4 bg-yellow-50 border border-yellow-200 p-3 rounded-xl shadow-sm";
        gpsCard.innerHTML = `
            <p class="text-xs text-yellow-800 mb-2 font-medium"><span class="font-bold">Privasi:</span> Izinkan akses lokasi agar sistem dapat memandu dari posisimu saat ini.</p>
            <button onclick="requestLocation()" class="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold text-xs py-2 rounded transition">
                📍 Aktifkan Pelacakan Lokasi
            </button>
        `;
    } else {
        // UI Jika Tamu (GPS Dikunci)
        document.getElementById('userNameDisplay').innerText = "Tamu";
        userInit.innerText = "?";
        userInit.className = "w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold";

        document.getElementById('welcomeText').innerText = "Belum login";
        authBtn.innerText = "Masuk";
        authBtn.onclick = showLoginModal;
        authBtn.className = "text-xs text-blue-500 hover:text-blue-700 font-semibold px-3 py-1 bg-blue-50 rounded transition";

        gpsCard.className = "mb-4 bg-gray-50 border border-gray-200 p-3 rounded-xl shadow-sm";
        gpsCard.innerHTML = `
            <p class="text-xs text-gray-500 mb-2 font-medium">Fitur pelacakan lokasi realtime (GPS) hanya tersedia untuk pengguna terdaftar.</p>
            <button onclick="showLoginModal()" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs py-2 rounded transition">
                🔒 Login untuk Akses GPS
            </button>
        `;
    }
}
