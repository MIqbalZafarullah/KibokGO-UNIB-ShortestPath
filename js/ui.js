function showToast(msg, type = 'error') {
    const container = document.getElementById('toastContainer');
    const toast     = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        error:   '<svg style="width:16px;height:16px;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        success: '<svg style="width:16px;height:16px;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        info:    '<svg style="width:16px;height:16px;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    };

    toast.innerHTML = `${icons[type] || icons.info}<span>${msg}</span>`;
    toast.onclick   = () => dismissToast(toast);
    container.appendChild(toast);
    setTimeout(() => dismissToast(toast), 4000);
}

function dismissToast(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 280);
}

function showError(msg) {
    document.getElementById('errorBox').classList.add('hidden');
    showToast(msg, 'error');
}

function resetButton() {
    const btn = document.getElementById('findBtn');
    btn.disabled  = false;
    btn.innerHTML = `<span>Periksa Rute</span>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 group-hover:translate-x-1 transition-transform">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
    </svg>`;
}

// -----------------------------------------------
// Night Mode Toggle (hanya peta yang berubah)
// -----------------------------------------------
let isNightMode = false;

function toggleTheme() {
    isNightMode = !isNightMode;

    const mapEl  = document.getElementById('map');
    const iconEl = document.getElementById('themeIcon');
    const btn    = document.getElementById('themeToggleBtn');

    if (isNightMode) {
        // Aktifkan Night Mode: filter dark hanya ke peta
        mapEl.classList.add('map-night-mode');

        // Ikon berubah ke bulan
        iconEl.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />`;
        btn.style.color = '#818cf8'; // indigo untuk mode malam

        showToast('Mode Malam aktif 🌙', 'info');
    } else {
        // Matikan Night Mode
        mapEl.classList.remove('map-night-mode');

        // Ikon kembali ke matahari
        iconEl.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />`;
        btn.style.color = ''; // reset ke warna CSS semula (kuning)

        showToast('Mode Siang aktif ☀️', 'info');
    }

    // Re-draw rute (jika sedang aktif) dengan warna sesuai mode
    redrawRouteForCurrentMode();
}

function redrawRouteForCurrentMode() {
    if (!routeLayer) return; // tidak ada rute aktif

    // Ambil warna baru berdasarkan mode
    const newColor = isNightMode ? '#3b82f6' : getCurrentDayRouteColor();
    routeLayer.setStyle({ color: newColor });
}

function getCurrentDayRouteColor() {
    // Baca mode kendaraan aktif dan kembalikan warna siang
    const mode = document.getElementById('travelMode')?.value || 'foot';
    return ROUTE_COLORS[mode];
}

// -----------------------------------------------
// Bottom Sheet (Mobile Collapsible Panel)
// -----------------------------------------------
let sheetState  = 'half'; // 'collapsed' | 'half' | 'full'
let sheetStartY = 0;
let sheetCurrentY = 0;

function updateSheetState(newState) {
    const sidebar = document.getElementById('mainSidebar');
    if (!sidebar) return;
    sidebar.classList.remove('bottom-sheet-collapsed', 'bottom-sheet-half', 'bottom-sheet-full');
    sidebar.classList.add(`bottom-sheet-${newState}`);
    sheetState = newState;
}

function initBottomSheet() {
    const handle  = document.getElementById('dragHandle');
    const sidebar = document.getElementById('mainSidebar');
    if (!handle || !sidebar) return;

    handle.addEventListener('touchstart', (e) => {
        sheetStartY = e.touches[0].clientY;
        sidebar.style.transition = 'none';
    }, { passive: true });

    handle.addEventListener('touchmove', (e) => {
        sheetCurrentY = e.touches[0].clientY;
    }, { passive: true });

    handle.addEventListener('touchend', () => {
        sidebar.style.transition = '';

        if (sheetCurrentY === 0) {
            // Tap tanpa gerak
            if (sheetState === 'collapsed') updateSheetState('half');
            else if (sheetState === 'half') updateSheetState('full');
            else updateSheetState('half');
            return;
        }

        const deltaY = sheetCurrentY - sheetStartY;
        if (deltaY > 50) {
            if (sheetState === 'full') updateSheetState('half');
            else if (sheetState === 'half') updateSheetState('collapsed');
        } else if (deltaY < -50) {
            if (sheetState === 'collapsed') updateSheetState('half');
            else if (sheetState === 'half') updateSheetState('full');
        } else {
            if (sheetState === 'collapsed') updateSheetState('half');
            else if (sheetState === 'half') updateSheetState('full');
            else updateSheetState('half');
        }
        sheetStartY   = 0;
        sheetCurrentY = 0;
    });
}

// -----------------------------------------------
// Ripple Effect pada Tombol
// -----------------------------------------------
function initRippleEffect() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-gradient, .segment-btn, .map-toggle-btn');
        if (!btn) return;

        const rect   = btn.getBoundingClientRect();
        const size   = Math.max(rect.width, rect.height) * 1.6;
        const x      = e.clientX - rect.left - size / 2;
        const y      = e.clientY - rect.top  - size / 2;

        const ripple = document.createElement('span');
        ripple.className  = 'ripple-wave';
        ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    });
}

// -----------------------------------------------
// Splash Screen
// -----------------------------------------------
function initSplashScreen() {
    const splash      = document.getElementById('splashScreen');
    const bar         = document.getElementById('splashProgressBar');
    const loadingText = document.getElementById('splashLoadingText');
    if (!splash || !bar) { initApp(); return; }

    const messages = [
        'Memuat peta kampus...',
        'Menghubungkan ke AI Navigator...',
        'Mengoptimalkan jalur terpendek...',
        'Siap digunakan!',
    ];
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 22 + 8;
        if (progress > 100) progress = 100;
        bar.style.width = progress + '%';

        const msgIndex = Math.min(Math.floor(progress / 26), messages.length - 1);
        if (loadingText) loadingText.textContent = messages[msgIndex];

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                splash.classList.add('splash-hidden');
                setTimeout(() => { splash.style.display = 'none'; }, 650);
                initApp();
            }, 400);
        }
    }, 130);
}

// -----------------------------------------------
// Inisialisasi Aplikasi Utama
// -----------------------------------------------
function initApp() {
    initMap();
    updateUIBasedOnAuth();
}
