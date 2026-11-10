import React from 'react';
import {
  Menu,
  UploadCloud,
  FileSpreadsheet,
  FileDown,
  RotateCcw,
  Clock,
  LayoutDashboard,
  Package,
  PackageX,
  Truck,
  Sparkles,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { ActiveNavMenu } from './Sidebar';

interface HeaderProps {
  activeMenu: ActiveNavMenu;
  onOpenMobileMenu: () => void;
  onOpenUpload: () => void;
  onExportExcel: () => void;
  onExportPdf?: () => void;
  onResetData: () => void;
  onNavigateToPo: () => void;
  poUrgentCount?: number;
  orderCount: number;
  userName?: string | null;
  userPhoto?: string | null;
  onLogout?: () => void;
  onOpenAccessModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMenu,
  onOpenMobileMenu,
  onOpenUpload,
  onExportExcel,
  onExportPdf,
  onResetData,
  onNavigateToPo,
  poUrgentCount = 0,
  orderCount,
  userName,
  userPhoto,
  onLogout,
  onOpenAccessModal,
}) => {
  const titles: Record<ActiveNavMenu, { title: string; subtitle: string; icon: any }> = {
    dashboard: {
      title: 'Dashboard Ringkasan',
      subtitle: 'Metrik Utama, Tren Penjualan & Analisis Produk',
      icon: LayoutDashboard,
    },
    orders: {
      title: 'Semua Pesanan Shopee',
      subtitle: 'Pencarian, Filter Status & Ekspor Data Transaksi',
      icon: Package,
    },
    returns: {
      title: 'Monitoring Retur Fisik',
      subtitle: 'Rekapitulasi Paket Balik, Rugi Ongkir RTS & Status Barang',
      icon: PackageX,
    },
    cod: {
      title: 'Analisis COD & Performa Kurir',
      subtitle: 'Tingkat Keberhasilan Bayar di Tempat & Mitigasi Penolakan',
      icon: Truck,
    },
    po_deadline: {
      title: 'Monitoring Batas Kirim & Pre-Order',
      subtitle: 'SLA Pengiriman Shopee & Pencegahan Auto-Cancel',
      icon: Clock,
    },
  };

  const currentInfo = titles[activeMenu] || titles.dashboard;
  const CurrentIcon = currentInfo.icon;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Mobile Hamburger & Page Context */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden"
              title="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-orange-50 text-orange-600 hidden sm:flex">
                <CurrentIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight">
                    {currentInfo.title}
                  </h2>
                  <span className="text-slate-300 hidden md:inline">·</span>
                  <span className="text-xs text-slate-500 font-mono tabular-nums hidden md:inline">
                    {orderCount} Pesanan
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block leading-tight">
                  {currentInfo.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Urgent Alerts & Action Utilities */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Urgent PO Alert Chip */}
            {poUrgentCount > 0 && (
              <button
                onClick={onNavigateToPo}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-xs font-semibold transition-colors cursor-pointer animate-pulse"
                title={`${poUrgentCount} pesanan mendekati/lewat tenggat kirim!`}
              >
                <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                <span className="hidden sm:inline font-mono tabular-nums">{poUrgentCount} PO Mepet</span>
                <span className="sm:hidden font-mono tabular-nums">{poUrgentCount} PO</span>
              </button>
            )}

            {/* Ekspor PDF */}
            {onExportPdf && (
              <button
                onClick={onExportPdf}
                title="Download ringkasan laporan PDF eksekutif"
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              >
                <FileDown className="w-3.5 h-3.5 text-orange-600" />
                <span>PDF Laporan</span>
              </button>
            )}

            {/* Ekspor Excel */}
            <button
              onClick={onExportExcel}
              title="Unduh seluruh database ke Excel"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>

            {/* Upload Laporan */}
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Shopee</span>
            </button>

            {/* Access & Security Management */}
            {onOpenAccessModal && (
              <button
                onClick={onOpenAccessModal}
                title="Kelola Hak Akses & PIN Toko"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                <span>Hak Akses</span>
              </button>
            )}

            {/* Reset */}
            <button
              onClick={onResetData}
              title="Reset data ke lembar kosong"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Logout / Lock Store */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Keluar / Kunci Akses Toko"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
