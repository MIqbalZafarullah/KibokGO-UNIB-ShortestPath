async function blockCurrentRoute() {
    if (currentRouteCoords.length === 0) {
        showToast('Tidak ada rute aktif untuk diblokir.', 'error');
        return;
    }

    if (blockedPolylines.length >= MAX_BLOCKED) {
        showToast(`⚠️ Maksimum ${MAX_BLOCKED} rute cadangan telah tercapai.`, 'error');
        return;
    }

    const travelMode = document.getElementById('travelMode').value;
    const startId  = document.getElementById('startNode').value;
    const endId    = document.getElementById('endNode').value;

    let originCoords = null;
    if (startId === 'gps') {
        if (!userLocation) { showToast('Gagal membaca GPS.', 'error'); return; }
        originCoords = userLocation;
    } else {
        originCoords = { lat: nodes[startId].lat, lng: nodes[startId].lng };
    }
    const destCoords = { lat: nodes[endId].lat, lng: nodes[endId].lng };

    const bp = getRouteDistanceMidpoint(currentRouteCoords);
    if (!bp) {
        showToast('Gagal menghitung titik tengah rute.', 'error');
        return;
    }
    blockedPoints.push(bp);

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
    const blockMarker = L.marker([bp.lat, bp.lng], { icon: blockadeIcon }).addTo(map);
    blockedPolylines.push({ layer: blockedLayer, marker: blockMarker });

    const blockBtn = document.getElementById('jpBlockBtn');
    if (blockBtn) {
        blockBtn.disabled = true;
        blockBtn.innerHTML = 'Mencari rute cadangan...';
    }

    try {
        const internalCandidates = [];
        const externalCandidates = [];

        for (const id in nodes) {
            if (id === startId || id === endId || id === 'gps') continue;
            const node = nodes[id];
            
            const d_start = getDistance(originCoords.lat, originCoords.lng, node.lat, node.lng);
            const d_end   = getDistance(destCoords.lat, destCoords.lng, node.lat, node.lng);
            
            let d_blocked = Infinity;
            for (const b of blockedPoints) {
                const dist = getDistance(node.lat, node.lng, b.lat, b.lng);
                if (dist < d_blocked) d_blocked = dist;
            }

            if (d_blocked < 25) continue;
            if (d_start < 25 || d_end < 25) continue;

            internalCandidates.push({
                lat: node.lat,
                lng: node.lng,
                est: d_start + d_end
            });
        }

        const externalPoints = [
            { lat: -3.7600, lng: 102.2670 },
            { lat: -3.7570, lng: 102.2675 },
            { lat: -3.7617, lng: 102.2715 },
            { lat: -3.7620, lng: 102.2700 },
            { lat: -3.7610, lng: 102.2745 },
            { lat: -3.7615, lng: 102.2735 },
            { lat: -3.7550, lng: 102.2700 }
        ];
        for (const pt of externalPoints) {
            const d_start = getDistance(originCoords.lat, originCoords.lng, pt.lat, pt.lng);
            const d_end   = getDistance(destCoords.lat, destCoords.lng, pt.lat, pt.lng);
            
            let d_blocked = Infinity;
            for (const b of blockedPoints) {
                const dist = getDistance(pt.lat, pt.lng, b.lat, b.lng);
                if (dist < d_blocked) d_blocked = dist;
            }

            if (d_blocked < 25) continue;
            if (d_start < 25 || d_end < 25) continue;

            externalCandidates.push({
                lat: pt.lat,
                lng: pt.lng,
                est: d_start + d_end
            });
        }

        const dy = destCoords.lat - originCoords.lat;
        const dx = destCoords.lng - originCoords.lng;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len > 0) {
            const px = -dy / len;
            const py = dx / len;
            
            const offsets = [0.0012, -0.0012, 0.0024, -0.0024];
            offsets.forEach(offset => {
                const wLat = bp.lat + offset * px;
                const wLng = bp.lng + offset * py;

                const d_start = getDistance(originCoords.lat, originCoords.lng, wLat, wLng);
                const d_end   = getDistance(destCoords.lat, destCoords.lng, wLat, wLng);

                let d_blocked = Infinity;
                for (const b of blockedPoints) {
                    const dist = getDistance(wLat, wLng, b.lat, b.lng);
                    if (dist < d_blocked) d_blocked = dist;
                }

                if (d_blocked < 25) return;
                if (d_start < 25 || d_end < 25) return;

                internalCandidates.push({
                    lat: wLat,
                    lng: wLng,
                    est: d_start + d_end
                });
            });
        }

        internalCandidates.sort((a, b) => a.est - b.est);
        externalCandidates.sort((a, b) => a.est - b.est);

        const topCandidates = [
            ...internalCandidates.slice(0, 6),
            ...externalCandidates.slice(0, 6)
        ];

        if (topCandidates.length === 0) {
            throw new Error('Tidak ada titik alternatif kandidat.');
        }
        const fetchPromises = topCandidates.map(async (c) => {
            const coordsStr = `${originCoords.lng},${originCoords.lat};${c.lng},${c.lat};${destCoords.lng},${destCoords.lat}`;
            const osrmUrl   = `${OSRM_BASE_URL}/${travelMode}/${coordsStr}?overview=full&geometries=geojson&steps=true`;
            try {
                const res = await fetch(osrmUrl);
                const data = await res.json();
                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    return data.routes[0];
                }
            } catch (err) {
                console.warn('Failed OSRM fetch for candidate:', err);
            }
            return null;
        });

        const routes = (await Promise.all(fetchPromises)).filter(r => r !== null);

        const validRoutes = routes.filter(r => {
            const coords = r.geometry.coordinates;
            for (const pt of coords) {
                const ptLat = pt[1];
                const ptLng = pt[0];
                for (const b of blockedPoints) {
                    if (getDistance(ptLat, ptLng, b.lat, b.lng) < 25) {
                        return false;
                    }
                }
            }
            return true;
        });

        if (validRoutes.length === 0) {
            showToast('❌ Tidak ada rute alternatif lain yang tersedia untuk menghindari blokir.', 'error');
            blockedPoints.pop();
            const lastBlock = blockedPolylines.pop();
            if (lastBlock) {
                if (map.hasLayer(lastBlock.layer)) map.removeLayer(lastBlock.layer);
                if (map.hasLayer(lastBlock.marker)) map.removeLayer(lastBlock.marker);
            }
            return;
        }

        validRoutes.sort((a, b) => a.distance - b.distance);

        const bestDetour = validRoutes[0];
        currentRouteIndex = blockedPolylines.length;

        cachedRoutes[currentRouteIndex] = bestDetour;

        showToast(`🚧 Rute diblokir! Menampilkan rute cadangan ke-${currentRouteIndex}...`, 'info');

        displayCachedRoute(
            currentRouteIndex,
            travelMode,
            lastActualAlgoStart,
            currentEndId,
            lastIsGpsStart,
            lastOriginCoords,
            true
        );

    } catch (e) {
        showToast('Terjadi kesalahan saat mencari rute cadangan.', 'error');
        console.error(e);
        blockedPoints.pop();
        const lastBlock = blockedPolylines.pop();
        if (lastBlock) {
            if (map.hasLayer(lastBlock.layer)) map.removeLayer(lastBlock.layer);
            if (map.hasLayer(lastBlock.marker)) map.removeLayer(lastBlock.marker);
        }
    } finally {
        if (blockBtn) {
            blockBtn.disabled = false;
            blockBtn.innerHTML = '🚧 Blok Rute Ini';
        }
    }
}

function resetAllBlocks(triggerReRoute = true) {
    blockedPolylines.forEach(({ layer, marker }) => {
        if (map && map.hasLayer(layer))  map.removeLayer(layer);
        if (map && map.hasLayer(marker)) map.removeLayer(marker);
    });
    blockedPolylines   = [];
    blockedPoints      = [];
    currentRouteIndex  = 0;
    currentRouteCoords = [];

    if (triggerReRoute && currentStartId && currentEndId && cachedRoutes.length > 0) {
        showToast('🔄 Semua blokir direset. Kembali ke rute utama...', 'info');
        const travelMode = document.getElementById('travelMode').value;
        displayCachedRoute(0, travelMode, lastActualAlgoStart, currentEndId, lastIsGpsStart, lastOriginCoords, false);
    }
}
