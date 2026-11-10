import React from 'react';
import { ReturnAnalytics } from '../types/shopee';
import { formatRupiah } from '../utils/analytics';
import { TrendingUp, AlertTriangle, PackageX, Truck, DollarSign, CheckCircle2 } from 'lucide-react';

interface KpiMetricsProps {
  analytics: ReturnAnalytics;
  onFilterReturOnly: () => void;
  onFilterCodOnly: () => void;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({
  analytics,
  onFilterReturOnly,
  onFilterCodOnly,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Omzet Selesai */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 transition-shadow hover:shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-medium">Omzet Berhasil (Selesai)</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
          {formatRupiah(analytics.totalTurnover)}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <span className="font-mono tabular-nums font-semibold text-slate-700">
            {analytics.completedOrders}
          </span>
          <span>dari {analytics.totalOrders} pesanan selesai</span>
        </div>
      </div>

      {/* 2. Pesanan Retur / Gagal Kirim */}
      <div
        onClick={onFilterReturOnly}
        className="bg-white border border-slate-200 hover:border-red-300 rounded-lg p-4 cursor-pointer transition-colors"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-medium text-red-700">Pesanan Retur & Gagal</span>
          <PackageX className="w-4 h-4 text-red-600" />
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-red-600 flex items-baseline gap-2">
          <span>{analytics.returnedOrders} Pesanan</span>
          <span className="text-xs font-medium font-sans text-red-500">
            ({analytics.returnRate.toFixed(1)}%)
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          <span>Nilai barang retur: </span>
          <span className="font-mono tabular-nums font-semibold text-slate-700">
            {formatRupiah(analytics.turnoverAtRisk)}
          </span>
        </div>
      </div>

      {/* 3. Estimasi Kerugian Ongkir RTS & Packing */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-medium text-amber-700">Estimasi Rugi Ongkir RTS</span>
          <DollarSign className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-amber-700">
          {formatRupiah(analytics.estimatedShippingLoss)}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          <span>Biaya ongkir balik & packaging hangus</span>
        </div>
      </div>

      {/* 4. Analisis COD: Gagal vs Sukses */}
      <div
        onClick={onFilterCodOnly}
        className="bg-white border border-slate-200 hover:border-orange-300 rounded-lg p-4 cursor-pointer transition-colors"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-medium">Tingkat Sukses COD</span>
          <Truck className="w-4 h-4 text-orange-600" />
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-slate-900 flex items-baseline gap-2">
          <span>{analytics.codSuccessRate.toFixed(1)}%</span>
          <span className="text-xs text-slate-500 font-sans">
            ({analytics.codFailedOrders} gagal dari {analytics.codTotalOrders} COD)
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          <span>Non-COD sukses: </span>
          <span className="font-mono tabular-nums font-semibold text-emerald-600">
            {analytics.nonCodSuccessRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
