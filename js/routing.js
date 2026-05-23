// ================================================
// routing.js — Kalkulasi Rute & Tampilan Hasil
// SmartRoute UNIB | AI-Powered Campus Navigation
// ================================================

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
async function processRouting() {
    const startId  = document.getElementById('startNode').value;
    const endId    = document.getElementById('endNode').value;
    const errorBox = document.getElementById('errorBox');

    if (!startId || !endId)    { showError('Silakan tentukan titik awal dan tujuan.'); return; }
    if (startId === endId)     { showError('Titik awal dan tujuan tidak boleh sama.'); return; }

    errorBox.classList.add('hidden');
    document.getElementById('journeyPanel').classList.add('hidden');

    // Sembunyikan empty state, tampilkan stepper
    const emptyState = document.getElementById('emptyStatePanel');
    if (emptyState) emptyState.classList.add('hidden');

    const btn = document.getElementById('findBtn');
    btn.innerHTML = `<span class="animate-pulse">Menganalisis...</span>
    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
    </svg>`;
    btn.disabled = true;

    showRouteStepper();

    try {
        let originCoords  = null;
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
        const osrmUrl    = `${OSRM_BASE_URL}/${travelMode}/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson&steps=true`;
        const res  = await fetch(osrmUrl);
        const data = await res.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error('Rute tidak dapat ditemukan dengan mode ini.');
        }

        await advanceStepper(2);

        const route         = data.routes[0];
        const distanceMetres = route.distance;

        let etaMinutes = 0, modeText = '', routeColor = '';
        if (travelMode === 'foot') {
            etaMinutes = Math.ceil(distanceMetres / TRAVEL_SPEED.foot);
            modeText   = '🚶 Jalan Kaki';
            routeColor = ROUTE_COLORS.foot;
        } else if (travelMode === 'bike') {
            etaMinutes = Math.ceil(distanceMetres / TRAVEL_SPEED.bike);
            modeText   = '🏍️ Motor';
            routeColor = ROUTE_COLORS.bike;
        } else {
            etaMinutes = Math.ceil(distanceMetres / TRAVEL_SPEED.car) + 1;
            modeText   = '🚗 Mobil';
            routeColor = ROUTE_COLORS.car;
        }
        if (etaMinutes < 1) etaMinutes = 1;

        const distText       = distanceMetres >= 1000 ? (distanceMetres / 1000).toFixed(2) + ' km' : Math.round(distanceMetres) + ' m';
        const polylineCoords = route.geometry.coordinates.map(c => [c[1], c[0]]);

        // Override warna rute jika Night Mode aktif
        if (typeof isNightMode !== 'undefined' && isNightMode) {
            routeColor = '#3b82f6'; // biru untuk mode malam
        }

        await advanceStepper(3);
        drawRouteReal(polylineCoords, actualAlgoStart, endId, startId === 'gps', originCoords, routeColor);
        showResult(distText, etaMinutes, modeText, route.legs[0].steps, startId, endId);

    } catch (e) {
        showError(e.message);
        if (emptyState) emptyState.classList.remove('hidden');
    } finally {
        resetButton();
        hideRouteStepper();
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
function showResult(distText, etaMinutes, modeText, steps, startId, endId) {
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

    showDestinationInfo(endId);

    document.getElementById('jpShareBtn').onclick = () => {
        const msg = `Rute ke ${endName} via SmartRoute UNIB — ${distText}, ~${etaMinutes} mnt`;
        if (navigator.share) navigator.share({ title: 'SmartRoute UNIB', text: msg });
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
