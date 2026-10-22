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
    this.bmkgMarker = null;
    this.allEvents = [];
    this.filteredEvents = [];
    this.markersById = new Map();
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

    L.control.layers({
      'Peta Topografi Alami': topoTile,
      'Peta Wilayah': streetTile,
      'Citra Satelit': satTile
    }, null, { position: 'topright' }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    this.addLegend();

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 200);

    window.addEventListener('resize', () => {
      if (this.map) this.map.invalidateSize();
    });
  }

  /**
   * Legenda peta putih solid & biru cerah
   */
  addLegend() {
    const legend = L.control({ position: 'bottomleft' });

    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'ele-card p-3.5 rounded-xl text-xs text-slate-800 shadow-md bg-white border border-slate-200 pointer-events-auto');
      div.innerHTML = `
        <div class="font-bold mb-2 text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          Klasifikasi Ketinggian Gelombang
        </div>
        <div class="space-y-1.5 text-[11px]">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-red-600 border border-white shadow-xs"></span>
            <span class="text-slate-700">&gt; 5.0 meter (Bencana Besar)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-xs"></span>
            <span class="text-slate-700">1.0 – 5.0 meter (Sedang)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-xs"></span>
            <span class="text-slate-700">&lt; 1.0 meter (Minor/Waspada)</span>
          </div>
          <div class="flex items-center gap-2 pt-1.5 border-t border-slate-200">
            <span class="w-3 h-3 rounded-full bg-blue-600 border border-white animate-pulse"></span>
            <span class="font-bold text-blue-600">Episentrum Gempa BMKG</span>
          </div>
        </div>
      `;
      return div;
    };

    legend.addTo(this.map);
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
        <div class="p-1 max-w-[280px] font-sans text-slate-800">
          <div class="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-200">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${event.isIndonesia ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}">
              ${event.isIndonesia ? 'Indonesia' : (event.country || 'Internasional')}
            </span>
            <span class="text-xs font-semibold text-slate-500">
              ${formattedDate}
            </span>
          </div>

          <h4 class="font-bold text-sm text-slate-900 leading-snug mb-2">
            ${event.locationName}
          </h4>

          <div class="grid grid-cols-2 gap-2 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-semibold">Tinggi Gelombang</span>
              <span class="font-extrabold text-blue-600 text-sm font-mono-num">
                ${event.maxWaterHeight ? event.maxWaterHeight + ' m' : 'Tercatat'}
              </span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-semibold">Gempa Pemicu</span>
              <span class="font-extrabold text-slate-800 text-sm font-mono-num">
                ${event.magnitude ? 'M ' + event.magnitude : 'N/A'}
              </span>
            </div>
            <div class="col-span-2 pt-1 border-t border-slate-200">
              <span class="text-slate-500 block text-[10px] uppercase font-semibold">Mekanisme Pemicu</span>
              <span class="text-slate-700 text-xs font-medium">
                ${event.causeText}
              </span>
            </div>
            ${event.deaths ? `
              <div class="col-span-2 text-red-700 text-[11px] font-semibold bg-red-50 p-1.5 rounded border border-red-200">
                Korban Jiwa: ± ${Number(event.deaths).toLocaleString('id-ID')} jiwa
              </div>
            ` : ''}
          </div>

          <button onclick="window.appShowDetailModal('${event.id}')" 
                  class="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs">
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
   * Menampilkan titik episentrum gempa BMKG terkini
   */
  setBmkgMarker(gempaData) {
    if (!gempaData || !gempaData.Coordinates) return;

    const [lat, lng] = gempaData.Coordinates.split(',').map(Number);
    if (isNaN(lat) || isNaN(lng)) return;

    if (this.bmkgMarker) {
      this.map.removeLayer(this.bmkgMarker);
    }

    const pulseIcon = L.divIcon({
      className: 'relative flex items-center justify-center',
      html: `
        <div class="relative w-8 h-8 flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-blue-600/30 animate-ping"></div>
          <div class="absolute w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    this.bmkgMarker = L.marker([lat, lng], { icon: pulseIcon }).addTo(this.map);

    const isTsunamiWarning = (gempaData.Potensi || '').toLowerCase().includes('berpotensi tsunami') && 
                             !(gempaData.Potensi || '').toLowerCase().includes('tidak berpotensi');

    const bmkgPopup = `
      <div class="p-1.5 max-w-[280px] font-sans text-slate-800">
        <div class="flex items-center gap-1.5 text-xs font-bold text-blue-600 mb-1">
          <span class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          Pusat Gempa Terkini (BMKG InaTEWS)
        </div>
        <h4 class="font-extrabold text-slate-900 text-sm mb-1">${gempaData.Wilayah}</h4>
        <div class="text-xs space-y-1 mb-2 text-slate-600">
          <div>Waktu: <b class="text-slate-800">${gempaData.Tanggal} ${gempaData.Jam}</b></div>
          <div>Magnitudo: <b class="text-blue-600 font-mono font-bold">M ${gempaData.Magnitude}</b> | Kedalaman: <b class="text-slate-800">${gempaData.Kedalaman}</b></div>
        </div>
        <div class="p-2 rounded-md text-xs font-semibold ${isTsunamiWarning ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}">
          ${gempaData.Potensi}
        </div>
      </div>
    `;

    this.bmkgMarker.bindPopup(bmkgPopup, { className: 'ele-leaflet-popup' });
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
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      this.focusIndonesia();
      return;
    }
    this.map.flyTo([lat, lng], zoom, { duration: 1.2 });
    if (this.bmkgMarker) {
      setTimeout(() => {
        try {
          this.bmkgMarker.openPopup();
        } catch (e) {}
      }, 600);
    }
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
}

window.TsunamiMapController = TsunamiMapController;
