/**

 * Tsunami Indonesia - Main Application Logic (Multi-Page Ready)
=
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Inisialisasi Peta (jika elemen #map ada di halaman)
  const mapElement = document.getElementById('map');
  let mapController = null;
  if (mapElement && typeof TsunamiMapController !== 'undefined') {
    mapController = new TsunamiMapController('map');
    window.tsunamiMap = mapController;
    mapController.initMap();
  }

  // 2. State Aplikasi
  const state = {
    events: [],
    filteredEvents: [],
    bmkgAlert: null,
    activeRegionFilter: 'all',
    searchQuery: '',
    pageSize: 9,
    page: 1
  };

  // Elemen DOM (bisa ada atau tidak tergantung halaman)
  const eventListContainer = document.getElementById('event-list-container');
  const searchInput = document.getElementById('search-input');
  const regionFilters = document.querySelectorAll('.filter-btn');
  const bmkgStatusCard = document.getElementById('bmkg-live-card');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const paginationWrapper = document.getElementById('pagination-wrapper');
  const paginationContainer = document.getElementById('pagination-container');
  const paginationInfo = document.getElementById('pagination-info');

  // Indikator Statistik
  const statTotalEvents = document.getElementById('stat-total-events');
  const statIndonesiaEvents = document.getElementById('stat-indonesia-events');
  const statMaxWave = document.getElementById('stat-max-wave');
  const statLatestYear = document.getElementById('stat-latest-year');

  // ==========================================
  // 3. PENGAMBILAN DATA (API LIVE & CACHED)
  // ==========================================
  try {
    // A. Ambil data BMKG InaTEWS Terkini
    if (window.TsunamiAPI && typeof window.TsunamiAPI.fetchBmkgLatestAlert === 'function') {
      state.bmkgAlert = await window.TsunamiAPI.fetchBmkgLatestAlert();
      if (state.bmkgAlert) {
        if (bmkgStatusCard) renderBmkgAlert(state.bmkgAlert);
        if (mapController) mapController.setBmkgMarker(state.bmkgAlert);
      }
    }

    // B. Ambil data kejadian tsunami (NOAA & Arsip Terverifikasi)
    if (window.TsunamiAPI && typeof window.TsunamiAPI.loadAllTsunamiEvents === 'function') {
      state.events = await window.TsunamiAPI.loadAllTsunamiEvents((status) => {
        const countEl = document.getElementById('search-result-count');
        if (countEl && status && status.count) {
          countEl.textContent = `Menampilkan ${status.count} data kejadian tsunami`;
        }
      });
    }
  } catch (err) {
    console.warn('Gagal memuat API live, beralih ke data lokal:', err.message);
    if (window.TSUNAMI_INITIAL_DATA && Array.isArray(window.TSUNAMI_INITIAL_DATA) && window.TsunamiAPI) {
      state.events = window.TSUNAMI_INITIAL_DATA.map(window.TsunamiAPI.normalizeNoaaEvent);
    }
  } finally {
    updateStatistics();
    applyFilterAndSearch();

    // Cek parameter URL untuk fokus peta otomatis (misal: ?lat=-0.78&lng=116.92 atau ?focus=bmkg)
    handleUrlParameters();
  }

  // ==========================================
  // 4. PERHITUNGAN STATISTIK
  // ==========================================
  function updateStatistics() {
    if (!statTotalEvents && !statIndonesiaEvents && !statMaxWave && !statLatestYear) return;

    const total = state.events.length;
    const indoEvents = state.events.filter(e => e.isIndonesia);
    const newestYear = state.events.length > 0 ? state.events[0].year : '2026';

    if (statTotalEvents) statTotalEvents.textContent = total.toLocaleString('id-ID');
    if (statIndonesiaEvents) statIndonesiaEvents.textContent = indoEvents.length.toLocaleString('id-ID');
    // Rekor gelombang tertinggi di Indonesia adalah letusan Krakatau (85 meter)
    if (statMaxWave) statMaxWave.textContent = '85 m (Krakatau)';
    if (statLatestYear) statLatestYear.textContent = newestYear;
  }

  // ==========================================
  // 5. TAMPILAN BANNER BMKG INATEWS
  // ==========================================
  function renderBmkgAlert(gempa) {
    if (!bmkgStatusCard || !gempa) return;

    const evalResult = (window.TsunamiAPI && typeof window.TsunamiAPI.evaluateBmkgTsunamiPotential === 'function')
      ? window.TsunamiAPI.evaluateBmkgTsunamiPotential(gempa)
      : {
          isPotential: (gempa.Potensi || '').toLowerCase().includes('berpotensi tsunami') && !(gempa.Potensi || '').toLowerCase().includes('tidak berpotensi'),
          alertLevel: 'NORMAL',
          statusBadge: (gempa.Potensi || '').toLowerCase().includes('berpotensi tsunami') ? 'BERPOTENSI TSUNAMI' : 'Tidak Berpotensi Tsunami',
          waveEstimate: (gempa.Potensi || '').toLowerCase().includes('berpotensi tsunami') ? '> 0.5 m' : '0 m (Normal / Aman)',
          waveHeightShort: '0 m',
          badgeClass: 'bg-emerald-950/80 text-emerald-400 border border-emerald-600',
          recommendation: 'Kondisi perairan laut normal dan aman.'
        };

    bmkgStatusCard.innerHTML = `
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5 sm:gap-4">
        <div class="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${evalResult.isPotential ? 'bg-red-950/90 text-red-400 border border-red-500 shadow-md shadow-red-950/50' : 'bg-blue-950/80 text-sky-400 border border-blue-700'} flex items-center justify-center shrink-0 shadow-sm">
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span class="text-[11px] sm:text-xs font-bold uppercase tracking-wider ${evalResult.isPotential ? 'text-red-400' : 'text-sky-400'}">
                Pemantauan BMKG Terkini
              </span>
              <span class="text-slate-500 text-xs hidden sm:inline">|</span>
              <span class="text-[11px] sm:text-xs text-slate-300 font-medium">${gempa.Tanggal || 'Hari ini'} pukul ${gempa.Jam || ''}</span>
            </div>
            <h3 class="text-sm sm:text-base font-extrabold text-white mt-0.5 leading-snug">${gempa.Wilayah || 'Wilayah Perairan Indonesia'}</h3>
            <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-slate-200 mt-1">
              <span>Magnitudo: <strong class="text-sky-400 font-mono font-bold">M ${gempa.Magnitude || '-'}</strong></span>
              <span class="text-slate-500 hidden sm:inline">|</span>
              <span>Kedalaman: <strong class="text-white">${gempa.Kedalaman || '-'}</strong></span>
              <span class="text-slate-500 hidden sm:inline">|</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${evalResult.badgeClass}">
                ${evalResult.statusBadge}
              </span>
              <span class="text-slate-500 hidden sm:inline">|</span>
              <span>Estimasi Gelombang: <strong class="${evalResult.isPotential ? 'text-amber-300 font-extrabold' : 'text-emerald-400 font-bold'}">${evalResult.waveEstimate}</strong></span>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto shrink-0 mt-1 lg:mt-0">
          <button onclick="window.appFocusBmkgGempa()" class="ele-btn ele-btn-secondary w-full sm:w-auto flex-1 md:flex-initial text-xs gap-1.5 cursor-pointer shadow-xs justify-center min-h-[40px]">
            <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            Tinjau di Peta
          </button>
          <a href="mitigasi.html#peringatan-section" class="ele-btn ele-btn-primary w-full sm:w-auto flex-1 md:flex-initial text-xs justify-center text-center min-h-[40px]">
            Tingkat Peringatan &rarr;
          </a>
        </div>
      </div>
      ${evalResult.isPotential ? `
        <div class="mt-3 p-2.5 rounded-lg bg-red-950/80 border border-red-600 text-xs text-red-200 font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <strong class="text-red-300 uppercase tracking-wide">Instruksi BMKG:</strong> ${evalResult.recommendation}
          </div>
          <a href="mitigasi.html#peringatan-section" class="underline text-white font-bold hover:text-red-300 shrink-0">
            Panduan Evakuasi &rarr;
          </a>
        </div>
      ` : ''}
    `;
  }

  // ==========================================
  // 6. FILTER & PENCARIAN
  // ==========================================
  function applyFilterAndSearch() {
    let result = state.events;

    if (state.activeRegionFilter === 'indonesia') {
      result = result.filter(e => e.isIndonesia);
    } else if (state.activeRegionFilter === 'international') {
      result = result.filter(e => !e.isIndonesia);
    } else if (state.activeRegionFilter === 'high-wave') {
      result = result.filter(e => parseFloat(e.maxWaterHeight) >= 3.0);
    }

    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase().trim();
      result = result.filter(e => {
        return (e.locationName && e.locationName.toLowerCase().includes(q)) ||
               (e.country && e.country.toLowerCase().includes(q)) ||
               (e.fullDateIndo && e.fullDateIndo.toLowerCase().includes(q)) ||
               (e.year && String(e.year).includes(q)) ||
               (e.causeText && e.causeText.toLowerCase().includes(q));
      });
    }

    state.filteredEvents = result;
    state.page = 1;

    if (mapController) {
      mapController.renderMarkers(state.filteredEvents);
    }

    if (eventListContainer) {
      renderEventList();
    }

    const resultCountEl = document.getElementById('search-result-count');
    if (resultCountEl) {
      resultCountEl.textContent = `Menampilkan ${state.filteredEvents.length} data kejadian tsunami`;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      applyFilterAndSearch();
    });
  }

  regionFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      regionFilters.forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('data-active');
      });
      btn.classList.add('active');
      btn.setAttribute('data-active', 'true');

      state.activeRegionFilter = btn.dataset.region || 'all';
      applyFilterAndSearch();
    });
  });

  // ==========================================
  // 7. RENDER DAFTAR KATALOG KEJADIAN TSUNAMI (PAGINASI SLIDE 1 2 3 4 5)
  // ==========================================
  function renderEventList() {
    if (!eventListContainer) return;

    const totalItems = state.filteredEvents.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));

    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    const startIndex = (state.page - 1) * state.pageSize;
    const endIndex = Math.min(startIndex + state.pageSize, totalItems);
    const visibleItems = state.filteredEvents.slice(startIndex, endIndex);

    if (totalItems === 0) {
      eventListContainer.innerHTML = `
        <div class="col-span-full text-center py-16 ele-card p-8 bg-white border border-slate-200">
          <svg class="w-10 h-10 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h4 class="text-base font-bold text-slate-900">Tidak ada arsip yang cocok</h4>
          <p class="text-xs text-slate-500 mt-1">Coba gunakan kata kunci pencarian wilayah, tahun, atau bulan yang lain.</p>
        </div>
      `;
      if (paginationWrapper) paginationWrapper.style.display = 'none';
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    if (paginationWrapper) paginationWrapper.style.display = 'block';

    eventListContainer.innerHTML = visibleItems.map(item => {
      const height = parseFloat(item.maxWaterHeight) || 0;
      let badgeClass = 'ele-badge-slate';
      let badgeLabel = 'Gelombang < 1m';

      if (height >= 5.0 || (item.deaths && item.deaths > 100)) {
        badgeClass = 'ele-badge-red';
        badgeLabel = 'Gelombang Tinggi (> 5m)';
      } else if (height >= 1.0) {
        badgeClass = 'ele-badge-amber';
        badgeLabel = 'Gelombang Sedang (1-5m)';
      }

      const formattedDate = item.fullDateIndo || item.dateString || `Tahun ${item.year}`;

      return `
        <div class="ele-card ele-card-hover p-5 flex flex-col justify-between bg-slate-800/95 border border-slate-700/80 hover:border-sky-400 text-slate-100 shadow-md">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-xs font-semibold text-sky-300 bg-sky-950/80 px-2.5 py-0.5 rounded border border-sky-800">
                ${formattedDate}
              </span>
              <span class="text-[11px] font-semibold ${item.isIndonesia ? 'text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700' : 'text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700'}">
                ${item.isIndonesia ? 'Indonesia' : item.country}
              </span>
            </div>

            <h3 class="text-base font-extrabold text-white mb-2 leading-snug line-clamp-2">
              ${item.locationName}
            </h3>

            <div class="inline-block ${badgeClass} ele-badge mb-3">
              ${badgeLabel}
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs bg-slate-900/90 p-3 rounded-lg border border-slate-700/80 mb-4">
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-semibold">Tinggi Gelombang</span>
                <span class="font-extrabold text-sky-400 text-sm font-mono-num">
                  ${item.maxWaterHeight ? item.maxWaterHeight + ' m' : 'Tercatat'}
                </span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-semibold">Gempa Pemicu</span>
                <span class="font-extrabold text-white text-sm font-mono-num">
                  ${item.magnitude ? 'M ' + item.magnitude : 'N/A'}
                </span>
              </div>
              <div class="col-span-2 pt-1.5 border-t border-slate-700/80 text-[11px]">
                <span class="text-slate-400 font-medium">Mekanisme:</span> 
                <span class="text-slate-100 font-semibold">${item.causeText}</span>
              </div>
              ${item.deaths ? `
                <div class="col-span-2 text-red-200 font-semibold text-[11px] bg-red-950/80 p-1.5 rounded border border-red-700">
                  Estimasi Korban: ± ${Number(item.deaths).toLocaleString('id-ID')} jiwa
                </div>
              ` : ''}
            </div>
          </div>

          <div class="flex items-center gap-2 pt-3 border-t border-slate-700">
            <button onclick="window.appFlyToEvent(${item.lat}, ${item.lng}, '${item.id}')" 
                    class="ele-btn ele-btn-secondary flex-1 py-1.5 px-3 text-xs gap-1.5 min-h-[38px]">
              <svg class="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
              <span>Peta</span>
            </button>
            <button onclick="window.appShowDetailModal('${item.id}')" 
                    class="ele-btn ele-btn-primary flex-1 py-1.5 px-3 text-xs gap-1.5 min-h-[38px]">
              <span>Rincian</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    renderPagination(totalPages, state.page, startIndex, endIndex, totalItems);
  }

  // ==========================================
  // RENDER TOMBOL KOTAK PAGINASI (1 2 3 4 5...)
  // ==========================================
  function renderPagination(totalPages, currentPage, startIndex, endIndex, totalItems) {
    if (!paginationContainer) return;

    if (paginationInfo) {
      paginationInfo.innerHTML = `Menampilkan <strong class="text-sky-400 font-bold font-mono-num">${startIndex + 1}–${endIndex}</strong> dari <strong class="text-white font-bold font-mono-num">${totalItems}</strong> arsip kejadian (Halaman <strong class="text-white">${currentPage}</strong> dari <strong class="text-white">${totalPages}</strong>)`;
    }

    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let buttonsHtml = '';

    // Tombol Sebelumnya
    if (currentPage > 1) {
      buttonsHtml += `
        <button onclick="window.appGoToPage(${currentPage - 1})" class="ele-btn ele-btn-secondary px-3 py-2 text-xs font-bold gap-1 shadow-xs min-h-[38px] hover:border-sky-500 hover:text-sky-400" aria-label="Halaman Sebelumnya">
          <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          <span class="hidden sm:inline">Sebelumnya</span>
        </button>
      `;
    } else {
      buttonsHtml += `
        <button disabled class="ele-btn px-3 py-2 text-xs font-bold gap-1 min-h-[38px] bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-60" aria-disabled="true">
          <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          <span class="hidden sm:inline">Sebelumnya</span>
        </button>
      `;
    }

    // Nomor Halaman (Kotak Angka 1 2 3 4 5...)
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    pages.forEach(p => {
      if (p === '...') {
        buttonsHtml += `<span class="w-7 h-9 flex items-center justify-center text-slate-500 font-bold text-xs">...</span>`;
      } else if (p === currentPage) {
        buttonsHtml += `
          <button class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs sm:text-sm font-extrabold bg-blue-600 text-white border border-blue-500 shadow-sm" aria-current="page">
            ${p}
          </button>
        `;
      } else {
        buttonsHtml += `
          <button onclick="window.appGoToPage(${p})" class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:border-sky-500 hover:text-sky-400 active:bg-slate-700 transition shadow-xs">
            ${p}
          </button>
        `;
      }
    });

    // Tombol Selanjutnya
    if (currentPage < totalPages) {
      buttonsHtml += `
        <button onclick="window.appGoToPage(${currentPage + 1})" class="ele-btn ele-btn-secondary px-3 py-2 text-xs font-bold gap-1 shadow-xs min-h-[38px] hover:border-sky-500 hover:text-sky-400" aria-label="Halaman Berikutnya">
          <span class="hidden sm:inline">Selanjutnya</span>
          <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      `;
    } else {
      buttonsHtml += `
        <button disabled class="ele-btn px-3 py-2 text-xs font-bold gap-1 min-h-[38px] bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-60" aria-disabled="true">
          <span class="hidden sm:inline">Selanjutnya</span>
          <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      `;
    }

    paginationContainer.innerHTML = buttonsHtml;
  }

  // Handler Berpindah Halaman Slide
  window.appGoToPage = (targetPage) => {
    const totalPages = Math.max(1, Math.ceil(state.filteredEvents.length / state.pageSize));
    if (targetPage < 1 || targetPage > totalPages) return;
    state.page = targetPage;
    renderEventList();

    // Scroll halus kembali ke bagian atas katalog arsip
    const anchor = document.getElementById('event-list-container') || document.getElementById('search-result-count');
    if (anchor) {
      const yOffset = -90;
      const y = anchor.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  // ==========================================
  // 8. CHECKLIST TAS SIAGA BENCANA
  // ==========================================
  const bagCheckboxes = document.querySelectorAll('.bag-check');
  const bagProgress = document.getElementById('bag-progress-bar');
  const bagProgressText = document.getElementById('bag-progress-text');

  function updateBagProgress() {
    if (!bagCheckboxes || bagCheckboxes.length === 0) return;

    let checkedCount = 0;
    bagCheckboxes.forEach(cb => {
      if (cb.checked) checkedCount++;
    });

    const percent = Math.round((checkedCount / bagCheckboxes.length) * 100);
    if (bagProgress) bagProgress.style.width = `${percent}%`;
    if (bagProgressText) bagProgressText.textContent = `${percent}% Siap (${checkedCount}/${bagCheckboxes.length} Item)`;

    const checkedValues = Array.from(bagCheckboxes).map(c => ({ id: c.id, checked: c.checked }));
    localStorage.setItem('tsunami_bag_state', JSON.stringify(checkedValues));
  }

  if (bagCheckboxes && bagCheckboxes.length > 0) {
    try {
      const savedBag = JSON.parse(localStorage.getItem('tsunami_bag_state'));
      if (savedBag && Array.isArray(savedBag)) {
        savedBag.forEach(item => {
          const el = document.getElementById(item.id);
          if (el) el.checked = item.checked;
        });
      }
    } catch (e) {}

    bagCheckboxes.forEach(cb => {
      cb.addEventListener('change', updateBagProgress);
    });
    updateBagProgress();
  }

  // ==========================================
  // 9. MODAL DETAIL KEJADIAN
  // ==========================================
  window.appShowDetailModal = function (eventId) {
    const event = state.events.find(e => String(e.id) === String(eventId));
    if (!event) return;

    const modal = document.getElementById('event-detail-modal');
    const modalContent = document.getElementById('modal-content');
    if (!modal || !modalContent) return;

    const formattedDate = event.fullDateIndo || event.dateString || `Tahun ${event.year}`;

    modalContent.innerHTML = `
      <div class="flex items-start justify-between gap-4 pb-4 border-b border-slate-700">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="px-2.5 py-0.5 rounded text-xs font-semibold ${event.isIndonesia ? 'bg-sky-950/80 text-sky-300 border border-sky-800' : 'bg-slate-900 text-slate-300 border border-slate-700'}">
              ${event.isIndonesia ? 'Indonesia' : event.country}
            </span>
            <span class="text-xs font-semibold text-slate-300">
              ${formattedDate}
            </span>
          </div>
          <h2 class="text-xl font-extrabold text-white">${event.locationName}</h2>
        </div>
        <button onclick="window.appCloseModal()" class="w-8 h-8 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-200 flex items-center justify-center transition border border-slate-600 cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
        <div class="bg-slate-900/90 p-3 rounded-xl border border-slate-700">
          <span class="text-slate-400 block text-xs font-semibold uppercase">Puncak Gelombang</span>
          <span class="text-lg font-extrabold text-sky-400 font-mono-num">${event.maxWaterHeight ? event.maxWaterHeight + ' m' : 'Tercatat'}</span>
        </div>
        <div class="bg-slate-900/90 p-3 rounded-xl border border-slate-700">
          <span class="text-slate-400 block text-xs font-semibold uppercase">Kekuatan Gempa</span>
          <span class="text-lg font-extrabold text-white font-mono-num">${event.magnitude ? 'M ' + event.magnitude : 'N/A'}</span>
        </div>
        <div class="bg-slate-900/90 p-3 rounded-xl border border-slate-700 col-span-2 sm:col-span-1">
          <span class="text-slate-400 block text-xs font-semibold uppercase">Catatan Korban</span>
          <span class="text-lg font-extrabold text-red-400 font-mono-num">${event.deaths ? Number(event.deaths).toLocaleString('id-ID') + ' jiwa' : 'Tidak terlapor'}</span>
        </div>
      </div>

      <div class="space-y-3 text-sm text-slate-200">
        <div class="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700">
          <h4 class="font-bold text-sky-400 text-xs uppercase tracking-wide mb-1">Mekanisme Pemicu</h4>
          <p class="text-xs leading-relaxed text-slate-200 font-medium">${event.causeText}</p>
        </div>

        <div class="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700">
          <h4 class="font-bold text-sky-400 text-xs uppercase tracking-wide mb-1">Koordinat Geografis</h4>
          <p class="font-mono text-xs text-slate-300">Lintang: ${event.lat}&deg; | Bujur: ${event.lng}&deg;</p>
        </div>

        <div class="bg-blue-950/60 p-3.5 rounded-xl border border-blue-800 text-xs leading-relaxed text-slate-200">
          <h4 class="font-bold text-sky-400 mb-1">Catatan Mitigasi</h4>
          <p>
            Dokumentasi historis ini merupakan referensi pembelajaran untuk meningkatkan kesiapsiagaan struktur tata ruang pesisir serta jalur evakuasi masyarakat setempat.
          </p>
        </div>
      </div>

      <div class="mt-5 flex justify-end gap-2.5 pt-3 border-t border-slate-700">
        <button onclick="window.appCloseModal(); window.appFlyToEvent(${event.lat}, ${event.lng}, '${event.id}')" 
                class="ele-btn ele-btn-primary px-5 py-2.5 text-xs gap-1.5 font-bold shadow-md">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
          Lihat di Peta
        </button>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  };

  window.appCloseModal = function () {
    const modal = document.getElementById('event-detail-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  const modalEl = document.getElementById('event-detail-modal');
  if (modalEl) {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) window.appCloseModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.appCloseModal();
  });

  // ==========================================
  // 10. NAVIGASI GEOSPASIAL ANTAR HALAMAN
  // ==========================================
  window.appFlyToEvent = function (lat, lng, id) {
    const mapSection = document.getElementById('map-section');
    if (mapSection && mapController) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
      mapController.flyToEvent(lat, lng, 7);
    } else {
      // Jika di halaman lain (misal katalog), arahkan ke peta.html
      window.location.href = `peta.html?lat=${lat}&lng=${lng}${id ? '&id=' + id : ''}`;
    }
  };

  window.appFocusBmkgGempa = function () {
    const mapSection = document.getElementById('map-section');
    if (mapSection && mapController) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
      if (state.bmkgAlert && state.bmkgAlert.Coordinates) {
        const parts = state.bmkgAlert.Coordinates.split(',');
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          setTimeout(() => {
            mapController.flyToBmkg(lat, lng, 7);
          }, 300);
        }
      }
    } else {
      window.location.href = 'peta.html?focus=bmkg';
    }
  };

  function handleUrlParameters() {
    if (!mapController) return;

    const urlParams = new URLSearchParams(window.location.search);
    const focusType = urlParams.get('focus');
    const targetLat = parseFloat(urlParams.get('lat'));
    const targetLng = parseFloat(urlParams.get('lng'));

    if (focusType === 'bmkg' && state.bmkgAlert && state.bmkgAlert.Coordinates) {
      const parts = state.bmkgAlert.Coordinates.split(',');
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setTimeout(() => {
          mapController.flyToBmkg(lat, lng, 7);
        }, 500);
      }
    } else if (!isNaN(targetLat) && !isNaN(targetLng)) {
      const targetId = urlParams.get('id');
      setTimeout(() => {
        mapController.flyToEvent(targetLat, targetLng, 8);
        if (targetId && typeof mapController.openEventPopup === 'function') {
          mapController.openEventPopup(targetId);
        }
      }, 500);
    }
  }

  // Navigasi Mobile Menu
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
});
