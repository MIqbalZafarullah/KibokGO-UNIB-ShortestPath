const nodes = {

    'rektorat':         { name: 'Gedung Rektorat', lat: -3.758937, lng: 102.272271, type: 'building', desc: 'Gedung pusat administrasi kampus. Melayani pendaftaran dan layanan pimpinan universitas.' },
    'glt':             { name: 'Gedung Layanan Terpadu (GLT)', lat: -3.758140, lng: 102.271906, type: 'building', desc: 'Pusat layanan terpadu mahasiswa untuk administrasi akademik.' },
    'atm':             { name: 'Pusat ATM UNIB', lat: -3.760139, lng: 102.271743, type: 'facility', desc: 'Area mesin ATM terpadu untuk berbagai bank.' },

    'fkip':            { name: 'Dekanat FKIP', lat: -3.756179, lng: 102.277466, type: 'building', desc: 'Pusat pendidikan calon tenaga pendidik.' },
    'mipa':            { name: 'Dekanat MIPA', lat: -3.756048, lng: 102.274832, type: 'building', desc: 'Gedung dekanat Fakultas Matematika dan Ilmu Pengetahuan Alam.' },
    'feb':             { name: 'Dekanat FEB', lat: -3.761617, lng: 102.268423, type: 'building', desc: 'Gedung utama Fakultas Ekonomi dan Bisnis.' },
    'teknik':          { name: 'Dekanat Teknik', lat: -3.758614, lng: 102.276663, type: 'building', desc: 'Pusat administrasi Fakultas Teknik.' },
    'hukum':           { name: 'Fakultas Hukum', lat: -3.760695, lng: 102.268345, type: 'building', desc: 'Area perkuliahan dan administrasi Fakultas Hukum.' },
    'pertanian':       { name: 'Dekanat Fakultas Pertanian', lat: -3.759575, lng: 102.269147, type: 'building', desc: 'Gedung pusat Fakultas Pertanian.' },
    'fku':             { name: 'Fakultas Kedokteran (FKIK)', lat: -3.754867, lng: 102.277971, type: 'building', desc: 'Pusat pendidikan tenaga medis terpadu FKIK.' },
    'fisip':           { name: 'Fakultas ISIP', lat: -3.759099, lng: 102.274552, type: 'building', desc: 'Pusat kajian ilmu sosial dan politik.' },

    'lab_fkip':        { name: 'Lab Pembelajaran FKIP', lat: -3.758229, lng: 102.275711, type: 'building', desc: 'Fasilitas micro-teaching dan praktik mahasiswa FKIP.' },
    'lab_teknik':      { name: 'Laboratorium Teknik', lat: -3.758945, lng: 102.276837, type: 'building', desc: 'Area bengkel kerja dan alat berat untuk mahasiswa teknik.' },
    'lab_tanah':       { name: 'Laboratorium Tanah', lat: -3.759424, lng: 102.269998, type: 'building', desc: 'Fasilitas riset agronomi dan ilmu tanah.' },
    'gb2':             { name: 'Gedung Bersama 2', lat: -3.758010, lng: 102.273957, type: 'building', desc: 'Fasilitas perkuliahan tambahan untuk MKDU.' },
    'gb3':             { name: 'Gedung Bersama 3', lat: -3.756414, lng: 102.276591, type: 'building', desc: 'Gedung perkuliahan umum.' },
    'gb4':             { name: 'Gedung Bersama 4', lat: -3.756377, lng: 102.276372, type: 'building', desc: 'Gedung kelas perkuliahan bersama.' },
    'gb5':             { name: 'Gedung Bersama 5', lat: -3.755403, lng: 102.276439, type: 'building', desc: 'Area kelas teori untuk lintas prodi.' },

    'perpus':          { name: 'UPT Perpustakaan', lat: -3.756839, lng: 102.274819, type: 'building', desc: 'Pusat layanan literatur mahasiswa.' },
    'gsg':             { name: 'Gedung Serba Guna (GSG)', lat: -3.757527, lng: 102.276566, type: 'building', desc: 'Fasilitas aula besar universitas.' },
    'pkm':             { name: 'Gedung PKM UNIB', lat: -3.756603, lng: 102.275783, type: 'building', desc: 'Pusat Kegiatan Mahasiswa (Sekretariat UKM).' },
    'mushola':         { name: 'Mushollah Shelter', lat: -3.757786, lng: 102.273568, type: 'building', desc: 'Pusat kegiatan ibadah kecil di kampus.' },
    'masjid_albarru':  { name: 'Masjid Al-Barru', lat: -3.759088, lng: 102.275961, type: 'building', desc: 'Masjid kegiatan besar di lingkungan kampus.' },
    'kantin':          { name: 'Kantin Pusat / Warung', lat: -3.758318, lng: 102.275329, type: 'facility', desc: 'Area pujasera dan tempat makan mahasiswa.' },

    'stadion':         { name: 'Stadion / Running Track', lat: -3.757715, lng: 102.278104, type: 'facility', desc: 'Stadion utama UNIB dengan lintasan lari.' },
    'gor':             { name: 'GOR (Lapangan Indoor)', lat: -3.760771, lng: 102.267692, type: 'facility', desc: 'Gedung olahraga tertutup.' },
    'basket':          { name: 'Lapangan Basket Outdoor', lat: -3.759581, lng: 102.267216, type: 'facility', desc: 'Fasilitas lapangan basket terbuka.' },

    'gerbang':         { name: 'Gerbang Utama UNIB', lat: -3.760664, lng: 102.272662, type: 'facility', desc: 'Akses keluar/masuk Universitas Bengkulu.' },
    'parkir_rektorat': { name: 'Parkiran Rektorat', lat: -3.758629, lng: 102.271876, type: 'parking', desc: 'Area parkir luas di depan Rektorat.' },
};

function setupAutocomplete(inputId, dropdownId, hiddenId) {
    const input    = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const hidden   = document.getElementById(hiddenId);
    const clearBtn = document.getElementById(inputId.replace('Search', 'Clear'));

    function handleSelection(item) {
        input.value  = item.name;
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
            div.className = 'px-4 py-3 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700/50 transition flex items-center gap-3';
            div.innerHTML = `<span class="text-slate-400 text-sm">🕒</span><div><div class="font-bold text-slate-200 text-xs">${item.name}</div></div>`;
        } else {
            div.className = 'px-4 py-3 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700/50 transition';
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
                histLabel.className = 'px-3 py-1.5 bg-slate-700/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider';
                histLabel.textContent = 'Riwayat Terakhir';
                dropdown.appendChild(histLabel);
                history.forEach(item => dropdown.appendChild(createItem(item, true)));

                const allLabel = document.createElement('div');
                allLabel.className = 'px-3 py-1.5 bg-slate-700/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider';
                allLabel.textContent = 'Semua Lokasi';
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
            input.value  = '';
            hidden.value = '';
            clearBtn.classList.add('hidden');
            renderDropdown('');
            input.focus();
        });
    }
}