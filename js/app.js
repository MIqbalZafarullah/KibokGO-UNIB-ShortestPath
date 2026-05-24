// ================================================
// app.js — Entry Point Utama Aplikasi
// KibokGO UNIB | AI-Powered Campus Navigation
// ================================================

window.onload = () => {
    // Seed akun demo
    mockDatabase.push({ username: 'dosen_ai', password: '123' });

    // Inisialisasi fitur UI
    initSplashScreen();   // splash → lalu panggil initApp() di dalamnya
    initBottomSheet();    // gesture swipe/drag pada mobile
    initRippleEffect();   // efek ripple pada semua tombol
};
