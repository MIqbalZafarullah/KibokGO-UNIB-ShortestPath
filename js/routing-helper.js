let blockedPolylines   = [];
let blockedPoints      = [];
let cachedRoutes       = [];
let currentRouteIndex  = 0;
let currentRouteCoords = [];
let currentStartId     = null;
let currentEndId       = null;
let originalRouteMetres = 0;
let originalEtaMinutes  = 0;
let lastOriginCoords    = null;
let lastActualAlgoStart = null;
let lastIsGpsStart      = false;

const ALTERNATE_COLORS = ['#f97316', '#a855f7', '#facc15'];
const MAX_BLOCKED = 3;

function getDistance(lat1, lon1, lat2, lon2) {
    const R  = 6371000;
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a  = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function calcEta(metres, mode) {
    if (mode === 'foot') return Math.max(1, Math.ceil(metres / TRAVEL_SPEED.foot));
    if (mode === 'bike') return Math.max(1, Math.ceil(metres / TRAVEL_SPEED.bike));
    return Math.max(1, Math.ceil(metres / TRAVEL_SPEED.car) + 1);
}

function getRouteDistanceMidpoint(coords) {
    if (!coords || coords.length === 0) return null;
    let totalDist = 0;
    const distances = [];
    for (let i = 0; i < coords.length - 1; i++) {
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const d = getDistance(p1[0], p1[1], p2[0], p2[1]);
        totalDist += d;
        distances.push(d);
    }
    const targetDist = totalDist / 2;
    let accumDist = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        const d = distances[i];
        if (accumDist + d >= targetDist) {
            const ratio = (targetDist - accumDist) / d;
            const p1 = coords[i];
            const p2 = coords[i + 1];
            const lat = p1[0] + ratio * (p2[0] - p1[0]);
            const lng = p1[1] + ratio * (p2[1] - p1[1]);
            return { lat, lng };
        }
        accumDist += d;
    }
    const last = coords[coords.length - 1];
    return { lat: last[0], lng: last[1] };
}
