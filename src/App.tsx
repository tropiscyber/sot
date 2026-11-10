import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Sidebar, ActiveNavMenu } from './components/Sidebar';
import { Header } from './components/Header';
import { OrderTable } from './components/OrderTable';
import { ReturnTrackingPanel } from './components/ReturnTrackingPanel';
import { CodAnalysisPanel } from './components/CodAnalysisPanel';
import { MonthlySalesTrendChart } from './components/MonthlySalesTrendChart';
import { ProductAnalyticsSection } from './components/ProductAnalyticsSection';
import { OrderStatusSummary } from './components/OrderStatusSummary';
import { PoDeadlinePanel } from './components/PoDeadlinePanel';
import { DateRangePicker } from './components/DateRangePicker';
import { FileUploadModal } from './components/FileUploadModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { AccessManagementModal } from './components/AccessManagementModal';
import { ShopeeOrderRecord, PhysicalReturnStatus } from './types/shopee';
import {
  loadOrdersFromStorage,
  saveOrdersToStorage,
  clearOrdersFromStorage,
  exportOrdersToExcel,
  purgeSampleOrders,
} from './utils/storage';
import { calculateAnalytics } from './utils/analytics';
import { exportDashboardSummaryToPdf } from './utils/pdfExport';
import { calculatePoAnalytics } from './utils/poDeadline';
import { mergeOrderDatasets } from './utils/shopeeParser';
import { SAMPLE_SHOPEE_ORDERS, isSampleOrder } from './utils/sampleData';
import {
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Sparkles,
  ArrowRight,
  Package,
  Store,
} from 'lucide-react';

function DashboardApp() {
  const { isAuthenticated, isLoading, profile, logout } = useAuth();
  const [orders, setOrders] = useState<ShopeeOrderRecord[]>([]);
  const [activeMenu, setActiveMenu] = useState<ActiveNavMenu>('dashboard');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ShopeeOrderRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load orders on boot
  useEffect(() => {
    const loaded = loadOrdersFromStorage();
    setOrders(loaded);
  }, []);

  // Save to storage on orders change
  const handleUpdateOrders = (newOrders: ShopeeOrderRecord[]) => {
    setOrders(newOrders);
    saveOrdersToStorage(newOrders);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Import incoming orders from parsed file
  const handleImportOrders = (
    incoming: ShopeeOrderRecord[],
    sourceFileName: string,
    replaceExisting: boolean
  ) => {
    if (replaceExisting) {
      handleUpdateOrders(incoming);
      showToast(
        `Berhasil memuat ${incoming.length} pesanan asli Shopee dari "${sourceFileName}". Data contoh telah dibersihkan.`
      );
    } else {
      const realExisting = purgeSampleOrders(orders);
      const result = mergeOrderDatasets(realExisting, incoming);
      handleUpdateOrders(result.merged);
      showToast(
        `Berhasil merekap ${incoming.length} pesanan dari "${sourceFileName}". (${result.newCount} baru, ${result.updatedCount} diperbarui)`
      );
    }
  };

  // Purge demo/sample data only
  const handlePurgeSampleData = () => {
    const onlyReal = purgeSampleOrders(orders);
    handleUpdateOrders(onlyReal);
    showToast(
      onlyReal.length === 0
        ? 'Data contoh berhasil dihapus. Aplikasi kini bersih.'
        : `Data contoh dibersihkan! Tersisa ${onlyReal.length} pesanan asli Shopee.`
    );
  };

  // Reset or reload sample data
  const handleLoadSample = () => {
    handleUpdateOrders(SAMPLE_SHOPEE_ORDERS);
    showToast('Data contoh Shopee Seller Centre berhasil dimuat!');
  };

  const handleResetData = () => {
    if (window.confirm('Bersihkan seluruh data pesanan dan mulai lembar kosong?')) {
      clearOrdersFromStorage();
      handleUpdateOrders([]);
      showToast('Seluruh data pesanan telah dikosongkan.');
    }
  };

  // Navigation from KPI cards or product analytics
  const handleNavigateFromSummary = (menu: ActiveNavMenu, filter?: string) => {
    if (filter) {
      setStatusFilter(filter);
    }
    setActiveMenu(menu);
  };

  const handleSelectProductFilter = (productName: string) => {
    setSearchQuery(productName);
    setStatusFilter('all');
    setActiveMenu('orders');
    showToast(
      `Memfilter tabel pesanan untuk: "${productName.length > 30 ? productName.slice(0, 30) + '...' : productName}"`
    );
  };

  // Update physical status of returned parcel
  const handleUpdatePhysicalStatus = (orderId: string, status: PhysicalReturnStatus) => {
    const updated = orders.map((o) => {
      if (o.orderId === orderId) {
        return {
          ...o,
          physicalStatus: status,
          updatedAt: new Date().toISOString(),
        };
      }
      return o;
    });
    handleUpdateOrders(updated);
    showToast(`Status fisik pesanan #${orderId} berhasil diperbarui.`);
  };

  // Update notes
  const handleUpdateNotes = (orderId: string, notes: string) => {
    const updated = orders.map((o) => {
      if (o.orderId === orderId) {
        return {
          ...o,
          adminNotes: notes,
          updatedAt: new Date().toISOString(),
        };
      }
      return o;
    });
    handleUpdateOrders(updated);
  };

  // Update single order from modal
  const handleUpdateSingleOrder = (updatedOrder: ShopeeOrderRecord) => {
    const updated = orders.map((o) => (o.orderId === updatedOrder.orderId ? updatedOrder : o));
    handleUpdateOrders(updated);
    setSelectedOrder(updatedOrder);
    showToast(`Perubahan pesanan #${updatedOrder.orderId} tersimpan.`);
  };

  // Exports
  const handleExportAll = () => {
    exportOrdersToExcel(orders, `Rekap_Semua_Pesanan_Shopee_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('File Excel rekap berhasil diunduh.');
  };

  const handleExportPdf = () => {
    try {
      exportDashboardSummaryToPdf(dashboardOrders);
      showToast('Laporan ringkasan PDF untuk manajemen berhasil diunduh.');
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengekspor PDF.');
    }
  };

  const handleExportFiltered = (filtered: ShopeeOrderRecord[]) => {
    exportOrdersToExcel(
      filtered,
      `Rekap_Pesanan_Shopee_Filtered_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    showToast(`${filtered.length} pesanan hasil filter berhasil diekspor ke Excel.`);
  };

  // Filtered orders for dashboard scope
  const dashboardOrders = useMemo(() => {
    if (!startDate && !endDate) return orders;
    return orders.filter((o) => {
      const orderDateOnly = o.orderDate.slice(0, 10);
      if (startDate && orderDateOnly < startDate) return false;
      if (endDate && orderDateOnly > endDate) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  const analytics = calculateAnalytics(dashboardOrders);
  const poSummary = calculatePoAnalytics(dashboardOrders);
  const returnOrdersCount = analytics.returnedOrders;
  const hasSampleOrders = orders.some(isSampleOrder);
  const sampleOrdersCount = orders.filter(isSampleOrder).length;
  const realOrdersCount = orders.filter((o) => !isSampleOrder(o)).length;

  // 1. Loading Splash Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center text-white animate-pulse shadow-lg mb-3">
          <Store className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-white tracking-wide">Memverifikasi Sesi Toko...</p>
        <span className="text-xs text-slate-400 mt-1">Firebase Authentication</span>
      </div>
    );
  }

  // 2. Security Gate: If not authenticated, show LoginPage
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 3. Authenticated: Render Main App
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeMenu={activeMenu}
        onSelectMenu={(menu) => setActiveMenu(menu)}
        orderCount={orders.length}
        returnCount={returnOrdersCount}
        codCount={analytics.codTotalOrders}
        poCount={poSummary.totalPoOrders}
        poUrgentCount={poSummary.overdueCount + poSummary.todayCount}
        hasSampleOrders={hasSampleOrders}
        onResetData={handleResetData}
        onPurgeSample={handlePurgeSampleData}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        userName={profile?.displayName}
        userEmail={profile?.email}
        userPhoto={profile?.photoURL}
        onLogout={logout}
        onOpenAccessModal={() => setIsAccessModalOpen(true)}
      />

      {/* 2. Main Right Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header Navigation (Global Actions & Exports) */}
        <Header
          activeMenu={activeMenu}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenUpload={() => setIsUploadOpen(true)}
          onExportExcel={handleExportAll}
          onExportPdf={orders.length > 0 ? handleExportPdf : undefined}
          onResetData={handleResetData}
          onNavigateToPo={() => setActiveMenu('po_deadline')}
          poUrgentCount={poSummary.overdueCount + poSummary.todayCount}
          orderCount={orders.length}
          userName={profile?.displayName}
          userPhoto={profile?.photoURL}
          onLogout={logout}
          onOpenAccessModal={() => setIsAccessModalOpen(true)}
        />

        {/* Dedicated Main Viewport Per Menu */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Zero State if No Orders */}
          {orders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Belum Ada Data Pesanan Shopee</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Unggah file export berkala Excel (.xlsx) atau CSV dari Shopee Seller Centre untuk mulai merekap status pesanan, memantau paket retur, dan mendeteksi gagal bayar COD.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Laporan Shopee (.xlsx / .csv)</span>
                </button>
                <button
                  onClick={handleLoadSample}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span>Muat Contoh Data Demo</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Urgent PO Alert Banner */}
              {(poSummary.overdueCount > 0 || poSummary.todayCount > 0) && (
                <div className="bg-red-50/90 border border-red-200 rounded-lg p-3.5 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-800 shadow-xs">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0 mt-1 sm:mt-0" />
                    <div>
                      <span className="font-bold text-red-950">Perhatian Batas Pengiriman Shopee:</span>{' '}
                      <span>
                        Terdapat{' '}
                        <strong className="text-red-700 font-mono tabular-nums">{poSummary.overdueCount} pesanan lewat batas</strong> dan{' '}
                        <strong className="text-orange-700 font-mono tabular-nums">{poSummary.todayCount} pesanan batas hari ini</strong>. Segera proses agar tidak otomatis dibatalkan Shopee.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveMenu('po_deadline')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shrink-0 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    Buka Antrean Tenggat PO &rarr;
                  </button>
                </div>
              )}

              {/* VIEW 1: DASHBOARD RINGKASAN */}
              {activeMenu === 'dashboard' && (
                <div className="space-y-6">
                  {/* Date Range Toolbar */}
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onDateRangeChange={(start, end, label) => {
                      setStartDate(start);
                      setEndDate(end);
                      showToast(`Memfilter analisis periode: ${label || `${start} s/d ${end}`}`);
                    }}
                    onResetDateRange={() => {
                      setStartDate('');
                      setEndDate('');
                      showToast('Filter tanggal di-reset ke Semua Periode Data.');
                    }}
                    filteredCount={dashboardOrders.length}
                    totalCount={orders.length}
                  />

                  {/* 6-Card Master KPI Matrix */}
                  <OrderStatusSummary
                    analytics={analytics}
                    currentStatusFilter={statusFilter}
                    onSelectStatusFilter={(st) => setStatusFilter(st)}
                    onNavigateMenu={handleNavigateFromSummary}
                    urgentPoCount={poSummary.overdueCount + poSummary.todayCount}
                  />

                  {/* Symmetrical 2-Column Visual Section */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
                    <MonthlySalesTrendChart
                      orders={dashboardOrders}
                      onSelectMonthFilter={(monthKey) => {
                        const [year, month] = monthKey.split('-');
                        const lastDay = new Date(Number(year), Number(month), 0).getDate();
                        const mStart = `${monthKey}-01`;
                        const mEnd = `${monthKey}-${String(lastDay).padStart(2, '0')}`;
                        setStartDate(mStart);
                        setEndDate(mEnd);
                        showToast(`Filter periode dipersempit ke bulan: ${monthKey}`);
                      }}
                      onExportPdf={() => showToast('Laporan ringkasan PDF untuk manajemen berhasil diunduh.')}
                    />

                    <ProductAnalyticsSection
                      orders={dashboardOrders}
                      onSelectProductFilter={handleSelectProductFilter}
                    />
                  </div>

                  {/* Quick Jump Bar to Full Orders */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-orange-100 text-orange-700">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Kelola & Cari Data Pesanan Lengkap</h4>
                        <p className="text-[11px] text-slate-500">
                          Beralih ke tabel pesanan penuh untuk pencarian resi, filter status detail, atau ekspor batch.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveMenu('orders')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      <span>Buka Tabel Pesanan ({orders.length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 2: SEMUA PESANAN (Dedicated Workspace) */}
              {activeMenu === 'orders' && (
                <div className="space-y-4">
                  <OrderTable
                    orders={orders}
                    statusFilter={statusFilter}
                    onStatusFilterChange={(st) => setStatusFilter(st)}
                    searchQuery={searchQuery}
                    onSearchQueryChange={(q) => setSearchQuery(q)}
                    startDate={startDate}
                    endDate={endDate}
                    onSelectOrder={(o) => setSelectedOrder(o)}
                    onExportFiltered={handleExportFiltered}
                  />
                </div>
              )}

              {/* VIEW 3: TRACKING RETUR FISIK (Dedicated Workspace) */}
              {activeMenu === 'returns' && (
                <div className="space-y-4">
                  <ReturnTrackingPanel
                    orders={orders}
                    onUpdatePhysicalStatus={handleUpdatePhysicalStatus}
                    onUpdateNotes={handleUpdateNotes}
                    onSelectOrder={(o) => setSelectedOrder(o)}
                  />
                </div>
              )}

              {/* VIEW 4: ANALISIS COD & KURIR (Dedicated Workspace) */}
              {activeMenu === 'cod' && (
                <div className="space-y-4">
                  <CodAnalysisPanel orders={orders} />
                </div>
              )}

              {/* VIEW 5: TENGGAT KIRIM & PO (Dedicated Workspace) */}
              {activeMenu === 'po_deadline' && (
                <div className="space-y-4">
                  <PoDeadlinePanel
                    orders={orders}
                    onSelectOrder={(o) => setSelectedOrder(o)}
                    onUpdateNotes={handleUpdateNotes}
                  />
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 mt-auto text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            <span>Shopee Order & Return Tracker · Sistem Rekapitulasi Seller Centre Shopee Indonesia</span>
          </div>
        </footer>
      </div>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImportOrders={handleImportOrders}
        onLoadSampleData={handleLoadSample}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateOrder={handleUpdateSingleOrder}
      />

      {/* Access Management Modal (Whitelist & PIN) */}
      <AccessManagementModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardApp />
    </AuthProvider>
  );
}
