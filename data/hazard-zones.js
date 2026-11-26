/**
 * Basis Data Zona Kerentanan Tsunami Pesisir (InaRISK BNPB)
 * dan Tempat Evakuasi Sementara (TES) Indonesia
 */
window.TSUNAMI_HAZARD_DATA = {
  zones: [
    {
      id: 'z-sumbar',
      name: 'Pesisir Barat Sumatera & Mentawai',
      province: 'Sumatera Barat, Bengkulu, Sumatera Utara, Aceh',
      level: 'SANGAT TINGGI (ZONA MERAH)',
      levelCode: 'critical',
      threatSource: 'Megathrust Mentawai-Siberut & Sesar Subduksi Sumatera',
      potentialMaxWave: '10 - 15 Meter',
      goldenTimeMin: '20 - 30 Menit',
      description: 'Wilayah dengan akumulasi energi seismik tinggi (seismic gap) di Kepulauan Mentawai yang berpotensi memicu tsunami cepat menuju pesisir Padang, Pariaman, dan Pesisir Selatan.',
      coordinates: [
        [-0.95, 100.35],
        [-1.30, 98.90],
        [-2.10, 99.60],
        [-3.80, 102.25],
        [0.50, 97.80]
      ]
    },
    {
      id: 'z-selatsunda',
      name: 'Pesisir Selat Sunda & Banten',
      province: 'Banten & Lampung Selatan',
      level: 'SANGAT TINGGI (ZONA MERAH)',
      levelCode: 'critical',
      threatSource: 'Kolaps Flank Gunung Anak Krakatau & Megathrust Selat Sunda',
      potentialMaxWave: '8 - 20 Meter',
      goldenTimeMin: '15 - 25 Menit',
      description: 'Jalur wisata pesisir Anyer, Carita, Tanjung Lesung, dan Kalianda memiliki waktu tiba gelombang sangat cepat bila dipicu longsoran bawah laut vulkanik Anak Krakatau.',
      coordinates: [
        [-6.10, 105.42],
        [-6.35, 105.82],
        [-6.70, 105.65],
        [-5.80, 105.75],
        [-5.60, 105.50]
      ]
    },
    {
      id: 'z-selatanjawa',
      name: 'Pesisir Selatan Jawa',
      province: 'Jawa Barat, Jawa Tengah, DI Yogyakarta, Jawa Timur',
      level: 'SANGAT TINGGI (ZONA MERAH)',
      levelCode: 'critical',
      threatSource: 'Zona Subduksi Megathrust Jawa Selatan',
      potentialMaxWave: '12 - 20 Meter',
      goldenTimeMin: '20 - 35 Menit',
      description: 'Garis pantai terbuka menghadap Samudra Hindia dari Pelabuhan Ratu, Pangandaran, Cilacap, Pantai Glagah/YIA, Pacitan, hingga Banyuwangi.',
      coordinates: [
        [-7.00, 106.55],
        [-7.70, 108.65],
        [-7.75, 109.00],
        [-7.90, 110.15],
        [-8.25, 111.10],
        [-8.55, 113.80],
        [-8.60, 114.40]
      ]
    },
    {
      id: 'z-palu',
      name: 'Teluk Palu & Selat Makassar',
      province: 'Sulawesi Tengah & Sulawesi Barat',
      level: 'SANGAT TINGGI (ZONA MERAH)',
      levelCode: 'critical',
      threatSource: 'Patahan Sesar Palu-Koro & Longsoran Tebing Bawah Laut',
      potentialMaxWave: '6 - 11 Meter',
      goldenTimeMin: '3 - 8 Menit (Ultra Cepat)',
      description: 'Karakteristik teluk sempit dan dalam memicu resonansi gelombang ekstrem serta waktu tiba tsunami dalam hitungan menit pasca gempa.',
      coordinates: [
        [-0.85, 119.85],
        [-0.75, 119.75],
        [-0.50, 119.70],
        [-1.00, 119.90]
      ]
    },
    {
      id: 'z-balinusra',
      name: 'Bali & Busur Belakang Nusa Tenggara',
      province: 'Bali, Nusa Tenggara Barat, Nusa Tenggara Timur',
      level: 'TINGGI (ZONA ORANYE)',
      levelCode: 'high',
      threatSource: 'Flores Back-Arc Thrust & Sesar Naik Busur Belakang',
      potentialMaxWave: '5 - 10 Meter',
      goldenTimeMin: '15 - 25 Menit',
      description: 'Pesisir utara Lombok, Sumbawa, Flores (Maumere), dan pesisir selatan Bali rentan terhadap patahan naik dasar laut aktif.',
      coordinates: [
        [-8.70, 115.15],
        [-8.35, 116.10],
        [-8.45, 117.40],
        [-8.60, 122.20],
        [-8.50, 125.50]
      ]
    },
    {
      id: 'z-malukubanda',
      name: 'Kepulauan Maluku & Laut Banda',
      province: 'Maluku & Maluku Utara',
      level: 'SANGAT TINGGI (ZONA MERAH)',
      levelCode: 'critical',
      threatSource: 'Palung Laut Banda Dalam & Patahan Laut Maluku',
      potentialMaxWave: '5 - 12 Meter',
      goldenTimeMin: '15 - 30 Menit',
      description: 'Struktur palung laut sedalam lebih dari 7.000 meter di Laut Banda menjadikannya salah satu kawasan seismik dan tsunami paling kompleks di dunia.',
      coordinates: [
        [-3.70, 128.18],
        [-4.50, 129.90],
        [-1.50, 127.50],
        [1.00, 127.30]
      ]
    }
  ],
  shelters: [
    {
      id: 'tes-padang-1',
      name: 'TES Ulak Karang (Gedung Evakuasi Tsunami)',
      city: 'Kota Padang',
      province: 'Sumatera Barat',
      capacity: '3.000 Jiwa',
      elevation: '18 mdpl (4 Lantai Konstruksi Tahan Gempa M 9.0)',
      address: 'Jl. Bahari No. 12, Ulak Karang Utara, Padang Utara',
      lat: -0.9135,
      lng: 100.3542,
      facilities: ['Helipad Darurat', 'Genset Cadangan', 'Tandon Air Bersih 10.000L', 'Ruang Medis Darurat'],
      distanceToCoast: '350 meter'
    },
    {
      id: 'tes-padang-2',
      name: 'TES Pasie Nan Tigo',
      city: 'Kota Padang',
      province: 'Sumatera Barat',
      capacity: '2.500 Jiwa',
      elevation: '16 mdpl (3 Lantai Roof Terbuka)',
      address: 'Pasie Nan Tigo, Koto Tangah, Kota Padang',
      lat: -0.8415,
      lng: 100.3168,
      facilities: ['Lampu Solar Cell', 'Sirine Peringatan Mandiri', 'Ramp Difabel'],
      distanceToCoast: '200 meter'
    },
    {
      id: 'tes-aceh-1',
      name: 'Gedung Evakuasi Lambung (Escape Building)',
      city: 'Banda Aceh',
      province: 'Aceh',
      capacity: '1.500 Jiwa',
      elevation: '20 mdpl (Konstruksi Beton Bertulang JICA)',
      address: 'Gampong Lambung, Kec. Meuraxa, Banda Aceh',
      lat: 5.5482,
      lng: 95.2915,
      facilities: ['Radio Komunikasi VHF', 'Ruang Logistik', 'Akses Tangga Ganda'],
      distanceToCoast: '500 meter'
    },
    {
      id: 'tes-meulaboh',
      name: 'TES Ujong Kalak Meulaboh',
      city: 'Aceh Barat',
      province: 'Aceh',
      capacity: '2.000 Jiwa',
      elevation: '22 mdpl',
      address: 'Jl. Iskandar Muda, Ujong Kalak, Johan Pahlawan',
      lat: 4.1352,
      lng: 96.1245,
      facilities: ['Posko BPBD', 'Dapur Umum Lapangan', 'Toren Air Bersih'],
      distanceToCoast: '250 meter'
    },
    {
      id: 'tes-pangandaran',
      name: 'Gedung Evakuasi Sementara Pangandaran',
      city: 'Kab. Pangandaran',
      province: 'Jawa Barat',
      capacity: '3.000 Jiwa',
      elevation: '21 mdpl (Konstruksi Anti Kolaps BNPB)',
      address: 'Kawasan Wisata Pantai Barat, Pangandaran',
      lat: -7.7012,
      lng: 108.6534,
      facilities: ['Pengeras Suara Peringatan Evakuasi', 'Solar Panel 5000W', 'Ruang Ibu & Balita'],
      distanceToCoast: '400 meter'
    },
    {
      id: 'tes-cilacap',
      name: 'TES Teluk Penyu Cilacap',
      city: 'Kab. Cilacap',
      province: 'Jawa Tengah',
      capacity: '2.000 Jiwa',
      elevation: '19 mdpl',
      address: 'Jl. Benteng Pendem, Cilacap Selatan',
      lat: -7.7421,
      lng: 109.0215,
      facilities: ['Sirine InaTEWS', 'P3K Darurat', 'Tangga Evakuasi Cepat'],
      distanceToCoast: '300 meter'
    },
    {
      id: 'tes-pacitan',
      name: 'Shelter Evakuasi Pantai Teleng Ria',
      city: 'Kab. Pacitan',
      province: 'Jawa Timur',
      capacity: '1.800 Jiwa',
      elevation: '24 mdpl (Perbukitan Aman Karst)',
      address: 'Sidoharjo, Kec. Pacitan, Kabupaten Pacitan',
      lat: -8.2185,
      lng: 111.0852,
      facilities: ['Jalur Penerangan Darurat', 'Pos Pantau SAR', 'Koneksi Satelit'],
      distanceToCoast: '600 meter'
    },
    {
      id: 'tes-pelabuhanratu',
      name: 'TES Citepus Pelabuhan Ratu',
      city: 'Kab. Sukabumi',
      province: 'Jawa Barat',
      capacity: '2.200 Jiwa',
      elevation: '20 mdpl',
      address: 'Jl. Raya Cisolok - Pelabuhan Ratu, Citepus',
      lat: -6.9745,
      lng: 106.5368,
      facilities: ['Sirine Tsunami BPBD Jabar', 'Lantai Terbuka Kapasitas Besar', 'Akses Jalan Evakuasi Lebar'],
      distanceToCoast: '300 meter'
    },
    {
      id: 'tes-mandalika',
      name: 'Bukit Evakuasi Alami Mandalika',
      city: 'Kab. Lombok Tengah',
      province: 'Nusa Tenggara Barat',
      capacity: '5.000 Jiwa',
      elevation: '38 mdpl (Zona Bukit Hijau Alami)',
      address: 'Kawasan Ekonomi Khusus Mandalika, Kuta',
      lat: -8.8955,
      lng: 116.2912,
      facilities: ['Rambu Jalur Evakuasi Standar Internasional', 'Titik Kumpul Lapangan Luas'],
      distanceToCoast: '500 meter'
    },
    {
      id: 'tes-palu',
      name: 'TES Duyu Shelter Kota Palu',
      city: 'Kota Palu',
      province: 'Sulawesi Tengah',
      capacity: '4.000 Jiwa',
      elevation: '48 mdpl (Zona Aman Bebas Likuifaksi)',
      address: 'Kelurahan Duyu, Tatanga, Kota Palu',
      lat: -0.9125,
      lng: 119.8452,
      facilities: ['Pusat Logistik PMI & BPBD', 'Tandon Air Bersih', 'Jalur Evakuasi Bebas Patahan'],
      distanceToCoast: '2.100 meter'
    }
  ],
  scenarios: [
    {
      id: 'sc-selatsunda',
      title: 'Skenario Megathrust Selat Sunda',
      magnitude: 'M 8.7',
      focalDepth: '15 km',
      location: 'Selat Sunda (Antara Jawa Barat & Lampung)',
      waveHeightMax: '12 - 20 Meter',
      etaCoast: '20 - 25 Menit',
      affectedAreas: ['Pesisir Pandeglang', 'Anyer & Carita', 'Cilegon', 'Kalianda & Bakauheni', 'Pesisir Lebak'],
      summary: 'Pemodelan skenario patahan geser naik di Selat Sunda. Dalam 20 menit, gelombang tsunami berketinggian hingga 15 meter berpotensi menerjang kawasan industri dan pariwisata pesisir Banten dan Lampung Selatan.',
      propagationSteps: [
        { time: '0 Menit', desc: 'Gempa bumi dahsyat M 8.7 mengguncang kuat selama lebih dari 60 detik.' },
        { time: '3 Menit', desc: 'Sistem BMKG InaTEWS mengeluarkan Peringatan Dini Tsunami status AWAS (> 3 meter).' },
        { time: '7 Menit', desc: 'Sirine tsunami di pantai Pandeglang dan Kalianda membunyikan peringatan evakuasi.' },
        { time: '12 Menit', desc: 'Air laut di bibir pantai Anyer dan Carita surut secara masif sejauh ratusan meter.' },
        { time: '22 Menit', desc: 'Gelombang tsunami pertama tiba menerjang daratan dengan kecepatan ~50 km/jam.' }
      ]
    },
    {
      id: 'sc-mentawai',
      title: 'Skenario Megathrust Mentawai - Siberut',
      magnitude: 'M 8.9',
      focalDepth: '20 km',
      location: 'Kepulauan Mentawai, Sumatera Barat',
      waveHeightMax: '10 - 15 Meter',
      etaCoast: '25 - 30 Menit',
      affectedAreas: ['Kota Padang', 'Pariaman', 'Pesisir Selatan', 'Kepulauan Mentawai', 'Bengkulu Utara'],
      summary: 'Skenario pelepasan energi terkunci (seismic gap) Mentawai. Gelombang pertama mencapai Pulau Siberut dalam 10 menit dan tiba di daratan Kota Padang dalam 25–30 menit dengan penetrasi daratan hingga 1,5 km.',
      propagationSteps: [
        { time: '0 Menit', desc: 'Gempa megathrust bawah laut M 8.9 dirasakan dengan intensitas VII-VIII MMI di Padang.' },
        { time: '4 Menit', desc: 'Diseminasi SMS darurat dan peringatan dini BMKG status AWAS terpancar serentak.' },
        { time: '10 Menit', desc: 'Gelombang awal menerjang pesisir barat Pulau Mentawai.' },
        { time: '20 Menit', desc: 'Batas akhir Golden Time: warga pesisir Padang harus sudah mencapai TES atau lantai 3 bangunan kokoh.' },
        { time: '28 Menit', desc: 'Gelombang tsunami utama menghantam Pantai Padang dan Teluk Bayur.' }
      ]
    },
    {
      id: 'sc-selatanjawa',
      title: 'Skenario Megathrust Selatan Jawa',
      magnitude: 'M 8.8',
      focalDepth: '20 km',
      location: 'Palung Jawa Selatan',
      waveHeightMax: '15 - 20 Meter',
      etaCoast: '25 - 35 Menit',
      affectedAreas: ['Pelabuhan Ratu', 'Pangandaran', 'Cilacap', 'Kulon Progo (YIA)', 'Pacitan', 'Banyuwangi'],
      summary: 'Simulasi tumbukan lempeng Indo-Australia dan Eurasia di pesisir selatan Jawa. Berpotensi melanda kawasan bandara YIA, pelabuhan Cilacap, dan permukiman nelayan teluk sempit seperti Pacitan.',
      propagationSteps: [
        { time: '0 Menit', desc: 'Guncangan gempa bumi dahsyat dirasakan di seluruh provinsi Jawa bagian selatan.' },
        { time: '5 Menit', desc: 'Sirine EWS tsunami diaktifkan oleh BPBD Cilacap, Pangandaran, dan Pacitan.' },
        { time: '15 Menit', desc: 'Penarikan air laut di muara sungai dan pantai selatan.' },
        { time: '25 Menit', desc: 'Limpasan gelombang tsunami setinggi 12-18 meter mencapai pantai landai Pangandaran dan Cilacap.' }
      ]
    }
  ]
};
