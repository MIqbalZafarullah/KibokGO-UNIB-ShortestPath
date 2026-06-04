const mockDatabase = [];
let currentUser = null;

function showLoginModal() {
    const overlay = document.getElementById('authOverlay');
    overlay.classList.remove('hidden');
    setTimeout(() => { overlay.style.opacity = '1'; }, 10);
}

function hideLoginModal() {
    const overlay = document.getElementById('authOverlay');
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.classList.add('hidden'); }, 300);
}

function switchTab(tab) {
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
    document.getElementById('tabLogin').className    = tab === 'login'    ? 'flex-1 pb-2 font-bold text-blue-400 border-b-2 border-blue-400' : 'flex-1 pb-2 font-semibold text-slate-500 hover:text-slate-300 transition';
    document.getElementById('tabRegister').className = tab === 'register' ? 'flex-1 pb-2 font-bold text-blue-400 border-b-2 border-blue-400' : 'flex-1 pb-2 font-semibold text-slate-500 hover:text-slate-300 transition';
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('regSuccess').classList.add('hidden');
}

function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('regUsername').value;
    const pass = document.getElementById('regPassword').value;

    if (mockDatabase.find(u => u.username === user)) {
        alert('Username sudah digunakan!'); return;
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
    stopLocationTracking();
    updateUIBasedOnAuth();
}

function updateUIBasedOnAuth() {
    const userInit = document.getElementById('userInitial');
    const authBtn  = document.getElementById('authBtn');

    if (currentUser) {

        document.getElementById('userNameDisplay').innerText = currentUser.username;
        userInit.innerText   = currentUser.username.charAt(0).toUpperCase();
        userInit.className   = 'w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/30 avatar-premium';
        document.getElementById('welcomeText').innerText = 'Premium User';

        authBtn.innerText      = 'Logout';
        authBtn.onclick        = handleLogout;
        authBtn.style.background   = 'rgba(239,68,68,0.12)';
        authBtn.style.color        = '#fca5a5';
        authBtn.style.borderColor  = 'rgba(239,68,68,0.3)';
        authBtn.onmouseover    = () => authBtn.style.background = 'rgba(239,68,68,0.3)';
        authBtn.onmouseout     = () => authBtn.style.background = 'rgba(239,68,68,0.12)';

        setTimeout(() => requestLocation(), 800);

    } else {

        document.getElementById('userNameDisplay').innerText = 'Tamu';
        userInit.innerText   = '?';
        userInit.className   = 'w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-bold text-sm border border-slate-700 shadow-inner';
        document.getElementById('welcomeText').innerText = 'Guest Mode';

        authBtn.innerText      = 'Login';
        authBtn.onclick        = showLoginModal;
        authBtn.style.background   = 'rgba(59,130,246,0.15)';
        authBtn.style.color        = '#93c5fd';
        authBtn.style.borderColor  = 'rgba(59,130,246,0.35)';
        authBtn.onmouseover    = () => authBtn.style.background = 'rgba(59,130,246,0.35)';
        authBtn.onmouseout     = () => authBtn.style.background = 'rgba(59,130,246,0.15)';

        setGpsFabActive(false);
    }
}