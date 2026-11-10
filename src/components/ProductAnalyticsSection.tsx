import React, { useMemo, useState } from 'react';
import { ShopeeOrderRecord } from '../types/shopee';
import {
  calculateProductAnalytics,
  formatRupiah,
  ProductAnalyticsItem,
} from '../utils/analytics';
import {
  Flame,
  AlertTriangle,
  Package,
  Layers,
} from 'lucide-react';

interface ProductAnalyticsSectionProps {
  orders: ShopeeOrderRecord[];
  onSelectProductFilter?: (productName: string) => void;
}

export const ProductAnalyticsSection: React.FC<ProductAnalyticsSectionProps> = ({
  orders,
  onSelectProductFilter,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'selling' | 'returned'>('all');

  const { topSelling, topReturned } = useMemo(() => {
    return calculateProductAnalytics(orders);
  }, [orders]);

  if (orders.length === 0) return null;

  const maxSellingQty = topSelling.length > 0 ? topSelling[0].totalQuantitySold : 1;

  const renderSellingColumn = () => (
    <div className="bg-slate-50/60 border border-slate-200/80 rounded-lg p-3.5 space-y-3 flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">5 Produk Terlaris</h4>
              <span className="text-[10px] text-slate-500">Kuantitas terjual terbanyak</span>
            </div>
          </div>
          <span className="text-[10px] font-mono tabular-nums text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            Top Sales
          </span>
        </div>

        {topSelling.length === 0 ? (
          <div className="text-xs text-slate-400 py-6 text-center">
            Belum ada pesanan dengan status selesai.
          </div>
        ) : (
          <div className="space-y-2 mt-2.5">
            {topSelling.map((prod, idx) => {
              const percentShare = (prod.totalQuantitySold / Math.max(1, maxSellingQty)) * 100;
              return (
                <div
                  key={idx}
                  onClick={() => onSelectProductFilter?.(prod.productName)}
                  className="p-2 bg-white border border-slate-200 rounded-md hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-start gap-1.5 min-w-0">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span
                          className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors block truncate"
                          title={prod.productName}
                        >
                          {prod.productName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          SKU: {prod.sku}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono tabular-nums text-emerald-700 block">
                        {prod.totalQuantitySold} pcs
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono tabular-nums block">
                        {formatRupiah(prod.totalRevenue)}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${percentShare}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200/50">
        Klik item untuk memfilter daftar pesanan
      </div>
    </div>
  );

  const renderReturnedColumn = () => (
    <div className="bg-red-50/20 border border-red-200/80 rounded-lg p-3.5 space-y-3 flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-red-200/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">5 Produk Rawan Retur</h4>
              <span className="text-[10px] text-slate-500">Tingkat retur & gagal kirim tertinggi</span>
            </div>
          </div>
          <span className="text-[10px] font-mono tabular-nums text-red-700 font-semibold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
            Perlu Evaluasi
          </span>
        </div>

        {topReturned.length === 0 ? (
          <div className="text-xs text-slate-400 py-6 text-center">
            Bagus! Tidak ada pesanan retur pada katalog saat ini.
          </div>
        ) : (
          <div className="space-y-2 mt-2.5">
            {topReturned.map((prod, idx) => {
              return (
                <div
                  key={idx}
                  onClick={() => onSelectProductFilter?.(prod.productName)}
                  className="p-2 bg-white border border-slate-200 rounded-md hover:border-red-300 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-start gap-1.5 min-w-0">
                      <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span
                          className="text-xs font-semibold text-slate-900 group-hover:text-red-700 transition-colors block truncate"
                          title={prod.productName}
                        >
                          {prod.productName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          SKU: {prod.sku}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono tabular-nums text-red-600 block">
                        {prod.returnRate.toFixed(1)}% Retur
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono tabular-nums block">
                        {prod.returnedQuantity} dari {prod.totalQuantityOrdered} pcs
                      </span>
                    </div>
                  </div>
                  {/* Warning progress bar */}
                  <div className="w-full bg-red-100/60 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(5, prod.returnRate))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[10px] text-slate-400 pt-2 border-t border-red-200/50">
        Klik item untuk evaluasi ulasan pembeli
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3.5 h-full">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              Analisis Katalog Produk
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Performa Penjualan & Tingkat Retur</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluasi 5 produk terlaris dan 5 produk yang paling sering mengalami retur / RTS.
          </p>
        </div>

        {/* View Segment Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md border border-slate-200 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kedua Kolom
          </button>
          <button
            onClick={() => setActiveTab('selling')}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'selling'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔥 Terlaris
          </button>
          <button
            onClick={() => setActiveTab('returned')}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'returned'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚠️ Rawan Retur
          </button>
        </div>
      </div>

      {/* Columns Container */}
      <div className="flex-1">
        {activeTab === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 h-full">
            {renderSellingColumn()}
            {renderReturnedColumn()}
          </div>
        )}
        {activeTab === 'selling' && renderSellingColumn()}
        {activeTab === 'returned' && renderReturnedColumn()}
      </div>
    </div>
  );
};
