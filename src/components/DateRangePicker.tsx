import React, { useState } from 'react';
import { Calendar, ChevronDown, RotateCcw, Filter, Check, Clock } from 'lucide-react';

export interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onDateRangeChange: (start: string, end: string, presetLabel?: string) => void;
  onResetDateRange: () => void;
  filteredCount: number;
  totalCount: number;
}

export type DatePresetKey = 'all' | 'today' | 'last_7' | 'last_30' | 'this_month' | 'last_month' | 'custom';

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
  onResetDateRange,
  filteredCount,
  totalCount,
}) => {
  const [activePreset, setActivePreset] = useState<DatePresetKey>(
    !startDate && !endDate ? 'all' : 'custom'
  );
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  // Helper to format date to YYYY-MM-DD in local time
  const formatYmd = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleApplyPreset = (preset: DatePresetKey) => {
    setActivePreset(preset);
    setIsCustomOpen(false);

    const now = new Date();

    if (preset === 'all') {
      onResetDateRange();
      return;
    }

    if (preset === 'today') {
      const todayStr = formatYmd(now);
      onDateRangeChange(todayStr, todayStr, 'Hari Ini');
      return;
    }

    if (preset === 'last_7') {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      onDateRangeChange(formatYmd(past), formatYmd(now), '7 Hari Terakhir');
      return;
    }

    if (preset === 'last_30') {
      const past = new Date(now);
      past.setDate(past.getDate() - 29);
      onDateRangeChange(formatYmd(past), formatYmd(now), '30 Hari Terakhir');
      return;
    }

    if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      onDateRangeChange(formatYmd(start), formatYmd(now), 'Bulan Ini');
      return;
    }

    if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      onDateRangeChange(formatYmd(start), formatYmd(end), 'Bulan Lalu');
      return;
    }

    if (preset === 'custom') {
      setIsCustomOpen(true);
    }
  };

  const handleApplyCustom = () => {
    if (tempStart && tempEnd && tempStart > tempEnd) {
      alert('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.');
      return;
    }
    setActivePreset('custom');
    setIsCustomOpen(false);
    onDateRangeChange(tempStart, tempEnd, 'Periode Kustom');
  };

  const isFiltered = Boolean(startDate || endDate);

  // Human friendly label
  const getPeriodLabel = () => {
    if (!startDate && !endDate) return 'Semua Periode Data';
    if (startDate === endDate) return `Hari: ${startDate}`;
    if (startDate && endDate) return `${startDate} s/d ${endDate}`;
    if (startDate) return `Mulai ${startDate}`;
    return `Sampai ${endDate}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-xs space-y-3">
      {/* Top Bar: Title & Active Scope */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Filter Rentang Tanggal Analisis
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-mono tabular-nums text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {getPeriodLabel()}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Batasi seluruh ringkasan KPI, tren penjualan, dan analisis produk berdasarkan periode waktu pesanan.
            </p>
          </div>
        </div>

        {/* Status Count Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="text-xs font-mono tabular-nums text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <strong>{filteredCount}</strong> dari {totalCount} pesanan{' '}
            {totalCount > 0 && (
              <span className="text-slate-400 font-normal">
                ({Math.round((filteredCount / totalCount) * 100)}%)
              </span>
            )}
          </span>
          {isFiltered && (
            <button
              onClick={() => {
                setActivePreset('all');
                setIsCustomOpen(false);
                setTempStart('');
                setTempEnd('');
                onResetDateRange();
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 underline flex items-center gap-1 transition-colors"
              title="Reset ke semua waktu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Chips & Custom Date Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {[
          { key: 'all' as DatePresetKey, label: 'Semua Periode' },
          { key: 'today' as DatePresetKey, label: 'Hari Ini' },
          { key: 'last_7' as DatePresetKey, label: '7 Hari Terakhir' },
          { key: 'last_30' as DatePresetKey, label: '30 Hari Terakhir' },
          { key: 'this_month' as DatePresetKey, label: 'Bulan Ini' },
          { key: 'last_month' as DatePresetKey, label: 'Bulan Lalu' },
          { key: 'custom' as DatePresetKey, label: 'Pilih Tanggal Kustom...' },
        ].map((item) => {
          const isSelected = activePreset === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleApplyPreset(item.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-orange-400 shrink-0" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Date Input Drawer */}
      {isCustomOpen && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 animate-in fade-in duration-150 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Mulai:</span>
            <input
              type="date"
              value={tempStart}
              onChange={(e) => setTempStart(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs font-mono tabular-nums text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Sampai:</span>
            <input
              type="date"
              value={tempEnd}
              onChange={(e) => setTempEnd(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs font-mono tabular-nums text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <button
            onClick={handleApplyCustom}
            disabled={!tempStart && !tempEnd}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-md text-xs transition-colors shadow-xs disabled:opacity-40"
          >
            Terapkan Filter Tanggal
          </button>
          <button
            onClick={() => setIsCustomOpen(false)}
            className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
};
