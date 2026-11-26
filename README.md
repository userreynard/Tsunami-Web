# Portal Informasi dan Monitoring Tsunami Indonesia

Dokumentasi teknis arsitektur, integrasi antarmuka pemrograman aplikasi (API), basis data geospasial, dan alur pemrosesan data historis serta pemantauan waktu nyata (real-time) bencana tsunami di Indonesia.

---

1. **Pemantauan Waktu Nyata (Early Warning & Live Alert):** Mengintegrasikan data sensor kegempaan otomatis BMKG InaTEWS untuk mendeteksi ancaman potensi tsunami segera setelah gempa bumi terjadi di perairan nusantara.
2. **Katalog Riwayat Geospasial (Scientific Archives):** Mengintegrasikan basis data tervalidasi NOAA NCEI / WDS untuk merekonstruksi seluruh rekam jejak tsunami laut historis (dari era kuno hingga pembaruan tahun 2026), dilengkapi magnitudo gempa pemicu, ketinggian gelombang (runup), mekanisme penyebab, dan estimasi korban jiwa.

---

## 2. Dokumentasi API dan Sumber Data

### A. API BMKG InaTEWS (Indonesia Tsunami Early Warning System)

* **Penyedia:** Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)
* **Kategori:** Data Terbuka / Pemantauan Gempa dan Peringatan Dini Tsunami
* **Endpoint Asli:** `https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json` 
* **Proxy Internal:** `/api/bmkg`
* **Metode HTTP:** `GET`
* **Frekuensi Pembaruan:** Waktu nyata (diperbarui otomatis setiap terjadi gempa bumi signifikan bermagnitudo 5.0 ke atas atau gempa berpotensi dirasakan)
* **Format Respons:** JSON

#### Parameter Respons Utama:
| Parameter | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `Tanggal` | String | Tanggal kejadian gempa (contoh: "25 Nov 2026") |
| `Jam` | String | Waktu terjadinya gempa dalam zona WIB (contoh: "14:15:20 WIB") |
| `Coordinates` | String | Koordinat lintang dan bujur episentrum gempa |
| `Lintang` | String | Garis lintang episentrum |
| `Bujur` | String | Garis bujur episentrum |
| `Magnitude` | String | Kekuatan gempa bumi dalam skala Richter / magnitudo momen (Mw) |
| `Kedalaman` | String | Kedalaman pusat gempa di bawah permukaan bumi (contoh: "10 km") |
| `Wilayah` | String | Deskripsi lokasi pusat gempa bumi terhadap wilayah terdekat |
| `Potensi` | String | Status potensi bahaya tsunami (contoh: "Tidak berpotensi tsunami" atau "Berpotensi tsunami") |
| `Dirasakan` | String | Skala intensitas Modified Mercalli Intensity (MMI) yang teramati |
| `Shakemap` | String | Nama berkas grafis peta guncangan gempa BMKG |

#### Logika Pemrosesan pada Sistem:
* Data BMKG ditampilkan pada banner notifikasi dinamis di bagian atas seluruh halaman utama.
* Marker gempa BMKG pada peta geospasial disaring secara cerdas: titik hanya ditampilkan pada peta jika parameter `Potensi` terindikasi berpotensi menimbulkan tsunami, untuk mencegah terjadinya kekeliruan pembacaan antara gempa bumi tektonik darat biasa dengan tsunami laut.

---

### B. API NOAA NCEI Tsunami Hazard Service

* **Penyedia:** National Oceanic and Atmospheric Administration (NOAA) / National Centers for Environmental Information (NCEI) & World Data Service (WDS) Marine Geology and Geophysics
* **Kategori:** Basis Data Ilmiah Kejadian Tsunami Global & Indonesia Terverifikasi
* **Endpoint Asli:** `https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/tsunamis/events`
* **Proxy Internal:** `/api/noaa`
* **Metode HTTP:** `GET`
* **Format Respons:** JSON

#### Parameter Permintaan (Query Parameters):
| Parameter | Tipe | Contoh Nilai | Deskripsi |
| :--- | :--- | :--- | :--- |
| `country` | String | `INDONESIA` | Memfilter kejadian tsunami berdasarkan yurisdiksi negara |
| `minYear` | Integer | `1900` | Membatasi tahun awal kejadian untuk memastikan peristiwa modern termuat tanpa terpotong batas paginasi |
| `maxYear` | Integer | `2026` | Membatasi tahun akhir kejadian |
| `minMagnitude` | Float | `6.0` | Memfilter berdasarkan batas bawah kekuatan gempa pemicu |

#### Parameter Respons Utama:
| Parameter | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | Integer | Identifikator unik peristiwa tsunami pada basis data NOAA NCEI |
| `year`, `month`, `day` | Integer | Waktu penanggalan kejadian |
| `hour`, `minute` | Integer | Waktu kejadian dalam Universal Time Coordinated (UTC) |
| `latitude`, `longitude` | Float | Titik koordinat episentrum pemicu atau titik pengamatan tsunami |
| `locationName` | String | Deskripsi nama perairan, teluk, selat, pulau, atau pesisir terdampak |
| `country` | String | Negara lokasi kejadian |
| `maxWaterHeight` | Float | Ketinggian puncak gelombang air maksimum terukur di daratan (satuan: meter) |
| `numRunups` | Integer | Jumlah titik pengamatan jejak sapuan air laut yang disurvei |
| `eqMagnitude` | Float | Magnitudo gempa pemicu (jika pemicunya adalah aktivitas seismik) |
| `eqDepth` | Integer | Kedalaman fokus gempa pemicu (kilometer) |
| `causeCode` | Integer | Kode numerik klasifikasi mekanisme pemicu gelombang tsunami |
| `deaths` | Integer | Total korban jiwa terkonfirmasi akibat tsunami |
| `injuries` | Integer | Jumlah korban luka-luka terkonfirmasi |
| `damageMillionsDollars`| Float | Estimasi total kerugian ekonomi dalam satuan juta dolar AS |

#### Kamus Klasifikasi Kode Penyebab NOAA (`causeCode`):
Sistem memetakan parameter numerik `causeCode` ke dalam terminologi ilmiah bahasa Indonesia yang baku:
* `0`: Penyebab Tidak Diketahui
* `1`: Gempa Bumi Tektonik
* `2`: Diduga Gempa Bumi
* `3`: Gempa Bumi & Longsoran Bawah Laut
* `4`: Erupsi Gunung Api & Gempa Bumi
* `5`: Erupsi Gunung Api Bawah Laut
* `6`: Aktivitas Vulkanik Gunung Api
* `7`: Erupsi Gunung Api & Runtuhan Tebing (Caldera Collapse)
* `8`: Longsoran Bawah Laut (Submarine Landslide)
* `9`: Meteotsunami (Fluktuasi Tekanan Atmosfer Cepat)
* `10`: Ledakan Bawah Laut
* `11`: Fenomena Pasang Surut Astronomis Ekstrem

---

### C. Basis Data Lokal Cadangan (Local High-Availability Fallback)

* **Berkas:** `data/tsunamis.js` & `data/tsunamis.json`
* **Format:** Modul JavaScript Global (`window.FALLBACK_TSUNAMIS`) dan Objek JSON
* **Jumlah Arsip:** 361 kejadian tsunami laut terverifikasi (mencakup data historis abad ke-17 hingga kejadian terkini tahun 2024–2026)
* **Tujuan Arsitektur:** 
  1. Menjamin ketersediaan sistem tanpa henti (High Availability 99.9%).
  2. Mencegah hambatan rendering halaman saat pengguna mengalami pembatasan koneksi, berada pada jaringan seluler berkecepatan rendah, atau saat peladen NOAA sedang mengalami proses pemeliharaan.
  3. Memastikan pemuatan halaman instan (Zero Latency) saat pertama kali diakses.

---

### D. Layanan Ubin Peta Geospasial (Tile Layers)

Peta interaktif menggunakan Leaflet.js yang dikonfigurasi dengan beberapa opsi lapisan ubin peta standar internasional:

1. **Esri World Topographic Map (Lapisan Default):**
   * URL: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`
   * Karakteristik: Menyajikan garis kontur topografi pulau, kedalaman relatif, dan batas administrasi dengan kontras visual tinggi.
2. **Esri World Ocean Base:**
   * URL: `https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}`
   * Karakteristik: Khusus menampilkan batimetri laut dalam, palung laut (trench), dan punggungan dasar laut (oceanic ridge).
3. **Esri World Imagery (Satelit):**
   * URL: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
   * Karakteristik: Citra foto satelit resolusi tinggi untuk memverifikasi kondisi geomorfologi garis pantai.
4. **OpenStreetMap Standard:**
   * URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
   * Karakteristik: Peta jalan dan infrastruktur publik berbasis komunitas terbuka.

---

## 3. Arsitektur Integrasi dan Penanganan CORS

Sebagian besar API resmi pemerintah (seperti BMKG) tidak menyertakan header `Access-Control-Allow-Origin: *` pada respons dasarnya, sehingga permintaan langsung dari JavaScript peramban (client-side fetch) akan diblokir oleh kebijakan keamanan Cross-Origin Resource Sharing (CORS) peramban.

Untuk mengatasi kendala ini secara andal, proyek menerapkan mekanisme proksi dua lapis:

```
[Peramban Klien]
       |
       v
[Proxy Internal (/api/bmkg & /api/noaa)]  <-- Serverless Function / Local Server
       |
       +--> BMKG InaTEWS API (https://data.bmkg.go.id)
       |
       +--> NOAA NCEI API (https://www.ngdc.noaa.gov)
```

1. **Lingkungan Produksi (Vercel Serverless Function):**
   * Berkas `api/bmkg.js` dan `api/noaa.js` dijalankan sebagai Node.js Serverless Function di edge network.
   * Proksi menyuntikkan header `Access-Control-Allow-Origin: *` serta mengatur mekanisme caching peramban (`s-maxage=60` untuk BMKG dan `s-maxage=3600` untuk NOAA) guna menghemat kuota transmisi dan mengurangi beban peladen sumber.

2. **Lingkungan Pengembangan Lokal (`local-server.js`):**
   * Peladen lokal bawaan Node.js mengeksekusi modul `api/bmkg.js` dan `api/noaa.js` secara langsung tanpa memerlukan dependensi npm tambahan, menghasilkan perilaku yang identik dengan lingkungan produksi.

---

## 4. Struktur Direktori

```
tsunami-indonesia/
├── api/                    # Vercel Serverless Functions (Proxy API)
│   ├── bmkg.js             # Proksi endpoint resmi BMKG InaTEWS
│   └── noaa.js             # Proksi endpoint resmi NOAA NCEI Tsunami
├── assets/                 # Berkas gambar latar belakang dan ikon
│   └── hero-waves.jpg      # Latar belakang grafis gelombang samudra
├── css/
│   └── style.css           # Lembar gaya tema Deep Oceanic & konfigurasi Leaflet
├── data/                   # Basis data cadangan terpadu (Fallback Cache)
│   ├── tsunamis.js         # Format modul JavaScript untuk browser offline
│   └── tsunamis.json       # Format berkas mentah JSON
├── js/
│   ├── api.js              # Modul klien pemanggil dan penormalisasi API
│   ├── app.js              # Logika kontrol UI, paginasi, modal, dan checklist
│   └── map.js              # Pengendali peta geospasial Leaflet dan marker
├── index.html              # Halaman beranda & statistik bencana nasional
├── peta.html               # Halaman peta persebaran geospasial interaktif
├── katalog.html            # Halaman katalog tabel dan kartu riwayat kejadian
├── mitigasi.html           # Panduan mitigasi, tutur Smong, dan protokol 20-20-20
├── kontak.html             # Direktori nomor darurat nasional 24 jam
├── local-server.js         # Peladen web lokal bawaan Node.js
├── vercel.json             # Konfigurasi perutean peladen produksi Vercel
└── README.md               # Dokumentasi teknis sistem
```

---

## 5. Menjalankan Proyek Secara Lokal

Proyek ini dibangun menggunakan teknologi Vanilla JavaScript, CSS native, Tailwind CSS CDN, dan Node.js tanpa memerlukan instalasi paket eksternal (zero external npm dependencies).

### Prasyarat:
* Node.js versi 14.0 atau yang lebih baru telah terpasang pada komputer Anda.

### Langkah Menjalankan:
1. Buka terminal atau Command Prompt pada direktori proyek:
   ```bash
   cd D:\tsunami-indonesia
   ```
2. Jalankan peladen web lokal bawaan:
   ```bash
   node local-server.js
   ```
3. Buka peramban web dan navigasikan ke alamat:
   ```
   http://localhost:3000
   ```

---

## 6. Hak Cipta dan Lisensi Sumber Data

* **Data Gempa Bumi Real-time:** Badan Meteorologi, Klimatologi, dan Geofisika Republik Indonesia (BMKG).
* **Data Riwayat Tsunami Global:** National Oceanic and Atmospheric Administration (NOAA) / National Centers for Environmental Information (NCEI), Amerika Serikat.
* **Ubin Peta Dasar (Basemaps):** Environmental Systems Research Institute (Esri) dan kontributor OpenStreetMap.
* **Hak Cipta Kode Program:** Dikembangkan secara terbuka untuk tujuan edukasi keselamatan publik, kesiapsiagaan kebencanaan pesisir, dan penelitian geospasial di Indonesia.
