import React from 'react';
import { Sun, Moon, Lock, Play, Pause, Radio, Globe, Menu } from 'lucide-react';
import { DashboardMetrics } from '../types.ts';

interface Props {
  metrics: DashboardMetrics | null;
  lang: 'en' | 'bn';
  onToggleLang: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onLock: () => void;
  onToggleAutomation: (action: 'start' | 'pause') => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<Props> = ({
  metrics,
  lang,
  onToggleLang,
  isDark,
  onToggleTheme,
  onLock,
  onToggleAutomation,
  onToggleMobileMenu,
}) => {
  const isAuto = metrics?.isAutomationActive ?? true;
  const isMeta = metrics?.isMetaConnected ?? false;

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#080c1e]/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 md:gap-8 transition-colors">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src="/src/assets/images/mosafa_brand_symbol_1794224544537.jpg"
            alt="MoSaFa AI Logo"
            className="w-8 h-8 rounded-lg object-cover shadow-sm ring-1 ring-emerald-500/30"
          />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              MoSaFa AI Auto Poster
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {lang === 'bn' ? 'ফেসবুক অটোমেশন প্ল্যাটফর্ম' : 'Personal Facebook Automation'}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Status Strip */}
      <div className="hidden lg:flex items-center gap-4 text-xs">
        {/* Automation Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <Radio className={`w-3.5 h-3.5 ${isAuto ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {isAuto
              ? lang === 'bn' ? 'অটোমেশন: সক্রিয়' : 'Automation: Active'
              : lang === 'bn' ? 'অটোমেশন: বন্ধ' : 'Automation: Paused'}
          </span>
          <button
            onClick={() => onToggleAutomation(isAuto ? 'pause' : 'start')}
            className="ml-1 text-[11px] underline text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer"
          >
            {isAuto
              ? lang === 'bn' ? 'সাময়িক বন্ধ' : 'Pause'
              : lang === 'bn' ? 'চালু করুন' : 'Start'}
          </button>
        </div>

        {/* Facebook Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <span className="font-semibold text-blue-600 dark:text-blue-400">Meta</span>
          <span className="text-slate-700 dark:text-slate-300">
            {isMeta
              ? metrics?.metaPageName || (lang === 'bn' ? 'পেজ সংযুক্ত' : 'Page Connected')
              : lang === 'bn' ? 'সিমুলেশন মোড (টেস্ট)' : 'Simulation Mode (Test)'}
          </span>
        </div>

        {/* Timezone Indicator */}
        <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
          Asia/Dhaka (GMT+6)
        </div>
      </div>

      {/* Zone 3: Quick Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Language switch */}
        <button
          onClick={onToggleLang}
          title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
        </button>

        {/* Theme switch */}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Lock Admin */}
        <button
          onClick={onLock}
          title={lang === 'bn' ? 'অ্যাডমিন লক করুন' : 'Lock Admin'}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Lock Admin"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
