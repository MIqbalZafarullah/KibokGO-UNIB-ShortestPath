// ================================================
// routing.js — Kalkulasi Rute & Tampilan Hasil
// KibokGO UNIB | AI-Powered Campus Navigation
// ================================================

// -----------------------------------------------
// State: Rute Cadangan (Blocked Route)
// -----------------------------------------------
let blockedPolylines   = [];   // Layer rute diblokir (garis merah putus) di peta
let cachedRoutes       = [];   // Semua rute dari OSRM (index 0 = utama, 1,2,3 = alternatif)
let currentRouteIndex  = 0;    // Indeks rute aktif di cachedRoutes
let currentRouteCoords = [];   // Koordinat polyline rute yang sedang ditampilkan
let currentStartId     = null;
let currentEndId       = null;
let originalRouteMetres = 0;
let originalEtaMinutes  = 0;
let lastOriginCoords    = null;
let lastActualAlgoStart = null;
let lastIsGpsStart      = false;

const ALTERNATE_COLORS = ['#f97316', '#a855f7', '#facc15']; // Oranye, Ungu, Kuning
const MAX_BLOCKED = 3;

// -----------------------------------------------
// Set Mode Kendaraan
// -----------------------------------------------
function setTravelMode(mode) {
    document.getElementById('travelMode').value = mode;
    ['foot', 'bike', 'car'].forEach(m => {
        const btn = document.getElementById('mode_' + m);
        btn.className = m === mode
            ? 'segment-btn active flex flex-col items-center justify-center py-2.5 rounded-lg'
            : 'segment-btn flex flex-col items-center justify-center py-2.5 rounded-lg';
    });
    if (!document.getElementById('journeyPanel').classList.contains('hidden')) {
        processRouting();
    }
}

// -----------------------------------------------
// Proses Kalkulasi Rute (OSRM API)
// -----------------------------------------------
async function processRouting(isAlternative = false) {
    const startId  = document.getElementById('startNode').value;
    const endId    = document.getElementById('endNode').value;
    const errorBox = document.getElementById('errorBox');

    if (!startId || !endId)  { showError('Silakan tentukan titik awal dan tujuan.'); return; }
    if (startId === endId)   { showError('Titik awal dan tujuan tidak boleh sama.'); return; }

    // Pencarian baru: reset semua state
    if (!isAlternative) {
        resetAllBlocks(false);
        cachedRoutes      = [];
        currentRouteIndex = 0;
    }

    currentStartId = startId;
    currentEndId   = endId;

    errorBox.classList.add('hidden');
    document.getElementById('journeyPanel').classList.add('hidden');

    const emptyState = document.getElementById('emptyStatePanel');
    if (emptyState) emptyState.classList.add('hidden');

    const btn = document.getElementById('findBtn');
    btn.innerHTML = `<span class="animate-pulse">${isAlternative ? 'Mencari rute lain...' : 'Menganalisis...'}</span>
    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
    </svg>`;
    btn.disabled = true;

    showRouteStepper();

    try {
        let originCoords = null;
        let actualAlgoStart = startId;

        if (startId === 'gps') {
            if (!userLocation) throw new Error('Gagal membaca GPS.');
            originCoords = userLocation;
        } else {
            originCoords = { lat: nodes[startId].lat, lng: nodes[startId].lng };
        }
        const destCoords = { lat: nodes[endId].lat, lng: nodes[endId].lng };

        await advanceStepper(1);
        const travelMode = document.getElementById('travelMode').value;

        // ── Jika masih ada cache rute alternatif, TIDAK perlu panggil API lagi ──
        if (isAlternative && cachedRoutes.length > currentRouteIndex) {
            // Langsung pakai rute berikutnya dari cache
            await advanceStepper(2);
            await advanceStepper(3);
            displayCachedRoute(currentRouteIndex, travelMode, actualAlgoStart, endId, startId === 'gps', originCoords, true);
            return;
        }

        // ── Fetch dari OSRM dengan alternatives=true ──
        const coordsStr = `${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}`;
        const osrmUrl   = `${OSRM_BASE_URL}/${travelMode}/${coordsStr}?overview=full&geometries=geojson&steps=true&alternatives=true`;
        const res  = await fetch(osrmUrl);
        const data = await res.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error('Rute tidak dapat ditemukan dengan mode ini.');
        }

        await advanceStepper(2);

        // Simpan semua rute dari OSRM (biasanya 1–3 rute)
        cachedRoutes        = data.routes;
        lastOriginCoords    = originCoords;
        lastActualAlgoStart = actualAlgoStart;
        lastIsGpsStart      = startId === 'gps';

        // Simpan jarak & ETA rute pertama untuk perbandingan
        const firstRoute = cachedRoutes[0];
        originalRouteMetres = firstRoute.distance;
        const firstEta = calcEta(firstRoute.distance, travelMode);
        originalEtaMinutes  = firstEta;

        await advanceStepper(3);
        displayCachedRoute(0, travelMode, actualAlgoStart, endId, startId === 'gps', originCoords, false);

    } catch (e) {
        showError(e.message);
        if (emptyState) emptyState.classList.remove('hidden');
    } finally {
        resetButton();
        hideRouteStepper();
    }
}

// -----------------------------------------------
// Helper: hitung ETA dari jarak & mode
// -----------------------------------------------
function calcEta(metres, mode) {
    if (mode === 'foot') return Math.max(1, Math.ceil(metres / TRAVEL_SPEED.foot));
    if (mode === 'bike') return Math.max(1, Math.ceil(metres / TRAVEL_SPEED.bike));
    return Math.max(1, Math.ceil(metres / TRAVEL_SPEED.car) + 1);
}

// -----------------------------------------------
// Tampilkan rute dari cache (tanpa fetch ulang)
// -----------------------------------------------
function displayCachedRoute(idx, travelMode, actualAlgoStart, endId, isGpsStart, originCoords, isAlternative) {
    const route          = cachedRoutes[idx];
    const distanceMetres = route.distance;
    const etaMinutes     = calcEta(distanceMetres, travelMode);

    let modeText = '', routeColor = '';
    if (travelMode === 'foot')       { modeText = '🚶 Jalan Kaki'; routeColor = ROUTE_COLORS.foot; }
    else if (travelMode === 'bike') { modeText = '🏍️ Motor';   routeColor = ROUTE_COLORS.bike; }
    else                             { modeText = '🚗 Mobil';   routeColor = ROUTE_COLORS.car;  }

    // Rute alternatif pakai warna berbeda
    if (isAlternative && idx > 0) {
        routeColor = ALTERNATE_COLORS[(idx - 1) % ALTERNATE_COLORS.length];
    }

    if (typeof isNightMode !== 'undefined' && isNightMode) routeColor = '#3b82f6';

    const distText       = distanceMetres >= 1000 ? (distanceMetres / 1000).toFixed(2) + ' km' : Math.round(distanceMetres) + ' m';
    const polylineCoords = route.geometry.coordinates.map(c => [c[1], c[0]]);

    currentRouteCoords = polylineCoords;

    drawRouteReal(polylineCoords, actualAlgoStart, endId, isGpsStart, originCoords, routeColor);
    showResult(distText, etaMinutes, modeText, route.legs[0].steps, currentStartId, endId, isAlternative, distanceMetres);
}

// -----------------------------------------------
// Blokir Rute Aktif & Tampilkan Rute Cadangan
// -----------------------------------------------
function blockCurrentRoute() {
    if (currentRouteCoords.length === 0) {
        showToast('Tidak ada rute aktif untuk diblokir.', 'error');
        return;
    }

    const nextIdx = currentRouteIndex + 1;

    if (nextIdx >= cachedRoutes.length) {
        showToast('❌ Tidak ada rute alternatif lain yang tersedia untuk jalur ini.', 'error');
        return;
    }
    if (currentRouteIndex >= MAX_BLOCKED) {
        showToast(`⚠️ Maksimum ${MAX_BLOCKED} rute cadangan telah tercapai.`, 'error');
        return;
    }

    // Gambar rute yang diblokir sebagai garis merah putus-putus
    const midCoord = currentRouteCoords[Math.floor(currentRouteCoords.length / 2)];
    const blockedLayer = L.polyline(currentRouteCoords, {
        color:     '#ef4444',
        weight:    4,
        opacity:   0.55,
        dashArray: '10, 8',
        lineJoin:  'round',
    }).addTo(map);

    const blockadeIcon = L.divIcon({
        className: '',
        html: `<div style="
            background:rgba(239,68,68,0.9);
            border:2px solid #fca5a5;
            border-radius:8px;
            padding:3px 7px;
            font-size:12px;
            font-weight:800;
            color:white;
            white-space:nowrap;
            box-shadow:0 2px 8px rgba(0,0,0,0.4);
            backdrop-filter:blur(4px);
        ">🚧 Diblokir</div>`,
        iconAnchor: [45, 16],
    });
    const blockMarker = L.marker([midCoord[0], midCoord[1]], { icon: blockadeIcon }).addTo(map);
    blockedPolylines.push({ layer: blockedLayer, marker: blockMarker });

    // Pindah ke rute berikutnya dari cache
    currentRouteIndex = nextIdx;
    currentRouteCoords = [];

    showToast(`🚧 Rute diblokir! Menampilkan rute cadangan ke-${currentRouteIndex + 1}...`, 'info');

    const travelMode = document.getElementById('travelMode').value;
    displayCachedRoute(
        currentRouteIndex,
        travelMode,
        lastActualAlgoStart,
        currentEndId,
        lastIsGpsStart,
        lastOriginCoords,
        true
    );
}

// -----------------------------------------------
// Reset Semua Blokir
// -----------------------------------------------
function resetAllBlocks(triggerReRoute = true) {
    blockedPolylines.forEach(({ layer, marker }) => {
        if (map && map.hasLayer(layer))  map.removeLayer(layer);
        if (map && map.hasLayer(marker)) map.removeLayer(marker);
    });
    blockedPolylines   = [];
    currentRouteIndex  = 0;
    currentRouteCoords = [];
    // cachedRoutes tetap dipertahankan agar reset bisa langsung tampilkan rute pertama

    if (triggerReRoute && currentStartId && currentEndId && cachedRoutes.length > 0) {
        showToast('🔄 Semua blokir direset. Kembali ke rute utama...', 'info');
        const travelMode = document.getElementById('travelMode').value;
        displayCachedRoute(0, travelMode, lastActualAlgoStart, currentEndId, lastIsGpsStart, lastOriginCoords, false);
    }
}

// -----------------------------------------------
// Progress Stepper
// -----------------------------------------------
const STEPPER_STEPS = [
    { icon: '📡', label: 'Menghubungkan Server',   sub: 'Mengakses OSRM routing engine...' },
    { icon: '🧭', label: 'Menemukan Jalur',         sub: 'AI menganalisis rute terpendek...' },
    { icon: '📐', label: 'Menghitung Jarak & ETA', sub: 'Memproses data jarak & waktu...' },
    { icon: '✅', label: 'Rute Siap!',              sub: 'Navigasi dimulai...' },
];
let stepperCurrentStep = 0;

function showRouteStepper() {
    stepperCurrentStep = 0;
    const card    = document.getElementById('routeProgressCard');
    const stepsEl = document.getElementById('stepperSteps');
    if (!card || !stepsEl) return;

    stepsEl.innerHTML = STEPPER_STEPS.map((s, i) => `
        <div class="stepper-step ${i === 0 ? 'step-active' : ''}" id="stepper-step-${i}">
            <div class="stepper-icon">${s.icon}</div>
            <div class="stepper-label">
                <span class="stepper-label-main">${s.label}</span>
                <span class="stepper-label-sub">${i === 0 ? s.sub : '—'}</span>
            </div>
            <div class="stepper-status">${i === 0 ? '<span class="stepper-spinner">⟳</span>' : ''}</div>
        </div>
    `).join('');

    card.classList.remove('hidden');
}

function advanceStepper(toStep) {
    return new Promise(resolve => {
        const prevEl = document.getElementById(`stepper-step-${toStep - 1}`);
        if (prevEl) {
            prevEl.classList.replace('step-active', 'step-done');
            prevEl.querySelector('.stepper-status').innerHTML = '✔️';
            prevEl.querySelector('.stepper-label-sub').textContent = 'Selesai';
        }
        const curEl = document.getElementById(`stepper-step-${toStep}`);
        if (curEl) {
            curEl.classList.add('step-active');
            curEl.querySelector('.stepper-label-sub').textContent = STEPPER_STEPS[toStep]?.sub || '';
            curEl.querySelector('.stepper-status').innerHTML = '<span class="stepper-spinner">⟳</span>';
        }
        stepperCurrentStep = toStep;
        setTimeout(resolve, 320);
    });
}

function hideRouteStepper() {
    const card = document.getElementById('routeProgressCard');
    if (card) setTimeout(() => card.classList.add('hidden'), 500);
}

// -----------------------------------------------
// Tampilkan Hasil Rute
// -----------------------------------------------
function showResult(distText, etaMinutes, modeText, steps, startId, endId, isAlternative = false, distanceMetres = 0) {
    document.getElementById('journeyPanel').classList.remove('hidden');

    // Auto expand bottom sheet di mobile
    if (window.innerWidth <= 768) updateSheetState('full');

    const now = new Date();
    now.setMinutes(now.getMinutes() + etaMinutes);
    const etaStr   = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    const startName = startId === 'gps' ? '📍 Lokasi Saya' : (nodes[startId]?.name || '-');
    const endName   = nodes[endId]?.name || '-';

    document.getElementById('jpStartName').innerText  = startName;
    document.getElementById('jpEndName').innerText    = endName;
    document.getElementById('jpETA').innerText        = etaStr;
    document.getElementById('jpDuration').innerText   = '~' + etaMinutes + ' mnt';
    document.getElementById('jpDistance').innerText   = distText;
    document.getElementById('jpMode').innerText       = modeText;

    // Update badge rute (Rute Utama / Rute ke-X)
    const fastestBadge = document.getElementById('jpFastestBadge');
    if (fastestBadge) {
        if (currentRouteIndex === 0) {
            fastestBadge.textContent = '⚡ Tercepat';
            fastestBadge.className   = 'jp-fastest-badge';
        } else {
            fastestBadge.textContent = `🔄 Rute ke-${currentRouteIndex + 1}`;
            fastestBadge.style.cssText = 'font-size:10px;font-weight:800;padding:3px 10px;border-radius:999px;background:rgba(249,115,22,0.15);color:#fb923c;border:1px solid rgba(249,115,22,0.4);letter-spacing:0.05em;';
        }
    }

    // Tampilkan / sembunyikan tombol blokir & reset
    const blockBtn  = document.getElementById('jpBlockBtn');
    const resetBtn  = document.getElementById('jpResetBtn');
    const blockInfo = document.getElementById('jpBlockInfo');
    if (blockBtn) {
        blockBtn.classList.remove('hidden');
        // Disable jika sudah maksimum blokir
        const remaining = MAX_BLOCKED - blockedWaypoints.length;
        blockBtn.disabled = (remaining <= 0);
        blockBtn.title = remaining > 0 ? `Sisa ${remaining} rute cadangan` : 'Batas blokir tercapai';
    }
    if (resetBtn) {
        if (blockedWaypoints.length > 0) resetBtn.classList.remove('hidden');
        else resetBtn.classList.add('hidden');
    }
    if (blockInfo) {
        blockInfo.textContent = blockedWaypoints.length > 0
            ? `${blockedWaypoints.length} rute diblokir • Sisa ${MAX_BLOCKED - blockedWaypoints.length} cadangan`
            : 'Tekan jika rute sedang macet atau ditutup';
    }

    // ── Panel saran rute cadangan ──
    const altPanel = document.getElementById('jpAltSuggestion');
    if (altPanel) {
        if (isAlternative && originalRouteMetres > 0 && distanceMetres > 0) {
            const deltaMetre = Math.round(distanceMetres - originalRouteMetres);
            const deltaEta   = etaMinutes - originalEtaMinutes;
            const deltaDistStr = deltaMetre >= 0
                ? `+${deltaMetre >= 1000 ? (deltaMetre/1000).toFixed(1)+'km' : deltaMetre+'m'} lebih panjang`
                : `${Math.abs(deltaMetre)}m lebih pendek`;
            const deltaEtaStr = deltaEta > 0 ? `+${deltaEta} mnt` : deltaEta < 0 ? `${deltaEta} mnt` : 'sama';
            const altColor    = ALTERNATE_COLORS[(currentRouteIndex - 1) % ALTERNATE_COLORS.length];

            altPanel.innerHTML = `
                <div class="jp-alt-suggestion-inner" style="border-left:3px solid ${altColor}">
                    <div class="flex items-center gap-2 mb-2">
                        <span style="color:${altColor};font-size:16px;">🗺️</span>
                        <span class="text-xs font-extrabold" style="color:${altColor};">Rute Cadangan ke-${currentRouteIndex + 1} Ditemukan!</span>
                    </div>
                    <div class="flex gap-3 flex-wrap">
                        <span class="jp-alt-chip">
                            <span style="opacity:.6;font-size:9px;">JARAK</span>
                            <strong>${distText}</strong>
                        </span>
                        <span class="jp-alt-chip" style="color:#f87171;">
                            <span style="opacity:.6;font-size:9px;">DELTA</span>
                            <strong>${deltaDistStr}</strong>
                        </span>
                        <span class="jp-alt-chip" style="color:#fb923c;">
                            <span style="opacity:.6;font-size:9px;">WAKTU</span>
                            <strong>${deltaEtaStr}</strong>
                        </span>
                    </div>
                    <p class="text-[10px] text-slate-400 mt-2">Rute ini menghindari jalur yang diblokir sebelumnya.</p>
                </div>`;
            altPanel.classList.remove('hidden');

            // Toast saran
            const sign = deltaMetre >= 0 ? '+' : '';
            showToast(`🗺️ Rute cadangan ke-${currentRouteIndex + 1}: ${distText} (${sign}${deltaMetre}m, ${deltaEtaStr})`, 'info');
        } else {
            altPanel.innerHTML = '';
            altPanel.classList.add('hidden');
        }
    }

    showDestinationInfo(endId);

    document.getElementById('jpShareBtn').onclick = () => {
        const msg = `Rute ke ${endName} via KibokGO UNIB — ${distText}, ~${etaMinutes} mnt`;
        if (navigator.share) navigator.share({ title: 'KibokGO UNIB', text: msg });
        else { navigator.clipboard?.writeText(msg); showToast('Info rute disalin!', 'success'); }
    };

    // Turn-by-turn navigation steps
    const tbtList = document.getElementById('turnByTurnList');
    if (steps && steps.length > 0) {
        tbtList.innerHTML = '';
        steps.filter((s, i) => s.distance > 0 || i === steps.length - 1).forEach(step => {
            const li = document.createElement('li');
            li.className = 'nav-step-item';

            let icon = '➡️', iconClass = '';
            if (step.maneuver.type === 'depart')                        { icon = '🚀'; iconClass = 'step-start'; }
            else if (step.maneuver.type === 'arrive')                   { icon = '🏁'; iconClass = 'step-end'; }
            else if (step.maneuver.modifier?.includes('left'))          icon = '⬅️';
            else if (step.maneuver.modifier?.includes('right'))         icon = '➡️';
            else if (step.maneuver.modifier === 'straight')             icon = '⬆️';

            let instruction = 'Jalan lurus';
            if (step.maneuver.type === 'turn')         instruction = `Belok ${step.maneuver.modifier.replace('left','kiri').replace('right','kanan')}`;
            else if (step.maneuver.type === 'depart')  instruction = 'Mulai perjalanan';
            else if (step.maneuver.type === 'arrive')  instruction = 'Tiba di tujuan';
            else if (step.maneuver.type === 'new name') instruction = 'Lanjutkan';
            else if (step.maneuver.type === 'end of road') instruction = `Ujung jalan, belok ${step.maneuver.modifier.replace('left','kiri').replace('right','kanan')}`;
            if (step.name && step.name !== '' && step.maneuver.type !== 'arrive')
                instruction += ` ke <span class="font-bold text-white">${step.name}</span>`;

            const distStep = step.distance > 0 ? `<span class="text-slate-500 ml-1">${Math.round(step.distance)}m</span>` : '';
            li.innerHTML   = `<div class="nav-step-icon ${iconClass}"><span>${icon}</span></div><div class="flex-1 pt-1"><p class="text-slate-300 text-[11px] leading-relaxed">${instruction}${distStep}</p></div>`;
            tbtList.appendChild(li);
        });
    } else {
        tbtList.innerHTML = '<li class="text-slate-500 text-xs py-2 text-center">Tidak ada langkah tersedia.</li>';
    }

    setTimeout(() => document.getElementById('journeyPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
}

// -----------------------------------------------
// Informasi Destinasi
// -----------------------------------------------
function showDestinationInfo(endId) {
    const destNode = nodes[endId];
    if (!destNode) return;

    document.getElementById('jpDestName').innerText = destNode.name;
    document.getElementById('jpDestDesc').innerText = destNode.desc || 'Informasi detail mengenai fasilitas ini belum tersedia.';
    document.getElementById('jpDestImage').style.backgroundImage = `url('https://picsum.photos/seed/${endId}/400/200')`;

    const badge = document.getElementById('jpDestBadge');
    const styles = {
        facility: 'background:rgba(16,185,129,0.3);color:#6ee7b7;border:1px solid rgba(16,185,129,0.4);',
        parking:  'background:rgba(245,158,11,0.3);color:#fcd34d;border:1px solid rgba(245,158,11,0.4);',
    };
    const labels = { facility: 'Fasilitas Umum', parking: 'Area Parkir' };
    const baseStyle = 'position:absolute;top:8px;left:8px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;padding:3px 8px;border-radius:6px;backdrop-filter:blur(8px);';

    badge.innerText   = labels[destNode.type] || 'Gedung Kampus';
    badge.style.cssText = baseStyle + (styles[destNode.type] || 'background:rgba(59,130,246,0.3);color:#93c5fd;border:1px solid rgba(59,130,246,0.4);');
}
