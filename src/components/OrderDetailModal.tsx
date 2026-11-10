import React, { useState } from 'react';
import { ShopeeOrderRecord, PhysicalReturnStatus } from '../types/shopee';
import { formatRupiah } from '../utils/analytics';
import { mapPhysicalStatusLabel } from '../utils/storage';
import { X, Package, Truck, AlertTriangle, CheckCircle, Save, FileText } from 'lucide-react';

interface OrderDetailModalProps {
  order: ShopeeOrderRecord | null;
  onClose: () => void;
  onUpdateOrder: (updated: ShopeeOrderRecord) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onUpdateOrder,
}) => {
  if (!order) return null;

  const [physicalStatus, setPhysicalStatus] = useState<PhysicalReturnStatus>(order.physicalStatus);
  const [notes, setNotes] = useState<string>(order.adminNotes || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onUpdateOrder({
      ...order,
      physicalStatus,
      adminNotes: notes,
      updatedAt: new Date().toISOString(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
              Detail Pesanan Shopee
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono tabular-nums">{order.orderDate}</span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-xl font-bold font-mono tabular-nums text-slate-900">
              {order.orderId}
            </h3>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                order.isReturned
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : order.normalizedStatus === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {order.orderStatus}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200/80">
          <div>
            <span className="text-slate-400 block mb-0.5">Nama Pembeli</span>
            <span className="font-semibold text-slate-900 block">{order.buyerUsername}</span>
            <span className="text-slate-500">{order.recipientCity || '-'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Metode Pembayaran</span>
            <span className={`font-semibold block ${order.isCod ? 'text-orange-700' : 'text-slate-900'}`}>
              {order.paymentMethod}
            </span>
            <span className="text-slate-500">{order.isCod ? 'Bayar di Tempat' : 'Prabayar'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Ekspedisi & Resi</span>
            <span className="font-semibold text-slate-900 block">{order.courier}</span>
            <span className="font-mono tabular-nums text-slate-600">{order.trackingNumber}</span>
          </div>
        </div>

        {/* PO & Tenggat Kirim Banner */}
        {order.isPreOrder && (
          <div className="mb-6 p-3.5 bg-purple-50/80 border border-purple-200 rounded-lg space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-purple-900">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
                <span>Pesanan Pre-Order (Masa Pengemasan: {order.preOrderDays || 7} Hari Kerja)</span>
              </div>
              {order.shipDeadline && (
                <span className="font-mono tabular-nums text-purple-800 bg-white px-2 py-0.5 rounded border border-purple-200">
                  Tenggat: {order.shipDeadline}
                </span>
              )}
            </div>
            <p className="text-purple-700 text-[11px]">
              Pastikan pengerjaan produk selesai dan paket di-scan sebelum batas waktu di atas untuk mencegah pembatalan otomatis oleh Shopee.
            </p>
          </div>
        )}

        {/* Retur Alert Box (jika retur) */}
        {order.isReturned && (
          <div className="mb-6 p-4 bg-red-50/70 border border-red-200 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Informasi Pengembalian & Gagal Kirim:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-red-600/80 block">Alasan Retur / Pembatalan:</span>
                <span className="font-semibold text-slate-900">{order.returnReason || '-'}</span>
              </div>
              <div>
                <span className="text-red-600/80 block">Status Pengembalian Shopee:</span>
                <span className="font-semibold text-slate-900">{order.returnStatus || '-'}</span>
              </div>
              {order.returnTrackingNumber && (
                <div>
                  <span className="text-red-600/80 block">No. Resi Pengembalian (RTS):</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {order.returnTrackingNumber}
                  </span>
                </div>
              )}
              <div>
                <span className="text-red-600/80 block">Estimasi Rugi Ongkir:</span>
                <span className="font-mono tabular-nums font-bold text-red-700">
                  {formatRupiah(order.estimatedReturnLoss)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-slate-500" />
            <span>Produk dalam Pesanan ({order.items.length})</span>
          </h4>
          <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {order.items.map((it, idx) => (
              <div key={idx} className="p-3 flex items-start justify-between text-xs bg-white">
                <div>
                  <span className="font-semibold text-slate-900 block">{it.productName}</span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    SKU: {it.sku} · Variasi: {it.variation}
                  </span>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0 ml-4">
                  <span className="text-slate-500 block">
                    {it.quantity} x {formatRupiah(it.dealPrice)}
                  </span>
                  <span className="font-bold text-slate-900 block">{formatRupiah(it.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Financial Summary */}
        <div className="border-t border-slate-200 pt-3 mb-6 text-xs space-y-1">
          <div className="flex justify-between text-slate-500">
            <span>Perkiraan Ongkos Kirim:</span>
            <span className="font-mono tabular-nums">{formatRupiah(order.shippingFee)}</span>
          </div>
          {order.sellerVoucher > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Voucher Ditanggung Penjual:</span>
              <span className="font-mono tabular-nums text-red-600">
                -{formatRupiah(order.sellerVoucher)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
            <span>Total Nilai Pesanan:</span>
            <span className="font-mono tabular-nums text-orange-600">
              {formatRupiah(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Management & Physical Package Checklist (Khusus Retur) */}
        {order.isReturned && (
          <div className="border-t border-slate-200 pt-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Pemeriksaan Fisik Barang & Catatan Gudang</span>
            </h4>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Status Fisik Paket di Gudang:
              </label>
              <select
                value={physicalStatus}
                onChange={(e) => setPhysicalStatus(e.target.value as PhysicalReturnStatus)}
                className="w-full text-xs rounded-md border border-slate-300 py-2 px-3 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="pending">Menunggu Paket Tiba di Gudang</option>
                <option value="received_ok">Diterima & Kondisi Baik (Bisa Langsung Restock)</option>
                <option value="received_damaged">Diterima Rusak / Cacat / Segel Terbuka</option>
                <option value="claim_filed">Klaim Ganti Rugi / Komplain Diajukan ke Shopee</option>
                <option value="claim_approved">Klaim Ganti Rugi Disetujui Shopee</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Catatan Penjual / Tindakan:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan nomor laporan CS Shopee, status unboxing, atau nomor klaim..."
                rows={3}
                className="w-full text-xs rounded-md border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              {savedSuccess && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Tersimpan!</span>
                </span>
              )}
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
