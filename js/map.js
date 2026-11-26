/**
 * ============================================================================
 * Tsunami Indonesia - Map Controller (Leaflet.js)
 * Tema: Biru Cerah & Putih Solid (Bersih, Human-Crafted, Bebas Watermark)
 * ============================================================================
 */

class TsunamiMapController {
  constructor(mapContainerId = 'map') {
    this.containerId = mapContainerId;
    this.map = null;
    this.markersLayer = null;
    this.hazardZonesLayer = null;
    this.shelterLayer = null;
    this.bmkgMarker = null;
    this.allEvents = [];
    this.filteredEvents = [];
    this.markersById = new Map();
    this.userMarker = null;
    this.distanceLine = null;
  }

  /**
   * Inisialisasi Peta Leaflet dengan basemap topografi laut Esri
   */
  initMap() {
    const indonesiaCenter = [-0.7893, 116.9213];
    const initialZoom = window.innerWidth < 768 ? 4 : 5;

    this.map = L.map(this.containerId, {
      center: indonesiaCenter,
      zoom: initialZoom,
      minZoom: 2,
      maxZoom: 16,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // TILE LAYER 1: Esri World Topo Map (Topografi & Samudera, Bersih & Bebas Watermark)
    const topoTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, USGS, NOAA, DeLorme',
      maxZoom: 18
    });

    // TILE LAYER 2: Esri World Street Map (Batas Wilayah & Pesisir)
    const streetTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, HERE, USGS',
      maxZoom: 18
    });

    // TILE LAYER 3: Esri Satellite Imagery (Citra Satelit)
    const satTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, Maxar, Earthstar',
      maxZoom: 18
    });

    topoTile.addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    this.hazardZonesLayer = L.layerGroup().addTo(this.map);
    this.shelterLayer = L.layerGroup().addTo(this.map);

    L.control.layers({
      'Peta Topografi Alami': topoTile,
      'Peta Wilayah': streetTile,
      'Citra Satelit': satTile
    }, {
      'Titik Kejadian Tsunami': this.markersLayer,
      'Tempat Evakuasi Sementara (TES)': this.shelterLayer,
      'Zona Kerentanan Pesisir (InaRISK)': this.hazardZonesLayer
    }, { position: 'topright' }).addTo(this.map);

    this.initHazardAndShelters();
    this.addLegend();

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 200);

    window.addEventListener('resize', () => {
      if (this.map) this.map.invalidateSize();
    });
  }

  /**
   * Legenda peta Deep Oceanic (Kontras Tinggi)
   */
  addLegend() {
    const legend = L.control({ position: 'bottomleft' });

    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'ele-card p-3.5 rounded-xl text-xs text-white shadow-xl bg-slate-900/95 border border-slate-700 pointer-events-auto backdrop-blur-md');
      div.innerHTML = `
        <div class="font-bold mb-2 text-white border-b border-slate-700 pb-1.5 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
          Klasifikasi Ketinggian Gelombang
        </div>
        <div class="space-y-1.5 text-[11px]">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-red-600 border border-white shadow-xs"></span>
            <span class="text-slate-200">&gt; 5.0 meter (Bencana Besar)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-xs"></span>
            <span class="text-slate-200">1.0 – 5.0 meter (Sedang)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-sky-400 border border-white shadow-xs"></span>
            <span class="text-slate-200">&lt; 1.0 meter (Minor/Waspada)</span>
          </div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-slate-700/80 space-y-1.5 text-[11px]">
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-300 flex items-center justify-center text-[9px] font-bold text-white shadow-xs">T</span>
            <span class="text-slate-200">Tempat Evakuasi Sementara (TES)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-1 border-t-2 border-dashed border-red-500"></span>
            <span class="text-slate-200">Zona Kerentanan Pesisir (InaRISK)</span>
          </div>
        </div>
      `;
      return div;
    };

    legend.addTo(this.map);
  }

  /**
   * Menginisialisasi dan merender Layer Zona Risiko InaRISK & Shelter TES
   */
  initHazardAndShelters() {
    if (!window.TSUNAMI_HAZARD_DATA) return;

    // 1. Render Tempat Evakuasi Sementara (TES)
    if (window.TSUNAMI_HAZARD_DATA.shelters && this.shelterLayer) {
      this.shelterLayer.clearLayers();
      const shelterIcon = L.divIcon({
        className: 'relative flex items-center justify-center',
        html: `
          <div class="w-7 h-7 rounded-lg bg-emerald-600/90 border-2 border-emerald-300 shadow-md flex items-center justify-center text-white hover:scale-110 transition-transform">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      window.TSUNAMI_HAZARD_DATA.shelters.forEach(tes => {
        const marker = L.marker([tes.lat, tes.lng], { icon: shelterIcon });
        const facilitiesList = tes.facilities.map(f => `<span class="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">${f}</span>`).join('');
        const popupContent = `
          <div class="p-1 font-sans text-xs text-slate-100 max-w-[280px]">
            <div class="inline-block px-2 py-0.5 mb-1.5 rounded text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-700">
              TEMPAT EVAKUASI SEMENTARA (TES)
            </div>
            <h4 class="font-extrabold text-white text-sm mb-1">${tes.name}</h4>
            <div class="text-[11px] text-slate-300 mb-2">${tes.city}, ${tes.province}</div>
            <div class="space-y-1 text-[11px] bg-slate-900/90 p-2 rounded-lg border border-slate-700 mb-2">
              <div>Kapasitas: <b class="text-emerald-400 font-bold">${tes.capacity}</b></div>
              <div>Elevasi Bangunan: <b class="text-sky-300">${tes.elevation}</b></div>
              <div>Jarak dari Pantai: <b class="text-slate-200">${tes.distanceToCoast}</b></div>
            </div>
            <div class="text-[10px] text-slate-400 mb-2">
              <strong class="text-slate-300 block mb-1">Fasilitas Darurat:</strong>
              <div class="flex flex-wrap gap-1">${facilitiesList}</div>
            </div>
            <div class="text-[10px] text-slate-400 italic border-t border-slate-800 pt-1.5">
              Alamat: ${tes.address}
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, { className: 'ele-leaflet-popup' });
        this.shelterLayer.addLayer(marker);
      });
    }

    // 2. Render Zona Risiko Bahaya Pesisir (InaRISK)
    if (window.TSUNAMI_HAZARD_DATA.zones && this.hazardZonesLayer) {
      this.hazardZonesLayer.clearLayers();
      window.TSUNAMI_HAZARD_DATA.zones.forEach(zone => {
        const isCritical = zone.levelCode === 'critical';
        const color = isCritical ? '#dc2626' : '#ea580c';

        const line = L.polyline(zone.coordinates, {
          color: color,
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 6'
        });

        const buffer = L.polygon(zone.coordinates, {
          color: color,
          fillColor: color,
          fillOpacity: 0.12,
          weight: 1
        });

        const popupContent = `
          <div class="p-1 font-sans text-xs text-slate-100 max-w-[280px]">
            <div class="inline-block px-2 py-0.5 mb-1.5 rounded text-[10px] font-extrabold ${isCritical ? 'bg-red-950 text-red-300 border border-red-700' : 'bg-orange-950 text-orange-300 border border-orange-700'}">
              ${zone.level}
            </div>
            <h4 class="font-extrabold text-white text-sm mb-1">${zone.name}</h4>
            <div class="text-[11px] text-slate-300 mb-2">${zone.province}</div>
            <div class="space-y-1 text-[11px] bg-slate-900/90 p-2 rounded-lg border border-slate-700 mb-2">
              <div>Sumber Ancaman: <b class="text-slate-100">${zone.threatSource}</b></div>
              <div>Potensi Gelombang: <b class="text-red-400 font-bold">${zone.potentialMaxWave}</b></div>
              <div>Golden Time Evakuasi: <b class="text-amber-400 font-bold">${zone.goldenTimeMin}</b></div>
            </div>
            <p class="text-[11px] text-slate-300 leading-relaxed">${zone.description}</p>
          </div>
        `;

        line.bindPopup(popupContent, { className: 'ele-leaflet-popup' });
        buffer.bindPopup(popupContent, { className: 'ele-leaflet-popup' });

        this.hazardZonesLayer.addLayer(line);
        this.hazardZonesLayer.addLayer(buffer);
      });
    }
  }

  toggleShelterLayer() {
    if (!this.map || !this.shelterLayer) return;
    if (this.map.hasLayer(this.shelterLayer)) {
      this.map.removeLayer(this.shelterLayer);
      return false;
    } else {
      this.map.addLayer(this.shelterLayer);
      return true;
    }
  }

  toggleHazardLayer() {
    if (!this.map || !this.hazardZonesLayer) return;
    if (this.map.hasLayer(this.hazardZonesLayer)) {
      this.map.removeLayer(this.hazardZonesLayer);
      return false;
    } else {
      this.map.addLayer(this.hazardZonesLayer);
      return true;
    }
  }

  /**
   * Warna penanda titik tsunami
   */
  getMarkerColor(event) {
    const height = parseFloat(event.maxWaterHeight) || 0;
    const deaths = parseInt(event.deaths) || 0;

    if (height >= 5.0 || deaths >= 100) {
      return {
        fill: '#dc2626', // Red 600
        stroke: '#ffffff',
        radius: Math.min(13, Math.max(7, height * 0.4 + 6))
      };
    } else if (height >= 1.0 || deaths > 0) {
      return {
        fill: '#f59e0b', // Amber 500
        stroke: '#ffffff',
        radius: Math.min(10, Math.max(6, height * 0.8 + 5))
      };
    } else {
      return {
        fill: '#2563eb', // Blue 600 (Biru cerah)
        stroke: '#ffffff',
        radius: 5.5
      };
    }
  }

  /**
   * Render seluruh marker kejadian tsunami ke dalam peta dengan tipografi rapi
   */
  renderMarkers(events) {
    this.filteredEvents = events;
    this.markersLayer.clearLayers();

    events.forEach(event => {
      if (!event.lat || !event.lng || isNaN(event.lat) || isNaN(event.lng)) return;

      const style = this.getMarkerColor(event);

      const marker = L.circleMarker([event.lat, event.lng], {
        radius: style.radius,
        fillColor: style.fill,
        color: style.stroke,
        weight: 1.5,
        opacity: 0.95,
        fillOpacity: 0.85
      });

      const formattedDate = event.fullDateIndo || event.dateString || `Tahun ${event.year}`;

      const popupContent = `
        <div class="p-1 max-w-[280px] font-sans text-slate-100">
          <div class="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-700">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${event.isIndonesia ? 'bg-sky-950/80 text-sky-300 border border-sky-800' : 'bg-slate-900 text-slate-300 border border-slate-700'}">
              ${event.isIndonesia ? 'Indonesia' : (event.country || 'Internasional')}
            </span>
            <span class="text-xs font-semibold text-slate-300">
              ${formattedDate}
            </span>
          </div>

          <h4 class="font-extrabold text-sm text-white leading-snug mb-2">
            ${event.locationName}
          </h4>

          <div class="grid grid-cols-2 gap-2 mb-3 bg-slate-900/90 p-2.5 rounded-lg border border-slate-700 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Tinggi Gelombang</span>
              <span class="font-extrabold text-sky-400 text-sm font-mono-num">
                ${event.maxWaterHeight ? event.maxWaterHeight + ' m' : 'Tercatat'}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Gempa Pemicu</span>
              <span class="font-extrabold text-white text-sm font-mono-num">
                ${event.magnitude ? 'M ' + event.magnitude : 'N/A'}
              </span>
            </div>
            <div class="col-span-2 pt-1 border-t border-slate-700">
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Mekanisme Pemicu</span>
              <span class="text-slate-200 text-xs font-semibold">
                ${event.causeText}
              </span>
            </div>
            ${event.deaths ? `
              <div class="col-span-2 text-red-200 text-[11px] font-semibold bg-red-950/80 p-1.5 rounded border border-red-700">
                Korban Jiwa: ± ${Number(event.deaths).toLocaleString('id-ID')} jiwa
              </div>
            ` : ''}
          </div>

          <button onclick="window.appShowDetailModal('${event.id}')" 
                  class="ele-btn ele-btn-primary w-full py-2 px-3 text-xs font-bold gap-1.5 min-h-[38px] shadow-md shadow-blue-900/40 hover:-translate-y-0.5 cursor-pointer">
            <span>Rincian Kejadian</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'ele-leaflet-popup',
        maxWidth: 300
      });

      marker.on('mouseover', function () {
        this.setStyle({ radius: style.radius + 2, fillOpacity: 1 });
      });
      marker.on('mouseout', function () {
        this.setStyle({ radius: style.radius, fillOpacity: 0.85 });
      });

      this.markersLayer.addLayer(marker);
      if (event.id) {
        this.markersById.set(String(event.id), marker);
      }
    });
  }

  /**
   * Menampilkan titik pusat gempa BMKG terkini beserta potensi tsunami dan estimasi tinggi gelombang
   */
  setBmkgMarker(gempaData) {
    if (this.bmkgMarker) {
      this.map.removeLayer(this.bmkgMarker);
      this.bmkgMarker = null;
    }

    if (!gempaData || !gempaData.Coordinates) return;

    const [lat, lng] = gempaData.Coordinates.split(',').map(Number);
    if (isNaN(lat) || isNaN(lng)) return;

    const evalResult = (window.TsunamiAPI && typeof window.TsunamiAPI.evaluateBmkgTsunamiPotential === 'function')
      ? window.TsunamiAPI.evaluateBmkgTsunamiPotential(gempaData)
      : {
          isPotential: (gempaData.Potensi || '').toLowerCase().includes('berpotensi tsunami') && !(gempaData.Potensi || '').toLowerCase().includes('tidak berpotensi'),
          alertLevel: 'NORMAL',
          statusBadge: 'Tidak Berpotensi Tsunami',
          waveEstimate: '0 m (Normal / Aman)',
          waveHeightShort: '0 m',
          badgeClass: 'bg-emerald-950/80 text-emerald-400 border border-emerald-600',
          recommendation: 'Kondisi perairan laut normal dan aman.'
        };

    let pulseIcon;
    let bmkgPopup;

    if (evalResult.isPotential) {
      // Icon Peringatan Dini Potensi Tsunami (Merah/Amber Berdenyut Kuat)
      pulseIcon = L.divIcon({
        className: 'relative flex items-center justify-center',
        html: `
          <div class="relative w-9 h-9 flex items-center justify-center">
            <div class="absolute w-9 h-9 rounded-full bg-red-600/40 animate-ping"></div>
            <div class="absolute w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow-lg"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      bmkgPopup = `
        <div class="p-1 max-w-[290px] font-sans text-slate-100">
          <div class="flex items-center gap-1.5 text-xs font-bold text-red-400 mb-1.5 pb-1 border-b border-slate-700">
            <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>BMKG InaTEWS: ${evalResult.statusBadge}</span>
          </div>
          
          <h4 class="font-extrabold text-white text-sm leading-snug mb-2">
            ${gempaData.Wilayah || 'Wilayah Perairan Indonesia'}
          </h4>

          <div class="grid grid-cols-2 gap-2 mb-2.5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-700 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Estimasi Gelombang</span>
              <span class="font-extrabold text-amber-300 text-sm font-mono-num">
                ${evalResult.waveHeightShort}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Magnitudo</span>
              <span class="font-extrabold text-sky-400 text-sm font-mono-num">
                M ${gempaData.Magnitude || '-'}
              </span>
            </div>
            <div class="col-span-2 pt-1 border-t border-slate-800 text-[11px] text-slate-300">
              Kedalaman: <strong class="text-white">${gempaData.Kedalaman || '-'}</strong> | ${gempaData.Tanggal || ''} ${gempaData.Jam || ''}
            </div>
          </div>

          <div class="p-2 rounded-lg text-xs font-semibold bg-red-950/80 text-red-200 border border-red-700 mb-2.5">
            <strong>Instruksi:</strong> ${evalResult.recommendation}
          </div>

          <a href="mitigasi.html#peringatan-section" 
             class="ele-btn ele-btn-primary w-full py-2 px-3 text-xs font-bold gap-1.5 justify-center text-center min-h-[38px] shadow-md shadow-blue-900/40">
            <span>Panduan Mitigasi & Evakuasi &rarr;</span>
          </a>
        </div>
      `;
    } else {
      // Icon Episentrum Gempa BMKG Normal (Cyan / Sky Blue Ring)
      pulseIcon = L.divIcon({
        className: 'relative flex items-center justify-center',
        html: `
          <div class="relative w-8 h-8 flex items-center justify-center">
            <div class="absolute w-7 h-7 rounded-full bg-sky-500/30 animate-pulse"></div>
            <div class="absolute w-3.5 h-3.5 rounded-full bg-sky-400 border-2 border-white shadow-md"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      bmkgPopup = `
        <div class="p-1 max-w-[280px] font-sans text-slate-100">
          <div class="flex items-center justify-between gap-1.5 text-xs font-bold text-sky-400 mb-1.5 pb-1 border-b border-slate-700">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-sky-400"></span>
              Episentrum BMKG Terkini
            </span>
            <span class="text-[10px] text-slate-300 font-normal">${gempaData.Jam || ''}</span>
          </div>

          <h4 class="font-extrabold text-white text-sm leading-snug mb-2">
            ${gempaData.Wilayah || 'Wilayah Indonesia'}
          </h4>

          <div class="grid grid-cols-2 gap-2 mb-2.5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-700 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Estimasi Gelombang</span>
              <span class="font-extrabold text-emerald-400 text-sm font-mono-num">
                ${evalResult.waveHeightShort} (Aman)
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Magnitudo</span>
              <span class="font-extrabold text-sky-400 text-sm font-mono-num">
                M ${gempaData.Magnitude || '-'}
              </span>
            </div>
            <div class="col-span-2 pt-1 border-t border-slate-800 text-[11px] text-slate-300">
              Kedalaman: <strong class="text-white">${gempaData.Kedalaman || '-'}</strong> | ${gempaData.Tanggal || ''}
            </div>
          </div>

          <div class="p-2 rounded-lg text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 mb-2.5">
            Status: <strong class="text-white font-bold">Tidak Berpotensi Tsunami</strong>. Permukaan laut dalam kondisi normal.
          </div>

          <a href="mitigasi.html#peringatan-section" 
             class="ele-btn ele-btn-secondary w-full py-2 px-3 text-xs font-bold gap-1.5 justify-center text-center min-h-[38px] shadow-sm">
            <span>Kriteria Peringatan Dini &rarr;</span>
          </a>
        </div>
      `;
    }

    this.bmkgMarker = L.marker([lat, lng], { icon: pulseIcon }).addTo(this.map);
    this.bmkgMarker.bindPopup(bmkgPopup, { className: 'ele-leaflet-popup', maxWidth: 300 });
  }

  focusIndonesia() {
    this.map.flyTo([-0.7893, 116.9213], 5, { duration: 1.2 });
  }

  focusPacific() {
    this.map.flyTo([10.0, 150.0], 3, { duration: 1.2 });
  }

  flyToEvent(lat, lng, zoom = 7) {
    if (!lat || !lng) return;
    this.map.flyTo([lat, lng], zoom, { duration: 1.2 });
  }

  flyToBmkg(lat, lng, zoom = 7) {
    if (!this.bmkgMarker) {
      this.focusIndonesia();
      return;
    }
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      this.focusIndonesia();
      return;
    }
    this.map.flyTo([lat, lng], zoom, { duration: 1.2 });
    setTimeout(() => {
      try {
        this.bmkgMarker.openPopup();
      } catch (e) {}
    }, 600);
  }

  openEventPopup(id) {
    if (!id) return;
    const marker = this.markersById.get(String(id));
    if (marker) {
      setTimeout(() => {
        try {
          marker.openPopup();
        } catch (e) {}
      }, 600);
    }
  }
  /**
   * Menampilkan posisi pengguna dan garis ukur jarak langsung ke episentrum BMKG
   */
  showUserDistance(userLat, userLng, bmkgLat, bmkgLng, distKm) {
    if (!this.map) return;

    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
      this.userMarker = null;
    }
    if (this.distanceLine) {
      this.map.removeLayer(this.distanceLine);
      this.distanceLine = null;
    }

    const userIcon = L.divIcon({
      className: 'relative flex items-center justify-center',
      html: `
        <div class="relative w-8 h-8 flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-emerald-500/40 animate-ping"></div>
          <div class="absolute w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    this.userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(this.map);
    this.userMarker.bindPopup(`
      <div class="p-1 font-sans text-xs text-slate-100 max-w-[240px]">
        <div class="font-bold text-emerald-400 mb-1 border-b border-slate-700 pb-1 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          Lokasi Anda Terdeteksi
        </div>
        <p class="text-slate-300">
          Jarak ke pusat gempa BMKG: <strong class="text-white font-mono font-bold">${distKm ? distKm.toLocaleString('id-ID') + ' km' : 'Terdeteksi'}</strong>
        </p>
      </div>
    `, { className: 'ele-leaflet-popup' });

    this.distanceLine = L.polyline([[userLat, userLng], [bmkgLat, bmkgLng]], {
      color: '#38bdf8',
      weight: 2.5,
      dashArray: '6, 8',
      opacity: 0.95
    }).addTo(this.map);

    const bounds = L.latLngBounds([[userLat, userLng], [bmkgLat, bmkgLng]]);
    this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });

    setTimeout(() => {
      try {
        if (this.userMarker) this.userMarker.openPopup();
      } catch (e) {}
    }, 600);
  }
}

window.TsunamiMapController = TsunamiMapController;
