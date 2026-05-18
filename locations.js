// Data Lokasi Kampus Universitas Bengkulu (UNIB)
// File ini dibuat khusus untuk mempermudah penambahan lokasi di masa depan.
// Cukup tambahkan baris baru dengan format yang sama tanpa perlu mengotak-atik algoritma utama.

const nodes = {
    // === GEDUNG REKTORAT & ADMINISTRASI ===
    'rektorat': { name: 'Gedung Rektorat', lat: -3.758937, lng: 102.272271, type: 'building', desc: 'Gedung pusat administrasi kampus. Melayani pendaftaran dan layanan pimpinan universitas.' },
    'glt': { name: 'Gedung Layanan Terpadu (GLT)', lat: -3.758140, lng: 102.271906, type: 'building', desc: 'Pusat layanan terpadu mahasiswa untuk administrasi akademik.' },
    'atm': { name: 'Pusat ATM UNIB', lat: -3.760139, lng: 102.271743, type: 'facility', desc: 'Area mesin ATM terpadu untuk berbagai bank.' },
    
    // === FAKULTAS & DEKANAT ===
    'fkip': { name: 'Dekanat FKIP', lat: -3.756179, lng: 102.277466, type: 'building', desc: 'Pusat pendidikan calon tenaga pendidik.' },
    'mipa': { name: 'Dekanat MIPA', lat: -3.756048, lng: 102.274832, type: 'building', desc: 'Gedung dekanat Fakultas Matematika dan Ilmu Pengetahuan Alam.' },
    'feb': { name: 'Dekanat FEB', lat: -3.761617, lng: 102.268423, type: 'building', desc: 'Gedung utama Fakultas Ekonomi dan Bisnis.' },
    'teknik': { name: 'Dekanat Teknik', lat: -3.758614, lng: 102.276663, type: 'building', desc: 'Pusat administrasi Fakultas Teknik.' },
    'hukum': { name: 'Fakultas Hukum', lat: -3.760695, lng: 102.268345, type: 'building', desc: 'Area perkuliahan dan administrasi Fakultas Hukum.' },
    'pertanian': { name: 'Dekanat Fakultas Pertanian', lat: -3.759575, lng: 102.269147, type: 'building', desc: 'Gedung pusat Fakultas Pertanian.' },
    'fku': { name: 'Fakultas Kedokteran (FKIK)', lat: -3.754867, lng: 102.277971, type: 'building', desc: 'Pusat pendidikan tenaga medis terpadu FKIK.' },
    'fisip': { name: 'Fakultas ISIP', lat: -3.759099, lng: 102.274552, type: 'building', desc: 'Pusat kajian ilmu sosial dan politik.' },

    // === LABORATORIUM & PERKULIAHAN BERSAMA ===
    'lab_fkip': { name: 'Lab Pembelajaran FKIP', lat: -3.758229, lng: 102.275711, type: 'building', desc: 'Fasilitas micro-teaching dan praktik mahasiswa FKIP.' },
    'lab_teknik': { name: 'Laboratorium Teknik', lat: -3.758945, lng: 102.276837, type: 'building', desc: 'Area bengkel kerja dan alat berat untuk mahasiswa teknik.' },
    'lab_tanah': { name: 'Laboratorium Tanah', lat: -3.759424, lng: 102.269998, type: 'building', desc: 'Fasilitas riset agronomi dan ilmu tanah.' },
    'gb2': { name: 'Gedung Bersama 2', lat: -3.758010, lng: 102.273957, type: 'building', desc: 'Fasilitas perkuliahan tambahan untuk MKDU.' },
    'gb3': { name: 'Gedung Bersama 3', lat: -3.756414, lng: 102.276591, type: 'building', desc: 'Gedung perkuliahan umum.' },
    'gb4': { name: 'Gedung Bersama 4', lat: -3.756377, lng: 102.276372, type: 'building', desc: 'Gedung kelas perkuliahan bersama.' },
    'gb5': { name: 'Gedung Bersama 5', lat: -3.755403, lng: 102.276439, type: 'building', desc: 'Area kelas teori untuk lintas prodi.' },

    // === FASILITAS UMUM & KEMAHASISWAAN ===
    'perpus': { name: 'UPT Perpustakaan', lat: -3.756839, lng: 102.274819, type: 'building', desc: 'Pusat layanan literatur mahasiswa.' },
    'gsg': { name: 'Gedung Serba Guna (GSG)', lat: -3.757527, lng: 102.276566, type: 'building', desc: 'Fasilitas aula besar universitas.' },
    'pkm': { name: 'Gedung PKM UNIB', lat: -3.756603, lng: 102.275783, type: 'building', desc: 'Pusat Kegiatan Mahasiswa (Sekretariat UKM).' },
    'mushola': { name: 'Mushollah Shelter', lat: -3.757786, lng: 102.273568, type: 'building', desc: 'Pusat kegiatan ibadah kecil di kampus.' },
    'masjid_albarru': { name: 'Masjid Al-Barru', lat: -3.759088, lng: 102.275961, type: 'building', desc: 'Masjid kegiatan besar di lingkungan kampus.' },
    'kantin': { name: 'Kantin Pusat / Warung', lat: -3.758318, lng: 102.275329, type: 'facility', desc: 'Area pujasera dan tempat makan mahasiswa.' },
    
    // === OLAHRAGA ===
    'stadion': { name: 'Stadion / Running Track', lat: -3.757715, lng: 102.278104, type: 'facility', desc: 'Stadion utama UNIB dengan lintasan lari.' },
    'gor': { name: 'GOR (Lapangan Indoor)', lat: -3.760771, lng: 102.267692, type: 'facility', desc: 'Gedung olahraga tertutup.' },
    'basket': { name: 'Lapangan Basket Outdoor', lat: -3.759581, lng: 102.267216, type: 'facility', desc: 'Fasilitas lapangan basket terbuka.' },
    
    // === AKSES & PARKIR ===
    'gerbang': { name: 'Gerbang Utama UNIB', lat: -3.760664, lng: 102.272662, type: 'facility', desc: 'Akses keluar/masuk Universitas Bengkulu.' },
    'parkir_rektorat': { name: 'Parkiran Rektorat', lat: -3.758629, lng: 102.271876, type: 'parking', desc: 'Area parkir luas di depan Rektorat.' }
};

// Anda dapat memisahkan logic tambahan jika perlu, namun file ini hanya menyimpan data object 'nodes' agar mudah dikelola.
