# Menangin! — Festival Tahunan Seni, Olahraga & Akademik

Aplikasi web manajemen festival tahunan berbasis **Nuxt 4**, **Vue 3**, **Tailwind CSS v4**, dan **TiDB Cloud** (`mysql2`) dengan dukungan penuh untuk **Peserta** dan **Panitia**.

## Fitur Utama

- **Landing Page Interaktif:** Informasi 12 cabang lomba, kuota real-time (maks. 15 per lomba), filter kategori & jadwal harian, serta papan pengumuman.
- **Autentikasi Satu Pintu:** Pendaftaran akun khusus **Peserta**, serta login otomatis mendeteksi peran **Peserta** atau **Panitia** berdasarkan email.
- **Dashboard Peserta:**
  - Profil peserta & kartu pass digital.
  - Pendaftaran lomba individu & tim (dengan roster anggota dinamis).
  - Pembayaran pendaftaran dengan overlay metode **Transfer Bank (6 Bank)**, **E-Wallet (5 Aplikasi)**, dan **QRIS**, serta unggah bukti transfer via kamera atau file.
  - Papan pemenang & besaran hadiah yang terhubung langsung dengan panitia.
  - Halaman **Klaim Sertifikat** (`Sertifikat Peserta` & `Sertifikat Pemenang` berbahasa Indonesia — unduh PNG HD, SVG, dan Cetak/PDF) yang hanya terbuka setelah diaktifkan oleh panitia.
- **Dashboard Panitia:**
  - Verifikasi bukti transfer (`Lunas`, `Perlu Diperbaiki`, `Ditolak`) & pembatalan pendaftaran.
  - Pengaturan jadwal (unik per hari), kuota, dan biaya pendaftaran per lomba.
  - Penetapan pemenang **Juara 1–3** beserta **besaran hadiah (Rp)**.
  - Pengiriman notifikasi ke Inbox, **WhatsApp** (WA App / WA Web / otomatis via Gateway API), dan **Email** (Gmail Panitia / otomatis via SMTP).
  - **Rekap keseluruhan peserta & capaian juara** (urut Juara 1 → 2 → 3 → Peserta) dengan ekspor **CSV** & cetak.
  - **Kontrol aktivasi & arsip pratinjau seluruh sertifikat** peserta dan pemenang.

## Setup Lokal

1. Install dependensi:
   ```bash
   npm install
   ```
2. Salin `.env.example` menjadi `.env` dan isi kredensial **TiDB Cloud** (serta opsional SMTP / WhatsApp Gateway):
   ```bash
   cp .env.example .env
   ```
3. Inisialisasi skema & data awal di TiDB Cloud:
   ```bash
   npm run db:setup
   ```
4. Jalankan server development:
   ```bash
   npm run dev
   ```
