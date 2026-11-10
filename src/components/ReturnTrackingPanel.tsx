import React, { useState, useMemo } from 'react';
import { ShopeeOrderRecord, ReturnAnalytics, PhysicalReturnStatus } from '../types/shopee';
import { formatRupiah, calculateAnalytics } from '../utils/analytics';
import { mapPhysicalStatusLabel } from '../utils/storage';
import {
  PackageCheck,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Truck,
  Edit3,
} from 'lucide-react';
import { PaginationControls } from './PaginationControls';

interface ReturnTrackingPanelProps {
  orders: ShopeeOrderRecord[];
  onUpdatePhysicalStatus: (orderId: string, status: PhysicalReturnStatus) => void;
  onUpdateNotes: (orderId: string, notes: string) => void;
  onSelectOrder: (order: ShopeeOrderRecord) => void;
}

export const ReturnTrackingPanel: React.FC<ReturnTrackingPanelProps> = ({
  orders,
  onUpdatePhysicalStatus,
  onSelectOrder,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const returnOrders = useMemo(() => {
    return orders.filter(
      (o) => o.isReturned || o.normalizedStatus === 'returned' || o.normalizedStatus === 'return_process'
    );
  }, [orders]);

  const analytics = calculateAnalytics(orders);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(returnOrders.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, returnOrders.length);

  const paginatedReturnOrders = useMemo(() => {
    return returnOrders.slice(startIndex, endIndex);
  }, [returnOrders, startIndex, endIndex]);

  return (
    <div className="space-y-6">
      {/* Top summary row: Physical packages status in warehouse */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-amber-600 font-medium mb-1">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Menunggu Paket Tiba</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {analytics.physicalStatusCounts.pending || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Paket sedang dalam perjalanan balik</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium mb-1">
            <PackageCheck className="w-4 h-4 shrink-0" />
            <span>Diterima Kondisi Baik</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700">
            {analytics.physicalStatusCounts.received_ok || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Barang utuh & dapat direstock</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-red-600 font-medium mb-1">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Diterima Rusak / Cacat</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-red-600">
            {analytics.physicalStatusCounts.received_damaged || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Perlu dokumentasi video klaim</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-blue-600 font-medium mb-1">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Klaim / Kompensasi</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-blue-700">
            {(analytics.physicalStatusCounts.claim_filed || 0) + (analytics.physicalStatusCounts.claim_approved || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {analytics.physicalStatusCounts.claim_approved || 0} klaim telah cair
          </div>
        </div>
      </div>

      {/* Analytics 2-Column: Alasan Retur Terbanyak vs Kurir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alasan Retur */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-slate-900 mb-3">
            Alasan Pengembalian & Gagal Antar Terbanyak
          </h4>
          {analytics.returnReasonsBreakdown.length === 0 ? (
            <div className="text-xs text-slate-400 py-4 text-center">Belum ada data retur tercatat.</div>
          ) : (
            <div className="space-y-3">
              {analytics.returnReasonsBreakdown.slice(0, 5).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 truncate max-w-[260px]">
                      {item.reason}
                    </span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {item.count} pesanan ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 flex justify-between">
                    <span>Estimasi nilai barang:</span>
                    <span className="font-mono tabular-nums text-slate-600 font-medium">
                      {formatRupiah(item.totalLoss)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performa Kurir & Retur */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-slate-900 mb-3">
            Rasio Retur per Ekspedisi (Jasa Kirim)
          </h4>
          {analytics.courierBreakdown.length === 0 ? (
            <div className="text-xs text-slate-400 py-4 text-center">Belum ada data ekspedisi.</div>
          ) : (
            <div className="space-y-3">
              {analytics.courierBreakdown.map((c, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <Truck className="w-3.5 h-3.5 text-slate-500" />
                      <span>{c.courier}</span>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {c.returned} retur / {c.total} total ({c.returnRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        c.returnRate > 15 ? 'bg-red-500' : c.returnRate > 8 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(c.returnRate * 2.5, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daftar Pesanan Retur yang Perlu Tindakan */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Daftar Paket Retur & Status Fisik Gudang
            </h4>
            <p className="text-xs text-slate-500">
              Perbarui status barang fisik saat paket sampai di gudang untuk mencegah barang hilang.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500 font-medium">
            {returnOrders.length} Pesanan Retur
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-medium">
                <th className="py-2.5 px-3">No. Pesanan & Tanggal</th>
                <th className="py-2.5 px-3">Pembeli & Kota</th>
                <th className="py-2.5 px-3">Kurir & Resi Retur</th>
                <th className="py-2.5 px-3">Alasan Retur</th>
                <th className="py-2.5 px-3 text-right">Nilai Barang</th>
                <th className="py-2.5 px-3">Status Fisik di Gudang</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returnOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada pesanan dengan status retur atau gagal kirim.
                  </td>
                </tr>
              ) : (
                paginatedReturnOrders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-slate-50 transition-colors">
                    {/* No. Pesanan */}
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => onSelectOrder(order)}
                        className="font-mono tabular-nums font-semibold text-orange-600 hover:underline block text-left"
                      >
                        {order.orderId}
                      </button>
                      <span className="text-slate-400 text-[11px] block">{order.orderDate}</span>
                    </td>

                    {/* Pembeli */}
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-900 block">{order.buyerUsername}</span>
                      <span className="text-slate-500 text-[11px]">{order.recipientCity || '-'}</span>
                    </td>

                    {/* Kurir & Resi */}
                    <td className="py-2.5 px-3">
                      <span className="text-slate-900 font-medium block">{order.courier}</span>
                      <span className="font-mono tabular-nums text-slate-500 text-[11px] block">
                        {order.returnTrackingNumber || order.trackingNumber}
                      </span>
                    </td>

                    {/* Alasan */}
                    <td className="py-2.5 px-3 max-w-[200px]">
                      <span className="text-slate-800 font-medium block text-wrap">
                        {order.returnReason || order.orderStatus}
                      </span>
                      {order.isCod && (
                        <span className="text-[11px] text-amber-700 font-semibold">
                          [COD Gagal Bayar]
                        </span>
                      )}
                    </td>

                    {/* Nilai Barang */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <span className="font-semibold text-slate-900 block">
                        {formatRupiah(order.totalAmount)}
                      </span>
                      <span className="text-[11px] text-red-600 block">
                        -Rugi Ongkir: {formatRupiah(order.estimatedReturnLoss)}
                      </span>
                    </td>

                    {/* Status Fisik Selector */}
                    <td className="py-2.5 px-3">
                      <select
                        value={order.physicalStatus}
                        onChange={(e) =>
                          onUpdatePhysicalStatus(order.orderId, e.target.value as PhysicalReturnStatus)
                        }
                        className={`text-xs rounded-md border py-1 px-2 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                          order.physicalStatus === 'pending'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : order.physicalStatus === 'received_ok'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : order.physicalStatus === 'received_damaged'
                            ? 'bg-red-50 border-red-300 text-red-800'
                            : order.physicalStatus === 'claim_filed'
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'bg-indigo-50 border-indigo-300 text-indigo-800'
                        }`}
                      >
                        <option value="pending">Menunggu Paket Tiba</option>
                        <option value="received_ok">Diterima - Kondisi Baik (Restock)</option>
                        <option value="received_damaged">Diterima - Rusak/Pecah</option>
                        <option value="claim_filed">Klaim Diajukan ke Shopee</option>
                        <option value="claim_approved">Klaim Ganti Rugi Disetujui</option>
                      </select>
                    </td>

                    {/* Detail Button */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectOrder(order)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded text-xs font-medium transition-colors"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {returnOrders.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalItems={returnOrders.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel="paket retur"
          />
        )}
      </div>
    </div>
  );
};
