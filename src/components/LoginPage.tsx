import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  KeyRound,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Store,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, loginWithPin, authError, clearError } = useAuth();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);

  const handleGoogleSubmit = async () => {
    setIsSubmittingGoogle(true);
    clearError();
    try {
      await loginWithGoogle();
    } catch {
      // Handled in context
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!pin) return;
    loginWithPin(pin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-red-500 text-white shadow-lg shadow-orange-600/30 mb-3">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ShopeeTracker</h1>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-100">
          {/* Error / Rejection Notice */}
          {authError && (
            <div
              className={`mb-4 p-3 rounded-lg text-xs flex items-start justify-between gap-2 animate-in fade-in ${
                authError.includes('ditutup')
                  ? 'bg-amber-50 border border-amber-200 text-amber-900'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              <div className="flex items-start gap-2 min-w-0">
                <AlertCircle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    authError.includes('ditutup') ? 'text-amber-600' : 'text-red-600'
                  }`}
                />
                <span className="font-medium">{authError}</span>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-1 rounded cursor-pointer leading-none"
                title="Tutup pesan"
              >
                &times;
              </button>
            </div>
          )}

          {/* Option 1: Firebase Google Authentication */}
          <div>
            <button
              onClick={handleGoogleSubmit}
              disabled={isSubmittingGoogle}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
            >
              {/* Google G Logo SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSubmittingGoogle ? 'Memverifikasi Akun Google...' : 'Masuk dengan Akun Google'}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <span className="bg-white px-3">Atau Masuk dengan PIN</span>
            </div>
          </div>

          {/* Option 2: Store PIN Form */}
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Ketik PIN Toko"
                  maxLength={10}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-orange-600/30 transition-all cursor-pointer"
            >
              <span>Buka Dashboard Toko</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Outer Footer */}
        <div className="text-center mt-6 text-xs text-slate-500">
          Shopee Order & Return Tracker · Proteksi Arsip Seller Centre
        </div>
      </div>
    </div>
  );
};
