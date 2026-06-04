

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

async function processRouting(isAlternative = false) {
    const startId  = document.getElementById('startNode').value;
    const endId    = document.getElementById('endNode').value;
    const errorBox = document.getElementById('errorBox');

    if (!startId || !endId)  { showError('Silakan tentukan titik awal dan tujuan.'); return; }
    if (startId === endId)   { showError('Titik awal dan tujuan tidak boleh sama.'); return; }

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
            const nearest = findNearestWaypoint(userLocation.lat, userLocation.lng);
            if (!nearest.id) throw new Error('Lokasi GPS Anda di luar jangkauan kampus.');
            actualAlgoStart = nearest.id;
        } else {
            originCoords = { lat: nodes[startId].lat, lng: nodes[startId].lng };
        }
        const destCoords = { lat: nodes[endId].lat, lng: nodes[endId].lng };

        await advanceStepper(1);
        const travelMode = document.getElementById('travelMode').value;

        if (isAlternative && cachedRoutes.length > currentRouteIndex) {
            await advanceStepper(2);
            await advanceStepper(3);
            displayCachedRoute(currentRouteIndex, travelMode, actualAlgoStart, endId, startId === 'gps', originCoords, true);
            return;
        }

        // Run Dijkstra algorithm on client side
        const dijkstraResult = runDijkstra(actualAlgoStart, endId);
        
        // Render Dijkstra logs in UI
        const logList = document.getElementById('dijkstraLogList');
        if (logList) {
            logList.innerHTML = dijkstraResult.logs.map(log => `<div class="py-1 border-b border-slate-900/30">${log}</div>`).join('');
        }

        let coordsStr = '';
        if (dijkstraResult.found && dijkstraResult.path.length > 0) {
            let pathCoords = [];
            if (startId === 'gps') {
                pathCoords.push(userLocation);
            }
            dijkstraResult.path.forEach(nodeId => {
                pathCoords.push({ lat: nodes[nodeId].lat, lng: nodes[nodeId].lng });
            });
            coordsStr = pathCoords.map(c => `${c.lng},${c.lat}`).join(';');
        } else {
            coordsStr = `${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}`;
        }

        const osrmUrl   = `${OSRM_BASE_URL}/${travelMode}/${coordsStr}?overview=full&geometries=geojson&steps=true&alternatives=true`;
        const res  = await fetch(osrmUrl);
        const data = await res.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error('Rute tidak dapat ditemukan dengan mode ini.');
        }

        await advanceStepper(2);

        cachedRoutes        = data.routes;
        lastOriginCoords    = originCoords;
        lastActualAlgoStart = actualAlgoStart;
        lastIsGpsStart      = startId === 'gps';

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

function displayCachedRoute(idx, travelMode, actualAlgoStart, endId, isGpsStart, originCoords, isAlternative) {
    const route          = cachedRoutes[idx];
    const distanceMetres = route.distance;
    const etaMinutes     = calcEta(distanceMetres, travelMode);

    let modeText = '', routeColor = '';
    if (travelMode === 'foot')       { modeText = '🚶 Jalan Kaki'; routeColor = ROUTE_COLORS.foot; }
    else if (travelMode === 'bike') { modeText = '🏍️ Motor';   routeColor = ROUTE_COLORS.bike; }
    else                             { modeText = '🚗 Mobil';   routeColor = ROUTE_COLORS.car;  }

    if (isAlternative && idx > 0) {
        routeColor = ALTERNATE_COLORS[(idx - 1) % ALTERNATE_COLORS.length];
    }

    if (typeof isNightMode !== 'undefined' && isNightMode) routeColor = '#3b82f6';

    const distText       = distanceMetres >= 1000 ? (distanceMetres / 1000).toFixed(2) + ' km' : Math.round(distanceMetres) + ' m';
    const polylineCoords = route.geometry.coordinates.map(c => [c[1], c[0]]);

    currentRouteCoords = polylineCoords;

    drawRouteReal(polylineCoords, actualAlgoStart, endId, isGpsStart, originCoords, routeColor);
    const steps = route.legs ? route.legs.flatMap(l => l.steps) : [];
    showResult(distText, etaMinutes, modeText, steps, currentStartId, endId, isAlternative, distanceMetres);
}