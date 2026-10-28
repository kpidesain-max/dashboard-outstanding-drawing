# Design Dashboard Progress Report (React, jalan lokal)

Isi: aplikasi React (Vite) + server kecil + database berupa file `data/db.json`.
Tab: Progres Proyek, Outstanding Drawing, HPS.

## Kebutuhan
- Node.js 18 atau lebih baru
- Python 3.9+ (hanya untuk sinkronisasi dari Google Sheets)

## Menjalankan dashboard
```
npm install
npm run dev
```
Buka http://localhost:3000. Di Windows, klik dua kali `mulai.bat`.

Mode produksi (lebih ringan): `npm run build` lalu `npm start`.
Port bisa diganti: `PORT=8080 npm start` (Windows PowerShell: `$env:PORT=8080; npm start`).

## Data
Semua data ada di satu file: `data/db.json`. Isi awalnya sama dengan yang ada di versi online:
- 9 proyek dari sheet Proyek Excel (plan dan realisasi masih 0%)
- 5 HPS outstanding dari rekap HPS (status Open)
- `drawings`: kosong sampai sinkronisasi pertama dijalankan

Server menyimpan cadangan satu langkah ke belakang di `data/db.json.bak`. Untuk cadangan rutin, salin `data/db.json`.

## Sinkronisasi drawing dan HPS dari Google Sheets
```
pip install -r sync/requirements.txt
cd sync
python sync_drawing.py config_setting.xlsx 7 --push http://localhost:3000
```
- Skrip membaca sheet Proyek (drawing control tiap proyek) dan sheet HPS di `config_setting.xlsx`, lalu mengirim hasilnya langsung ke dashboard. File `drawing_data.json` juga ikut ditulis.
- Tambah `--every 30` agar diulang otomatis tiap 30 menit (biarkan jendelanya terbuka). Di Windows: `sinkron.bat`.
- Tanpa `--push`, unggah `drawing_data.json` lewat tombol di tab Outstanding Drawing (masuk sebagai Admin).
- Pengaturan PIC (singkatan ke nama) ada di `PIC_NAMA` dalam `sync/sync_drawing.py`.

## Catatan
- Server membuka akses ke jaringan lokal (0.0.0.0), jadi rekan satu jaringan bisa membuka `http://IP-KOMPUTER-ANDA:3000` dan melihat data yang sama.
- Pilihan Admin/Viewer hanya pengaturan tampilan, bukan keamanan. Siapa pun yang bisa membuka alamatnya bisa mengubah data. Jangan buka port ini ke internet.
- Data di tab dashboard disegarkan otomatis tiap 5 detik.
- URL Geomarin V dan KSOT di sheet Proyek sama persis. Cek apakah itu disengaja.

## Struktur
```
server.js        API + penyimpanan data/db.json + Vite (dev) / dist (produksi)
src/App.jsx      seluruh tampilan React
src/api.js       pemanggil API
data/db.json     database
sync/            skrip Python dan config_setting.xlsx
```
