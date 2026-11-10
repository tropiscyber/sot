import { jsPDF } from 'jspdf';
import { ShopeeOrderRecord } from '../types/shopee';
import {
  calculateAnalytics,
  calculateMonthlyTrends,
  calculateProductAnalytics,
  formatRupiah,
} from './analytics';

export interface PdfExportOptions {
  shopName?: string;
  notes?: string;
}

export function exportDashboardSummaryToPdf(
  orders: ShopeeOrderRecord[],
  options?: PdfExportOptions
) {
  if (orders.length === 0) {
    throw new Error('Tidak ada data pesanan untuk diekspor ke PDF.');
  }

  const analytics = calculateAnalytics(orders);
  const monthlyData = calculateMonthlyTrends(orders);
  const productAnalytics = calculateProductAnalytics(orders);

  // Initialize A4 portrait document (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = 14;

  // --- 1. HEADER & BRANDING ---
  // Header background accent bar
  doc.setFillColor(234, 88, 12); // Shopee orange #ea580c
  doc.rect(margin, y, contentWidth, 3, 'F');
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('LAPORAN RINGKASAN OPERASIONAL & PERFORMA SHOPEE', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  const generatedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(
    `Laporan Eksekutif Manajemen · Dibuat: ${generatedDate} WIB · Total Data: ${orders.length} Pesanan`,
    margin,
    y
  );
  y += 7;

  // --- 2. EXECUTIVE SUMMARY STAT CARDS (2x3 Grid) ---
  const cardWidth = (contentWidth - 6) / 3;
  const cardHeight = 16;

  const completionRate = (analytics.completedOrders / Math.max(1, analytics.totalOrders)) * 100;
  const codFailureRate = 100 - analytics.codSuccessRate;
  const codTotalAmount = orders.filter((o) => o.isCod).reduce((sum, o) => sum + o.totalAmount, 0);

  const kpis = [
    {
      title: 'TOTAL OMZET SELESAI',
      value: formatRupiah(analytics.totalTurnover),
      sub: `${analytics.completedOrders} pesanan selesai (${completionRate.toFixed(1)}%)`,
      color: [16, 185, 129], // emerald
    },
    {
      title: 'TINGKAT RETUR & GAGAL KIRIM',
      value: `${analytics.returnRate.toFixed(1)}%`,
      sub: `${analytics.returnedOrders} paket retur · Est. rugi ${formatRupiah(analytics.estimatedShippingLoss)}`,
      color: [239, 68, 68], // red
    },
    {
      title: 'PERFORMA PESANAN COD',
      value: `${codFailureRate.toFixed(1)}% Gagal COD`,
      sub: `${analytics.codTotalOrders} pesanan COD (${formatRupiah(codTotalAmount)})`,
      color: [234, 88, 12], // orange
    },
    {
      title: 'SEDANG DALAM PENGIRIMAN',
      value: `${analytics.inTransitOrders} Paket`,
      sub: `Nilai barang: ${formatRupiah(analytics.inTransitAmount)}`,
      color: [2, 132, 199], // sky
    },
    {
      title: 'PERLU DIKIRIM (PENDING)',
      value: `${analytics.toShipOrders} Paket`,
      sub: `Nilai pesanan: ${formatRupiah(analytics.toShipAmount)}`,
      color: [99, 102, 241], // indigo
    },
    {
      title: 'TOTAL NILAI TRANSAKSI',
      value: formatRupiah(analytics.allOrdersAmount),
      sub: `Dari total akumulasi ${analytics.totalOrders} transaksi`,
      color: [71, 85, 105], // slate
    },
  ];

  kpis.forEach((kpi, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const cardX = margin + col * (cardWidth + 3);
    const cardY = y + row * (cardHeight + 3);

    // Card background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Left accent bar
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.roundedRect(cardX, cardY, 1.5, cardHeight, 0.5, 0.5, 'F');

    // Card content
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, cardX + 3.5, cardY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, cardX + 3.5, cardY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, cardX + 3.5, cardY + 13.5);
  });

  y += 2 * (cardHeight + 3) + 5;

  // --- 3. GRAFIK TREN PENJUALAN BULANAN (NATIVE VECTOR RENDER) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('TREN PENJUALAN & TINGKAT RETUR BULANAN', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    '(Hijau: Omzet Selesai · Merah: Nilai Retur · Garis Oranye: Rasio Retur %)',
    margin + 80,
    y
  );
  y += 3;

  // Vector Chart Frame
  const chartH = 38;
  const chartBoxY = y;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, chartBoxY, contentWidth, chartH, 1.5, 1.5, 'FD');

  if (monthlyData.length > 0) {
    const cPaddingLeft = 24;
    const cPaddingRight = 18;
    const cPaddingTop = 6;
    const cPaddingBottom = 8;
    const cInnerW = contentWidth - cPaddingLeft - cPaddingRight;
    const cInnerH = chartH - cPaddingTop - cPaddingBottom;

    const maxRev = Math.max(
      ...monthlyData.map((d) => Math.max(d.completedRevenue, d.returnedRevenue)),
      1000000
    );
    const maxRetRate = 40; // 0-40% scale

    // Horizontal grid lines
    const gridSteps = 3;
    for (let i = 0; i <= gridSteps; i++) {
      const lineY = chartBoxY + cPaddingTop + cInnerH * (1 - i / gridSteps);
      doc.setDrawColor(241, 245, 249);
      doc.line(margin + cPaddingLeft, lineY, margin + contentWidth - cPaddingRight, lineY);

      // Left axis label (Rupiah)
      const val = (maxRev * (i / gridSteps)) / 1000000;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Rp ${val.toFixed(1)}Jt`, margin + cPaddingLeft - 2, lineY + 1.2, { align: 'right' });

      // Right axis label (% retur)
      const rVal = (maxRetRate * (i / gridSteps)).toFixed(0);
      doc.text(`${rVal}%`, margin + contentWidth - cPaddingRight + 2, lineY + 1.2, { align: 'left' });
    }

    const colW = cInnerW / monthlyData.length;
    const bW = Math.min(colW * 0.28, 7);

    // Draw bars
    const linePoints: { x: number; y: number }[] = [];

    monthlyData.forEach((d, idx) => {
      const centerX = margin + cPaddingLeft + idx * colW + colW / 2;
      const compH = (d.completedRevenue / maxRev) * cInnerH;
      const retH = (d.returnedRevenue / maxRev) * cInnerH;

      // Completed bar (emerald)
      doc.setFillColor(16, 185, 129);
      doc.rect(centerX - bW - 0.5, chartBoxY + cPaddingTop + cInnerH - compH, bW, compH, 'F');

      // Returned bar (red)
      doc.setFillColor(239, 68, 68);
      doc.rect(centerX + 0.5, chartBoxY + cPaddingTop + cInnerH - retH, bW, retH, 'F');

      // Month Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(71, 85, 105);
      doc.text(d.monthLabel, centerX, chartBoxY + chartH - 2.5, { align: 'center' });

      // Save line coordinates
      const clampedRate = Math.min(Math.max(d.returnRate, 0), maxRetRate);
      const dotY = chartBoxY + cPaddingTop + cInnerH * (1 - clampedRate / maxRetRate);
      linePoints.push({ x: centerX, y: dotY });
    });

    // Draw return rate line
    if (linePoints.length > 1) {
      doc.setDrawColor(234, 88, 12); // orange
      doc.setLineWidth(0.6);
      for (let i = 0; i < linePoints.length - 1; i++) {
        doc.line(linePoints[i].x, linePoints[i].y, linePoints[i + 1].x, linePoints[i + 1].y);
      }
      doc.setLineWidth(0.2); // reset line width
    }

    // Draw line dots
    linePoints.forEach((pt) => {
      doc.setFillColor(234, 88, 12);
      doc.circle(pt.x, pt.y, 0.9, 'F');
    });
  }

  y += chartH + 5;

  // --- 4. TABEL REKAPITULASI BULANAN ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('TABEL REKAPITULASI BULANAN', margin, y);
  y += 2.5;

  // Table header
  const tableCols = [
    { title: 'Bulan', width: 26, align: 'left' as const },
    { title: 'Pesanan', width: 18, align: 'right' as const },
    { title: 'Selesai', width: 18, align: 'right' as const },
    { title: 'Retur/Batal', width: 22, align: 'right' as const },
    { title: 'Rasio Retur', width: 22, align: 'right' as const },
    { title: 'Omzet Selesai', width: 38, align: 'right' as const },
    { title: 'Est. Rugi Ongkir', width: 38, align: 'right' as const },
  ];

  // Draw table header background
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, contentWidth, 5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);

  let curX = margin;
  tableCols.forEach((col) => {
    const textX = col.align === 'right' ? curX + col.width - 2 : curX + 2;
    doc.text(col.title, textX, y + 3.5, { align: col.align });
    curX += col.width;
  });
  y += 5;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);

  monthlyData.slice(0, 6).forEach((row, rIdx) => {
    if (rIdx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 4.5, 'F');
    }

    doc.setTextColor(15, 23, 42);
    let xPos = margin;

    const rowValues = [
      { text: row.fullMonthLabel, align: 'left' as const, bold: true },
      { text: `${row.totalOrders}`, align: 'right' as const },
      { text: `${row.completedOrders}`, align: 'right' as const },
      { text: `${row.returnedOrders}`, align: 'right' as const },
      { text: `${row.returnRate.toFixed(1)}%`, align: 'right' as const },
      { text: formatRupiah(row.completedRevenue), align: 'right' as const, bold: true },
      { text: formatRupiah(row.estimatedShippingLoss), align: 'right' as const },
    ];

    rowValues.forEach((val, cIdx) => {
      const col = tableCols[cIdx];
      const textX = col.align === 'right' ? xPos + col.width - 2 : xPos + 2;
      doc.setFont('helvetica', val.bold ? 'bold' : 'normal');
      doc.text(val.text, textX, y + 3.2, { align: col.align });
      xPos += col.width;
    });

    y += 4.5;
  });

  y += 5;

  // --- 5. ANALISIS PRODUK (5 Terlaris & 5 Paling Rawan Retur) ---
  const halfW = (contentWidth - 4) / 2;

  // Left Title: 5 Produk Terlaris
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('5 PRODUK TERLARIS (TOP SELLING)', margin, y);

  // Right Title: 5 Produk Rawan Retur
  doc.text('5 PRODUK PALING RAWAN RETUR', margin + halfW + 4, y);
  y += 3;

  const prodListH = 34;

  // Left Box: Top Selling
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, halfW, prodListH, 1.5, 1.5, 'FD');

  let prodY = y + 4;
  productAnalytics.topSelling.slice(0, 5).forEach((p, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(16, 185, 129);
    doc.text(`${idx + 1}.`, margin + 3, prodY);

    doc.setTextColor(15, 23, 42);
    const truncatedName = p.productName.length > 32 ? p.productName.slice(0, 32) + '...' : p.productName;
    doc.text(truncatedName, margin + 7, prodY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(16, 185, 129);
    doc.text(`${p.totalQuantitySold} pcs · ${formatRupiah(p.totalRevenue)}`, margin + halfW - 3, prodY, {
      align: 'right',
    });

    prodY += 6;
  });

  // Right Box: Top Returned
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + halfW + 4, y, halfW, prodListH, 1.5, 1.5, 'FD');

  let retY = y + 4;
  productAnalytics.topReturned.slice(0, 5).forEach((p, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(239, 68, 68);
    doc.text(`${idx + 1}.`, margin + halfW + 7, retY);

    doc.setTextColor(15, 23, 42);
    const truncatedName = p.productName.length > 28 ? p.productName.slice(0, 28) + '...' : p.productName;
    doc.text(truncatedName, margin + halfW + 11, retY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(239, 68, 68);
    doc.text(`${p.returnRate.toFixed(1)}% (${p.returnedQuantity} pcs)`, margin + contentWidth - 3, retY, {
      align: 'right',
    });

    // Subtext: reason
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    const truncatedReason = p.topReturnReason.length > 40 ? p.topReturnReason.slice(0, 40) + '...' : p.topReturnReason;
    doc.text(`Alasan: ${truncatedReason}`, margin + halfW + 11, retY + 3);

    retY += 6;
  });

  y += prodListH + 5;

  // --- 6. REKOMENDASI OPERASIONAL & FOOTER ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(234, 88, 12);
  doc.text('CATATAN & REKOMENDASI UNTUK MANAJEMEN:', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `1. Tingkat retur toko saat ini berada di angka ${analytics.returnRate.toFixed(1)}%. Fokuskan evaluasi pada produk rawan retur dan verifikasi alamat pembeli COD.`,
    margin + 3,
    y + 8.5
  );
  doc.text(
    `2. Estimasi kerugian ongkir akibat paket RTS mencapai ${formatRupiah(analytics.estimatedShippingLoss)}. Pertimbangkan penonaktifan opsi COD pada wilayah dengan kegagalan tinggi.`,
    margin + 3,
    y + 11.5
  );

  // Bottom Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Shopee Order & Return Tracker · Dokumen Resmi Laporan Manajemen Internal',
    margin,
    pageHeight - 6
  );
  doc.text('Halaman 1 / 1', pageWidth - margin, pageHeight - 6, { align: 'right' });

  // Save the document to download directly
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Laporan_Ringkasan_Shopee_Manajemen_${dateStr}.pdf`;
  doc.save(filename);
}
