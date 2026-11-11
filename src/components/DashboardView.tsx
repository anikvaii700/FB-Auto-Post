import React, { useState } from 'react';
import {
  Play,
  Pause,
  Sparkles,
  Send,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  Share2,
  ArrowRight,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { Category, DashboardMetrics, PostItem, SystemLog } from '../types.ts';
import { translations } from '../translations.ts';

interface Props {
  metrics: DashboardMetrics | null;
  categories: Category[];
  recentPosts: PostItem[];
  logs: SystemLog[];
  lang: 'en' | 'bn';
  onNavigate: (tab: any) => void;
  onToggleAutomation: (action: 'start' | 'pause' | 'resume' | 'stop') => void;
  onPublishNow: (id: string) => void;
  onClearQueue: () => void;
  onGenerateQuick: () => void;
  onRefresh: () => void;
  isActionLoading?: boolean;
}

export const DashboardView: React.FC<Props> = ({
  metrics,
  categories,
  recentPosts,
  logs,
  lang,
  onNavigate,
  onToggleAutomation,
  onPublishNow,
  onClearQueue,
  onGenerateQuick,
  onRefresh,
  isActionLoading = false,
}) => {
  const t = translations[lang];
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const isAuto = metrics?.isAutomationActive ?? true;
  const nextPost = metrics?.nextScheduledPost;

  return (
    <div className="space-y-6">
      {/* 1. Control Center Action Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {lang === 'bn' ? 'কন্ট্রোল সেন্টার ও অটোমেশন' : 'Automation Control Center'}
              </h1>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isAuto
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {isAuto ? t.automationActive : t.automationPaused}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'ফেসবুক পেজ অটোমেশন, জেমিনি এআই কন্টেন্ট ইঞ্জিন এবং ব্যাকএন্ড শিডিউলার নিয়ন্ত্রণ করুন।'
                : 'Manage Facebook page automation, Gemini AI generation engine, and server background scheduler.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isAuto ? (
              <button
                onClick={() => onToggleAutomation('pause')}
                disabled={isActionLoading}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>{t.pauseAutomation}</span>
              </button>
            ) : (
              <button
                onClick={() => onToggleAutomation('start')}
                disabled={isActionLoading}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{t.startAutomation}</span>
              </button>
            )}

            <button
              onClick={onGenerateQuick}
              disabled={isActionLoading}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.generateNow}</span>
            </button>

            {nextPost && (
              <button
                onClick={() => onPublishNow(nextPost.id)}
                disabled={isActionLoading}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'পরবর্তী পোস্ট প্রকাশ করুন' : 'Publish Next Now'}</span>
              </button>
            )}

            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={isActionLoading}
              className="px-3 py-2 text-xs font-medium rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Clear Pending Queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.clearQueue}</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isActionLoading}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isActionLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Clear Queue Confirmation Dialog */}
      {showClearConfirm && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'bn'
                ? 'আপনি কি নিশ্চিত যে কিউ-তে থাকা সমস্ত অপেক্ষমাণ ও শিডিউলকৃত পোস্ট মুছে ফেলতে চান?'
                : 'Are you sure you want to clear all pending and scheduled posts in the queue?'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                onClearQueue();
                setShowClearConfirm(false);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
            >
              {lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Clear All'}
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg cursor-pointer"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* User 3 Core Tasks Guided Navigation Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Task 1: Batch Photo Poster */}
        <div
          onClick={() => onNavigate('batchPhotoPoster')}
          className="group p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-transparent border border-cyan-500/30 dark:border-cyan-500/20 hover:border-cyan-500 cursor-pointer transition-all shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-sm">
              ১
            </span>
            <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
              ছবি ও ক্যাপশন <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            {lang === 'bn' ? 'ছবি দিয়ে ক্যাপশন ও শিডিউল' : 'Batch Photo Caption & Schedule'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {lang === 'bn'
              ? '১০-২০টি ছবি একসাথে দিন। AI মিলিয়ে ছোট ক্যাপশন লিখবে এবং আপনার দেওয়া টাইমে স্বয়ংক্রিয় পোস্ট করবে।'
              : 'Upload multiple photos. AI writes matching captions and auto-publishes on your schedule.'}
          </p>
        </div>

        {/* Task 2: AI Command Center */}
        <div
          onClick={() => onNavigate('commandCenter')}
          className="group p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 dark:border-emerald-500/20 hover:border-emerald-500 cursor-pointer transition-all shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              ২
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
              নির্দেশনা দিয়ে স্ট্যাটাস <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {lang === 'bn' ? 'এআই কমান্ড সেন্টার' : 'AI Command Center'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {lang === 'bn'
              ? 'আপনি যে নির্দেশনা দেবেন (যেমন: সবর নিয়ে ৩টি স্ট্যাটাস লিখো), AI সাথে সাথে সেই অনুযায়ী নিখুঁত স্ট্যাটাস বানাবে।'
              : 'Give custom instructions in Bengali or English; AI generates tailored structured statuses.'}
          </p>
        </div>

        {/* Task 3: Smart Comment Auto-Reply */}
        <div
          onClick={() => onNavigate('commentBot')}
          className="group p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-500/30 dark:border-purple-500/20 hover:border-purple-500 cursor-pointer transition-all shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
              ৩
            </span>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
              স্বয়ংক্রিয় রিপ্লে <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {lang === 'bn' ? 'কমেন্ট অটো-রিপ্লাই ইঞ্জিন' : 'AI Comment Auto-Reply Bot'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {lang === 'bn'
              ? 'সালাম, মাশাআল্লাহ, দোয়া বা প্রশ্নের ধরন বুঝে মিষ্টি ও মার্জিত বাংলায় সাথে সাথে কমেন্টের রিপ্লে দিবে।'
              : 'Detects intent (salams, duas, praises, questions) and sends context-aware replies.'}
          </p>
        </div>
      </div>

      {/* 2. Key Metrics Strip (Tabular Figures) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Generated */}
        <div className="bg-white/90 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-indigo-300 transition-colors">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.totalGenerated}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-800 dark:text-white">
              {metrics?.totalGenerated ?? 0}
            </span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
        </div>

        {/* Total Published */}
        <div className="bg-emerald-50/50 dark:bg-slate-900 border border-emerald-200/70 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-emerald-400 transition-colors">
          <span className="text-xs font-semibold text-emerald-700 dark:text-slate-400">{t.totalPublished}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {metrics?.totalPublished ?? 0}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* Scheduled in Queue */}
        <div className="bg-blue-50/50 dark:bg-slate-900 border border-blue-200/70 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-blue-400 transition-colors">
          <span className="text-xs font-semibold text-blue-700 dark:text-slate-400">{t.scheduled}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
              {metrics?.scheduledCount ?? 0}
            </span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        {/* Today's Count */}
        <div className="bg-purple-50/50 dark:bg-slate-900 border border-purple-200/70 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-purple-400 transition-colors">
          <span className="text-xs font-semibold text-purple-700 dark:text-slate-400">{t.todayPublished}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-purple-600 dark:text-purple-400">
              {metrics?.todayPublishedCount ?? 0}
            </span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-amber-50/50 dark:bg-slate-900 border border-amber-200/70 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-amber-400 transition-colors">
          <span className="text-xs font-semibold text-amber-700 dark:text-slate-400">{t.drafts}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {metrics?.draftCount ?? 0}
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        {/* Failed */}
        <div className="bg-rose-50/50 dark:bg-slate-900 border border-rose-200/70 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-rose-400 transition-colors">
          <span className="text-xs font-semibold text-rose-700 dark:text-slate-400">{t.failed}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {metrics?.failedCount ?? 0}
            </span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
        </div>
      </div>

      {/* 3. Next Scheduled Post & Quick Launch Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Post Spotlight */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'পরবর্তী শিডিউল পোস্টের বিবরণ' : 'Next Scheduled Post Spotlight'}
                </h2>
              </div>
              {nextPost && (
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  {new Date(nextPost.scheduledAt).toLocaleTimeString('bn-BD', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Dhaka',
                  })}{' '}
                  (Dhaka)
                </span>
              )}
            </div>

            {nextPost ? (
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                {nextPost.imageUrl && (
                  <img
                    src={nextPost.imageUrl}
                    alt="Post media"
                    className="w-full sm:w-36 h-28 object-cover rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{nextPost.categoryName}</span>
                    <span>·</span>
                    <span className="uppercase">{nextPost.language}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {nextPost.title || 'Untitled Status'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mt-1 leading-relaxed">
                    {nextPost.body}
                  </p>
                  {nextPost.hashtags && nextPost.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {nextPost.hashtags.slice(0, 4).map((tag, i) => (
                        <span key={i} className="text-[11px] text-blue-600 dark:text-blue-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400">
                <Clock className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">
                  {lang === 'bn' ? 'বর্তমানে কোনো পোস্ট শিডিউল করা নেই।' : 'No upcoming scheduled post in queue.'}
                </p>
                <button
                  onClick={onGenerateQuick}
                  className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? '+ নতুন কন্টেন্ট তৈরি করুন' : '+ Generate Content Now'}
                </button>
              </div>
            )}
          </div>

          {nextPost && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => onNavigate('queue')}
                className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>{lang === 'bn' ? 'সম্পূর্ণ কিউ দেখুন' : 'View Full Queue'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onPublishNow(nextPost.id)}
                disabled={isActionLoading}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'এখনই পোস্ট করুন' : 'Publish Right Now'}</span>
              </button>
            </div>
          )}
        </div>

        {/* AI Command Center Quick Launch Banner */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-xs border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Terminal className="w-4 h-4" />
              <span>{lang === 'bn' ? 'কাস্টম কমান্ড সেন্টার' : 'AI Command Center'}</span>
            </div>
            <h3 className="text-base font-bold leading-snug">
              {lang === 'bn'
                ? 'যেকোনো নির্দেশনায় নিমেষেই আকর্ষণীয় পোস্ট তৈরি করুন'
                : 'Turn any natural instruction into batch Facebook posts'}
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {lang === 'bn'
                ? '"ইস্তিগফারের গুরুত্ব নিয়ে ৫টি ইমোশনাল রিমাইন্ডার তৈরি করো" — এমন যেকোনো কমান্ড দিন, এআই বাকিটা সামলে নেবে।'
                : 'e.g. "Create 5 emotional Islamic reminders about Istighfar with authentic references" — AI writes & formats everything.'}
            </p>
          </div>

          <div className="mt-5">
            <button
              onClick={() => onNavigate('commandCenter')}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{lang === 'bn' ? 'কমান্ড সেন্টারে যান' : 'Open AI Command Center'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Real-time System Logs & Active Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Categories Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'সক্রিয় কন্টেন্ট ক্যাটাগরি' : 'Active Content Categories'}
            </h2>
            <button
              onClick={() => onNavigate('categories')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {lang === 'bn' ? 'সব দেখুন' : 'Manage'}
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
            {categories.slice(0, 6).map((cat) => (
              <div key={cat.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || '#059669' }}
                  />
                  <div className="truncate">
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                      {lang === 'bn' ? cat.nameBn || cat.name : cat.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {cat.dailyPosts} {lang === 'bn' ? 'পোস্ট/দিন' : 'posts/day'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {cat.scheduleTimes.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'সাম্প্রতিক সিস্টেম ও পাবলিশিং লগ' : 'Recent System & Publishing Activity'}
            </h2>
            <span className="text-xs text-slate-400 font-mono">{logs.length} logs</span>
          </div>

          <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-slate-400 text-center py-6 text-xs">No activity logged yet.</p>
            ) : (
              logs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        log.level === 'success'
                          ? 'bg-emerald-500'
                          : log.level === 'error'
                          ? 'bg-rose-500'
                          : log.level === 'warn'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-slate-800 dark:text-slate-200 text-xs break-words">{log.message}</p>
                      {log.details && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
