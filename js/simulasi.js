/**
 * ============================================================================
 * Tsunami Indonesia - Controller Simulasi, Golden Time, & Skenario Bahaya
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
  initGoldenTimeCalculator();
  initScenarioTabs();
});

function initGoldenTimeCalculator() {
  const distInput = document.getElementById('calc-dist');
  const distVal = document.getElementById('calc-dist-val');
  const speedSelect = document.getElementById('calc-speed');
  const etaSelect = document.getElementById('calc-eta');
  const shelterDistInput = document.getElementById('calc-shelter-dist');
  const shelterDistVal = document.getElementById('calc-shelter-dist-val');
  const calcBtn = document.getElementById('calc-btn');
  const resultCard = document.getElementById('calc-result');

  if (!calcBtn) return;

  // Real-time slider labels
  if (distInput && distVal) {
    distInput.addEventListener('input', () => {
      distVal.textContent = `${distInput.value} meter`;
    });
  }

  if (shelterDistInput && shelterDistVal) {
    shelterDistInput.addEventListener('input', () => {
      shelterDistVal.textContent = `${shelterDistInput.value} meter`;
    });
  }

  calcBtn.addEventListener('click', calculateGoldenTime);

  function calculateGoldenTime() {
    const distToShelter = parseFloat(shelterDistInput ? shelterDistInput.value : 800) || 800;
    const speedKmH = parseFloat(speedSelect.value) || 5.0; // km/jam
    const etaMin = parseFloat(etaSelect.value) || 20.0; // menit

    // Kecepatan dalam meter per menit: km/jam * 1000 / 60
    const speedMeterPerMin = (speedKmH * 1000) / 60;

    // Waktu evakuasi yang dibutuhkan (menit)
    // Ditambah 3 menit buffer waktu reaksi awal / shock gempa
    const reactionTimeMin = 3.0;
    const travelTimeMin = distToShelter / speedMeterPerMin;
    const totalEvacTimeMin = reactionTimeMin + travelTimeMin;

    // Margin waktu tersisa
    const marginMin = etaMin - totalEvacTimeMin;

    let statusHtml = '';
    let adviceHtml = '';

    if (marginMin >= 10) {
      statusHtml = `
        <div class="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200">
          <div class="flex items-center gap-2 font-bold text-emerald-400 text-sm mb-1">
            <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
            SURVIVAL WINDOW TINGGI (STATUS AMAN)
          </div>
          <p class="text-xs leading-relaxed">
            Waktu evakuasi Anda (<b class="text-white">${totalEvacTimeMin.toFixed(1)} menit</b>) jauh lebih cepat daripada perkiraan tiba gelombang (<b class="text-white">${etaMin} menit</b>).
            Sisa waktu aman Anda adalah <b class="text-emerald-300 font-bold">+${marginMin.toFixed(1)} menit</b>.
          </p>
        </div>
      `;
      adviceHtml = `
        <div class="mt-3 text-xs text-slate-300 space-y-1">
          <div>&bull; Bergeraklah secara tertib dengan berjalan cepat/tanggap ke titik kumpul.</div>
          <div>&bull; Bawa Tas Siaga Bencana (TSB) dan pastikan anggota keluarga tidak terpisah.</div>
          <div>&bull; Hindari menggunakan kendaraan roda empat karena rawan terjebak kemacetan massal di jalan pesisir.</div>
        </div>
      `;
    } else if (marginMin > 0 && marginMin < 10) {
      statusHtml = `
        <div class="p-3.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200">
          <div class="flex items-center gap-2 font-bold text-amber-400 text-sm mb-1">
            <span class="w-3 h-3 rounded-full bg-amber-400"></span>
            SURVIVAL WINDOW KETAT (WASPADA TINGGI)
          </div>
          <p class="text-xs leading-relaxed">
            Waktu evakuasi Anda (<b class="text-white">${totalEvacTimeMin.toFixed(1)} menit</b>) mendekati waktu tiba tsunami (<b class="text-white">${etaMin} menit</b>).
            Tersisa margin tipis <b class="text-amber-300 font-bold">${marginMin.toFixed(1)} menit</b> sebelum gelombang pertama mencapai daratan.
          </p>
        </div>
      `;
      adviceHtml = `
        <div class="mt-3 text-xs text-slate-300 space-y-1">
          <div>&bull; Tingkatkan kecepatan langkah atau berlari jika kondisi fisik memungkinkan.</div>
          <div>&bull; Jangan kembali untuk mengambil barang yang tertinggal.</div>
          <div>&bull; Jika akses menuju shelter bukit/dataran tinggi terhambat, segera cari bangunan beton bertingkat terdekat (minimal lantai 3).</div>
        </div>
      `;
    } else {
      statusHtml = `
        <div class="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200">
          <div class="flex items-center gap-2 font-bold text-red-400 text-sm mb-1">
            <span class="w-3 h-3 rounded-full bg-red-400"></span>
            STATUS KRITIS: SEGERA LAKUKAN EVAKUASI VERTIKAL!
          </div>
          <p class="text-xs leading-relaxed">
            Waktu evakuasi darat Anda (<b class="text-white">${totalEvacTimeMin.toFixed(1)} menit</b>) melebihi waktu kedatangan gelombang (<b class="text-white">${etaMin} menit</b>).
            Defisit waktu: <b class="text-red-300 font-bold">${Math.abs(marginMin).toFixed(1)} menit terlambat</b>.
          </p>
        </div>
      `;
      adviceHtml = `
        <div class="mt-3 text-xs text-red-200 bg-red-900/30 p-3 rounded-xl border border-red-800 space-y-1.5 font-semibold">
          <div class="text-sm font-bold text-white">JANGAN MEMAKSAKAN DIRI BERLARI KE DATARAN TINGGI YANG JAUH!</div>
          <div class="text-[11px] font-normal text-slate-200 leading-relaxed">
            Lakukan evakuasi vertikal darurat: Segera masuki gedung permanen beton bertingkat terdekat (hotel, ruko beton bertingkat, masjid berkubah kokoh, atau TES) dan naiklah minimal ke lantai 3 atau atap tertinggi.
          </div>
        </div>
      `;
    }

    if (resultCard) {
      resultCard.classList.remove('hidden');
      resultCard.innerHTML = `
        <div class="space-y-4">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div class="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
              <div class="text-[10px] text-slate-400">Waktu Tiba Tsunami (ETA)</div>
              <div class="text-lg font-extrabold text-sky-400 font-mono-num">${etaMin} Menit</div>
            </div>
            <div class="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
              <div class="text-[10px] text-slate-400">Reaksi + Persiapan</div>
              <div class="text-lg font-extrabold text-slate-200 font-mono-num">${reactionTimeMin} Menit</div>
            </div>
            <div class="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
              <div class="text-[10px] text-slate-400">Waktu Tempuh Perjalanan</div>
              <div class="text-lg font-extrabold text-slate-200 font-mono-num">${travelTimeMin.toFixed(1)} Menit</div>
            </div>
            <div class="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
              <div class="text-[10px] text-slate-400">Total Waktu Evakuasi</div>
              <div class="text-lg font-extrabold ${marginMin >= 0 ? 'text-emerald-400' : 'text-red-400'} font-mono-num">${totalEvacTimeMin.toFixed(1)} Menit</div>
            </div>
          </div>
          ${statusHtml}
          ${adviceHtml}
        </div>
      `;
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

function initScenarioTabs() {
  const container = document.getElementById('scenario-container');
  if (!container || !window.TSUNAMI_HAZARD_DATA || !window.TSUNAMI_HAZARD_DATA.scenarios) return;

  const scenarios = window.TSUNAMI_HAZARD_DATA.scenarios;
  let activeIndex = 0;

  function render() {
    const s = scenarios[activeIndex];
    container.innerHTML = `
      <div class="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-700 pb-4">
        ${scenarios.map((sc, idx) => `
          <button onclick="window.switchScenario(${idx})" 
                  class="ele-btn ${idx === activeIndex ? 'border-sky-400 bg-sky-950/50 text-white' : 'ele-btn-secondary'} px-4 py-2 text-xs font-bold gap-1.5 shadow-xs">
            ${sc.title}
          </button>
        `).join('')}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 space-y-4">
          <div class="ele-card p-5 bg-slate-800/95 border border-slate-700 shadow-md">
            <div class="text-[10px] uppercase font-bold text-sky-400 mb-1">Parameter Gempa Pemicu</div>
            <h3 class="text-lg font-extrabold text-white mb-3">${s.title}</h3>
            <div class="space-y-2 text-xs text-slate-200">
              <div class="flex justify-between py-1 border-b border-slate-700">
                <span class="text-slate-400">Magnitudo:</span>
                <b class="text-red-400 font-mono-num font-bold">${s.magnitude}</b>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-700">
                <span class="text-slate-400">Kedalaman:</span>
                <b class="text-white font-mono-num font-bold">${s.focalDepth}</b>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-700">
                <span class="text-slate-400">Potensi Gelombang:</span>
                <b class="text-red-400 font-bold">${s.waveHeightMax}</b>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-700">
                <span class="text-slate-400">Waktu Tiba Pantai (ETA):</span>
                <b class="text-amber-400 font-bold font-mono-num">${s.etaCoast}</b>
              </div>
            </div>
            <p class="text-xs text-slate-300 mt-4 leading-relaxed">${s.summary}</p>
            <div class="mt-4 pt-3 border-t border-slate-700">
              <div class="text-[11px] font-bold text-slate-300 mb-1.5">Wilayah Ancaman Utama:</div>
              <div class="flex flex-wrap gap-1">
                ${s.affectedAreas.map(a => `<span class="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-sky-300 border border-slate-700">${a}</span>`).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2">
          <div class="ele-card p-5 bg-slate-800/95 border border-slate-700 shadow-md">
            <h4 class="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
              Timeline Kronologi Rambatan Gelombang Tsunami
            </h4>
            <div class="relative border-l-2 border-sky-600/40 ml-3 space-y-6 pl-5">
              ${s.propagationSteps.map((step) => `
                <div class="relative">
                  <div class="absolute -left-[27px] top-0 w-3.5 h-3.5 rounded-full bg-sky-500 border-2 border-slate-900 shadow-xs"></div>
                  <div class="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono-num font-bold bg-sky-950 text-sky-300 border border-sky-700 mb-1">
                    ${step.time}
                  </div>
                  <p class="text-xs text-slate-200 leading-relaxed font-medium">
                    ${step.desc}
                  </p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.switchScenario = function(idx) {
    activeIndex = idx;
    render();
  };

  render();
}
