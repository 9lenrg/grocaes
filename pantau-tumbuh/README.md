# Pantau Tumbuh

Skrining awal pertumbuhan anak usia 0–5 tahun berdasarkan Standar Pertumbuhan Anak WHO (2006).
Mendukung **SDG 2** (tanpa kelaparan, termasuk menekan stunting) dan **SDG 3** (kesehatan).

Seluruh perhitungan berjalan di browser, tanpa server, tanpa akun, dan bisa dipakai offline (PWA).
Data anak hanya tersimpan di perangkat pengguna.

> Aplikasi ini adalah **skrining awal, bukan diagnosis**. Hasil perlu dipastikan tenaga kesehatan.

## Menjalankan

```bash
# 1. Pasang data acuan WHO (sekali saja, lihat bagian berikut)
pip install openpyxl
python3 tools/build_data.py folder-berisi-xlsx-who   # menulis data/who-lms.json

# 2. Jalankan
python3 -m http.server 8080      # lalu buka http://localhost:8080

# 3. Tes mesin hitung
npm test                          # Node 18+
```

## Data acuan WHO

`data/who-lms.json` sudah memuat kelima tabel (laki-laki dan perempuan). File `.xlsx` sumber yang dilampirkan ada di `data/sumber-who/`.

Tabel **z-score** (.xlsx, versi bulanan) dari WHO Child Growth Standards, laki-laki dan perempuan,
tanpa mengganti nama file. Total 10 file:

| File WHO | Kunci | Dipakai untuk |
|---|---|---|
| `lhfa_{boys,girls}_0-to-2-years_zscores.xlsx` | `lfa` | panjang menurut umur, 0–2 th (TB/U) |
| `lhfa_{boys,girls}_2-to-5-years_zscores.xlsx` | `hfa` | tinggi menurut umur, 2–5 th (TB/U) |
| `wfa_{boys,girls}_0-to-5-years_zscores.xlsx` | `wfa` | berat menurut umur (BB/U) |
| `wfl_{boys,girls}_0-to-2-years_zscores.xlsx` | `wfl` | berat menurut panjang, 0–2 th (BB/TB) |
| `wfh_{boys,girls}_2-to-5-years_zscores.xlsx` | `wfh` | berat menurut tinggi, 2–5 th (BB/TB) |

`tools/build_data.py` mengubahnya menjadi `data/who-lms.json`, lalu **memverifikasi** setiap tabel:
nilai SD yang dihitung ulang dari L, M, S harus sama dengan kolom SD3neg..SD3 yang dicetak WHO
di file yang sama (selisih maksimum 0,05 = pembulatan 1 desimal WHO).

Tanpa data, aplikasi menampilkan peringatan dan tidak menghitung apa pun (sengaja, agar tidak pernah
memakai angka tebakan). Indikator yang tabelnya belum ada ditandai "belum terpasang".

**Catatan akurasi:** tabel bulanan dipakai dengan interpolasi linear antar bulan (umur hari dibagi
30,4375). Selisihnya dengan tabel harian WHO sangat kecil, tetapi bila ingin 100% sama dengan WHO Anthro,
gunakan tabel "expanded" harian; mesin hitung sudah mendukung satuan `day`.

## Struktur

```
index.html            halaman tunggal dengan 4 tampilan (home, kalkulator, edukasi, konsultasi)
css/
  base.css            warna, reset, tipografi, fokus
  layout.css          header, navigasi, halaman, kartu, footer
  components.css      formulir, tombol, banner, utilitas
  results.css         hasil, kurva, riwayat
  pages.css           home, edukasi, rekomendasi makan, konsultasi
js/
  main.js             titik masuk, menyambungkan modul
  config.js           kontak konsultasi (nomor WhatsApp, email, jam layanan)
  core/               logika murni tanpa DOM: zscore.js, data.js, storage.js
  i18n/               index.js (mesin), id.js, en.js (kamus)
  content/            articles.js (artikel), diet.js (data rekomendasi makan)
  ui/                 dom, format, state, form, result, chart, diet, history,
                      edu, consult, router
sw.js                 cache offline
tools/build_data.py   konversi xlsx WHO -> JSON
tests/                tes otomatis
```

## Metode singkat

- z = ((y/M)^L − 1) / (L·S); untuk L = 0 dipakai ln(y/M)/S.
- Untuk BB/U dan BB/TB, nilai |z| > 3 dikoreksi sesuai aturan WHO.
- Panjang berbaring dan tinggi berdiri dikoreksi 0,7 cm bila tidak sesuai usia (batas 24 bulan).
- Nilai di luar batas biologis WHO (TB/U ±6, BB/U −6/+5, BB/TB ±5) ditandai, tidak diklasifikasi.
- Ambang status gizi mengikuti WHO dan Permenkes RI No. 2 Tahun 2020.

## Menambah bahasa atau negara

- Bahasa: tambahkan satu file kamus di `js/i18n/` lalu daftarkan di `js/i18n/index.js`. Artikel (`js/content/articles.js`) dan rekomendasi makan (`js/content/diet.js`) memakai pasangan `{ id, en }` per bahasa.
- Ambang dan istilah per negara: ubah `classify()` di `js/core/zscore.js` dan label `status.*` di `js/i18n/`.
