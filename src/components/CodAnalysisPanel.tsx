import React, { useState } from 'react';
import { ShopeeOrderRecord } from '../types/shopee';
import { formatRupiah, calculateAnalytics } from '../utils/analytics';
import { PaginationControls } from './PaginationControls';
import { Truck, AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';

interface CodAnalysisPanelProps {
  orders: ShopeeOrderRecord[];
}

export const CodAnalysisPanel: React.FC<CodAnalysisPanelProps> = ({ orders }) => {
  const analytics = calculateAnalytics(orders);
  const codOrders = orders.filter((o) => o.isCod);
  const codFailedOrders = codOrders.filter(
    (o) => o.isReturned || o.normalizedStatus === 'returned' || o.normalizedStatus === 'return_process'
  );

  // Pagination state for COD Failed Orders
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, codFailedOrders.length);
  const paginatedCodFailedOrders = codFailedOrders.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Overview comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* COD Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-900">Performa COD (Bayar di Tempat)</span>
            <Truck className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {analytics.codSuccessRate.toFixed(1)}% Sukses
          </div>
          <div className="text-xs text-slate-500 mt-2 space-y-1">
            <div className="flex justify-between">
              <span>Total Pesanan COD:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-700">
                {analytics.codTotalOrders} pesanan
              </span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Gagal Antar / Retur (RTS):</span>
              <span className="font-mono tabular-nums font-semibold">
                {analytics.codFailedOrders} pesanan
              </span>
            </div>
          </div>
        </div>

        {/* Non-COD Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-900">Performa Non-COD (Transfer/ShopeePay)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-2">
            {analytics.nonCodSuccessRate.toFixed(1)}% Sukses
          </div>
          <div className="text-xs text-slate-500 mt-2 space-y-1">
            <div className="flex justify-between">
              <span>Total Pesanan Non-COD:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-700">
                {analytics.nonCodTotalOrders} pesanan
              </span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Tingkat Retur Sangat Rendah:</span>
              <span className="font-mono tabular-nums font-semibold">
                {analytics.nonCodFailedOrders} pesanan
              </span>
            </div>
          </div>
        </div>

        {/* Total Kerugian Akibat COD */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-red-700">Kerugian Finansial COD Gagal</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-600 mt-2">
            {formatRupiah(
              codFailedOrders.reduce((sum, o) => sum + (o.estimatedReturnLoss > 0 ? o.estimatedReturnLoss : 18000), 0)
            )}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Biaya ongkos kirim return-to-sender & kemasan packing kardus/bubble wrap yang terbuang.
          </div>
        </div>
      </div>

      {/* Rekomendasi Operasional Toko */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-orange-900 mb-2">
          <ShieldAlert className="w-4 h-4 text-orange-600" />
          <span>Rekomendasi Senior Seller untuk Menekan Retur COD Shopee:</span>
        </div>
        <ul className="text-xs text-orange-950 space-y-1.5 list-disc list-inside">
          <li>
            <strong>Verifikasi Chat Shopee:</strong> Kirim template otomatis ke pembeli COD dengan akun baru (&lt; 3 bulan) sebelum mencetak resi pengiriman.
          </li>
          <li>
            <strong>Prioritaskan Ekspedisi dengan Hub Terdekat:</strong> Evaluasi kurir dengan rasio retur COD terendah di daerah tujuan (misal SPX vs J&T).
          </li>
          <li>
            <strong>Segera Ajukan Banding Shopee:</strong> Jika barang kembali dalam kondisi segel terbuka atau rusak, ajukan kompensasi maksimal 3 hari sejak status paket tiba di gudang.
          </li>
        </ul>
      </div>

      {/* Rincian Pesanan COD Gagal */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">
            Daftar Pesanan COD Gagal Antar & Menolak Bayar ({codFailedOrders.length})
          </h4>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {codFailedOrders.length} Paket Gagal
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-medium">
                <th className="py-2.5 px-3">No. Pesanan</th>
                <th className="py-2.5 px-3">Pembeli</th>
                <th className="py-2.5 px-3">Kota Tujuan</th>
                <th className="py-2.5 px-3">Kurir</th>
                <th className="py-2.5 px-3">Alasan Penolakan / Gagal</th>
                <th className="py-2.5 px-3 text-right">Nilai COD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codFailedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Bagus! Tidak ada pesanan COD yang gagal bayar.
                  </td>
                </tr>
              ) : (
                paginatedCodFailedOrders.map((o) => (
                  <tr key={o.orderId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-slate-900">
                      {o.orderId}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{o.buyerUsername}</td>
                    <td className="py-2.5 px-3 text-slate-600">{o.recipientCity || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{o.courier}</td>
                    <td className="py-2.5 px-3 text-red-600 font-medium">
                      {o.returnReason || 'Gagal Antar: Pembeli Menolak COD'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatRupiah(o.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {codFailedOrders.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalItems={codFailedOrders.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
            itemLabel="pesanan COD gagal"
          />
        )}
      </div>
    </div>
  );
};
