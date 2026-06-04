// Graph definition for Universitas Bengkulu (UNIB) Campus
// Distance weights are calculated based on approximate physical distance in meters.
const DIJKSTRA_GRAPH = {
    'rektorat': { 'parkir_rektorat': 55, 'glt': 97, 'gb2': 212, 'gerbang': 196 },
    'glt': { 'rektorat': 97, 'parkir_rektorat': 54, 'gb2': 227, 'mushola': 188 },
    'atm': { 'gerbang': 116, 'parkir_rektorat': 168, 'lab_tanah': 210, 'pertanian': 296 },
    'fkip': { 'teknik': 285, 'gsg': 178, 'gb5': 140, 'fku': 156, 'stadion': 184 },
    'mipa': { 'perpus': 87, 'pkm': 122, 'gb5': 192, 'gb3': 198 },
    'feb': { 'pertanian': 240, 'hukum': 103, 'gor': 124, 'basket': 258 },
    'teknik': { 'masjid_albarru': 94, 'lab_teknik': 41, 'gsg': 121, 'fkip': 285, 'lab_fkip': 114 },
    'hukum': { 'pertanian': 152, 'feb': 103, 'gor': 72, 'basket': 177 },
    'pertanian': { 'atm': 296, 'lab_tanah': 95, 'feb': 240, 'hukum': 152 },
    'fku': { 'fkip': 156, 'stadion': 316 },
    'fisip': { 'gb2': 137, 'kantin': 122, 'masjid_albarru': 156 },
    'lab_fkip': { 'kantin': 43, 'masjid_albarru': 99, 'teknik': 114 },
    'lab_teknik': { 'teknik': 41, 'masjid_albarru': 98, 'gsg': 160 },
    'lab_tanah': { 'atm': 210, 'pertanian': 95 },
    'gb2': { 'rektorat': 212, 'glt': 227, 'mushola': 49, 'perpus': 160, 'fisip': 137, 'kantin': 155 },
    'gb3': { 'mipa': 198, 'pkm': 92, 'gsg': 124, 'gb4': 25, 'gb5': 113 },
    'gb4': { 'pkm': 69, 'gsg': 132, 'gb3': 25, 'gb5': 108 },
    'gb5': { 'mipa': 192, 'gb3': 113, 'gb4': 108, 'fkip': 140 },
    'perpus': { 'gb2': 160, 'mushola': 174, 'pkm': 110, 'mipa': 87 },
    'gsg': { 'teknik': 121, 'lab_teknik': 160, 'gb3': 124, 'gb4': 132, 'fkip': 178 },
    'pkm': { 'perpus': 110, 'mipa': 122, 'gb4': 69, 'gb3': 92, 'kantin': 197 },
    'mushola': { 'glt': 188, 'gb2': 49, 'perpus': 174 },
    'masjid_albarru': { 'kantin': 111, 'lab_fkip': 99, 'teknik': 94, 'lab_teknik': 98, 'fisip': 156 },
    'kantin': { 'gb2': 155, 'pkm': 197, 'masjid_albarru': 111, 'lab_fkip': 43, 'fisip': 122 },
    'stadion': { 'fkip': 184, 'fku': 316 },
    'gor': { 'feb': 124, 'hukum': 72, 'basket': 143 },
    'basket': { 'feb': 258, 'hukum': 177, 'gor': 143 },
    'gerbang': { 'atm': 116, 'parkir_rektorat': 240, 'rektorat': 196 },
    'parkir_rektorat': { 'rektorat': 55, 'glt': 54, 'atm': 168, 'gerbang': 240 }
};

/**
 * Runs Dijkstra's shortest path algorithm
 * @param {string} startId - ID of start node
 * @param {string} endId - ID of destination node
 * @returns {object} - { path: array, distance: number, logs: array }
 */
function runDijkstra(startId, endId) {
    const distances = {};
    const predecessors = {};
    const visited = new Set();
    const queue = [];
    const stepsLog = [];

    // Ensure the nodes exist in the graph
    if (!DIJKSTRA_GRAPH[startId] || !DIJKSTRA_GRAPH[endId]) {
        return {
            found: false,
            path: [],
            distance: Infinity,
            logs: [`Kesalahan: Titik awal (${startId}) atau tujuan (${endId}) tidak terdaftar dalam graf.`]
        };
    }

    // Initialization
    for (const node in DIJKSTRA_GRAPH) {
        distances[node] = Infinity;
        predecessors[node] = null;
    }
    distances[startId] = 0;
    queue.push({ id: startId, dist: 0 });

    stepsLog.push(`[Mulai] Inisialisasi: Jarak ke ${nodes[startId]?.name || startId} = 0 m, lainnya = ∞ m.`);

    while (queue.length > 0) {
        // Sort queue to get node with minimum distance (simulates Priority Queue)
        queue.sort((a, b) => a.dist - b.dist);
        const current = queue.shift();
        const u = current.id;

        if (visited.has(u)) continue;
        visited.add(u);

        const currentName = nodes[u]?.name || u;
        stepsLog.push(`[Proses] Mengunjungi simpul <strong>${currentName}</strong> (Jarak terdekat saat ini: ${distances[u]} m).`);

        if (u === endId) {
            stepsLog.push(`[Tujuan Dicapai] Simpul tujuan <strong>${nodes[endId]?.name || endId}</strong> telah dicapai! Menghentikan algoritma.`);
            break;
        }

        const neighbors = DIJKSTRA_GRAPH[u] || {};
        for (const v in neighbors) {
            if (visited.has(v)) continue;

            const weight = neighbors[v];
            const alt = distances[u] + weight;
            const neighborName = nodes[v]?.name || v;

            stepsLog.push(`&nbsp;&nbsp;↳ Evaluasi jalur ke <strong>${neighborName}</strong> via ${currentName}. Jarak baru: ${distances[u]} + ${weight} = ${alt} m.`);

            if (alt < distances[v]) {
                const oldDistStr = distances[v] === Infinity ? "∞" : `${distances[v]} m`;
                stepsLog.push(`&nbsp;&nbsp;&nbsp;&nbsp;✔️ Relaksasi dilakukan! Jarak diperbarui dari ${oldDistStr} ke <strong>${alt} m</strong>.`);
                distances[v] = alt;
                predecessors[v] = u;
                queue.push({ id: v, dist: alt });
            } else {
                stepsLog.push(`&nbsp;&nbsp;&nbsp;&nbsp;❌ Tidak ada perubahan. Jarak tersimpan (${distances[v]} m) lebih pendek.`);
            }
        }
    }

    // Reconstruct path
    const path = [];
    let curr = endId;
    while (curr !== null) {
        path.unshift(curr);
        curr = predecessors[curr];
    }

    const found = path[0] === startId;
    
    if (found) {
        stepsLog.push(`[Selesai] Rute terpendek ditemukan: ${path.map(n => nodes[n]?.name || n).join(' ➜ ')} (Total Jarak: ${distances[endId]} m).`);
    } else {
        stepsLog.push(`[Gagal] Rute tidak dapat ditemukan.`);
    }

    return {
        found,
        path: found ? path : [],
        distance: found ? distances[endId] : Infinity,
        logs: stepsLog
    };
}
