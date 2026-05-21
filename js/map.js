// ================================================
// map.js — Inisialisasi Peta, GPS & Marker
// SmartRoute UNIB | AI-Powered Campus Navigation
// ================================================

// --- Variabel Global Peta & GPS ---
let map, routeLayer, startMarkerObj, endMarkerObj, osmLayer, satelliteLayer;
let gpsWatchId    = null;
let userLocation  = null;
let userMarkerObj = null;

// --- Ikon Marker Kustom ---
const startIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<svg viewBox="0 0 24 36" width="32" height="48" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.4));"><path d="M12 0C5.37 0 0 5.37 0 12c0 7.5 9.5 20.5 11.2 23.1.4.6 1.2.6 1.6 0C14.5 32.5 24 19.5 24 12c0-6.63-5.37-12-12-12z" fill="#10b981"/><circle cx="12" cy="11.5" r="4.5" fill="#064e3b"/></svg>`,
    iconSize:   [32, 48],
    iconAnchor: [16, 48],
});

const endIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `
        <div style="position:relative;width:32px;height:48px;display:flex;justify-content:center;">
            <div class="destination-pulse"></div>
            <svg viewBox="0 0 24 36" width="32" height="48" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0px 4px 4px rgba(0,0,0,0.4));z-index:10;position:relative;">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 7.5 9.5 20.5 11.2 23.1.4.6 1.2.6 1.6 0C14.5 32.5 24 19.5 24 12c0-6.63-5.37-12-12-12z" fill="#ef4444"/>
                <circle cx="12" cy="11.5" r="4.5" fill="#7f1d1d"/>
            </svg>
        </div>`,
    iconSize:   [32, 48],
    iconAnchor: [16, 48],
});

const gpsIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `
        <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
            <div class="gps-pulse" style="position:absolute;top:8px;left:8px;"></div>
            <div id="gps-heading-icon" style="transition:transform 0.1s ease-out;transform:rotate(0deg);width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:10;">
                <svg viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" style="width:24px;height:24px;transform:rotate(-45deg);">
                    <path d="M12 2L2 22l10-4 10 4L12 2z"/>
                </svg>
            </div>
        </div>`,
    iconSize:   [32, 32],
    iconAnchor: [16, 16],
});

// -----------------------------------------------
// Inisialisasi Peta
// -----------------------------------------------
function initMap() {
    map = L.map('map', { zoomControl: false }).setView(MAP_CONFIG.center, MAP_CONFIG.zoom);
    L.control.zoom({ position: 'topright' }).addTo(map);

    osmLayer       = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap', maxZoom: 19 });
    satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri', maxZoom: 19 });
    osmLayer.addTo(map);

    setupAutocomplete('startSearch', 'startDropdown', 'startNode');
    setupAutocomplete('endSearch',   'endDropdown',   'endNode');
}

// -----------------------------------------------
// Toggle Gaya Peta (Map / Satellite)
// -----------------------------------------------
function setMapStyle(style) {
    if (style === '2D') {
        map.removeLayer(satelliteLayer);
        osmLayer.addTo(map);
        document.getElementById('btn2D').className = 'map-toggle-btn active';
        document.getElementById('btn3D').className = 'map-toggle-btn';
    } else {
        map.removeLayer(osmLayer);
        satelliteLayer.addTo(map);
        document.getElementById('btn3D').className = 'map-toggle-btn active';
        document.getElementById('btn2D').className = 'map-toggle-btn';
    }
}

// -----------------------------------------------
// Gambar Rute di Peta
// -----------------------------------------------
function drawRouteReal(polylineCoords, startId, endId, isGpsStart, gpsCoords, routeColor) {
    if (routeLayer)      map.removeLayer(routeLayer);
    if (startMarkerObj)  map.removeLayer(startMarkerObj);
    if (endMarkerObj)    map.removeLayer(endMarkerObj);

    if (!isGpsStart) {
        startMarkerObj = L.marker([nodes[startId].lat, nodes[startId].lng], { icon: startIcon, zIndexOffset: 1000 }).addTo(map);
    }
    endMarkerObj = L.marker([nodes[endId].lat, nodes[endId].lng], { icon: endIcon, zIndexOffset: 1000 }).addTo(map);

    routeLayer = L.polyline(polylineCoords, {
        color: routeColor || '#06b6d4', weight: 6, opacity: 1,
        lineJoin: 'round', className: 'animated-route',
    }).addTo(map);

    map.flyToBounds(routeLayer.getBounds(), { padding: [60, 60], duration: 1.5 });
}

// -----------------------------------------------
// Utilitas Kalkulasi Jarak (Haversine)
// -----------------------------------------------
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R  = 6371e3;
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a  = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function findNearestWaypoint(lat, lng) {
    let minDist = Infinity, nearestId = null;
    for (let id in nodes) {
        const dist = calculateDistance(lat, lng, nodes[id].lat, nodes[id].lng);
        if (dist < minDist) { minDist = dist; nearestId = id; }
    }
    return { id: nearestId, distance: minDist };
}

// -----------------------------------------------
// GPS Tracking
// -----------------------------------------------
function toggleGpsTracking() {
    if (gpsWatchId !== null) stopLocationTracking();
    else requestLocation();
}

function setGpsFabActive(active) {
    const fab = document.getElementById('gpsFabBtn');
    if (!fab) return;
    if (active) {
        fab.className = 'w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg shadow-emerald-500/50 bg-emerald-500 border border-emerald-400 text-white';
    } else {
        fab.className = 'w-12 h-12 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-blue-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg shadow-black/50';
    }
}

function requestLocation() {
    if (!('geolocation' in navigator)) return;
    if (gpsWatchId !== null) return;

    gpsWatchId = navigator.geolocation.watchPosition(
        (position) => {
            userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };

            if (userMarkerObj) map.removeLayer(userMarkerObj);
            userMarkerObj = L.marker([userLocation.lat, userLocation.lng], { icon: gpsIcon, zIndexOffset: 2000 }).addTo(map);

            setGpsFabActive(true);

            const startHidden = document.getElementById('startNode');
            const startInput  = document.getElementById('startSearch');
            const startClear  = document.getElementById('startClear');
            if (!startHidden.value) {
                startHidden.value = 'gps';
                startInput.value  = '📍 Lokasi Saya Saat Ini (GPS)';
                if (startClear) startClear.classList.remove('hidden');
            }

            // Kompas: rotasi ikon GPS sesuai arah HP
            if (!window.compassInitialized) {
                if (window.DeviceOrientationEvent) {
                    window.addEventListener('deviceorientation', (event) => {
                        let heading = event.webkitCompassHeading || (event.alpha !== null ? 360 - event.alpha : null);
                        if (heading !== null) {
                            const el = document.getElementById('gps-heading-icon');
                            if (el) el.style.transform = `rotate(${heading}deg)`;
                        }
                    });
                }
                window.compassInitialized = true;
            }
        },
        (error) => { console.warn('GPS unavailable:', error.message); },
        { enableHighAccuracy: true, maximumAge: 0 }
    );
}

function stopLocationTracking() {
    if (gpsWatchId !== null) { navigator.geolocation.clearWatch(gpsWatchId); gpsWatchId = null; }
    userLocation = null;
    if (userMarkerObj) { map.removeLayer(userMarkerObj); userMarkerObj = null; }

    const startHidden = document.getElementById('startNode');
    const startInput  = document.getElementById('startSearch');
    if (startHidden && startHidden.value === 'gps') {
        startHidden.value = '';
        startInput.value  = '';
        const startClear = document.getElementById('startClear');
        if (startClear) startClear.classList.add('hidden');
    }

    setGpsFabActive(false);
    showToast('GPS tracking dihentikan.', 'info');
}
