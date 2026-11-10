import { ShopeeOrderRecord, DeadlineUrgency } from '../types/shopee';

export interface DeadlineDetail {
  urgency: DeadlineUrgency;
  isPreOrder: boolean;
  preOrderDays?: number;
  shipDeadline?: string;
  daysRemaining: number;
  hoursRemaining: number;
  statusLabel: string;
  badgeClass: string;
  textClass: string;
}

export interface PoDeadlineSummary {
  totalPoOrders: number;
  pendingPoOrders: number;
  allPendingShipOrders: number;
  overdueCount: number;
  todayCount: number;
  nearCount: number;
  safeCount: number;
  totalPendingPoAmount: number;
  urgentOrders: ShopeeOrderRecord[];
}

/**
 * Evaluates the shipping deadline and urgency for any order
 */
export function getDeadlineDetail(order: ShopeeOrderRecord, referenceDate?: Date): DeadlineDetail {
  const isPreOrder = Boolean(order.isPreOrder);
  const preOrderDays = order.preOrderDays || (isPreOrder ? 7 : 2);

  // If already shipped, completed, cancelled, or returned, it's not pending shipment
  if (
    order.normalizedStatus === 'completed' ||
    order.normalizedStatus === 'in_transit' ||
    order.normalizedStatus === 'returned' ||
    order.normalizedStatus === 'return_process' ||
    order.normalizedStatus === 'cancelled'
  ) {
    return {
      urgency: 'shipped',
      isPreOrder,
      preOrderDays,
      shipDeadline: order.shipDeadline,
      daysRemaining: 0,
      hoursRemaining: 0,
      statusLabel: 'Sudah Diproses / Dikirim',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      textClass: 'text-slate-600',
    };
  }

  // Reference now
  const now = referenceDate || new Date();

  // If shipDeadline is missing, compute estimate from orderDate + preOrderDays
  let deadlineDate: Date | null = null;
  if (order.shipDeadline) {
    deadlineDate = new Date(order.shipDeadline.replace(' ', 'T'));
  } else if (order.orderDate) {
    deadlineDate = new Date(order.orderDate.replace(' ', 'T'));
    if (!isNaN(deadlineDate.getTime())) {
      deadlineDate.setDate(deadlineDate.getDate() + (isPreOrder ? preOrderDays : 2));
    }
  }

  if (!deadlineDate || isNaN(deadlineDate.getTime())) {
    return {
      urgency: 'safe',
      isPreOrder,
      preOrderDays,
      shipDeadline: undefined,
      daysRemaining: 5,
      hoursRemaining: 120,
      statusLabel: 'Menunggu Pengiriman',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      textClass: 'text-blue-700',
    };
  }

  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 0) {
    const overdueDays = Math.abs(diffDays) || 1;
    return {
      urgency: 'overdue',
      isPreOrder,
      preOrderDays,
      shipDeadline: order.shipDeadline,
      daysRemaining: diffDays,
      hoursRemaining: diffHours,
      statusLabel: `Lewat Tenggat (${overdueDays} Hari)`,
      badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse',
      textClass: 'text-red-700 font-bold',
    };
  }

  if (diffHours <= 24) {
    return {
      urgency: 'today',
      isPreOrder,
      preOrderDays,
      shipDeadline: order.shipDeadline,
      daysRemaining: diffDays,
      hoursRemaining: diffHours,
      statusLabel: diffHours <= 6 ? `Kirim Sekarang (<${diffHours} Jam)` : `Tenggat Hari Ini (${diffHours} Jam)`,
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 font-bold',
      textClass: 'text-orange-700 font-bold',
    };
  }

  if (diffHours <= 48) {
    return {
      urgency: 'near',
      isPreOrder,
      preOrderDays,
      shipDeadline: order.shipDeadline,
      daysRemaining: diffDays,
      hoursRemaining: diffHours,
      statusLabel: `H-2 Tenggat (Tersisa ${diffDays} Hari)`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
      textClass: 'text-amber-800 font-semibold',
    };
  }

  return {
    urgency: 'safe',
    isPreOrder,
    preOrderDays,
    shipDeadline: order.shipDeadline,
    daysRemaining: diffDays,
    hoursRemaining: diffHours,
    statusLabel: `Aman (Tersisa ${diffDays} Hari)`,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    textClass: 'text-emerald-700',
  };
}

/**
 * Calculates aggregate statistics for all Pre-Order & Pending Ship orders
 */
export function calculatePoAnalytics(orders: ShopeeOrderRecord[]): PoDeadlineSummary {
  let totalPoOrders = 0;
  let pendingPoOrders = 0;
  let allPendingShipOrders = 0;
  let overdueCount = 0;
  let todayCount = 0;
  let nearCount = 0;
  let safeCount = 0;
  let totalPendingPoAmount = 0;

  const urgentOrdersList: { order: ShopeeOrderRecord; detail: DeadlineDetail }[] = [];

  // Use current local date for evaluation
  const now = new Date();

  orders.forEach((order) => {
    const isPo = Boolean(order.isPreOrder);
    if (isPo) {
      totalPoOrders += 1;
    }

    if (order.normalizedStatus === 'to_ship') {
      allPendingShipOrders += 1;
      const detail = getDeadlineDetail(order, now);

      if (isPo) {
        pendingPoOrders += 1;
        totalPendingPoAmount += order.totalAmount;
      }

      if (detail.urgency === 'overdue') {
        overdueCount += 1;
      } else if (detail.urgency === 'today') {
        todayCount += 1;
      } else if (detail.urgency === 'near') {
        nearCount += 1;
      } else if (detail.urgency === 'safe') {
        safeCount += 1;
      }

      // Collect all pending orders for urgency sorting
      urgentOrdersList.push({ order, detail });
    }
  });

  // Sort urgent orders: overdue first (asc hoursRemaining), then today, near, safe
  urgentOrdersList.sort((a, b) => a.detail.hoursRemaining - b.detail.hoursRemaining);

  return {
    totalPoOrders,
    pendingPoOrders,
    allPendingShipOrders,
    overdueCount,
    todayCount,
    nearCount,
    safeCount,
    totalPendingPoAmount,
    urgentOrders: urgentOrdersList.map((item) => item.order),
  };
}
