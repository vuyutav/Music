# Pemutar Musik

## Fitur yang tersedia

- Memutar file audio lokal dari folder **Music Tracks**
- Menjelajahi dan memutar daftar putar **YouTube Music** (masuk melalui Pengaturan)
- Beralih antara tema merah muda dan biru
- Mengatur volume dengan penggeser dropdown di sebelah tombol pemutaran
- Menyeret, mengubah ukuran, meminimalkan, dan menutup jendela tanpa bingkai

## Instal (disarankan)

### Windows

1. Unduh **`Music Player Setup.exe`** dari output rilis/build (folder `out/`)
2. Jalankan penginstal dan ikuti petunjuknya
3. Jalankan **Pemutar Musik** dari menu Start atau pintasan di desktop

**Opsi portabel:** jalankan **`Music Player.exe`** langsung dari `out/win-unpacked/` — tidak perlu penginstal.

> Jika Windows SmartScreen memperingatkan tentang aplikasi yang tidak ditandatangani, klik **Info lebih lanjut → Jalankan tetap**. Aplikasi ini belum ditandatangani secara kode.

### macOS

Salin **`Music Player.app`** dari `out/mac-arm64/` ke dalam **Aplikasi**, lalu buka (klik kanan → Buka pada peluncuran pertama jika diperlukan).

### Linux

Jalankan AppImage dari `out/`.

## Menggunakan musik lokal

1. Buka pemutar dan klik ikon **pengaturan** (roda gigi)
2. Pilih **Lokal** di bawah musik
3. Klik **buka folder** — ini akan membuka folder **Music Tracks** Anda:
   - Windows: `%USERPROFILE%\Music\Music Tracks`
   - macOS: `~/Music/Music Tracks`
   - Linux: `~/Music/Music Tracks`
4. Salin berkas `.mp3`, `.wav`, `.ogg`, atau `.m4a` ke dalam folder tersebut
5. Klik **refresh** di pengaturan untuk memindai ulang perpustakaan Anda

Judul lagu diambil dari nama berkas.

## Menggunakan YouTube Music

1. Buka **pengaturan → Yt**
2. Klik **masuk** dan lakukan login melalui jendela browser
3. Pilih daftar putar dari daftar
4. Gunakan tombol putar/jeda, berikutnya, dan sebelumnya seperti biasa

Streaming menggunakan audio YouTube di latar belakang — diperlukan koneksi internet.

## Tombol Kontrol

| Tombol | Tindakan |
|---------|--------|
| Putar / Jeda | Tombol tengah |
| Sebelumnya / Berikutnya | Tombol samping |
| Tombol **vol** | Membuka penggeser volume vertikal |
| Bintang pada bilah kemajuan | Seret untuk mencari |
| Roda gigi pengaturan | Tema, sumber musik, daftar putar |
| Area bilah judul | Seret untuk memindahkan jendela |
| Sudut | Ubah ukuran jendela |

## Membangun dari sumber (pengembang)

```bash
npm install
npm run dev          # pengembangan
npm run package      # membangun penginstal + exe portabel (Windows)
npm run package:win  # pembangunan khusus Windows
```

Hasilnya disimpan di folder `out/`.

### Catatan pembangunan Windows

Jika proses pengemasan gagal pada langkah NSIS dengan kesalahan tautan simbolik, aktifkan **Mode Pengembang** di Pengaturan Windows → Sistem → Untuk pengembang, lalu jalankan `npm run package` lagi. Versi portabel di `out/win-unpacked/` dapat dijalankan tanpa penginstal.

## Integrasi opsional

Dukungan untuk Spotify dan Apple Music sudah ada dalam kode sumber, tetapi disembunyikan di antarmuka pengguna hingga pengaturan OAuth selesai. Lihat `SPOTIFY_SETUP.md` dan `APPLE_MUSIC_SETUP.md` jika Anda sedang mengonfigurasi build pengembang.

## Stack teknologi

- Electron + React + Vite
- HTML5 Audio untuk pemutaran
- yt-dlp untuk pencarian audio streaming
“# Music-Player”
