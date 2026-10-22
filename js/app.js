/**
 * ============================================================================
 * Tsunami Indonesia - Main Application Logic (Multi-Page Ready)
 * Tema: Biru Cerah & Putih Solid (Bebas Transparansi Murky, Human-Crafted)
 * ============================================================================
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
    
    let maxHeight = 0;
    let maxLocation = '';
    state.events.forEach(e => {
      const h = parseFloat(e.maxWaterHeight) || 0;
      if (h > maxHeight) {
        maxHeight = h;
        maxLocation = e.locationName;
      }
    });

    const newestYear = state.events.length > 0 ? state.events[0].year : '2026';

    if (statTotalEvents) statTotalEvents.textContent = total.toLocaleString('id-ID');
    if (statIndonesiaEvents) statIndonesiaEvents.textContent = indoEvents.length.toLocaleString('id-ID');
    if (statMaxWave) statMaxWave.textContent = `${maxHeight} m (${maxLocation || 'Krakatau'})`;
    if (statLatestYear) statLatestYear.textContent = newestYear;
  }

  // ==========================================
  // 5. TAMPILAN BANNER BMKG INATEWS
  // ==========================================
  function renderBmkgAlert(gempa) {
    if (!bmkgStatusCard || !gempa) return;

    const isTsunamiPotential = (gempa.Potensi || '').toLowerCase().includes('berpotensi tsunami') && 
                              !(gempa.Potensi || '').toLowerCase().includes('tidak berpotensi');

    bmkgStatusCard.innerHTML = `
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div class="flex items-start sm:items-center gap-3 sm:gap-4">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${isTsunamiPotential ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'} flex items-center justify-center shrink-0 shadow-xs">
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span class="text-[11px] sm:text-xs font-bold uppercase tracking-wider ${isTsunamiPotential ? 'text-red-600' : 'text-blue-600'}">
                Pemantauan BMKG Terkini
              </span>
              <span class="text-slate-300 text-xs hidden sm:inline">|</span>
              <span class="text-[11px] sm:text-xs text-slate-500 font-medium">${gempa.Tanggal || 'Hari ini'} pukul ${gempa.Jam || ''}</span>
            </div>
            <h3 class="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 leading-snug">${gempa.Wilayah || 'Wilayah Perairan Indonesia'}</h3>
            <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Magnitudo: <strong class="text-blue-600 font-mono font-bold">M ${gempa.Magnitude || '-'}</strong> &nbsp;|&nbsp; 
              Kedalaman: <strong class="text-slate-800">${gempa.Kedalaman || '-'}</strong> &nbsp;|&nbsp; 
              <span class="font-semibold ${isTsunamiPotential ? 'text-red-600 font-bold' : 'text-slate-700'}">${gempa.Potensi || 'Tidak berpotensi tsunami'}</span>
            </p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto shrink-0">
          <button onclick="window.appFocusBmkgGempa()" class="ele-btn ele-btn-secondary w-full sm:w-auto flex-1 md:flex-initial text-xs gap-1.5 cursor-pointer shadow-xs justify-center min-h-[40px]">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            Tinjau di Peta
          </button>
          <a href="mitigasi.html#peringatan-section" class="ele-btn ele-btn-primary w-full sm:w-auto flex-1 md:flex-initial text-xs justify-center text-center min-h-[40px]">
            Tingkat Peringatan &rarr;
          </a>
        </div>
      </div>
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
        b.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
        b.classList.add('bg-white', 'text-slate-700', 'border-slate-300');
      });
      btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
      btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-300');

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
        badgeLabel = 'Gelombang Dahsyat (> 5m)';
      } else if (height >= 1.0) {
        badgeClass = 'ele-badge-amber';
        badgeLabel = 'Gelombang Sedang (1-5m)';
      }

      const formattedDate = item.fullDateIndo || item.dateString || `Tahun ${item.year}`;

      return `
        <div class="ele-card ele-card-hover p-5 flex flex-col justify-between bg-white border border-slate-200">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                ${formattedDate}
              </span>
              <span class="text-[11px] font-semibold ${item.isIndonesia ? 'text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200' : 'text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200'}">
                ${item.isIndonesia ? 'Indonesia' : item.country}
              </span>
            </div>

            <h3 class="text-base font-extrabold text-slate-900 mb-2 leading-snug line-clamp-2">
              ${item.locationName}
            </h3>

            <div class="inline-block ${badgeClass} ele-badge mb-3">
              ${badgeLabel}
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">Tinggi Gelombang</span>
                <span class="font-extrabold text-blue-600 text-sm font-mono-num">
                  ${item.maxWaterHeight ? item.maxWaterHeight + ' m' : 'Tercatat'}
                </span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">Gempa Pemicu</span>
                <span class="font-extrabold text-slate-800 text-sm font-mono-num">
                  ${item.magnitude ? 'M ' + item.magnitude : 'N/A'}
                </span>
              </div>
              <div class="col-span-2 pt-1.5 border-t border-slate-200 text-[11px]">
                <span class="text-slate-500 font-medium">Mekanisme:</span> 
                <span class="text-slate-800 font-semibold">${item.causeText}</span>
              </div>
              ${item.deaths ? `
                <div class="col-span-2 text-red-700 font-semibold text-[11px] bg-red-50 p-1.5 rounded border border-red-200">
                  Estimasi Korban: ± ${Number(item.deaths).toLocaleString('id-ID')} jiwa
                </div>
              ` : ''}
            </div>
          </div>

          <div class="flex items-center gap-2 pt-3 border-t border-slate-200">
            <button onclick="window.appFlyToEvent(${item.lat}, ${item.lng}, '${item.id}')" 
                    class="ele-btn ele-btn-secondary flex-1 py-1.5 px-3 text-xs gap-1.5 min-h-[38px]">
              <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
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
      paginationInfo.innerHTML = `Menampilkan <strong class="text-blue-600 font-bold font-mono-num">${startIndex + 1}–${endIndex}</strong> dari <strong class="text-slate-800 font-bold font-mono-num">${totalItems}</strong> arsip kejadian (Halaman <strong>${currentPage}</strong> dari <strong>${totalPages}</strong>)`;
    }

    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let buttonsHtml = '';

    // Tombol Sebelumnya
    if (currentPage > 1) {
      buttonsHtml += `
        <button onclick="window.appGoToPage(${currentPage - 1})" class="ele-btn ele-btn-secondary px-3 py-2 text-xs font-bold gap-1 shadow-xs min-h-[38px] active:bg-blue-50" aria-label="Halaman Sebelumnya">
          <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          <span class="hidden sm:inline">Sebelumnya</span>
        </button>
      `;
    } else {
      buttonsHtml += `
        <button disabled class="ele-btn px-3 py-2 text-xs font-bold gap-1 min-h-[38px] bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60" aria-disabled="true">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
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
        buttonsHtml += `<span class="w-7 h-9 flex items-center justify-center text-slate-400 font-bold text-xs">...</span>`;
      } else if (p === currentPage) {
        buttonsHtml += `
          <button class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs sm:text-sm font-extrabold bg-blue-600 text-white border border-blue-600 shadow-sm" aria-current="page">
            ${p}
          </button>
        `;
      } else {
        buttonsHtml += `
          <button onclick="window.appGoToPage(${p})" class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold bg-white text-slate-700 border border-slate-300 hover:border-blue-600 hover:text-blue-600 active:bg-blue-50 transition shadow-xs">
            ${p}
          </button>
        `;
      }
    });

    // Tombol Selanjutnya
    if (currentPage < totalPages) {
      buttonsHtml += `
        <button onclick="window.appGoToPage(${currentPage + 1})" class="ele-btn ele-btn-secondary px-3 py-2 text-xs font-bold gap-1 shadow-xs min-h-[38px] active:bg-blue-50" aria-label="Halaman Berikutnya">
          <span class="hidden sm:inline">Selanjutnya</span>
          <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      `;
    } else {
      buttonsHtml += `
        <button disabled class="ele-btn px-3 py-2 text-xs font-bold gap-1 min-h-[38px] bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60" aria-disabled="true">
          <span class="hidden sm:inline">Selanjutnya</span>
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
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
      <div class="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="px-2.5 py-0.5 rounded text-xs font-semibold ${event.isIndonesia ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}">
              ${event.isIndonesia ? 'Indonesia' : event.country}
            </span>
            <span class="text-xs font-semibold text-slate-500">
              ${formattedDate}
            </span>
          </div>
          <h2 class="text-xl font-extrabold text-slate-900">${event.locationName}</h2>
        </div>
        <button onclick="window.appCloseModal()" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition border border-slate-200 cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span class="text-slate-500 block text-xs font-semibold uppercase">Puncak Gelombang</span>
          <span class="text-lg font-extrabold text-blue-600 font-mono-num">${event.maxWaterHeight ? event.maxWaterHeight + ' m' : 'Tercatat'}</span>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span class="text-slate-500 block text-xs font-semibold uppercase">Kekuatan Gempa</span>
          <span class="text-lg font-extrabold text-slate-800 font-mono-num">${event.magnitude ? 'M ' + event.magnitude : 'N/A'}</span>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
          <span class="text-slate-500 block text-xs font-semibold uppercase">Catatan Korban</span>
          <span class="text-lg font-extrabold text-red-600 font-mono-num">${event.deaths ? Number(event.deaths).toLocaleString('id-ID') + ' jiwa' : 'Tidak terlapor'}</span>
        </div>
      </div>

      <div class="space-y-3 text-sm text-slate-700">
        <div class="bg-white p-3.5 rounded-xl border border-slate-200">
          <h4 class="font-bold text-blue-600 text-xs uppercase tracking-wide mb-1">Mekanisme Pemicu</h4>
          <p class="text-xs leading-relaxed text-slate-800 font-medium">${event.causeText}</p>
        </div>

        <div class="bg-white p-3.5 rounded-xl border border-slate-200">
          <h4 class="font-bold text-blue-600 text-xs uppercase tracking-wide mb-1">Koordinat Geografis</h4>
          <p class="font-mono text-xs text-slate-700">Lintang: ${event.lat}&deg; | Bujur: ${event.lng}&deg;</p>
        </div>

        <div class="bg-blue-50 p-3.5 rounded-xl border border-blue-200 text-xs leading-relaxed text-slate-800">
          <h4 class="font-bold text-blue-800 mb-1">Catatan Mitigasi</h4>
          <p>
            Dokumentasi historis ini merupakan referensi pembelajaran untuk meningkatkan kesiapsiagaan struktur tata ruang pesisir serta jalur evakuasi masyarakat setempat.
          </p>
        </div>
      </div>

      <div class="mt-5 flex justify-end gap-2.5 pt-3 border-t border-slate-200">
        <button onclick="window.appCloseModal(); window.appFlyToEvent(${event.lat}, ${event.lng}, '${event.id}')" 
                class="ele-btn ele-btn-primary px-5 py-2.5 text-xs gap-1.5">
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
