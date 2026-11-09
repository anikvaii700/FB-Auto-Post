import React from 'react';
import {
  LayoutDashboard,
  Terminal,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Clock,
  Calendar,
  History,
  Share2,
  Settings,
  X,
  Radio,
  Power,
} from 'lucide-react';
import { translations } from '../translations.ts';

export type NavTab =
  | 'dashboard'
  | 'commandCenter'
  | 'contentGenerator'
  | 'categories'
  | 'imageLibrary'
  | 'queue'
  | 'calendar'
  | 'history'
  | 'facebook'
  | 'settings';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lang: 'en' | 'bn';
  mobileOpen: boolean;
  onCloseMobile: () => void;
  pendingCount?: number;
  failedCount?: number;
  isAutomationActive?: boolean;
  onToggleAutomation?: (action: 'start' | 'pause') => void;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  lang,
  mobileOpen,
  onCloseMobile,
  pendingCount = 0,
  failedCount = 0,
  isAutomationActive = true,
  onToggleAutomation,
}) => {
  const t = translations[lang];

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'commandCenter', label: t.commandCenter, icon: <Terminal className="w-4 h-4 text-emerald-500" /> },
    { id: 'contentGenerator', label: t.contentGenerator, icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
    { id: 'categories', label: t.categories, icon: <Layers className="w-4 h-4" /> },
    { id: 'imageLibrary', label: t.imageLibrary, icon: <ImageIcon className="w-4 h-4" /> },
    {
      id: 'queue',
      label: t.publishingQueue,
      icon: <Clock className="w-4 h-4" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    { id: 'calendar', label: t.contentCalendar, icon: <Calendar className="w-4 h-4" /> },
    { id: 'history', label: t.publishedHistory, icon: <History className="w-4 h-4" /> },
    {
      id: 'facebook',
      label: t.facebookConnection,
      icon: <Share2 className="w-4 h-4 text-blue-500" />,
      badge: failedCount > 0 ? failedCount : undefined,
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    { id: 'settings', label: t.settings, icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 md:top-16 z-40 h-full md:h-[calc(100vh-4rem)] w-64 md:w-60 bg-white/95 dark:bg-[#090d23]/85 backdrop-blur-md border-r border-slate-200 dark:border-white/10 flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-2">
          {/* Mobile close button */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800 md:hidden">
            <span className="text-sm font-bold text-slate-900 dark:text-white">MoSaFa Auto Poster</span>
            <button onClick={onCloseMobile} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 whitespace-nowrap truncate">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-full ${
                        active ? 'bg-white/20 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Engine Controller Card */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Radio className={`w-3.5 h-3.5 ${isAutomationActive ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                {lang === 'bn' ? 'অটোমেশন স্ট্যাটাস' : 'Engine Worker'}
              </span>
              <span
                className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm ${
                  isAutomationActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {isAutomationActive ? (lang === 'bn' ? 'সক্রিয়' : 'ACTIVE') : (lang === 'bn' ? 'স্থগিত' : 'PAUSED')}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {lang === 'bn'
                ? 'ব্রাউজার বন্ধ থাকলেও ব্যাকএন্ড শিডিউলার নিজে নিজেই ফেসবুক পেজে পোস্ট করবে।'
                : 'Runs independently in background even if your browser is closed.'}
            </p>

            {onToggleAutomation && (
              <button
                onClick={() => onToggleAutomation(isAutomationActive ? 'pause' : 'start')}
                className={`w-full py-1.5 px-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  isAutomationActive
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>
                  {isAutomationActive
                    ? lang === 'bn' ? 'অটোমেশন সাময়িক বন্ধ' : 'Pause Automation'
                    : lang === 'bn' ? 'অটোমেশন চালু করুন' : 'Start Automation'}
                </span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
