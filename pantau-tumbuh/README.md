# GROCAES

Aplikasi web untuk **skrining awal pertumbuhan anak usia 0–5 tahun** berdasarkan Standar Pertumbuhan Anak WHO (2006). GROCAES (nama proyek: `pantau-tumbuh`) juga menyediakan artikel edukasi tentang gizi dan pencegahan stunting serta konsultasi daring lewat WhatsApp. Aplikasi ini mendukung **SDG 2** (tanpa kelaparan, termasuk menekan stunting) dan **SDG 3** (kesehatan dan kesejahteraan).

> **Penting:** GROCAES adalah alat **skrining awal, bukan diagnosis**. Hasilnya perlu dipastikan oleh tenaga kesehatan (bidan, dokter, atau puskesmas).

## Daftar isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Menjalankan aplikasi](#menjalankan-aplikasi)
- [Panduan penggunaan](#panduan-penggunaan)
- [Pengujian](#pengujian)
- [Konfigurasi](#konfigurasi)
- [Pengembangan](#pengembangan)
- [Data acuan WHO](#data-acuan-who)
- [Metode perhitungan](#metode-perhitungan)
- [Struktur proyek](#struktur-proyek)
- [Publikasi (deployment)](#publikasi-deployment)
- [Privasi](#privasi)
- [Pemecahan masalah](#pemecahan-masalah)
- [Catatan](#catatan)

## Fitur

| Halaman | Fungsi |
| --- | --- |
| **Beranda** | Penjelasan singkat tentang stunting, tanda-tandanya, dan enam cara mencegahnya. |
| **Kalkulator Gizi** | Menghitung status gizi dari jenis kelamin, tanggal lahir, tanggal ukur, berat, dan panjang/tinggi badan. Hasilnya berupa tiga indikator (TB/U, BB/U, BB/TB) dengan z-score, kesimpulan keseluruhan, kurva pertumbuhan, dan rekomendasi pola makan sesuai usia dan kondisi anak. |
| **Edukasi** | 18 artikel tentang stunting, MPASI, ASI eksklusif, gizi ibu hamil, imunisasi, kebersihan, dan cara mengukur anak. Tiap artikel punya daftar isi, tautan artikel sebelumnya/berikutnya, dan tombol kembali bulat ke daftar artikel. |
| **Konsultasi** | Formulir yang menyusun pesan sopan lalu membuka WhatsApp dengan pesan yang sudah terisi. Hasil pengukuran terakhir dari kalkulator dapat disertakan. |

Fitur pendukung:

- **Dua bahasa** (Indonesia dan Inggris) lewat tombol **ID / EN**; pilihan bahasa diingat di peramban.
- **Responsif**: nyaman dipakai di HP, tablet, dan komputer, serta mengikuti mode terang/gelap perangkat.
- **PWA**: dapat dipasang ke layar utama dan tetap berjalan tanpa internet setelah dibuka sekali.
- **Riwayat pengukuran** sementara dengan opsi simpan ke perangkat dan cetak/simpan PDF.
- **Aksesibilitas**: target sentuh minimal 44 px, label formulir, fokus keyboard yang jelas, dan animasi yang otomatis berhenti bagi pengguna yang memilih "kurangi gerakan".

## Teknologi

- HTML, CSS, dan JavaScript (ES modules) murni. **Tanpa framework, tanpa proses build, tanpa dependensi.**
- Service worker dan Web App Manifest untuk PWA.
- Node.js (pengujian bawaan `node --test`) dan Python 3 (hanya untuk alat bantu dan server lokal).

## Prasyarat

| Kebutuhan | Versi | Untuk apa |
| --- | --- | --- |
| Peramban modern (Chrome, Edge, Firefox, Safari) | terbaru | Membuka aplikasi |
| Python 3 | 3.8 atau lebih baru | Server statis lokal |
| Node.js | 18 atau lebih baru | Menjalankan tes (opsional) |
| `openpyxl` (paket Python) | terbaru | Membuat ulang data WHO (opsional) |

Aplikasi tidak bisa dibuka dengan klik dua kali pada `index.html` (`file://`) karena memakai ES modules dan memuat berkas data lewat `fetch`. Gunakan server statis seperti pada langkah di bawah.

## Instalasi

Tidak ada langkah `npm install` karena proyek ini tidak memiliki dependensi.

1. Dapatkan kode proyek, lalu masuk ke foldernya.

   ```bash
   # bila dari berkas zip
   unzip GROCAES-edukasi.zip
   cd pantau-tumbuh

   # bila dari Git
   git clone <url-repositori>
   cd pantau-tumbuh
   ```

2. Pastikan Python 3 terpasang.

   ```bash
   python3 --version
   ```

3. (Opsional) Pastikan Node.js 18+ terpasang bila ingin menjalankan tes.

   ```bash
   node --version
   ```

## Menjalankan aplikasi

1. Jalankan server statis dari folder `pantau-tumbuh`:

   ```bash
   python3 -m http.server 8080
   ```

   Perintah yang sama tersedia sebagai `npm run serve`.

2. Buka **<http://localhost:8080>** di peramban.

3. Hentikan server dengan `Ctrl + C`.

Untuk mencoba dari HP di jaringan Wi-Fi yang sama, buka `http://<alamat-IP-komputer>:8080` di HP. Perlu diingat bahwa mode offline (service worker) hanya aktif di `https://` atau `localhost`, sehingga tidak aktif pada alamat IP biasa.

## Panduan penggunaan

### Menghitung status gizi

1. Buka menu **Kalkulator Gizi**.
2. Isi nama anak (opsional), pilih jenis kelamin, lalu isi tanggal lahir dan tanggal pengukuran. Umur anak dihitung otomatis.
3. Isi berat badan (kg) dan panjang/tinggi badan (cm). Pilih posisi ukur (berbaring atau berdiri); posisi disarankan otomatis menurut umur.
4. Tekan **Hitung status gizi**. Hasil muncul di bawah formulir.

Cara membaca hasil: tiap indikator diberi tingkat **✓ normal**, **• perlu dipantau**, **! perlu perhatian**, atau **‼ segera ke tenaga kesehatan**. Kesimpulan keseluruhan mengikuti tingkat terburuk. Dari hasil, Anda dapat membuka **Lihat riwayat** (data lengkap beserta grafik), **Simpan ke perangkat**, atau **Cetak/simpan PDF**.

Agar hasil akurat, ukur anak dengan benar. Panduannya ada di artikel *Cara mengukur berat dan tinggi anak dengan benar* pada halaman Edukasi.

### Membaca artikel edukasi

1. Buka menu **Edukasi** dan pilih salah satu kartu artikel.
2. Gunakan **daftar isi** untuk melompat ke bagian tertentu.
3. Gunakan tombol **panah bulat** di bagian atas untuk kembali ke daftar artikel, atau tautan **Sebelumnya/Berikutnya** di bagian bawah untuk pindah artikel.

### Berkonsultasi

1. Buka menu **Konsultasi**.
2. Isi nama, umur anak (opsional), topik, dan pertanyaan. Bila sudah menghitung di kalkulator, centang opsi untuk menyertakan hasil pengukuran terakhir (termasuk nama anak).
3. Tekan **Kirim pesan**. WhatsApp terbuka dengan pesan yang sudah tersusun; kirim dari sana.

### Berganti bahasa

Tekan **ID / EN** di menu atas. Seluruh teks, termasuk artikel dan rekomendasi makan, berganti bahasa.

## Pengujian

```bash
npm test
```

Perintah ini menjalankan 22 tes otomatis (`node --test tests/*.test.js`):

- `tests/zscore.test.js`: rumus z-score, koreksi nilai ekstrem, pencarian dan interpolasi tabel, klasifikasi status gizi, validasi input, dan pembuatan grafik.
- `tests/who-data.test.js`: kecocokan `data/who-lms.json` dengan berkas `.xlsx` WHO, rentang tabel, dan nilai L, M, S yang valid. Tes ini dilewati otomatis bila data WHO tidak ada.

## Konfigurasi

### Nomor konsultasi

Ubah `js/config.js`:

```js
export const CONSULT = {
  whatsapp: '6289670075983', // format internasional tanpa +
  hours: { id: 'Senin–Jumat, 08.00–16.00 WIB', en: 'Monday–Friday, 08:00–16:00 WIB' },
};
```

Bila `whatsapp` dikosongkan, tombol "Kirim pesan" tidak membuka WhatsApp dan menampilkan catatan bahwa nomor belum diatur.

### Versi cache offline

Setelah mengubah berkas aplikasi (JS, CSS, HTML, gambar), naikkan nomor versi `CACHE` di `sw.js` (misalnya `pantau-tumbuh-v33` menjadi `v34`). Tanpa ini, pengguna lama bisa terus melihat versi lama dari cache. Bila menambah berkas baru, daftarkan juga di larik `SHELL` pada `sw.js` agar ikut tersedia offline.

## Pengembangan

### Menambah atau mengubah artikel

Edit `js/content/articles.js`. Tiap artikel berbentuk:

```js
{
  slug: 'contoh-artikel',   // alamat: #/edukasi/contoh-artikel
  min: 3,                   // perkiraan menit baca
  id: { cat: 'Topik', title: 'Judul', summary: 'Ringkasan', body: [/* isi */] },
  en: { cat: 'Topic', title: 'Title', summary: 'Summary', body: [/* content */] },
}
```

Aturan isi `body`:

| Bentuk | Hasil |
| --- | --- |
| teks biasa | paragraf |
| teks berawalan `##` dan spasi | subjudul (otomatis masuk daftar isi) |
| larik `[...]` | daftar butir; bila semua butir berformat `Label: isi`, labelnya dicetak tebal |

Artikel muncul di daftar sesuai urutannya dalam berkas. Isi bahasa Indonesia dan Inggris harus sama-sama diisi.

### Menambah bahasa atau negara

- **Bahasa:** tambahkan berkas kamus di `js/i18n/`, daftarkan di `js/i18n/index.js`, lalu tambahkan pasangan bahasa baru pada artikel (`js/content/articles.js`) dan rekomendasi makan (`js/content/diet.js`).
- **Ambang dan istilah per negara:** ubah `classify()` di `js/core/zscore.js` dan label `status.*` di `js/i18n/`.

### Gaya kode

- JavaScript: ES modules, indentasi 2 spasi, tanda kutip tunggal, titik koma, dan komentar dalam bahasa Indonesia.
- CSS: satu deklarasi per baris, satu selektor per baris, indentasi 2 spasi, dan warna dasar disimpan sebagai variabel di `css/base.css`.
- Hindari menulis data anak ke `localStorage` atau `sessionStorage` (lihat [Privasi](#privasi)).

## Data acuan WHO

`data/who-lms.json` memuat lima tabel (laki-laki dan perempuan) dalam bentuk parameter LMS. Berkas sumber `.xlsx` ada di `data/sumber-who/`.

| Berkas WHO | Kunci | Dipakai untuk |
| --- | --- | --- |
| `lhfa_{boys,girls}_0-to-2-years_zscores.xlsx` | `lfa` | panjang menurut umur, 0–2 tahun (TB/U) |
| `lhfa_{boys,girls}_2-to-5-years_zscores.xlsx` | `hfa` | tinggi menurut umur, 2–5 tahun (TB/U) |
| `wfa_{boys,girls}_0-to-5-years_zscores.xlsx` | `wfa` | berat menurut umur (BB/U) |
| `wfl_{boys,girls}_0-to-2-years_zscores.xlsx` | `wfl` | berat menurut panjang, 0–2 tahun (BB/TB) |
| `wfh_{boys,girls}_2-to-5-years_zscores.xlsx` | `wfh` | berat menurut tinggi, 2–5 tahun (BB/TB) |

Untuk membuat ulang JSON dari berkas WHO:

```bash
pip install openpyxl
python3 tools/build_data.py data/sumber-who   # menulis data/who-lms.json
```

Skrip ini memverifikasi tiap tabel: nilai SD yang dihitung ulang dari L, M, S harus sama dengan kolom `SD3neg`..`SD3` di berkas WHO (selisih maksimum 0,05). Bila `who-lms.json` tidak ada, aplikasi menampilkan peringatan dan tidak menghitung apa pun, sehingga tidak pernah memakai angka tebakan.

## Metode perhitungan

- z = ((y/M)^L − 1) / (L·S); untuk L = 0 dipakai ln(y/M) / S.
- Tabel bulanan dipakai dengan interpolasi linear antar bulan (umur dalam hari dibagi 30,4375). Selisihnya dengan tabel harian WHO sangat kecil.
- Untuk BB/U dan BB/TB, nilai |z| > 3 dikoreksi sesuai aturan WHO.
- Panjang berbaring dan tinggi berdiri dikoreksi 0,7 cm bila posisi ukur tidak sesuai umur (batas 24 bulan).
- Nilai di luar batas biologis WHO (TB/U ±6, BB/U −6/+5, BB/TB ±5) ditandai dan tidak diklasifikasi.
- Rentang input: berat 0,5–30 kg, panjang/tinggi 35–135 cm. BB/TB dihitung untuk 45–110 cm (0–2 tahun) dan 65–120 cm (2–5 tahun).
- Ambang status gizi mengikuti WHO dan Permenkes RI No. 2 Tahun 2020.

## Struktur proyek

```text
pantau-tumbuh/
├── index.html            halaman tunggal dengan 4 tampilan (home, kalkulator, edukasi, konsultasi)
├── manifest.json         manifest PWA
├── sw.js                 service worker (cache offline)
├── package.json          skrip npm: test dan serve
├── logofix.png           logo
├── cover.jpeg            gambar beranda
├── img/                  ikon fitur beranda; img/tanda/ berisi ikon tanda stunting
├── css/
│   ├── base.css          warna, reset, tipografi, fokus
│   ├── layout.css        header, menu, halaman, kartu, footer, transisi antarhalaman
│   ├── components.css    formulir, tombol, banner, utilitas
│   ├── results.css       hasil, kurva, tabel riwayat
│   └── pages.css         beranda, edukasi, rekomendasi makan, konsultasi, dialog riwayat, cetak
├── js/
│   ├── main.js           titik masuk, menyambungkan modul
│   ├── config.js         kontak konsultasi
│   ├── core/             logika tanpa DOM: zscore.js, data.js, storage.js
│   ├── i18n/             index.js (mesin terjemahan), id.js dan en.js (kamus)
│   ├── content/          articles.js (artikel edukasi), diet.js (rekomendasi makan)
│   └── ui/               dom, format, state, form, result, measure, chart, diet,
│                         history, edu, consult, router
├── data/
│   ├── who-lms.json     tabel acuan WHO yang dipakai aplikasi
│   └── sumber-who/      berkas .xlsx asli WHO
├── tools/build_data.py   konversi .xlsx WHO menjadi JSON
└── tests/                tes otomatis (zscore.test.js, who-data.test.js)
```

Alur singkat: `index.html` memuat `js/main.js` → memuat data WHO (`core/data.js`) → `ui/router.js` menampilkan halaman sesuai hash URL (`#/home`, `#/kalkulator`, `#/edukasi`, `#/konsultasi`) → `ui/form.js` dan `ui/result.js` menghitung dengan `core/zscore.js` dan menampilkan hasilnya.

## Publikasi (deployment)

Karena berupa situs statis, seluruh isi folder `pantau-tumbuh` cukup diunggah ke layanan hosting statis (GitHub Pages, Netlify, Cloudflare Pages, atau server web biasa). Syaratnya:

- Sajikan lewat **HTTPS** agar service worker dan pemasangan PWA berfungsi.
- Pastikan `data/who-lms.json` ikut terunggah dan dapat diakses.
- Naikkan versi `CACHE` di `sw.js` pada setiap rilis.

## Privasi

- Data anak **tidak pernah dikirim ke server** dan tidak ditulis ke `localStorage` maupun `sessionStorage`.
- Riwayat pengukuran hanya ada di memori halaman dan **hilang saat tab ditutup atau halaman dimuat ulang**. Berpindah menu di dalam aplikasi tidak memuat ulang halaman, sehingga riwayat tetap ada selama pengguna masih di aplikasi. Pengelolanya ada di `js/core/storage.js`.
- Pesan konsultasi tidak disimpan di situs; pesan hanya dikirim lewat WhatsApp atas tindakan pengguna.
- Satu-satunya data yang diingat peramban adalah pilihan bahasa (`pantau-tumbuh:lang`).
- Kolom formulir memakai `autocomplete="off"` agar peramban tidak mengisi ulang data anak.

## Pemecahan masalah

| Masalah | Penyebab dan solusi |
| --- | --- |
| Halaman kosong atau error modul saat membuka `index.html` langsung | Dibuka lewat `file://`. Jalankan lewat server statis (lihat [Menjalankan aplikasi](#menjalankan-aplikasi)). |
| Muncul peringatan "Data acuan WHO belum terpasang" | `data/who-lms.json` tidak ada atau gagal dimuat. Buat ulang dengan `tools/build_data.py` atau pastikan berkasnya terunggah. |
| Perubahan kode tidak muncul di peramban | Cache service worker. Naikkan versi `CACHE` di `sw.js`, lalu muat ulang keras (Ctrl + Shift + R) atau hapus data situs. |
| Mode offline tidak berfungsi | Service worker hanya aktif di `https://` atau `localhost`, dan aplikasi perlu dibuka sekali saat online. |
| Tombol "Kirim pesan" tidak membuka WhatsApp | Nomor di `js/config.js` kosong, atau peramban memblokir jendela baru. Isi nomor dan izinkan pop-up. |
| Port 8080 sudah terpakai | Gunakan port lain, misalnya `python3 -m http.server 8081`. |

## Catatan

Konten edukasi dan rekomendasi makan bersifat umum dan bukan resep medis. Untuk anak yang sakit, lemas, atau menunjukkan tanda bahaya, segera ke puskesmas atau fasilitas kesehatan terdekat.
