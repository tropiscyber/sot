import { ShopeeOrderRecord, ReturnAnalytics, PhysicalReturnStatus } from '../types/shopee';

export function calculateAnalytics(orders: ShopeeOrderRecord[]): ReturnAnalytics {
  const totalOrders = orders.length;
  
  if (totalOrders === 0) {
    return {
      totalOrders: 0,
      completedOrders: 0,
      returnedOrders: 0,
      cancelledOrders: 0,
      inTransitOrders: 0,
      toShipOrders: 0,
      totalTurnover: 0,
      turnoverAtRisk: 0,
      inTransitAmount: 0,
      toShipAmount: 0,
      cancelledAmount: 0,
      allOrdersAmount: 0,
      estimatedShippingLoss: 0,
      returnRate: 0,
      cancellationRate: 0,
      codTotalOrders: 0,
      codFailedOrders: 0,
      codSuccessRate: 100,
      nonCodTotalOrders: 0,
      nonCodFailedOrders: 0,
      nonCodSuccessRate: 100,
      returnReasonsBreakdown: [],
      courierBreakdown: [],
      physicalStatusCounts: {
        pending: 0,
        received_ok: 0,
        received_damaged: 0,
        claim_filed: 0,
        claim_approved: 0,
        not_applicable: 0,
      },
    };
  }

  let completedOrders = 0;
  let returnedOrders = 0;
  let cancelledOrders = 0;
  let inTransitOrders = 0;
  let toShipOrders = 0;

  let totalTurnover = 0;
  let turnoverAtRisk = 0;
  let inTransitAmount = 0;
  let toShipAmount = 0;
  let cancelledAmount = 0;
  let allOrdersAmount = 0;
  let estimatedShippingLoss = 0;

  let codTotalOrders = 0;
  let codFailedOrders = 0;

  let nonCodTotalOrders = 0;
  let nonCodFailedOrders = 0;

  const reasonMap = new Map<string, { count: number; totalLoss: number }>();
  const courierMap = new Map<string, { total: number; returned: number }>();

  const physicalStatusCounts: Record<PhysicalReturnStatus, number> = {
    pending: 0,
    received_ok: 0,
    received_damaged: 0,
    claim_filed: 0,
    claim_approved: 0,
    not_applicable: 0,
  };

  for (const o of orders) {
    allOrdersAmount += o.totalAmount;

    if (o.normalizedStatus === 'completed') {
      completedOrders++;
      totalTurnover += o.totalAmount;
    } else if (o.isReturned || o.normalizedStatus === 'returned' || o.normalizedStatus === 'return_process') {
      returnedOrders++;
      turnoverAtRisk += o.totalAmount;
      estimatedShippingLoss += o.estimatedReturnLoss > 0 ? o.estimatedReturnLoss : (o.shippingFee + 3000);
      
      const reasonKey = o.returnReason ? o.returnReason.trim() : 'Pengembalian / Batal Lainnya';
      const prevReason = reasonMap.get(reasonKey) || { count: 0, totalLoss: 0 };
      reasonMap.set(reasonKey, {
        count: prevReason.count + 1,
        totalLoss: prevReason.totalLoss + o.totalAmount,
      });

      if (o.physicalStatus) {
        physicalStatusCounts[o.physicalStatus] = (physicalStatusCounts[o.physicalStatus] || 0) + 1;
      }
    } else if (o.normalizedStatus === 'cancelled') {
      cancelledOrders++;
      cancelledAmount += o.totalAmount;
    } else if (o.normalizedStatus === 'to_ship') {
      toShipOrders++;
      toShipAmount += o.totalAmount;
    } else {
      inTransitOrders++;
      inTransitAmount += o.totalAmount;
    }

    // COD stats
    if (o.isCod) {
      codTotalOrders++;
      if (o.isReturned || o.normalizedStatus === 'returned') {
        codFailedOrders++;
      }
    } else {
      nonCodTotalOrders++;
      if (o.isReturned || o.normalizedStatus === 'returned') {
        nonCodFailedOrders++;
      }
    }

    // Courier breakdown
    const courierKey = o.courier || 'Lainnya';
    const prevCourier = courierMap.get(courierKey) || { total: 0, returned: 0 };
    courierMap.set(courierKey, {
      total: prevCourier.total + 1,
      returned: prevCourier.returned + (o.isReturned ? 1 : 0),
    });
  }

  const returnRate = totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0;
  const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

  const codSuccessOrders = codTotalOrders - codFailedOrders;
  const codSuccessRate = codTotalOrders > 0 ? (codSuccessOrders / codTotalOrders) * 100 : 100;

  const nonCodSuccessOrders = nonCodTotalOrders - nonCodFailedOrders;
  const nonCodSuccessRate = nonCodTotalOrders > 0 ? (nonCodSuccessOrders / nonCodTotalOrders) * 100 : 100;

  const returnReasonsBreakdown = Array.from(reasonMap.entries())
    .map(([reason, data]) => ({
      reason,
      count: data.count,
      percentage: returnedOrders > 0 ? (data.count / returnedOrders) * 100 : 0,
      totalLoss: data.totalLoss,
    }))
    .sort((a, b) => b.count - a.count);

  const courierBreakdown = Array.from(courierMap.entries())
    .map(([courier, data]) => ({
      courier,
      total: data.total,
      returned: data.returned,
      returnRate: data.total > 0 ? (data.returned / data.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalOrders,
    completedOrders,
    returnedOrders,
    cancelledOrders,
    inTransitOrders,
    toShipOrders,
    totalTurnover,
    turnoverAtRisk,
    inTransitAmount,
    toShipAmount,
    cancelledAmount,
    allOrdersAmount,
    estimatedShippingLoss,
    returnRate,
    cancellationRate,
    codTotalOrders,
    codFailedOrders,
    codSuccessRate,
    nonCodTotalOrders,
    nonCodFailedOrders,
    nonCodSuccessRate,
    returnReasonsBreakdown,
    courierBreakdown,
    physicalStatusCounts,
  };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface MonthlyTrendData {
  monthKey: string;
  monthLabel: string;
  fullMonthLabel: string;
  totalOrders: number;
  completedOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  completedRevenue: number;
  returnedRevenue: number;
  estimatedShippingLoss: number;
  returnRate: number;
  aov: number;
}

const INDO_MONTH_SHORT: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'Mei',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Agt',
  '09': 'Sep',
  '10': 'Okt',
  '11': 'Nov',
  '12': 'Des',
};

const INDO_MONTH_FULL: Record<string, string> = {
  '01': 'Januari',
  '02': 'Februari',
  '03': 'Maret',
  '04': 'April',
  '05': 'Mei',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'Agustus',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Desember',
};

export function extractMonthKey(dateStr: string): string {
  if (!dateStr) return '2026-11';
  const match = dateStr.match(/(\d{4})[-/](\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  const matchAlt = dateStr.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (matchAlt) {
    return `${matchAlt[3]}-${matchAlt[2]}`;
  }
  return dateStr.slice(0, 7) || '2026-11';
}

export function calculateMonthlyTrends(orders: ShopeeOrderRecord[]): MonthlyTrendData[] {
  const map = new Map<string, {
    totalOrders: number;
    completedOrders: number;
    returnedOrders: number;
    cancelledOrders: number;
    completedRevenue: number;
    returnedRevenue: number;
    estimatedShippingLoss: number;
  }>();

  for (const o of orders) {
    const key = extractMonthKey(o.orderDate);
    const prev = map.get(key) || {
      totalOrders: 0,
      completedOrders: 0,
      returnedOrders: 0,
      cancelledOrders: 0,
      completedRevenue: 0,
      returnedRevenue: 0,
      estimatedShippingLoss: 0,
    };

    prev.totalOrders += 1;

    if (o.normalizedStatus === 'completed') {
      prev.completedOrders += 1;
      prev.completedRevenue += o.totalAmount;
    } else if (o.isReturned || o.normalizedStatus === 'returned' || o.normalizedStatus === 'return_process') {
      prev.returnedOrders += 1;
      prev.returnedRevenue += o.totalAmount;
      prev.estimatedShippingLoss += o.estimatedReturnLoss > 0 ? o.estimatedReturnLoss : (o.shippingFee + 3000);
    } else if (o.normalizedStatus === 'cancelled') {
      prev.cancelledOrders += 1;
    }

    map.set(key, prev);
  }

  // Sort keys chronologically
  const sortedKeys = Array.from(map.keys()).sort();

  return sortedKeys.map((key) => {
    const d = map.get(key)!;
    const parts = key.split('-');
    const year = parts[0] || '2026';
    const monthNum = parts[1] || '11';

    const monthShort = INDO_MONTH_SHORT[monthNum] || monthNum;
    const monthFull = INDO_MONTH_FULL[monthNum] || monthNum;

    const returnRate = d.totalOrders > 0 ? (d.returnedOrders / d.totalOrders) * 100 : 0;
    const aov = d.completedOrders > 0 ? d.completedRevenue / d.completedOrders : 0;

    return {
      monthKey: key,
      monthLabel: `${monthShort} '${year.slice(2)}`,
      fullMonthLabel: `${monthFull} ${year}`,
      totalOrders: d.totalOrders,
      completedOrders: d.completedOrders,
      returnedOrders: d.returnedOrders,
      cancelledOrders: d.cancelledOrders,
      completedRevenue: d.completedRevenue,
      returnedRevenue: d.returnedRevenue,
      estimatedShippingLoss: d.estimatedShippingLoss,
      returnRate,
      aov,
    };
  });
}

export interface ProductAnalyticsItem {
  productName: string;
  sku: string;
  totalQuantitySold: number;
  totalQuantityOrdered: number;
  totalRevenue: number;
  returnedQuantity: number;
  returnedAmount: number;
  returnRate: number;
  topReturnReason: string;
}

export interface ProductAnalyticsResult {
  topSelling: ProductAnalyticsItem[];
  topReturned: ProductAnalyticsItem[];
}

export function calculateProductAnalytics(orders: ShopeeOrderRecord[]): ProductAnalyticsResult {
  const productMap = new Map<string, {
    productName: string;
    sku: string;
    totalQuantitySold: number;
    totalQuantityOrdered: number;
    totalRevenue: number;
    returnedQuantity: number;
    returnedAmount: number;
    reasons: Map<string, number>;
  }>();

  for (const order of orders) {
    const isReturned = order.isReturned || order.normalizedStatus === 'returned' || order.normalizedStatus === 'return_process';
    const isCompleted = order.normalizedStatus === 'completed';
    const isCancelled = order.normalizedStatus === 'cancelled';

    for (const item of order.items) {
      const key = item.productName.trim();
      const prev = productMap.get(key) || {
        productName: item.productName.trim(),
        sku: item.sku || '-',
        totalQuantitySold: 0,
        totalQuantityOrdered: 0,
        totalRevenue: 0,
        returnedQuantity: 0,
        returnedAmount: 0,
        reasons: new Map<string, number>(),
      };

      if (!isCancelled) {
        prev.totalQuantityOrdered += item.quantity;
      }

      if (isCompleted) {
        prev.totalQuantitySold += item.quantity;
        prev.totalRevenue += item.subtotal;
      }

      if (isReturned) {
        prev.returnedQuantity += item.quantity;
        prev.returnedAmount += item.subtotal;

        const reason = order.returnReason ? order.returnReason.trim() : 'Retur / Gagal Kirim';
        prev.reasons.set(reason, (prev.reasons.get(reason) || 0) + item.quantity);
      }

      productMap.set(key, prev);
    }
  }

  const allProducts: ProductAnalyticsItem[] = Array.from(productMap.values()).map((p) => {
    let topReason = '-';
    let maxReasonCount = 0;
    for (const [r, count] of p.reasons.entries()) {
      if (count > maxReasonCount) {
        maxReasonCount = count;
        topReason = r;
      }
    }

    const returnRate = p.totalQuantityOrdered > 0
      ? (p.returnedQuantity / p.totalQuantityOrdered) * 100
      : 0;

    return {
      productName: p.productName,
      sku: p.sku,
      totalQuantitySold: p.totalQuantitySold,
      totalQuantityOrdered: p.totalQuantityOrdered,
      totalRevenue: p.totalRevenue,
      returnedQuantity: p.returnedQuantity,
      returnedAmount: p.returnedAmount,
      returnRate,
      topReturnReason: topReason,
    };
  });

  // Top 5 selling: sorted by total quantity sold descending, then revenue
  const topSelling = [...allProducts]
    .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold || b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  // Top 5 returned: sorted by return rate descending (and returnedQuantity >= 1), then returned amount
  const topReturned = [...allProducts]
    .filter((p) => p.returnedQuantity > 0)
    .sort((a, b) => b.returnRate - a.returnRate || b.returnedQuantity - a.returnedQuantity)
    .slice(0, 5);

  return {
    topSelling,
    topReturned,
  };
}
