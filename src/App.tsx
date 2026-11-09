import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { CommandCenterView } from './components/CommandCenterView.tsx';
import { ContentGeneratorView } from './components/ContentGeneratorView.tsx';
import { CategoriesView } from './components/CategoriesView.tsx';
import { ImageLibraryView } from './components/ImageLibraryView.tsx';
import { QueueView } from './components/QueueView.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { FacebookConnectView } from './components/FacebookConnectView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { AdminLockModal } from './components/AdminLockModal.tsx';
import { api } from './services/api.ts';
import {
  AdminSettings,
  Category,
  CommandHistoryItem,
  DashboardMetrics,
  LibraryImage,
  PostItem,
  SystemLog,
} from './types.ts';

export default function App() {
  // Theme & Language
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('mosafa_theme') === 'dark' || true;
  });
  const [lang, setLang] = useState<'en' | 'bn'>(() => {
    return (localStorage.getItem('mosafa_lang') as 'en' | 'bn') || 'bn';
  });

  // Admin Security Lock
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return sessionStorage.getItem('mosafa_unlocked') !== 'true';
  });

  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // App Data State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [commands, setCommands] = useState<CommandHistoryItem[]>([]);
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [globalToast, setGlobalToast] = useState<{
    type: 'success' | 'warn' | 'error';
    message: string;
    link?: string;
  } | null>(null);

  // Sync theme to <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mosafa_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mosafa_theme', 'light');
    }
  }, [isDark]);

  // Sync language
  const handleToggleLang = () => {
    const next = lang === 'bn' ? 'en' : 'bn';
    setLang(next);
    localStorage.setItem('mosafa_lang', next);
  };

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleUnlock = () => {
    setIsLocked(false);
    sessionStorage.setItem('mosafa_unlocked', 'true');
  };

  const handleLock = () => {
    setIsLocked(true);
    sessionStorage.removeItem('mosafa_unlocked');
  };

  // Data Fetching
  const refreshData = useCallback(async () => {
    try {
      const [statusRes, catRes, postsRes, cmdRes, imgRes, logsRes, setRes] = await Promise.all([
        api.getStatus(),
        api.getCategories(),
        api.getPosts(),
        api.getCommands(),
        api.getImages(),
        api.getLogs(),
        api.getSettings(),
      ]);

      if (statusRes.success) setMetrics(statusRes.metrics);
      if (catRes.success) setCategories(catRes.categories);
      if (postsRes.success) setPosts(postsRes.posts);
      if (cmdRes.success) setCommands(cmdRes.commands);
      if (imgRes.success) setImages(imgRes.images);
      if (logsRes.success) setLogs(logsRes.logs);
      if (setRes.success) setSettings(setRes.settings);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
    // Poll updates every 20 seconds
    const interval = setInterval(refreshData, 20000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Main Actions
  const handleToggleAutomation = async (action: 'start' | 'pause' | 'resume' | 'stop') => {
    setActionLoading(true);
    try {
      await api.toggleAutomation(action);
      await refreshData();
    } catch (err: any) {
      alert(`Action error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishNow = async (id: string) => {
    setActionLoading(true);
    setGlobalToast(null);
    try {
      const res = await api.publishPostNow(id);
      if (res.success) {
        if (res.isSimulated) {
          setGlobalToast({
            type: 'warn',
            message: lang === 'bn'
              ? '⚠️ এটি টেস্ট সিমুলেশন মোডে হয়েছে (আসল পেজে পোস্ট হয়নি)। লাইভ ফেসবুক পেজে পোস্ট করতে বামের "ফেসবুক কানেকশন" পেজে গিয়ে "সংযোগ পরীক্ষা করুন" ও "সেভ করুন" বাটনে চাপ দিয়ে টোকেন সেভ নিশ্চিত করুন।'
              : '⚠️ Published in Simulation Mode. Live Facebook page credentials not active. Please visit Facebook Connection to save credentials.',
          });
        } else {
          setGlobalToast({
            type: 'success',
            message: lang === 'bn'
              ? '🎉 আলহামদুলিল্লাহ! আপনার ফেসবুক পেজে সরাসরি লাইভ পোস্ট প্রকাশিত হয়েছে!'
              : '🎉 Success! Post published live to your Facebook Page!',
            link: res.permalink,
          });
        }
        await refreshData();
      } else {
        setGlobalToast({
          type: 'error',
          message: `${lang === 'bn' ? 'পোস্ট করতে সমস্যা হয়েছে:' : 'Failed to publish:'} ${res.error}`,
        });
      }
    } catch (err: any) {
      setGlobalToast({
        type: 'error',
        message: `${lang === 'bn' ? 'ত্রুটি:' : 'Error:'} ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearQueue = async () => {
    try {
      const res = await api.clearQueue();
      if (res.success) {
        setGlobalToast({
          type: 'success',
          message: lang === 'bn' ? `কিউ থেকে ${res.count}টি পোস্ট মুছে ফেলা হয়েছে।` : `Cleared ${res.count} posts from queue.`,
        });
        await refreshData();
      }
    } catch (err: any) {
      setGlobalToast({ type: 'error', message: err.message });
    }
  };

  const handleGenerateQuick = () => {
    setActiveTab('commandCenter');
  };

  return (
    <div className="min-h-screen bg-[#080c1e] bg-[url('/assets/aistudio/image_0add04d7.png')] bg-cover bg-fixed bg-center text-slate-100 flex flex-col font-sans">
      {/* Admin Lock Gate */}
      <AdminLockModal isOpen={isLocked} onSuccess={handleUnlock} lang={lang} />

      {/* Top Bar */}
      <Header
        metrics={metrics}
        lang={lang}
        onToggleLang={handleToggleLang}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onLock={handleLock}
        onToggleAutomation={handleToggleAutomation}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Global Toast Notification */}
      {globalToast && (
        <div className="fixed top-20 right-4 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex flex-col gap-2 ${
              globalToast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
                : globalToast.type === 'warn'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-100'
                : 'bg-rose-950/90 border-rose-500/50 text-rose-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium leading-relaxed">{globalToast.message}</span>
              <button
                type="button"
                onClick={() => setGlobalToast(null)}
                className="text-xs text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                ✕
              </button>
            </div>
            {globalToast.link && (
              <a
                href={globalToast.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg w-fit mt-1 shadow-xs"
              >
                <span>{lang === 'bn' ? 'ফেসবুক পোস্টটি দেখুন' : 'View Facebook Post'}</span>
                <span className="text-[10px]">↗</span>
              </a>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          lang={lang}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          pendingCount={metrics?.scheduledCount}
          failedCount={metrics?.failedCount}
          isAutomationActive={metrics?.isAutomationActive}
          onToggleAutomation={handleToggleAutomation}
        />

        {/* Main Viewport Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              categories={categories}
              recentPosts={posts}
              logs={logs}
              lang={lang}
              onNavigate={setActiveTab}
              onToggleAutomation={handleToggleAutomation}
              onPublishNow={handlePublishNow}
              onClearQueue={handleClearQueue}
              onGenerateQuick={handleGenerateQuick}
              onRefresh={refreshData}
              isActionLoading={actionLoading}
            />
          )}

          {activeTab === 'commandCenter' && (
            <CommandCenterView
              categories={categories}
              commands={commands}
              lang={lang}
              onPostsGenerated={refreshData}
              onRefreshCommands={refreshData}
            />
          )}

          {activeTab === 'contentGenerator' && (
            <ContentGeneratorView
              categories={categories}
              images={images}
              lang={lang}
              onPostCreated={refreshData}
              onPublishNow={handlePublishNow}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesView categories={categories} lang={lang} onRefresh={refreshData} />
          )}

          {activeTab === 'imageLibrary' && (
            <ImageLibraryView images={images} lang={lang} onRefresh={refreshData} />
          )}

          {activeTab === 'queue' && (
            <QueueView
              posts={posts}
              lang={lang}
              onPublishNow={handlePublishNow}
              onRefresh={refreshData}
              onClearQueue={handleClearQueue}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView posts={posts} lang={lang} onRefresh={refreshData} />
          )}

          {activeTab === 'history' && (
            <HistoryView posts={posts} lang={lang} onRefresh={refreshData} />
          )}

          {activeTab === 'facebook' && settings && (
            <FacebookConnectView settings={settings} lang={lang} onRefresh={refreshData} />
          )}

          {activeTab === 'settings' && settings && (
            <SettingsView settings={settings} lang={lang} onRefresh={refreshData} />
          )}
        </main>
      </div>
    </div>
  );
}
