import React, { useState } from 'react';
import { useAuth, PRIMARY_OWNER_EMAIL } from '../context/AuthContext';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  KeyRound,
  X,
  Mail,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
} from 'lucide-react';

interface AccessManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessManagementModal: React.FC<AccessManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    authorizedEmails,
    addAuthorizedEmail,
    removeAuthorizedEmail,
    storePin,
    updateStorePin,
    isOwner,
    profile,
  } = useAuth();

  const [newEmail, setNewEmail] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    if (!newEmail.includes('@')) {
      showToast('Format email tidak valid.', 'error');
      return;
    }
    const success = addAuthorizedEmail(newEmail);
    if (success) {
      showToast(`Email ${newEmail.trim()} berhasil didaftarkan.`);
      setNewEmail('');
    } else {
      showToast('Gagal menambahkan email.', 'error');
    }
  };

  const handleRemoveEmail = (email: string) => {
    if (email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase()) {
      showToast('Email pemilik utama tidak dapat dihapus.', 'error');
      return;
    }
    const success = removeAuthorizedEmail(email);
    if (success) {
      showToast(`Email ${email} telah dicabut hak aksesnya.`);
    }
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      showToast('PIN minimal 4 digit angka.', 'error');
      return;
    }
    const success = updateStorePin(newPin);
    if (success) {
      showToast(`PIN Toko berhasil diperbarui menjadi "${newPin.trim()}".`);
      setNewPin('');
    } else {
      showToast('Gagal memperbarui PIN.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Kelola Hak Akses & Keamanan Toko</h3>
              <p className="text-[11px] text-slate-500">
                Atur email terdaftar yang diizinkan masuk dan kelola PIN toko
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Notification banner */}
          {toast && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 animate-in fade-in ${
                toast.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          )}

          {/* SECTION 1: Registered Emails (Whitelist) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-orange-600" />
                <span>Daftar Email yang Diizinkan (Whitelist)</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                {authorizedEmails.length} Email Terdaftar
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Hanya akun Google dengan email di bawah ini yang dapat login ke dashboard toko. Orang lain akan otomatis ditolak.
            </p>

            {/* Email List */}
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white overflow-hidden">
              {authorizedEmails.map((email, idx) => {
                const isPrimary = email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();

                return (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 block truncate font-mono">
                          {email}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {isPrimary ? 'Pemilik Utama (Owner)' : 'Staf / Tim Toko'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPrimary ? (
                        <span className="text-[10px] bg-orange-50 text-orange-700 border border-orange-200 font-bold px-2 py-0.5 rounded-full">
                          Utama
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus akses email ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Email Form */}
            <form onSubmit={handleAddEmail} className="flex gap-2 pt-1">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Tambah email staf (contoh: admin@gmail.com)"
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah Email</span>
              </button>
            </form>
          </div>

          {/* SECTION 2: Store PIN Management */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-orange-600" />
                <span>Pengaturan PIN Keamanan Toko</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                PIN Saat Ini: {storePin}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              PIN ini digunakan untuk membuka akses cepat dashboard tanpa akun Google.
            </p>

            <form onSubmit={handleUpdatePin} className="space-y-3">
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Ketik PIN baru (4-10 digit angka)"
                  maxLength={10}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg pr-10 font-mono tracking-widest focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                Perbarui PIN Toko
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
