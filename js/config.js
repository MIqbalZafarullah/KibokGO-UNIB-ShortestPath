// ================================================
// config.js — Konstanta & Konfigurasi Global
// KibokGO UNIB | AI-Powered Campus Navigation
// ================================================

const MAP_CONFIG = {
    center: [-3.7555, 102.2730],
    zoom: 16,
};

const TRAVEL_SPEED = {
    foot: 75,   // meter per menit (~4.5 km/h)
    bike: 400,  // meter per menit (~24 km/h)
    car: 250,   // meter per menit (~15 km/h, campus speed)
};

const ROUTE_COLORS = {
    foot: '#43dee9ff',  // hijau
    bike: '#fbbf24',  // kuning
    car: '#f63bdaff',  // biru
};

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';
