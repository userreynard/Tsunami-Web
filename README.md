# 🌊 Portal Monitoring & Informasi Tsunami Indonesia

Website interaktif, informatif, dan elegan untuk memantau kejadian tsunami di **Indonesia** dan **seluruh dunia**, dilengkapi peta geospasial titik kejadian, status peringatan dini real-time BMKG, edukasi sains bahaya tsunami, panduan mitigasi keselamatan pesisir, serta kontak darurat bencana.

Dibuat menggunakan teknologi yang **sangat mudah dipahami** (HTML5 + Tailwind CSS + Leaflet.js + Vanilla JavaScript modern), tanpa perlu build tools yang rumit.

---

## 🚀 Cara Menjalankan Website

Anda dapat langsung membuka website ini dengan beberapa cara mudah:

### Cara 1: Buka Langsung (Paling Mudah)
1. Buka folder `D:\tsunami-indonesia\`.
2. Klik ganda file **`index.html`** atau klik ganda **`start_website.bat`**.
3. Website akan langsung terbuka di browser (Chrome, Edge, Firefox, dll) tanpa memerlukan instalasi apapun!

### Cara 2: Menggunakan Node.js Local Server (Opsional)
Buka terminal / PowerShell di folder ini lalu ketik:
```bash
npm start
# atau
npx serve .
```
Lalu buka alamat `http://localhost:3000` di browser Anda.

---

## ✨ Fitur-Fitur Utama

### 1. 🗺️ Peta Interaktif Titik Tsunami (Leaflet.js)
- **Visualisasi Geospasial**: Menampilkan ratusan titik koordinat kejadian tsunami historis dan modern di Indonesia dan dunia.
- **Marker Berkode Warna**:
  - 🔴 **Merah**: Gelombang katastropik (&gt; 5 meter / korban jiwa tinggi)
  - 🟠 **Oranye**: Gelombang sedang (1.0 – 5.0 meter)
  - 🟡 **Kuning**: Gelombang minor (&lt; 1.0 meter)
  - 🔵 **Biru Berkedip (Radar Pulse)**: Pusat gempa terkini BMKG (InaTEWS)
- **Popup Informatif**: Klik pada titik mana pun untuk melihat nama daerah, tahun, kekuatan gempa pemicu ($M_w$), tinggi gelombang maksimum, dan perkiraan korban jiwa.
- **Filter Cepat**: Filter tampilan untuk "Hanya Indonesia", "Internasional", atau "Gelombang Tinggi (&ge; 3m)".
- **Fokus Kamera Otomatis**: Tombol 1-klik untuk fokus ke Kepulauan Indonesia atau Kawasan Cincin Api Pasifik (Global Ring of Fire).

### 2. ⚡ Integrasi API Gratis & Terbuka
- **NOAA NCEI Global Hazards API**: Mengambil basis data rekaman tsunami terverifikasi dari *National Oceanic and Atmospheric Administration*.
- **BMKG InaTEWS Open Data**: Mengambil informasi gempa bumi terkini dan potensi tsunami langsung dari Badan Meteorologi, Klimatologi, dan Geofisika Indonesia.
- **Dukungan Mode Offline / Cepat**: Terintegrasi dengan 380+ basis data arsip kejadian terverifikasi (`data/tsunamis.js`) sehingga website tetap berfungsi kilat 0-milidetik meski sedang offline atau koneksi lambat.

### 3. 📊 Katalog & Pencarian Kejadian Tsunami
- Pencarian cerdas secara real-time berdasarkan: nama pulau/kota, negara, tahun, atau mekanisme pemicu.
- Kartu ringkasan terperinci dengan tombol **"Lihat di Peta"** (otomatis melakukan animasi *fly-to* ke koordinat terkait) dan **"Detail Lengkap"** (menampilkan modal dialog).

### 4. ⚠️ Informasi Sains & Bahaya Tsunami
- Penjelasan ilmiah mengenai anatomi gelombang tsunami dan mengapa ia jauh lebih destruktif dibanding gelombang ombak angin biasa.
- 3 Mekanisme pemicu utama di Indonesia:
  1. **Dislokasi Megathrust Tektonik** (Subduksi Indo-Australia vs Eurasia).
  2. **Longsoran Bawah Laut** (*Submarine Landslide*, contoh: Palu 2018).
  3. **Erupsi Gunung Api Bawah Laut** (*Volcanic Tsunami*, contoh: Krakatau 1883 & 2018, Ruang 2024).

### 5. 🛡️ Panduan Mitigasi & Kesiapsiagaan Pesisir
- **Rumus Emas 20 - 20 - 20**:
  - **20 Detik**: Gempa terasa terus-menerus selama 20 detik atau lebih.
  - **20 Menit**: Perkiraan waktu sebelum gelombang pertama tiba di pantai.
  - **20 Meter**: Lari segera ke tempat dengan ketinggian minimal 20 meter dpl atau gedung TES lantai 3 ke atas.
- **Tanda-tanda Alami Tsunami**: Air laut surut drastis, gemuruh suara pesawat jet dari laut, aroma belerang menyengat, perilaku hewan anomali.
- **Checklist Interaktif Tas Siaga Bencana (Emergency Go-Bag)**: Daftar 8 item vital darurat yang bisa dicentang pengguna secara interaktif dengan progress bar yang tersimpan di memori browser (*localStorage*).

### 6. 🚨 Sistem Peringatan Dini BMKG (InaTEWS)
- Edukasi 3 status resmi peringatan dini tsunami BMKG:
  - **AWAS (Merah)**: Tinggi gelombang &gt; 3 meter &rarr; Evakuasi total segera.
  - **SIAGA (Oranye)**: Tinggi gelombang 0.5 – 3 meter &rarr; Evakuasi warga pesisir.
  - **WASPADA (Kuning)**: Tinggi gelombang &lt; 0.5 meter &rarr; Jauhi pantai & sungai.

### 7. 📞 Kontak Darurat & Hotline Bencana Indonesia
Nomor darurat bebas pulsa yang siap dihubungi 24 jam:
- **112**: Panggilan Darurat Tunggal Nasional (NTPD)
- **115**: BASARNAS (Pencarian & Pertolongan SAR)
- **196**: BMKG (Info Cuaca, Gempa & Tsunami)
- **110**: Kepolisian RI
- **119**: Ambulans & Layanan Medis
- **113**: Pemadam Kebakaran

---

## 📁 Struktur Berkas Proyek

```text
D:\tsunami-indonesia\
├── index.html            # Berkas HTML utama (struktur halaman, navigasi, & konten)
├── css\
│   └── style.css         # Styling khusus, efek kaca (glassmorphism), & animasi pulse
├── js\
│   ├── api.js            # Layanan integrasi API NOAA & BMKG dengan error handling
│   ├── map.js            # Pengontrol peta Leaflet.js, marker, popup, & zoom animasi
│   └── app.js            # Logika interaksi UI, filter data, checklist tas, & modal
├── data\
│   ├── tsunamis.json     # Data mentah kejadian tsunami Indonesia & dunia
│   └── tsunamis.js       # Format JavaScript untuk kompatibilitas file:// langsung
├── package.json          # Konfigurasi proyek & perintah npm
├── start_website.bat     # Pintasan 1-klik untuk pengguna Windows
└── README.md             # Panduan dokumentasi lengkap
```

---

## 🛠️ Framework & Teknologi yang Digunakan

1. **HTML5 Semantik**: Struktur dokumen bersih, ramah SEO, dan mudah dimodifikasi.
2. **Tailwind CSS (CDN)**: Framework CSS modern utilitas yang sangat mudah dipelajari (`p-4`, `flex`, `rounded-2xl`, `bg-slate-900`).
3. **Leaflet.js (v1.9.4)**: Library peta open-source paling populer, ringan, responsif di HP/desktop, dan tanpa batasan token/API key berbayar.
4. **Vanilla JavaScript (ES6+)**: Kode ditulis dengan fungsi-fungsi terpisah dan komentar bahasa Indonesia yang jelas, sehingga sangat ramah bagi pemula maupun pengembang tingkat lanjut.

---

Dibuat untuk tujuan edukasi, mitigasi risiko bencana, dan keterbukaan informasi publik bagi masyarakat Indonesia.
