# Rencana Eliminasi Tombol Ganda: Penyatuan Aksi & Laporan ke Top Header Bar [COMPLETED]

Rencana ini telah selesai dieksekusi: seksi duplikasi 'Aksi & Laporan' telah dihapus dari menu Sidebar kiri dan seluruh tombol aksi global (*Upload Shopee*, *Ekspor Excel*, *PDF Laporan*, dan *Reset*) kini terpusat secara konsisten di Top Header Bar.

## Status Eksekusi: Selesai (Verified)

- [x] Menghapus blok JSX 'Aksi & Laporan' dari `Sidebar.tsx`.
- [x] Membersihkan props callback aksi ganda dari `SidebarProps` dan `App.tsx`.
- [x] Memusatkan tombol aksi global di `Header.tsx` (Top Header Bar).
- [x] Verifikasi build via `compile_applet` dan `lint_applet` (100% lolos tanpa error).

---

## 1. Overview & Core Concept

- **Problem**: Pengguna menemukan tombol aksi (*Upload Shopee*, *Ekspor Excel*, dan *PDF Laporan*) muncul di dua tempat sekaligus: di bilah atas (*Top Header*) dan di dalam menu samping kiri (*Sidebar - Seksi Aksi & Laporan*). Hal ini membingungkan dan memakan ruang vertikal di sidebar.
- **Solusi**: 
  1. Menghapus blok 'Aksi & Laporan' beserta tombol *Upload Laporan Shopee*, *Download Laporan PDF*, dan *Ekspor Rekap Excel* dari `Sidebar.tsx`.
  2. Mempertahankan tombol aksi global di `Header.tsx` (Top Header Bar) dengan styling presisi, kontras tinggi, dan responsivitas layar penuh.
  3. Menyederhanakan props di `SidebarProps` dan `App.tsx` agar bersih dari dependensi callback yang tidak lagi digunakan di sidebar.
- **Target Persona**: Penjual Shopee yang membutuhkan antarmuka yang efisien, tidak redundan, dan mudah dioperasikan.

---

## 2. User Experience & Visual Design

### Alur Antarmuka Setelah Perubahan
1. **Sidebar Kiri**:
   - Header toko (*ShopeeTracker · Seller Analytics Hub*)
   - Notifikasi data demo (jika ada)
   - Menu Navigasi Toko murni (*Dashboard*, *Semua Pesanan*, *Tracking Retur*, *Analisis COD*, *Tenggat Kirim*)
   - Footer sistem & kesehatan data lokal (*X Pesanan Tersimpan · Tombol Reset Bersihkan Data*)
   - **Hasil**: Sidebar menjadi sangat rapi, tidak sesak, dan bebas dari tombol redundan.

2. **Top Header Bar**:
   - Kiri: Tombol mobile hamburger + Ikon konteks & judul halaman aktif (*misal: Dashboard Ringkasan · 100 Pesanan*).
   - Kanan: 
     - Badge peringatan mendesak (*PO Mepet*) jika ada tenggat kirim mendekat.
     - Tombol sekunder: *PDF Laporan* (`FileDown`)
     - Tombol sekunder: *Ekspor Excel* (`FileSpreadsheet`)
     - Tombol primer utama: *Upload Shopee* (`UploadCloud` warna oranye khas Shopee)
     - Tombol utilitas: *Reset / Kosongkan Data* (`RotateCcw`)

---

## 3. Key Product Decisions & Trade-Offs

- **Keputusan**: Memusatkan tombol pada Top Header Bar.
  - *Alasan*: Pola baku industri web SaaS (Shopify, Shopee Seller Centre, GitHub). Tombol global selalu terlihat di sudut kanan atas layar tanpa bergantung pada posisi scroll atau status lipatan sidebar.
  - *Trade-Off*: Menghilangkan tombol dari sidebar menyisakan ruang bernapas (whitespace) yang jauh lebih nyaman bagi menu navigasi.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TOP HEADER BAR (Header.tsx)                     │
│  [Logo/Title/Breadcrumb]         [PDF Laporan] [Excel] [Upload Shopee] │
└────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────┬─────────────────────────────────────────┐
│     SIDEBAR (Sidebar.tsx)    │       MAIN CONTENT AREA (App.tsx)       │
│                              │                                         │
│  • Dashboard Ringkasan       │  Active View Component:                 │
│  • Semua Pesanan             │  - DashboardSummary / Visual Analytics  │
│  • Tracking Retur Fisik      │  - OrderTable (Dedicated)               │
│  • Analisis COD & Kurir      │  - ReturnTrackingPanel (Dropdowns)      │
│  • Tenggat Kirim & PO        │  - CodAnalysisPanel                     │
│                              │  - PoDeadlinePanel                      │
│  ──────────────────────────  │                                         │
│  Status: X Pesanan           │                                         │
└──────────────────────────────┴─────────────────────────────────────────┘
```

### Rincian Perubahan Kode:
1. `src/components/Sidebar.tsx`:
   - Hapus blok JSX `Aksi & Laporan` (baris 213–255).
   - Bersihkan props `onOpenUpload`, `onExportExcel`, `onExportPdf` yang tidak lagi dipanggil di sidebar.
2. `src/App.tsx`:
   - Sesuaikan pemanggilan komponen `<Sidebar>` agar tidak lagi menyalurkan props aksi ganda.
3. Verifikasi:
   - Jalankan `compile_applet` dan `lint_applet` bersamaan untuk memastikan 0 error.
