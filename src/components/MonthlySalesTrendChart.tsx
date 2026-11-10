import React, { useState, useMemo } from 'react';
import { ShopeeOrderRecord } from '../types/shopee';
import { calculateMonthlyTrends, MonthlyTrendData, formatRupiah } from '../utils/analytics';
import { exportDashboardSummaryToPdf } from '../utils/pdfExport';
import {
  TrendingUp,
  BarChart3,
  LineChart,
  Package,
  Calendar,
  Award,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  FileDown,
  FileText,
  Check,
} from 'lucide-react';
import { PaginationControls } from './PaginationControls';

interface MonthlySalesTrendChartProps {
  orders: ShopeeOrderRecord[];
  onSelectMonthFilter?: (monthKey: string) => void;
  onExportPdf?: () => void;
}

export const MonthlySalesTrendChart: React.FC<MonthlySalesTrendChartProps> = ({
  orders,
  onSelectMonthFilter,
  onExportPdf,
}) => {
  const [metricMode, setMetricMode] = useState<'revenue' | 'orders'>('revenue');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showTableDetail, setShowTableDetail] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportPdfSuccess, setExportPdfSuccess] = useState(false);

  // Pagination for breakdown table
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(5);

  const monthlyData: MonthlyTrendData[] = useMemo(() => {
    return calculateMonthlyTrends(orders);
  }, [orders]);

  const startMonthIndex = (tablePage - 1) * tablePageSize;
  const paginatedMonthlyData = monthlyData.slice(startMonthIndex, startMonthIndex + tablePageSize);

  // Find peak sales month & best return rate month
  const highlights = useMemo(() => {
    if (monthlyData.length === 0) return null;
    let peakMonth = monthlyData[0];
    let lowestReturnMonth = monthlyData[0];

    for (const m of monthlyData) {
      if (m.completedRevenue > peakMonth.completedRevenue) {
        peakMonth = m;
      }
      if (m.returnRate < lowestReturnMonth.returnRate) {
        lowestReturnMonth = m;
      }
    }

    // Latest trend comparison vs previous month
    let revenueGrowth = 0;
    if (monthlyData.length >= 2) {
      const latest = monthlyData[monthlyData.length - 1];
      const prev = monthlyData[monthlyData.length - 2];
      if (prev.completedRevenue > 0) {
        revenueGrowth = ((latest.completedRevenue - prev.completedRevenue) / prev.completedRevenue) * 100;
      }
    }

    return {
      peakMonth,
      lowestReturnMonth,
      revenueGrowth,
    };
  }, [monthlyData]);

  if (monthlyData.length === 0) {
    return null;
  }

  // Chart coordinate math
  const maxRevenue = Math.max(...monthlyData.map((d) => Math.max(d.completedRevenue, d.returnedRevenue)), 100000);
  const maxOrders = Math.max(...monthlyData.map((d) => Math.max(d.completedOrders, d.returnedOrders)), 5);
  const maxPrimaryVal = metricMode === 'revenue' ? maxRevenue : maxOrders;
  const maxRate = 50; // max return rate for right Y axis (0-50%)

  const chartHeight = 180;
  const chartWidth = 720;
  const paddingLeft = 60;
  const paddingRight = 45;
  const paddingTop = 25;
  const paddingBottom = 35;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const colWidth = innerWidth / monthlyData.length;
  const barWidth = Math.min(colWidth * 0.32, 28);

  const handleExportPdf = () => {
    try {
      setIsExportingPdf(true);
      exportDashboardSummaryToPdf(orders);
      setExportPdfSuccess(true);
      setTimeout(() => setExportPdfSuccess(false), 3000);
      onExportPdf?.();
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 tracking-tight">
              Dashboard Ringkasan Tren Bulanan
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {monthlyData.length} Bulan Periode Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbandingan omzet penjualan selesai, tingkat retur pesanan (%), dan estimasi nilai barang RTS.
          </p>
        </div>

        {/* View & Metric Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md border border-slate-200">
            <button
              onClick={() => setMetricMode('revenue')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                metricMode === 'revenue'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Omzet (Rupiah)
            </button>
            <button
              onClick={() => setMetricMode('orders')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                metricMode === 'orders'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Volume (Paket)
            </button>
          </div>

          {/* Toggle Table Detail */}
          <button
            onClick={() => setShowTableDetail(!showTableDetail)}
            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
              showTableDetail
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {showTableDetail ? 'Tutup Rincian' : 'Lihat Rincian Angka'}
          </button>

          {/* Ekspor Ringkasan ke PDF */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shadow-xs ${
              exportPdfSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
            title="Download laporan ringkasan eksekutif PDF untuk tim manajemen"
          >
            {exportPdfSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>PDF Berhasil Diunduh!</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-white" />
                <span>{isExportingPdf ? 'Menyusun PDF...' : 'Ekspor Ringkasan ke PDF'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Highlights Strip */}
      {highlights && (
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-slate-50 border border-slate-200/80 rounded-md p-2.5">
            <span className="text-slate-500 block text-[11px]">Bulan Omzet Tertinggi:</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-bold text-slate-900">{highlights.peakMonth.monthLabel}</span>
              <span className="font-mono tabular-nums text-emerald-600 font-semibold text-[11px]">
                ({formatRupiah(highlights.peakMonth.completedRevenue)})
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-md p-2.5">
            <span className="text-slate-500 block text-[11px]">Retur Terendah:</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-bold text-slate-900">{highlights.lowestReturnMonth.monthLabel}</span>
              <span className="font-mono tabular-nums text-slate-700 font-semibold text-[11px]">
                ({highlights.lowestReturnMonth.returnRate.toFixed(1)}% retur)
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-md p-2.5">
            <span className="text-slate-500 block text-[11px]">Rata-rata Nilai Pesanan:</span>
            <div className="font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {formatRupiah(
                monthlyData.reduce((sum, d) => sum + d.completedRevenue, 0) /
                  Math.max(1, monthlyData.reduce((sum, d) => sum + d.completedOrders, 0))
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-md p-2.5">
            <span className="text-slate-500 block text-[11px]">Total Omzet Periode Ini:</span>
            <div className="font-bold text-emerald-700 font-mono tabular-nums mt-0.5">
              {formatRupiah(monthlyData.reduce((sum, d) => sum + d.completedRevenue, 0))}
            </div>
          </div>
        </div>
      )}

      {/* SVG Chart Graphic */}
      <div className="relative border border-slate-200/90 rounded-lg p-3 bg-white overflow-hidden">
        {/* Chart Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-2 px-1">
          <div className="flex items-center gap-4 text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
              <span>{metricMode === 'revenue' ? 'Omzet Selesai' : 'Pesanan Selesai'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-red-400 inline-block" />
              <span>{metricMode === 'revenue' ? 'Nilai Retur/RTS' : 'Pesanan Retur/Gagal'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-orange-600 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-600 inline-block -ml-2" />
              <span>Rasio Retur (% Line)</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Arahkan kursor ke grafik untuk detail
          </span>
        </div>

        {/* Responsive SVG */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto min-w-[440px] sm:min-w-0 overflow-visible select-none"
          >
            {/* Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = paddingTop + innerHeight * (1 - ratio);
              const labelVal = maxPrimaryVal * ratio;
              const formattedLabel =
                metricMode === 'revenue'
                  ? ratio === 0
                    ? 'Rp 0'
                    : `Rp ${(labelVal / 1000000).toFixed(1)}Jt`
                  : Math.round(labelVal).toString();

              return (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray={ratio === 0 ? 'none' : '3 3'}
                    strokeWidth={ratio === 0 ? '1.5' : '1'}
                  />
                  {/* Left Y Axis Label */}
                  <text
                    x={paddingLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {formattedLabel}
                  </text>
                  {/* Right Y Axis Label (% return) */}
                  <text
                    x={chartWidth - paddingRight + 8}
                    y={y + 3.5}
                    textAnchor="start"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {Math.round(maxRate * ratio)}%
                  </text>
                </g>
              );
            })}

            {/* Bars for each Month */}
            {monthlyData.map((d, idx) => {
              const xCenter = paddingLeft + idx * colWidth + colWidth / 2;
              const completedVal = metricMode === 'revenue' ? d.completedRevenue : d.completedOrders;
              const returnVal = metricMode === 'revenue' ? d.returnedRevenue : d.returnedOrders;

              const completedHeight = (completedVal / maxPrimaryVal) * innerHeight;
              const returnHeight = (returnVal / maxPrimaryVal) * innerHeight;

              const xBarCompleted = xCenter - barWidth - 1;
              const xBarReturn = xCenter + 1;

              const isHovered = hoveredIndex === idx;

              return (
                <g
                  key={d.monthKey}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSelectMonthFilter?.(d.monthKey)}
                >
                  {/* Hover background highlight */}
                  {isHovered && (
                    <rect
                      x={xCenter - colWidth / 2 + 4}
                      y={paddingTop}
                      width={colWidth - 8}
                      height={innerHeight}
                      fill="#F8FAFC"
                      rx={4}
                    />
                  )}

                  {/* Completed Bar */}
                  <rect
                    x={xBarCompleted}
                    y={paddingTop + innerHeight - completedHeight}
                    width={barWidth}
                    height={Math.max(completedHeight, 2)}
                    rx={3}
                    fill={isHovered ? '#10B981' : '#34D399'}
                    className="transition-colors"
                  />

                  {/* Return Bar */}
                  <rect
                    x={xBarReturn}
                    y={paddingTop + innerHeight - returnHeight}
                    width={barWidth}
                    height={Math.max(returnHeight, 2)}
                    rx={3}
                    fill={isHovered ? '#EF4444' : '#F87171'}
                    className="transition-colors"
                  />

                  {/* Month X Axis Label */}
                  <text
                    x={xCenter}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    className={`text-[11px] font-medium transition-colors ${
                      isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-600'
                    }`}
                  >
                    {d.monthLabel}
                  </text>
                </g>
              );
            })}

            {/* Return Rate Line Chart Overlay */}
            {monthlyData.length > 1 && (
              <path
                d={monthlyData
                  .map((d, idx) => {
                    const x = paddingLeft + idx * colWidth + colWidth / 2;
                    const clampedRate = Math.min(Math.max(d.returnRate, 0), maxRate);
                    const y = paddingTop + innerHeight * (1 - clampedRate / maxRate);
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#EA580C"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Line Dots */}
            {monthlyData.map((d, idx) => {
              const x = paddingLeft + idx * colWidth + colWidth / 2;
              const clampedRate = Math.min(Math.max(d.returnRate, 0), maxRate);
              const y = paddingTop + innerHeight * (1 - clampedRate / maxRate);
              const isHovered = hoveredIndex === idx;

              return (
                <circle
                  key={d.monthKey}
                  cx={x}
                  cy={y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#EA580C"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all"
                />
              );
            })}
          </svg>
        </div>

        {/* Hover Tooltip Box */}
        {hoveredIndex !== null && monthlyData[hoveredIndex] && (
          <div className="mt-3 p-3 bg-slate-900 text-white rounded-md text-xs space-y-1.5 shadow-md max-w-sm">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-1">
              <span className="font-bold text-orange-400">
                {monthlyData[hoveredIndex].fullMonthLabel}
              </span>
              <span className="font-mono tabular-nums text-slate-300">
                {monthlyData[hoveredIndex].totalOrders} Total Pesanan
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-0.5">
              <div>
                <span className="text-slate-400 block text-[11px]">Omzet Selesai:</span>
                <span className="font-mono tabular-nums font-semibold text-emerald-400">
                  {formatRupiah(monthlyData[hoveredIndex].completedRevenue)}
                </span>
                <span className="text-slate-400 text-[11px] block">
                  ({monthlyData[hoveredIndex].completedOrders} paket)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Nilai Retur & Gagal:</span>
                <span className="font-mono tabular-nums font-semibold text-red-400">
                  {formatRupiah(monthlyData[hoveredIndex].returnedRevenue)}
                </span>
                <span className="text-slate-400 text-[11px] block">
                  ({monthlyData[hoveredIndex].returnedOrders} paket)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Rasio Retur:</span>
                <span className="font-mono tabular-nums font-semibold text-orange-300">
                  {monthlyData[hoveredIndex].returnRate.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Rugi Ongkir RTS:</span>
                <span className="font-mono tabular-nums font-semibold text-amber-300">
                  {formatRupiah(monthlyData[hoveredIndex].estimatedShippingLoss)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Tabular Breakdown */}
      {showTableDetail && (
        <div className="border border-slate-200 rounded-md overflow-hidden animate-in fade-in duration-150">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
            Tabel Rekapitulasi Tren Bulanan
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="py-2 px-3">Bulan Periode</th>
                  <th className="py-2 px-3 text-right">Total Pesanan</th>
                  <th className="py-2 px-3 text-right">Pesanan Selesai</th>
                  <th className="py-2 px-3 text-right">Retur / Batal</th>
                  <th className="py-2 px-3 text-right">Rasio Retur</th>
                  <th className="py-2 px-3 text-right">Omzet Berhasil</th>
                  <th className="py-2 px-3 text-right">Nilai Retur</th>
                  <th className="py-2 px-3 text-right">Est. Rugi Ongkir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMonthlyData.map((m) => (
                  <tr key={m.monthKey} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900">{m.fullMonthLabel}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">{m.totalOrders}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700 font-medium">
                      {m.completedOrders}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-red-600 font-medium">
                      {m.returnedOrders}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold">
                      {m.returnRate.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatRupiah(m.completedRevenue)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-red-600">
                      {formatRupiah(m.returnedRevenue)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-amber-700">
                      {formatRupiah(m.estimatedShippingLoss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {monthlyData.length > 0 && (
            <PaginationControls
              currentPage={tablePage}
              totalItems={monthlyData.length}
              pageSize={tablePageSize}
              onPageChange={setTablePage}
              onPageSizeChange={setTablePageSize}
              pageSizeOptions={[5, 10, 12, 24]}
              itemLabel="bulan periode"
            />
          )}
        </div>
      )}
    </div>
  );
};
