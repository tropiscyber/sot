import React, { useState, useMemo } from 'react';
import { ShopeeOrderRecord } from '../types/shopee';
import { formatRupiah } from '../utils/analytics';
import {
  calculatePoAnalytics,
  getDeadlineDetail,
  DeadlineDetail,
} from '../utils/poDeadline';
import { PaginationControls } from './PaginationControls';
import {
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar,
  Package,
  Search,
  Filter,
  ArrowUpDown,
  Truck,
  Info,
  Timer,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface PoDeadlinePanelProps {
  orders: ShopeeOrderRecord[];
  onSelectOrder: (order: ShopeeOrderRecord) => void;
  onUpdateNotes?: (orderId: string, notes: string) => void;
}

export const PoDeadlinePanel: React.FC<PoDeadlinePanelProps> = ({
  orders,
  onSelectOrder,
  onUpdateNotes,
}) => {
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [onlyPoFilter, setOnlyPoFilter] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'urgent_first' | 'newest_order' | 'highest_amount'>('urgent_first');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterUrgency, onlyPoFilter, searchQuery, sortBy]);

  const poSummary = useMemo(() => {
    return calculatePoAnalytics(orders);
  }, [orders]);

  // Filtered orders list
  const displayOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // Must be in pending shipment state (to_ship) or explicitly PO
        if (o.normalizedStatus !== 'to_ship' && !o.isPreOrder) {
          return false;
        }

        // Only PO toggle
        if (onlyPoFilter && !o.isPreOrder) {
          return false;
        }

        const detail = getDeadlineDetail(o);

        // Filter by Urgency
        if (filterUrgency !== 'all') {
          if (filterUrgency === 'overdue' && detail.urgency !== 'overdue') return false;
          if (filterUrgency === 'today' && detail.urgency !== 'today') return false;
          if (filterUrgency === 'near' && detail.urgency !== 'near') return false;
          if (filterUrgency === 'safe' && detail.urgency !== 'safe') return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = o.orderId.toLowerCase().includes(q);
          const matchBuyer = o.buyerUsername.toLowerCase().includes(q);
          const matchItem = o.items.some(
            (it) => it.productName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q)
          );
          if (!matchId && !matchBuyer && !matchItem) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const detailA = getDeadlineDetail(a);
        const detailB = getDeadlineDetail(b);

        if (sortBy === 'urgent_first') {
          return detailA.hoursRemaining - detailB.hoursRemaining;
        }
        if (sortBy === 'newest_order') {
          return b.orderDate.localeCompare(a.orderDate);
        }
        if (sortBy === 'highest_amount') {
          return b.totalAmount - a.totalAmount;
        }
        return 0;
      });
  }, [orders, onlyPoFilter, filterUrgency, searchQuery, sortBy]);

  // Paginated display orders
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, displayOrders.length);
  const paginatedOrders = useMemo(() => {
    return displayOrders.slice(startIndex, endIndex);
  }, [displayOrders, startIndex, endIndex]);

  const handleStartEditNotes = (order: ShopeeOrderRecord) => {
    setEditingNotesId(order.orderId);
    setTempNotes(order.adminNotes || '');
  };

  const handleSaveNotes = (orderId: string) => {
    onUpdateNotes?.(orderId, tempNotes);
    setEditingNotesId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Alert Banner for Overdue / Today Deadlines */}
      {poSummary.overdueCount > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-900 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">
                Perhatian: {poSummary.overdueCount} Pesanan Melewati Batas Waktu Pengiriman!
              </h4>
              <p className="text-xs text-red-700 mt-0.5">
                Pesanan yang melebihi tenggat pengemasan Shopee berisiko <strong>dibatalkan otomatis oleh sistem</strong> dan dikenakan poin penalti keterlambatan kirim (Late Shipment Rate).
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setFilterUrgency('overdue');
              setOnlyPoFilter(false);
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shrink-0 transition-colors shadow-xs"
          >
            Lihat Pesanan Lewat Batas
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-orange-100 flex items-center justify-center text-orange-600">
                <Timer className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Monitoring Pesanan Pre-Order (PO) & Tenggat Waktu Pengiriman
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pantau batas waktu pengemasan (Ship-by-Date) pesanan PO & reguler untuk mencegah pembatalan otomatis dan menjaga performa operasional toko.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-mono tabular-nums text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              Total PO: <strong>{poSummary.totalPoOrders}</strong> | Menunggu Kirim:{' '}
              <strong>{poSummary.pendingPoOrders}</strong>
            </span>
          </div>
        </div>

        {/* Urgency Status Metric Cards (4 Cards Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Lewat Tenggat */}
          <div
            onClick={() => setFilterUrgency(filterUrgency === 'overdue' ? 'all' : 'overdue')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              filterUrgency === 'overdue'
                ? 'bg-red-50 border-red-400 ring-2 ring-red-400/20'
                : 'bg-white border-slate-200 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">
                Lewat Tenggat
              </span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-red-700">
                {poSummary.overdueCount}
              </span>
              <span className="text-xs text-red-500">paket terlambat</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Risiko auto-cancel Shopee
            </span>
          </div>

          {/* 2. Tenggat Hari Ini */}
          <div
            onClick={() => setFilterUrgency(filterUrgency === 'today' ? 'all' : 'today')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              filterUrgency === 'today'
                ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-400/20'
                : 'bg-white border-slate-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-orange-700 uppercase tracking-wider">
                Tenggat Hari Ini
              </span>
              <Flame className="w-4 h-4 text-orange-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-orange-700">
                {poSummary.todayCount}
              </span>
              <span className="text-xs text-orange-500">paket (&lt;24 Jam)</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Wajib pick-up / drop-off hari ini
            </span>
          </div>

          {/* 3. Mendekati Tenggat (H-1 / H-2) */}
          <div
            onClick={() => setFilterUrgency(filterUrgency === 'near' ? 'all' : 'near')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              filterUrgency === 'near'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
                : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                H-1 s/d H-2 Tenggat
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-amber-800">
                {poSummary.nearCount}
              </span>
              <span className="text-xs text-amber-600">paket (&lt;48 Jam)</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Tahap akhir QC & pengemasan
            </span>
          </div>

          {/* 4. Masih Aman */}
          <div
            onClick={() => setFilterUrgency(filterUrgency === 'safe' ? 'all' : 'safe')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              filterUrgency === 'safe'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20'
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                Masih Aman (&gt;2 Hari)
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
                {poSummary.safeCount}
              </span>
              <span className="text-xs text-emerald-600">paket</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Dalam proses produksi / jahit
            </span>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs shadow-xs">
        {/* Left: Search & Mode */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Pesanan PO, Produk, Pembeli..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Toggle Only PO */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md border border-slate-200">
            <button
              onClick={() => setOnlyPoFilter(true)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                onlyPoFilter
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hanya Pre-Order (PO)
            </button>
            <button
              onClick={() => setOnlyPoFilter(false)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                !onlyPoFilter
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Perlu Dikirim
            </button>
          </div>
        </div>

        {/* Right: Sort and Reset */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Urutkan:</span>
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="py-1 px-2.5 bg-white border border-slate-300 rounded-md text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="urgent_first">Tenggat Terdekat (Paling Mendesak)</option>
            <option value="newest_order">Pesanan Terbaru</option>
            <option value="highest_amount">Nilai Tertinggi</option>
          </select>

          {(filterUrgency !== 'all' || searchQuery || !onlyPoFilter) && (
            <button
              onClick={() => {
                setFilterUrgency('all');
                setSearchQuery('');
                setOnlyPoFilter(true);
              }}
              className="text-xs text-slate-500 hover:text-slate-900 underline ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800">
            Daftar Antrean Pengiriman ({displayOrders.length} Pesanan)
          </span>
          <span className="text-slate-500">
            Nilai Tertahan di Antrean: <strong>{formatRupiah(displayOrders.reduce((sum, o) => sum + o.totalAmount, 0))}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-medium">
                <th className="py-2.5 px-3">No. Pesanan & Tanggal</th>
                <th className="py-2.5 px-3">Produk & Durasi PO</th>
                <th className="py-2.5 px-3">Tenggat Batas Kirim</th>
                <th className="py-2.5 px-3">Status Sisa Waktu</th>
                <th className="py-2.5 px-3">Pembeli & Kurir</th>
                <th className="py-2.5 px-3 text-right">Total Transaksi</th>
                <th className="py-2.5 px-3 text-center">Catatan / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada pesanan antrean pengiriman yang sesuai dengan kriteria filter saat ini.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const deadline = getDeadlineDetail(order);
                  const isEditingNotes = editingNotesId === order.orderId;

                  return (
                    <tr
                      key={order.orderId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        deadline.urgency === 'overdue'
                          ? 'bg-red-50/25'
                          : deadline.urgency === 'today'
                          ? 'bg-orange-50/20'
                          : ''
                      }`}
                    >
                      {/* No. Pesanan & Tanggal */}
                      <td className="py-2.5 px-3 align-top">
                        <button
                          onClick={() => onSelectOrder(order)}
                          className="font-mono tabular-nums font-semibold text-slate-900 hover:text-orange-600 text-left block"
                        >
                          {order.orderId}
                        </button>
                        <span className="text-slate-400 text-[11px] font-mono tabular-nums block">
                          Masuk: {order.orderDate}
                        </span>
                        {order.isPreOrder && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            PO {order.preOrderDays || 7} Hari
                          </span>
                        )}
                      </td>

                      {/* Produk */}
                      <td className="py-2.5 px-3 align-top max-w-xs">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="mb-1 last:mb-0">
                            <span className="font-semibold text-slate-900 line-clamp-2" title={it.productName}>
                              {it.productName}
                            </span>
                            <span className="text-[11px] text-slate-400 block font-mono">
                              SKU: {it.sku} · Qty: {it.quantity} pcs · Var: {it.variation}
                            </span>
                          </div>
                        ))}
                      </td>

                      {/* Tenggat Waktu Pengiriman */}
                      <td className="py-2.5 px-3 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold font-mono tabular-nums">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{order.shipDeadline || 'D+2 SLA Reguler'}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Batas Maksimal Pengemasan
                        </span>
                      </td>

                      {/* Status Sisa Waktu */}
                      <td className="py-2.5 px-3 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs border ${deadline.badgeClass}`}
                        >
                          {deadline.urgency === 'overdue' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                          {deadline.urgency === 'today' && <Flame className="w-3.5 h-3.5 shrink-0" />}
                          {deadline.urgency === 'near' && <Clock className="w-3.5 h-3.5 shrink-0" />}
                          {deadline.urgency === 'safe' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                          <span>{deadline.statusLabel}</span>
                        </span>
                      </td>

                      {/* Pembeli & Kurir */}
                      <td className="py-2.5 px-3 align-top">
                        <span className="font-medium text-slate-800 block">
                          {order.buyerUsername}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Truck className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{order.courier}</span>
                        </div>
                        {order.recipientCity && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-[130px]">
                            {order.recipientCity}
                          </span>
                        )}
                      </td>

                      {/* Total Nilai Transaksi */}
                      <td className="py-2.5 px-3 align-top text-right font-mono tabular-nums">
                        <span className="font-bold text-slate-900 block">
                          {formatRupiah(order.totalAmount)}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {order.isCod ? 'Metode COD' : 'Non-COD'}
                        </span>
                      </td>

                      {/* Catatan / Aksi */}
                      <td className="py-2.5 px-3 align-top text-center space-y-1">
                        {isEditingNotes ? (
                          <div className="space-y-1 text-left min-w-[150px]">
                            <textarea
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="Catatan konveksi/produksi..."
                              className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                              rows={2}
                            />
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="px-2 py-0.5 text-[11px] text-slate-500 hover:text-slate-800"
                              >
                                Batal
                              </button>
                              <button
                                onClick={() => handleSaveNotes(order.orderId)}
                                className="px-2 py-0.5 text-[11px] bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded"
                              >
                                Simpan
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {order.adminNotes && (
                              <p className="text-[11px] text-slate-600 italic bg-amber-50/80 p-1.5 rounded border border-amber-200 text-left line-clamp-2 max-w-[160px] mx-auto">
                                "{order.adminNotes}"
                              </p>
                            )}
                            <div className="flex items-center justify-center gap-1 pt-0.5">
                              <button
                                onClick={() => handleStartEditNotes(order)}
                                className="px-2 py-0.5 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                              >
                                {order.adminNotes ? 'Ubah Catatan' : '+ Catatan PO'}
                              </button>
                              <button
                                onClick={() => onSelectOrder(order)}
                                className="px-2 py-0.5 text-[11px] text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded border border-orange-200 font-medium transition-colors"
                              >
                                Detail
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {displayOrders.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalItems={displayOrders.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 25, 50]}
            itemLabel="pesanan antrean"
          />
        )}
      </div>

      {/* Info Card: Ketentuan SLA Shopee & Batas Pengiriman */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Info className="w-4 h-4 text-orange-600" />
          <span>Panduan Operasional Tenggat Pengiriman (SLA Shopee Seller Centre):</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
          <ul className="list-disc space-y-1">
            <li>
              <strong>Pesanan Reguler (Ready Stock):</strong> Batas waktu pengiriman adalah <strong>2 hari kerja (D+2)</strong> sejak pesanan dibayar.
            </li>
            <li>
              <strong>Pesanan Pre-Order (PO):</strong> Masa pengemasan dapat diatur <strong>7 hingga 30 hari kerja</strong> sesuai waktu pengerjaan produksi atau custom bordir/jahit.
            </li>
          </ul>
          <ul className="list-disc space-y-1">
            <li>
              <strong>Risiko Keterlambatan:</strong> Melewati tenggat kirim menyebabkan pesanan <strong>dibatalkan otomatis oleh sistem Shopee</strong> dan memicu poin penalti <em>Tingkat Keterlambatan Pengiriman (LSR)</em>.
            </li>
            <li>
              <strong>Input Resi & Drop-Off:</strong> Pastikan paket telah di-scan oleh kurir ekspedisi sebelum pukul 23:59 WIB pada hari tenggat berakhir.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
