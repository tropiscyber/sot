export interface ShopeeOrderItem {
  productName: string;
  sku: string;
  variation: string;
  quantity: number;
  originalPrice: number;
  dealPrice: number;
  subtotal: number;
}

export type PhysicalReturnStatus = 
  | 'pending'          // Menunggu Paket Sampai di Gudang
  | 'received_ok'       // Diterima & Kondisi Baik (Bisa Restock)
  | 'received_damaged'  // Diterima Rusak / Cacat
  | 'claim_filed'       // Komplain / Klaim Kompensasi Diajukan ke Shopee
  | 'claim_approved'    // Klaim Disetujui Shopee (Ganti Rugi Cair)
  | 'not_applicable';   // Bukan Pesanan Retur

export interface ShopeeOrderRecord {
  orderId: string;
  orderStatus: string;           // Selesai, Dalam Pengiriman, Perlu Dikirim, Dibatalkan, Retur
  normalizedStatus: 'completed' | 'in_transit' | 'to_ship' | 'cancelled' | 'returned' | 'return_process';
  trackingNumber: string;
  courier: string;
  paymentMethod: string;
  isCod: boolean;
  orderDate: string;             // YYYY-MM-DD HH:mm:ss
  paidDate?: string;
  buyerUsername: string;
  recipientCity?: string;
  shippingFee: number;
  estimatedReturnLoss: number;   // Kerugian ongkir + packaging + barang jika rusak
  totalAmount: number;           // Total bayar pembeli
  sellerVoucher: number;
  items: ShopeeOrderItem[];
  
  // Return & Cancellation specific
  isReturned: boolean;
  isCancelled: boolean;
  returnReason?: string;
  returnStatus?: string;
  returnTrackingNumber?: string;
  physicalStatus: PhysicalReturnStatus;
  adminNotes?: string;
  isSample?: boolean;
  
  // Pre-Order (PO) & Tenggat Batas Kirim
  isPreOrder?: boolean;          // Apakah produk Pre-Order
  preOrderDays?: number;         // Estimasi waktu PO dalam hari (misal 7, 14, 30 hari)
  shipDeadline?: string;         // Tenggat / Batas Waktu Pengiriman Shopee (YYYY-MM-DD HH:mm:ss)

  updatedAt: string;
}

export type DeadlineUrgency = 'overdue' | 'today' | 'near' | 'safe' | 'shipped';

export interface ReturnAnalytics {
  totalOrders: number;
  completedOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  inTransitOrders: number;
  toShipOrders: number;
  
  totalTurnover: number;         // Omzet pesanan selesai
  turnoverAtRisk: number;        // Nilai pesanan retur/tertahan
  inTransitAmount: number;       // Nilai pesanan sedang dikirim
  toShipAmount: number;          // Nilai pesanan menunggu kirim
  cancelledAmount: number;       // Nilai pesanan dibatalkan
  allOrdersAmount: number;       // Total nilai seluruh transaksi
  estimatedShippingLoss: number; // Estimasi ongkir RTS & packing hangus
  
  returnRate: number;            // (returned / total) * 100
  cancellationRate: number;
  
  codTotalOrders: number;
  codFailedOrders: number;
  codSuccessRate: number;
  
  nonCodTotalOrders: number;
  nonCodFailedOrders: number;
  nonCodSuccessRate: number;
  
  returnReasonsBreakdown: { reason: string; count: number; percentage: number; totalLoss: number }[];
  courierBreakdown: { courier: string; total: number; returned: number; returnRate: number }[];
  physicalStatusCounts: Record<PhysicalReturnStatus, number>;
}

export interface FilterOptions {
  searchQuery: string;
  statusFilter: string;          // 'all', 'completed', 'in_transit', 'to_ship', 'returned', 'cancelled'
  paymentFilter: 'all' | 'cod' | 'non_cod';
  courierFilter: string;
  physicalStatusFilter: string;
  startDate: string;             // YYYY-MM-DD
  endDate: string;               // YYYY-MM-DD
  returnReasonFilter: string;
}
