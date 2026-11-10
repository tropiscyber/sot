import * as XLSX from 'xlsx';
import { ShopeeOrderItem, ShopeeOrderRecord } from '../types/shopee';

interface RawRow {
  [key: string]: any;
}

// Helper to normalize header string: lowercase, remove non-alphanumeric
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Clean number parser for IDR currency strings ("Rp 120.000", "120,000", "120000.00")
export function parseCurrency(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/rp/gi, '').trim();
  // If Indonesian format with dot as thousand separator e.g. "120.500"
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(str)) {
    const clean = str.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }
  // Standard format e.g. "120,500.00" or raw "120500"
  const clean = str.replace(/,/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

// Clean date parser
export function parseDate(val: any): string {
  if (!val) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  if (val instanceof Date) {
    return val.toISOString().slice(0, 19).replace('T', ' ');
  }
  const str = String(val).trim();
  // Check if excel date serial number (e.g. 45200.5)
  if (!isNaN(Number(str)) && Number(str) > 40000 && Number(str) < 60000) {
    const d = new Date(Math.round((Number(str) - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }
  return str;
}

export function parseShopeeFile(buffer: ArrayBuffer, fileName: string): {
  orders: ShopeeOrderRecord[];
  type: 'order_report' | 'return_report' | 'unknown';
  rowCount: number;
} {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert sheet to json array
  const rawRows = XLSX.utils.sheet_to_json<RawRow>(worksheet, { defval: '' });
  
  if (!rawRows || rawRows.length === 0) {
    return { orders: [], type: 'unknown', rowCount: 0 };
  }

  // Analyze header columns in the first row
  const firstRowKeys = Object.keys(rawRows[0]).map(normalizeKey);
  const isReturnReport = firstRowKeys.some(k => 
    k.includes('pengembalian') || k.includes('returnid') || k.includes('alasansengketa') || k.includes('refundstatus')
  );
  const isOrderReport = firstRowKeys.some(k => 
    k.includes('nopesanan') || k.includes('orderid') || k.includes('statuspesanan')
  );

  const reportType = isReturnReport ? 'return_report' : (isOrderReport ? 'order_report' : 'unknown');

  const ordersMap = new Map<string, ShopeeOrderRecord>();

  for (const row of rawRows) {
    // Find fields with flexible matching
    const rowNorm: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      rowNorm[normalizeKey(k)] = v;
    }

    const orderId = String(
      findValue(rowNorm, ['nopesanan', 'orderid', 'nomorpesanan', 'nopesan']) || ''
    ).trim();

    if (!orderId || orderId === 'Total' || orderId === 'Ringkasan') {
      continue;
    }

    const rawStatus = String(findValue(rowNorm, ['statuspesanan', 'orderstatus', 'status']) || '').trim();
    const returnStatus = String(findValue(rowNorm, ['statuspembatalanpengembalian', 'statuspengembalian', 'returnstatus', 'refundstatus']) || '').trim();
    const cancelReason = String(findValue(rowNorm, ['alasanpembatalan', 'alasanpengembalian', 'returnreason', 'cancelreason', 'alasan']) || '').trim();
    const trackingNumber = String(findValue(rowNorm, ['noresi', 'trackingnumber', 'nomorresi', 'resi']) || '').trim();
    const courier = String(findValue(rowNorm, ['opsipengiriman', 'jasakirim', 'shippingoption', 'courier', 'ekspedisi']) || 'Standar').trim();
    const paymentMethod = String(findValue(rowNorm, ['metodepembayaran', 'paymentmethod', 'pembayaran']) || '').trim();
    const orderDate = parseDate(findValue(rowNorm, ['waktupesanandibuat', 'ordercreationdate', 'createtime', 'tanggalpesanan', 'waktubuat']));
    const paidDate = parseDate(findValue(rowNorm, ['waktupembayarandilakukan', 'paymenttime', 'tanggalbayar']));
    const buyerUsername = String(findValue(rowNorm, ['namapembeli', 'buyerusername', 'namapenerima', 'username']) || 'Pembeli Shopee').trim();
    const recipientCity = String(findValue(rowNorm, ['kotakabupaten', 'city', 'kota', 'tujuan']) || '').trim();
    const shippingFee = parseCurrency(findValue(rowNorm, ['perkiraanongkoskirim', 'estimatedshippingfee', 'ongkoskirim', 'ongkir']));
    const totalAmount = parseCurrency(findValue(rowNorm, ['totalpembayaran', 'totalamount', 'totalpesanan', 'totalkeseluruhan']));
    const sellerVoucher = parseCurrency(findValue(rowNorm, ['voucherditanggungpenjual', 'sellervoucher', 'diskonpenjual']));

    // Items
    const productName = String(findValue(rowNorm, ['namaproduk', 'productname', 'nama']) || 'Produk Pesanan').trim();
    const sku = String(findValue(rowNorm, ['nomorreferensisku', 'skureferenceno', 'sku', 'refsku']) || '-').trim();
    const variation = String(findValue(rowNorm, ['namavariasi', 'variationname', 'variasi', 'warna']) || '-').trim();
    const originalPrice = parseCurrency(findValue(rowNorm, ['hargaawal', 'originalprice', 'harga']));
    const dealPrice = parseCurrency(findValue(rowNorm, ['hargasetelahdiskon', 'dealprice', 'hargajual', 'unitprice'])) || originalPrice;
    const quantity = parseInt(String(findValue(rowNorm, ['jumlah', 'quantity', 'qty']) || '1'), 10) || 1;

    const item: ShopeeOrderItem = {
      productName,
      sku,
      variation,
      quantity,
      originalPrice,
      dealPrice,
      subtotal: dealPrice * quantity,
    };

    // Pre-Order & Tenggat Pengiriman
    const rawPreOrder = String(findValue(rowNorm, ['prapesan', 'preorder', 'ispreorder', 'statusprapesan']) || '').trim().toLowerCase();
    const rawPoDays = parseInt(String(findValue(rowNorm, ['harikerjaprapesan', 'masapengemasan', 'prapesandays', 'waktupengemasan']) || '0'), 10);
    const isPoByText = productName.toLowerCase().includes('pre-order') || 
                       productName.toLowerCase().includes('pre order') || 
                       productName.toLowerCase().includes('[po]') ||
                       variation.toLowerCase().includes('po');
    const isPreOrder = rawPreOrder === 'ya' || rawPreOrder === 'yes' || rawPreOrder === 'true' || rawPoDays > 2 || isPoByText;
    const preOrderDays = rawPoDays > 0 ? rawPoDays : (isPreOrder ? 7 : 2);

    let shipDeadline = parseDate(findValue(rowNorm, [
      'waktupengirimanditentukan',
      'kirimsebelum',
      'bataswaktupengiriman',
      'tenggatpengiriman',
      'shipbydate',
      'deadlinepengiriman',
      'bataswaktukirim'
    ]));

    if (!shipDeadline && orderDate) {
      try {
        const orderDt = new Date(orderDate.replace(' ', 'T'));
        if (!isNaN(orderDt.getTime())) {
          const daysToAdd = isPreOrder ? preOrderDays : 2;
          orderDt.setDate(orderDt.getDate() + daysToAdd);
          shipDeadline = orderDt.toISOString().replace('T', ' ').slice(0, 19);
        }
      } catch (e) {
        // ignore
      }
    }

    // Determine normalized status
    const lowerStatus = rawStatus.toLowerCase();
    const lowerReturn = returnStatus.toLowerCase();
    const lowerCancel = cancelReason.toLowerCase();

    let normalizedStatus: ShopeeOrderRecord['normalizedStatus'] = 'in_transit';
    let isReturned = false;
    let isCancelled = false;

    if (
      lowerStatus.includes('pengembalian') || 
      lowerStatus.includes('retur') || 
      lowerStatus.includes('return') ||
      lowerReturn.includes('disetujui') ||
      lowerReturn.includes('selesai') ||
      lowerReturn.includes('permintaan') ||
      lowerReturn.includes('proses')
    ) {
      isReturned = true;
      normalizedStatus = lowerReturn.includes('proses') || lowerReturn.includes('permintaan') 
        ? 'return_process' 
        : 'returned';
    } else if (lowerStatus.includes('batal') || lowerStatus.includes('cancel')) {
      isCancelled = true;
      normalizedStatus = 'cancelled';
    } else if (lowerStatus.includes('selesai') || lowerStatus.includes('completed')) {
      normalizedStatus = 'completed';
    } else if (lowerStatus.includes('perlu dikirim') || lowerStatus.includes('to ship') || lowerStatus.includes('diproses')) {
      normalizedStatus = 'to_ship';
    } else {
      normalizedStatus = 'in_transit';
    }

    const isCod = paymentMethod.toLowerCase().includes('cod') || paymentMethod.toLowerCase().includes('bayar di tempat');
    
    // Gagal kirim COD sering masuk ke status Pembatalan dengan alasan "Gagal Antar"
    if (isCod && (lowerCancel.includes('gagal antar') || lowerCancel.includes('menolak bayar') || lowerCancel.includes('tidak dapat dihubungi') || lowerCancel.includes('penerima menolak'))) {
      isReturned = true;
      normalizedStatus = 'returned';
    }

    if (ordersMap.has(orderId)) {
      const existing = ordersMap.get(orderId)!;
      // Add item if different
      existing.items.push(item);
      // Update return metadata if present in this row
      if (returnStatus) existing.returnStatus = returnStatus;
      if (cancelReason) existing.returnReason = cancelReason;
      if (isReturned) {
        existing.isReturned = true;
        existing.normalizedStatus = normalizedStatus;
      }
      if (isCancelled && !existing.isReturned) {
        existing.isCancelled = true;
        existing.normalizedStatus = 'cancelled';
      }
    } else {
      const initialPhysicalStatus = isReturned ? 'pending' : 'not_applicable';
      const estimatedReturnLoss = isReturned ? (shippingFee > 0 ? shippingFee : 15000) + 3000 : 0; // RTS shipping + packaging estimate

      ordersMap.set(orderId, {
        orderId,
        orderStatus: rawStatus || (isReturnReport ? 'Pengembalian' : 'Sedang Dikirim'),
        normalizedStatus,
        trackingNumber: trackingNumber || '-',
        courier: courier || 'SPX Express',
        paymentMethod: paymentMethod || (isCod ? 'COD (Bayar di Tempat)' : 'Transfer / ShopeePay'),
        isCod,
        orderDate,
        paidDate,
        buyerUsername,
        recipientCity,
        shippingFee,
        estimatedReturnLoss,
        totalAmount,
        sellerVoucher,
        items: [item],
        isReturned,
        isCancelled,
        returnReason: cancelReason || (isReturned ? 'Pengembalian Produk' : undefined),
        returnStatus: returnStatus || (isReturned ? 'Diproses' : undefined),
        physicalStatus: initialPhysicalStatus,
        adminNotes: '',
        isPreOrder,
        preOrderDays: isPreOrder ? preOrderDays : undefined,
        shipDeadline: shipDeadline || undefined,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return {
    orders: Array.from(ordersMap.values()),
    type: reportType,
    rowCount: rawRows.length,
  };
}

// Find value in normalized object with list of candidate keys
function findValue(obj: Record<string, any>, candidates: string[]): any {
  for (const key of candidates) {
    if (obj[key] !== undefined && obj[key] !== '') {
      return obj[key];
    }
  }
  // Loose prefix/contains search
  for (const key of candidates) {
    const match = Object.keys(obj).find(k => k.includes(key));
    if (match && obj[match] !== undefined && obj[match] !== '') {
      return obj[match];
    }
  }
  return undefined;
}

// Merge incoming new orders into existing dataset (intelligent deduplication)
export function mergeOrderDatasets(
  existingOrders: ShopeeOrderRecord[],
  incomingOrders: ShopeeOrderRecord[]
): {
  merged: ShopeeOrderRecord[];
  newCount: number;
  updatedCount: number;
} {
  const map = new Map<string, ShopeeOrderRecord>();
  for (const o of existingOrders) {
    map.set(o.orderId, { ...o });
  }

  let newCount = 0;
  let updatedCount = 0;

  for (const incoming of incomingOrders) {
    if (map.has(incoming.orderId)) {
      const current = map.get(incoming.orderId)!;
      // Preserve manual admin physicalStatus & notes if already edited
      const preservedPhysicalStatus = current.physicalStatus !== 'not_applicable' && current.physicalStatus !== 'pending'
        ? current.physicalStatus
        : incoming.physicalStatus;
      const preservedNotes = current.adminNotes || incoming.adminNotes;

      map.set(incoming.orderId, {
        ...current,
        orderStatus: incoming.orderStatus || current.orderStatus,
        normalizedStatus: incoming.normalizedStatus,
        trackingNumber: incoming.trackingNumber !== '-' ? incoming.trackingNumber : current.trackingNumber,
        courier: incoming.courier || current.courier,
        isReturned: current.isReturned || incoming.isReturned,
        isCancelled: current.isCancelled || incoming.isCancelled,
        returnReason: incoming.returnReason || current.returnReason,
        returnStatus: incoming.returnStatus || current.returnStatus,
        physicalStatus: preservedPhysicalStatus,
        adminNotes: preservedNotes,
        updatedAt: new Date().toISOString(),
      });
      updatedCount++;
    } else {
      map.set(incoming.orderId, incoming);
      newCount++;
    }
  }

  return {
    merged: Array.from(map.values()),
    newCount,
    updatedCount,
  };
}
