import React, { useState, useMemo } from 'react';
import { ShopeeOrderRecord, FilterOptions } from '../types/shopee';
import { formatRupiah } from '../utils/analytics';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import { PaginationControls } from './PaginationControls';

interface OrderTableProps {
  orders: ShopeeOrderRecord[];
  onSelectOrder: (order: ShopeeOrderRecord) => void;
  onExportFiltered: (filtered: ShopeeOrderRecord[]) => void;
  initialStatusFilter?: string;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  startDate?: string;
  endDate?: string;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  onSelectOrder,
  onExportFiltered,
  initialStatusFilter = 'all',
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  startDate,
  endDate,
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: searchQuery || '',
    statusFilter: statusFilter || initialStatusFilter,
    paymentFilter: 'all',
    courierFilter: 'all',
    physicalStatusFilter: 'all',
    startDate: startDate || '',
    endDate: endDate || '',
    returnReasonFilter: 'all',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Sync when statusFilter prop changes from parent
  React.useEffect(() => {
    if (statusFilter !== undefined) {
      setFilters((prev) => ({ ...prev, statusFilter }));
      setCurrentPage(1);
    }
  }, [statusFilter]);

  // Sync when searchQuery prop changes from parent
  React.useEffect(() => {
    if (searchQuery !== undefined) {
      setFilters((prev) => ({ ...prev, searchQuery }));
      setCurrentPage(1);
    }
  }, [searchQuery]);

  // Sync when startDate or endDate prop changes from parent
  React.useEffect(() => {
    if (startDate !== undefined || endDate !== undefined) {
      setFilters((prev) => ({
        ...prev,
        startDate: startDate || '',
        endDate: endDate || '',
      }));
      setCurrentPage(1);
    }
  }, [startDate, endDate]);

  // Extract unique couriers for dropdown
  const couriersList = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.courier) set.add(o.courier);
    });
    return Array.from(set);
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesOrder =
          o.orderId.toLowerCase().includes(q) ||
          o.buyerUsername.toLowerCase().includes(q) ||
          o.trackingNumber.toLowerCase().includes(q) ||
          (o.returnReason && o.returnReason.toLowerCase().includes(q)) ||
          o.items.some((it) => it.productName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q));

        if (!matchesOrder) return false;
      }

      // Status
      if (filters.statusFilter !== 'all') {
        if (filters.statusFilter === 'po_only') {
          if (!o.isPreOrder) return false;
        } else if (filters.statusFilter === 'returned') {
          if (!o.isReturned && o.normalizedStatus !== 'returned' && o.normalizedStatus !== 'return_process') {
            return false;
          }
        } else if (filters.statusFilter === 'completed') {
          if (o.normalizedStatus !== 'completed') return false;
        } else if (filters.statusFilter === 'in_transit') {
          if (o.normalizedStatus !== 'in_transit') return false;
        } else if (filters.statusFilter === 'to_ship') {
          if (o.normalizedStatus !== 'to_ship') return false;
        } else if (filters.statusFilter === 'cancelled') {
          if (o.normalizedStatus !== 'cancelled') return false;
        }
      }

      // Payment
      if (filters.paymentFilter === 'cod' && !o.isCod) return false;
      if (filters.paymentFilter === 'non_cod' && o.isCod) return false;

      // Courier
      if (filters.courierFilter !== 'all' && o.courier !== filters.courierFilter) {
        return false;
      }

      // Date Range
      if (filters.startDate) {
        const orderDateOnly = o.orderDate.slice(0, 10);
        if (orderDateOnly < filters.startDate) return false;
      }
      if (filters.endDate) {
        const orderDateOnly = o.orderDate.slice(0, 10);
        if (orderDateOnly > filters.endDate) return false;
      }

      return true;
    });
  }, [orders, filters]);

  const updateFilter = (updater: (prev: FilterOptions) => FilterOptions) => {
    setFilters(updater);
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredOrders.length);

  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, startIndex, endIndex]);

  const toggleExpand = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const getStatusDisplay = (order: ShopeeOrderRecord) => {
    if (order.isReturned || order.normalizedStatus === 'returned') {
      return (
        <span className="text-red-700 font-semibold">
          Retur / Gagal Kirim
        </span>
      );
    }
    if (order.normalizedStatus === 'completed') {
      return (
        <span className="text-emerald-700 font-semibold">
          Selesai
        </span>
      );
    }
    if (order.normalizedStatus === 'cancelled') {
      return (
        <span className="text-slate-500 font-medium">
          Dibatalkan
        </span>
      );
    }
    if (order.normalizedStatus === 'to_ship') {
      return (
        <span className="text-blue-700 font-semibold">
          Perlu Dikirim
        </span>
      );
    }
    return (
      <span className="text-sky-700 font-medium">
        Sedang Dikirim
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden space-y-0">
      {/* Search & Filter Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => {
                updateFilter((prev) => ({ ...prev, searchQuery: e.target.value }));
                onSearchQueryChange?.(e.target.value);
              }}
              placeholder="Cari No. Pesanan, Resi, Pembeli, atau Produk..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Export Filtered */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {filteredOrders.length} dari {orders.length} pesanan
            </span>
            <button
              onClick={() => onExportFiltered(filteredOrders)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Hasil Filter</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-200/60 rounded-md">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'po_only', label: 'Pre-Order (PO)' },
              { id: 'to_ship', label: 'Perlu Dikirim' },
              { id: 'in_transit', label: 'Dikirim' },
              { id: 'completed', label: 'Selesai' },
              { id: 'returned', label: 'Retur/Gagal' },
              { id: 'cancelled', label: 'Batal' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  updateFilter((prev) => ({ ...prev, statusFilter: tab.id }));
                  onStatusFilterChange?.(tab.id);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  filters.statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Payment COD vs Non-COD */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-200/60 rounded-md">
            {[
              { id: 'all', label: 'Semua Bayar' },
              { id: 'cod', label: 'COD Saja' },
              { id: 'non_cod', label: 'Non-COD' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => updateFilter((prev) => ({ ...prev, paymentFilter: p.id as any }))}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  filters.paymentFilter === p.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Courier select */}
          <select
            value={filters.courierFilter}
            onChange={(e) => updateFilter((prev) => ({ ...prev, courierFilter: e.target.value }))}
            className="text-xs py-1 px-2.5 bg-white border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="all">Semua Kurir</option>
            {couriersList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter((prev) => ({ ...prev, startDate: e.target.value }))}
              className="py-1 px-2 text-xs bg-white border border-slate-300 rounded-md text-slate-700"
              title="Mulai Tanggal"
            />
            <span>-</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter((prev) => ({ ...prev, endDate: e.target.value }))}
              className="py-1 px-2 text-xs bg-white border border-slate-300 rounded-md text-slate-700"
              title="Sampai Tanggal"
            />
          </div>

          {/* Reset Filters */}
          {(filters.searchQuery ||
            filters.statusFilter !== 'all' ||
            filters.paymentFilter !== 'all' ||
            filters.courierFilter !== 'all' ||
            filters.startDate ||
            filters.endDate) && (
            <button
              onClick={() =>
                updateFilter(() => ({
                  searchQuery: '',
                  statusFilter: 'all',
                  paymentFilter: 'all',
                  courierFilter: 'all',
                  physicalStatusFilter: 'all',
                  startDate: '',
                  endDate: '',
                  returnReasonFilter: 'all',
                }))
              }
              className="text-xs text-slate-500 hover:text-slate-800 underline ml-auto"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-medium">
              <th className="w-8 py-2.5 pl-3"></th>
              <th className="py-2.5 px-3">No. Pesanan & Tanggal</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Pembeli & Resi</th>
              <th className="py-2.5 px-3">Metode & Kurir</th>
              <th className="py-2.5 px-3 text-right">Total Transaksi</th>
              <th className="py-2.5 px-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  Tidak ada pesanan yang sesuai dengan filter atau kata kunci pencarian.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => {
                const isExpanded = expandedRowId === order.orderId;

                return (
                  <React.Fragment key={order.orderId}>
                    <tr
                      className={`hover:bg-slate-50/80 transition-colors ${
                        order.isReturned ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Expander Icon */}
                      <td className="py-2.5 pl-3">
                        <button
                          onClick={() => toggleExpand(order.orderId)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-700" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>

                      {/* No. Pesanan & Tanggal */}
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => onSelectOrder(order)}
                          className="font-mono tabular-nums font-semibold text-slate-900 hover:text-orange-600 text-left block"
                        >
                          {order.orderId}
                        </button>
                        <span className="text-slate-400 text-[11px] font-mono tabular-nums block">
                          {order.orderDate}
                        </span>
                        {order.isPreOrder && (
                          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 mt-1">
                            PO {order.preOrderDays || 7} Hari
                          </span>
                        )}
                        {order.shipDeadline && order.normalizedStatus === 'to_ship' && (
                          <span className="text-[10px] text-orange-700 font-mono font-medium block mt-0.5" title="Batas Waktu Pengiriman">
                            Tenggat: {order.shipDeadline.slice(0, 16)}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        {getStatusDisplay(order)}
                        {order.returnReason && (
                          <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
                            {order.returnReason}
                          </span>
                        )}
                      </td>

                      {/* Pembeli & Resi */}
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-slate-800 block">
                          {order.buyerUsername}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500 text-[11px] block">
                          {order.trackingNumber}
                        </span>
                      </td>

                      {/* Metode & Kurir */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-medium ${
                              order.isCod ? 'text-orange-700 font-semibold' : 'text-slate-700'
                            }`}
                          >
                            {order.isCod ? 'COD' : order.paymentMethod || 'Non-COD'}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[11px] block truncate max-w-[150px]">
                          {order.courier}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <span className="font-semibold text-slate-900 block">
                          {formatRupiah(order.totalAmount)}
                        </span>
                        {order.isReturned && order.estimatedReturnLoss > 0 && (
                          <span className="text-[11px] text-red-600 block">
                            Rugi: {formatRupiah(order.estimatedReturnLoss)}
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onSelectOrder(order)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded text-xs font-medium transition-colors"
                        >
                          Rincian
                        </button>
                      </td>
                    </tr>

                    {/* Expanded details */}
                    {isExpanded && (
                      <tr className="bg-slate-50 border-y border-slate-200">
                        <td colSpan={7} className="p-4 pl-12">
                          <div className="text-xs space-y-2">
                            <div className="font-semibold text-slate-700">Daftar Produk Pesanan:</div>
                            <div className="divide-y divide-slate-200/60 bg-white rounded border border-slate-200 p-2">
                              {order.items.map((it, idx) => (
                                <div
                                  key={idx}
                                  className="py-1.5 flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <span className="font-medium text-slate-900">
                                      {it.productName}
                                    </span>
                                    <span className="text-slate-400 text-[11px] block">
                                      SKU: {it.sku} · Variasi: {it.variation}
                                    </span>
                                  </div>
                                  <div className="text-right font-mono tabular-nums">
                                    <span className="text-slate-600">
                                      {it.quantity} x {formatRupiah(it.dealPrice)}
                                    </span>
                                    <span className="font-semibold text-slate-900 block">
                                      {formatRupiah(it.subtotal)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {order.adminNotes && (
                              <div className="p-2 bg-amber-50/80 rounded border border-amber-200 text-amber-900 text-xs">
                                <strong>Catatan Admin Gudang:</strong> {order.adminNotes}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalItems={filteredOrders.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        itemLabel="pesanan"
      />
    </div>
  );
};
