// --- 1. SISTEM AUTENTIKASI ---
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
    document.getElementById('tabLogin').className = tab === 'login' ? "flex-1 pb-2 font-bold text-blue-400 border-b-2 border-blue-400" : "flex-1 pb-2 font-semibold text-slate-500 hover:text-slate-300 transition";
    document.getElementById('tabRegister').className = tab === 'register' ? "flex-1 pb-2 font-bold text-blue-400 border-b-2 border-blue-400" : "flex-1 pb-2 font-semibold text-slate-500 hover:text-slate-300 transition";
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
    stopLocationTracking();
    updateUIBasedOnAuth();
}

function updateUIBasedOnAuth() {
    const userInit = document.getElementById('userInitial');
    const authBtn = document.getElementById('authBtn');

    if (currentUser) {
        // --- LOGGED IN STATE ---
        document.getElementById('userNameDisplay').innerText = currentUser.username;
        userInit.innerText = currentUser.username.charAt(0).toUpperCase();
        userInit.className = "w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/30 avatar-premium";
        document.getElementById('welcomeText').innerText = "Premium User";

        authBtn.innerText = "Logout";
        authBtn.onclick = handleLogout;
        authBtn.style.background = "rgba(239,68,68,0.12)";
        authBtn.style.color = "#fca5a5";
        authBtn.style.borderColor = "rgba(239,68,68,0.3)";
        authBtn.onmouseover = () => authBtn.style.background = "rgba(239,68,68,0.3)";
        authBtn.onmouseout = () => authBtn.style.background = "rgba(239,68,68,0.12)";

        // Auto-start GPS in background
        setTimeout(() => requestLocation(), 800);

    } else {
        // --- GUEST STATE ---
        document.getElementById('userNameDisplay').innerText = "Tamu";
        userInit.innerText = "?";
        userInit.className = "w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-bold text-sm border border-slate-700 shadow-inner";
        document.getElementById('welcomeText').innerText = "Guest Mode";

        authBtn.innerText = "Login";
        authBtn.onclick = showLoginModal;
        authBtn.style.background = "rgba(59,130,246,0.15)";
        authBtn.style.color = "#93c5fd";
        authBtn.style.borderColor = "rgba(59,130,246,0.35)";
        authBtn.onmouseover = () => authBtn.style.background = "rgba(59,130,246,0.35)";
        authBtn.onmouseout = () => authBtn.style.background = "rgba(59,130,246,0.15)";

        // Hide GPS FAB state
        setGpsFabActive(false);
    }
}

// --- 2. SISTEM LOKASI (GPS) & DATA MODEL MAP ---
let gpsWatchId = null;
let userLocation = null;
let userMarkerObj = null;

// --- 3. IMPLEMENTASI GPS & PETA ---
let map, routeLayer, startMarkerObj, endMarkerObj, osmLayer, satelliteLayer;

const startIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<svg viewBox="0 0 24 36" width="32" height="48" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.4));"><path d="M12 0C5.37 0 0 5.37 0 12c0 7.5 9.5 20.5 11.2 23.1.4.6 1.2.6 1.6 0C14.5 32.5 24 19.5 24 12c0-6.63-5.37-12-12-12z" fill="#10b981"/><circle cx="12" cy="11.5" r="4.5" fill="#064e3b"/></svg>`,
    iconSize: [32, 48],
    iconAnchor: [16, 48]
});
const endIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `
        <div style="position: relative; width: 32px; height: 48px; display: flex; justify-content: center;">
            <div class="destination-pulse"></div>
            <svg viewBox="0 0 24 36" width="32" height="48" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.4)); z-index: 10; position: relative;">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 7.5 9.5 20.5 11.2 23.1.4.6 1.2.6 1.6 0C14.5 32.5 24 19.5 24 12c0-6.63-5.37-12-12-12z" fill="#ef4444"/>
                <circle cx="12" cy="11.5" r="4.5" fill="#7f1d1d"/>
            </svg>
        </div>
    `,
    iconSize: [32, 48],
    iconAnchor: [16, 48]
});
const gpsIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <div class="gps-pulse" style="position: absolute; top: 8px; left: 8px;"></div>
            <div id="gps-heading-icon" style="transition: transform 0.1s ease-out; transform: rotate(0deg); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 10;">
                <svg viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" style="width: 24px; height: 24px; transform: rotate(-45deg);">
                    <path d="M12 2L2 22l10-4 10 4L12 2z"/>
                </svg>
            </div>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

function setMapStyle(style) {
    if (style === '2D') {
        map.removeLayer(satelliteLayer); osmLayer.addTo(map);
        document.getElementById('btn2D').className = "map-toggle-btn active";
        document.getElementById('btn3D').className = "map-toggle-btn";
    } else {
        map.removeLayer(osmLayer); satelliteLayer.addTo(map);
        document.getElementById('btn3D').className = "map-toggle-btn active";
        document.getElementById('btn2D').className = "map-toggle-btn";
    }
}

function initMap() {
    map = L.map('map', { zoomControl: false }).setView([-3.7555, 102.2730], 16);
    L.control.zoom({ position: 'topright' }).addTo(map);

    osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap', maxZoom: 19 });
    satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri', maxZoom: 19 });
    osmLayer.addTo(map);

    setupAutocomplete('startSearch', 'startDropdown', 'startNode');
    setupAutocomplete('endSearch', 'endDropdown', 'endNode');
}

function setupAutocomplete(inputId, dropdownId, hiddenId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const hidden = document.getElementById(hiddenId);
    const clearBtn = document.getElementById(inputId.replace('Search', 'Clear'));

    // handleSelection defined here so it's accessible by all inner functions
    function handleSelection(item) {
        input.value = item.name;
        hidden.value = item.id;
        dropdown.classList.add('hidden');
        if (clearBtn) clearBtn.classList.remove('hidden');

        if (item.id !== 'gps') {
            let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
            let newHistory = history.filter(h => h.id !== item.id);
            newHistory.unshift({ id: item.id, name: item.name });
            if (newHistory.length > 4) newHistory.pop();
            localStorage.setItem('searchHistory', JSON.stringify(newHistory));
        }

        if (item.id !== 'gps' && map && nodes[item.id]) {
            map.flyTo([nodes[item.id].lat, nodes[item.id].lng], 18, { duration: 1.5 });
        } else if (item.id === 'gps' && userLocation && map) {
            map.flyTo([userLocation.lat, userLocation.lng], 18, { duration: 1.5 });
        }
    }

    function createItem(item, isHistory = false) {
        const div = document.createElement('div');
        if (isHistory) {
            div.className = "px-4 py-3 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700/50 transition flex items-center gap-3";
            div.innerHTML = `<span class="text-slate-400 text-sm">🕒</span><div><div class="font-bold text-slate-200 text-xs">${item.name}</div></div>`;
        } else {
            div.className = "px-4 py-3 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700/50 transition";
            div.innerHTML = `
                <div class="font-bold text-slate-200 text-xs">${item.name}</div>
                <div class="text-[10px] text-slate-500 truncate mt-0.5">${item.desc || 'Fasilitas kampus'}</div>
            `;
        }
        div.addEventListener('mousedown', (e) => { e.preventDefault(); handleSelection(item); });
        return div;
    }

    function renderDropdown(query) {
        dropdown.innerHTML = '';
        dropdown.classList.remove('hidden');

        let results = Object.keys(nodes).map(k => ({ id: k, ...nodes[k] }));

        if (inputId === 'startSearch' && userLocation) {
            results.unshift({ id: 'gps', name: '📍 Lokasi Saya Saat Ini (GPS)', type: 'special', desc: 'Akurasi GPS Tracker' });
        }

        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');

        if (!query) {
            if (history.length > 0) {
                const histLabel = document.createElement('div');
                histLabel.className = "px-3 py-1.5 bg-slate-700/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider";
                histLabel.textContent = "Riwayat Terakhir";
                dropdown.appendChild(histLabel);

                history.forEach(item => dropdown.appendChild(createItem(item, true)));

                const allLabel = document.createElement('div');
                allLabel.className = "px-3 py-1.5 bg-slate-700/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider";
                allLabel.textContent = "Semua Lokasi";
                dropdown.appendChild(allLabel);
            }
        } else {
            results = results.filter(n => n.name.toLowerCase().includes(query) || (n.desc && n.desc.toLowerCase().includes(query)));
        }

        if (results.length === 0) {
            dropdown.innerHTML = `<div class="p-4 text-xs text-slate-500 text-center">Lokasi tidak ditemukan</div>`;
            return;
        }

        results.forEach(item => dropdown.appendChild(createItem(item, false)));
    }

    input.addEventListener('focus', () => renderDropdown(input.value.toLowerCase()));
    input.addEventListener('input', (e) => {
        clearBtn.classList.toggle('hidden', e.target.value === '');
        renderDropdown(e.target.value.toLowerCase());
    });

    document.addEventListener('mousedown', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            hidden.value = '';
            clearBtn.classList.add('hidden');
            renderDropdown('');
            input.focus();
        });
    }
}

// --- GPS FAB HELPERS ---
function toggleGpsTracking() {
    if (gpsWatchId !== null) stopLocationTracking();
    else requestLocation();
}

function setGpsFabActive(active) {
    const fab = document.getElementById('gpsFabBtn');
    if (!fab) return;
    if (active) {
        fab.className = "absolute top-20 right-4 md:top-auto md:bottom-8 md:right-6 z-[1000] w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg shadow-emerald-500/50 bg-emerald-500 border border-emerald-400 text-white";
    } else {
        fab.className = "absolute top-20 right-4 md:top-auto md:bottom-8 md:right-6 z-[1000] w-12 h-12 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-blue-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg shadow-black/50";
    }
}

// --- 4. LOGIKA GPS TRACKING (Background Process) ---
function requestLocation() {
    if (!("geolocation" in navigator)) return; // silently fail for background
    if (gpsWatchId !== null) return; // already tracking

    gpsWatchId = navigator.geolocation.watchPosition(
        (position) => {
            userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };

            if (userMarkerObj) map.removeLayer(userMarkerObj);
            userMarkerObj = L.marker([userLocation.lat, userLocation.lng], { icon: gpsIcon, zIndexOffset: 2000 }).addTo(map);

            // Visual indication on FAB
            setGpsFabActive(true);

            // Auto-fill start field only if it's empty
            const startHidden = document.getElementById('startNode');
            const startInput = document.getElementById('startSearch');
            const startClear = document.getElementById('startClear');
            if (!startHidden.value) {
                startHidden.value = "gps";
                startInput.value = "📍 Lokasi Saya Saat Ini (GPS)";
                if (startClear) startClear.classList.remove('hidden');
            }

            // Kompas: Inisiasi listener rotasi HP
            if (!window.compassInitialized) {
                if (window.DeviceOrientationEvent) {
                    window.addEventListener('deviceorientation', function (event) {
                        let heading = null;
                        if (event.webkitCompassHeading) {
                            heading = event.webkitCompassHeading; // iOS
                        } else if (event.alpha !== null) {
                            // Android chrome alpha is device rotation around z-axis
                            // Assuming portrait mode
                            heading = 360 - event.alpha;
                        }

                        if (heading !== null) {
                            const gpsHeadingEl = document.getElementById('gps-heading-icon');
                            if (gpsHeadingEl) {
                                gpsHeadingEl.style.transform = `rotate(${heading}deg)`;
                            }
                        }
                    });
                }
                window.compassInitialized = true;
            }
        },
        (error) => {
            // Silent fail — GPS not available, just don't show badge
            console.warn('GPS unavailable:', error.message);
        },
        { enableHighAccuracy: true, maximumAge: 0 }
    );
}

function stopLocationTracking() {
    if (gpsWatchId !== null) { navigator.geolocation.clearWatch(gpsWatchId); gpsWatchId = null; }
    userLocation = null;
    if (userMarkerObj) { map.removeLayer(userMarkerObj); userMarkerObj = null; }

    const startHidden = document.getElementById('startNode');
    const startInput = document.getElementById('startSearch');
    if (startHidden && startHidden.value === 'gps') {
        startHidden.value = '';
        startInput.value = '';
        const startClear = document.getElementById('startClear');
        if (startClear) startClear.classList.add('hidden');
    }

    setGpsFabActive(false);
    showToast('GPS tracking dihentikan.', 'info');
}

// --- 5. MODIFIKASI AI ROUTING ---
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function findNearestWaypoint(lat, lng) {
    let minDist = Infinity;
    let nearestId = null;
    for (let id in nodes) {
        let dist = calculateDistance(lat, lng, nodes[id].lat, nodes[id].lng);
        if (dist < minDist) { minDist = dist; nearestId = id; }
    }
    return { id: nearestId, distance: minDist };
}

function setTravelMode(mode) {
    document.getElementById('travelMode').value = mode;
    ['foot', 'bike', 'car'].forEach(m => {
        const btn = document.getElementById('mode_' + m);
        if (m === mode) {
            btn.className = "segment-btn active flex flex-col items-center justify-center py-2.5 rounded-lg";
        } else {
            btn.className = "segment-btn flex flex-col items-center justify-center py-2.5 rounded-lg";
        }
    });
    if (!document.getElementById('journeyPanel').classList.contains('hidden')) {
        processRouting();
    }
}

async function processRouting() {
    let startId = document.getElementById('startNode').value;
    const endId = document.getElementById('endNode').value;
    const errorBox = document.getElementById('errorBox');

    if (!startId || !endId) { showError("Silakan tentukan titik awal dan tujuan."); return; }
    if (startId === endId) { showError("Titik awal dan tujuan tidak boleh sama."); return; }

    errorBox.classList.add('hidden');
    document.getElementById('journeyPanel').classList.add('hidden');

    const btn = document.getElementById('findBtn');
    btn.innerHTML = `<span class="animate-pulse">Analyzing Routes...</span>`; btn.disabled = true;

    // Show skeleton, hide journey panel
    document.getElementById('resultSkeleton').classList.add('visible');
    document.getElementById('journeyPanel').classList.add('hidden');

    try {
        let originCoords = null;
        let actualAlgoStart = startId;

        if (startId === 'gps') {
            if (!userLocation) throw new Error("Gagal membaca GPS.");
            originCoords = userLocation;
        } else {
            originCoords = { lat: nodes[startId].lat, lng: nodes[startId].lng };
        }
        const destCoords = { lat: nodes[endId].lat, lng: nodes[endId].lng };

        const travelMode = document.getElementById('travelMode').value;
        const osrmUrl = `https://router.project-osrm.org/route/v1/${travelMode}/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson&steps=true`;
        const res = await fetch(osrmUrl);
        const data = await res.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error("Rute tidak dapat ditemukan dengan mode ini.");
        }

        const route = data.routes[0];
        const distanceMetres = route.distance;

        let etaMinutes = 0;
        let modeText = "";
        let routeColor = "";

        if (travelMode === 'foot') {
            etaMinutes = Math.ceil(distanceMetres / 75);
            modeText = "🚶 Jalan Kaki";
            routeColor = "#34d399";
        } else if (travelMode === 'bike') {
            etaMinutes = Math.ceil(distanceMetres / 400);
            modeText = "🏍️ Motor";
            routeColor = "#fbbf24";
        } else {
            etaMinutes = Math.ceil(distanceMetres / 250) + 1;
            modeText = "🚗 Mobil";
            routeColor = "#3b82f6";
        }
        if (etaMinutes < 1) etaMinutes = 1;

        let distText = distanceMetres >= 1000 ? (distanceMetres / 1000).toFixed(2) + " km" : Math.round(distanceMetres) + " m";

        const polylineCoords = route.geometry.coordinates.map(c => [c[1], c[0]]);

        drawRouteReal(polylineCoords, actualAlgoStart, endId, startId === 'gps', originCoords, routeColor);
        showResult(distText, etaMinutes, modeText, route.legs[0].steps, startId, endId);
    } catch (e) {
        showError(e.message);
    } finally {
        resetButton();
        document.getElementById('resultSkeleton').classList.remove('visible');
    }
}

function drawRouteReal(polylineCoords, startId, endId, isGpsStart, gpsCoords, routeColor) {
    if (routeLayer) map.removeLayer(routeLayer);
    if (startMarkerObj) map.removeLayer(startMarkerObj);
    if (endMarkerObj) map.removeLayer(endMarkerObj);

    if (!isGpsStart) {
        startMarkerObj = L.marker([nodes[startId].lat, nodes[startId].lng], { icon: startIcon, zIndexOffset: 1000 }).addTo(map);
    }

    endMarkerObj = L.marker([nodes[endId].lat, nodes[endId].lng], { icon: endIcon, zIndexOffset: 1000 }).addTo(map);

    routeLayer = L.polyline(polylineCoords, { color: routeColor || '#06b6d4', weight: 6, opacity: 1, lineJoin: 'round', className: 'animated-route' }).addTo(map);
    map.flyToBounds(routeLayer.getBounds(), { padding: [60, 60], duration: 1.5 });
}

function showResult(distText, etaMinutes, modeText, steps, startId, endId) {
    // Show journey panel
    document.getElementById('journeyPanel').classList.remove('hidden');

    // ETA: current time + travel duration
    const now = new Date();
    now.setMinutes(now.getMinutes() + etaMinutes);
    const etaStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Route names
    const startName = startId === 'gps' ? '📍 Lokasi Saya' : (nodes[startId] ? nodes[startId].name : '-');
    const endName = nodes[endId] ? nodes[endId].name : '-';

    document.getElementById('jpStartName').innerText = startName;
    document.getElementById('jpEndName').innerText = endName;
    document.getElementById('jpETA').innerText = etaStr;
    document.getElementById('jpDuration').innerText = '~' + etaMinutes + ' mnt';
    document.getElementById('jpDistance').innerText = distText;
    document.getElementById('jpMode').innerText = modeText;

    // Destination info
    showDestinationInfo(endId);

    // Share button
    document.getElementById('jpShareBtn').onclick = () => {
        const msg = `Rute ke ${endName} via SmartRoute UNIB — ${distText}, ~${etaMinutes} mnt`;
        if (navigator.share) navigator.share({ title: 'SmartRoute UNIB', text: msg });
        else { navigator.clipboard && navigator.clipboard.writeText(msg); showToast('Info rute disalin!', 'success'); }
    };

    // Turn-by-Turn
    const tbtList = document.getElementById('turnByTurnList');
    if (steps && steps.length > 0) {
        tbtList.innerHTML = '';
        let validSteps = steps.filter((s, i) => s.distance > 0 || i === steps.length - 1);
        validSteps.forEach((step) => {
            const li = document.createElement('li');
            li.className = 'nav-step-item';

            let icon = '➡️', iconClass = '';
            if (step.maneuver.type === 'depart') { icon = '🚀'; iconClass = 'step-start'; }
            else if (step.maneuver.type === 'arrive') { icon = '🏁'; iconClass = 'step-end'; }
            else if (step.maneuver.modifier?.includes('left')) icon = '⬅️';
            else if (step.maneuver.modifier?.includes('right')) icon = '➡️';
            else if (step.maneuver.modifier === 'straight') icon = '⬆️';

            let distStep = step.distance > 0 ? `<span class="text-slate-500 ml-1">${Math.round(step.distance)}m</span>` : '';
            let instruction = 'Jalan lurus';
            if (step.maneuver.type === 'turn') instruction = `Belok ${step.maneuver.modifier.replace('left', 'kiri').replace('right', 'kanan')}`;
            else if (step.maneuver.type === 'depart') instruction = 'Mulai perjalanan';
            else if (step.maneuver.type === 'arrive') instruction = 'Tiba di tujuan';
            else if (step.maneuver.type === 'new name') instruction = 'Lanjutkan';
            else if (step.maneuver.type === 'end of road') instruction = `Ujung jalan, belok ${step.maneuver.modifier.replace('left', 'kiri').replace('right', 'kanan')}`;
            if (step.name && step.name !== '' && step.maneuver.type !== 'arrive')
                instruction += ` ke <span class="font-bold text-white">${step.name}</span>`;

            li.innerHTML = `<div class="nav-step-icon ${iconClass}"><span>${icon}</span></div><div class="flex-1 pt-1"><p class="text-slate-300 text-[11px] leading-relaxed">${instruction}${distStep}</p></div>`;
            tbtList.appendChild(li);
        });
    } else {
        tbtList.innerHTML = '<li class="text-slate-500 text-xs py-2 text-center">Tidak ada langkah tersedia.</li>';
    }

    // Scroll panel into view
    setTimeout(() => document.getElementById('journeyPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
}

function showDestinationInfo(endId) {
    const destNode = nodes[endId];
    if (!destNode) return;

    document.getElementById('jpDestName').innerText = destNode.name;
    document.getElementById('jpDestDesc').innerText = destNode.desc || 'Informasi detail mengenai fasilitas ini belum tersedia.';

    // Hero image
    document.getElementById('jpDestImage').style.backgroundImage = `url('https://picsum.photos/seed/${endId}/400/200')`;

    // Type badge
    const badge = document.getElementById('jpDestBadge');
    if (destNode.type === 'facility') {
        badge.innerText = 'Fasilitas Umum';
        badge.style.cssText = 'position:absolute;top:8px;left:8px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;padding:3px 8px;border-radius:6px;backdrop-filter:blur(8px);background:rgba(16,185,129,0.3);color:#6ee7b7;border:1px solid rgba(16,185,129,0.4);';
    } else if (destNode.type === 'parking') {
        badge.innerText = 'Area Parkir';
        badge.style.cssText = 'position:absolute;top:8px;left:8px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;padding:3px 8px;border-radius:6px;backdrop-filter:blur(8px);background:rgba(245,158,11,0.3);color:#fcd34d;border:1px solid rgba(245,158,11,0.4);';
    } else {
        badge.innerText = 'Gedung Kampus';
        badge.style.cssText = 'position:absolute;top:8px;left:8px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;padding:3px 8px;border-radius:6px;backdrop-filter:blur(8px);background:rgba(59,130,246,0.3);color:#93c5fd;border:1px solid rgba(59,130,246,0.4);';
    }
}

// ============ TOAST NOTIFICATION SYSTEM ============
function showToast(msg, type = 'error') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        error: '<svg style="width:16px;height:16px;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        success: '<svg style="width:16px;height:16px;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        info: '<svg style="width:16px;height:16px;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    };
    toast.innerHTML = `${icons[type] || icons.info}<span>${msg}</span>`;
    toast.onclick = () => dismissToast(toast);
    container.appendChild(toast);

    setTimeout(() => dismissToast(toast), 4000);
}

function dismissToast(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 280);
}

function showError(msg) {
    // Keep errorBox hidden, use toast instead
    document.getElementById('errorBox').classList.add('hidden');
    showToast(msg, 'error');
}

function resetButton() {
    const btn = document.getElementById('findBtn');
    btn.disabled = false;
    btn.innerHTML = `<span>Periksa Rute</span>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 group-hover:translate-x-1 transition-transform">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
    </svg>`;
}

// ============ THEME TOGGLE (LIGHT/DARK) ============
let isLightMode = false;
function toggleTheme() {
    isLightMode = !isLightMode;
    if (isLightMode) {
        document.body.classList.add('light-mode');
        document.getElementById('themeIcon').innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />`; // Moon icon
        if (map && osmLayer) map.addLayer(osmLayer); // Pastikan base layer tetap terlihat jelas di light mode
    } else {
        document.body.classList.remove('light-mode');
        document.getElementById('themeIcon').innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />`; // Sun icon
    }
}

window.onload = () => {
    mockDatabase.push({ username: 'dosen_ai', password: '123' });
    initMap();
    updateUIBasedOnAuth();
};
