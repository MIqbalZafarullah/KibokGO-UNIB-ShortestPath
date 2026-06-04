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

function showResult(distText, etaMinutes, modeText, steps, startId, endId, isAlternative = false, distanceMetres = 0) {
    document.getElementById('journeyPanel').classList.remove('hidden');

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

    const blockBtn  = document.getElementById('jpBlockBtn');
    const resetBtn  = document.getElementById('jpResetBtn');
    const blockInfo = document.getElementById('jpBlockInfo');
    if (blockBtn) {
        blockBtn.classList.remove('hidden');
        const remaining = MAX_BLOCKED - blockedPolylines.length;
        blockBtn.disabled = (remaining <= 0);
        blockBtn.title = remaining > 0 ? `Sisa ${remaining} rute cadangan` : 'Batas blokir tercapai';
    }
    if (resetBtn) {
        if (blockedPolylines.length > 0) resetBtn.classList.remove('hidden');
        else resetBtn.classList.add('hidden');
    }
    if (blockInfo) {
        blockInfo.textContent = blockedPolylines.length > 0
            ? `${blockedPolylines.length} rute diblokir • Sisa ${MAX_BLOCKED - blockedPolylines.length} cadangan`
            : 'Tekan jika rute sedang macet atau ditutup';
    }

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
                        <span class="text-xs font-extrabold" style="color:${altColor};">Rute Cadangan ke-${currentRouteIndex} Ditemukan!</span>
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

            const sign = deltaMetre >= 0 ? '+' : '';
            showToast(`🗺️ Rute cadangan ke-${currentRouteIndex}: ${distText} (${sign}${deltaMetre}m, ${deltaEtaStr})`, 'info');
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
