import React from 'react';
import { ReturnAnalytics } from '../types/shopee';
import { formatRupiah } from '../utils/analytics';
import {
  CheckCircle2,
  Truck,
  Package,
  PackageX,
  Layers,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { ActiveNavMenu } from './Sidebar';

interface OrderStatusSummaryProps {
  analytics: ReturnAnalytics;
  currentStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
  onNavigateMenu?: (menu: ActiveNavMenu, statusFilter?: string) => void;
  urgentPoCount?: number;
}

export const OrderStatusSummary: React.FC<OrderStatusSummaryProps> = ({
  analytics,
  currentStatusFilter,
  onSelectStatusFilter,
  onNavigateMenu,
  urgentPoCount = 0,
}) => {
  const total = analytics.totalOrders || 1;

  const cards = [
    {
      id: 'completed',
      title: 'Omzet Selesai',
      badge: 'Dana Cair',
      primaryValue: formatRupiah(analytics.totalTurnover),
      primaryLabel: 'Omzet Bersih',
      secondaryText: `${analytics.completedOrders} pesanan · ${((analytics.completedOrders / total) * 100).toFixed(0)}% selesai`,
      icon: CheckCircle2,
      accentColor: 'text-emerald-600',
      accentBg: 'bg-emerald-50',
      activeBorder: 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20',
      badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      action: () => {
        onSelectStatusFilter('completed');
        if (onNavigateMenu) onNavigateMenu('orders', 'completed');
      },
    },
    {
      id: 'returned',
      title: 'Retur & Rugi Ongkir',
      badge: `${analytics.returnRate.toFixed(1)}% Retur`,
      primaryValue: formatRupiah(analytics.estimatedShippingLoss),
      primaryLabel: 'Estimasi Rugi Ongkir RTS',
      secondaryText: `${analytics.returnedOrders} retur · ${formatRupiah(analytics.turnoverAtRisk)} barang`,
      icon: PackageX,
      accentColor: 'text-red-600',
      accentBg: 'bg-red-50',
      activeBorder: 'border-red-600 ring-2 ring-red-600/20 bg-red-50/20',
      badgeClass: 'text-red-700 bg-red-50 border-red-200',
      action: () => {
        onSelectStatusFilter('returned');
        if (onNavigateMenu) onNavigateMenu('returns');
      },
    },
    {
      id: 'cod_analysis',
      title: 'Performa COD',
      badge: `${analytics.codSuccessRate.toFixed(1)}% Sukses`,
      primaryValue: `${analytics.codSuccessRate.toFixed(1)}%`,
      primaryLabel: 'Tingkat Sukses COD',
      secondaryText: `${analytics.codFailedOrders} gagal dari ${analytics.codTotalOrders} COD (Non-COD ${analytics.nonCodSuccessRate.toFixed(0)}%)`,
      icon: Truck,
      accentColor: 'text-amber-600',
      accentBg: 'bg-amber-50',
      activeBorder: 'border-amber-600 ring-2 ring-amber-600/20 bg-amber-50/20',
      badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
      action: () => {
        if (onNavigateMenu) onNavigateMenu('cod');
      },
    },
    {
      id: 'in_transit',
      title: 'Dalam Pengiriman',
      badge: 'Ekspedisi',
      primaryValue: formatRupiah(analytics.inTransitAmount),
      primaryLabel: 'Nilai Sedang Jalan',
      secondaryText: `${analytics.inTransitOrders} paket sedang dibawa kurir (${((analytics.inTransitOrders / total) * 100).toFixed(0)}%)`,
      icon: Truck,
      accentColor: 'text-sky-600',
      accentBg: 'bg-sky-50',
      activeBorder: 'border-sky-600 ring-2 ring-sky-600/20 bg-sky-50/20',
      badgeClass: 'text-sky-700 bg-sky-50 border-sky-200',
      action: () => {
        onSelectStatusFilter('in_transit');
        if (onNavigateMenu) onNavigateMenu('orders', 'in_transit');
      },
    },
    {
      id: 'to_ship',
      title: 'Perlu Dikirim & PO',
      badge: urgentPoCount > 0 ? `${urgentPoCount} PO Mepet!` : 'Siap Kirim',
      primaryValue: formatRupiah(analytics.toShipAmount),
      primaryLabel: 'Menunggu Pengiriman',
      secondaryText: `${analytics.toShipOrders} paket siap diproses${urgentPoCount > 0 ? ` · ${urgentPoCount} mendekati batas PO` : ''}`,
      icon: Package,
      accentColor: urgentPoCount > 0 ? 'text-orange-600' : 'text-indigo-600',
      accentBg: urgentPoCount > 0 ? 'bg-orange-50' : 'bg-indigo-50',
      activeBorder: 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/20',
      badgeClass: urgentPoCount > 0 ? 'text-orange-700 bg-orange-100 border-orange-300 font-semibold' : 'text-indigo-700 bg-indigo-50 border-indigo-200',
      action: () => {
        if (urgentPoCount > 0 && onNavigateMenu) {
          onNavigateMenu('po_deadline');
        } else {
          onSelectStatusFilter('to_ship');
          if (onNavigateMenu) onNavigateMenu('orders', 'to_ship');
        }
      },
    },
    {
      id: 'all',
      title: 'Total Transaksi',
      badge: `${analytics.totalOrders} Pesanan`,
      primaryValue: formatRupiah(analytics.allOrdersAmount),
      primaryLabel: 'Semua Nilai Pesanan',
      secondaryText: `Arsip lengkap toko (${analytics.cancelledOrders} dibatalkan)`,
      icon: Layers,
      accentColor: 'text-slate-700',
      accentBg: 'bg-slate-100',
      activeBorder: 'border-slate-800 ring-2 ring-slate-800/10 bg-slate-50',
      badgeClass: 'text-slate-700 bg-slate-100 border-slate-200',
      action: () => {
        onSelectStatusFilter('all');
        if (onNavigateMenu) onNavigateMenu('orders', 'all');
      },
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-sm font-bold text-slate-900 tracking-tight">
            Metrik Utama & Ringkasan Status
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Klik kartu untuk langsung menuju menu analisis / tabel pesanan terkait
          </span>
        </div>

        {currentStatusFilter !== 'all' && (
          <button
            onClick={() => {
              onSelectStatusFilter('all');
              if (onNavigateMenu) onNavigateMenu('orders', 'all');
            }}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>Tampilkan Semua Status di Tabel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Symmetrical 6-Card Master Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = currentStatusFilter === card.id;

          return (
            <div
              key={card.id}
              onClick={card.action}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between text-left group min-h-[136px] ${
                isSelected
                  ? `${card.activeBorder} shadow-xs`
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-xs'
              }`}
            >
              <div>
                {/* Header Icon + Label */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className="text-xs font-semibold text-slate-700 truncate" title={card.title}>
                    {card.title}
                  </span>
                  <div className={`p-1 rounded-md ${card.accentBg} shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${card.accentColor}`} />
                  </div>
                </div>

                {/* Primary Metric Value */}
                <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 tracking-tight leading-tight">
                  {card.primaryValue}
                </div>

                {/* Category Subtitle */}
                <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                  {card.primaryLabel}
                </div>
              </div>

              {/* Bottom Context Details */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                <span className="text-[11px] text-slate-500 truncate" title={card.secondaryText}>
                  {card.secondaryText}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 font-medium ${card.badgeClass}`}>
                  {card.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
