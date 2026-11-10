# Shopee Order & Return Tracker (Rekap Pesanan & Retur Seller Centre)

Aplikasi dashboard operasional seller untuk mengimpor, merekap, dan memantau status pesanan serta pengembalian barang (retur/pembatalan) Shopee secara otomatis dari file berkala Seller Centre (.xlsx dan .csv), tanpa perlu setup API yang rumit.

## User Review & Critical Decisions

> [!IMPORTANT]
> Ringkasan keputusan berdasarkan konfirmasi Anda di fase klarifikasi:
> - **Format File Didukung**: File Excel (`.xlsx`/`.xls`) dan CSV (`.csv`) dari Shopee Seller Centre (Laporan Pesanan & Laporan Pengembalian/Pembatalan).
> - **Fitur Pemantauan Retur**: Lengkap mencakup pelacakan status pesanan, deteksi alasan retur (termasuk gagal COD), pemantauan fisik paket kembali, serta kalkulasi estimasi kerugian nilai barang dan ongkir.
> - **Strategi Penyimpanan**: Penyimpanan lokal browser otomatis (IndexedDB/LocalStorage) yang aman, menjaga kerahasiaan data omzet/toko tanpa risiko server pihak ketiga, dilengkapi filter rentang tanggal dinamis dan opsi ekspor rekap ke Excel.

---

## 1. Overview & Core Concept

- **Apa yang Dilakukan**: Aplikasi menyediakan antarmuka drag-and-drop untuk mengunggah file laporan pesanan dan laporan pembatalan/retur Shopee Seller Centre. Sistem secara otomatis membaca kolom standar Shopee (seperti `No. Pesanan`, `Status Pesanan`, `Status Pembatalan/Pengembalian`, `Alasan Pembatalan`, `Jasa Kirim`, `No. Resi`, `Metode Pembayaran`, `Total Pembayaran`, `Perkiraan Ongkos Kirim`), menggabungkan (merge) data berdasarkan Nomor Pesanan, dan menampilkan dashboard analisis komprehensif.
- **Target Pengguna**: Pemilik toko Shopee, manajer operasional gudang, dan staf admin pesanan yang perlu melacak nasib paket, terutama memitigasi risiko COD gagal kirim dan paket retur yang hilang di ekspedisi.
- **Nilai Utama**: 
  1. Mencegah kerugian barang retur yang tidak sampai kembali ke gudang penjual.
  2. Mengetahui rasio kegagalan COD dan alasan retur tertinggi per kurir.
  3. Memisahkan pesanan berhasil vs retur/batal dengan visualisasi metrik finansial yang akurat.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Zero-State & Upload**:
   - Area drag-and-drop ganda: satu untuk **Laporan Pesanan** dan satu untuk **Laporan Pengembalian/Retur**, atau tombol tunggal pintar (*Smart Auto-Detect File Type*).
   - Tombol **"Muat Contoh Data Shopee"** agar pengguna dapat langsung menguji coba fitur secara instan sebelum mengunduh file dari Seller Centre mereka.
   - Indikator ringkasan file yang baru diunggah: jumlah baris terbaca, total pesanan unik, dan rentang tanggal pesanan.
2. **Dashboard Overview (Executive KPI Strip)**:
   - Total Pesanan, Total Nilai Transaksi Selesai, Total Pesanan Retur/Batal, dan Tingkat Retur (% Return Rate).
   - Estimasi Nilai Barang Tertahan di Retur & Potensi Kerugian Ongkos Kirim RTS (Return to Sender).
   - Indikator Khusus COD: Perbandingan tingkat sukses vs gagal kirim COD.
3. **Pusat Pemantauan Retur & Komplain**:
   - Tab khusus yang memfilter hanya pesanan dengan status retur, pembatalan, atau gagal antar.
   - Pengelompokan alasan retur: *Pembeli Menolak Paket COD*, *Alamat Tidak Ditemukan*, *Barang Rusak/Kurang*, *Berubah Pikiran*, dll.
   - Check status fisik paket: Penjual dapat menandai apakah paket fisik sudah diterima kembali di gudang atau perlu diajukan klaim ganti rugi ke Shopee.
4. **Data Grid & Filter Fleksibel**:
   - Filter cepat berdasarkan: Status Pesanan, Metode Pembayaran (COD vs Non-COD), Kurir/Jasa Kirim, dan Rentang Tanggal.
   - Pencarian instan berdasarkan No. Pesanan, Resi, Nama Pembeli, atau Nama Produk.
   - Tombol **Ekspor Rekapan (.xlsx / .csv)** untuk keperluan pembukuan akuntansi.

### Visual Identity & Theme
- **Aesthetic Direction**: *Operational SaaS & Logistics Console* — bersih, presisi, minim distraksi, dengan fokus tinggi pada keterbacaan data angka tabel (*data density*).
- **Color Palette**:
  - Neutral Background: `#F8FAFC` (Slate 50) dengan kartu putih `#FFFFFF` bergaris batas halus `#E2E8F0` (Slate 200).
  - Shopee Accent Identity: Oranye khas Shopee `#EE4D2D` untuk aksen utama dan highlight brand.
  - Status Semantik:
    - Hijau Sukses (`#16A34A`): Selesai / Diterima Pembeli.
    - Biru Info (`#0284C7`): Dalam Pengiriman / Perlu Dikirim.
    - Amber Peringatan (`#D97706`): Dalam Proses Retur / Menunggu Barang Kembali.
    - Merah Alert (`#DC2626`): Retur Diterima / COD Gagal / Dibatalkan.
- **Typography & Formatting**:
  - Font Display: `Plus Jakarta Sans` untuk judul dan hierarki menu yang modern.
  - Font Body & Tables: `Plus Jakarta Sans` dengan angka monospaced berformat tabular (`tabular-nums font-mono`) untuk seluruh nominal Rupiah, Nomor Pesanan, dan No. Resi agar sejajar vertikal secara sempurna.
- **Micro-Interactions**: Transisi tab yang halus, visual drag-over border interaktif saat berkas diarahkan ke dropzone, serta badge status tanpa pill gemuk yang mengganggu.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side Parsing via SheetJS (xlsx)**
  - *Chosen Approach*: Pemrosesan file Excel (`.xlsx`) dan CSV dilakukan 100% di browser pengguna menggunakan library `xlsx`.
  - *Why*: Sangat cepat (tanpa delay upload ke server), hemat bandwidth, dan privasi data penjualan toko terjamin 100% aman di perangkat lokal pengguna.
  - *Alternatives Considered*: Upload ke backend Node.js — ditolak karena menambah latensi, risiko kebocoran data sensitif seller, dan batasan ukuran payload HTTP.
- **Decision 2: Smart Column Auto-Mapping & Tolerant Parsing**
  - *Chosen Approach*: Algoritma pencocokan header otomatis yang mengenali variasi nama kolom Shopee Seller Centre versi Bahasa Indonesia dan Bahasa Inggris (misal: `"No. Pesanan"` / `"Order ID"`, `"Status Pesanan"` / `"Order Status"`, `"Alasan Pembatalan"` / `"Return Reason"`).
  - *Why*: Shopee terkadang mengubah sedikit label header atau bahasa export tergantung pengaturan akun penjual; auto-mapping mencegah error parse.
- **Decision 3: Intelligent Data Merging & Persistence**
  - *Chosen Approach*: Menyimpan data di IndexedDB lokal dengan strategi merge berbasis Order ID. Jika pengguna mengunggah file bulan lalu kemudian mengunggah file minggu ini, status pesanan yang tadinya "Dalam Pengiriman" akan diperbarui menjadi "Selesai" atau "Retur" tanpa menduplikasi data pesanan.
  - *Why*: Seller Shopee mengunduh laporan secara berkala (misal tiap minggu atau tiap bulan), sehingga kemampuan akumulasi dan sinkronisasi status adalah kebutuhan esensial.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER / CLIENT                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌───────────────────────┐              ┌───────────────────────────┐  │
│  │ Laporan Pesanan Shopee│              │Laporan Retur / Pembatalan │  │
│  │   (.xlsx / .csv)      │              │       (.xlsx / .csv)      │  │
│  └──────────┬────────────┘              └─────────────┬─────────────┘  │
│             │                                         │                │
│             ▼                                         ▼                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │               Smart File Parser & Normalizer Engine              │  │
│  │   - Header Detection (ID / EN)                                   │  │
│  │   - Currency & Date Normalization                                │  │
│  │   - Multi-item Order Grouping                                    │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │               Order & Return Reconciliation Engine               │  │
│  │   - Match by No. Pesanan (Order ID)                              │  │
│  │   - Consolidate Return Reasons & RTS Tracking                    │  │
│  │   - Loss & Shipping Cost Calculation                             │  │
│  └─────────────────┬────────────────────────────────┬───────────────┘  │
│                    │                                │                  │
│                    ▼                                ▼                  │
│  ┌───────────────────────────────────┐ ┌────────────────────────────┐  │
│  │     Local Persistence Store       │ │      Analytics Engine      │  │
│  │ (IndexedDB / LocalStorage Cache)  │ │- KPI & Return Rate         │  │
│  │ - Deduplication by Order ID       │ │- COD Failure vs Non-COD    │  │
│  │ - Period History & Backup         │ │- Return Reason Breakdown   │  │
│  └─────────────────┬─────────────────┘ └────────────┬───────────────┘  │
│                    │                                │                  │
│                    ▼                                ▼                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Interactive UI Viewport                         │  │
│  │ ├─ KPI Cards (Omzet, Total Retur, Potensi Rugi, COD Success %)   │  │
│  │ ├─ Retur Monitoring & Fisik Barang Tracker (Klaim / Diterima)    │  │
│  │ ├─ Filter Bar (Tanggal, Kurir, COD/Non-COD, Status)              │  │
│  │ └─ Data Table (Tabular figures, Search, Export to Excel/CSV)     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Key Types

```typescript
export interface ShopeeOrderItem {
  productName: string;
  sku: string;
  variation: string;
  quantity: number;
  originalPrice: number;
  dealPrice: number;
}

export interface ShopeeOrderRecord {
  orderId: string;               // No. Pesanan
  orderStatus: string;           // Status Pesanan (Selesai, Batal, Retur, dll)
  trackingNumber: string;        // No. Resi
  courier: string;               // Jasa Kirim (SPX, J&T, dll)
  paymentMethod: string;         // COD vs Transfer/ShopeePay
  orderDate: string;             // Waktu Pesanan Dibuat
  paidDate?: string;             // Waktu Pembayaran
  shippingFee: number;           // Perkiraan Ongkos Kirim
  totalAmount: number;           // Total Pembayaran Pembeli
  sellerVoucher: number;
  shopeeRebate: number;
  items: ShopeeOrderItem[];
  
  // Return & Cancellation metadata (dari laporan retur / digabung)
  isReturned: boolean;
  isCancelled: boolean;
  returnReason?: string;         // Alasan retur (COD gagal, pembeli batal, rusak)
  returnStatus?: string;         // Status pengembalian (Disetujui, Ditolak, dll)
  returnTrackingNumber?: string; // No. Resi Pengembalian
  physicalReturnStatus?: 'waiting' | 'received_good' | 'received_damaged' | 'lost_claim'; 
  notes?: string;
}
```

### Dependencies Required
- `xlsx` (SheetJS): Library teruji untuk parsing file Excel `.xlsx`, `.xls`, dan `.csv` secara offline dan client-side tanpa dependensi eksternal.

---

## 5. Verification & Acceptance Criteria
1. Pengguna dapat mengunggah file `.xlsx` dan `.csv` asli dari Shopee Seller Centre dan melihat rekap data secara instan.
2. Tersedia tombol "Muat Contoh Data" untuk pengujian langsung tanpa file sendiri.
3. Status retur dan alasan pembatalan terdeteksi otomatis, memisahkan COD gagal bayar vs retur produk.
4. Total kerugian/omzet tertahan terhitung otomatis dengan format mata uang Rupiah (`Rp`).
5. Filter tanggal, status, dan pencarian berfungsi responsif tanpa reload halaman.
6. Pengguna dapat mengekspor hasil rekapan kembali ke file Excel (.xlsx).
