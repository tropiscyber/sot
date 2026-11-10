import React from 'react';
import {
  LayoutDashboard,
  Package,
  PackageX,
  Truck,
  Clock,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';

export type ActiveNavMenu = 'dashboard' | 'orders' | 'returns' | 'cod' | 'po_deadline';

interface SidebarProps {
  activeMenu: ActiveNavMenu;
  onSelectMenu: (menu: ActiveNavMenu) => void;
  orderCount: number;
  returnCount: number;
  codCount: number;
  poCount: number;
  poUrgentCount: number;
  hasSampleOrders: boolean;
  onResetData: () => void;
  onPurgeSample: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  orderCount,
  returnCount,
  codCount,
  poCount,
  poUrgentCount,
  hasSampleOrders,
  onResetData,
  onPurgeSample,
  isOpenMobile,
  onCloseMobile,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ActiveNavMenu,
      label: 'Dashboard Ringkasan',
      sublabel: 'Overview, KPI & Tren',
      icon: LayoutDashboard,
      badge: null,
      badgeClass: '',
    },
    {
      id: 'orders' as ActiveNavMenu,
      label: 'Semua Pesanan',
      sublabel: 'Daftar & Status Kirim',
      icon: Package,
      badge: orderCount > 0 ? orderCount.toString() : null,
      badgeClass: 'bg-slate-100 text-slate-700 font-mono',
    },
    {
      id: 'returns' as ActiveNavMenu,
      label: 'Tracking Retur Fisik',
      sublabel: 'Rugi Ongkir & Paket Balik',
      icon: PackageX,
      badge: returnCount > 0 ? returnCount.toString() : null,
      badgeClass: returnCount > 0 ? 'bg-red-50 text-red-700 border border-red-200 font-mono' : '',
    },
    {
      id: 'cod' as ActiveNavMenu,
      label: 'Analisis COD & Kurir',
      sublabel: 'Tingkat Sukses Bayar',
      icon: Truck,
      badge: codCount > 0 ? `${codCount} COD` : null,
      badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200 font-mono',
    },
    {
      id: 'po_deadline' as ActiveNavMenu,
      label: 'Tenggat Kirim & PO',
      sublabel: 'Pantau Batas Waktu Kirim',
      icon: Clock,
      badge: poUrgentCount > 0 ? `${poUrgentCount} Mepet!` : poCount > 0 ? `${poCount} PO` : null,
      badgeClass: poUrgentCount > 0 ? 'bg-red-600 text-white font-bold animate-pulse' : 'bg-purple-50 text-purple-700 font-mono',
      isUrgent: poUrgentCount > 0,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Store Identity */}
        <div>
          <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-xs font-bold text-lg">
                S
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-tight">ShopeeTracker</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-slate-500 font-medium">Seller Analytics Hub</span>
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md lg:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Notice for Sample / Demo Mode if present */}
          {hasSampleOrders && (
            <div className="mx-3 mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs">
              <div className="flex items-start justify-between gap-1">
                <span className="font-semibold text-amber-900 text-[11px]">Mode Contoh Aktif</span>
                <button
                  onClick={onPurgeSample}
                  className="text-[10px] font-semibold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                >
                  Bersihkan
                </button>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Data demo Sepatu Sneakers masih dimuat.
              </p>
            </div>
          )}

          {/* Navigation Menu Links */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Menu Navigasi Toko
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectMenu(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-orange-50 text-orange-950 font-semibold shadow-2xs border border-orange-200/80'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-md transition-colors ${
                        isActive
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs block truncate">{item.label}</span>
                      <span className="text-[10px] text-slate-400 block truncate group-hover:text-slate-500">
                        {item.sublabel}
                      </span>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${item.badgeClass}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer & Data Health */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono tabular-nums">{orderCount} Pesanan Tersimpan</span>
            </div>
            <button
              onClick={onResetData}
              title="Reset seluruh data ke lembar kosong"
              className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[10px] text-slate-400 text-center">
            Penyimpanan Lokal Browser Aman · v2.5
          </div>
        </div>
      </aside>
    </>
  );
};
