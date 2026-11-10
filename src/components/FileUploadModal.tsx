import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, Check, AlertCircle, Sparkles } from 'lucide-react';
import { parseShopeeFile } from '../utils/shopeeParser';
import { ShopeeOrderRecord } from '../types/shopee';
import { SAMPLE_SHOPEE_ORDERS } from '../utils/sampleData';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportOrders: (imported: ShopeeOrderRecord[], sourceFileName: string, replaceExisting: boolean) => void;
  onLoadSampleData: () => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onImportOrders,
  onLoadSampleData,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setErrorMsg(null);
    setSuccessInfo(null);
    setProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseShopeeFile(buffer, file.name);

      if (result.orders.length === 0) {
        setErrorMsg(
          `Tidak dapat membaca data pesanan dari "${file.name}". Pastikan file berformat Excel (.xlsx/.xls) atau CSV dari Shopee Seller Centre dengan kolom 'No. Pesanan'.`
        );
        setProcessing(false);
        return;
      }

      onImportOrders(result.orders, file.name, importMode === 'replace');
      setSuccessInfo(
        `Berhasil memproses ${result.orders.length} pesanan (${result.rowCount} baris produk) dari file ${file.name}.`
      );
      setTimeout(() => {
        onClose();
        setSuccessInfo(null);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Gagal membaca file: ${err.message || 'Format tidak didukung'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-xl w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Upload Laporan Shopee Seller Centre
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Mendukung file Excel (.xlsx / .xls) dan CSV laporan pesanan berkala serta laporan pengembalian/retur.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-orange-500 bg-orange-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            {processing ? (
              <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          <div className="text-sm font-semibold text-slate-900 mb-1">
            {processing ? 'Sedang Memproses File...' : 'Klik untuk memilih atau seret file ke sini'}
          </div>
          <div className="text-xs text-slate-500">
            File Excel (.xlsx) atau CSV dari Seller Centre (Pesanan / Retur)
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs">
          <span className="font-semibold text-slate-800 block mb-2">Pilihan Data Sebelumnya:</span>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="text-orange-600 focus:ring-orange-500"
              />
              <span className="font-medium text-slate-900">
                Ganti Data Sebelumnya (Hanya tampilkan data dari file ini) - <span className="text-emerald-600 font-semibold">Disarankan</span>
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="text-orange-600 focus:ring-orange-500"
              />
              <span className="text-slate-600">
                Gabungkan (Merge) dengan data riwayat yang sudah ada
              </span>
            </label>
          </div>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successInfo && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-start gap-2 text-xs text-emerald-700">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* Quick Instructions & Sample Data Button */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-left">
            <span className="font-semibold block text-slate-700">Cara Unduh dari Seller Centre:</span>
            <span>1. Pesanan Saya &rarr; Export Data &rarr; Unduh Excel</span>
          </div>

          <button
            onClick={() => {
              onLoadSampleData();
              onClose();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md transition-colors shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Muat Contoh Data Shopee</span>
          </button>
        </div>
      </div>
    </div>
  );
};
