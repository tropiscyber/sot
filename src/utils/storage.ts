import * as XLSX from 'xlsx';
import { ShopeeOrderRecord } from '../types/shopee';
import { SAMPLE_SHOPEE_ORDERS, isSampleOrder } from './sampleData';

const STORAGE_KEY = 'shopee_order_tracker_records_v1';

export function purgeSampleOrders(orders: ShopeeOrderRecord[]): ShopeeOrderRecord[] {
  return orders.filter((o) => !isSampleOrder(o));
}

export function loadOrdersFromStorage(): ShopeeOrderRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time without any prior data: start empty so real data is never polluted
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const realOrders = parsed.filter((o) => !isSampleOrder(o));
      const sampleOrders = parsed.filter((o) => isSampleOrder(o));

      // If user has real uploaded orders mixed with sample dummy orders, automatically purge the sample dummy orders!
      if (realOrders.length > 0 && sampleOrders.length > 0) {
        saveOrdersToStorage(realOrders);
        return realOrders;
      }
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Error loading from storage:', err);
    return [];
  }
}

export function saveOrdersToStorage(orders: ShopeeOrderRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Error saving to storage:', err);
  }
}

export function clearOrdersFromStorage(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (err) {
    console.error('Error clearing storage:', err);
  }
}

export function exportOrdersToExcel(orders: ShopeeOrderRecord[], filename = 'Rekap_Pesanan_Shopee.xlsx'): void {
  // Sheet 1: Semua Pesanan
  const allOrdersRows = orders.map((o, idx) => ({
    'No': idx + 1,
    'No. Pesanan': o.orderId,
    'Status Pesanan': o.orderStatus,
    'Kategori Status': o.normalizedStatus,
    'Waktu Pesanan Dibuat': o.orderDate,
    'No. Resi': o.trackingNumber,
    'Jasa Kirim': o.courier,
    'Metode Pembayaran': o.paymentMethod,
    'COD?': o.isCod ? 'Ya' : 'Tidak',
    'Total Pembayaran (Rp)': o.totalAmount,
    'Ongkir (Rp)': o.shippingFee,
    'Retur?': o.isReturned ? 'Ya' : 'Tidak',
    'Alasan Retur / Batal': o.returnReason || '-',
    'Status Pengembalian': o.returnStatus || '-',
    'Status Fisik Paket': mapPhysicalStatusLabel(o.physicalStatus),
    'Catatan Seller': o.adminNotes || '-',
    'Daftar Produk': o.items.map(it => `${it.productName} (${it.variation}) x${it.quantity}`).join('; '),
  }));

  // Sheet 2: Khusus Pesanan Retur
  const returnOrders = orders.filter(o => o.isReturned || o.normalizedStatus === 'returned' || o.normalizedStatus === 'return_process');
  const returnRows = returnOrders.map((o, idx) => ({
    'No': idx + 1,
    'No. Pesanan': o.orderId,
    'Waktu Pesanan': o.orderDate,
    'No. Resi Pengiriman': o.trackingNumber,
    'No. Resi Retur': o.returnTrackingNumber || '-',
    'Jasa Kirim': o.courier,
    'Metode Pembayaran': o.paymentMethod,
    'Nilai Barang Retur (Rp)': o.totalAmount,
    'Estimasi Rugi Ongkir (Rp)': o.estimatedReturnLoss,
    'Alasan Retur / Batal': o.returnReason || '-',
    'Status Pengembalian Shopee': o.returnStatus || '-',
    'Status Fisik Barang di Gudang': mapPhysicalStatusLabel(o.physicalStatus),
    'Catatan / Tindakan Gudang': o.adminNotes || '-',
    'Produk': o.items.map(it => `${it.productName} (${it.variation}) x${it.quantity}`).join('; '),
  }));

  const wb = XLSX.utils.book_new();
  
  const wsAll = XLSX.utils.json_to_sheet(allOrdersRows);
  XLSX.utils.book_append_sheet(wb, wsAll, 'Semua Pesanan');

  const wsReturns = XLSX.utils.json_to_sheet(returnRows);
  XLSX.utils.book_append_sheet(wb, wsReturns, 'Khusus Retur & Gagal Antar');

  XLSX.writeFile(wb, filename);
}

export function mapPhysicalStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Menunggu Paket Sampai di Gudang';
    case 'received_ok':
      return 'Diterima & Kondisi Baik (Bisa Restock)';
    case 'received_damaged':
      return 'Diterima Rusak / Cacat';
    case 'claim_filed':
      return 'Klaim Kompensasi Diajukan ke Shopee';
    case 'claim_approved':
      return 'Klaim Disetujui (Ganti Rugi Cair)';
    default:
      return 'Bukan Retur';
  }
}
