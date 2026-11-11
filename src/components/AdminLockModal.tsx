import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { api } from '../services/api.ts';

interface Props {
  isOpen: boolean;
  onSuccess: () => void;
  lang: 'en' | 'bn';
}

export const AdminLockModal: React.FC<Props> = ({ isOpen, onSuccess, lang }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.verifyPin(pin);
      if (res.authorized) {
        onSuccess();
      } else {
        setError(lang === 'bn' ? 'ভুল পিন কোড! ডিফল্ট পিন: 1234' : 'Incorrect PIN! Default PIN: 1234');
      }
    } catch {
      setError(lang === 'bn' ? 'সার্ভার সংযোগ সমস্যা' : 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 transition-all">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'অ্যাডমিন নিরাপত্তা পিন' : 'Admin Security Access'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
            {lang === 'bn'
              ? 'এটি একটি ব্যক্তিগত প্ল্যাটফর্ম। কাজ শুরু করতে আপনার সিক্রেট পিন দিন।'
              : 'Private administrator access. Enter your secure PIN to continue.'}
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="PIN (Default: 1234)"
                autoFocus
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-center text-xl tracking-widest font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-rose-500 dark:text-rose-400">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !pin}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {loading ? (lang === 'bn' ? 'যাচাই হচ্ছে...' : 'Verifying...') : (lang === 'bn' ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'Unlock Dashboard')}
            </button>
          </form>

          <div className="mt-6 text-xs text-slate-400">
            {lang === 'bn' ? 'ডিফল্ট অ্যাডমিন পিন: 1234 (সেটিংস থেকে পরিবর্তনযোগ্য)' : 'Default PIN: 1234 (Configurable in Settings)'}
          </div>
        </div>
      </div>
    </div>
  );
};
