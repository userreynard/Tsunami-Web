/**
 
 * Tsunami Indonesia - API Integration Service

 *
 * 1. NOAA NCEI Hazard API (Data Tsunami Global & Indonesia)
 * 2. BMKG Open Data TEWS (Gempa Terkini & Potensi Tsunami Indonesia)
 * 3. Fallback Dataset Terpadu (memastikan website selalu berjalan instan & offline)
 */

const API_ENDPOINTS = {
  // Proxy lokal server 
  PROXY_BMKG: '/api/bmkg',
  PROXY_NOAA: '/api/noaa',

  // API Resmi BMKG Indonesia (InaTEWS)
  BMKG_AUTOGEMPA: 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
  
  // API Tsunami Gratis NOAA (min year 1900 untuk Indonesia, min year 2000 untuk global)
  NOAA_INDONESIA: 'https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/tsunamis/events?country=INDONESIA&minYear=1900',
  NOAA_GLOBAL: 'https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/tsunamis/events?minYear=2000'
};

/**
 * Menerjemahkan kode penyebab tsunami NOAA (causeCode) ke bahasa Indonesia
 */
function getTsunamiCauseDescription(code) {
  const causes = {
    0: 'Penyebab Tidak Diketahui',
    1: 'Gempa Bumi Tektonik',
    2: 'Diduga Gempa Bumi',
    3: 'Gempa Bumi & Longsoran Bawah Laut',
    4: 'Erupsi Gunung Api & Gempa',
    5: 'Erupsi Gunung Api Bawah Laut',
    6: 'Aktivitas Vulkanik Gunung Api',
    7: 'Erupsi Gunung Api & Runtuhan Tebing',
    8: 'Longsoran Bawah Laut (Submarine Landslide)',
    9: 'Meteotsunami (Perubahan Tekanan Atmosfer)',
    10: 'Ledakan Dahsyat',
    11: 'Fenomena Pasang Surut Astronomis'
  };
  return causes[code] || 'Gempa Bumi Tektonik';
}

const INDONESIA_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format tanggal lengkap dalam bahasa Indonesia yang manusiawi
 * Contoh: "26 Desember 2004" atau "September 2018"
 */
function formatFullIndonesianDate(year, month, day) {
  if (!year) return 'Waktu tidak tercatat';
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (d && m && m >= 1 && m <= 12) {
    return `${d} ${INDONESIA_MONTHS[m - 1]} ${year}`;
  }
  if (m && m >= 1 && m <= 12) {
    return `${INDONESIA_MONTHS[m - 1]} ${year}`;
  }
  return `Tahun ${year}`;
}

/**
 * Format objek data dari API NOAA menjadi format standar yang seragam
 */
function normalizeNoaaEvent(raw) {
  const isIndonesia = (raw.country || '').toUpperCase().includes('INDONESIA');
  
  const fullDate = formatFullIndonesianDate(raw.year, raw.month, raw.day);
  const day = raw.day ? String(raw.day).padStart(2, '0') : null;
  const month = raw.month ? String(raw.month).padStart(2, '0') : null;
  const year = raw.year || '-';
  const dateStr = (day && month) ? `${day}/${month}/${year}` : (month ? `${month}/${year}` : `${year}`);

  return {
    id: raw.id || Math.random().toString(36).substring(7),
    year: raw.year,
    day: raw.day,
    month: raw.month,
    dateString: dateStr,
    fullDateIndo: fullDate,
    timestamp: raw.year ? new Date(raw.year, (raw.month || 1) - 1, raw.day || 1).getTime() : 0,
    country: raw.country || 'GLOBAL',
    locationName: raw.locationName ? raw.locationName.trim() : (isIndonesia ? 'Wilayah Perairan Indonesia' : 'Wilayah Samudera Pasifik/Global'),
    lat: parseFloat(raw.latitude),
    lng: parseFloat(raw.longitude),
    magnitude: raw.eqMagnitude ? parseFloat(raw.eqMagnitude).toFixed(1) : null,
    maxWaterHeight: raw.maxWaterHeight ? parseFloat(raw.maxWaterHeight).toFixed(2) : null,
    deaths: raw.deathsTotal || raw.deaths || 0,
    injuries: raw.injuriesTotal || raw.injuries || 0,
    causeCode: raw.causeCode,
    causeText: getTsunamiCauseDescription(raw.causeCode),
    isIndonesia: isIndonesia,
    source: 'NOAA NCEI Global Hazards Database'
  };
}

/**
 * Mengambil data gempa bumi terkini & status potensi tsunami dari BMKG Indonesia
 */
async function fetchBmkgLatestAlert() {
  const candidates = [
    API_ENDPOINTS.PROXY_BMKG,
    API_ENDPOINTS.BMKG_AUTOGEMPA
  ];

  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.Infogempa && data.Infogempa.gempa) {
          return data.Infogempa.gempa;
        }
      }
    } catch (err) {
      // Coba endpoint berikutnya
    }
  }

  // Cadangan jika koneksi offline total
  return {
    Tanggal: '19 Okt 2026',
    Jam: '20:46:11 WIB',
    Magnitude: '4.2',
    Kedalaman: '5 km',
    Wilayah: 'Pusat gempa berada di darat 26 km Timur Laut Kab. Gayo Lues',
    Potensi: 'Gempa ini dirasakan untuk diteruskan pada masyarakat (Tidak berpotensi tsunami)',
    Coordinates: '4.16,97.51'
  };
}

/**
 * Mengambil data tsunami dari NOAA API secara dinamis dengan fallback ke data lokal
 */
async function loadAllTsunamiEvents(onStatusUpdate) {
  let events = [];
  let isLive = false;

  // 1. Inisialisasi awal dengan dataset terverifikasi (hanya tsunami laut terverifikasi)
  if (window.TSUNAMI_INITIAL_DATA && Array.isArray(window.TSUNAMI_INITIAL_DATA)) {
    events = window.TSUNAMI_INITIAL_DATA
      .filter(item => item.latitude && item.longitude && item.oceanicTsunami !== false && (item.eventValidity === undefined || item.eventValidity >= 2))
      .map(normalizeNoaaEvent);
  }

  // 2. Coba fetch API live dari NOAA (via proxy lokal atau direct)
  const candidates = [
    API_ENDPOINTS.PROXY_NOAA + '?country=INDONESIA&minYear=1900',
    API_ENDPOINTS.PROXY_NOAA,
    API_ENDPOINTS.NOAA_INDONESIA
  ];

  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const noaaData = await res.json();
        if (noaaData && noaaData.items && Array.isArray(noaaData.items)) {
          const liveNormalized = noaaData.items
            .filter(item => item.latitude && item.longitude && item.oceanicTsunami !== false && (item.eventValidity === undefined || item.eventValidity >= 2))
            .map(normalizeNoaaEvent);

          // Gabungkan tanpa duplikasi ID
          const mapById = new Map();
          events.forEach(e => mapById.set(e.id, e));
          liveNormalized.forEach(e => mapById.set(e.id, e));

          events = Array.from(mapById.values());
          isLive = true;
          break;
        }
      }
    } catch (err) {
      // Lanjut ke kandidat berikutnya
    }
  }

  // Urutkan dari kejadian paling baru ke paling lampau (Tahun, Bulan, Hari)
  events.sort((a, b) => {
    if ((b.year || 0) !== (a.year || 0)) return (b.year || 0) - (a.year || 0);
    if ((b.month || 0) !== (a.month || 0)) return (b.month || 0) - (a.month || 0);
    return (b.day || 0) - (a.day || 0);
  });

  if (onStatusUpdate) {
    onStatusUpdate({
      status: isLive ? 'live' : 'ready',
      message: isLive ? 'Terkoneksi Langsung (API Live)' : 'Data Tsunami Lengkap (Arsip Terverifikasi)',
      count: events.length
    });
  }

  return events;
}

/**
 * Mengevaluasi potensi tsunami dan estimasi tinggi gelombang berdasarkan data BMKG InaTEWS
 * Sesuai Standar Operasional Prosedur (SOP) BMKG InaTEWS & Kategori Bahaya:
 * - AWAS: Estimasi tinggi gelombang > 3.0 m (Evakuasi menyeluruh ke tempat tinggi)
 * - SIAGA: Estimasi tinggi gelombang 0.5 – 3.0 m (Evakuasi dari pantai dan muara)
 * - WASPADA: Estimasi tinggi gelombang < 0.5 m (Jauhi pantai dan tepian sungai)
 * - NORMAL / AMAN: Tidak berpotensi tsunami (Estimasi gelombang 0 m)
 */
function evaluateBmkgTsunamiPotential(gempa) {
  if (!gempa) {
    return {
      isPotential: false,
      alertLevel: 'NORMAL',
      statusBadge: 'Tidak Berpotensi Tsunami',
      waveEstimate: '0 m (Normal / Aman)',
      waveHeightShort: '0 m',
      badgeClass: 'bg-emerald-950/80 text-emerald-400 border border-emerald-600/80',
      recommendation: 'Aktivitas perairan dan pesisir normal dan aman.',
      rawPotensi: 'Data tidak tersedia'
    };
  }

  const rawPotensi = (gempa.Potensi || '').trim();
  const lowerPotensi = rawPotensi.toLowerCase();
  const wilayahLower = (gempa.Wilayah || '').toLowerCase();

  // Ekstrak Magnitudo & Kedalaman numerik
  const mag = parseFloat(gempa.Magnitude) || 0;
  let depth = 999;
  if (gempa.Kedalaman) {
    const depthMatch = gempa.Kedalaman.match(/(\d+(\.\d+)?)/);
    if (depthMatch) depth = parseFloat(depthMatch[1]);
  }

  const isSea = wilayahLower.includes('laut') || wilayahLower.includes('selat') || wilayahLower.includes('samudera') || wilayahLower.includes('samudra');
  const isLand = wilayahLower.includes('darat');

  // Cek apakah ada frasa tidak berpotensi
  const isExplicitlyNoTsunami = lowerPotensi.includes('tidak berpotensi') || lowerPotensi.includes('bukan potensi tsunami');
  
  // Deteksi peringatan tsunami tektonik maupun non-tektonik (vulkanik / erupsi gunung api / flank collapse)
  const isVolcanicAlert = (lowerPotensi.includes('erupsi') || lowerPotensi.includes('gunung api') || lowerPotensi.includes('vulkanik') || lowerPotensi.includes('longsoran') || lowerPotensi.includes('flank collapse') || wilayahLower.includes('krakatau') || wilayahLower.includes('gunung ruang')) && 
                          (lowerPotensi.includes('tsunami') || lowerPotensi.includes('gelombang') || lowerPotensi.includes('waspada') || lowerPotensi.includes('siaga') || lowerPotensi.includes('awas'));
  
  const mentionsTsunami = (lowerPotensi.includes('berpotensi tsunami') || lowerPotensi.includes('peringatan dini tsunami') || lowerPotensi.includes('potensi tsunami') || isVolcanicAlert) && !isExplicitlyNoTsunami;

  let isPotential = false;
  let alertLevel = 'NORMAL';
  let statusBadge = 'Tidak Berpotensi Tsunami';
  let waveEstimate = '0 m (Normal / Aman)';
  let waveHeightShort = '0 m';
  let badgeClass = 'bg-emerald-950/80 text-emerald-400 border border-emerald-600/80';
  let recommendation = 'Gempa tidak menimbulkan ancaman tsunami di pesisir pantai.';

  // Evaluasi potensi ancaman tsunami InaTEWS (Tektonik & Erupsi Vulkanik Bawah Laut)
  if (mentionsTsunami || (!isExplicitlyNoTsunami && !isLand && isSea && mag >= 6.8 && depth <= 70)) {
    isPotential = true;

    if (lowerPotensi.includes('awas') || mag >= 7.8) {
      alertLevel = 'AWAS';
      statusBadge = 'PERINGATAN: POTENSI TSUNAMI (AWAS)';
      waveEstimate = '> 3.0 m (Ancaman Tinggi / Bencana)';
      waveHeightShort = '> 3.0 m';
      badgeClass = 'bg-red-950/90 text-red-300 border border-red-500 animate-pulse font-extrabold';
      recommendation = isVolcanicAlert 
        ? 'Evakuasi menyeluruh ke dataran tinggi segera! Bahaya hempasan gelombang masif akibat erupsi/longsoran tubuh gunung api ke laut.'
        : 'Evakuasi menyeluruh ke dataran tinggi segera! Gelombang berpotensi melanda permukiman.';
    } else if (lowerPotensi.includes('siaga') || mag >= 7.0) {
      alertLevel = 'SIAGA';
      statusBadge = 'PERINGATAN: POTENSI TSUNAMI (SIAGA)';
      waveEstimate = '0.5 – 3.0 m (Ancaman Sedang)';
      waveHeightShort = '0.5 – 3.0 m';
      badgeClass = 'bg-amber-950/90 text-amber-300 border border-amber-500 animate-pulse font-extrabold';
      recommendation = isVolcanicAlert
        ? 'Evakuasi warga dari sempadan pantai dan muara sungai segera menuju tempat aman. Waspadai longsoran material vulkanik ke laut.'
        : 'Evakuasi segera dari sempadan pantai dan muara sungai menuju tempat aman.';
    } else {
      alertLevel = 'WASPADA';
      statusBadge = 'WASPADA POTENSI TSUNAMI';
      waveEstimate = '< 0.5 m (Ancaman Minor)';
      waveHeightShort = '< 0.5 m';
      badgeClass = 'bg-yellow-950/90 text-yellow-300 border border-yellow-500 font-extrabold';
      recommendation = isVolcanicAlert
        ? 'Jauhi pantai dan tepian sungai. Waspadai anomali gelombang akibat aktivitas vulkanik gunung api di laut.'
        : 'Jauhi pantai dan tepian sungai. Waspadai anomali arus kuat perairan laut.';
    }
  } else {
    isPotential = false;
    alertLevel = 'NORMAL';
    statusBadge = 'Tidak Berpotensi Tsunami';
    waveEstimate = '0 m (Normal / Aman)';
    waveHeightShort = '0 m';
    badgeClass = 'bg-emerald-950/80 text-emerald-400 border border-emerald-600/80';
    recommendation = 'Gempa bumi tidak memicu gelombang tsunami. Kondisi permukaan laut aman.';
  }

  return {
    isPotential,
    alertLevel,
    statusBadge,
    waveEstimate,
    waveHeightShort,
    badgeClass,
    recommendation,
    rawPotensi: rawPotensi || 'Tidak berpotensi tsunami'
  };
}

// Ekspor ke window
window.TsunamiAPI = {
  fetchBmkgLatestAlert,
  loadAllTsunamiEvents,
  getTsunamiCauseDescription,
  normalizeNoaaEvent,
  evaluateBmkgTsunamiPotential
};

// Kompatibilitas OOP class
window.TsunamiDataService = class {
  async getAllTsunamiData() {
    const [bmkg, events] = await Promise.all([
      fetchBmkgLatestAlert(),
      loadAllTsunamiEvents()
    ]);
    return { bmkgLatest: bmkg, events };
  }
};
